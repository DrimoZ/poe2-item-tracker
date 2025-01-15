import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponseHeaders } from 'axios';
import { RateLimitManager } from './rate-limit.manager';
import { MetricsDatabaseManager } from '../databases/requests/metrics-database.manager';

interface PoESession {
    poeSessId: string;
    
    startTime: number;
    endTime: number;
    expirationTime: number;

    requestCount: number;
    errorCount: number;

    rateLimitHits: number;
    averageRequestTime: number;
}

class AxiosService {
    
    // Static Instance

    private static _instance: AxiosService;
    private static _axios: AxiosInstance;

    public static get instance(): AxiosService {
        if (!AxiosService._instance) {
            AxiosService._instance = new AxiosService();
        }
        return AxiosService._instance;
    }

    // Static Properties

    public static readonly POE_SESSION_KEY = 'POESESSID';
    public static readonly POE_SESSION_DURATION = 10 * 60 * 1000;

    // Private Properties

    private _session: PoESession;

    private readonly _rateLimitManager: RateLimitManager;
    private readonly _metricsDbManager: MetricsDatabaseManager;

    // Life Cycle

    private constructor() {
        this._rateLimitManager = RateLimitManager.instance;
        this._metricsDbManager = MetricsDatabaseManager.instance;

        this._session = this._metricsDbManager.getSession();

        this.initializeAxios();
    }
    
    private async initializeAxios(): Promise<void> {
        const axiosInstance = axios.create({
            baseURL: 'https://www.pathofexile.com',
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'OAuth drimozs-fetcher/0.0.1 (Contact: drimozbe@gmail.com)',
                'Origin': 'https://www.pathofexile.com'
                
            },
            withCredentials: true,
        });
        
        axiosInstance.interceptors.request.use(
            (config) => {
                
                if (this.isSessionValid()) {
                    config.headers['Cookie'] = `${AxiosService.POE_SESSION_KEY}=${this._session.poeSessId}`;
                    this._session.requestCount++;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );
        
        axiosInstance.interceptors.response.use(
            async (response) => {
                if (response.headers) {
                    await this._rateLimitManager.updateRateLimitsFromHeader(response.headers as AxiosResponseHeaders);

                    if (response.headers['set-cookie']) {
                        const poeSessId = response.headers['set-cookie'][0].split(';').find((cookie: string) => cookie.includes(AxiosService.POE_SESSION_KEY));
                        if (poeSessId) {
                            const [key, value] = poeSessId.split('=');
                            this._session = this._metricsDbManager.updateSession(this._session, value);
                            this._session.requestCount++;
                            console.log(`Session updated with new POE session ID: ${value}`);
                        }
                    }
                }

                // TODO : Update Average Request Time

                return response;
            },
            async (error) => {
                this._session.errorCount++;
                if (error.response) {
                    if (error.response.status === 429) {
                        this._session.rateLimitHits++;

                        const retryAfter = error.response.headers['retry-after'];
                        if (retryAfter) {
                            const retryAfterMs = parseInt(retryAfter) * 1000;
                            console.log(`Rate limit hit, retrying after ${retryAfterMs} ms...`);
                            await new Promise(resolve => setTimeout(resolve, retryAfterMs));
                        }
                    }
                }

                console.error('Error:', error);
                return Promise.reject(error);
            }
        );
        
        AxiosService._axios = axiosInstance;
    }

    // Interface (Requests)
    
    public request(config: AxiosRequestConfig): Promise<unknown> {
        return AxiosService._axios.request(config);
    }
    
    public get(url: string, config?: AxiosRequestConfig): Promise<unknown> {
        return this.request({ url, method: 'GET', ...config });
    }
    
    public post(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<unknown> {
        return this.request({ url, method: 'POST', data, ...config });
    }

    // Interface (Session)

    public isSessionValid(): boolean {
        // Session Id Check
        if (!this._session.poeSessId || this._session.poeSessId === '') {
            return false;
        }

        // End Time Check
        if (this._session.endTime > 0) {
            return false;
        }

        // Expiration Time Check
        if (this._session.expirationTime < Date.now()) {
            return false;
        }

        return true;
    }
}

export { AxiosService, PoESession };