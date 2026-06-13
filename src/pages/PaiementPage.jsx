import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  FaHotel, FaBed, FaCalendarAlt, FaLock, FaCheckCircle,
  FaArrowLeft, FaCreditCard, FaSpinner, FaFlask,
} from 'react-icons/fa';
import { creerPaiementIntent, confirmerPaiement } from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TZqwFV05675EenlQqWO39jKZbEVItxLYIBNyDkLkyhyi8X07NsGjZRlKuRq8BolvgIHxHgbVBIat86vOETsx9L500DNeQua4e';

// Initialisé une seule fois au niveau module
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const C = {
  primary:   '#1B3A6B',
  secondary: '#2980B9',
  success:   '#27AE60',
  danger:    '#E74C3C',
  white:     '#ffffff',
  bg:        '#f5f5f5',
  border:    '#dce1e7',
  text:      '#374151',
  muted:     '#6b7280',
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' });
};

const nbNuits = (a, b) => {
  if (!a || !b) return 0;
  return Math.max(0, Math.floor((new Date(b) - new Date(a)) / 86400000));
};

// ─────────────────────────────────────────────────────────────
// Formulaire simulation — aucun hook Stripe requis
// Le succès est géré DANS ce composant (pas via onSuccess du parent)
// pour éviter de détruire l'arbre DOM pendant un rendu Stripe
// ─────────────────────────────────────────────────────────────
function FormulaireSimulation({ reservation, clientSecret }) {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erreur,  setErreur]  = useState('');
  const [succes,  setSucces]  = useState(false);
  const [carte,   setCarte]   = useState('4242 4242 4242 4242');
  const [nom,     setNom]     = useState('Test Client');
  const [exp,     setExp]     = useState('12/34');
  const [cvv,     setCvv]     = useState('123');

  const prixTotal = reservation?.prix_total ?? 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      await confirmerPaiement(reservation.id, clientSecret);
      setSucces(true);
      setTimeout(() => navigate('/profile'), 3000);
    } catch (err) {
      setErreur(err.message || 'Erreur lors de la confirmation.');
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`,
    borderRadius: '8px', fontSize: '15px', color: C.text,
    backgroundColor: C.white, boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const lbl = { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: C.text };

  return (
    <div>
      {succes ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <FaCheckCircle style={{ color: C.success, fontSize: '56px', marginBottom: '16px' }} />
          <h2 style={{ color: C.success, margin: '0 0 10px', fontSize: '22px', fontWeight: '800' }}>
            Paiement confirmé !
          </h2>
          <p style={{ color: C.muted, margin: '0 0 6px' }}>Votre réservation est validée.</p>
          <p style={{ color: C.muted, fontSize: '13px' }}>Redirection dans 3 secondes...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: '#fefce8', border: '1px solid #fde68a',
            borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: '#92400e',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <FaFlask style={{ marginTop: '2px', flexShrink: 0, color: '#d97706' }} />
            <div>
              <strong>Mode simulation activé</strong><br />
              Aucun vrai paiement. Cliquez sur «&nbsp;Confirmer&nbsp;» pour valider la réservation.
            </div>
          </div>

          <div>
            <label style={lbl}>
              <FaCreditCard style={{ marginRight: '6px', color: C.secondary }} />
              Numéro de carte (simulation)
            </label>
            <input type="text" value={carte} onChange={(e) => setCarte(e.target.value)} maxLength={19} style={inp} />
          </div>

          <div>
            <label style={lbl}>Nom du titulaire</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} style={inp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={lbl}>Expiration</label>
              <input type="text" value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM/AA" maxLength={5} style={inp} />
            </div>
            <div>
              <label style={lbl}>CVV</label>
              <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={4} style={inp} />
            </div>
          </div>

          {erreur && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: C.danger, fontSize: '14px' }}>
              ✗ {erreur}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            backgroundColor: loading ? '#9ca3af' : C.success,
            color: C.white, border: 'none', borderRadius: '10px',
            padding: '16px', fontSize: '16px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            {loading
              ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Confirmation en cours...</>
              : <><FaLock /> Confirmer le paiement {prixTotal.toLocaleString('fr-MA')} MAD</>
            }
          </button>
          <p style={{ textAlign: 'center', fontSize: '12px', color: C.muted }}>Mode simulation — Aucun débit réel</p>
        </form>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Formulaire Stripe réel
// RÈGLE : zéro rendu conditionnel — tout est toujours dans le DOM.
// Seuls les style.display changent pour éviter tout insertBefore
// pendant que Stripe ou une extension navigateur touche au DOM.
// ─────────────────────────────────────────────────────────────
function FormulaireStripe({ reservation, clientSecret }) {
  const stripe    = useStripe();
  const elements  = useElements();
  const navigate  = useNavigate();

  // useRef pour les états qui changent pendant confirmCardPayment
  // → pas de re-render React pendant l'opération Stripe
  const enCoursRef = useRef(false);

  const [phase, setPhase] = useState('form'); // 'form' | 'loading' | 'succes' | 'erreur'
  const [msgErreur, setMsgErreur] = useState('');

  const prixTotal = reservation?.prix_total ?? 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || enCoursRef.current) return;
    enCoursRef.current = true;
    setPhase('loading');

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (error) {
      setMsgErreur(error.message || 'Le paiement a échoué.');
      setPhase('erreur');
      enCoursRef.current = false;
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await confirmerPaiement(reservation.id, paymentIntent.id);
        setPhase('succes');
        setTimeout(() => navigate('/profile'), 3000);
      } catch (err) {
        setMsgErreur(err.message || 'Paiement OK mais erreur de confirmation.');
        setPhase('erreur');
        enCoursRef.current = false;
      }
    } else {
      setMsgErreur('Statut inattendu : ' + (paymentIntent?.status ?? '?'));
      setPhase('erreur');
      enCoursRef.current = false;
    }
  };

  // ── Visibilités calculées une seule fois ───────────────────
  const showForm    = phase === 'form' || phase === 'loading' || phase === 'erreur';
  const showLoading = phase === 'loading';
  const showSucces  = phase === 'succes';
  const showErreur  = phase === 'erreur';

  return (
    <div translate="no">

      {/* ══ ÉCRAN SUCCÈS — toujours dans le DOM, display géré par CSS ══ */}
      <div style={{
        display: showSucces ? 'flex' : 'none',
        flexDirection: 'column', alignItems: 'center',
        padding: '40px 20px', gap: '12px',
      }}>
        <FaCheckCircle style={{ color: C.success, fontSize: '56px' }} />
        <h2 style={{ color: C.success, margin: 0, fontSize: '22px', fontWeight: '800' }}>
          Paiement réussi !
        </h2>
        <p style={{ color: C.muted, margin: 0 }}>Votre réservation est confirmée.</p>
        <p style={{ color: C.muted, fontSize: '13px', margin: 0 }}>
          Redirection dans 3 secondes…
        </p>
      </div>

      {/* ══ FORMULAIRE — toujours dans le DOM, caché après succès ══ */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: showForm ? 'flex' : 'none',
          flexDirection: 'column', gap: '20px',
        }}
      >
        {/* Info carte test */}
        <div style={{
          backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '10px', padding: '14px 16px',
          fontSize: '13px', color: '#1e40af',
        }}>
          <strong>Carte de test :</strong>{' '}
          4242 4242 4242 4242 — Exp : 12/34 — CVC : 123
        </div>

        {/* Champ carte */}
        <div>
          <label style={{
            display: 'block', marginBottom: '8px',
            fontWeight: '600', fontSize: '14px', color: C.text,
          }}>
            <FaCreditCard style={{ marginRight: '6px', color: C.secondary }} />
            Informations de carte bancaire
          </label>
          <div style={{
            border: `1px solid ${C.border}`, borderRadius: '8px',
            padding: '14px 16px', backgroundColor: C.white,
          }}>
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px', color: C.text,
                  fontFamily: 'inherit',
                  '::placeholder': { color: C.muted },
                },
                invalid: { color: C.danger },
              },
              hidePostalCode: true,
            }} />
          </div>
        </div>

        {/* Erreur — display CSS, pas de rendu conditionnel */}
        <div style={{
          display: showErreur ? 'block' : 'none',
          backgroundColor: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: '8px', padding: '12px 16px',
          color: C.danger, fontSize: '14px',
        }}>
          {msgErreur}
        </div>

        {/* Bouton — les deux états toujours dans le DOM */}
        <button
          type="submit"
          disabled={showLoading || !stripe}
          style={{
            backgroundColor: showLoading ? '#9ca3af' : C.success,
            color: C.white, border: 'none', borderRadius: '10px',
            padding: '16px', fontSize: '16px', fontWeight: '700',
            cursor: showLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* État normal — toujours dans le DOM */}
          <span style={{
            display: showLoading ? 'none' : 'flex',
            alignItems: 'center', gap: '10px',
          }}>
            <FaLock />
            Payer {prixTotal.toLocaleString('fr-MA')} MAD
          </span>

          {/* État chargement — toujours dans le DOM */}
          <span style={{
            display: showLoading ? 'flex' : 'none',
            alignItems: 'center', gap: '10px',
          }}>
            <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
            Traitement en cours…
          </span>
        </button>

        <p style={{
          textAlign: 'center', fontSize: '12px', color: C.muted,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '5px',
        }}>
          <FaLock /> Paiement sécurisé par Stripe
        </p>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Contenu principal — enfant de <Elements>, peut utiliser
// useStripe/useElements via ses enfants
// ─────────────────────────────────────────────────────────────
function ContenuPaiement() {
  const { reservationId } = useParams();
  const navigate          = useNavigate();

  const [reservation,   setReservation]   = useState(null);
  const [clientSecret,  setClientSecret]  = useState(null);
  const [estSimulation, setEstSimulation] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [erreur,        setErreur]        = useState('');

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // creerPaiementIntent retourne déjà les données de réservation (via infoReservation())
        const intentData = await creerPaiementIntent(parseInt(reservationId, 10));
        const secret = intentData.client_secret;
        setClientSecret(secret);
        setEstSimulation(typeof secret === 'string' && secret.startsWith('sim_'));

        if (intentData.reservation) {
          setReservation(intentData.reservation);
        }
      } catch (err) {
        // Token absent, expiré ou invalide → déconnexion + retour login
        if (err.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        setErreur(err.message || 'Impossible de charger la page de paiement.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [reservationId]); // eslint-disable-line

  // ── Chargement ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: C.muted }}>
            <FaSpinner style={{ fontSize: '32px', animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p>Préparation du paiement...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Erreur ────────────────────────────────────────────────
  if (erreur) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '40px' }}>
          <p style={{ color: C.danger, fontSize: '16px', fontWeight: '600', textAlign: 'center' }}>{erreur}</p>
          <button onClick={() => navigate(-1)} style={{ backgroundColor: C.secondary, color: C.white, border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer' }}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  const nuits     = nbNuits(reservation?.date_arrivee, reservation?.date_depart);
  const prixTotal = reservation?.prix_total ?? 0;

  // ── Formulaire ────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />

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
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800' }}>
            <FaLock style={{ marginRight: '10px', fontSize: '20px' }} />
            Paiement sécurisé
          </h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8, fontSize: '14px' }}>
            Réservation #{reservationId}{estSimulation ? ' — Mode simulation' : ''}
          </p>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: '900px', margin: '32px auto', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '28px' }}>

          {/* Formulaire */}
          <div style={{ backgroundColor: C.white, borderRadius: '12px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 24px', color: C.primary, fontSize: '18px', fontWeight: '700' }}>
              {estSimulation ? 'Paiement simulé' : 'Paiement par carte'}
            </h2>

            {clientSecret ? (
              estSimulation ? (
                <FormulaireSimulation
                  reservation={reservation}
                  clientSecret={clientSecret}
                />
              ) : (
                <FormulaireStripe
                  reservation={reservation}
                  clientSecret={clientSecret}
                />
              )
            ) : (
              <p style={{ color: C.muted, textAlign: 'center', padding: '20px' }}>Initialisation...</p>
            )}
          </div>

          {/* Récapitulatif */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: C.white, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', color: C.primary, fontSize: '16px', fontWeight: '700' }}>Récapitulatif</h3>

              <div style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                borderRadius: '8px', padding: '14px 16px', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <FaHotel style={{ color: 'rgba(255,255,255,0.7)', fontSize: '22px' }} />
                <div>
                  <div style={{ color: C.white, fontWeight: '700', fontSize: '14px' }}>
                    {reservation?.hotel_nom || reservation?.chambre?.hotel?.nom || 'Hôtel'}
                  </div>
                  {reservation?.chambre_num && (
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                      Chambre N° {reservation.chambre_num}
                      {reservation.chambre_type ? ` — ${reservation.chambre_type}` : ''}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <LigneInfo label="Arrivée" value={formatDate(reservation?.date_arrivee)} icon={<FaCalendarAlt />} />
                <LigneInfo label="Départ"  value={formatDate(reservation?.date_depart)}  icon={<FaCalendarAlt />} />
                <LigneInfo label="Durée"   value={nuits > 0 ? `${nuits} nuit${nuits > 1 ? 's' : ''}` : '—'} icon={<FaBed />} />
              </div>

              <div style={{ borderTop: `2px solid ${C.border}`, marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: C.primary, fontSize: '15px' }}>Total</span>
                <span style={{ fontWeight: '800', color: C.success, fontSize: '22px' }}>{prixTotal.toLocaleString('fr-MA')} MAD</span>
              </div>
            </div>

            <div style={{
              backgroundColor: estSimulation ? '#fefce8' : '#f0fdf4',
              border: `1px solid ${estSimulation ? '#fde68a' : '#bbf7d0'}`,
              borderRadius: '10px', padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              {estSimulation
                ? <FaFlask style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                : <FaLock  style={{ color: C.success,  marginTop: '2px', flexShrink: 0 }} />
              }
              <div style={{ fontSize: '12px', color: estSimulation ? '#92400e' : '#166534' }}>
                {estSimulation ? (
                  <><strong>Mode simulation</strong><br />Aucune vraie transaction ne sera effectuée.</>
                ) : (
                  <><strong>Paiement 100% sécurisé</strong><br />Données chiffrées par Stripe (PCI DSS).</>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Point d'entrée : <Elements> enveloppe TOUT une seule fois
// FormulaireStripe (useStripe/useElements) est toujours enfant
// ─────────────────────────────────────────────────────────────
export default function PaiementPage() {
  return (
    <Elements stripe={stripePromise}>
      <ContenuPaiement />
    </Elements>
  );
}

const LigneInfo = ({ icon, label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
    <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: '#2980B9', fontSize: '12px' }}>{icon}</span>
      {label}
    </span>
    <span style={{ color: '#374151', fontWeight: '500' }}>{value}</span>
  </div>
);
