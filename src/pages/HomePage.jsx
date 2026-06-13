// ============================================================
// PAGE ACCUEIL — Hôtelière 2.0
// Hero section + filtres de recherche + grille d'hôtels
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaSearch, FaMapMarkerAlt, FaStar, FaMoneyBillWave,
  FaCalendarAlt, FaHotel, FaArrowRight, FaFilter, FaTimes, FaMagic
} from 'react-icons/fa';
import { getHotels, getRecommandations } from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const C = {
  primary:   '#1B3A6B',
  secondary: '#2980B9',
  white:     '#ffffff',
  bg:        '#f4f4f4',
  border:    '#dce1e7',
  text:      '#374151',
  muted:     '#6b7280',
};

const VILLES = ['', 'Marrakech', 'Agadir', 'Tanger', 'Fès', 'Casablanca', 'Rabat'];

// Composant carte étoiles
const Stars = ({ count }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <FaStar key={i} style={{ color: i <= count ? '#F39C12' : '#d1d5db', fontSize: '13px' }} />
    ))}
  </div>
);

// Carte hôtel individuelle
const HotelCard = ({ hotel }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: C.white,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image hôtel */}
      <div style={{
        height: '180px',
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {hotel.image ? (
          <img
            src={hotel.image}
            alt={hotel.nom}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <FaHotel style={{ fontSize: '48px', color: 'rgba(255,255,255,0.3)' }} />
          </div>
        )}
        {/* Badge étoiles */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '20px',
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <FaStar style={{ color: '#F39C12', fontSize: '12px' }} />
          <span style={{ color: C.white, fontSize: '12px', fontWeight: '600' }}>
            {hotel.etoiles}★
          </span>
        </div>
        {/* Ville */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '20px',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <FaMapMarkerAlt style={{ color: '#93C5FD', fontSize: '11px' }} />
          <span style={{ color: C.white, fontSize: '12px' }}>{hotel.ville}</span>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: C.primary, fontSize: '16px', fontWeight: '700', lineHeight: '1.3' }}>
            {hotel.nom}
          </h3>
          <Stars count={hotel.etoiles} />
        </div>

        {hotel.description && (
          <p style={{
            margin: 0,
            color: C.muted,
            fontSize: '13px',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {hotel.description}
          </p>
        )}

        {/* Services */}
        {hotel.services && hotel.services.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {hotel.services.slice(0, 3).map((s, i) => (
              <span key={s.id ?? i} style={{
                backgroundColor: '#EFF6FF',
                color: C.secondary,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '500',
              }}>{s.nom ?? s}</span>
            ))}
          </div>
        )}

        {/* Prix + bouton */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
          <div>
            <span style={{ color: C.muted, fontSize: '11px' }}>À partir de</span>
            <div style={{ color: C.primary, fontWeight: '700', fontSize: '18px' }}>
              {hotel.prix_min ? `${hotel.prix_min} MAD` : 'Sur demande'}
              <span style={{ color: C.muted, fontSize: '11px', fontWeight: 'normal' }}>/nuit</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/hotels/${hotel.id}`, { state: { hotel } })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: hovered ? C.primary : C.secondary,
              color: C.white,
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            Voir les détails <FaArrowRight style={{ fontSize: '11px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

const RecoCard = ({ hotel }) => (
  <div style={{ position: 'relative', paddingTop: '10px' }}>
    <div style={{
      position: 'absolute', top: '0', left: '12px', zIndex: 2,
      backgroundColor: '#F39C12', color: '#fff',
      padding: '3px 12px', borderRadius: '12px',
      fontSize: '11px', fontWeight: '700',
      display: 'flex', alignItems: 'center', gap: '5px',
      boxShadow: '0 2px 6px rgba(243,156,18,0.35)',
    }}>
      <FaMagic style={{ fontSize: '10px' }} /> Recommandé pour vous
    </div>
    <HotelCard hotel={hotel} />
  </div>
);

export default function HomePage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [hotels, setHotels]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [recommandations, setRecommandations] = useState([]);
  const [prefRecos, setPrefRecos]     = useState(null);
  const [hasHistory, setHasHistory]   = useState(false);
  const [loadingReco, setLoadingReco] = useState(false);
  const [isConnecte, setIsConnecte]   = useState(!!localStorage.getItem('token'));

  const [filtres, setFiltres] = useState({
    ville:        searchParams.get('ville') || '',
    etoiles:      '',
    prix_max:     '',
    date_arrivee: '',
    date_depart:  '',
  });

  const chargerHotels = async (f = filtres, p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await getHotels({ ...f, page: p, per_page: 20 });
      setHotels(res.data || []);
      setTotalPages(res.meta?.last_page || 1);
    } catch {
      setError('Impossible de charger les hôtels. Vérifiez que le serveur backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerHotels(); }, []);

  useEffect(() => {
    if (!isConnecte) return;
    setLoadingReco(true);
    getRecommandations()
      .then((res) => {
        setHasHistory(!!res.has_history);
        setPrefRecos(res.preferences || null);
        setRecommandations(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingReco(false));
  }, [isConnecte]);

  const handleFiltreChange = (e) => {
    setFiltres((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRecherche = (e) => {
    e.preventDefault();
    setPage(1);
    chargerHotels(filtres, 1);
  };

  const resetFiltres = () => {
    const vide = { ville: '', etoiles: '', prix_max: '', date_arrivee: '', date_depart: '' };
    setFiltres(vide);
    setPage(1);
    chargerHotels(vide, 1);
  };

  const selectStyle = {
    padding: '10px 14px',
    border: `1px solid ${C.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: C.white,
    color: C.text,
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  };

  const inputStyle = {
    ...selectStyle,
    cursor: 'text',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, #1e4080 40%, ${C.secondary} 100%)`,
        padding: '64px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Décoration de fond */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(41,128,185,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(27,58,107,0.4) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{ color: C.white, fontSize: '40px', fontWeight: '800', margin: '0 0 16px', lineHeight: '1.2' }}>
            Découvrez les plus beaux<br />
            <span style={{ color: '#93C5FD' }}>hôtels du Maroc</span>
          </h1>
        </div>
      </div>

      {/* Formulaire de recherche flottant */}
      <div style={{
        maxWidth: '1000px',
        margin: '-32px auto 0',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10,
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <form onSubmit={handleRecherche} style={{
          backgroundColor: C.white,
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          padding: '24px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
            {/* Ville */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FaMapMarkerAlt style={{ marginRight: '4px' }} /> Destination
              </label>
              <select name="ville" value={filtres.ville} onChange={handleFiltreChange} style={selectStyle}>
                {VILLES.map((v) => <option key={v} value={v}>{v || 'Toutes les villes'}</option>)}
              </select>
            </div>

            {/* Étoiles */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FaStar style={{ marginRight: '4px' }} /> Étoiles
              </label>
              <select name="etoiles" value={filtres.etoiles} onChange={handleFiltreChange} style={selectStyle}>
                <option value="">Toutes</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            {/* Prix max */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FaMoneyBillWave style={{ marginRight: '4px' }} /> Prix max (MAD)
              </label>
              <input type="number" name="prix_max" value={filtres.prix_max} onChange={handleFiltreChange} placeholder="Ex: 1500" style={inputStyle} min="0" />
            </div>

            {/* Date arrivée */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FaCalendarAlt style={{ marginRight: '4px' }} /> Arrivée
              </label>
              <input type="date" name="date_arrivee" value={filtres.date_arrivee} onChange={handleFiltreChange} style={inputStyle} min={new Date().toISOString().split('T')[0]} />
            </div>

            {/* Date départ */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FaCalendarAlt style={{ marginRight: '4px' }} /> Départ
              </label>
              <input type="date" name="date_depart" value={filtres.date_depart} onChange={handleFiltreChange} style={inputStyle} min={filtres.date_arrivee || new Date().toISOString().split('T')[0]} />
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                backgroundColor: C.primary, color: C.white,
                border: 'none', borderRadius: '8px',
                padding: '10px', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer',
              }}>
                <FaSearch /> Rechercher
              </button>
              <button type="button" onClick={resetFiltres} title="Réinitialiser" style={{
                backgroundColor: '#f3f4f6', color: C.muted,
                border: 'none', borderRadius: '8px',
                padding: '10px 12px', cursor: 'pointer',
              }}>
                <FaTimes />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Section recommandations */}
      <section style={{ maxWidth: '1200px', margin: '48px auto 0', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>

        {/* Pas connecté — bannière invitation */}
        {!isConnecte && (
          <div style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
            borderRadius: '16px', padding: '28px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '16px',
          }}>
            <div>
              <h3 style={{ margin: '0 0 6px', color: C.white, fontSize: '18px', fontWeight: '700' }}>
                Obtenez des recommandations personnalisées
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                Connectez-vous et réservez pour découvrir des hôtels sélectionnés selon vos préférences.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: '#F39C12', color: C.white,
                border: 'none', borderRadius: '10px',
                padding: '12px 24px', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Se connecter
            </button>
          </div>
        )}

        {/* Connecté — chargement */}
        {isConnecte && loadingReco && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', color: C.muted }}>
            <div style={{
              width: '20px', height: '20px', flexShrink: 0,
              border: `3px solid ${C.border}`, borderTop: `3px solid ${C.secondary}`,
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            Chargement de vos recommandations…
          </div>
        )}

        {/* Connecté — pas d'historique */}
        {isConnecte && !loadingReco && !hasHistory && (
          <div style={{
            backgroundColor: '#FFF9EC', border: '1px solid #F39C12',
            borderRadius: '14px', padding: '24px 28px',
            display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
          }}>
            <FaMagic style={{ fontSize: '28px', color: '#F39C12', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 4px', color: C.primary, fontSize: '16px', fontWeight: '700' }}>
                Pas encore de recommandations personnalisées
              </h3>
              <p style={{ margin: 0, color: C.muted, fontSize: '14px' }}>
                Effectuez votre première réservation et nous sélectionnerons des hôtels selon vos goûts.
              </p>
            </div>
          </div>
        )}

        {/* Connecté — recommandations personnalisées */}
        {isConnecte && !loadingReco && hasHistory && recommandations.length > 0 && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <FaMagic style={{ color: '#F39C12', fontSize: '20px' }} />
                <h2 style={{ margin: 0, color: C.primary, fontSize: '22px', fontWeight: '700' }}>
                  Recommandés pour vous
                </h2>
              </div>
              {prefRecos && (
                <p style={{ margin: 0, color: C.muted, fontSize: '14px' }}>
                  Basé sur vos préférences :
                  {prefRecos.ville_preferee && (
                    <span style={{ color: C.secondary, fontWeight: '600' }}> {prefRecos.ville_preferee}</span>
                  )}
                  {prefRecos.etoiles_preferees && (
                    <span> · {prefRecos.etoiles_preferees} étoile{prefRecos.etoiles_preferees > 1 ? 's' : ''}</span>
                  )}
                  {prefRecos.prix_moyen > 0 && (
                    <span> · ~{prefRecos.prix_moyen} MAD/nuit</span>
                  )}
                </p>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {recommandations.map((hotel) => (
                <RecoCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Section hôtels */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '40px auto', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
        {/* En-tête section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: C.primary, fontSize: '22px', fontWeight: '700' }}>
              {filtres.ville ? `Hôtels à ${filtres.ville}` : 'Tous nos hôtels'}
            </h2>
            {!loading && (
              <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '14px' }}>
                {hotels.length} établissement{hotels.length !== 1 ? 's' : ''} trouvé{hotels.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Chargement */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px',
              border: '4px solid #e2e8f0', borderTop: `4px solid ${C.secondary}`,
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: C.muted }}>Chargement des hôtels...</p>
          </div>
        )}

        {/* Erreur */}
        {error && !loading && (
          <div style={{
            backgroundColor: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#991b1b',
          }}>
            <FaHotel style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: '600' }}>{error}</p>
          </div>
        )}

        {/* Grille d'hôtels */}
        {!loading && !error && hotels.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {hotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
          </div>
        )}

        {/* Aucun résultat */}
        {!loading && !error && hotels.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            backgroundColor: C.white, borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <FaHotel style={{ fontSize: '56px', color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ color: C.primary, margin: '0 0 8px' }}>Aucun hôtel trouvé</h3>
            <p style={{ color: C.muted, margin: '0 0 20px' }}>Essayez de modifier vos critères de recherche.</p>
            <button onClick={resetFiltres} style={{
              backgroundColor: C.secondary, color: C.white,
              border: 'none', borderRadius: '8px', padding: '10px 24px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}>
              Voir tous les hôtels
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => { setPage(p); chargerHotels(filtres, p); }} style={{
                width: '40px', height: '40px',
                backgroundColor: p === page ? C.primary : C.white,
                color: p === page ? C.white : C.text,
                border: `1px solid ${p === page ? C.primary : C.border}`,
                borderRadius: '8px', cursor: 'pointer',
                fontWeight: p === page ? '700' : '400',
                fontSize: '14px',
              }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
