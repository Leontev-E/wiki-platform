import React, { useState, useEffect } from 'react';
import { getComments, addComment as apiAddComment, deleteComment as apiDeleteComment } from '@/api/comments';
import { ROLES } from '@/constants/roles';
import { toast } from 'react-toastify';
import EmojiPicker from 'emoji-picker-react';
import { FaSmile } from 'react-icons/fa';
import Loader from './Loader';

function Comments({ articleId, user, modal, setModal }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // ID комментария, который удаляется
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  // Загрузка комментариев
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const data = await getComments(articleId);
        console.log('Fetched comments:', data);
        setComments(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error('Error fetching comments:', err);
        toast.error('Ошибка при загрузке комментариев');
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [articleId]);

  // Закрытие EmojiPicker при скролле
  useEffect(() => {
    const handleScroll = () => setShowEmojiPicker(false);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Добавление комментария
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return toast.error('Комментарий не может быть пустым');
    if (!user) return toast.error('Войдите, чтобы оставить комментарий');

    setIsSubmitting(true);
    try {
      const commentData = {
        articleId,
        userId: user.id,
        userName: user.name,
        text: newComment,
        parentId: replyTo?.id || null,
      };
      const saved = await apiAddComment(commentData);
      setComments((prev) => [saved, ...prev]);
      setNewComment('');
      setReplyTo(null);
      setShowEmojiPicker(false);
      toast.success('Комментарий добавлен!');
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Ошибка при добавлении комментария');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Удаление комментария
  const handleDeleteComment = (commentId) => {
    setModal({
      isOpen: true,
      title: 'Удаление комментария',
      children: <p>Вы уверены, что хотите удалить этот комментарий?</p>,
      onConfirm: async () => {
        setIsDeleting(commentId);
        try {
          await apiDeleteComment(commentId);
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          setModal((prev) => ({ ...prev, isOpen: false }));
          toast.success('Комментарий удалён!');
        } catch (err) {
          console.error('Error deleting comment:', err);
          toast.error('Ошибка при удалении комментария');
        } finally {
          setIsDeleting(null);
        }
      },
      showConfirmButton: true,
      isSubmitting: isDeleting === commentId,
    });
  };

  // Выбор эмодзи
  const handleEmojiClick = (emojiObject) => {
    setNewComment((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Ответ на комментарий
  const handleReply = (comment) => {
    setReplyTo(comment);
    document.getElementById('comment-textarea').focus();
  };

  // Отмена ответа
  const cancelReply = () => {
    setReplyTo(null);
  };

  // Получение первой буквы имени для аватара
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Рекурсивный рендеринг комментариев
  const renderComments = (comments, parentId = null, level = 0) => {
    return comments
      .filter((comment) => (comment.parentId || null) === parentId)
      .map((comment) => {
        console.log('Rendering comment:', comment.id, 'User:', user);
        console.log('Can delete:', user && (user.id === comment.userId || user.role === ROLES.OWNER));
        return (
          <div
            key={comment.id}
            className={`p-4 sm:p-6 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md glass animate-slide-up ${
              level > 0 ? 'ml-6 sm:ml-10' : ''
            } ${level > 3 ? 'border-l-2 border-blue-500 dark:border-blue-400' : ''}`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm sm:text-base shrink-0"
                aria-hidden="true"
              >
                {getInitial(comment.userName)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">
                      {comment.userName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(comment)}
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs sm:text-sm transition-colors duration-200"
                      aria-label={`Ответить на комментарий ${comment.userName}`}
                    >
                      Ответить
                    </button>
                    {user && (user.id === comment.userId || user.role === ROLES.OWNER) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={isDeleting === comment.id}
                        className="px-3 py-1 sm:px-4 sm:py-1 bg-gradient-to-r from-red-500 to-red-700 text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-200 text-xs sm:text-sm shadow-md neon-hover flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Удалить комментарий ${comment.userName}`}
                      >
                        {isDeleting === comment.id ? (
                          <span className="animate-dot-pulse">
                            <Loader size="small" />
                          </span>
                        ) : (
                          'Удалить'
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-800 dark:text-gray-200 mt-2 text-sm sm:text-base leading-relaxed">
                  {comment.text}
                </p>
              </div>
            </div>
            {renderComments(comments, comment.id, level + 1)}
          </div>
        );
      });
  };

  if (loading) {
    return (
      <div className="text-gray-600 dark:text-gray-300 animate-pulse text-center">
        Загрузка комментариев...
      </div>
    );
  }

  return (
    <section className="mt-8 px-2 sm:px-4">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 animate-fade-in">
        Комментарии
      </h2>
      {user ? (
        <form
          onSubmit={handleAddComment}
          className="mb-8 p-4 sm:p-6 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-xl glass animate-fade-in"
        >
          {replyTo && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-3 text-sm sm:text-base">
              <span>Ответ на: {replyTo.userName}</span>
              <button
                type="button"
                onClick={cancelReply}
                className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm transition-colors duration-200"
                aria-label="Отменить ответ"
              >
                Отмена
              </button>
            </div>
          )}
          <div className="relative">
            <textarea
              id="comment-textarea"
              placeholder="Ваш комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y min-h-[100px] w-full text-sm sm:text-base"
              aria-label="Написать комментарий"
            />
            <div className="absolute bottom-4 right-4">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                aria-label="Выбрать эмодзи"
              >
                <FaSmile className="w-5 h-5" />
              </button>
            </div>
          </div>
          {showEmojiPicker && (
            <div className="mt-2 sm:absolute sm:right-0 sm:bottom-16 z-10">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 self-end px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md neon-hover text-sm sm:text-base"
            aria-label="Отправить комментарий"
          >
            {isSubmitting ? (
              <span className="animate-dot-pulse">
                <Loader size="small" />
                Отправка...
              </span>
            ) : (
              'Отправить'
            )}
          </button>
        </form>
      ) : (
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base animate-fade-in">
          Войдите, чтобы оставить комментарий
        </p>
      )}
      <div className="space-y-4">{renderComments(comments)}</div>
    </section>
  );
}

export default Comments;