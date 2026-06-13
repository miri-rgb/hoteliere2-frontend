// ============================================================
// PAGE RÉSERVATION — Hôtelière 2.0
// Formulaire de réservation avec calcul du prix en temps réel
// Gestion erreur 409 (chambre déjà occupée)
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHotel, FaBed, FaUsers, FaCalendarAlt, FaMoneyBillWave,
  FaCheckCircle, FaArrowLeft, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import { creerReservation, getChambresDisponibles } from '../services/api';
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

// Calcule le nombre de nuits entre deux dates
const nbNuits = (arrivee, depart) => {
  if (!arrivee || !depart) return 0;
  const diff = new Date(depart) - new Date(arrivee);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function ReservationPage() {
  const { chambreId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  // Données transmises depuis la page détail hôtel
  const stateData = location.state || {};
  const chambre   = stateData.chambre || null;
  const hotel     = stateData.hotel   || null;
  const datesInit = stateData.dates   || {};

  const [form, setForm] = useState({
    date_arrivee:  datesInit.date_arrivee || '',
    date_depart:   datesInit.date_depart  || '',
    nb_personnes:  1,
    commentaire:   '',
  });

  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');
  const [errorType, setErrorType] = useState(''); // 'conflict' | 'generic'

  const nuits    = nbNuits(form.date_arrivee, form.date_depart);
  const prixUnit = chambre?.prix_nuit || 0;
  const prixTotal = nuits * prixUnit;

  const handleChange = (e) => {
    setError('');
    setErrorType('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorType('');

    if (!form.date_arrivee || !form.date_depart) {
      setError('Veuillez sélectionner les dates d\'arrivée et de départ.');
      return;
    }
    if (nuits <= 0) {
      setError('La date de départ doit être après la date d\'arrivée.');
      return;
    }
    if (form.nb_personnes < 1) {
      setError('Le nombre de personnes doit être au moins 1.');
      return;
    }

    setLoading(true);
    try {
      const res = await creerReservation({
        chambre_id:   Number(chambreId),
        date_arrivee: form.date_arrivee,
        date_depart:  form.date_depart,
        nb_personnes: Number(form.nb_personnes),
        commentaire:  form.commentaire || null,
      });
      const reservationId = res?.data?.id ?? res?.id;
      if (reservationId) {
        navigate(`/paiement/${reservationId}`);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      if (err.status === 409) {
        setErrorType('conflict');
        setError('Cette chambre est déjà occupée pour ces dates. Veuillez choisir d\'autres dates ou une autre chambre.');
      } else if (err.status === 422) {
        const msgs = err.data?.errors
          ? Object.values(err.data.errors).flat().join(' ')
          : 'Dates ou données invalides.';
        setError(msgs);
      } else {
        setErrorType('generic');
        setError(err.message || 'Une erreur est survenue lors de la réservation.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Écran de succès
  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{
          backgroundColor: C.white,
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          padding: '56px 48px',
          textAlign: 'center',
          maxWidth: '480px',
          width: '100%',
        }}>
          <div style={{
            width: '80px', height: '80px',
            backgroundColor: '#f0fdf4',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FaCheckCircle style={{ color: C.success, fontSize: '40px' }} />
          </div>
          <h2 style={{ color: C.primary, margin: '0 0 12px', fontSize: '24px', fontWeight: '800' }}>
            Réservation confirmée !
          </h2>
          <p style={{ color: C.muted, margin: '0 0 8px', fontSize: '15px', lineHeight: '1.6' }}>
            Votre réservation à <strong style={{ color: C.primary }}>{hotel?.nom || 'l\'hôtel'}</strong> a bien été enregistrée.
          </p>
          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '10px',
            padding: '16px',
            margin: '20px 0',
            fontSize: '14px',
            color: C.text,
          }}>
            <p style={{ margin: '0 0 6px' }}>📅 Du <strong>{formatDate(form.date_arrivee)}</strong></p>
            <p style={{ margin: '0 0 6px' }}>📅 Au <strong>{formatDate(form.date_depart)}</strong></p>
            <p style={{ margin: 0 }}>💰 Total : <strong style={{ color: C.success }}>{prixTotal.toLocaleString()} MAD</strong></p>
          </div>
          <p style={{ color: C.muted, fontSize: '13px', margin: '0 0 24px' }}>
            Votre réservation est en attente de confirmation par l'hôtel.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/profile')} style={{
              backgroundColor: C.primary, color: C.white,
              border: 'none', borderRadius: '8px',
              padding: '12px 24px', fontSize: '15px', fontWeight: '600',
              cursor: 'pointer',
            }}>
              Voir mes réservations
            </button>
            <button onClick={() => navigate('/hotels')} style={{
              backgroundColor: C.white, color: C.primary,
              border: `1px solid ${C.border}`, borderRadius: '8px',
              padding: '12px 24px', fontSize: '15px', fontWeight: '600',
              cursor: 'pointer',
            }}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />

      {/* En-tête page */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, padding: '32px 24px', color: C.white }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button onClick={() => navigate(-1)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: C.white, borderRadius: '8px', padding: '8px 16px',
            cursor: 'pointer', marginBottom: '16px', fontSize: '14px',
          }}>
            <FaArrowLeft /> Retour
          </button>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800' }}>Finaliser votre réservation</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '14px' }}>
            {hotel?.nom} — {chambre ? `Chambre ${chambre.numero} (${chambre.type || 'Standard'})` : `Chambre #${chambreId}`}
          </p>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: '900px', margin: '32px auto', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '28px' }}>

          {/* Formulaire */}
          <div style={{ backgroundColor: C.white, borderRadius: '12px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 24px', color: C.primary, fontSize: '18px', fontWeight: '700' }}>
              Détails de votre séjour
            </h2>

            {/* Erreur */}
            {error && (
              <div style={{
                backgroundColor: errorType === 'conflict' ? '#fffbeb' : '#fef2f2',
                border: `1px solid ${errorType === 'conflict' ? C.warning : C.danger}`,
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}>
                <FaExclamationTriangle style={{ color: errorType === 'conflict' ? C.warning : C.danger, marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, color: errorType === 'conflict' ? '#92400e' : C.danger, fontWeight: '600', fontSize: '14px' }}>
                    {errorType === 'conflict' ? 'Chambre non disponible' : 'Erreur de réservation'}
                  </p>
                  <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '13px' }}>{error}</p>
                  {errorType === 'conflict' && (
                    <button onClick={() => navigate(`/hotels/${hotel?.id || ''}`)} style={{
                      marginTop: '8px', background: 'none', border: 'none',
                      color: C.secondary, cursor: 'pointer', fontSize: '13px',
                      textDecoration: 'underline', padding: 0,
                    }}>
                      ← Choisir une autre chambre
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: C.text, fontWeight: '500', fontSize: '14px' }}>
                    <FaCalendarAlt style={{ marginRight: '6px', color: C.secondary }} />
                    Date d'arrivée *
                  </label>
                  <input
                    type="date"
                    name="date_arrivee"
                    value={form.date_arrivee}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: `1px solid ${C.border}`, borderRadius: '8px',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.target.style.borderColor = C.secondary}
                    onBlur={(e) => e.target.style.borderColor = C.border}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: C.text, fontWeight: '500', fontSize: '14px' }}>
                    <FaCalendarAlt style={{ marginRight: '6px', color: C.secondary }} />
                    Date de départ *
                  </label>
                  <input
                    type="date"
                    name="date_depart"
                    value={form.date_depart}
                    onChange={handleChange}
                    min={form.date_arrivee || new Date().toISOString().split('T')[0]}
                    required
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: `1px solid ${C.border}`, borderRadius: '8px',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.target.style.borderColor = C.secondary}
                    onBlur={(e) => e.target.style.borderColor = C.border}
                  />
                </div>
              </div>

              {/* Nombre de personnes */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: C.text, fontWeight: '500', fontSize: '14px' }}>
                  <FaUsers style={{ marginRight: '6px', color: C.secondary }} />
                  Nombre de personnes *
                </label>
                <input
                  type="number"
                  name="nb_personnes"
                  value={form.nb_personnes}
                  onChange={handleChange}
                  min="1"
                  max={chambre?.capacite || 10}
                  required
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: `1px solid ${C.border}`, borderRadius: '8px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {chambre?.capacite && (
                  <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '12px' }}>
                    <FaInfoCircle style={{ marginRight: '4px' }} />
                    Capacité maximale : {chambre.capacite} personnes
                  </p>
                )}
              </div>

              {/* Commentaire */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: C.text, fontWeight: '500', fontSize: '14px' }}>
                  Demandes spéciales (optionnel)
                </label>
                <textarea
                  name="commentaire"
                  value={form.commentaire}
                  onChange={handleChange}
                  placeholder="Ex: chambre non-fumeur, lit bébé, arrivée tardive..."
                  rows={3}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: `1px solid ${C.border}`, borderRadius: '8px',
                    fontSize: '14px', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Bouton réserver */}
              <button type="submit" disabled={loading || nuits <= 0} style={{
                backgroundColor: nuits <= 0 ? '#9ca3af' : C.success,
                color: C.white,
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: nuits <= 0 || loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <FaCheckCircle />
                {loading ? 'Traitement en cours...' : `Confirmer la réservation — ${prixTotal.toLocaleString()} MAD`}
              </button>
            </form>
          </div>

          {/* Résumé de la réservation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Infos chambre */}
            <div style={{ backgroundColor: C.white, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', color: C.primary, fontSize: '16px', fontWeight: '700' }}>
                Votre sélection
              </h3>

              {/* Header hôtel */}
              <div style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                borderRadius: '8px', padding: '16px', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <FaHotel style={{ color: 'rgba(255,255,255,0.7)', fontSize: '24px' }} />
                <div>
                  <div style={{ color: C.white, fontWeight: '700', fontSize: '15px' }}>{hotel?.nom || 'Hôtel'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{hotel?.ville}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <SumRow icon={<FaBed />} label="Chambre" value={`N° ${chambre?.numero || chambreId} — ${chambre?.type || 'Standard'}`} />
                <SumRow icon={<FaUsers />} label="Capacité" value={`${chambre?.capacite || '?'} personnes max`} />
                <SumRow icon={<FaMoneyBillWave />} label="Tarif / nuit" value={`${prixUnit.toLocaleString()} MAD`} />
              </div>
            </div>

            {/* Calcul du prix */}
            <div style={{ backgroundColor: C.white, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', color: C.primary, fontSize: '16px', fontWeight: '700' }}>
                Détail du prix
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <SumRow label="Arrivée" value={formatDate(form.date_arrivee)} />
                <SumRow label="Départ" value={formatDate(form.date_depart)} />
                <SumRow label="Nombre de nuits" value={nuits > 0 ? `${nuits} nuit${nuits > 1 ? 's' : ''}` : '—'} />
                <SumRow label={`${prixUnit.toLocaleString()} × ${nuits}`} value={`${(prixUnit * nuits).toLocaleString()} MAD`} />
              </div>
              <div style={{
                borderTop: `2px solid ${C.border}`,
                marginTop: '14px',
                paddingTop: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: C.primary, fontWeight: '700', fontSize: '16px' }}>Total</span>
                <span style={{ color: C.success, fontWeight: '800', fontSize: '22px' }}>
                  {prixTotal > 0 ? `${prixTotal.toLocaleString()} MAD` : '—'}
                </span>
              </div>
              <p style={{ margin: '10px 0 0', color: C.muted, fontSize: '12px', textAlign: 'center' }}>
                Taxes et frais inclus. Paiement à l'hôtel.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const SumRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
    <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
      {icon && <span style={{ color: '#2980B9' }}>{icon}</span>}
      {label}
    </span>
    <span style={{ color: '#374151', fontWeight: '500', textAlign: 'right' }}>{value}</span>
  </div>
);
