// ============================================================
// PAGE DÉTAIL HÔTEL — Hôtelière 2.0
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaWifi,
  FaSwimmingPool, FaParking, FaUtensils, FaArrowLeft,
  FaBed, FaUsers, FaCheckCircle, FaTimesCircle, FaConciergeBell,
  FaTimes
} from 'react-icons/fa';
import { getHotel, getChambresDisponibles, creerReservation, soumettreAvis } from '../services/api';
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

const nbNuits = (arrivee, depart) => {
  if (!arrivee || !depart) return 0;
  const diff = new Date(depart) - new Date(arrivee);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const Stars = ({ count }) => (
  <div style={{ display: 'flex', gap: '3px' }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <FaStar key={i} style={{ color: i <= count ? C.warning : '#d1d5db', fontSize: '16px' }} />
    ))}
  </div>
);

const ServiceIcon = ({ service }) => {
  const s = service?.toLowerCase() || '';
  if (s.includes('wifi') || s.includes('internet')) return <FaWifi />;
  if (s.includes('piscine') || s.includes('pool'))   return <FaSwimmingPool />;
  if (s.includes('parking'))                          return <FaParking />;
  if (s.includes('restaur') || s.includes('petit'))  return <FaUtensils />;
  return <FaConciergeBell />;
};

