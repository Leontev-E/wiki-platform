import React from 'react';

function Loader({ size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4',
  };

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-current rounded-sm animate-dot-pulse ${sizeClasses[size]}`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export default Loader;