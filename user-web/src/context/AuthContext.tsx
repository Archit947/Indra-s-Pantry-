import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);

  const [user, setUserState] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem('canteen_user_data');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('canteen_user_token')
  );

  useEffect(() => { setLoading(false); }, []);

  const login = (userData: User, tok: string) => {
    setUserState(userData);
    setToken(tok);
    localStorage.setItem('canteen_user_token', tok);
    localStorage.setItem('canteen_user_data', JSON.stringify(userData));
  };

  const logout = () => {
    setUserState(null);
    setToken(null);
    localStorage.removeItem('canteen_user_token');
    localStorage.removeItem('canteen_user_data');
  };

  const setUser = (userData: User) => {
    setUserState(userData);
    localStorage.setItem('canteen_user_data', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, setUser, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
