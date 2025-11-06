import express from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Получить все статьи с пагинацией и поиском
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const q = req.query.q || '';
        const offset = (page - 1) * limit;
        const searchQuery = q ? `%${q}%` : '%';
        const [rows] = await pool.query(
            `SELECT a.id, a.title, a.content, a.categoryId, a.author, a.createdAt, a.image, c.name as categoryName
             FROM articles a
             LEFT JOIN categories c ON a.categoryId = c.id
             WHERE a.title LIKE ? OR a.content LIKE ?
             ORDER BY a.createdAt DESC
             LIMIT ? OFFSET ?`,
            [searchQuery, searchQuery, limit, offset]
        );
        const [total] = await pool.query(
            `SELECT COUNT(*) as count FROM articles WHERE title LIKE ? OR content LIKE ?`,
            [searchQuery, searchQuery]
        );
        res.json({ articles: rows, total: total[0].count });
    } catch (err) {
        console.error('Ошибка при получении статей:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении статей', error: err.message });
    }
});

// Получить статью по ID
router.get('/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        const [rows] = await pool.query(
            `SELECT a.*, c.name as categoryName
             FROM articles a
             LEFT JOIN categories c ON a.categoryId = c.id
             WHERE a.id = ?`,
            [articleId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Статья не найдена' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Ошибка при получении статьи:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении статьи', error: err.message });
    }
});

// Создать статью
router.post('/', async (req, res) => {
    try {
        let { id, title, content, categoryId, author, createdAt, image } = req.body;
        if (!title || !content || !author) {
            return res.status(400).json({ message: 'Поля title, content и author обязательны' });
        }
        id = id || uuidv4();
        createdAt = createdAt || new Date().toISOString();
        categoryId = categoryId || null;
        image = image || null;
        await pool.query(
            'INSERT INTO articles (id, title, content, categoryId, author, createdAt, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, title, content, categoryId, author, createdAt, image]
        );
        res.status(201).json({ id, title, content, categoryId, author, createdAt, image });
    } catch (err) {
        console.error('Ошибка при создании статьи:', err);
        res.status(500).json({ message: 'Ошибка сервера при создании статьи', error: err.message });
    }
});

// Обновить статью
router.put('/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        const { title, content, categoryId, author, createdAt, image } = req.body;
        if (!title || !content || !author) {
            return res.status(400).json({ message: 'Поля title, content и author обязательны' });
        }
        const [rows] = await pool.query('SELECT id FROM articles WHERE id = ?', [articleId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Статья не найдена' });
        }
        await pool.query(
            'UPDATE articles SET title = ?, content = ?, categoryId = ?, author = ?, createdAt = ?, image = ? WHERE id = ?',
            [title, content, categoryId || null, author, createdAt || new Date().toISOString(), image || null, articleId]
        );
        res.json({ id: articleId, title, content, categoryId, author, createdAt, image });
    } catch (err) {
        console.error('Ошибка при обновлении статьи:', err);
        res.status(500).json({ message: 'Ошибка сервера при обновлении статьи', error: err.message });
    }
});

// Удалить статью
router.delete('/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        const [rows] = await pool.query('SELECT id FROM articles WHERE id = ?', [articleId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Статья не найдена' });
        }
        await pool.query('DELETE FROM articles WHERE id = ?', [articleId]);
        res.json({ message: 'Статья успешно удалена' });
    } catch (err) {
        console.error('Ошибка при удалении статьи:', err);
        res.status(500).json({ message: 'Ошибка сервера при удалении статьи', error: err.message });
    }
});

export default router;
