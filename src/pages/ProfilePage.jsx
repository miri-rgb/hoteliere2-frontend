// ============================================================
// PAGE PROFIL CLIENT — Hôtelière 2.0
// Informations client + liste des réservations + annulation
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, FaEnvelope, FaPhone, FaSignOutAlt, FaHotel,
  FaCalendarAlt, FaBed, FaMoneyBillWave, FaTimesCircle,
  FaCheckCircle, FaClock, FaExclamationCircle, FaSearch
} from 'react-icons/fa';
import { getMesReservations, annulerReservation } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const C = {
  primary:   '#1B3A6B',
  secondary: '#2980B9',
  success:   '#27AE60',
  danger:    '#E74C3C',
  warning:   '#F39C12',
  white:     '#ffffff',
  bg:        '#f4f4f4',
  border:    '#dce1e7',
  text:      '#374151',
  muted:     '#6b7280',
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' });
};

const nbNuits = (a, d) => {
  if (!a || !d) return 0;
  return Math.max(0, Math.floor((new Date(d) - new Date(a)) / 86400000));
};

// Badge de statut de réservation
const StatutBadge = ({ statut }) => {
  const configs = {
    confirmee:  { label: 'Confirmée',  bg: '#f0fdf4', color: '#15803d', icon: <FaCheckCircle /> },
    en_attente: { label: 'En attente', bg: '#fffbeb', color: '#b45309', icon: <FaClock /> },
    annulee:    { label: 'Annulée',    bg: '#fef2f2', color: '#dc2626', icon: <FaTimesCircle /> },
  };
  const cfg = configs[statut] || { label: statut, bg: '#f3f4f6', color: '#374151', icon: <FaExclamationCircle /> };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      backgroundColor: cfg.bg, color: cfg.color,
      padding: '4px 12px', borderRadius: '20px',
      fontSize: '12px', fontWeight: '600',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// Carte de réservation
const ReservationCard = ({ reservation, onAnnuler, cancelling }) => {
  const nuits = nbNuits(reservation.date_arrivee, reservation.date_depart);
  const peutAnnuler = reservation.statut === 'en_attente';

  return (
    <div style={{
      backgroundColor: C.white,
      borderRadius: '12px',
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'}
    >
      {/* En-tête de carte */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaHotel style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px' }} />
          <div>
            <div style={{ color: C.white, fontWeight: '700', fontSize: '15px' }}>
              {reservation.chambre?.hotel?.nom || `Réservation #${reservation.id}`}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              {reservation.chambre?.hotel?.ville} • Réf. #{reservation.id}
            </div>
          </div>
        </div>
        <StatutBadge statut={reservation.statut} />
      </div>

      {/* Corps de carte */}
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <InfoItem icon={<FaBed />} label="Chambre" value={`N° ${reservation.chambre?.numero || '?'} — ${reservation.chambre?.type || 'Standard'}`} />
          <InfoItem icon={<FaCalendarAlt />} label="Arrivée" value={formatDate(reservation.date_arrivee)} />
          <InfoItem icon={<FaCalendarAlt />} label="Départ" value={formatDate(reservation.date_depart)} />
          <InfoItem icon={<FaClock />} label="Durée" value={`${nuits} nuit${nuits > 1 ? 's' : ''}`} />
          <InfoItem
            icon={<FaMoneyBillWave />}
            label="Total"
            value={reservation.prix_total ? `${Number(reservation.prix_total).toLocaleString()} MAD` : '—'}
            valueStyle={{ color: C.success, fontWeight: '700' }}
          />
        </div>

        {/* Commentaire */}
        {reservation.commentaire && (
          <div style={{
            backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px 14px',
            fontSize: '13px', color: C.muted, marginBottom: '14px',
            borderLeft: `3px solid ${C.secondary}`,
          }}>
            <strong>Note :</strong> {reservation.commentaire}
          </div>
        )}

        {/* Bouton annuler */}
        {peutAnnuler && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onAnnuler(reservation.id)}
              disabled={cancelling === reservation.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: 'transparent',
                color: cancelling === reservation.id ? C.muted : C.danger,
                border: `1px solid ${cancelling === reservation.id ? C.border : C.danger}`,
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: cancelling === reservation.id ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (cancelling !== reservation.id) e.currentTarget.style.backgroundColor = '#fef2f2'; }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FaTimesCircle />
              {cancelling === reservation.id ? 'Annulation...' : 'Annuler la réservation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value, valueStyle = {} }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: C.muted, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
      <span style={{ color: C.secondary }}>{icon}</span> {label}
    </div>
    <div style={{ color: C.text, fontSize: '14px', fontWeight: '500', ...valueStyle }}>{value}</div>
  </div>
);

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [cancelling, setCancelling]     = useState(null);
  const [filtre, setFiltre]             = useState('tous');

  useEffect(() => {
    chargerReservations();
  }, []);

  const chargerReservations = async () => {
    setLoading(true);
    try {
      const res = await getMesReservations();
      setReservations(res.data || []);
    } catch {
      setError('Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnuler = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    setCancelling(id);
    try {
      await annulerReservation(id);
      setReservations((prev) =>
        prev.map((r) => r.id === id ? { ...r, statut: 'annulee' } : r)
      );
    } catch {
      alert('Impossible d\'annuler cette réservation. Veuillez réessayer.');
    } finally {
      setCancelling(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filtrage des réservations
  const reservationsFiltrees = filtre === 'tous'
    ? reservations
    : reservations.filter((r) => r.statut === filtre);

  // Compteurs pour les onglets
  const compteurs = {
    tous:       reservations.length,
    en_attente: reservations.filter((r) => r.statut === 'en_attente').length,
    confirmee:  reservations.filter((r) => r.statut === 'confirmee').length,
    annulee:    reservations.filter((r) => r.statut === 'annulee').length,
  };

  const onglets = [
    { key: 'tous',       label: 'Toutes',     color: C.primary },
    { key: 'en_attente', label: 'En attente', color: C.warning },
    { key: 'confirmee',  label: 'Confirmées', color: C.success },
    { key: 'annulee',    label: 'Annulées',   color: C.danger },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />

      {/* En-tête */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, padding: '40px 24px', color: C.white }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px', height: '64px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaUser style={{ fontSize: '28px' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
                {user?.prenom} {user?.nom}
              </h1>
              <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaEnvelope style={{ fontSize: '12px' }} /> {user?.email}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'rgba(231,76,60,0.85)',
            color: C.white, border: 'none', borderRadius: '8px',
            padding: '10px 20px', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer',
          }}>
            <FaSignOutAlt /> Déconnexion
          </button>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: '960px', margin: '32px auto', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
        {/* Carte profil */}
        <div style={{
          backgroundColor: C.white, borderRadius: '12px',
          padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          marginBottom: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
        }}>
          <ProfileInfo icon={<FaUser />} label="Nom complet" value={`${user?.prenom} ${user?.nom}`} />
          <ProfileInfo icon={<FaEnvelope />} label="Email" value={user?.email} />
          <ProfileInfo icon={<FaPhone />} label="Téléphone" value={user?.telephone || 'Non renseigné'} />
        </div>

        {/* Section réservations */}
        <div style={{ backgroundColor: C.white, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {/* Onglets filtres */}
          <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ margin: '0 0 16px', color: C.primary, fontSize: '18px', fontWeight: '700' }}>
              Mes réservations
            </h2>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {onglets.map(({ key, label, color }) => (
                <button key={key} onClick={() => setFiltre(key)} style={{
                  padding: '8px 16px',
                  backgroundColor: filtre === key ? color : 'transparent',
                  color: filtre === key ? C.white : C.muted,
                  border: `1px solid ${filtre === key ? color : C.border}`,
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: filtre === key ? '700' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '8px',
                }}>
                  {label} {compteurs[key] > 0 && `(${compteurs[key]})`}
                </button>
              ))}
            </div>
          </div>

          {/* Contenu */}
          <div style={{ padding: '20px 24px' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>
                Chargement de vos réservations...
              </div>
            )}

            {error && !loading && (
              <div style={{ backgroundColor: '#fef2f2', borderRadius: '8px', padding: '16px', color: C.danger, textAlign: 'center' }}>
                {error}
              </div>
            )}

            {!loading && !error && reservationsFiltrees.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reservationsFiltrees.map((r) => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    onAnnuler={handleAnnuler}
                    cancelling={cancelling}
                  />
                ))}
              </div>
            )}

            {!loading && !error && reservationsFiltrees.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <FaSearch style={{ fontSize: '40px', color: '#d1d5db', marginBottom: '16px' }} />
                <h3 style={{ color: C.primary, margin: '0 0 8px' }}>
                  {filtre === 'tous' ? 'Aucune réservation' : `Aucune réservation ${filtre === 'confirmee' ? 'confirmée' : filtre === 'en_attente' ? 'en attente' : 'annulée'}`}
                </h3>
                <p style={{ color: C.muted, margin: '0 0 20px', fontSize: '14px' }}>
                  {filtre === 'tous' ? 'Commencez par explorer nos hôtels.' : 'Essayez un autre filtre.'}
                </p>
                {filtre === 'tous' && (
                  <button onClick={() => navigate('/hotels')} style={{
                    backgroundColor: C.secondary, color: C.white,
                    border: 'none', borderRadius: '8px',
                    padding: '10px 24px', fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer',
                  }}>
                    Explorer les hôtels
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const ProfileInfo = ({ icon, label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2980B9', fontSize: '13px', fontWeight: '600' }}>
      {icon} {label}
    </div>
    <div style={{ color: '#374151', fontSize: '15px', fontWeight: '500' }}>{value}</div>
  </div>
);
