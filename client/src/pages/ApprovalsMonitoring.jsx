import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApprovals } from '@/api/approvals';
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, BarElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import LazyLoad from 'react-lazyload';
import { Tooltip as ReactTooltip } from 'react-tooltip';

// Регистрация компонентов Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, LineElement, BarElement, CategoryScale, LinearScale, PointElement);

// Маппинг кодов стран на полные названия
const countryMap = {
  AF: 'Афганистан',
  AL: 'Албания',
  DZ: 'Алжир',
  AD: 'Андорра',
  AO: 'Ангола',
  AG: 'Антигуа и Барбуда',
  AR: 'Аргентина',
};

// Функция для склонения слова «апрув»
const pluralizeApprovals = (count) => {
  if (!Number.isInteger(count)) return '0 апрувов';
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} апрувов`;
  }
  if (lastDigit === 1) {
    return `${count} апрув`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} апрува`;
  }
  return `${count} апрувов`;
};

const ApprovalsMonitoring = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('range');
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(startOfMonth(new Date()).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(endOfMonth(new Date()).toISOString().split('T')[0]);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 50;

  // Загрузка данных с react-query
  const fetchApprovals = useCallback(async () => {
    const currentMonthStart = startOfMonth(new Date()).toISOString().split('T')[0];
    const currentMonthEnd = endOfMonth(new Date()).toISOString().split('T')[0];
    const data = await getApprovals(currentMonthStart, currentMonthEnd);
    const sortedData = Array.isArray(data)
      ? data
          .filter((item) => item && typeof item === 'object' && item.id && item.created_at)
          .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      : [];
    console.log('Approvals fetched:', sortedData.length, 'First approval:', sortedData[0]);
    return sortedData;
  }, []);

  const { data: allApprovals = [], isLoading, error } = useQuery({
    queryKey: ['approvals'],
    queryFn: fetchApprovals,
    refetchInterval: 60000,
    retry: 1,
  });

  if (error) {
    toast.error('Ошибка загрузки данных апрувов');
    console.error('Error fetching approvals:', error);
  }

  // Извлечение имени байера
  const extractBuyer = (campaignName) => {
    if (!campaignName || typeof campaignName !== 'string') return 'Unknown';
    const match = campaignName.match(/\[([A-Z0-9]+)\]/);
    const buyer = match ? match[1] : 'Unknown';
    console.log('Extracted buyer:', { campaignName, buyer });
    return buyer;
  };

  // Функция сортировки
  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let aValue = a[key] || '';
      let bValue = b[key] || '';
      if (key === 'buyer') {
        aValue = extractBuyer(a.campaign_name);
        bValue = extractBuyer(b.campaign_name);
      }
      if (key === 'country') {
        aValue = countryMap[a.country] || a.country || '';
        bValue = countryMap[b.country] || b.country || '';
      }
      if (key === 'revenue') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (key === 'created_at') {
        return direction === 'asc'
          ? new Date(aValue || 0) - new Date(bValue || 0)
          : new Date(bValue || 0) - new Date(aValue || 0);
      }
      return direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  };

  // Фильтрация и поиск
  const filteredApprovals = allApprovals
    .filter((approval) => {
      if (!approval || !approval.created_at) return false;
      let approvalDate;
      try {
        approvalDate = parseISO(approval.created_at);
      } catch (e) {
        console.warn('Invalid date format:', approval.created_at);
        return false;
      }
      if (filterType === 'today') {
        return isSameDay(approvalDate, new Date());
      } else if (filterType === 'single_day') {
        return isSameDay(approvalDate, parseISO(singleDate));
      } else {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        return approvalDate >= start && approvalDate <= end;
      }
    })
    .filter((approval) => {
      if (!approval) return false;
      const query = searchQuery.toLowerCase();
      return (
        (approval.campaign_name || '').toLowerCase().includes(query) ||
        extractBuyer(approval.campaign_name).toLowerCase().includes(query) ||
        (countryMap[approval.country] || approval.country || '').toLowerCase().includes(query) ||
        (approval.offer_id || '').toLowerCase().includes(query) ||
        (approval.sub_id || '').toLowerCase().includes(query)
      );
    });

  // Сортировка
  const sortedApprovals = sortConfig.key
    ? sortData(filteredApprovals, sortConfig.key, sortConfig.direction)
    : filteredApprovals;

  // Пагинация
  const totalPages = Math.ceil(sortedApprovals.length / itemsPerPage);
  const currentApprovals = sortedApprovals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Логи для диагностики
  console.log('Pagination info:', {
    allApprovals: allApprovals.length,
    filteredApprovals: filteredApprovals.length,
    sortedApprovals: sortedApprovals.length,
    totalPages,
    currentPage,
  });

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

  // Экспорт в CSV
  const exportToCSV = () => {
    const headers = ['ID,Кампания,Баер,Страна,Оффер,Сумма ($),SubID,Дата'];
    const rows = sortedApprovals.map((approval) => [
      approval.id || '—',
      `"${(approval.campaign_name || '—').replace(/"/g, '""')}"`,
      extractBuyer(approval.campaign_name),
      countryMap[approval.country] || approval.country || '—',
      approval.offer_id || '—',
      approval.revenue ? Number(approval.revenue).toFixed(2) : '—',
      approval.sub_id || '—',
      approval.created_at ? format(parseISO(approval.created_at), 'yyyy-MM-dd HH:mm') : '—',
    ].join(','));
    
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `approvals_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Подготовка данных для графиков
  const prepareChartData = () => {
    const dateRange = filterType === 'today' || filterType === 'single_day'
      ? [filterType === 'today' ? new Date() : parseISO(singleDate)]
      : eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
    
    const approvalsByDate = dateRange.map((date) => {
      const count = sortedApprovals.filter((a) => a.created_at && isSameDay(parseISO(a.created_at), date)).length;
      return { date: format(date, 'yyyy-MM-dd'), count };
    });

    const lineChartData = {
      labels: approvalsByDate.map((d) => d.date),
      datasets: [{
        label: 'Количество апрувов',
        data: approvalsByDate.map((d) => d.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.3,
      }],
    };

    const buyerCounts = sortedApprovals.reduce((acc, a) => {
      const buyer = extractBuyer(a.campaign_name);
      acc[buyer] = (acc[buyer] || 0) + 1;
      return acc;
    }, {});
    const topBuyers = Object.entries(buyerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const pieChartData = {
      labels: topBuyers.map(([buyer]) => buyer),
      datasets: [{
        data: topBuyers.map(([, count]) => count),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        hoverOffset: 20,
      }],
    };

    const countryRevenue = sortedApprovals.reduce((acc, a) => {
      const country = countryMap[a.country] || a.country || 'Unknown';
      acc[country] = (acc[country] || 0) + (Number(a.revenue) || 0);
      return acc;
    }, {});
    const topCountries = Object.entries(countryRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const barCountryData = {
      labels: topCountries.map(([country]) => country),
      datasets: [{
        label: 'Сумма апрувов ($)',
        data: topCountries.map(([, revenue]) => revenue),
        backgroundColor: '#10B981',
        borderRadius: 4,
      }],
    };

    const offerCounts = sortedApprovals.reduce((acc, a) => {
      const offer = a.offer_id || 'Unknown';
      acc[offer] = (acc[offer] || 0) + 1;
      return acc;
    }, {});
    const topOffers = Object.entries(offerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const barOfferData = {
      labels: topOffers.map(([offer]) => offer),
      datasets: [{
        label: 'Количество апрувов',
        data: topOffers.map(([, count]) => count),
        backgroundColor: '#F59E0B',
        borderRadius: 4,
      }],
    };

    return { lineChartData, pieChartData, barCountryData, barOfferData };
  };

  // Топы
  const getTopLists = () => {
    const buyerCounts = sortedApprovals.reduce((acc, a) => {
      const buyer = extractBuyer(a.campaign_name);
      acc[buyer] = (acc[buyer] || 0) + 1;
      return acc;
    }, {});
    const topBuyersCount = Object.entries(buyerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const buyerRevenue = sortedApprovals.reduce((acc, a) => {
      const buyer = extractBuyer(a.campaign_name);
      acc[buyer] = (acc[buyer] || 0) + (Number(a.revenue) || 0);
      return acc;
    }, {});
    const topBuyersRevenue = Object.entries(buyerRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const countryCounts = sortedApprovals.reduce((acc, a) => {
      const country = countryMap[a.country] || a.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
    const topCountriesCount = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const countryRevenue = sortedApprovals.reduce((acc, a) => {
      const country = countryMap[a.country] || a.country || 'Unknown';
      acc[country] = (acc[country] || 0) + (Number(a.revenue) || 0);
      return acc;
    }, {});
    const topCountriesRevenue = Object.entries(countryRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const offerCounts = sortedApprovals.reduce((acc, a) => {
      const offer = a.offer_id || 'Unknown';
      acc[offer] = (acc[offer] || 0) + 1;
      return acc;
    }, {});
    const topOffersCount = Object.entries(offerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { topBuyersCount, topBuyersRevenue, topCountriesCount, topCountriesRevenue, topOffersCount };
  };

  const { lineChartData, pieChartData, barCountryData, barOfferData } = prepareChartData();
  const { topBuyersCount, topBuyersRevenue, topCountriesCount, topCountriesRevenue, topOffersCount } = getTopLists();

  return (
    <div className="container max-w-7xl mx-auto mt-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white text-gray-900 rounded-xl shadow-lg p-6 sm:p-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Мониторинг апрувов
        </h1>
        <p className="text-center text-lg text-gray-600 mb-12">
          Аналитика апрувов в реальном времени
        </p>

        {/* Фильтры */}
        <div className="mb-8 flex flex-col gap-4 justify-center items-center sm:flex-row sm:gap-6">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto max-w-xs p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="today">Сегодня</option>
            <option value="single_day">Конкретный день</option>
            <option value="range">Диапазон дат</option>
          </select>

          {filterType === 'single_day' && (
            <DatePicker
              selected={parseISO(singleDate)}
              onChange={(date) => {
                setSingleDate(format(date, 'yyyy-MM-dd'));
                setCurrentPage(1);
              }}
              minDate={startOfMonth(new Date())}
              maxDate={endOfMonth(new Date())}
              dateFormat="yyyy-MM-dd"
              className="w-full sm:w-auto max-w-xs p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          )}

          {filterType === 'range' && (
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <DatePicker
                selected={parseISO(startDate)}
                onChange={(date) => {
                  setStartDate(format(date, 'yyyy-MM-dd'));
                  setCurrentPage(1);
                }}
                minDate={startOfMonth(new Date())}
                maxDate={parseISO(endDate)}
                dateFormat="yyyy-MM-dd"
                className="w-full sm:w-auto max-w-xs p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <DatePicker
                selected={parseISO(endDate)}
                onChange={(date) => {
                  setEndDate(format(date, 'yyyy-MM-dd'));
                  setCurrentPage(1);
                }}
                minDate={parseISO(startDate)}
                maxDate={endOfMonth(new Date())}
                dateFormat="yyyy-MM-dd"
                className="w-full sm:w-auto max-w-xs p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          )}

          <button
            onClick={() => {
              setFilterType('range');
              setStartDate(startOfMonth(new Date()).toISOString().split('T')[0]);
              setEndDate(endOfMonth(new Date()).toISOString().split('T')[0]);
              setSingleDate(new Date().toISOString().split('T')[0]);
              setSearchQuery('');
              setSortConfig({ key: 'id', direction: 'asc' });
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto max-w-xs p-3 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200"
          >
            Сбросить фильтры
          </button>
        </div>

        {/* Поиск */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Поиск по кампании, баеру, стране, офферу, SubID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {/* Экспорт */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            Экспорт в CSV
          </button>
        </div>

        {/* Спиннер */}
        {isLoading && <Loader />}

        {/* Графики */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <LazyLoad height={200} offset={100} placeholder={<div className="bg-gray-50 p-6 rounded-lg shadow-md h-64 animate-pulse" />}>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Апрувы по дням</h2>
              <Line data={lineChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </div>
          </LazyLoad>
          <LazyLoad height={200} offset={100} placeholder={<div className="bg-gray-50 p-6 rounded-lg shadow-md h-64 animate-pulse" />}>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Топ-5 супергероев по количеству продаж</h2>
              <Pie data={pieChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </div>
          </LazyLoad>
          <LazyLoad height={200} offset={100} placeholder={<div className="bg-gray-50 p-6 rounded-lg shadow-md h-64 animate-pulse" />}>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Топ-5 стран по сумме апрувов</h2>
              <Bar data={barCountryData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </div>
          </LazyLoad>
          <LazyLoad height={200} offset={100} placeholder={<div className="bg-gray-50 p-6 rounded-lg shadow-md h-64 animate-pulse" />}>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Топ-5 офферов по количеству апрувов</h2>
              <Bar data={barOfferData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </div>
          </LazyLoad>
        </div>

        {/* Топы */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Топ-5 супергероев по количеству продаж</h2>
            <ul className="space-y-2">
              {topBuyersCount.map(([buyer, count], index) => (
                <li
                  key={buyer}
                  className="flex justify-between text-sm"
                  data-tooltip-id={`buyer-count-${buyer}`}
                >
                  <span>{index + 1}. {buyer}</span>
                  <span>{pluralizeApprovals(count)}</span>
                  <ReactTooltip
                    id={`buyer-count-${buyer}`}
                    place="top"
                    content={`Баер: ${buyer}\nАпрувов: ${count}`}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Топ-5 супергероев по сумме апрувов</h2>
            <ul className="space-y-2">
              {topBuyersRevenue.map(([buyer, revenue], index) => (
                <li
                  key={buyer}
                  className="flex justify-between text-sm"
                  data-tooltip-id={`buyer-revenue-${buyer}`}
                >
                  <span>{index + 1}. {buyer}</span>
                  <span>${Number(revenue).toFixed(2)}</span>
                  <ReactTooltip
                    id={`buyer-revenue-${buyer}`}
                    place="top"
                    content={`Баер: ${buyer}\nСумма: $${Number(revenue).toFixed(2)}`}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Топ-5 стран по количеству апрувов</h2>
            <ul className="space-y-2">
              {topCountriesCount.map(([country, count], index) => (
                <li
                  key={country}
                  className="flex justify-between text-sm"
                  data-tooltip-id={`country-count-${country}`}
                >
                  <span>{index + 1}. {country}</span>
                  <span>{pluralizeApprovals(count)}</span>
                  <ReactTooltip
                    id={`country-count-${country}`}
                    place="top"
                    content={`Страна: ${country}\nАпрувов: ${count}`}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Топ-5 стран по сумме апрувов</h2>
            <ul className="space-y-2">
              {topCountriesRevenue.map(([country, revenue], index) => (
                <li
                  key={country}
                  className="flex justify-between text-sm"
                  data-tooltip-id={`country-revenue-${country}`}
                >
                  <span>{index + 1}. {country}</span>
                  <span>${Number(revenue).toFixed(2)}</span>
                  <ReactTooltip
                    id={`country-revenue-${country}`}
                    place="top"
                    content={`Страна: ${country}\nСумма: $${Number(revenue).toFixed(2)}`}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Топ-5 офферов по количеству апрувов</h2>
            <ul className="space-y-2">
              {topOffersCount.map(([offer, count], index) => (
                <li
                  key={offer}
                  className="flex justify-between text-sm"
                  data-tooltip-id={`offer-${offer}`}
                >
                  <span>{index + 1}. {offer}</span>
                  <span>{pluralizeApprovals(count)}</span>
                  <ReactTooltip
                    id={`offer-${offer}`}
                    place="top"
                    content={`Оффер: ${offer}\nАпрувов: ${count}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Таблица */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: 'id', label: 'ID' },
                  { key: 'campaign_name', label: 'Кампания' },
                  { key: 'buyer', label: 'Баер' },
                  { key: 'country', label: 'Страна' },
                  { key: 'offer_id', label: 'Оффер' },
                  { key: 'revenue', label: 'Сумма ($)' },
                  { key: 'sub_id', label: 'SubID' },
                  { key: 'created_at', label: 'Дата' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-sm font-medium text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      const newDirection =
                        sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                      setSortConfig({ key, direction: newDirection });
                      setCurrentPage(1);
                    }}
                  >
                    {label} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentApprovals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-6 text-center text-sm text-gray-500">
                    Нет данных для отображения
                  </td>
                </tr>
              ) : (
                currentApprovals.map((approval) => (
                  <tr
                    key={approval.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                    data-tooltip-id={`approval-${approval.id}`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{approval.id || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{approval.campaign_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{extractBuyer(approval.campaign_name)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{countryMap[approval.country] || approval.country || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{approval.offer_id || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{approval.revenue ? `$${Number(approval.revenue).toFixed(2)}` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{approval.sub_id || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{approval.created_at ? format(parseISO(approval.created_at), 'yyyy-MM-dd HH:mm') : '—'}</td>
                    <ReactTooltip
                      id={`approval-${approval.id}`}
                      place="top"
                      content={`Кампания: ${approval.campaign_name || '—'}\nДата: ${approval.created_at ? format(parseISO(approval.created_at), 'yyyy-MM-dd HH:mm') : '—'}`}
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        <nav className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-2" aria-label="Пагинация">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Предыдущая
          </button>
          <div className="flex flex-wrap justify-center space-x-1">
            {getPaginationRange().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-10 h-10 text-sm font-medium rounded-md border border-gray-300 transition-all duration-200 ${
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
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Следующая
          </button>
          <span className="mt-2 sm:mt-0 sm:ml-4 text-sm text-gray-700">
            Страница {currentPage} из {totalPages}
          </span>
        </nav>
      </div>
    </div>
  );
};

export default ApprovalsMonitoring;