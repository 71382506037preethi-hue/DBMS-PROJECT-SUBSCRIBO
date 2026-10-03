import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { api } from '../services/api.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (formData: any) => Promise<User | null>;
  logout: () => void;
  quickLogin: (email: string, password: string) => Promise<User | null>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('subscribo_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const toast = useToast();

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('subscribo_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.auth.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('subscribo_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem('subscribo_token', res.token);
      setToken(res.token);
      setUser(res.user);
      toast.success(`Welcome back, ${res.user.name}!`, 'Login Successful');
      return res.user;
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check credentials.');
      return null;
    }
  };

  const signup = async (formData: any): Promise<User | null> => {
    try {
      const res = await api.auth.signup(formData);
      localStorage.setItem('subscribo_token', res.token);
      setToken(res.token);
      setUser(res.user);
      toast.success(res.message, 'Account Created');
      return res.user;
    } catch (err: any) {
      toast.error(err.message || 'Signup failed.');
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('subscribo_token');
    setToken(null);
    setUser(null);
    toast.info('You have been logged out securely.', 'Logged Out');
  };

  const quickLogin = async (email: string, password: string): Promise<User | null> => {
    return login(email, password);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        quickLogin,
        refreshUser,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
