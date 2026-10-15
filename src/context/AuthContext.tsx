import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Notification } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isDemoSession: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, title?: string) => Promise<{ message?: string }>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  notifications: Notification[];
  unreadNotifsCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'finguard_token';
const DEMO_FLAG_KEY = 'finguard_is_demo';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoSession, setIsDemoSession] = useState<boolean>(
    localStorage.getItem(DEMO_FLAG_KEY) === 'true'
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          const demoEmails = ['admin@finguard.ai', 'analyst@finguard.ai', 'compliance@finguard.ai'];
          const isDemo = demoEmails.includes(res.user.email) || localStorage.getItem(DEMO_FLAG_KEY) === 'true';
          setIsDemoSession(isDemo);
          await refreshNotifications();
        } catch (err) {
          console.warn('Session expired or invalid, clearing authentication state');
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(DEMO_FLAG_KEY);
          setToken(null);
          setUser(null);
          setIsDemoSession(false);
        }
      } else {
        // No auto-login! User must sign in or select a demo account on the login page.
        setUser(null);
        setToken(null);
        setIsDemoSession(false);
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const refreshNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadNotifsCount(res.unreadCount || 0);
    } catch {
      // silent
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    const res = await api.login({ email, password });
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, res.token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
    }

    const demoEmails = ['admin@finguard.ai', 'analyst@finguard.ai', 'compliance@finguard.ai'];
    const isDemo = demoEmails.includes(res.user.email);
    localStorage.setItem(DEMO_FLAG_KEY, isDemo ? 'true' : 'false');
    setIsDemoSession(isDemo);
    setToken(res.token);
    setUser(res.user);
    await refreshNotifications();
  };

  const register = async (name: string, email: string, password: string, title?: string) => {
    // Safe default role 'analyst' is enforced by backend
    const res = await api.register({ name, email, password, title });
    // Note: User can either be auto-logged in or redirected to login with confirmation
    return res;
  };

  const demoLogin = async (role: UserRole) => {
    const res = await api.demoLogin(role);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(DEMO_FLAG_KEY, 'true');
    setIsDemoSession(true);
    setToken(res.token);
    setUser(res.user);
    await refreshNotifications();
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DEMO_FLAG_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setIsDemoSession(false);
    setNotifications([]);
    setUnreadNotifsCount(0);
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadNotifsCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifsCount(0);
    } catch {
      // silent
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isDemoSession,
        login,
        register,
        demoLogin,
        logout,
        notifications,
        unreadNotifsCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
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
