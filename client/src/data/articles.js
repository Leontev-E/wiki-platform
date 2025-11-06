let articles = [];

// Получить все статьи
export const getArticles = () => articles;

// Получить статью по ID
export const getArticleById = (id) => {
    return articles.find((article) => article.id === id);
};

// Сохранить новую статью или обновить существующую
export const saveArticle = (article) => {
    const existingIndex = articles.findIndex((a) => a.id === article.id);
    if (existingIndex !== -1) {
        articles[existingIndex] = article;
    } else {
        articles.push(article);
    }
};

// Удалить статью по ID
export const deleteArticle = (id) => {
    articles = articles.filter((article) => article.id !== id);
};
