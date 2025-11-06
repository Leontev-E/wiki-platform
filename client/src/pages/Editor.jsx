import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlock from '@tiptap/extension-code-block';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '@/context/AuthContext';
import { getArticleById, saveArticle } from '@/api/articles';
import { getCategories } from '@/api/categories';
import { ROLES } from '@/constants/roles';
import { toast } from 'react-toastify';
import sanitizeHtml from 'sanitize-html';
import Modal from '@/components/Modal';
import Loader from '@/components/Loader';
import { FaBold, FaItalic, FaHeading, FaImage, FaVideo, FaListUl, FaCode, FaTable } from 'react-icons/fa';

// Функция для повторных попыток axios
const retryAxios = async (fn, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Кастомное расширение Video
const Video = {
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      class: { default: 'max-w-full h-auto rounded-lg shadow-md mb-4' },
    };
  },

  parseHTML() {
    return [{ tag: 'video' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', HTMLAttributes, ['source', { src: HTMLAttributes.src, type: 'video/mp4' }]];
  },
};

function Editor() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const editorRef = useRef(null);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isMediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaType, setMediaType] = useState('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [editingArticle, setEditingArticle] = useState(location.state?.article || null);
  const [error, setError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'min-h-[1.5rem]',
          },
        },
      }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true }),
      Video,
      CodeBlock,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: editingArticle?.content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      saveDraft({ title, content: html, categoryId });
      console.log('Editor updated:', { content: html });
    },
    onFocus: () => {
      console.log('Editor focused');
    },
    autofocus: true,
    onCreate: ({ editor }) => {
      editor.view.dom.addEventListener('paste', (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (const item of items) {
          if (item.type.indexOf('image') !== -1) {
            event.preventDefault();
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target.result;
              editor.chain().focus().setImage({ src: base64, alt: file.name }).run();
              console.log('Pasted image:', { name: file.name, size: file.size });
              toast.success('Изображение вставлено!');
            };
            reader.readAsDataURL(file);
          }
        }
      });
    },
  });

  const draftKey = `article_draft_${editingArticle?.id || id || 'new'}`;
  const saveDraft = useCallback(
    (draft) => {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      console.log('Draft saved:', draft);
    },
    [draftKey]
  );

  const loadDraft = useCallback(() => {
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      const { title, content, categoryId } = JSON.parse(draft);
      setTitle(title || '');
      setContent(content || '');
      setCategoryId(categoryId || '');
      editor?.commands.setContent(content || '<p></p>');
      toast.info('Загружен черновик');
      console.log('Draft loaded:', { title, content, categoryId });
    }
  }, [editor, draftKey]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Загрузка категорий
        const cats = await getCategories();
        setCategories(cats);
        console.log('Categories fetched:', cats.map((c) => ({ id: c.id, name: c.name })));
        if (cats.length > 0 && !editingArticle && !id) {
          setCategoryId(cats[0].id);
        }

        // Загрузка статьи, если указан id и нет editingArticle
        if (id && !editingArticle) {
          try {
            const article = await getArticleById(id);
            setEditingArticle(article);
            setTitle(article.title);
            setContent(article.content);
            setCategoryId(article.categoryId || '');
            editor?.commands.setContent(article.content || '<p></p>');
            console.log('Article loaded by ID:', article);
          } catch (err) {
            console.error('Error loading article:', err.message);
            setError('Статья не найдена');
            toast.error('Статья не найдена');
          }
        } else if (editingArticle) {
          setTitle(editingArticle.title);
          setContent(editingArticle.content);
          setCategoryId(editingArticle.categoryId || '');
          editor?.commands.setContent(editingArticle.content || '<p></p>');
          console.log('Editing article loaded from state:', editingArticle);
        }
      } catch (error) {
        console.error('Fetch data error:', error.message);
        toast.error('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, editingArticle, editor]);

  const fetchArticleData = async () => {
    if (!url.trim()) {
      toast.error('Введите URL');
      return;
    }
    setLoading(true);
    console.log('Starting import from URL:', url);
    try {
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const response = await retryAxios(() =>
        axios.get(proxyUrl + encodeURIComponent(url), { timeout: 15000 })
      );
      console.log('Import response:', response.status, response.data.length);
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'text/html');

      // Проверяем наличие iframe для Telegram-поста
      let iframeContent = '';
      const iframe = doc.querySelector('iframe[src*="t.me"][src*="embed=1"]');
      if (iframe && url.includes('t.me')) {
        const iframeSrc = iframe.getAttribute('src');
        console.log('Found Telegram iframe:', iframeSrc);
        try {
          const iframeResponse = await retryAxios(() =>
            axios.get(proxyUrl + encodeURIComponent(iframeSrc), { timeout: 15000 })
          );
          console.log('Iframe response:', iframeResponse.status, iframeResponse.data.length);
          iframeContent = iframeResponse.data;
        } catch (error) {
          console.error('Iframe fetch error:', error.message);
          toast.warn('Не удалось загрузить содержимое Telegram-поста, продолжаем с основным контентом');
        }
      }

      // Парсим основной документ или содержимое iframe
      const contentDoc = iframeContent
        ? parser.parseFromString(iframeContent, 'text/html')
        : doc;

      let pageTitle =
        contentDoc.querySelector('meta[property="og:title"]')?.content ||
        contentDoc.querySelector('title')?.textContent ||
        contentDoc.querySelector('h1')?.textContent ||
        'Без заголовка';

      let contentHtml = '';
      let mediaContent = '';

      if (url.includes('t.me')) {
        const postContent = contentDoc.querySelector('.tgme_widget_message_text');
        if (postContent) {
          let textContent = postContent.innerHTML
            .replace(/(<br\s*\/?>\s*){2,}/gi, '</p><p>')
            .replace(/<br\s*\/?>/gi, '</p><p>')
            .replace(/^<p>\s*<\/p>/, '')
            .replace(/<p>\s*<\/p>$/, '');
          textContent = textContent.replace(/^(<[^>]+>)*(\w+)/, '$1<b>$2</b>');
          contentHtml = `<div class="telegram-content">${textContent}</div>`;
          pageTitle = postContent.textContent.slice(0, 50) || pageTitle;
        } else {
          const messageWrap = contentDoc.querySelector('.tgme_widget_message');
          const metaDescription = contentDoc.querySelector('meta[property="og:description"]')?.content;
          if (messageWrap) {
            let textContent = messageWrap.textContent.trim();
            if (textContent) {
              const paragraphs = textContent
                .split('\n\n')
                .map((p) => `<p>${p.replace(/^(\w+)/, '<b>$1</b>')}</p>`)
                .join('');
              contentHtml = `<div class="telegram-content">${paragraphs}</div>`;
              pageTitle = textContent.slice(0, 50) || pageTitle;
            }
          } else if (metaDescription) {
            const paragraphs = metaDescription
              .split('\n\n')
              .map((p) => `<p>${p.replace(/^(\w+)/, '<b>$1</b>')}</p>`)
              .join('');
            contentHtml = `<div class="telegram-content">${paragraphs}</div>`;
            pageTitle = metaDescription.slice(0, 50) || pageTitle;
          } else {
            contentHtml = '<p>Импортировано из Telegram (текст отсутствует)</p>';
            pageTitle = 'Telegram Post';
          }
        }

        // Парсинг изображений
        const photoWraps = contentDoc.querySelectorAll('.tgme_widget_message_photo_wrap');
        console.log('Found photo wraps:', photoWraps.length);
        photoWraps.forEach((wrap, index) => {
          const style = wrap.getAttribute('style');
          const urlMatch = style?.match(/url\(['"]?(.+?)['"]?\)/);
          if (urlMatch) {
            mediaContent += `<img src="${urlMatch[1]}" alt="Telegram image ${index + 1}" class="max-w-full h-auto rounded-lg shadow-md mb-4" loading="lazy" />`;
            console.log('Parsed image:', urlMatch[1]);
          }
        });

        // Парсинг изображений из <img> внутри .tgme_widget_message
        const messageImages = contentDoc.querySelectorAll('.tgme_widget_message img');
        console.log('Found message images:', messageImages.length);
        messageImages.forEach((img, index) => {
          const src = img.getAttribute('src');
          if (src && !src.startsWith('data:')) {
            mediaContent += `<img src="${src}" alt="Telegram image ${index + 1}" class="max-w-full h-auto rounded-lg shadow-md mb-4" loading="lazy" />`;
            console.log('Parsed message image:', src);
          }
        });

        // Парсинг видео
        const videos = contentDoc.querySelectorAll('.tgme_widget_message_video, .tgme_widget_message_animation');
        console.log('Found videos:', videos.length);
        videos.forEach((video, index) => {
          const source = video.querySelector('source');
          const videoUrl = source?.getAttribute('src');
          if (videoUrl) {
            mediaContent += `
              <video controls class="max-w-full h-auto rounded-lg shadow-md mb-4">
                <source src="${videoUrl}" type="video/mp4" />
              </video>`;
            console.log('Parsed video:', videoUrl);
          }
        });

        // Резервный парсинг og:image и twitter:image
        const ogImage = contentDoc.querySelector('meta[property="og:image"]')?.content ||
                        contentDoc.querySelector('meta[name="twitter:image"]')?.content;
        if (!mediaContent && ogImage && !contentHtml) {
          mediaContent = `<img src="${ogImage}" alt="Telegram preview" class="max-w-full h-auto rounded-lg shadow-md mb-4" loading="lazy" />`;
          console.log('Parsed og:image:', ogImage);
        }
      } else {
        const contentElement =
          contentDoc.querySelector('article') ||
          contentDoc.querySelector('main') ||
          contentDoc.querySelector('.post-content') ||
          contentDoc.querySelector('.content') ||
          contentDoc.body;
        contentHtml = contentElement?.innerHTML || '';
        contentHtml = `<div class="web-content">${contentHtml}</div>`;
      }

      contentHtml = mediaContent + (contentHtml ? contentHtml : '');

      contentHtml = sanitizeHtml(contentHtml, {
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
          'code',
          'pre',
          'table',
          'tr',
          'td',
          'th',
        ],
        allowedAttributes: {
          img: ['src', 'alt', 'class', 'loading'],
          video: ['controls', 'class'],
          source: ['src', 'type'],
          a: ['href', 'target', 'rel'],
          div: ['class'],
          table: ['class'],
          tr: ['class'],
          td: ['class'],
          th: ['class'],
        },
        allowedClasses: {
          img: ['max-w-full', 'h-auto', 'rounded-lg', 'shadow-md', 'mb-4'],
          video: ['max-w-full', 'h-auto', 'rounded-lg', 'shadow-md', 'mb-4'],
          div: ['telegram-content', 'web-content'],
          table: ['table', 'table-bordered', 'table-striped'],
          tr: ['bg-gray-50'],
          td: ['p-2'],
          th: ['p-2', 'bg-gray-100'],
        },
      });

      setContent(contentHtml || '<p></p>');
      setTitle(pageTitle);
      if (editor) {
        editor.commands.setContent(contentHtml || '<p></p>');
      }
      console.log('Import successful:', { title: pageTitle, content: contentHtml, media: mediaContent });
      toast.success('Контент импортирован!');
    } catch (error) {
      console.error('Import error:', error.message, error.response?.data);
      toast.error(`Ошибка импорта: ${error.message}. Проверьте URL или попробуйте позже.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Введите заголовок');
      return;
    }
    if (!content.trim() || content === '<p></p>') {
      toast.error('Введите содержимое статьи');
      return;
    }

    if (publishing) return;
    setPublishing(true);

    const article = {
      id: editingArticle?.id || id || uuidv4(),
      title: title.trim(),
      content: content.trim(),
      categoryId: categories.some(cat => cat.id === categoryId) ? categoryId : null,
      image: getFirstImage(content) || null,
      author: user?.name || user?.email || 'Anonymous',
      createdAt: editingArticle?.createdAt || new Date().toISOString(),
    };

    if (article.image && article.image.startsWith('data:')) {
      console.warn('Image is base64, setting to null');
      article.image = null;
    }

    console.log('Submitting article:', JSON.stringify(article, null, 2));

    try {
      await retryAxios(() => saveArticle(article, Boolean(editingArticle || id)));
      toast.success(editingArticle || id ? 'Статья обновлена!' : 'Статья опубликована!');
      localStorage.removeItem(draftKey);
      navigate('/', { state: { newArticle: article } });
      console.log('Publish successful:', article);
    } catch (error) {
      const errors = error.response?.data?.errors || [];
      const errorMessage =
        errors.length > 0
          ? errors.map(e => e.msg).join('; ')
          : error.response?.data?.message || error.message || 'Неизвестная ошибка';
      console.error('Publish error:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(`Ошибка публикации: ${errorMessage}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    const article = {
      id: editingArticle?.id || id || uuidv4(),
      title: title.trim(),
      content: content.trim(),
      categoryId: categories.some(cat => cat.id === categoryId) ? categoryId : null,
      image: getFirstImage(content) || null,
      author: user?.name || user?.email || 'Anonymous',
      createdAt: editingArticle?.createdAt || new Date().toISOString(),
      isDraft: true,
    };

    if (article.image && article.image.startsWith('data:')) {
      article.image = null;
    }

    try {
      await retryAxios(() => saveArticle(article, Boolean(editingArticle || id)));
      toast.success('Черновик сохранён!');
      console.log('Draft saved to server:', article);
    } catch (error) {
      const errors = error.response?.data?.errors || [];
      const errorMessage =
        errors.length > 0
          ? errors.map(e => e.msg).join('; ')
          : error.response?.data?.message || error.message || 'Ошибка сохранения';
      console.error('Save draft error:', errorMessage);
      toast.error(`Ошибка сохранения черновика: ${errorMessage}`);
    }
  };

  const getFirstImage = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const img = doc.querySelector('img');
    const src = img?.src;
    return src && !src.startsWith('data:') ? src : null;
  };

  const handleMediaInsert = () => {
    if (!mediaUrl.trim()) {
      toast.error(`Введите URL ${mediaType === 'image' ? 'изображения' : 'видео'}`);
      return;
    }
    if (mediaType === 'image') {
      editor?.chain().focus().setImage({ src: mediaUrl, alt: 'Image' }).run();
    } else {
      editor?.chain().focus().setNode('video', { src: mediaUrl }).run();
    }
    setMediaUrl('');
    setMediaModalOpen(false);
    console.log('Media inserted:', { type: mediaType, url: mediaUrl });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          editor?.chain().focus().setImage({ src: event.target.result, alt: file.name }).run();
          console.log('Image dropped:', file.name);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          editor?.chain().focus().setNode('video', { src: event.target.result }).run();
          console.log('Video dropped:', file.name);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Поддерживаются только изображения и видео');
        console.log('Invalid drop:', file.type);
      }
    }
  };

  const handleEditorClick = () => {
    if (editor) {
      editor.commands.focus();
      console.log('Editor container clicked');
    }
  };

  if (!user || user.role === ROLES.JUNIOR) {
    return <Navigate to="/login" />;
  }

  if (error) {
    return (
      <div className="container max-w-5xl mx-auto mt-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Ошибка
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-md"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto mt-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 animate-slide-up">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {editingArticle || id ? 'Редактировать статью' : 'Новая статья'}
        </h1>

        {/* Tabs for Editor/Preview */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setIsPreview(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              !isPreview ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Редактор
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isPreview ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Предпросмотр
          </button>
          <button
            onClick={loadDraft}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all duration-200"
          >
            Восстановить черновик
          </button>
        </div>

        {/* Import Section */}
        <div className="mb-8">
          <label className="block text-gray-800 dark:text-gray-200 font-medium mb-2">
            Импортировать статью по ссылке
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Вставьте URL (например, Telegram-пост)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200"
              disabled={loading}
              aria-label="URL для импорта статьи"
            />
            <button
              type="button"
              onClick={fetchArticleData}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:scale-105 transition-all duration-200 shadow-md disabled:opacity-50"
              disabled={loading}
              aria-label="Импортировать контент по URL"
            >
              {loading ? (
                <>
                  <Loader size="small" className="mr-2" />
                  Загрузка...
                </>
              ) : (
                'Импортировать'
              )}
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-gray-800 dark:text-gray-200 font-medium mb-2">
              Заголовок*
            </label>
            <input
              type="text"
              placeholder="Введите заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200"
              required
              aria-label="Заголовок статьи"
            />
          </div>

          <div>
            <label className="block text-gray-800 dark:text-gray-200 font-medium mb-2">
              Категория
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200"
              aria-label="Выбор категории статьи"
            >
              <option value="">Без категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-800 dark:text-gray-200 font-medium mb-2">
              Содержимое
            </label>
            {isPreview ? (
              <div
                className="prose max-w-none p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4 cursor-text focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 transition-all duration-200"
                onClick={handleEditorClick}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                ref={editorRef}
              >
                <div className="mb-4 flex gap-2 flex-wrap bg-gray-50 dark:bg-gray-700 p-2 rounded-lg shadow-inner">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      editor?.isActive('bold')
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                    disabled={!editor}
                    title="Жирный текст"
                    aria-label="Жирный текст"
                  >
                    <FaBold className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      editor?.isActive('italic')
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                    disabled={!editor}
                    title="Курсив"
                    aria-label="Курсив"
                  >
                    <FaItalic className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      editor?.isActive('heading', { level: 1 })
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                    disabled={!editor}
                    title="Заголовок H1"
                    aria-label="Заголовок H1"
                  >
                    <FaHeading className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      editor?.isActive('heading', { level: 2 })
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                    disabled={!editor}
                    title="Заголовок H2"
                    aria-label="Заголовок H2"
                  >
                    <FaHeading className="w-5 h-5 text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('image');
                      setMediaUrl('');
                      setMediaModalOpen(true);
                    }}
                    className="p-2 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-all duration-200"
                    disabled={!editor}
                    title="Вставить изображение"
                    aria-label="Вставить изображение"
                  >
                    <FaImage className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('video');
                      setMediaUrl('');
                      setMediaModalOpen(true);
                    }}
                    className="p-2 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-all duration-200"
                    disabled={!editor}
                    title="Вставить видео"
                    aria-label="Вставить видео"
                  >
                    <FaVideo className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      editor?.isActive('bulletList')
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                    disabled={!editor}
                    title="Маркированный список"
                    aria-label="Маркированный список"
                  >
                    <FaListUl className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      editor?.isActive('codeBlock')
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                    disabled={!editor}
                    title="Блок кода"
                    aria-label="Блок кода"
                  >
                    <FaCode className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run()
                    }
                    className="p-2 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-all duration-200"
                    disabled={!editor}
                    title="Вставить таблицу"
                    aria-label="Вставить таблицу"
                  >
                    <FaTable className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <EditorContent
                    editor={editor}
                    className="prose max-w-none min-h-[500px] p-4 focus:outline-none"
                  />
                  <div
                    className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none"
                    style={{ display: content === '<p></p>' ? 'block' : 'none' }}
                  >
                    Начните писать статью...
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-medium rounded-lg hover:scale-105 transition-all duration-200 shadow-md"
              aria-label="Сохранить черновик"
            >
              Сохранить черновик
            </button>
            <button
              type="submit"
              disabled={publishing}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:scale-105 transition-all duration-200 shadow-md disabled:opacity-50"
              aria-label={editingArticle || id ? 'Обновить статью' : 'Опубликовать статью'}
            >
              {publishing ? (
                <>
                  <Loader size="small" className="mr-2" />
                  Публикуем...
                </>
              ) : editingArticle || id ? (
                'Обновить'
              ) : (
                'Опубликовать'
              )}
            </button>
          </div>
        </form>

        {/* Media Insert Modal */}
        <Modal
          isOpen={isMediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          title={`Вставить ${mediaType === 'image' ? 'изображение' : 'видео'}`}
          showConfirmButton
          onConfirm={handleMediaInsert}
          confirmText="Вставить"
          cancelText="Отмена"
          focusFirstButton={false}
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL {mediaType === 'image' ? 'изображения' : 'видео'}*
              </label>
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMediaInsert()}
                className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200"
                placeholder={`Введите URL ${mediaType === 'image' ? 'изображения' : 'видео'}`}
                aria-label={`URL ${mediaType === 'image' ? 'изображения' : 'видео'}`}
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default Editor;