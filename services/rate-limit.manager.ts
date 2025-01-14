import { AxiosResponseHeaders } from 'axios';
import fs from 'fs';

import { RateLimit, RateLimits as RateLimitType } from '../models/rate-limit.model';


class RateLimitManager {
    
    // Static Instance
    
    private static _instance: RateLimitManager;
    
    public static get instance(): RateLimitManager {
        if (!RateLimitManager._instance) {
            RateLimitManager._instance = new RateLimitManager();
        }
        return RateLimitManager._instance;
    }
    
    // Private Properties

    private _rateLimits: Array<RateLimit>;
    
    // Life Cycle
    
    private constructor() {
        this._rateLimits = [];
    }
    
    // Interface
    
    public async updateRateLimitsFromHeader(header: AxiosResponseHeaders): Promise<void> {
        try {
            await this.parseHeader(header);

            fs.appendFileSync('rate-limits.log', JSON.stringify(this._rateLimits, null, 2));
            fs.appendFileSync('rate-limits.log', '\n');

            fs.appendFileSync('header-log.log', JSON.stringify(header, null, 2));
            fs.appendFileSync('header-log.log', '\n');

        } catch (error) {
            console.error('Error updating rate limits:', error);
        }
    }

    public getReachInterval(limitType: RateLimitType): number {
        let interval = Math.max(
            ...this._rateLimits
                .filter(limit => limit.type === limitType)
                .map(limit => limit.getReachInterval())
        );

        if (interval < 0) interval = 20_000;

        return interval;
    }

    // Inner Work (Header Parsing)

    private async parseHeader(header: Record<string, string>): Promise<void> {
        const retryAfter = parseInt(header['retry-after']);
        if (retryAfter) {
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        }
        
        const rateLimitType: RateLimitType = header['x-rate-limit-rules'] as RateLimitType;
        if (!rateLimitType) throw new Error('Missing x-rate-limit-rules header');
        
        const rateLimit = header[`x-rate-limit-${rateLimitType.toLowerCase()}`];
        const rateLimitState = header[`x-rate-limit-${rateLimitType.toLowerCase()}-state`];
        
        if (!rateLimit || !rateLimitState) throw new Error('Missing rate limit or state information');

        const date = header['date'] ? new Date(header['date']) : new Date(Date.now());
        
        await this.parseRateLimit(rateLimitType as RateLimitType, rateLimit, rateLimitState, date);
    }
    
    private async parseRateLimit(rateLimitType: RateLimitType, rateLimit: string, rateLimitState: string, date: Date): Promise<void> {
        const rateLimitArray = rateLimit.split(',');
        const rateLimitStateArray = rateLimitState.split(',');
        
        const parsedRateLimits = await Promise.all(
            rateLimitArray.map(async (limitString, index) => {
                const [maxHits, evaluatedPeriod, restrictedTime] = limitString.split(':');
                const [currentHits, currentPeriod, currentRestrictedTime] = rateLimitStateArray[index].split(':');
                
                return new RateLimit({
                    date,
                    type: rateLimitType,
                    maximumHits: parseInt(maxHits),
                    evaluatedPeriod: parseInt(evaluatedPeriod),
                    restrictedTime: parseInt(restrictedTime),
                    currentHits: parseInt(currentHits),
                    currentPeriod: parseInt(currentPeriod),
                    currentRestrictedTime: parseInt(currentRestrictedTime),
                });
            })
        );
        
        this.updateRateLimits(parsedRateLimits);
    }

    // Inner Work (Rate Limit Update)
    
    private updateRateLimits(newRateLimits: RateLimit[]): void {
        for (const rateLimit of newRateLimits) {
            const existingRateLimit = this._rateLimits.find(limit => limit.equals(rateLimit));
            if (existingRateLimit) {
                existingRateLimit.update(rateLimit.date, rateLimit.currentHits, rateLimit.currentPeriod, rateLimit.currentRestrictedTime);
            } else {
                this._rateLimits.push(rateLimit);
            }

            // TODO : Update DB metrix
            
        }
    }

    // Inner Work (Others)
}

export { RateLimitManager };