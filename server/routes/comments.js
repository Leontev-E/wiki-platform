import express from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import redisClient from '../redis.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // Лимит 5 МБ

// Получить все комментарии
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const [rows] = await pool.query(
            'SELECT id, articleId, userId, userName, text, parentId, files, createdAt FROM comments ORDER BY createdAt DESC LIMIT ? OFFSET ?',
            [parseInt(limit), parseInt(offset)]
        );
        res.set('Cache-Control', 'public, max-age=300');
        res.json(rows);
    } catch (err) {
        console.error('Ошибка при получении комментариев:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить комментарии для статьи
router.get('/:articleId', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const cacheKey = `comments:${req.params.articleId}:${page}:${limit}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        const [rows] = await pool.query(
            'SELECT id, userId, userName, text, parentId, files, createdAt FROM comments WHERE articleId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
            [req.params.articleId, parseInt(limit), parseInt(offset)]
        );
        const [total] = await pool.query('SELECT COUNT(*) as count FROM comments WHERE articleId = ?', [req.params.articleId]);
        const response = { comments: rows, total: total[0].count };
        await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
        res.set('Cache-Control', 'public, max-age=300');
        res.json(response);
    } catch (err) {
        console.error('Ошибка при получении комментариев для статьи:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Добавить комментарий
router.post('/', upload.array('files', 5), [
    body('articleId').notEmpty().isUUID(),
    body('userId').notEmpty().isUUID(),
    body('userName').notEmpty().isString(),
    body('text').notEmpty().isString(),
    body('parentId').optional().isUUID(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { articleId, userId, userName, text, parentId } = req.body;
        const files = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
        const id = uuidv4();
        const createdAt = new Date().toISOString();
        await pool.query(
            'INSERT INTO comments (id, articleId, userId, userName, text, parentId, files, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, articleId, userId, userName, text, parentId || null, JSON.stringify(files), createdAt]
        );
        await redisClient.del(`comments:${articleId}:*`);
        res.status(201).json({
            id,
            articleId,
            userId,
            userName,
            text,
            parentId: parentId || null,
            files,
            createdAt,
        });
    } catch (err) {
        console.error('Ошибка при добавлении комментария:', err);
        res.status(500).json({ message: 'Ошибка сервера при добавлении комментария' });
    }
});

// Удалить комментарий
router.delete('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT articleId FROM comments WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Комментарий не найден' });
        }
        await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
        await redisClient.del(`comments:${rows[0].articleId}:*`);
        res.json({ message: 'Комментарий успешно удалён' });
    } catch (err) {
        console.error('Ошибка при удалении комментария:', err);
        res.status(500).json({ message: 'Ошибка сервера при удалении комментария' });
    }
});

export default router;