import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginApi, getMeApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('food_bills_token');
    if (token) {
      getMeApi()
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('food_bills_token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    const { token, ...userData } = res.data;
    localStorage.setItem('food_bills_token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('food_bills_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
