import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Article from './pages/Article';
import Editor from './pages/Editor';
import Login from './pages/Login';
import ClickStreamMonitoring from './pages/ClickStreamMonitoring';
import ApprovalsMonitoring from './pages/ApprovalsMonitoring';
import Admin from './pages/Admin';
import DomainBinding from './components/DomainBinding'; // Новый импорт
import Services from './pages/Services';
import { AuthContext } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import { ROLES } from '@/constants/roles';
import Loader from './components/Loader';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Создаём экземпляр QueryClient
const queryClient = new QueryClient();

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <ToastContainer position="top-right" autoClose={3000} />
        <Header />
        <main className="container mx-auto mt-12 animate-fade-in pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/monitoring" element={<ClickStreamMonitoring />} />
            <Route path="/article/:id" element={<Article />} />
            <Route
              path="/editor"
              element={user.role !== ROLES.JUNIOR ? <Editor /> : <Navigate to="/" />}
            />
            <Route path="/approvals" element={<ApprovalsMonitoring />} />
            <Route
              path="/admin"
              element={[ROLES.OWNER, ROLES.LEAD, ROLES.TECH].includes(user.role) ? <Admin /> : <Navigate to="/" />}
            />
            <Route
              path="/domains"
              element={[ROLES.OWNER, ROLES.LEAD, ROLES.TECH].includes(user.role) ? <DomainBinding /> : <Navigate to="/" />}
            />
            <Route path="*" element={<div>Страница не найдена</div>} />
          </Routes>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;