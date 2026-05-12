import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, setTokens, clearTokens, getAccessToken, setAuthErrorHandler } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  // Set the auth error handler so API interceptor can trigger logout
  useEffect(() => {
    setAuthErrorHandler(logout);
  }, [logout]);

  // Check for existing session on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const tokenData = await authApi.login(email, password);
    setTokens(tokenData.access_token, tokenData.refresh_token);
    const userData = await authApi.me();
    setUser(userData);
    return userData;
  };

  const register = async (email, fullName, password) => {
    await authApi.register(email, fullName, password);
    return login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
