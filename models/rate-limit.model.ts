enum RateLimits {
    IP = "Ip",
    CLIENT = "Client",
    ACCOUNT = "Account",
}

class RateLimit {

    // Static Properties

    public static readonly actualLimitPourcentage: number = 0.9;
    public static readonly secondsToAddForSafety: number = 1000;
    
    // Private Properties

    private _type: RateLimits;

    private _date: Date;

    private _maximumHits: number;
    private _currentHits: number;

    private _evaluatedPeriod: number;
    private _currentPeriod: number;

    private _restrictedTime: number;
    private _currentRestrictedTime: number;

    // Life Cycle

    constructor(fields: {
        date?: Date,

        type: RateLimits | string,

        maximumHits: number,
        evaluatedPeriod: number,
        restrictedTime: number,

        currentHits?: number,
        currentPeriod?: number,
        currentRestrictedTime?: number,
    }) {
        this._type = fields.type as RateLimits;

        this._maximumHits = fields.maximumHits;
        this._currentHits = fields.currentHits ?? 0;

        this._evaluatedPeriod = fields.evaluatedPeriod * 1000;
        this._currentPeriod = (fields.currentPeriod ?? 0) * 1000;

        this._restrictedTime = fields.restrictedTime * 1000;
        this._currentRestrictedTime = (fields.currentRestrictedTime ?? 0) * 1000;

        this._date = fields.date ?? new Date(Date.now());
    }

    // Interface

    public update(date: Date, currentHits: number, currentPeriod: number, currentRestrictedTime: number): void {
        this._date = date;

        this._currentHits = currentHits;
        this._currentPeriod = currentPeriod * 1000;
        this._currentRestrictedTime = currentRestrictedTime * 1000;
    }

    public getReachInterval(): number {
        // console.log("Reach Interval : ", this._evaluatedPeriod / Math.ceil(this._maximumHits * RateLimit.actualLimitPourcentage), " - Type : ", this._type, " - Current Hits : ", this._currentHits, " - Maximum Hits : ", this._maximumHits, " - Evaluated Period : ", this._evaluatedPeriod / 1000, " - Current Period : ", this._currentPeriod / 1000, " - Restricted Time : ", this._restrictedTime / 1000, " - Current Restricted Time : ", this._currentRestrictedTime / 1000);

        return this._evaluatedPeriod / Math.ceil(this._maximumHits * RateLimit.actualLimitPourcentage);
    }

    public equals(rateLimit: RateLimit): boolean {
        return this._type === rateLimit.type && this._maximumHits === rateLimit.maximumHits && this._evaluatedPeriod === rateLimit.evaluatedPeriod;
    }

    // Getters

    public get type(): RateLimits {
        return this._type;
    }

    public get date(): Date {
        return this._date;
    }

    public get maximumHits(): number {
        return this._maximumHits;
    }

    public get currentHits(): number {
        return this._currentHits;
    }

    public get evaluatedPeriod(): number {
        return this._evaluatedPeriod;
    }

    public get currentPeriod(): number {
        return this._currentPeriod;
    }

    public get restrictedTime(): number {
        return this._restrictedTime;
    }

    public get currentRestrictedTime(): number {
        return this._currentRestrictedTime;
    }

    // To String
    
    public toString(): string {
        return `RateLimit: {
            date: ${this._date},
            maximumHits: ${this._maximumHits},
            currentHits: ${this._currentHits},
            evaluatedPeriod: ${this._evaluatedPeriod},
            currentPeriod: ${this._currentPeriod},
            restrictedTime: ${this._restrictedTime},
            currentRestrictedTime: ${this._currentRestrictedTime},
        }`;
    }
}


export { RateLimits, RateLimit };