"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@hey/helpers/logger");
const dotenv_1 = __importDefault(require("dotenv"));
const pg_promise_1 = __importDefault(require("pg-promise"));
dotenv_1.default.config({ override: true });
class Database {
    _connectionBase = {
        connectionString: process.env.LENS_DATABASE_URL,
        idleTimeoutMillis: 30000,
        max: 15
    };
    _readDb;
    as;
    helpers;
    constructor() {
        const readDb = this._initializeDb();
        this._readDb = readDb.instance;
        this.helpers = readDb.pg.helpers;
        this.as = readDb.pg.as;
    }
    _initializeDb() {
        return this._createDbInstance(this._connectionBase);
    }
    _createDbInstance(connectionParameters) {
        const pgp = (0, pg_promise_1.default)({
            error: (error) => {
                const log = (0, logger_1.withPrefix)("[API]");
                const errorMessage = error instanceof Error ? error.message : String(error);
                log.error(`LENS POSTGRES ERROR WITH TRACE: ${errorMessage}`);
            }
        });
        return {
            instance: pgp(connectionParameters),
            pg: pgp
        };
    }
    multi(query, params = null) {
        return this._readDb.multi(query, params);
    }
    query(query, params = null) {
        return this._readDb.query(query, params);
    }
}
exports.default = new Database();
