import { useState, useEffect } from 'react';
import { getAdminHotels, creerHotel, modifierHotel, supprimerHotel } from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import AdminSidebar from '../../components/admin/AdminSidebar';

const C = {
  primary: '#1B3A6B', secondary: '#2980B9', success: '#27AE60',
  danger: '#E74C3C', white: '#ffffff', bg: '#f5f5f5',
  border: '#dce1e7', text: '#374151', muted: '#6b7280',
};

const FORM_VIDE = { nom: '', ville: '', adresse: '', description: '', telephone: '', email: '', etoiles: 3 };

const parseArray = (res) =>
  Array.isArray(res?.data?.data) ? res.data.data
  : Array.isArray(res?.data)     ? res.data
  : Array.isArray(res)           ? res : [];

export default function AdminHotelsPage() {
  const [hotels, setHotels]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [erreur, setErreur]       = useState('');
  const [toast, setToast]         = useState(null);
  const [modal, setModal]         = useState(null);
  const [hotelEdit, setHotelEdit] = useState(null);
  const [form, setForm]           = useState(FORM_VIDE);
  const [submitting, setSubmitting] = useState(false);
  const [formErreur, setFormErreur] = useState('');

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const charger = async () => {
    setLoading(true);
    try {
      setHotels(parseArray(await getAdminHotels()));
    } catch (e) {
      setErreur(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const ouvrirCreer = () => { setForm(FORM_VIDE); setFormErreur(''); setModal('creer'); };

  const ouvrirModifier = (h) => {
    setHotelEdit(h);
    setForm({ nom: h.nom || '', ville: h.ville || '', adresse: h.adresse || '',
              description: h.description || '', telephone: h.telephone || '',
              email: h.email || '', etoiles: h.etoiles || 3 });
    setFormErreur('');
    setModal('modifier');
  };

  const fermerModal = () => { setModal(null); setHotelEdit(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.ville.trim() || !form.adresse.trim()) {
      setFormErreur('Nom, ville et adresse sont obligatoires.');
      return;
    }
    setSubmitting(true);
    setFormErreur('');
    try {
      if (modal === 'creer') {
        await creerHotel(form);
        showToast('success', 'Hôtel créé avec succès');
      } else {
        await modifierHotel(hotelEdit.id, form);
        showToast('success', 'Hôtel modifié avec succès');
      }
      fermerModal();
      charger();
    } catch (e) {
      setFormErreur(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupprimer = async (h) => {
    if (!window.confirm(`Supprimer l'hôtel "${h.nom}" ? Cette action est irréversible.`)) return;
    try {
      await supprimerHotel(h.id);
      showToast('success', `Hôtel "${h.nom}" supprimé`);
      charger();
    } catch (e) {
      showToast('error', e.message || 'Erreur lors de la suppression');
    }
  };

  const champ = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: '32px', overflowX: 'auto' }}>

          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ margin: 0, color: C.primary, fontSize: '24px', fontWeight: '800' }}>Gestion des hôtels</h1>
              <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '14px' }}>
                {loading ? '…' : `${hotels.length} hôtel${hotels.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button onClick={ouvrirCreer} style={{
              backgroundColor: C.primary, color: C.white,
              border: 'none', borderRadius: '8px', padding: '10px 20px',
              fontWeight: '600', cursor: 'pointer', fontSize: '14px',
            }}>+ Ajouter un hôtel</button>
          </div>

          {/* Toast */}
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

          {loading ? (
            <p style={{ textAlign: 'center', color: C.muted, padding: '60px' }}>Chargement...</p>
          ) : erreur ? (
            <Alerte msg={erreur} />
          ) : (
            <div style={{ backgroundColor: C.white, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: C.primary }}>
                    {['ID', 'Photo', 'Nom', 'Ville', 'Étoiles', 'Téléphone', 'Email', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '14px 16px', color: C.white, fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hotels.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: C.muted }}>Aucun hôtel enregistré</td></tr>
                  ) : hotels.map((h, i) => (
                    <tr key={h.id} style={{ backgroundColor: i % 2 === 0 ? C.white : '#f9fafb', borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', color: C.muted, fontSize: '13px' }}>#{h.id}</td>
                      <td style={{ padding: '8px 16px' }}>
                        {h.image ? (
                          <img
                            src={h.image}
                            alt={h.nom}
                            style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '60px', height: '40px', borderRadius: '4px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏨</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: C.primary }}>{h.nom}</td>
                      <td style={{ padding: '12px 16px', color: C.text }}>{h.ville}</td>
                      <td style={{ padding: '12px 16px' }}>{'⭐'.repeat(h.etoiles || 0)}</td>
                      <td style={{ padding: '12px 16px', color: C.text, fontSize: '13px' }}>{h.telephone || '—'}</td>
                      <td style={{ padding: '12px 16px', color: C.text, fontSize: '13px' }}>{h.email || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <BtnAction label="Modifier"   color={C.secondary} onClick={() => ouvrirModifier(h)} />
                          <BtnAction label="Supprimer"  color={C.danger}    onClick={() => handleSupprimer(h)} />
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

      {/* Modal */}
      {modal && (
        <Modal titre={modal === 'creer' ? 'Ajouter un hôtel' : "Modifier l'hôtel"} onClose={fermerModal}>
          {formErreur && <Alerte msg={formErreur} />}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Champ label="Nom *"        value={form.nom}         onChange={champ('nom')}         placeholder="Ex: Hôtel Atlas" />
            <Champ label="Ville *"      value={form.ville}       onChange={champ('ville')}       placeholder="Ex: Marrakech" />
            <Champ label="Adresse *"    value={form.adresse}     onChange={champ('adresse')}     placeholder="Ex: 12 Avenue Mohammed V" />
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3} placeholder="Description de l'hôtel..."
                style={{ width: '100%', padding: '10px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Champ label="Téléphone" value={form.telephone} onChange={champ('telephone')} placeholder="+212..." />
              <Champ label="Email"     value={form.email}     onChange={champ('email')}     placeholder="hotel@example.ma" type="email" />
            </div>
            <div>
              <label style={labelStyle}>Étoiles *</label>
              <select value={form.etoiles} onChange={(e) => setForm((p) => ({ ...p, etoiles: Number(e.target.value) }))}
                style={{ width: '100%', padding: '10px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '14px' }}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" onClick={fermerModal} style={btnSecStyle}>Annuler</button>
              <button type="submit" disabled={submitting} style={{ ...btnPrimStyle, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Enregistrement...' : (modal === 'creer' ? 'Créer' : 'Modifier')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' };
const btnPrimStyle = { backgroundColor: '#1B3A6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' };
const btnSecStyle  = { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' };

const Champ = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '10px', border: '1px solid #dce1e7', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
    />
  </div>
);

const BtnAction = ({ label, color, onClick }) => (
  <button onClick={onClick} style={{
    backgroundColor: color, color: '#fff', border: 'none', borderRadius: '6px',
    padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '500',
  }}>{label}</button>
);

const Alerte = ({ msg }) => (
  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: '#E74C3C', fontSize: '13px', marginBottom: '16px' }}>
    {msg}
  </div>
);

const Modal = ({ titre, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '24px' }}>
    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1B3A6B', fontSize: '20px', fontWeight: '700' }}>{titre}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);
