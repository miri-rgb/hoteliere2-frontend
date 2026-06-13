// ============================================================
// CONTEXTE D'AUTHENTIFICATION — Hôtelière 2.0
// ============================================================
//
// POURQUOI cette implémentation ?
//
// Problème racine des versions précédentes :
//   - user = useState(null)  →  au 1er rendu après navigate(),
//     isAuthenticated = !!token && !!null = FALSE
//   - ProtectedRoute redirige vers /login avant que React
//     n'ait fini de commiter le state → page blanche
//
// Solution : stocker ET restaurer user depuis localStorage
// de façon SYNCHRONE, comme le token.
// Résultat : isAuthenticated est vrai DÈS le 1er rendu.
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';
import { logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

// Lecture sécurisée depuis localStorage
const lireStorage = (cle, json = false) => {
  try {
    const val = localStorage.getItem(cle);
    // Rejette les valeurs vides, "null" ou "undefined" (résidus de sessions corrompues)
    if (!val || val === 'null' || val === 'undefined') return null;
    return json ? JSON.parse(val) : val;
  } catch {
    localStorage.removeItem(cle);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Restauration SYNCHRONE au démarrage — pas d'useEffect, pas d'async
  const [token, setToken] = useState(() => lireStorage('token'));
  const [user,  setUser]  = useState(() => lireStorage('user', true));

  // Connexion : sauvegarde token ET user dans localStorage
  const login = useCallback((tokenValue, userData) => {
    if (!tokenValue || !userData) {
      console.error('[AuthContext] login() appelé sans token ou user valide:', { tokenValue, userData });
      return;
    }
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  // Déconnexion : nettoyage localStorage + state
  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin        = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading: false,   // Tout est synchrone, jamais en attente
      login,
      logout,
      isAdmin,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return context;
};
