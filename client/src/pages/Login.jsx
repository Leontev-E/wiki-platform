import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Loader from '@/components/Loader';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md p-8 glass rounded-xl shadow-xl">
        <div className="logo-container">
          <h1 className="logo-title">KLM Wiki Platform</h1>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-700 mb-8">Вход</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Введите ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoggingIn}
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full p-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Введите ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoggingIn}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                disabled={isLoggingIn}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="login-button"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? <Loader size="small" /> : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;