import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(
            `Missing ${envVar} environment variable. ` +
            'Create server/.env based on server/.env.example and provide your database credentials.'
        );
    }
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT
        ? Number(process.env.DB_CONNECTION_LIMIT)
        : 15,
    queueLimit: 0,
    charset: process.env.DB_CHARSET || 'utf8mb4'
});

export default pool;
