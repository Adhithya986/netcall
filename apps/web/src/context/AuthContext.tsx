import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDTO, WalletDTO } from '@netcall/shared';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface AuthContextType {
  user: UserDTO | null;
  wallet: WalletDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  updateUser: (updated: Partial<UserDTO>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const token = localStorage.getItem('netcall_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const meRes = await api.getMe();
      setUser(meRes.data);
      socketService.connect(token);

      const walletRes = await api.getWallet();
      setWallet(walletRes.data);
    } catch (err) {
      console.warn('Initial session check failed:', err);
      localStorage.removeItem('netcall_access_token');
      localStorage.removeItem('netcall_refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const refreshWallet = async () => {
    try {
      const res = await api.getWallet();
      setWallet(res.data);
    } catch (err) {
      console.error('Failed to refresh wallet:', err);
    }
  };

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ identifier, password });
      const { user: userData, accessToken, refreshToken } = res.data;
      localStorage.setItem('netcall_access_token', accessToken);
      localStorage.setItem('netcall_refresh_token', refreshToken);
      setUser(userData);
      socketService.connect(accessToken);
      await refreshWallet();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      const { user: userData, accessToken, refreshToken } = res.data;
      localStorage.setItem('netcall_access_token', accessToken);
      localStorage.setItem('netcall_refresh_token', refreshToken);
      setUser(userData);
      socketService.connect(accessToken);
      await refreshWallet();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Continue cleanup
    } finally {
      socketService.disconnect();
      setUser(null);
      setWallet(null);
    }
  };

  const updateUser = (updated: Partial<UserDTO>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        refreshWallet,
        updateUser
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
