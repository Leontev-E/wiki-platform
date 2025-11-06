/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class', // Включена поддержка тёмной темы
    theme: {
        // Настраиваем стандартный .container
        container: {
            center: true,
            padding: {
                DEFAULT: '1rem', // соответствует px-4
                sm: '1.5rem', // соответствует px-6
                lg: '2rem', // соответствует px-8
            },
        },
        extend: {
            animation: {
                'dot-pulse': 'dotPulse 1.2s infinite ease-in-out both',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'pulse': 'pulse 2s infinite',
                'slide-in': 'slide-in 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'slide-down': 'slide-down 0.3s ease-out', // Добавлена анимация для выпадающих меню
                'spin-slow': 'spin 3s linear infinite',
                'modal-open': 'modal-open 0.3s ease-out',
            },
            keyframes: {
                dotPulse: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
                    '50%': { transform: 'scale(1.4)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                },
                slideUp: {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                'slide-down': {
                    '0%': { transform: 'translateY(-10%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};