const ChambreCard = ({ chambre, onReserver, selected }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    onReserver(chambre);
  };

  return (
    <div style={{
      backgroundColor: selected ? '#f0fdf4' : C.white,
      border: `2px solid ${selected ? C.success : C.border}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      transition: 'all 0.2s',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <FaBed style={{ color: C.secondary, fontSize: '18px' }} />
          <h4 style={{ margin: 0, color: C.primary, fontSize: '16px', fontWeight: '600' }}>
            {chambre.type || 'Chambre Standard'} — N° {chambre.numero}
          </h4>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: C.muted, fontSize: '13px' }}>
            <FaUsers style={{ color: C.secondary }} />
            {chambre.capacite || 2} personnes max
          </span>
          {chambre.description && (
            <span style={{ color: C.muted, fontSize: '13px' }}>{chambre.description}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: C.primary, fontSize: '22px', fontWeight: '800' }}>
            {chambre.prix_nuit} MAD
          </div>
          <div style={{ color: C.muted, fontSize: '12px' }}>par nuit</div>
        </div>
        <button onClick={handleClick} style={{
          backgroundColor: selected ? C.success : C.secondary,
          color: C.white,
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          {selected ? '✓ Sélectionnée' : (isAuthenticated ? 'Réserver' : 'Connectez-vous')}
        </button>
      </div>
    </div>
  );
};

export default function HotelDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { isAuthenticated, user } = useAuth();

  const hotelPreview = location.state?.hotel ?? null;

  const [hotel, setHotel]     = useState(hotelPreview);
  const [loading, setLoading] = useState(!hotelPreview);
  const [error, setError]     = useState('');

  const [chambres, setChambres]                   = useState([]);
  const [dates, setDates]                         = useState({ date_arrivee: '', date_depart: '' });
  const [rechercheChambres, setRechercheChambres] = useState(false);
  const [loadingChambres, setLoadingChambres]     = useState(false);
  const [erreurChambres, setErreurChambres]       = useState('');

  // Formulaire d'avis
  const [noteAvis, setNoteAvis]               = useState(0);
  const [commentaireAvis, setCommentaireAvis] = useState('');
  const [avisEnvoi, setAvisEnvoi]             = useState(false);
  const [avisSucces, setAvisSucces]           = useState(false);
  const [avisErreur, setAvisErreur]           = useState('');
  const [avisNouveaux, setAvisNouveaux]       = useState([]);

  // Barre de réservation
  const [chambreSelectionnee, setChambreSelectionnee] = useState(null);
  const [nbPersonnes, setNbPersonnes]                 = useState(1);
  const [commentaire, setCommentaire]                 = useState('');
  const [loadingReservation, setLoadingReservation]   = useState(false);
  const [reservationSuccess, setReservationSuccess]   = useState(false);
  const [reservationError, setReservationError]       = useState('');

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await getHotel(id);
        const candidats = [
          res?.data && !Array.isArray(res.data) ? res.data : null,
          Array.isArray(res?.data) && res.data.length > 0 ? res.data[0] : null,
          res?.hotel ?? null,
          res?.id != null ? res : null,
        ];
        const hotelData = candidats.find((c) => c?.id != null);
        if (hotelData) setHotel(hotelData);
      } catch (err) {
        if (!hotelPreview) {
          setError(
            err.status
              ? `Erreur ${err.status} : ${err.message}`
              : err.message || "Impossible de charger cet hôtel."
          );
        }
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id]); // eslint-disable-line

  const rechercherChambres = async (e) => {
    e?.preventDefault();
    if (!dates.date_arrivee || !dates.date_depart) {
      alert("Veuillez sélectionner les dates d'arrivée et de départ.");
      return;
    }
    setLoadingChambres(true);
    setRechercheChambres(true);
    setErreurChambres('');
    setChambreSelectionnee(null);
    try {
      const res = await getChambresDisponibles(dates.date_arrivee, dates.date_depart, id);
      const liste = Array.isArray(res)             ? res
                  : Array.isArray(res?.data?.data) ? res.data.data
                  : Array.isArray(res?.data)       ? res.data
                  : [];
      setChambres(liste);
    } catch (err) {
      setErreurChambres(
        err.status
          ? `Erreur ${err.status} : ${err.message}`
          : err.message || 'Impossible de vérifier la disponibilité.'
      );
      setChambres([]);
    } finally {
      setLoadingChambres(false);
    }
  };

  const handleReserver = (chambre) => {
    setChambreSelectionnee(chambre);
    setReservationError('');
    setNbPersonnes(1);
  };

  const confirmerReservation = async () => {
    const nuits = nbNuits(dates.date_arrivee, dates.date_depart);
    if (nuits <= 0) {
      setReservationError('Les dates sélectionnées sont invalides.');
      return;
    }
    setLoadingReservation(true);
    setReservationError('');
    try {
      const res = await creerReservation({
        chambre_id:   Number(chambreSelectionnee.id),
        date_arrivee: dates.date_arrivee,
        date_depart:  dates.date_depart,
        nb_personnes: Number(nbPersonnes),
        commentaire:  commentaire || null,
      });
      const reservationId = res?.data?.id ?? res?.id;
      if (reservationId) {
        navigate(`/paiement/${reservationId}`);
      } else {
        setReservationSuccess(true);
        setChambreSelectionnee(null);
      }
    } catch (err) {
      if (err.status === 409) {
        setReservationError('Cette chambre est déjà occupée pour ces dates. Choisissez d\'autres dates ou une autre chambre.');
      } else if (err.status === 422) {
        const msgs = err.data?.errors
          ? Object.values(err.data.errors).flat().join(' ')
          : 'Données invalides.';
        setReservationError(msgs);
      } else {
        setReservationError(err.message || 'Erreur lors de la réservation.');
      }
    } finally {
      setLoadingReservation(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <div style={{ width: '48px', height: '48px', border: `4px solid #e2e8f0`, borderTop: `4px solid ${C.secondary}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: C.danger, fontSize: '18px', fontWeight: '600' }}>{error}</p>
        <button onClick={() => navigate('/hotels')} style={{ backgroundColor: C.secondary, color: C.white, border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer' }}>
          Retour à l'accueil
        </button>
      </div>
      <Footer />
    </div>
  );

  const soumettreFormAvis = async (e) => {
    e.preventDefault();
    if (noteAvis === 0) { setAvisErreur('Veuillez sélectionner une note.'); return; }
    if (!commentaireAvis.trim()) { setAvisErreur('Veuillez écrire un commentaire.'); return; }
    setAvisEnvoi(true);
    setAvisErreur('');
    try {
      await soumettreAvis(id, { note: noteAvis, commentaire: commentaireAvis.trim() });
      setAvisNouveaux((prev) => [{
        note: noteAvis,
        commentaire: commentaireAvis.trim(),
        client: { prenom: user?.prenom || 'Vous', nom: '' },
      }, ...prev]);
      setAvisSucces(true);
      setNoteAvis(0);
      setCommentaireAvis('');
    } catch (err) {
      setAvisErreur(err.message || 'Erreur lors de la soumission de votre avis.');
    } finally {
      setAvisEnvoi(false);
    }
  };

  const services    = Array.isArray(hotel?.services) ? hotel.services : [];
  const avis        = Array.isArray(hotel?.avis)     ? hotel.avis     : [];
  const tousLesAvis = [...avisNouveaux, ...avis];
  const nomService = (s) => (typeof s === 'string' ? s : s?.nom ?? '');
  const nuits      = nbNuits(dates.date_arrivee, dates.date_depart);
  const prixTotal  = chambreSelectionnee ? nuits * chambreSelectionnee.prix_nuit : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />

      {/* Bannière hôtel avec photo */}
      <div style={{
        position:        'relative',
        height:          '400px',
        overflow:        'hidden',
        backgroundColor: C.primary,
      }}>
        {/* Photo de l'hôtel */}
        <img
          src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'}
          alt={hotel.nom}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
          }}
        />
        {/* Overlay dégradé pour lisibilité du texte */}
        <div style={{
          position: 'absolute',
          inset:    0,
          background: 'linear-gradient(to bottom, rgba(27,58,107,0.25) 0%, rgba(27,58,107,0.82) 100%)',
        }} />
        {/* Contenu texte en bas de la bannière */}
        <div style={{
          position: 'absolute',
          bottom:   0,
          left:     0,
          right:    0,
          padding:  '32px 24px',
          color:    C.white,
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: C.white, borderRadius: '8px', padding: '8px 16px',
              cursor: 'pointer', marginBottom: '20px', fontSize: '14px',
              backdropFilter: 'blur(4px)',
            }}>
              <FaArrowLeft /> Retour
            </button>

            <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: '800', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {hotel.nom}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Stars count={hotel.etoiles} />
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.9 }}>
                <FaMapMarkerAlt /> {hotel.ville}, Maroc
              </span>
            </div>
          </div>
        </div>
      </div>

      <main style={{
        flex: 1,
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '32px 24px',
        paddingBottom: chambreSelectionnee ? '180px' : '32px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Colonne principale */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Description */}
            <section style={{ backgroundColor: C.white, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 16px', color: C.primary, fontSize: '18px', fontWeight: '700' }}>À propos de cet hôtel</h2>
              <p style={{ margin: 0, color: C.text, lineHeight: '1.7', fontSize: '15px' }}>
                {hotel.description || "Bienvenue dans cet établissement de qualité qui vous offrira un séjour inoubliable au cœur du Maroc."}
              </p>
            </section>

            {/* Services */}
            {services.length > 0 && (
              <section style={{ backgroundColor: C.white, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: '0 0 16px', color: C.primary, fontSize: '18px', fontWeight: '700' }}>Services & équipements</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {services.map((s, i) => (
                    <div key={s?.id ?? i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      backgroundColor: '#EFF6FF', color: C.secondary,
                      padding: '8px 16px', borderRadius: '20px', fontSize: '14px',
                    }}>
                      <ServiceIcon service={nomService(s)} />
                      {nomService(s)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recherche chambres */}
            <section style={{ backgroundColor: C.white, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 16px', color: C.primary, fontSize: '18px', fontWeight: '700' }}>
                Chambres disponibles
              </h2>

              <form onSubmit={rechercherChambres} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: C.muted, fontWeight: '500' }}>Date d'arrivée</label>
                  <input type="date" value={dates.date_arrivee}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDates(p => ({ ...p, date_arrivee: e.target.value }))}
                    style={{ width: '100%', padding: '10px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: C.muted, fontWeight: '500' }}>Date de départ</label>
                  <input type="date" value={dates.date_depart}
                    min={dates.date_arrivee || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDates(p => ({ ...p, date_depart: e.target.value }))}
                    style={{ width: '100%', padding: '10px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={{
                    backgroundColor: C.secondary, color: C.white,
                    border: 'none', borderRadius: '8px',
                    padding: '10px 20px', fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    Vérifier la disponibilité
                  </button>
                </div>
              </form>

              {loadingChambres && (
                <p style={{ color: C.muted, textAlign: 'center' }}>Recherche des chambres disponibles...</p>
              )}

              {erreurChambres && !loadingChambres && (
                <div style={{
                  backgroundColor: '#fef2f2', border: `1px solid #fca5a5`,
                  borderRadius: '8px', padding: '16px', color: C.danger, fontSize: '14px',
                }}>
                  <strong>Erreur :</strong> {erreurChambres}
                </div>
              )}

              {rechercheChambres && !loadingChambres && !erreurChambres && (
                chambres.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ color: C.success, fontWeight: '600', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaCheckCircle /> {chambres.length} chambre{chambres.length > 1 ? 's' : ''} disponible{chambres.length > 1 ? 's' : ''}
                    </p>
                    {chambres.map((c) => (
                      <ChambreCard
                        key={c.id}
                        chambre={c}
                        onReserver={handleReserver}
                        selected={chambreSelectionnee?.id === c.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                    <FaTimesCircle style={{ color: C.danger, fontSize: '28px', marginBottom: '8px' }} />
                    <p style={{ margin: 0, color: C.danger, fontWeight: '600' }}>Aucune chambre disponible pour ces dates.</p>
                    <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '13px' }}>Essayez d'autres dates.</p>
                  </div>
                )
              )}

              {!rechercheChambres && (
                <p style={{ color: C.muted, textAlign: 'center', padding: '20px 0' }}>
                  Sélectionnez vos dates pour voir les chambres disponibles.
                </p>
              )}
            </section>

            {/* Avis clients */}
            <section style={{ backgroundColor: C.white, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 20px', color: C.primary, fontSize: '18px', fontWeight: '700' }}>Avis clients</h2>

              {/* Formulaire — clients connectés uniquement */}
              {isAuthenticated && user?.role === 'client' && (
                <div style={{
                  marginBottom: '24px', padding: '20px',
                  backgroundColor: '#f8fafc', borderRadius: '10px',
                  border: `1px solid ${C.border}`,
                }}>
                  {avisSucces ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.success, fontWeight: '600', fontSize: '15px' }}>
                      <FaCheckCircle /> Votre avis a été publié avec succès. Merci !
                    </div>
                  ) : (
                    <form onSubmit={soumettreFormAvis}>
                      <h3 style={{ margin: '0 0 16px', color: C.primary, fontSize: '15px', fontWeight: '700' }}>Laisser un avis</h3>

                      {/* Étoiles cliquables */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: C.muted, fontWeight: '500' }}>
                          Votre note *
                        </label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => { setNoteAvis(n); setAvisErreur(''); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                              <FaStar style={{
                                fontSize: '30px',
                                color: n <= noteAvis ? C.warning : '#d1d5db',
                                transition: 'color 0.15s',
                              }} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Commentaire */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: C.muted, fontWeight: '500' }}>
                          Commentaire *
                        </label>
                        <textarea
                          value={commentaireAvis}
                          onChange={(e) => setCommentaireAvis(e.target.value)}
                          placeholder="Partagez votre expérience avec cet hôtel..."
                          rows={3}
                          style={{
                            width: '100%', padding: '10px 12px',
                            border: `1px solid ${C.border}`, borderRadius: '8px',
                            fontSize: '14px', resize: 'vertical',
                            fontFamily: 'inherit', boxSizing: 'border-box',
                            outline: 'none', lineHeight: '1.5',
                          }}
                        />
                      </div>

                      {/* Message d'erreur */}
                      {avisErreur && (
                        <div style={{
                          backgroundColor: '#fef2f2', border: `1px solid #fca5a5`,
                          borderRadius: '8px', padding: '10px 14px',
                          color: C.danger, fontSize: '13px', marginBottom: '14px',
                        }}>
                          {avisErreur}
                        </div>
                      )}

                      {/* Bouton soumettre */}
                      <button
                        type="submit"
                        disabled={avisEnvoi}
                        style={{
                          backgroundColor: avisEnvoi ? '#9ca3af' : C.primary,
                          color: C.white, border: 'none', borderRadius: '8px',
                          padding: '10px 24px', fontSize: '14px', fontWeight: '600',
                          cursor: avisEnvoi ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {avisEnvoi ? 'Publication en cours...' : 'Publier mon avis'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Liste des avis */}
              {tousLesAvis.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tousLesAvis.slice(0, 5).map((a, i) => (
                    <div key={i} style={{ borderLeft: `3px solid ${C.secondary}`, paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: C.primary }}>
                          {a.client?.prenom || 'Client'} {a.client?.nom?.charAt(0) || ''}.
                        </span>
                        <Stars count={a.note} />
                      </div>
                      <p style={{ margin: 0, color: C.muted, fontSize: '14px', lineHeight: '1.5' }}>{a.commentaire}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: C.muted, fontSize: '14px', textAlign: 'center', padding: '12px 0', margin: 0 }}>
                  Aucun avis pour le moment. Soyez le premier à partager votre expérience !
                </p>
              )}
            </section>
          </div>

          {/* Colonne info rapide */}
          <div>
            <div style={{ position: 'sticky', top: '84px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: C.white, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px', color: C.primary, fontSize: '16px', fontWeight: '700' }}>Informations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow icon={<FaMapMarkerAlt />} label="Adresse" value={hotel.adresse || hotel.ville + ', Maroc'} />
                  <InfoRow icon={<FaPhone />} label="Téléphone" value={hotel.telephone || 'Non renseigné'} />
                  <InfoRow icon={<FaEnvelope />} label="Email" value={hotel.email || 'Non renseigné'} />
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
                    <div style={{ color: C.muted, fontSize: '12px', marginBottom: '4px' }}>Classement</div>
                    <Stars count={hotel.etoiles} />
                  </div>
                </div>
              </div>

              {!isAuthenticated && (
                <div style={{ backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '20px', textAlign: 'center', border: `1px solid #bfdbfe` }}>
                  <p style={{ margin: '0 0 12px', color: C.primary, fontSize: '14px', fontWeight: '600' }}>
                    Connectez-vous pour réserver
                  </p>
                  <button onClick={() => navigate('/login')} style={{
                    backgroundColor: C.primary, color: C.white,
                    border: 'none', borderRadius: '8px',
                    padding: '10px 20px', width: '100%',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  }}>
                    Se connecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* ===== BARRE DE CONFIRMATION DE RÉSERVATION ===== */}
      {chambreSelectionnee && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          backgroundColor: C.white,
          borderTop: `3px solid ${C.primary}`,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
          zIndex: 200,
          padding: '20px 24px',
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {reservationError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: `1px solid #fca5a5`,
                borderRadius: '8px',
                padding: '10px 16px',
                marginBottom: '14px',
                color: C.danger,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <FaTimesCircle style={{ flexShrink: 0 }} />
                {reservationError}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {/* Infos chambre */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
                <FaBed style={{ color: C.secondary, fontSize: '22px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '700', color: C.primary, fontSize: '15px' }}>
                    {chambreSelectionnee.type || 'Chambre Standard'} — N° {chambreSelectionnee.numero}
                  </div>
                  <div style={{ fontSize: '13px', color: C.muted }}>
                    {nuits > 0 ? `${nuits} nuit${nuits > 1 ? 's' : ''} × ${chambreSelectionnee.prix_nuit} MAD` : 'Dates sélectionnées ci-dessus'}
                  </div>
                </div>
              </div>

              {/* Nombre de personnes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <label style={{ fontSize: '13px', color: C.muted, whiteSpace: 'nowrap' }}>
                  <FaUsers style={{ marginRight: '4px', color: C.secondary }} />
                  Personnes :
                </label>
                <input
                  type="number"
                  min="1"
                  max={chambreSelectionnee.capacite || 10}
                  value={nbPersonnes}
                  onChange={(e) => setNbPersonnes(e.target.value)}
                  style={{
                    width: '65px', padding: '8px',
                    border: `1px solid ${C.border}`, borderRadius: '8px',
                    fontSize: '14px', textAlign: 'center',
                  }}
                />
              </div>

              {/* Demande spéciale */}
              <div style={{ flex: 1, minWidth: '160px' }}>
                <input
                  type="text"
                  placeholder="Demande spéciale (optionnel)"
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${C.border}`, borderRadius: '8px',
                    fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Prix total */}
              {prixTotal > 0 && (
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: C.success, lineHeight: 1 }}>
                    {prixTotal.toLocaleString()} MAD
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button
                  onClick={() => { setChambreSelectionnee(null); setReservationError(''); }}
                  style={{
                    backgroundColor: '#f3f4f6', color: C.muted,
                    border: 'none', borderRadius: '8px',
                    padding: '10px 14px', cursor: 'pointer', fontSize: '18px',
                  }}
                  title="Annuler"
                >
                  <FaTimes />
                </button>
                <button
                  onClick={confirmerReservation}
                  disabled={loadingReservation || nuits <= 0}
                  style={{
                    backgroundColor: nuits <= 0 ? '#9ca3af' : C.success,
                    color: C.white,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: nuits <= 0 || loadingReservation ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loadingReservation ? 'En cours...' : 'Confirmer ma réservation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== OVERLAY SUCCÈS ===== */}
      {reservationSuccess && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: '24px',
        }}>
          <div style={{
            backgroundColor: C.white, borderRadius: '20px',
            padding: '48px 40px', textAlign: 'center',
            maxWidth: '420px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              width: '80px', height: '80px', backgroundColor: '#f0fdf4',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <FaCheckCircle style={{ color: C.success, fontSize: '40px' }} />
            </div>
            <h2 style={{ color: C.primary, margin: '0 0 10px', fontSize: '22px', fontWeight: '800' }}>
              Réservation confirmée !
            </h2>
            <p style={{ color: C.muted, margin: '0 0 24px', fontSize: '14px', lineHeight: '1.6' }}>
              Votre réservation à <strong style={{ color: C.primary }}>{hotel?.nom}</strong> est en attente de confirmation par l'hôtel.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/profile')} style={{
                backgroundColor: C.primary, color: C.white, border: 'none',
                borderRadius: '8px', padding: '12px 20px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer',
              }}>
                Mes réservations
              </button>
              <button onClick={() => { setReservationSuccess(false); setChambres([]); setRechercheChambres(false); }} style={{
                backgroundColor: '#f3f4f6', color: C.text, border: 'none',
                borderRadius: '8px', padding: '12px 20px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer',
              }}>
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
    <div style={{ color: '#2980B9', marginTop: '2px', flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#374151' }}>{value}</div>
    </div>
  </div>
);
