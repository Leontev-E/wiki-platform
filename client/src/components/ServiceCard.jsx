import React from 'react';

function ServiceCard({ service }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{service.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-xs">{service.categoryName}</span>
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm"
        >
          Перейти
        </a>
      </div>
    </div>
  );
}

export default ServiceCard;