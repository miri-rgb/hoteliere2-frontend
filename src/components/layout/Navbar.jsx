// ============================================================
// NAVBAR — Hôtelière 2.0
// Barre de navigation principale
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHotel, FaUser, FaSignOutAlt, FaBars, FaTimes, FaTachometerAlt, FaLock, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  primary: '#1B3A6B',
  secondary: '#2980B9',
  white: '#ffffff',
};

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  const linkStyle = (path) => ({
    color: isActive(path) ? COLORS.secondary : COLORS.white,
    textDecoration: 'none',
    fontWeight: isActive(path) ? '600' : '400',
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    borderBottom: isActive(path) ? `2px solid ${COLORS.secondary}` : '2px solid transparent',
  });

  // Ne pas afficher la navbar sur login/register
  const hideNav = ['/login', '/register'].includes(location.pathname);
  if (hideNav) return null;

  return (
    <nav style={{
      backgroundColor: COLORS.primary,
      padding: '0 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <Link to={isAdmin ? '/admin' : '/hotels'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaHotel style={{ color: COLORS.secondary, fontSize: '24px' }} />
          <span style={{ color: COLORS.white, fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>
            Hôtelière <span style={{ color: COLORS.secondary }}>2.0</span>
          </span>
        </Link>

        {/* Liens desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-nav">
          {isAuthenticated && !isAdmin && (
            <>
              <Link to="/hotels"  style={linkStyle('/hotels')}>Accueil</Link>
              <Link to="/profile" style={linkStyle('/profile')}>Mon Profil</Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin" style={linkStyle('/admin')}>
                <FaTachometerAlt style={{ marginRight: '6px' }} />
                Dashboard
              </Link>
              <Link to="/admin/hotels"       style={linkStyle('/admin/hotels')}>Hôtels</Link>
              <Link to="/admin/chambres"     style={linkStyle('/admin/chambres')}>Chambres</Link>
              <Link to="/admin/reservations" style={linkStyle('/admin/reservations')}>Réservations</Link>
              <Link to="/admin/users"        style={linkStyle('/admin/users')}>Utilisateurs</Link>
            </>
          )}

          {/* Utilisateur connecté / non connecté */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '6px 14px', borderRadius: '20px',
              }}>
                <FaUser style={{ color: COLORS.secondary, fontSize: '14px' }} />
                <span style={{ color: COLORS.white, fontSize: '14px', fontWeight: '500' }}>
                  Bonjour, {user?.prenom}
                </span>
                {isAdmin && (
                  <span style={{
                    backgroundColor: COLORS.secondary, color: COLORS.white,
                    fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                    fontWeight: '700', textTransform: 'uppercase',
                  }}>Admin</span>
                )}
              </div>
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
                color: COLORS.white, padding: '6px 14px', borderRadius: '6px',
                cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(231,76,60,0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaSignOutAlt /> Déconnexion
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
              <Link to="/login" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.5)',
                color: COLORS.white, padding: '8px 16px', borderRadius: '6px',
                textDecoration: 'none', fontWeight: '500', fontSize: '14px',
              }}>
                <FaLock style={{ fontSize: '12px' }} /> Connexion
              </Link>
              <Link to="/register" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: COLORS.secondary, color: COLORS.white,
                padding: '8px 16px', borderRadius: '6px',
                textDecoration: 'none', fontWeight: '600', fontSize: '14px',
              }}>
                <FaUserPlus style={{ fontSize: '12px' }} /> Inscription
              </Link>
            </div>
          )}
        </div>

        {/* Bouton menu mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: COLORS.white,
            fontSize: '22px',
            cursor: 'pointer',
          }}
          className="mobile-menu-btn"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div style={{
          backgroundColor: '#132d57',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {isAuthenticated && !isAdmin && (
            <>
              <Link to="/hotels"  style={{ color: COLORS.white, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Accueil</Link>
              <Link to="/profile" style={{ color: COLORS.white, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Mon Profil</Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin"              style={{ color: COLORS.white, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Dashboard Admin</Link>
              <Link to="/admin/hotels"       style={{ color: COLORS.white, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Hôtels</Link>
              <Link to="/admin/chambres"     style={{ color: COLORS.white, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Chambres</Link>
              <Link to="/admin/reservations" style={{ color: COLORS.white, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Réservations</Link>
              <Link to="/admin/users"        style={{ color: COLORS.white, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Utilisateurs</Link>
            </>
          )}
          {isAuthenticated ? (
            <button onClick={handleLogout} style={{ color: '#E74C3C', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '15px', padding: 0 }}>
              Déconnexion
            </button>
          ) : (
            <>
              <Link to="/login"    style={{ color: COLORS.white, textDecoration: 'none', fontWeight: '500' }} onClick={() => setMenuOpen(false)}>🔐 Connexion</Link>
              <Link to="/register" style={{ color: COLORS.secondary, textDecoration: 'none', fontWeight: '600' }} onClick={() => setMenuOpen(false)}>📝 Inscription</Link>
            </>
          )}
        </div>
      )}

    </nav>
  );
}
