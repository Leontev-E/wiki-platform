import express from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs'; // Замена bcrypt на bcryptjs

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const user = rows[0];
        if (!await bcryptjs.compare(password, user.password)) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        console.error('Ошибка при входе пользователя:', err);
        res.status(500).json({ message: 'Ошибка сервера при входе' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const id = uuidv4();
        const hashedPassword = await bcryptjs.hash(password, 10);
        await pool.query('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [
            id, name, email, hashedPassword, role
        ]);
        res.status(201).json({ id, name, email, role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { role } = req.body;
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ message: 'Роль обновлена' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Пользователь удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.put('/:id/password', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Новый пароль обязателен' });
        }
        const hashedPassword = await bcryptjs.hash(password, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);
        res.json({ message: 'Пароль успешно обновлен' });
    } catch (err) {
        console.error('Ошибка при смене пароля:', err);
        res.status(500).json({ message: 'Ошибка сервера при смене пароля' });
    }
});

export default router;