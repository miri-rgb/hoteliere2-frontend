// ============================================================
// DASHBOARD ADMIN — Hôtelière 2.0
// Statistiques + Réservations + Utilisateurs + Hôtels
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers, FaCalendarCheck, FaClock, FaCheckCircle,
  FaHotel, FaSignOutAlt, FaSync, FaTimesCircle,
  FaTachometerAlt, FaStar, FaMapMarkerAlt, FaEye,
  FaFlagCheckered
} from 'react-icons/fa';
import {
  getAdminUsers,
  getAdminReservations,
  getAdminHotels,
  confirmerReservation,
  getStatistiques,
} from '../services/api';
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
  return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Badge statut réservation
const StatutBadge = ({ statut }) => {
  const configs = {
    confirmee:  { label: 'Confirmée',  bg: '#f0fdf4', color: '#15803d' },
    en_attente: { label: 'En attente', bg: '#fffbeb', color: '#b45309' },
    annulee:    { label: 'Annulée',    bg: '#fef2f2', color: '#dc2626' },
  };
  const cfg = configs[statut] || { label: statut, bg: '#f3f4f6', color: C.muted };
  return (
    <span style={{
      backgroundColor: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '12px',
      fontSize: '12px', fontWeight: '600',
    }}>
      {cfg.label}
    </span>
  );
};

