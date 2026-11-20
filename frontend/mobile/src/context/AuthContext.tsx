import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authApi, type AuthUser } from '../services/api';

export type { AuthUser } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const TOKEN_KEY = 'steadyai.auth.token';
const USER_KEY = 'steadyai.auth.user';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

async function getStoredValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function storeValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeStoredValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoad] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getStoredValue(TOKEN_KEY),
          getStoredValue(USER_KEY)
        ]);
        if (active && storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } catch (error) {
        console.error('Unable to restore the saved SteadyAI session.', error);
      } finally {
        if (active) setLoad(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const persist = async (newToken: string, newUser: AuthUser) => {
    await Promise.all([
      storeValue(TOKEN_KEY, newToken),
      storeValue(USER_KEY, JSON.stringify(newUser))
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    await persist(result.token, result.user);
  };

  const register = async (name: string, email: string, password: string, _role: string) => {
    const result = await authApi.register(name, email, password, 'MEMBER');
    await persist(result.token, result.user);
  };

  const logout = async () => {
    await Promise.all([removeStoredValue(TOKEN_KEY), removeStoredValue(USER_KEY)]);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
