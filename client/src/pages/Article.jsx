import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import { getArticleById, deleteArticle } from '@/api/articles';
import { getCategories } from '@/api/categories';
import { ROLES } from '@/constants/roles';
import Modal from '@/components/Modal';
import Loader from '@/components/Loader';
import Comments from '@/components/Comments';
import { toast } from 'react-toastify';
import sanitizeHtml from 'sanitize-html';

function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [article, setArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    children: null,
    onConfirm: null,
    showConfirmButton: false,
  });
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    src: '',
    alt: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [art, cats] = await Promise.all([
          getArticleById(id),
          getCategories(),
        ]);
        console.log('Fetched article:', art);
        setArticle(art);
        setCategories(cats);
      } catch (err) {
        console.error('Error fetching article data:', err);
        toast.error('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Обработчик клика по изображению
  const handleImageClick = (src, alt) => {
    setImageModal({ isOpen: true, src, alt });
  };

  // Обработчик контента для кликабельных изображений
  useEffect(() => {
    if (!article) return;
    const contentImages = document.querySelectorAll('.prose img');
    contentImages.forEach((img) => {
      img.classList.add('cursor-pointer');
      img.addEventListener('click', () => handleImageClick(img.src, img.alt));
    });
    return () => {
      contentImages.forEach((img) => {
        img.removeEventListener('click', () => handleImageClick(img.src, img.alt));
      });
    };
  }, [article]);

  const canEditOrDelete = user && [ROLES.OWNER, ROLES.LEAD, ROLES.TECH, ROLES.BUYER].includes(user.role);

  const handleEdit = () => {
    navigate('/editor', { state: { article } });
  };

  const handleDelete = () => {
    setModal({
      isOpen: true,
      title: 'Удаление статьи',
      children: <p>Вы уверены, что хотите удалить эту статью?</p>,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          console.log('Starting deleteArticle:', id);
          const start = Date.now();
          const response = await deleteArticle(id);
          console.log('deleteArticle response:', response, 'Duration:', Date.now() - start, 'ms');
          // Задержка для стабильного отображения лоадера
          await new Promise((resolve) => setTimeout(resolve, 1000));
          toast.success('Статья удалена!');
          setModal((prev) => ({ ...prev, isOpen: false }));
          navigate('/', { state: { deletedArticleId: id } });
        } catch (err) {
          console.error('Error deleting article:', err);
          toast.error('Ошибка при удалении статьи');
          setModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setIsDeleting(false);
        }
      },
      showConfirmButton: true,
      isSubmitting: isDeleting, // Используем isSubmitting для Modal
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto mt-12 text-center text-gray-600 dark:text-gray-300 animate-fade-in">
        Статья не найдена
      </div>
    );
  }

  // Настройка sanitizeHtml
  const sanitizedContent = sanitizeHtml(article.content, {
    allowedTags: [
      'p',
      'div',
      'h1',
      'h2',
      'h3',
      'img',
      'video',
      'source',
      'a',
      'ul',
      'ol',
      'li',
      'strong',
      'b',
      'em',
      'br',
      'span',
    ],
    allowedAttributes: {
      img: ['src', 'alt', 'class', 'loading'],
      video: ['controls', 'class'],
      source: ['src', 'type'],
      a: ['href'],
      div: ['class'],
    },
    allowedClasses: {
      img: ['max-w-full', 'h-auto', 'rounded-lg', 'shadow-md', 'mb-4', 'cursor-pointer'],
      video: ['max-w-full', 'h-auto', 'rounded-lg', 'shadow-md', 'mb-4'],
      div: ['telegram-content', 'web-content'],
    },
    selfClosing: ['img', 'br', 'hr', 'source'],
    transformTags: {
      p: (tagName, attribs) => ({
        tagName: 'p',
        attribs: { ...attribs, class: 'mb-6 leading-relaxed' },
      }),
    },
    exclusiveFilter: (frame) => {
      return false;
    },
  });

  return (
    <div className="container mx-auto mt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl glass animate-fade-in">
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            className="w-full h-64 sm:h-80 object-cover rounded-lg mb-6 cursor-pointer shadow-md hover:neon-hover"
            onClick={() => handleImageClick(article.image, article.title)}
            aria-label={`Увеличить изображение: ${article.title}`}
          />
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{article.title}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base">
          {categories.find((cat) => cat.id === article.categoryId)?.name || 'Без категории'} • {article.author} •{' '}
          {new Date(article.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <div
          className="prose prose-lg text-gray-800 dark:text-gray-200 mb-8 break-words article-content max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {canEditOrDelete && (
          <div className="flex flex-col sm:flex-row justify-end gap-4 mb-8">
            <button
              onClick={handleEdit}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-200 shadow-md neon-hover"
              aria-label="Редактировать статью"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-200 shadow-md neon-hover flex items-center justify-center"
              disabled={isDeleting}
              aria-label="Удалить статью"
            >
              {isDeleting ? (
                <span className="animate-dot-pulse">
                  <Loader size="small" />
                </span>
              ) : (
                'Удалить'
              )}
            </button>
          </div>
        )}

        <Comments articleId={id} user={user} modal={modal} setModal={setModal} />
      </div>

      {/* Модалка для действий */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
        title={modal.title}
        showConfirmButton={modal.showConfirmButton}
        onConfirm={modal.onConfirm}
        isSubmitting={modal.isSubmitting}
      >
        {modal.children}
      </Modal>

      {/* Модалка для увеличения изображения */}
      {imageModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setImageModal({ isOpen: false, src: '', alt: '' })}
          role="dialog"
          aria-label="Увеличенное изображение"
        >
          <div className="relative max-w-5xl w-full p-4 sm:p-6">
            <img
              src={imageModal.src}
              alt={imageModal.alt}
              className="w-full h-auto rounded-lg shadow-2xl max-h-[85vh] object-contain"
            />
            <button
              className="absolute top-4 right-4 bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 shadow-md"
              onClick={() => setImageModal({ isOpen: false, src: '', alt: '' })}
              aria-label="Закрыть изображение"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Article;