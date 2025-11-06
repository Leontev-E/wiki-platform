import React, { useState, useEffect, useCallback } from 'react';
import { getClicks } from '@/api/clicks';
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';

const ClickStreamMonitoring = () => {
  const [allClicks, setAllClicks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 50;

  // Загрузка данных
  const fetchClicks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getClicks(1, 1000); // Запрашиваем все клики
      setAllClicks(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Ошибка загрузки данных мониторинга');
      console.error('Error fetching clicks:', error);
      setAllClicks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClicks();
    const interval = setInterval(fetchClicks, 60000); // Обновление каждые 60 секунд
    return () => clearInterval(interval);
  }, [fetchClicks]);

  // Клиентская пагинация
  const totalPages = Math.ceil(allClicks.length / itemsPerPage);
  const currentClicks = allClicks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Переключение страницы
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Генерация номеров страниц
  const getPaginationRange = () => {
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="container max-w-7xl mx-auto mt-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white text-gray-900 rounded-xl shadow-lg p-6 sm:p-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Мониторинг замыкающего потока
        </h1>
        <p className="text-center text-lg text-gray-500 mb-12">
          Аналитика переходов в реальном времени
        </p>

        {/* Спиннер */}
        {isLoading && <Loader />}

        {/* Таблица */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                  ID кампании
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                  Название кампании
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                  PXL
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                  Клики
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentClicks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-6 text-center text-sm text-gray-500">
                    Нет данных для отображения
                  </td>
                </tr>
              ) : (
                currentClicks.map((item) => (
                  <tr
                    key={`${item.campaign_id}-${item.date}`}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      item.notification_status === 'anomaly'
                        ? 'bg-red-50'
                        : item.notification_status === 'warning'
                        ? 'bg-yellow-50'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{item.campaign_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.campaign_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.pxl || '{{pixel.id}}'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.click_count}</td>
                    <td className="px-6 py-4 text-sm">
                      {item.notification_status === 'anomaly' ? (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-full">
                          Аномалия
                        </span>
                      ) : item.notification_status === 'warning' ? (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-900 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                          Предупреждение
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-500 bg-gray-200 rounded-full">
                          Нормально
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <nav className="mt-8 flex justify-center items-center space-x-2" aria-label="Пагинация">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Предыдущая
            </button>
            <div className="flex space-x-1">
              {getPaginationRange().map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-4 py-2 text-sm font-medium rounded-md border border-gray-300 transition-all duration-200 ${
                    page === currentPage
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Следующая
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default ClickStreamMonitoring;