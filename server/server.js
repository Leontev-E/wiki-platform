import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import winston from 'winston';
import articlesRoutes from './routes/articles.js';
import usersRoutes from './routes/users.js';
import categoriesRoutes from './routes/categories.js';
import commentsRoutes from './routes/comments.js';
import servicesRoutes from './routes/services.js';
import clicksRoutes from './routes/clicks.js';
import approvalsRoutes from './routes/approvals.js';
import rateLimit from 'express-rate-limit';
import schedule from 'node-schedule';
import pool from './db.js';

dotenv.config();

const app = express();

// Настройка логирования
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

// Middleware
app.use(compression());
app.use(express.json());
app.use(cors({
    // Set CLIENT_URL in server/.env to match the domain where the React app is served
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    maxAge: 86400,
}));
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

const limiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 минут
    max: 100000,
    message: 'Слишком много запросов, попробуйте позже',
});

app.use(limiter);

// Ежедневная очистка кликов за вчерашний день в 00:00 MSK
const clickCleanupJob = schedule.scheduleJob('0 0 * * *', async () => {
    try {
        // Вчерашняя дата в MSK (UTC+3)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

        const [result] = await pool.query('DELETE FROM clicks WHERE date = ?', [yesterdayStr]);
        logger.info(`[Scheduler] Удалено ${result.affectedRows} кликов за ${yesterdayStr}`);
    } catch (err) {
        logger.error('[Scheduler] Ошибка при очистке кликов:', err);
    }
});

// Ежемесячная очистка апрувов за предыдущий месяц в 00:00 1-го числа (MSK)
const approvalCleanupJob = schedule.scheduleJob('0 0 1 * *', async () => {
    try {
        // Вычисление первого и последнего дня предыдущего месяца
        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const startDate = firstDayLastMonth.toISOString().split('T')[0]; // YYYY-MM-DD
        const endDate = lastDayLastMonth.toISOString().split('T')[0]; // YYYY-MM-DD

        const [result] = await pool.query(
            'DELETE FROM approvals WHERE created_at >= ? AND created_at <= ?',
            [`${startDate} 00:00:00`, `${endDate} 23:59:59`]
        );
        logger.info(`[Scheduler] Удалено ${result.affectedRows} апрувов за период ${startDate} - ${endDate}`);
    } catch (err) {
        logger.error('[Scheduler] Ошибка при очистке апрувов:', err);
    }
});

// Проверка сервера
app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

// Роуты API
app.use('/api/articles', articlesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/clicks', clicksRoutes);
app.use('/api/approvals', approvalsRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
    logger.error(`${err.message} - ${req.method} ${req.url}`);
    res.status(500).json({ message: 'Ошибка сервера' });
});

// Порт сервера
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
});
