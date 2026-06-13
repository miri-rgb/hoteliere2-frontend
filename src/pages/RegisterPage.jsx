// ============================================================
// PAGE REGISTER — Hôtelière 2.0
// Inscription d'un nouveau client
// ============================================================

import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FaHotel, FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import { register as apiRegister } from '../services/api';
import { useAuth } from '../context/AuthContext';

const C = {
  primary:   '#1B3A6B',
  secondary: '#2980B9',
  success:   '#27AE60',
  danger:    '#E74C3C',
  white:     '#ffffff',
  border:    '#dce1e7',
};

const InputField = ({ label, name, type = 'text', value, onChange, placeholder, icon: Icon, required = true, extra }) => (
  <div>
    <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <Icon style={{
        position: 'absolute', left: '14px', top: '50%',
        transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '15px',
      }} />
      {extra}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: extra ? '12px 42px 12px 42px' : '12px 14px 12px 42px',
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
);

export default function RegisterPage() {
  const { login, isAuthenticated } = useAuth();

  const [form, setForm]           = useState({ prenom: '', nom: '', email: '', telephone: '', password: '' });
  const [showPwd, setShowPwd]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Redirection synchrone dans le rendu — plus fiable qu'un useEffect
  if (isAuthenticated) {
    return <Navigate to="/hotels" replace />;
  }

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.email || !form.password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiRegister(form);
      console.log('[Register] Réponse API:', res);
      const token = res.token || res.access_token;
      const user  = res.user  || res.data;
      setSuccess('Compte créé avec succès ! Redirection...');
      login(token, user);
      // PAS de navigate() ici : le useEffect s'en charge après le commit React
    } catch (err) {
      if (err.data?.errors) {
        const msgs = Object.values(err.data.errors).flat().join(' ');
        setError(msgs);
      } else {
        setError(err.message || 'Erreur lors de la création du compte.');
      }
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
        maxWidth: '480px',
        overflow: 'hidden',
      }}>
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
          padding: '30px 40px 24px',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '56px', height: '56px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaHotel style={{ color: C.white, fontSize: '24px' }} />
            </div>
          </div>
          <h1 style={{ color: C.white, margin: 0, fontSize: '22px', fontWeight: '700' }}>
            Hôtelière <span style={{ color: '#93C5FD' }}>2.0</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: '6px 0 0', fontSize: '13px' }}>
            Créez votre compte gratuitement
          </p>
        </div>

        {/* Formulaire */}
        <div style={{ padding: '32px 40px' }}>
          <h2 style={{ margin: '0 0 22px', color: C.primary, fontSize: '20px', fontWeight: '600' }}>
            Inscription
          </h2>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2', border: `1px solid ${C.danger}`,
              borderRadius: '8px', padding: '12px 16px', color: C.danger,
              fontSize: '14px', marginBottom: '18px',
            }}>
              ⚠ {error}
            </div>
          )}
          {success && (
            <div style={{
              backgroundColor: '#f0fdf4', border: `1px solid ${C.success}`,
              borderRadius: '8px', padding: '12px 16px', color: C.success,
              fontSize: '14px', marginBottom: '18px',
            }}>
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Prénom + Nom côte à côte */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <InputField label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Youssef" icon={FaUser} />
              <InputField label="Nom *" name="nom" value={form.nom} onChange={handleChange} placeholder="Alami" icon={FaUser} />
            </div>

            {/* Email */}
            <InputField label="Adresse email *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="votre@email.com" icon={FaEnvelope} />

            {/* Téléphone */}
            <InputField label="Téléphone" name="telephone" type="tel" value={form.telephone} onChange={handleChange} placeholder="+212 6XX XXX XXX" icon={FaPhone} required={false} />

            {/* Mot de passe */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
                Mot de passe * <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '12px' }}>(min. 8 caractères)</span>
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
                  placeholder="Minimum 8 caractères"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    border: `1px solid ${C.border}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
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

            {/* Bouton */}
            <button type="submit" disabled={submitting} style={{
              backgroundColor: submitting ? '#93c5fd' : C.primary,
              color: C.white,
              border: 'none',
              borderRadius: '8px',
              padding: '13px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginTop: '4px',
            }}>
              {submitting ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '22px', color: '#6b7280', fontSize: '14px' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: C.secondary, fontWeight: '600', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
