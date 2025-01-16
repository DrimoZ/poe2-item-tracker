import { AxiosRequestConfig } from "axios";
import { AxiosService } from "./axios.service";
import { RateLimitManager } from "./rate-limit.manager";
import { RateLimits } from "../models/rate-limit.model";

export interface RequestResponse {
    response: any;
    metrics: {
        addedAt: number;
        startedAt: number;
        finishedAt: number;
        processTime: number;
        totalTime: number;
    };
}

class RequestsManager {
    
    // Static Instance
    
    private static _instance: RequestsManager;
    
    public static get instance(): RequestsManager {
        if (!RequestsManager._instance) {
            RequestsManager._instance = new RequestsManager();
        }
        return RequestsManager._instance;
    }
    
    // Private Properties
    
    private readonly _rateLimitManager: RateLimitManager;
    private readonly _axiosService: AxiosService;

    private readonly callQueue: {
        request: AxiosRequestConfig;
        resolve: (response: any) => void;
        reject: (error: any) => void;
        addedAt: number;
        startedAt?: number;
        finishedAt?: number;
        tryCount?: number;
    }[] = [];

    private _isRunning: boolean;
    
    // Life Cycle
    
    private constructor() {
        this._rateLimitManager = RateLimitManager.instance;
        this._axiosService = AxiosService.instance;

        this._isRunning = false;
    }
    
    // Interface (Loop)
    
    public async start(): Promise<void> {
        if (!this._isRunning) {
            this._isRunning = true;
            
            this.startLoop();
        }
    }
    
    public async stop(): Promise<void> {
        this._isRunning = false;
    }

    // Interface (Requests)

    public addRequest(request: AxiosRequestConfig): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.callQueue.push({
                request,
                resolve: (response: unknown) => {
                    resolve(response);
                },
                reject: (error: unknown) => {
                    reject(error);
                },
                addedAt: Date.now()
            });
        });
    }
    
    // Inner Work (Loop)
    
    private async startLoop(): Promise<void> {
        if (!this._isRunning) return;

        let interval = this._rateLimitManager.getReachInterval(RateLimits.IP);

        while (this._isRunning) {
            if (!this._axiosService.isSessionValid()) {
                await new Promise((resolve) => setTimeout(resolve, 10_000));
            }

            if (this.callQueue.length > 0) {
                await this.processNextRequest();
                interval = await this._rateLimitManager.getReachInterval(RateLimits.IP);

                await new Promise((resolve) => setTimeout(resolve, interval));
            } else {
                await new Promise((resolve) => setTimeout(resolve, 100));
            } 
        }
    }

    // Inner Work (Requests)

    private async processNextRequest(): Promise<void> {
        if (this.callQueue.length === 0 || !this._isRunning) return;

        const nextRequest = this.callQueue[0]; // Peek at the next request
        nextRequest.startedAt = Date.now();

        try {
            const response = await this._axiosService.request(nextRequest.request);
            nextRequest.finishedAt = Date.now();

            // Resolve the promise with response and metrics
            nextRequest.resolve({
                response,
                metrics: {
                    addedAt: nextRequest.addedAt,
                    startedAt: nextRequest.startedAt,
                    finishedAt: nextRequest.finishedAt,
                    processTime: nextRequest.finishedAt - nextRequest.startedAt,
                    totalTime: nextRequest.finishedAt - nextRequest.addedAt,
                },
            })

            this.callQueue.shift();
        } catch (error) {
            nextRequest.tryCount = nextRequest.tryCount ? nextRequest.tryCount + 1 : 1;
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, nextRequest.tryCount ?? 1) * 1000));
            console.error('Error processing request:', error);
        }
    }
}

export { RequestsManager };