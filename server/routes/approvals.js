import express from 'express';
import pool from '../db.js';
import { query } from 'express-validator';
import { isValid, parseISO, subMonths, startOfDay, endOfDay, format } from 'date-fns';

const router = express.Router();

// Получить все апрувы
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
        query('start_date').optional().custom((value) => {
            const date = parseISO(value);
            if (!isValid(date)) throw new Error('Invalid start_date format (YYYY-MM-DD)');
            return true;
        }),
        query('end_date').optional().custom((value) => {
            const date = parseISO(value);
            if (!isValid(date)) throw new Error('Invalid end_date format (YYYY-MM-DD)');
            return true;
        }),
        query('fetch_all').optional().isBoolean().toBoolean(),
    ],
    async (req, res) => {
        try {
            const { page = 1, limit = 1000, start_date, end_date, fetch_all = false } = req.query;

            // Валидация параметров
            const validatedPage = Math.max(1, parseInt(page));
            const validatedLimit = fetch_all ? null : Math.min(1000, Math.max(1, parseInt(limit)));

            console.log('Received query params:', { page, limit, start_date, end_date, fetch_all });

            // Формирование условий для фильтрации по датам
            let dateFilter = '';
            const queryParams = [];
            if (start_date && end_date) {
                const start = parseISO(start_date);
                const end = parseISO(end_date);
                if (!isValid(start) || !isValid(end)) {
                    return res.status(400).json({ message: 'Invalid date format' });
                }
                dateFilter = 'WHERE created_at >= ? AND created_at <= ?';
                queryParams.push(format(startOfDay(start), 'yyyy-MM-dd HH:mm:ss'));
                queryParams.push(format(endOfDay(end), 'yyyy-MM-dd HH:mm:ss'));
            }

            // Формирование SQL-запроса
            const baseQuery = `
                SELECT id, campaign_name, adset_name, ad_name, offer_id, country, revenue, sub_id, created_at
                FROM approvals
                ${dateFilter}
                ORDER BY created_at DESC
            `;
            const paginatedQuery = fetch_all
                ? baseQuery
                : `${baseQuery} LIMIT ? OFFSET ?`;

            if (!fetch_all) {
                queryParams.push(validatedLimit, (validatedPage - 1) * validatedLimit);
            }

            console.log('SQL query:', {
                query: paginatedQuery,
                params: queryParams,
            });

            // Запрос общего количества
            const [countRows] = await pool.query(
                `SELECT COUNT(*) as total FROM approvals ${dateFilter}`,
                dateFilter ? queryParams.slice(0, 2) : []
            );
            const total = countRows[0].total;
            const totalPages = fetch_all ? 1 : Math.ceil(total / validatedLimit);

            // Запрос апрувов
            const [rows] = await pool.query(paginatedQuery, queryParams);

            const response = rows.map((row) => ({
                id: row.id,
                campaign_name: row.campaign_name,
                adset_name: row.adset_name || null,
                ad_name: row.ad_name || null,
                offer_id: row.offer_id || null,
                country: row.country || null,
                revenue: row.revenue ? parseFloat(row.revenue) : null,
                sub_id: row.sub_id,
                created_at: row.created_at.toISOString(),
            }));

            console.log('Database total approvals:', total);
            console.log('Response data (rows returned):', response.length);

            res.set('Cache-Control', 'no-store');
            res.set('X-Total-Count', total);
            res.set('X-Total-Pages', totalPages);
            res.json(response);
        } catch (err) {
            console.error('Ошибка при получении апрувов:', err);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
);

// Удалить апрувы старше 6 месяцев
router.delete('/older-than-six-months', async (req, res) => {
    try {
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 6);
        const startDate = format(startOfDay(sixMonthsAgo), 'yyyy-MM-dd');
        const endDate = format(endOfDay(sixMonthsAgo), 'yyyy-MM-dd');

        console.log('Deleting approvals older than:', { startDate, endDate });

        const [result] = await pool.query(
            'DELETE FROM approvals WHERE created_at <= ?',
            [`${endDate} 23:59:59`]
        );

        console.log('Deleted approvals:', result.affectedRows);

        res.json({
            message: `Удалено ${result.affectedRows} апрувов старше 6 месяцев (до ${endDate})`,
        });
    } catch (err) {
        console.error('Ошибка при удалении апрувов:', err);
        res.status(500).json({ message: 'Ошибка сервера при удалении апрувов' });
    }
});

export default router;