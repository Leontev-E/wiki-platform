import React, { useState, useEffect } from 'react';
import { getUsers } from '@/api/users';
import Loader from '@/components/Loader';
import { toast } from 'react-toastify';

function getRoleBadgeColor(role) {
  switch (role) {
    case 'owner': return 'bg-red-500 text-white';
    case 'lead':  return 'bg-blue-500 text-white';
    case 'tech':  return 'bg-purple-500 text-white';
    case 'buyer': return 'bg-green-500 text-white';
    case 'junior':return 'bg-gray-400 text-white';
    default:      return 'bg-gray-300 text-black';
  }
}

export function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        toast.error('Ошибка загрузки пользователей');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader />
      </div>
    );
  }

  if (!users.length) {
    return <div className="text-center text-gray-500 p-4 animate-fade-in">Нет пользователей</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
      {users.map((user) => (
        <div
          key={user.id}
          className="border border-gray-200 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/50 backdrop-blur-md"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900">{user.name}</h2>
          <p className="text-gray-700 text-sm mb-4">{user.email}</p>
          <span
            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeColor(user.role)}`}
          >
            {user.role}
          </span>
        </div>
      ))}
    </div>
  );
}