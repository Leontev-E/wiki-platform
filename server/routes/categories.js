import express from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../redis.js'; // Импорт из redis.js

const router = express.Router();

// Получить все категории
router.get('/', async (req, res) => {
    try {
        const cached = await redisClient.get('categories');
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const [rows] = await pool.query('SELECT * FROM categories');
        await redisClient.setEx('categories', 3600, JSON.stringify(rows)); // Кэш на 1 час
        res.set('Cache-Control', 'public, max-age=3600'); // Кэш на 1 час
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Добавить категорию
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        const id = uuidv4();
        await pool.query('INSERT INTO categories (id, name) VALUES (?, ?)', [id, name]);
        await redisClient.del('categories'); // Очистка кэша
        res.status(201).json({ id, name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        await redisClient.del('categories'); // Очистка кэша
        res.json({ message: 'Категория удалена' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;