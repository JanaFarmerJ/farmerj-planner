import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../api/client.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = auth.getSession();
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const result = auth.login(email, password);
    if (result.ok) setUser(result.user);
    return result;
  };

  const logout = () => { auth.logout(); setUser(null); };

  const changePassword = (newPassword) => {
    const result = auth.changePassword(user.id, newPassword);
    if (result.ok) setUser(u => ({ ...u, mustChangePassword: false }));
    return result;
  };

  const canAccessShop = (shopNo) => {
    if (!user) return false;
    if (user.shops === 'all') return true;
    return (user.shops || []).includes(shopNo);
  };

  const isAdmin = user?.role === 'Admin';
  const isHeadOffice = user?.role === 'Head Office' || isAdmin;
  const isOpsManager = user?.role === 'Ops Manager' || isHeadOffice;
  const isShopManager = user?.role === 'Shop Manager' || isOpsManager;

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, changePassword, canAccessShop, isAdmin, isHeadOffice, isOpsManager, isShopManager }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
