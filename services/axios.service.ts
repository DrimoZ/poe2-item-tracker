import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponseHeaders } from 'axios';
import { RateLimitManager } from './rate-limit.manager';

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

    public static readonly sessionTimeout = 2 * 60 * 1000;

    // Private Properties

    private poesessid: string;
    private poesessidExpires: number;

    private readonly _rateLimitManager: RateLimitManager;

    // Life Cycle

    private constructor() {
        this._rateLimitManager = RateLimitManager.instance;

        this.poesessid = '';
        this.poesessidExpires = 0;

        this.initializeAxios();
    }
    
    private initializeAxios(): void {
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
                    config.headers['Cookie'] = `POESESSID=${this.poesessid}`;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );
        
        axiosInstance.interceptors.response.use(
            (response) => {
                if (response.headers) {
                    this._rateLimitManager.updateRateLimitsFromHeader(response.headers as AxiosResponseHeaders);

                    if (response.headers['set-cookie']) {
                        const poessid = response.headers['set-cookie'][0].split(';').find((cookie: string) => cookie.includes('POESESSID'));
                        if (poessid) {
                            const [key, value] = poessid.split('=');

                            if (!this.isSessionValid()) {
                                this.setSession(value, Date.now() + 10 * 60 * 1000);
                                console.log('Session refreshed - New session:', this.poesessid);
                            }
                        }
                    }
                }
                return response;
            },
            (error) => {
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

    public setSession(poessid: string, expires: number): void {
        this.poesessid = poessid;
        this.poesessidExpires = expires;
    }

    public isSessionValid(): boolean {
        if (!this.poesessid || !this.poesessidExpires) return false;
        if (this.poesessidExpires - AxiosService.sessionTimeout < Date.now() ) console.log('Session expired - Need to refresh');

        return this.poesessidExpires - AxiosService.sessionTimeout > Date.now();
    }
}

export { AxiosService };