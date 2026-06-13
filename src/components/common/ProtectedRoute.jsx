// ============================================================
// PROTECTED ROUTE — Hôtelière 2.0
// Redirige vers /login si l'utilisateur n'est pas connecté
// Supporte aussi la restriction par rôle (admin uniquement)
// ============================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Spinner de chargement pendant la vérification du token
const Spinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f4f4f4',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '4px solid #e2e8f0',
      borderTop: '4px solid #2980B9',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  </div>
);

// adminOnly : si true, seul le rôle 'admin' peut accéder
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Attendre la vérification du token
  if (loading) return <Spinner />;

  // Non connecté → redirection vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Page admin mais utilisateur non admin → redirection accueil
  if (adminOnly && !isAdmin) {
    return <Navigate to="/hotels" replace />;
  }

  return children;
}
