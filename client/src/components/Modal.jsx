import React, { useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Loader from './Loader';

// Создаём portalContainer один раз за пределами компонента
const portalContainer = document.createElement('div');

function Modal({
  isOpen,
  onClose,
  title,
  onConfirm,
  showConfirmButton = false,
  hideDefaultButtons = false,
  children,
  focusFirstButton = true,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  isSubmitting = false,
}) {
  const modalRef = useRef(null);
  const firstButtonRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      console.log('Modal: Escape pressed');
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    console.log('Modal useEffect:', { isOpen, focusFirstButton });
    if (isOpen) {
      lastActiveElementRef.current = document.activeElement;
      console.log('Modal: Saving last active element:', lastActiveElementRef.current);
      if (!document.body.contains(portalContainer)) {
        document.body.appendChild(portalContainer);
      }
      document.body.style.overflow = 'hidden';
      if (focusFirstButton && firstButtonRef.current) {
        console.log('Modal: Focusing first button');
        firstButtonRef.current.focus();
      }
    }

    return () => {
      console.log('Modal: Cleaning up');
      document.body.style.overflow = 'auto';
      if (lastActiveElementRef.current && !isOpen) {
        console.log('Modal: Restoring focus to:', lastActiveElementRef.current);
        lastActiveElementRef.current.focus();
      }
    };
  }, [isOpen, focusFirstButton]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('Modal: Background clicked');
      onClose();
    }
  };

  const handleConfirm = () => {
    if (typeof onConfirm === 'function' && !isSubmitting) {
      console.log('Modal: Confirm clicked');
      onConfirm();
    }
  };

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={children ? 'modal-content' : undefined}
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-8 rounded-lg shadow-xl w-full max-w-lg mx-4 space-y-6">
        {title && (
          <div className="flex justify-between items-center">
            <h2 id="modal-title" className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        {children && (
          <div id="modal-content" className="text-gray-600 dark:text-gray-300">
            {children}
          </div>
        )}
        {!hideDefaultButtons && (
          <div className="flex justify-end gap-4 mt-6">
            {showConfirmButton ? (
              <>
                <button
                  ref={firstButtonRef}
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md neon-hover"
                >
                  {isSubmitting ? (
                    <span className="animate-dot-pulse">
                      <Loader size="small" />
                    </span>
                  ) : (
                    confirmText
                  )}
                </button>
              </>
            ) : (
              <button
                ref={firstButtonRef}
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:scale-[1.02] transition-all duration-200 shadow-md neon-hover"
              >
                {cancelText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    portalContainer
  );
}

export default Modal;