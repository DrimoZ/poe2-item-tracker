import { AxiosService, PoESession } from "../../services/axios.service";
import { DatabaseManager } from "../database.manager";

class MetricsDatabaseManager {

    // Static Instance

    private static _instance: MetricsDatabaseManager;

    public static get instance(): MetricsDatabaseManager {
        if (!MetricsDatabaseManager._instance) {
            MetricsDatabaseManager._instance = new MetricsDatabaseManager();
        }
        return MetricsDatabaseManager._instance;
    }

    // Private Properties

    private _dbManager: DatabaseManager;

    // Life Cycle

    private constructor() {
        this._dbManager = DatabaseManager.instance;
    }

    // Interface (Session)

    public getSession(): PoESession {
        const currentTime = Date.now();

        const row = this._dbManager.metricsDb.prepare(`
            SELECT *
            FROM sessions
            WHERE expiration_time > ? AND end_time = 0
            ORDER BY expiration_time DESC
            LIMIT 1;
        `).get(currentTime) as {
            poe_sess_id: string,
            start_time: number,
            expiration_time: number,
            request_count: number,
            error_count: number,
            rate_limit_hits: number,
            average_request_time: number
        };

        if (row) {
            return {
                poeSessId: row.poe_sess_id,
                startTime: row.start_time,
                endTime: 0,
                expirationTime: row.expiration_time,
                requestCount: row.request_count,
                errorCount: row.error_count,
                rateLimitHits: row.rate_limit_hits,
                averageRequestTime: row.average_request_time
            }
        }
        else {
            return {
                poeSessId: '',
                startTime: 0,
                endTime: 0,
                expirationTime: 0,
                requestCount: 0,
                errorCount: 0,
                rateLimitHits: 0,
                averageRequestTime: 0
            }
        }
    }

    public updateSession(currentSession: PoESession, newPoeSessionId: string): PoESession {
        const currentTime = Date.now();
        currentSession.endTime = currentTime;
        currentSession.averageRequestTime = currentSession.requestCount > 0 ? Math.floor((currentSession.endTime - currentSession.startTime) / currentSession.requestCount) : 0;

        if (currentSession.poeSessId !== '') {
            this._dbManager.metricsDb.prepare(`
                UPDATE sessions
                SET end_time = ?,
                    request_count = ?,
                    error_count = ?,
                    rate_limit_hits = ?,
                    average_request_time = ?
                WHERE poe_sess_id = ?;
            `).run(
                currentSession.endTime, currentSession.requestCount, currentSession.errorCount, currentSession.rateLimitHits, currentSession.averageRequestTime,
                currentSession.poeSessId
            );
        }
        
        let newSession: PoESession = {
            poeSessId: newPoeSessionId,
            startTime: currentTime,
            endTime: 0,
            expirationTime: currentTime + AxiosService.POE_SESSION_DURATION,
            requestCount: 0,
            errorCount: 0,
            rateLimitHits: 0,
            averageRequestTime: 0
        }

        this._dbManager.metricsDb.prepare(`
            INSERT INTO sessions (poe_sess_id, start_time, end_time, expiration_time, request_count, error_count, rate_limit_hits, average_request_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `).run(newSession.poeSessId, newSession.startTime, newSession.endTime, newSession.expirationTime, newSession.requestCount, newSession.errorCount, newSession.rateLimitHits, newSession.averageRequestTime);

        return newSession;
    }
}

export { MetricsDatabaseManager };