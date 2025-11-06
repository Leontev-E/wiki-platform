import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Настройка CORS
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());
app.use(express.json());

const articlesDir = path.join(__dirname, '../src/data/articles');
const commentsDir = path.join(__dirname, '../src/data/comments');

// Создание папок
try {
    fs.mkdirSync(articlesDir, { recursive: true });
    fs.mkdirSync(commentsDir, { recursive: true });
    console.log('Папки articles и comments созданы или уже существуют');
} catch (err) {
    console.error('Ошибка создания папок:', err);
}

// POST /articles
app.post('/articles', (req, res) => {
    console.log('POST /articles:', req.body);
    const article = req.body;
    if (!article.id || !article.title || !article.content) {
        return res.status(400).json({ error: 'Недостаточно данных для статьи' });
    }
    const filePath = path.join(articlesDir, `article_${article.id}.js`);
    try {
        const content = `export const article = ${JSON.stringify(article, null, 2)};`;
        fs.writeFileSync(filePath, content);
        res.json({ message: `Статья сохранена: ${article.id}` });
    } catch (err) {
        console.error('Ошибка сохранения статьи:', err);
        res.status(500).json({ error: 'Ошибка сохранения статьи' });
    }
});

// DELETE /articles/:id
app.delete('/articles/:id', (req, res) => {
    console.log('DELETE /articles/:id:', req.params.id);
    const id = req.params.id;
    const filePath = path.join(articlesDir, `article_${id}.js`);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            res.json({ message: `Статья удалена: ${id}` });
        } catch (err) {
            console.error('Ошибка удаления статьи:', err);
            res.status(500).json({ error: 'Ошибка удаления статьи' });
        }
    } else {
        res.status(404).json({ error: 'Статья не найдена' });
    }
});

// POST /comments
app.post('/comments', (req, res) => {
    console.log('POST /comments:', req.body);
    const comment = req.body;
    if (!comment.id || !comment.articleId || !comment.text) {
        return res.status(400).json({ error: 'Недостаточно данных для комментария' });
    }
    const filePath = path.join(commentsDir, `comment_${comment.id}.js`);
    try {
        const content = `export const comment = ${JSON.stringify(comment, null, 2)};`;
        fs.writeFileSync(filePath, content);
        res.json({ message: `Комментарий сохранён: ${comment.id}` });
    } catch (err) {
        console.error('Ошибка сохранения комментария:', err);
        res.status(500).json({ error: 'Ошибка сохранения комментария' });
    }
});

// DELETE /comments/:id
app.delete('/comments/:id', (req, res) => {
    console.log('DELETE /comments/:id:', req.params.id);
    const id = req.params.id;
    const filePath = path.join(commentsDir, `comment_${id}.js`);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            res.json({ message: `Комментарий удалён: ${id}` });
        } catch (err) {
            console.error('Ошибка удаления комментария:', err);
            res.status(500).json({ error: 'Ошибка удаления комментария' });
        }
    } else {
        res.status(404).json({ error: 'Комментарий не найден' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});