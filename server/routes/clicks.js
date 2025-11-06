import express from 'express';
import pool from '../db.js';
import { query } from 'express-validator';

const router = express.Router();

// Получить все клики
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    ],
    async (req, res) => {
        try {
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            // Запрос общего количества
            const [countRows] = await pool.query('SELECT COUNT(*) as total FROM clicks');
            const total = countRows[0].total;
            const totalPages = Math.ceil(total / limit);

            // Запрос кликов
            const [rows] = await pool.query(
                `
        SELECT campaign_id, campaign_name, pxl, click_count, date, notification_status
        FROM clicks
        ORDER BY click_count DESC
        LIMIT ? OFFSET ?
        `,
                [parseInt(limit), parseInt(offset)]
            );

            const response = rows.map((row) => ({
                campaign_id: row.campaign_id,
                campaign_name: row.campaign_name,
                pxl: row.pxl || '{{pixel.id}}',
                click_count: row.click_count,
                date: row.date,
                notification_status: row.notification_status || 'none',
            }));

            res.set('Cache-Control', 'no-store');
            res.set('X-Total-Pages', totalPages);
            res.json(response);
        } catch (err) {
            console.error('Ошибка при получении кликов:', err);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
);

// Удалить клики за вчерашний день (MSK)
router.delete('/yesterday', async (req, res) => {
    try {
        // Вчерашняя дата в MSK (UTC+3)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

        const [result] = await pool.query('DELETE FROM clicks WHERE date = ?', [yesterdayStr]);

        res.json({
            message: `Удалено ${result.affectedRows} кликов за ${yesterdayStr}`,
        });
    } catch (err) {
        console.error('Ошибка при удалении кликов:', err);
        res.status(500).json({ message: 'Ошибка сервера при удалении кликов' });
    }
});

export default router;