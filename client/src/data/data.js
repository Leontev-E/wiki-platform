import { v4 as uuidv4 } from 'uuid';
import { getCategories } from './categories';
import { getUsers } from './users';

// Имитация загрузки всех статей
let articles = [];
const articleFiles = import.meta.glob('./articles/article_*.js', { eager: true });
Object.values(articleFiles).forEach((module) => {
    articles.push(module.article);
});

// Имитация загрузки всех комментариев
let comments = [];
const commentFiles = import.meta.glob('./comments/comment_*.js', { eager: true });
Object.values(commentFiles).forEach((module) => {
    comments.push(module.comment);
});

// Загрузка из localStorage
const loadFromLocalStorage = () => {
    const storedArticles = localStorage.getItem('articles');
    const storedComments = localStorage.getItem('comments');
    if (storedArticles) {
        articles = [...articles, ...JSON.parse(storedArticles)];
    }
    if (storedComments) {
        comments = [...comments, ...JSON.parse(storedComments)];
    }
};

// Сохранение в localStorage
const saveToLocalStorage = () => {
    localStorage.setItem('articles', JSON.stringify(articles.filter((a) => !a._isFromFile)));
    localStorage.setItem('comments', JSON.stringify(comments.filter((c) => !c._isFromFile)));
};

// Инициализация
loadFromLocalStorage();

// Маркировка данных из файлов
articles.forEach((article) => (article._isFromFile = true));
comments.forEach((comment) => (comment._isFromFile = true));

const API_URL = 'http://localhost:3001';

export function getArticles() {
    return articles;
}

export function getArticleById(id) {
    return articles.find((article) => article.id === id);
}

export async function saveArticle(article) {
    const existingIndex = articles.findIndex((a) => a.id === article.id);
    const newArticle = {
        ...article,
        id: existingIndex !== -1 ? article.id : uuidv4(),
        createdAt: existingIndex !== -1 ? article.createdAt : new Date().toISOString(),
    };
    if (existingIndex !== -1) {
        articles[existingIndex] = newArticle;
    } else {
        articles.push(newArticle);
    }
    try {
        const response = await fetch(`${API_URL}/articles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newArticle),
        });
        if (!response.ok) {
            throw new Error('Ошибка сохранения статьи');
        }
        console.log(await response.json());
    } catch (error) {
        console.error('Ошибка сервера:', error);
    }
    saveToLocalStorage();
    return newArticle;
}

export async function deleteArticle(id) {
    const index = articles.findIndex((article) => article.id === id);
    if (index !== -1) {
        articles.splice(index, 1);
        try {
            const response = await fetch(`${API_URL}/articles/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Ошибка удаления статьи');
            }
            console.log(await response.json());
        } catch (error) {
            console.error('Ошибка сервера:', error);
        }
        saveToLocalStorage();
    }
}

export function getComments() {
    return comments;
}

export async function addComment(comment) {
    const newComment = {
        id: uuidv4(),
        ...comment,
        createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    try {
        const response = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newComment),
        });
        if (!response.ok) {
            throw new Error('Ошибка сохранения комментария');
        }
        console.log(await response.json());
    } catch (error) {
        console.error('Ошибка сервера:', error);
    }
    saveToLocalStorage();
    return newComment;
}

export async function deleteComment(commentId) {
    const index = comments.findIndex((comment) => comment.id === commentId);
    if (index !== -1) {
        comments.splice(index, 1);
        try {
            const response = await fetch(`${API_URL}/comments/${commentId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Ошибка удаления комментария');
            }
            console.log(await response.json());
        } catch (error) {
            console.error('Ошибка сервера:', error);
        }
        saveToLocalStorage();
    }
}

export { getCategories, getUsers };