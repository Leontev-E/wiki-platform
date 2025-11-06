import { v4 as uuidv4 } from 'uuid';

let comments = JSON.parse(localStorage.getItem('comments')) || [];

export function getComments() {
    return comments;
}

export function addComment(comment) {
    const newComment = { ...comment, id: uuidv4(), createdAt: new Date().toISOString() };
    comments.push(newComment);
    localStorage.setItem('comments', JSON.stringify(comments));
    return newComment; // Возвращаем новый комментарий для немедленного обновления UI
}

export function deleteComment(id) {
    comments = comments.filter((comment) => comment.id !== id);
    localStorage.setItem('comments', JSON.stringify(comments));
}