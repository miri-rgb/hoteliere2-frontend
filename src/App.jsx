// ============================================================
// APP.JSX — Hôtelière 2.0
// Configuration du routeur et des routes protégées
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Chatbot        from './components/chatbot/Chatbot';

// Pages
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import HomePage        from './pages/HomePage';
import HotelDetailPage from './pages/HotelDetailPage';
import ReservationPage from './pages/ReservationPage';
import ProfilePage     from './pages/ProfilePage';
import AdminPage             from './pages/AdminPage';
import PaiementPage          from './pages/PaiementPage';
import AdminHotelsPage       from './pages/admin/AdminHotelsPage';
import AdminChambresPage     from './pages/admin/AdminChambresPage';
import AdminReservationsPage from './pages/admin/AdminReservationsPage';
import AdminUsersPage        from './pages/admin/AdminUsersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirection racine → liste des hôtels */}
          <Route path="/" element={<Navigate to="/hotels" replace />} />

          {/* Routes publiques */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes publiques — hôtels visibles sans connexion */}
          <Route path="/hotels"    element={<HomePage />} />
          <Route path="/hotels/:id" element={<HotelDetailPage />} />

          {/* Alias rétrocompatible /home → /hotels */}
          <Route path="/home" element={<Navigate to="/hotels" replace />} />

          <Route path="/reservation/:chambreId" element={
            <ProtectedRoute>
              <ReservationPage />
            </ProtectedRoute>
          } />

          <Route path="/paiement/:reservationId" element={
            <ProtectedRoute>
              <PaiementPage />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Routes admin uniquement */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/hotels" element={
            <ProtectedRoute adminOnly>
              <AdminHotelsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/chambres" element={
            <ProtectedRoute adminOnly>
              <AdminChambresPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/reservations" element={
            <ProtectedRoute adminOnly>
              <AdminReservationsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <AdminUsersPage />
            </ProtectedRoute>
          } />

          {/* Page 404 — redirection vers accueil */}
          <Route path="*" element={<Navigate to="/hotels" replace />} />
        </Routes>

        {/* Chatbot flottant — visible sur toutes les pages */}
        <Chatbot />
      </BrowserRouter>
    </AuthProvider>
  );
}
