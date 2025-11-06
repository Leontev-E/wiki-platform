import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getArticles } from '@/api/articles';
import { getCategories } from '@/api/categories';
import { FaBook } from 'react-icons/fa';
import Loader from '@/components/Loader';
import SearchBar from '@/components/SearchBar';

function Home() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const articlesPerPage = 9;
  const location = useLocation();

  // Загрузка статей и категорий
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [articlesResponse, cats] = await Promise.all([
          getArticles(1, 100, search),
          getCategories(),
        ]);
        console.log('getArticles response:', articlesResponse);
        const articlesData = articlesResponse.articles || articlesResponse || [];
        console.log('articlesData:', articlesData);
        const enrichedArticles = articlesData.map((article) => {
          const category = cats.find((cat) => cat.id === article.categoryId);
          return {
            ...article,
            categoryName: category ? category.name : 'Без категории',
          };
        });
        console.log('enrichedArticles:', enrichedArticles);
        setArticles(enrichedArticles);
        setFilteredArticles(enrichedArticles);
        setCategories(cats);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [search]);

  // Обработка новой статьи или удаления
  useEffect(() => {
    const newArticle = location.state?.newArticle;
    const deletedArticleId = location.state?.deletedArticleId;

    console.log('location.state:', { newArticle, deletedArticleId });

    if (newArticle && categories.length > 0) {
      const category = categories.find((cat) => cat.id === newArticle.categoryId);
      const enrichedNewArticle = {
        ...newArticle,
        categoryName: category ? category.name : 'Без категории',
      };
      setArticles((prev) => {
        const filtered = prev.filter((a) => a.id !== newArticle.id);
        return [enrichedNewArticle, ...filtered];
      });
      setFilteredArticles((prev) => {
        const filtered = prev.filter((a) => a.id !== newArticle.id);
        return [enrichedNewArticle, ...filtered];
      });
      setCurrentPage(1);
    }

    if (deletedArticleId) {
      console.log('Removing article:', deletedArticleId);
      setArticles((prev) => prev.filter((a) => a.id !== deletedArticleId));
      setFilteredArticles((prev) => prev.filter((a) => a.id !== deletedArticleId));
    }
  }, [location.state, categories]);

  // Фильтрация и сортировка
  useEffect(() => {
    let updated = [...articles];
    console.log('Filtering with categoryId:', categoryId);
    if (categoryId) {
      updated = updated.filter((article) => article.categoryId === categoryId);
    }
    updated.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    console.log('filteredArticles:', updated);
    setFilteredArticles(updated);
    setCurrentPage(1);
  }, [categoryId, sortOrder, articles]);

  const extractImageFromContent = (content) => {
    try {
      if (!content) return null;
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const img = doc.querySelector('img');
      const src = img?.src;
      return src || null;
    } catch (error) {
      console.error('Ошибка извлечения изображения:', error);
      return null;
    }
  };

  const stripHtml = (html) => {
    try {
      if (!html) return '';
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const text = tmp.textContent || tmp.innerText || '';
      return text;
    } catch (error) {
      console.error('Ошибка обработки HTML:', error);
      return '';
    }
  };

  const handleSearch = (searchValue) => {
    setSearch(searchValue);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setSortOrder('newest');
    setFilteredArticles(articles);
    setCurrentPage(1);
  };

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

  const getPaginationRange = () => {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center animate-slide-up">
        Добро пожаловать на KLM Wiki
      </h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <SearchBar onSearch={handleSearch} />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 animate-fade-in bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        >
          <option value="">Все категории</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 animate-fade-in bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
        </select>
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:scale-[1.02] transition-all duration-200 animate-fade-in shadow-md neon-hover"
        >
          Очистить
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentArticles.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-300 col-span-full">Статьи не найдены</p>
          ) : (
            currentArticles.map((article) => {
              const previewImage = article.image || extractImageFromContent(article.content);
              return (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up glass"
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={article.title}
                      className="w-full h-48 object-cover rounded-lg mb-4 shadow-md hover:neon-hover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg mb-4">
                      <FaBook className="text-4xl text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <div
                    className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg mb-4"
                    style={{ display: 'none' }}
                  >
                    <FaBook className="text-4xl text-gray-400 dark:text-gray-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 truncate">
                    Автор: {article.author}
                  </p>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs">
                    <span>{article.categoryName}</span>
                    <span>
                      {new Date(article.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex justify-center items-center gap-2 animate-fade-in">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-600 hover:scale-[1.02] transition-all duration-200 shadow-md neon-hover"
          >
            Назад
          </button>
          {getPaginationRange().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 shadow-md ${
                currentPage === page
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-600 hover:scale-[1.02] transition-all duration-200 shadow-md neon-hover"
          >
            Далее
          </button>
        </nav>
      )}
    </div>
  );
}

export default Home;