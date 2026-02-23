import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { User, UserRole, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | undefined>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
  }) => Promise<User | undefined>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario al iniciar
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          // Token inválido, limpiar
          await authService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });

    if (response.success && response.data) {
      setUser(response.data.user);
      return response.data.user;
    } else {
      throw new Error(response.error?.message || 'Error al iniciar sesión');
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
  }) => {
    const response = await authService.register(data);

    if (response.success && response.data) {
      setUser(response.data.user);
      return response.data.user;
    } else {
      throw new Error(response.error?.message || 'Error al registrarse');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const response = await authService.updateProfile(data);

    if (response.success && response.data) {
      setUser(response.data);
    } else {
      throw new Error(response.error?.message || 'Error al actualizar perfil');
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