// Carte statistique
const StatCard = ({ icon, label, value, color, bg }) => (
  <div style={{
    backgroundColor: C.white,
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderTop: `4px solid ${color}`,
  }}>
    <div style={{
      width: '52px', height: '52px',
      backgroundColor: bg,
      borderRadius: '12px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color, fontSize: '22px' }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: C.primary }}>{value}</div>
      <div style={{ fontSize: '13px', color: C.muted, fontWeight: '500' }}>{label}</div>
    </div>
  </div>
);

/**
 * Parse une réponse API Laravel quelle que soit sa structure :
 *   - tableau brut          : [...]
 *   - collection simple     : { data: [...] }
 *   - paginée plate         : { data: [...], total: N, current_page: 1, ... }
 *   - paginée encapsulée    : { data: { data: [...], total: N, ... } }
 *   - Resource + meta       : { data: [...], meta: { total: N } }
 *
 * Retourne { items: Array, total: number }
 * → items  : les enregistrements à afficher dans les tableaux
 * → total  : le vrai total en BDD (depuis les métadonnées), pas array.length
 */
const parseReponse = (res) => {
  let items = [];
  let total = null;

  if (Array.isArray(res)) {
    items = res;
  } else if (Array.isArray(res?.data)) {
    // { data: [...], total?: N, meta?: { total: N } }
    items = res.data;
    total = res.total ?? res.meta?.total ?? null;
  } else if (res?.data && typeof res.data === 'object') {
    // { data: { data: [...], total: N, ... } }
    items = Array.isArray(res.data.data) ? res.data.data : [];
    total = res.data.total ?? res.data.meta?.total ?? null;
  }

  return {
    items,
    total: total !== null ? Number(total) : items.length,
  };
};

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [onglet, setOnglet] = useState('reservations');
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [data, setData] = useState({ reservations: [], users: [], hotels: [] });
  const [meta, setMeta] = useState({ totalUsers: 0, totalReservations: 0, totalHotels: 0 });
  const [apiStats, setApiStats] = useState(null);

  const chargerStats = async () => {
    setLoadingStats(true);
    try {
      const res = await getStatistiques();
      const s = res.data;
      setApiStats(s);

      // Vérification cohérence réservations
      const somme = s.reservations.en_attente + s.reservations.confirmee
                  + s.reservations.annulee    + s.reservations.terminee;
      if (somme !== s.reservations.total) {
        console.warn(
          `[Admin] Incohérence stats réservations : ` +
          `${s.reservations.en_attente} + ${s.reservations.confirmee} + ` +
          `${s.reservations.annulee} + ${s.reservations.terminee} = ${somme} ≠ ${s.reservations.total}`
        );
      }
    } catch (err) {
      console.error('[Admin] Erreur stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const [resR, resU, resH] = await Promise.all([
        getAdminReservations(),
        getAdminUsers(),
        getAdminHotels(),
      ]);

      const parsedR = parseReponse(resR);
      const parsedU = parseReponse(resU);
      const parsedH = parseReponse(resH);

      setData({
        reservations: parsedR.items,
        users:        parsedU.items,
        hotels:       parsedH.items,
      });
      setMeta({
        totalReservations: parsedR.total,
        totalUsers:        parsedU.total,
        totalHotels:       parsedH.total,
      });
    } catch (err) {
      console.error('Erreur chargement admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const tout_actualiser = () => { chargerStats(); chargerDonnees(); };

  useEffect(() => { chargerStats(); chargerDonnees(); }, []);

  const handleConfirmer = async (id) => {
    setConfirming(id);
    try {
      await confirmerReservation(id);
      setData((prev) => ({
        ...prev,
        reservations: prev.reservations.map((r) =>
          r.id === id ? { ...r, statut: 'confirmee' } : r
        ),
      }));
    } catch {
      alert('Impossible de confirmer cette réservation.');
    } finally {
      setConfirming(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const s = apiStats; // alias court

  const onglets = [
    { key: 'reservations', label: 'Réservations', icon: <FaCalendarCheck />, count: meta.totalReservations },
    { key: 'users',        label: 'Utilisateurs', icon: <FaUsers />,         count: meta.totalUsers },
    { key: 'hotels',       label: 'Hôtels',       icon: <FaHotel />,         count: meta.totalHotels },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />

      {/* En-tête admin */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary}, #1a365d)`, padding: '32px 24px', color: C.white }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaTachometerAlt style={{ fontSize: '28px', color: '#93C5FD' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Dashboard Administrateur</h1>
              <p style={{ margin: '4px 0 0', opacity: 0.75, fontSize: '14px' }}>
                Bienvenue, {user?.prenom} {user?.nom}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={tout_actualiser} disabled={loading || loadingStats} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: C.white, border: 'none', borderRadius: '8px',
              padding: '9px 16px', fontSize: '13px', cursor: 'pointer',
            }}>
              <FaSync style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Actualiser
            </button>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'rgba(231,76,60,0.8)',
              color: C.white, border: 'none', borderRadius: '8px',
              padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}>
              <FaSignOutAlt /> Déconnexion
            </button>
          </div>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: '1200px', margin: '32px auto', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
        {/* ── Cartes statistiques — Ligne 1 : totaux ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <StatCard
            icon={<FaUsers />}
            label="Utilisateurs"
            value={loadingStats ? '…' : s?.users.total ?? '—'}
            color="#2980B9" bg="#EFF6FF"
          />
          <StatCard
            icon={<FaHotel />}
            label="Hôtels"
            value={loadingStats ? '…' : s?.hotels.total ?? '—'}
            color="#1B3A6B" bg="#E8EEF7"
          />
          <StatCard
            icon={<FaCalendarCheck />}
            label="Réservations"
            value={loadingStats ? '…' : s?.reservations.total ?? '—'}
            color="#8e44ad" bg="#F5EEF8"
          />
        </div>

        {/* ── Cartes statistiques — Ligne 2 : statuts réservations ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard
            icon={<FaClock />}
            label="En attente"
            value={loadingStats ? '…' : s?.reservations.en_attente ?? '—'}
            color="#F39C12" bg="#FFFBEB"
          />
          <StatCard
            icon={<FaCheckCircle />}
            label="Confirmées"
            value={loadingStats ? '…' : s?.reservations.confirmee ?? '—'}
            color="#27AE60" bg="#F0FDF4"
          />
          <StatCard
            icon={<FaTimesCircle />}
            label="Annulées"
            value={loadingStats ? '…' : s?.reservations.annulee ?? '—'}
            color="#E74C3C" bg="#FEF2F2"
          />
          <StatCard
            icon={<FaFlagCheckered />}
            label="Terminées"
            value={loadingStats ? '…' : s?.reservations.terminee ?? '—'}
            color="#95a5a6" bg="#F3F4F6"
          />
        </div>

        {/* Onglets */}
        <div style={{ backgroundColor: C.white, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {/* Barre d'onglets */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 24px', overflowX: 'auto' }}>
            {onglets.map(({ key, label, icon, count }) => (
              <button
                key={key}
                onClick={() => setOnglet(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '16px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: onglet === key ? `3px solid ${C.primary}` : '3px solid transparent',
                  color: onglet === key ? C.primary : C.muted,
                  fontWeight: onglet === key ? '700' : '400',
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {icon} {label}
                <span style={{
                  backgroundColor: onglet === key ? C.primary : '#e5e7eb',
                  color: onglet === key ? C.white : C.muted,
                  borderRadius: '10px', padding: '1px 8px', fontSize: '12px', fontWeight: '700',
                }}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Contenu des onglets */}
          <div style={{ padding: '24px' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '48px', color: C.muted }}>
                <FaSync style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
                <p>Chargement des données...</p>
              </div>
            )}

            {/* ===== ONGLET RÉSERVATIONS ===== */}
            {!loading && onglet === 'reservations' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {['#', 'Client', 'Hôtel / Chambre', 'Dates', 'Personnes', 'Total', 'Statut', 'Actions'].map((h) => (
                        <th key={h} style={{
                          padding: '12px 14px', textAlign: 'left',
                          color: C.muted, fontWeight: '600', fontSize: '12px',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          borderBottom: `1px solid ${C.border}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.reservations.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: C.muted }}>Aucune réservation.</td></tr>
                    ) : data.reservations.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                      >
                        <td style={{ padding: '12px 14px', color: C.muted, fontSize: '12px' }}>#{r.id}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '600', color: C.primary }}>
                            {r.client?.prenom || r.user?.prenom || '?'} {r.client?.nom || r.user?.nom || ''}
                          </div>
                          <div style={{ color: C.muted, fontSize: '12px' }}>
                            {r.client?.email || r.user?.email || ''}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '500', color: C.text }}>
                            {r.chambre?.hotel?.nom || '—'}
                          </div>
                          <div style={{ color: C.muted, fontSize: '12px' }}>
                            Chambre {r.chambre?.numero || '?'} ({r.chambre?.type || 'Standard'})
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: C.text, fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {formatDate(r.date_arrivee)} →<br />{formatDate(r.date_depart)}
                        </td>
                        <td style={{ padding: '12px 14px', color: C.text, textAlign: 'center' }}>
                          {r.nb_personnes || 1}
                        </td>
                        <td style={{ padding: '12px 14px', color: C.success, fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {r.prix_total ? `${Number(r.prix_total).toLocaleString()} MAD` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <StatutBadge statut={r.statut} />
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {r.statut === 'en_attente' && (
                            <button
                              onClick={() => handleConfirmer(r.id)}
                              disabled={confirming === r.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                backgroundColor: confirming === r.id ? '#d1fae5' : C.success,
                                color: C.white, border: 'none', borderRadius: '6px',
                                padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                                cursor: confirming === r.id ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <FaCheckCircle />
                              {confirming === r.id ? '...' : 'Confirmer'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ===== ONGLET UTILISATEURS ===== */}
            {!loading && onglet === 'users' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {['#', 'Nom complet', 'Email', 'Téléphone', 'Rôle', 'Inscrit le'].map((h) => (
                        <th key={h} style={{
                          padding: '12px 14px', textAlign: 'left',
                          color: C.muted, fontWeight: '600', fontSize: '12px',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          borderBottom: `1px solid ${C.border}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: C.muted }}>Aucun utilisateur.</td></tr>
                    ) : data.users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                      >
                        <td style={{ padding: '12px 14px', color: C.muted, fontSize: '12px' }}>#{u.id}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px',
                              backgroundColor: C.primary,
                              borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: C.white, fontWeight: '700', fontSize: '14px',
                              flexShrink: 0,
                            }}>
                              {(u.prenom || '?')[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: C.primary }}>{u.prenom} {u.nom}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: C.text }}>{u.email}</td>
                        <td style={{ padding: '12px 14px', color: C.muted }}>{u.telephone || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            backgroundColor: u.role === 'admin' ? '#EFF6FF' : '#f0fdf4',
                            color: u.role === 'admin' ? C.secondary : C.success,
                            padding: '3px 10px', borderRadius: '12px',
                            fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
                          }}>
                            {u.role === 'admin' ? '👑 Admin' : '👤 Client'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: C.muted, fontSize: '13px' }}>
                          {formatDate(u.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ===== ONGLET HÔTELS ===== */}
            {!loading && onglet === 'hotels' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {data.hotels.length === 0 ? (
                  <p style={{ color: C.muted, gridColumn: '1/-1', textAlign: 'center', padding: '32px' }}>Aucun hôtel.</p>
                ) : data.hotels.map((hotel) => (
                  <div key={hotel.id} style={{
                    backgroundColor: '#f8fafc',
                    border: `1px solid ${C.border}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {/* Header coloré */}
                    <div style={{
                      background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                      padding: '14px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ color: C.white, fontWeight: '700', fontSize: '14px' }}>{hotel.nom}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <FaStar key={i} style={{ color: i <= hotel.etoiles ? '#F39C12' : 'rgba(255,255,255,0.3)', fontSize: '11px' }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.muted, fontSize: '13px' }}>
                        <FaMapMarkerAlt style={{ color: C.secondary }} /> {hotel.ville}, Maroc
                      </div>
                      {hotel.description && (
                        <p style={{ margin: 0, color: C.text, fontSize: '13px', lineHeight: '1.4',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {hotel.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ color: C.primary, fontWeight: '700', fontSize: '15px' }}>
                          {hotel.prix_min ? `Dès ${hotel.prix_min} MAD` : 'Prix variable'}
                        </span>
                        <button onClick={() => navigate(`/hotels/${hotel.id}`)} style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          backgroundColor: C.secondary, color: C.white,
                          border: 'none', borderRadius: '6px',
                          padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                          cursor: 'pointer',
                        }}>
                          <FaEye /> Voir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
