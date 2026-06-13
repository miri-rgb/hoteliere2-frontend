import { useState, useEffect } from 'react';
import { getAdminChambres, getAdminHotels, creerChambre, modifierChambre, supprimerChambre } from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import AdminSidebar from '../../components/admin/AdminSidebar';

const C = {
  primary: '#1B3A6B', secondary: '#2980B9', success: '#27AE60',
  danger: '#E74C3C', white: '#ffffff', bg: '#f5f5f5',
  border: '#dce1e7', text: '#374151', muted: '#6b7280',
};

const FORM_VIDE = { hotel_id: '', type_chambre_id: '', numero: '', etage: '', description: '', is_active: true };

const parseArray = (res) =>
  Array.isArray(res?.data?.data) ? res.data.data
  : Array.isArray(res?.data)     ? res.data
  : Array.isArray(res)           ? res : [];

export default function AdminChambresPage() {
  const [chambres, setChambres]   = useState([]);
  const [hotels, setHotels]       = useState([]);
  const [types, setTypes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [erreur, setErreur]       = useState('');
  const [toast, setToast]         = useState(null);
  const [modal, setModal]         = useState(null);
  const [chambreEdit, setChambreEdit] = useState(null);
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
      const [resChambres, resHotels] = await Promise.all([getAdminChambres(), getAdminHotels()]);
      const liste = parseArray(resChambres);
      setChambres(liste);
      setHotels(parseArray(resHotels));

      const typesUniques = [];
      const seen = new Set();
      liste.forEach((c) => {
        if (c.type_chambre && c.type_chambre.id && !seen.has(c.type_chambre.id)) {
          seen.add(c.type_chambre.id);
          typesUniques.push(c.type_chambre);
        } else if (c.typeChambre && c.typeChambre.id && !seen.has(c.typeChambre.id)) {
          seen.add(c.typeChambre.id);
          typesUniques.push(c.typeChambre);
        }
      });
      setTypes(typesUniques);
    } catch (e) {
      setErreur(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const ouvrirCreer = () => {
    setForm(FORM_VIDE);
    setFormErreur('');
    setModal('creer');
  };

  const ouvrirModifier = (c) => {
    setChambreEdit(c);
    setForm({
      hotel_id:        String(c.hotel_id || ''),
      type_chambre_id: String(c.type_chambre_id || c.typeChambre?.id || ''),
      numero:          c.numero || '',
      etage:           String(c.etage ?? ''),
      description:     c.description || '',
      is_active:       c.is_active !== undefined ? c.is_active : true,
    });
    setFormErreur('');
    setModal('modifier');
  };

  const fermerModal = () => { setModal(null); setChambreEdit(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hotel_id || !form.type_chambre_id || !form.numero.trim() || form.etage === '') {
      setFormErreur('Hôtel, type, numéro et étage sont obligatoires.');
      return;
    }
    setSubmitting(true);
    setFormErreur('');
    const payload = {
      hotel_id:        Number(form.hotel_id),
      type_chambre_id: Number(form.type_chambre_id),
      numero:          form.numero,
      etage:           Number(form.etage),
      description:     form.description,
      is_active:       form.is_active,
    };
    try {
      if (modal === 'creer') {
        await creerChambre(payload);
        showToast('success', 'Chambre créée avec succès');
      } else {
        await modifierChambre(chambreEdit.id, payload);
        showToast('success', 'Chambre modifiée avec succès');
      }
      fermerModal();
      charger();
    } catch (e) {
      setFormErreur(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupprimer = async (c) => {
    if (!window.confirm(`Supprimer la chambre n°${c.numero} ? Cette action est irréversible.`)) return;
    try {
      await supprimerChambre(c.id);
      showToast('success', `Chambre n°${c.numero} supprimée`);
      charger();
    } catch (e) {
      showToast('error', e.message || 'Erreur lors de la suppression');
    }
  };

  const nomType = (c) => c.typeChambre?.nom || c.type_chambre?.nom || c.typeChambre?.nom_type || '—';
  const nomHotel = (c) => c.hotel?.nom || hotels.find((h) => h.id === c.hotel_id)?.nom || '—';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: '32px', overflowX: 'auto' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ margin: 0, color: C.primary, fontSize: '24px', fontWeight: '800' }}>Gestion des chambres</h1>
              <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '14px' }}>
                {loading ? '…' : `${chambres.length} chambre${chambres.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button onClick={ouvrirCreer} style={{
              backgroundColor: C.primary, color: C.white,
              border: 'none', borderRadius: '8px', padding: '10px 20px',
              fontWeight: '600', cursor: 'pointer', fontSize: '14px',
            }}>+ Ajouter une chambre</button>
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

          {loading ? (
            <p style={{ textAlign: 'center', color: C.muted, padding: '60px' }}>Chargement...</p>
          ) : erreur ? (
            <Alerte msg={erreur} />
          ) : (
            <div style={{ backgroundColor: C.white, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: C.primary }}>
                    {['ID', 'Numéro', 'Étage', 'Hôtel', 'Type', 'Statut', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '14px 16px', color: C.white, fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chambres.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: C.muted }}>Aucune chambre enregistrée</td></tr>
                  ) : chambres.map((c, i) => (
                    <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? C.white : '#f9fafb', borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', color: C.muted, fontSize: '13px' }}>#{c.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: C.primary }}>{c.numero}</td>
                      <td style={{ padding: '12px 16px', color: C.text }}>{c.etage}</td>
                      <td style={{ padding: '12px 16px', color: C.text, fontSize: '13px' }}>{nomHotel(c)}</td>
                      <td style={{ padding: '12px 16px', color: C.text, fontSize: '13px' }}>{nomType(c)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge
                          label={c.is_active ? 'Actif' : 'Inactif'}
                          color={c.is_active ? C.success : C.muted}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <BtnAction label="Modifier"  color={C.secondary} onClick={() => ouvrirModifier(c)} />
                          <BtnAction label="Supprimer" color={C.danger}    onClick={() => handleSupprimer(c)} />
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

      {modal && (
        <Modal titre={modal === 'creer' ? 'Ajouter une chambre' : 'Modifier la chambre'} onClose={fermerModal}>
          {formErreur && <Alerte msg={formErreur} />}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Hôtel *</label>
              <select
                value={form.hotel_id}
                onChange={(e) => setForm((p) => ({ ...p, hotel_id: e.target.value }))}
                style={selectStyle}
              >
                <option value="">— Sélectionner un hôtel —</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.nom} ({h.ville})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type de chambre * (ID)</label>
              {types.length > 0 ? (
                <select
                  value={form.type_chambre_id}
                  onChange={(e) => setForm((p) => ({ ...p, type_chambre_id: e.target.value }))}
                  style={selectStyle}
                >
                  <option value="">— Sélectionner un type —</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.nom || t.nom_type} (ID: {t.id})</option>)}
                </select>
              ) : (
                <input
                  type="number" min="1"
                  value={form.type_chambre_id}
                  onChange={(e) => setForm((p) => ({ ...p, type_chambre_id: e.target.value }))}
                  placeholder="Ex: 1"
                  style={inputStyle}
                />
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Champ label="Numéro *" value={form.numero} onChange={(v) => setForm((p) => ({ ...p, numero: v }))} placeholder="Ex: 101" />
              <Champ label="Étage *"  value={form.etage}  onChange={(v) => setForm((p) => ({ ...p, etage: v }))}  placeholder="Ex: 1" type="number" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3} placeholder="Description de la chambre..."
                style={{ width: '100%', padding: '10px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="is_active" style={{ fontWeight: '600', fontSize: '13px', color: C.text, cursor: 'pointer' }}>Chambre active</label>
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

const labelStyle  = { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' };
const inputStyle  = { width: '100%', padding: '10px', border: '1px solid #dce1e7', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' };
const selectStyle = { width: '100%', padding: '10px', border: '1px solid #dce1e7', borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff' };
const btnPrimStyle = { backgroundColor: '#1B3A6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' };
const btnSecStyle  = { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' };

const Champ = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
    fontSize: '12px', fontWeight: '600', color: '#fff', backgroundColor: color,
  }}>{label}</span>
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
