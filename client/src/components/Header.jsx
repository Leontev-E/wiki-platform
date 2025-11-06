import React, { useState, useContext, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { toast } from 'react-toastify';

// Пользовательский CSS для анимации slide-down
const styles = `
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slide-down {
    animation: slide-down 0.3s ease-out forwards;
  }
`;

function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const mobileMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Тёмная тема
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Закрытие меню при клике вне или прокрутке
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
        console.log('Mobile menu closed: Click outside');
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
        console.log('User menu closed: Click outside');
      }
    };

    const handleScroll = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        console.log('Mobile menu closed: Scroll detected');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    toast.info('Вы вышли из аккаунта');
    navigate('/login');
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    console.log('User logged out');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => {
      console.log('Mobile menu toggled:', !prev);
      return !prev;
    });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    console.log('Mobile menu closed: Close button clicked');
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen((prev) => {
      console.log('User menu toggled:', !prev);
      return !prev;
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      console.log('Dark mode toggled:', !prev);
      return !prev;
    });
  };

  const canAccessAdmin = user && [ROLES.OWNER, ROLES.LEAD, ROLES.TECH].includes(user.role);
  const canCreateArticle = user && [ROLES.OWNER, ROLES.LEAD, ROLES.TECH, ROLES.BUYER].includes(user.role);

  const navLinks = [
    { to: '/', label: 'Главная' },
    { to: '/services', label: 'Полезные сервисы' },
    { to: '/monitoring', label: 'Мониторинг зам. потока' },
    ...(canAccessAdmin ? [
      { to: '/approvals', label: 'Апрувы' },
      { to: '/admin', label: 'Админ-панель' },
      { to: '/domains', label: 'Привязка доменов' }, // Новая ссылка
    ] : []),
  ];

  return (
    <>
      <style>{styles}</style>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Логотип */}
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] transition-all duration-300"
            aria-label="KLM Wiki"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-8 h-8 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.5l6-6 6 6-6 6-6-6zm6 4.5v-9"
              />
            </svg>
            KLM Wiki
          </Link>

          {/* Десктопная навигация */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Основная навигация">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 ${
                    isActive ? 'font-semibold border-b-2 border-blue-600' : ''
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {/* Кнопка создания статьи */}
            {canCreateArticle && (
              <NavLink
                to="/editor"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-200 shadow-md"
              >
                Создать статью
              </NavLink>
            )}
            {/* Пользовательское меню */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                >
                  <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {user.name?.charAt(0) || 'U'}
                  </span>
                  <span className="hidden lg:inline">{user.name || user.email}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 animate-slide-down">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      Выход
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-200 shadow-md"
              >
                Вход
              </NavLink>
            )}
            {/* Переключатель тёмной темы */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 11-2 0 1 1 0 012 0zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 11-2 0 1 1 0 012 0zm-1-1a8 8 0 1116 0 8 8 0 01-16 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a8 8 0 00-8 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0018 10a8 8 0 00-8-8z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </nav>

          {/* Мобильная кнопка меню */}
          <button
            className="md:hidden text-gray-900 dark:text-gray-100 focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Мобильное меню */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-menu"
            ref={mobileMenuRef}
            className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-gray-900 shadow-xl z-50 animate-slide-down"
            role="menu"
            aria-label="Мобильная навигация"
          >
            <div className="flex flex-col items-center gap-4 py-6">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMobileMenu}
                  className="text-gray-900 dark:text-gray-100 text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  role="menuitem"
                >
                  {label}
                </NavLink>
              ))}
              {canCreateArticle && (
                <NavLink
                  to="/editor"
                  onClick={closeMobileMenu}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-200 shadow-md text-lg"
                  role="menuitem"
                >
                  Создать статью
                </NavLink>
              )}
              {user ? (
                <div className="flex flex-col items-center gap-4">
                  <span className="text-gray-900 dark:text-gray-100 text-lg">
                    {user.name || user.email}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-200 shadow-md text-lg"
                    role="menuitem"
                  >
                    Выход
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:scale-[1.02] transition-all duration-200 shadow-md text-lg"
                  role="menuitem"
                >
                  Вход
                </NavLink>
              )}
              {/* Переключатель тёмной темы */}
              <button
                onClick={() => {
                  toggleDarkMode();
                  closeMobileMenu();
                }}
                className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                role="menuitem"
              >
                {isDarkMode ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 11-2 0 1 1 0 012 0zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 11-2 0 1 1 0 012 0zm-1-1a8 8 0 1116 0 8 8 0 01-16 0z" />
                    </svg>
                    Светлая тема
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 2a8 8 0 00-8 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0018 10a8 8 0 00-8-8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Тёмная тема
                  </>
                )}
              </button>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

export default Header;