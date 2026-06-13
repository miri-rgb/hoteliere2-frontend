// ============================================================
// FOOTER — Hôtelière 2.0
// Pied de page avec villes marocaines et copyright
// ============================================================

import { Link } from 'react-router-dom';
import { FaHotel, FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';

const VILLES = ['Marrakech', 'Agadir', 'Tanger', 'Fès', 'Casablanca', 'Rabat'];

export default function Footer() {
  const annee = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: '#1B3A6B',
      color: '#ffffff',
      marginTop: 'auto',
    }}>
      {/* Corps du footer */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 24px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '40px',
      }}>
        {/* Colonne 1 : Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <FaHotel style={{ color: '#2980B9', fontSize: '26px' }} />
            <span style={{ fontSize: '20px', fontWeight: '700' }}>
              Hôtelière <span style={{ color: '#2980B9' }}>2.0</span>
            </span>
          </div>
          <p style={{ color: '#a0aec0', lineHeight: '1.7', fontSize: '14px', margin: 0 }}>
            La plateforme de référence pour découvrir et réserver les meilleurs hôtels du Maroc.
            Voyagez avec confiance.
          </p>
        </div>

        {/* Colonne 2 : Destinations */}
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#2980B9' }}>
            Nos destinations
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {VILLES.map((ville) => (
              <li key={ville}>
                <Link
                  to={`/hotels?ville=${ville}`}
                  style={{
                    color: '#a0aec0',
                    textDecoration: 'none',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#2980B9'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#a0aec0'}
                >
                  <FaMapMarkerAlt style={{ fontSize: '12px' }} />
                  Hôtels à {ville}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne 3 : Navigation */}
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#2980B9' }}>
            Navigation
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Accueil', to: '/hotels' },
              { label: 'Mes réservations', to: '/profile' },
              { label: 'Connexion', to: '/login' },
              { label: 'Inscription', to: '/register' },
            ].map(({ label, to }) => (
              <li key={to}>
                <Link to={to} style={{
                  color: '#a0aec0',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#2980B9'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#a0aec0'}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne 4 : Contact */}
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#2980B9' }}>
            Contact
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a0aec0', fontSize: '14px' }}>
              <FaMapMarkerAlt style={{ color: '#2980B9', flexShrink: 0 }} />
              Avenue Mohammed V, Casablanca, Maroc
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a0aec0', fontSize: '14px' }}>
              <FaEnvelope style={{ color: '#2980B9', flexShrink: 0 }} />
              contact@hoteliere.ma
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a0aec0', fontSize: '14px' }}>
              <FaPhone style={{ color: '#2980B9', flexShrink: 0 }} />
              +212 5 22 00 00 00
            </div>
          </div>
        </div>
      </div>

      {/* Barre du bas */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 24px',
        textAlign: 'center',
        color: '#718096',
        fontSize: '13px',
      }}>
        © {annee} <strong style={{ color: '#2980B9' }}>Hôtelière 2.0</strong> — Tous droits réservés |
        Plateforme de réservation hôtelière marocaine
      </div>
    </footer>
  );
}
