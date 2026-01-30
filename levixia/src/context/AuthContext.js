import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('levixia_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (email, password) => {
    const u = { email, id: Date.now().toString(), name: email.split('@')[0] };
    setUser(u);
    localStorage.setItem('levixia_user', JSON.stringify(u));
    return u;
  };

  const register = (email, password) => {
    const u = { email, id: Date.now().toString(), name: email.split('@')[0] };
    setUser(u);
    localStorage.setItem('levixia_user', JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('levixia_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
