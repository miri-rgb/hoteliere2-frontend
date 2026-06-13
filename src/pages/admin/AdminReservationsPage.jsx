import { useState, useEffect } from 'react';
import { getAdminReservations, confirmerReservation, annulerReservationAdmin } from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import AdminSidebar from '../../components/admin/AdminSidebar';

const C = {
  primary: '#1B3A6B', secondary: '#2980B9', success: '#27AE60',
  danger: '#E74C3C', warning: '#F39C12', white: '#ffffff', bg: '#f5f5f5',
  border: '#dce1e7', text: '#374151', muted: '#6b7280',
};

const STATUTS = [
  { key: 'tous',       label: 'Toutes' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'confirmee',  label: 'Confirmées' },
  { key: 'annulee',    label: 'Annulées' },
  { key: 'terminee',   label: 'Terminées' },
];

const BADGE_COLORS = {
  en_attente: C.warning,
  confirmee:  C.success,
  annulee:    C.danger,
  terminee:   '#95a5a6',
};

const BADGE_LABELS = {
  en_attente: 'En attente',
  confirmee:  'Confirmée',
  annulee:    'Annulée',
  terminee:   'Terminée',
};

const parseArray = (res) =>
  Array.isArray(res?.data?.data) ? res.data.data
  : Array.isArray(res?.data)     ? res.data
  : Array.isArray(res)           ? res : [];

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [erreur, setErreur]             = useState('');
  const [toast, setToast]               = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [actionLoading, setActionLoading] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const charger = async () => {
    setLoading(true);
    try {
      setReservations(parseArray(await getAdminReservations()));
    } catch (e) {
      setErreur(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const handleConfirmer = async (r) => {
    if (!window.confirm(`Confirmer la réservation #${r.id} ?`)) return;
    setActionLoading(r.id + '_confirmer');
    try {
      await confirmerReservation(r.id);
      showToast('success', `Réservation #${r.id} confirmée`);
      charger();
    } catch (e) {
      showToast('error', e.message || 'Erreur lors de la confirmation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAnnuler = async (r) => {
    if (!window.confirm(`Annuler la réservation #${r.id} ? Cette action est irréversible.`)) return;
    setActionLoading(r.id + '_annuler');
    try {
      await annulerReservationAdmin(r.id);
      showToast('success', `Réservation #${r.id} annulée`);
      charger();
    } catch (e) {
      showToast('error', e.message || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(null);
    }
  };

  const liste = filtreStatut === 'tous'
    ? reservations
    : reservations.filter((r) => r.statut === filtreStatut);

  const comptePar = (statut) => reservations.filter((r) => r.statut === statut).length;

  const nomClient = (r) => {
    const u = r.user || r.utilisateur || r.client;
    if (!u) return `#${r.user_id}`;
    return `${u.prenom || ''} ${u.nom || ''}`.trim() || u.email || `#${r.user_id}`;
  };

  const infoChambre = (r) => {
    const ch = r.chambre;
    if (!ch) return `#${r.chambre_id}`;
    return `N°${ch.numero}${ch.hotel ? ` — ${ch.hotel.nom}` : ''}`;
  };

  const montant = (r) => {
    const val = r.prix_total ?? r.montant_total;
    if (val != null) return `${Number(val).toLocaleString('fr-MA')} MAD`;
    return '—';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: '32px', overflowX: 'auto' }}>

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ margin: 0, color: C.primary, fontSize: '24px', fontWeight: '800' }}>Gestion des réservations</h1>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '14px' }}>
              {loading ? '…' : `${reservations.length} réservation${reservations.length !== 1 ? 's' : ''} au total`}
            </p>
          </div>

          {toast && (
            <div style={{
              position: 'fixed', top: '80px', right: '24px', zIndex: 1000,
              backgroundColor: toast.type === 'success' ? C.success : C.danger,
              color: C.white, padding: '14px 20px', borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontWeight: '600', fontSize: '14px',
            }}>
              {toast.type === 'success' ? '✓ ' : '✗ '}{toast.msg}
            </div>
          )}

          {/* Filtres par statut */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {STATUTS.map((s) => {
              const count = s.key === 'tous' ? reservations.length : comptePar(s.key);
              const active = filtreStatut === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setFiltreStatut(s.key)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    border: `2px solid ${active ? C.primary : C.border}`,
                    backgroundColor: active ? C.primary : C.white,
                    color: active ? C.white : C.text,
                    fontWeight: active ? '700' : '400',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {s.label} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: C.muted, padding: '60px' }}>Chargement...</p>
          ) : erreur ? (
            <Alerte msg={erreur} />
          ) : (
            <div style={{ backgroundColor: C.white, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: C.primary }}>
                    {['ID', 'Client', 'Chambre', 'Arrivée', 'Départ', 'Montant', 'Statut', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '14px 16px', color: C.white, fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liste.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: C.muted }}>Aucune réservation</td></tr>
                  ) : liste.map((r, i) => (
                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? C.white : '#f9fafb', borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', color: C.muted, fontSize: '13px' }}>#{r.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: C.primary, fontSize: '13px' }}>{nomClient(r)}</td>
                      <td style={{ padding: '12px 16px', color: C.text, fontSize: '13px' }}>{infoChambre(r)}</td>
                      <td style={{ padding: '12px 16px', color: C.text, fontSize: '13px' }}>{formatDate(r.date_arrivee)}</td>
                      <td style={{ padding: '12px 16px', color: C.text, fontSize: '13px' }}>{formatDate(r.date_depart)}</td>
                      <td style={{ padding: '12px 16px', color: C.success, fontSize: '13px', fontWeight: '700' }}>{montant(r)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge
                          label={BADGE_LABELS[r.statut] || r.statut}
                          color={BADGE_COLORS[r.statut] || C.muted}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {r.statut === 'en_attente' && (
                            <BtnAction
                              label={actionLoading === r.id + '_confirmer' ? '...' : 'Confirmer'}
                              color={C.success}
                              onClick={() => handleConfirmer(r)}
                              disabled={actionLoading !== null}
                            />
                          )}
                          {(r.statut === 'en_attente' || r.statut === 'confirmee') && (
                            <BtnAction
                              label={actionLoading === r.id + '_annuler' ? '...' : 'Annuler'}
                              color={C.danger}
                              onClick={() => handleAnnuler(r)}
                              disabled={actionLoading !== null}
                            />
                          )}
                          {r.statut !== 'en_attente' && r.statut !== 'confirmee' && (
                            <span style={{ color: C.muted, fontSize: '13px', fontStyle: 'italic' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const Badge = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
    fontSize: '12px', fontWeight: '600', color: '#fff', backgroundColor: color,
  }}>{label}</span>
);

const BtnAction = ({ label, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      backgroundColor: color, color: '#fff', border: 'none', borderRadius: '6px',
      padding: '6px 14px', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: '500', opacity: disabled ? 0.7 : 1,
    }}
  >{label}</button>
);

const Alerte = ({ msg }) => (
  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: '#E74C3C', fontSize: '13px', marginBottom: '16px' }}>
    {msg}
  </div>
);
