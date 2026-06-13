import { useState, useEffect } from 'react';
import { getAdminUsers, toggleUserActif } from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import AdminSidebar from '../../components/admin/AdminSidebar';

const C = {
  primary: '#1B3A6B', secondary: '#2980B9', success: '#27AE60',
  danger: '#E74C3C', white: '#ffffff', bg: '#f5f5f5',
  border: '#dce1e7', text: '#374151', muted: '#6b7280',
};

const parseArray = (res) =>
  Array.isArray(res?.data?.data) ? res.data.data
  : Array.isArray(res?.data)     ? res.data
  : Array.isArray(res)           ? res : [];

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function AdminUsersPage() {
  const [users, setUsers]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [erreur, setErreur]               = useState('');
  const [toast, setToast]                 = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [recherche, setRecherche]         = useState('');

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const charger = async () => {
    setLoading(true);
    try {
      setUsers(parseArray(await getAdminUsers()));
    } catch (e) {
      setErreur(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const handleToggle = async (u) => {
    const action = u.is_active ? 'Désactiver' : 'Activer';
    if (!window.confirm(`${action} le compte de ${u.prenom} ${u.nom} ?`)) return;
    setActionLoading(u.id);
    try {
      await toggleUserActif(u.id);
      showToast('success', `Compte ${u.is_active ? 'désactivé' : 'activé'} avec succès`);
      charger();
    } catch (e) {
      showToast('error', e.message || 'Erreur lors de la modification');
    } finally {
      setActionLoading(null);
    }
  };

  const liste = recherche.trim()
    ? users.filter((u) => {
        const q = recherche.toLowerCase();
        return (
          (u.nom || '').toLowerCase().includes(q) ||
          (u.prenom || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        );
      })
    : users;

  const nbAdmins  = users.filter((u) => u.role === 'admin').length;
  const nbActifs  = users.filter((u) => u.is_active).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: '32px', overflowX: 'auto' }}>

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ margin: 0, color: C.primary, fontSize: '24px', fontWeight: '800' }}>Gestion des utilisateurs</h1>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '14px' }}>
              {users.length} utilisateur{users.length !== 1 ? 's' : ''} — {nbAdmins} admin{nbAdmins !== 1 ? 's' : ''} — {nbActifs} actif{nbActifs !== 1 ? 's' : ''}
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

          {/* Barre de recherche */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou email..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              style={{
                width: '100%', maxWidth: '400px', padding: '10px 16px',
                border: `1px solid ${C.border}`, borderRadius: '8px',
                fontSize: '14px', boxSizing: 'border-box',
              }}
            />
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
                    {['ID', 'Nom complet', 'Email', 'Rôle', 'Statut', 'Inscrit le', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '14px 16px', color: C.white, fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liste.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: C.muted }}>
                      {recherche ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'}
                    </td></tr>
                  ) : liste.map((u, i) => (
                    <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? C.white : '#f9fafb', borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', color: C.muted, fontSize: '13px' }}>#{u.id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: C.primary, fontSize: '14px' }}>
                          {u.prenom} {u.nom}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: C.text, fontSize: '13px' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge
                          label={u.role === 'admin' ? 'Admin' : 'Client'}
                          color={u.role === 'admin' ? C.primary : C.secondary}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge
                          label={u.is_active ? 'Actif' : 'Inactif'}
                          color={u.is_active ? C.success : C.danger}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', color: C.muted, fontSize: '13px' }}>{formatDate(u.created_at)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.role !== 'admin' ? (
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={actionLoading === u.id}
                            style={{
                              backgroundColor: u.is_active ? C.danger : C.success,
                              color: C.white, border: 'none', borderRadius: '6px',
                              padding: '6px 14px', fontSize: '13px',
                              cursor: actionLoading === u.id ? 'not-allowed' : 'pointer',
                              fontWeight: '500', opacity: actionLoading === u.id ? 0.7 : 1,
                            }}
                          >
                            {actionLoading === u.id ? '...' : (u.is_active ? 'Désactiver' : 'Activer')}
                          </button>
                        ) : (
                          <span style={{ color: C.muted, fontSize: '13px', fontStyle: 'italic' }}>Protégé</span>
                        )}
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

const Alerte = ({ msg }) => (
  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: '#E74C3C', fontSize: '13px', marginBottom: '16px' }}>
    {msg}
  </div>
);
