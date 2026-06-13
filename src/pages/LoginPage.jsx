// ============================================================
// PAGE LOGIN — Hôtelière 2.0
// ============================================================

import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FaHotel, FaEnvelope, FaLock, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { login as apiLogin, loginWithGoogle } from '../services/api';
import { useAuth } from '../context/AuthContext';

const C = {
  primary:   '#1B3A6B',
  secondary: '#2980B9',
  danger:    '#E74C3C',
  white:     '#ffffff',
  bg:        '#f4f4f4',
  border:    '#dce1e7',
};

export default function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [form, setForm]           = useState({ email: '', password: '' });
  const [showPwd, setShowPwd]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  // Redirection synchrone dans le rendu — plus fiable qu'un useEffect
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/hotels'} replace />;
  }

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiLogin(form.email, form.password);
      console.log('[Login] Réponse API:', res);
      // Supporte plusieurs formats de réponse backend
      const token = res.token || res.access_token;
      const user  = res.user  || res.data;
      console.log('[Login] token extrait:', token, '| user extrait:', user);
      login(token, user);
    } catch (err) {
      setError(err.message || 'Email ou mot de passe incorrect.');
    } finally {
      setSubmitting(false);
    }
  };

  // Simulation connexion Google
  const handleGoogle = async () => {
    setSubmitting(true);
    setError('');
    try {
      const fakeGoogle = {
        google_id: 'google_' + Date.now(),
        email:     'google.user@gmail.com',
        nom:       'Google',
        prenom:    'Utilisateur',
        avatar:    null,
      };
      const res = await loginWithGoogle(fakeGoogle);
      login(res.token, res.user);
    } catch {
      setError('Connexion Google non disponible pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${C.primary} 0%, #2c5282 50%, ${C.secondary} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: C.white,
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
      }}>
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
          padding: '36px 40px 28px',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '64px', height: '64px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaHotel style={{ color: C.white, fontSize: '28px' }} />
            </div>
          </div>
          <h1 style={{ color: C.white, margin: 0, fontSize: '26px', fontWeight: '700' }}>
            Hôtelière <span style={{ color: '#93C5FD' }}>2.0</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: '8px 0 0', fontSize: '14px' }}>
            Votre portail de réservation hôtelière
          </p>
        </div>

        {/* Formulaire */}
        <div style={{ padding: '36px 40px' }}>
          <h2 style={{ margin: '0 0 24px', color: C.primary, fontSize: '20px', fontWeight: '600' }}>
            Connexion
          </h2>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: `1px solid ${C.danger}`,
              borderRadius: '8px',
              padding: '12px 16px',
              color: C.danger,
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '15px',
                }} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    border: `1px solid ${C.border}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = C.secondary}
                  onBlur={(e) => e.target.style.borderColor = C.border}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '15px',
                }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Votre mot de passe"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    border: `1px solid ${C.border}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = C.secondary}
                  onBlur={(e) => e.target.style.borderColor = C.border}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  cursor: 'pointer', color: '#9ca3af', padding: 0,
                }}>
                  {showPwd ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} style={{
              backgroundColor: submitting ? '#93c5fd' : C.primary,
              color: C.white,
              border: 'none',
              borderRadius: '8px',
              padding: '13px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '4px',
            }}>
              {submitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: C.border }} />
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>ou</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: C.border }} />
          </div>

          {/* Bouton Google */}
          <button onClick={handleGoogle} disabled={submitting} style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '12px',
            fontSize: '15px', fontWeight: '500',
            cursor: submitting ? 'not-allowed' : 'pointer',
            color: '#374151',
            transition: 'background-color 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.white}
          >
            <FaGoogle style={{ color: '#EA4335', fontSize: '18px' }} />
            Continuer avec Google
          </button>

          <p style={{ textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '14px' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: C.secondary, fontWeight: '600', textDecoration: 'none' }}>
              S'inscrire
            </Link>
          </p>

          {/* Comptes de test */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '16px',
            fontSize: '12px',
            color: '#0369a1',
          }}>
            <strong>Comptes de test :</strong><br />
            Admin : admin1@hoteliere.ma / password<br />
            Client : client1@gmail.com / password
          </div>
        </div>
      </div>
    </div>
  );
}
