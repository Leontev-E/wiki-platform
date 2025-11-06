import express from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import redisClient from '../redis.js';

const router = express.Router();

// Получить сервисы
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;
        const cacheKey = `services:${page}:${limit}:${search}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        let query = `
      SELECT s.id, s.title, s.url, s.description, s.categoryId, s.createdAt, c.name as categoryName
      FROM useful_services s
      LEFT JOIN service_categories c ON s.categoryId = c.id
    `;
        const params = [];
        if (search) {
            query += ' WHERE s.title LIKE ? OR s.description LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY s.createdAt DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        const [services] = await pool.query(query, params);
        const [total] = await pool.query(
            `SELECT COUNT(*) as count FROM useful_services` + (search ? ' WHERE title LIKE ? OR description LIKE ?' : ''),
            search ? [`%${search}%`, `%${search}%`] : []
        );
        const response = { services, total: total[0].count };
        await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
        res.set('Cache-Control', 'public, max-age=300');
        res.json(response);
    } catch (err) {
        console.error('Ошибка при получении сервисов:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// Создать категорию сервисов
router.post(
    '/service-categories',
    [
        body('name')
            .notEmpty()
            .isString()
            .trim()
            .withMessage('Название категории обязательно'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Ошибка валидации', errors: errors.array() });
        }
        try {
            const { name } = req.body;
            const id = uuidv4();
            await pool.query(
                'INSERT INTO service_categories (id, name) VALUES (?, ?)',
                [id, name]
            );
            // Инвалидировать кэш категорий
            await redisClient.del('service-categories');
            res.status(201).json({ id, name });
        } catch (err) {
            console.error('Ошибка при создании категории:', err);
            res.status(500).json({ message: 'Ошибка сервера при создании категории', error: err.message });
        }
    }
);

// Получить категории
router.get('/service-categories', async (req, res) => {
    try {
        const cacheKey = 'service-categories';
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        const [categories] = await pool.query(
            'SELECT id, name FROM service_categories ORDER BY name'
        );
        await redisClient.setEx(cacheKey, 300, JSON.stringify(categories));
        res.set('Cache-Control', 'public, max-age=300');
        res.json(categories);
    } catch (err) {
        console.error('Ошибка при получении категорий:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// Создать сервис
router.post(
    '/',
    [
        body('title')
            .notEmpty()
            .isString()
            .trim()
            .withMessage('Название обязательно'),
        body('url')
            .notEmpty()
            .isString()
            .trim()
            .custom((value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    throw new Error('Некорректная ссылка');
                }
            })
            .withMessage('Некорректная ссылка'),
        body('description')
            .optional()
            .isString()
            .trim(),
        body('categoryId')
            .optional()
            .custom((value) => {
                if (value && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                    throw new Error('Некорректный ID категории');
                }
                return true;
            }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Ошибка валидации', errors: errors.array() });
        }
        try {
            const { title, url, description, categoryId } = req.body;
            const id = uuidv4();
            const createdAt = new Date().toISOString();
            await pool.query(
                'INSERT INTO useful_services (id, title, url, description, categoryId, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                [id, title, url, description || null, categoryId || null, createdAt]
            );
            // Инвалидировать кэш сервисов
            const keys = await redisClient.keys('services:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            res.status(201).json({ id, title, url, description, categoryId, createdAt });
        } catch (err) {
            console.error('Ошибка при создании сервиса:', err);
            res.status(500).json({ message: 'Ошибка сервера при создании сервиса', error: err.message });
        }
    }
);

// Обновить сервис
router.put(
    '/:id',
    [
        body('title')
            .notEmpty()
            .isString()
            .trim()
            .withMessage('Название обязательно'),
        body('url')
            .notEmpty()
            .isString()
            .trim()
            .custom((value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    throw new Error('Некорректная ссылка');
                }
            })
            .withMessage('Некорректная ссылка'),
        body('description')
            .optional()
            .isString()
            .trim(),
        body('categoryId')
            .optional()
            .custom((value) => {
                if (value && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                    throw new Error('Некорректный ID категории');
                }
                return true;
            }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Ошибка валидации', errors: errors.array() });
        }
        try {
            const { title, url, description, categoryId } = req.body;
            const [rows] = await pool.query(
                'SELECT id FROM useful_services WHERE id = ?',
                [req.params.id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Сервис не найден' });
            }
            await pool.query(
                'UPDATE useful_services SET title = ?, url = ?, description = ?, categoryId = ? WHERE id = ?',
                [title, url, description || null, categoryId || null, req.params.id]
            );
            // Инвалидировать кэш сервисов
            const keys = await redisClient.keys('services:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            res.json({ id: req.params.id, title, url, description, categoryId });
        } catch (err) {
            console.error('Ошибка при обновлении сервиса:', err);
            res.status(500).json({ message: 'Ошибка сервера при обновлении сервиса', error: err.message });
        }
    }
);

// Удалить сервис
router.delete('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id FROM useful_services WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Сервис не найден' });
        }
        await pool.query('DELETE FROM useful_services WHERE id = ?', [req.params.id]);
        // Инвалидировать кэш сервисов
        const keys = await redisClient.keys('services:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        res.json({ message: 'Сервис удалён' });
    } catch (err) {
        console.error('Ошибка при удалении сервиса:', err);
        res.status(500).json({ message: 'Ошибка сервера при удалении сервиса', error: err.message });
    }
});

export default router;