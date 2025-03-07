import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

class DatabaseManager {
    
    // Static Instance
    
    private static _instance: DatabaseManager;
    
    public static get instance(): DatabaseManager {
        if (!DatabaseManager._instance) {
            DatabaseManager._instance = new DatabaseManager();
        }
        return DatabaseManager._instance;
    }
    
    // Private Properties
    
    private _metricsDb: Database.Database | null = null;
    private _itemsDb: Database.Database | null = null;
    private _rawDataDb: Database.Database | null = null;
    
    // Getters
    
    public get metricsDb(): Database.Database {
        if (!this._metricsDb) {
            throw new Error('Metrics Database not initialized');
        }
        
        return this._metricsDb;
    }
    
    public get itemsDb(): Database.Database {
        if (!this._itemsDb) {
            throw new Error('Items Database not initialized');
        }
        
        return this._itemsDb;
    }
    
    public get rawDataDb(): Database.Database {
        if (!this._rawDataDb) {
            throw new Error('Raw Data Database not initialized');
        }
        
        return this._rawDataDb;
    }
    
    // Life Cycle
    
    private constructor() {
        this.setupDatabase();
    }
    
    // Inner Work
    
    private async setupDatabase() {
        await this.setupMetricsDb();
        await this.setupItemsDb();
        await this.setupRawDataDb();

        await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
    
    
    async setupMetricsDb(): Promise<Database.Database> {
        const dbPath = path.resolve(__dirname, "./metrics.db");
        const db = new Database(dbPath, { verbose: this.logToFile.bind(this) });
        this._metricsDb = db;
        
        // Setup the metrics tables
        
        // Session 
        db.prepare(
            `CREATE TABLE IF NOT EXISTS sessions (
                poe_sess_id TEXT PRIMARY KEY NOT NULL,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                expiration_time INTEGER NOT NULL,

                request_count INTEGER NOT NULL,
                error_count INTEGER NOT NULL,

                rate_limit_hits INTEGER NOT NULL,
                average_request_time INTEGER NOT NULL,

                UNIQUE (start_time)
            )`
        ).run();

        // Rate Limits
        // TODO
        
        console.log("Metrics database initialized at:", dbPath);
        return db;
    }
    
    async setupItemsDb(): Promise<Database.Database> {
        const dbPath = path.resolve(__dirname, "./items.db");
        const db = new Database(dbPath, { verbose: this.logToFile.bind(this) });
        this._itemsDb = db;
        
        // Setup the items tables
        
        db.prepare(
            `CREATE TABLE IF NOT EXISTS item_categories (
                id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                ignored BOOLEAN NOT NULL DEFAULT FALSE
            )`
        ).run();

        db.prepare(
            `CREATE TABLE IF NOT EXISTS item_category_labels (
                category_id TEXT NOT NULL,
                label TEXT NOT NULL,
                ignored BOOLEAN NOT NULL DEFAULT FALSE,
                UNIQUE (category_id, label),
                FOREIGN KEY (category_id) REFERENCES item_categories (id) ON DELETE CASCADE
            )`
        ).run();
        
        db.prepare(
            `CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                fetch_method NOT NULL DEFAULT 'search',

                type_line TEXT NOT NULL,
                base_type TEXT NOT NULL,
                max_stack_size INTEGER NOT NULL,
                icon TEXT NOT NULL,

                rarity TEXT NOT NULL,
                ilvl INTEGER NOT NULL,

                ignored BOOLEAN NOT NULL DEFAULT FALSE,
                category_id TEXT NOT NULL,
                FOREIGN KEY (category_id) REFERENCES item_categories (id) ON DELETE CASCADE
            )`
        ).run();
        
        db.prepare(
            `CREATE TABLE IF NOT EXISTS item_descriptions (
                item_id TEXT NOT NULL,
                descr_text TEXT NOT NULL,
                UNIQUE (item_id, descr_text),
                FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
            )`
        ).run();
        
        
        console.log("Items database initialized at:", dbPath);
        return db;
    }
    
    async setupRawDataDb(): Promise<Database.Database> {
        const dbPath = path.resolve(__dirname, "./raw.db");
        const db = new Database(dbPath, { verbose: this.logToFile.bind(this) });
        this._rawDataDb = db;
        
        // Setup the raw data tables
        
        
        
        console.log("Raw data database initialized at:", dbPath);
        return db;
    }

    // Inner Work (Logging)

    private logToFile(message?: unknown, ...additionalArgs: unknown[]): void {
        const logPath = path.resolve(__dirname, "./db.log");
        const timestamp = new Date().toISOString();
        
        // Format the message
        const logMessage = `[${timestamp}] ${String(message)} ${additionalArgs.map(String).join(" ")}\n`;
    
        // Append the log message to the file
        fs.appendFileSync(logPath, logMessage, { encoding: "utf8" });
    }
}

export { DatabaseManager };