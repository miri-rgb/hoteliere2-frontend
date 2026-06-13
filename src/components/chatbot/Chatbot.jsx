// ============================================================
// CHATBOT FLOTTANT — Hôtelière 2.0
// Assistant IA visible sur toutes les pages
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const C = {
  primary:   '#1B3A6B',
  secondary: '#2980B9',
  success:   '#27AE60',
  bg:        '#f5f5f5',
};

const BASE_URL = 'http://localhost:8000/api';

const SUGGESTIONS = [
  '🏖️ Hôtel avec piscine à Marrakech',
  '💰 Budget moins de 800 MAD',
  '⭐ Hôtel 5 étoiles',
  '🌊 Hôtel à Agadir',
];

const MSG_BIENVENUE = {
  id: 0,
  role: 'ia',
  texte: "Bonjour ! 👋 Je suis votre assistant hôtelier.\nDécrivez ce que vous cherchez et je vous recommande les meilleurs hôtels du Maroc !",
  hotels: [],
  showSuggestions: true,
};

// ── Carte hôtel dans le chat ────────────────────────────────
const HotelCarte = ({ hotel, onVoir }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onVoir(hotel.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#fff',
        border: `1px solid ${hovered ? C.secondary : '#ddd'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '5px 0',
        cursor: 'pointer',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
        transition: 'all 0.2s',
      }}
    >
      {/* Miniature photo */}
      {hotel.image && (
        <img
          src={hotel.image}
          alt={hotel.nom}
          style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <div style={{ padding: '10px' }}>
      <div style={{ fontWeight: '700', color: C.primary, fontSize: '13px' }}>
        {hotel.nom}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ color: '#6b7280', fontSize: '12px' }}>📍 {hotel.ville}</span>
        <span style={{ color: '#F39C12', fontSize: '12px', letterSpacing: '1px' }}>
          {'★'.repeat(hotel.etoiles || 0)}
        </span>
      </div>
      {hotel.prix_min && (
        <div style={{ color: C.success, fontWeight: '600', fontSize: '12px', marginTop: '4px' }}>
          À partir de {hotel.prix_min} MAD/nuit
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onVoir(hotel.id); }}
        style={{
          marginTop: '8px',
          backgroundColor: C.primary,
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '4px 14px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Voir →
      </button>
      </div>
    </div>
  );
};

// ── Composant principal ─────────────────────────────────────
export default function Chatbot() {
  const navigate = useNavigate();
  const [ouvert, setOuvert]     = useState(false);
  const [messages, setMessages] = useState([MSG_BIENVENUE]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const chatRef        = useRef(null);

  const isConnecte = !!localStorage.getItem('token');

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (ouvert && isConnecte) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [ouvert]);

  // Fermer en cliquant en dehors
  useEffect(() => {
    if (!ouvert) return;
    const handler = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setOuvert(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ouvert]);

  const envoyerMessage = async (texteForce) => {
    const msg = (texteForce !== undefined ? texteForce : input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', texte: msg, hotels: [] },
    ]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id:     Date.now() + 1,
          role:   'ia',
          texte:  data.message || "Désolé, je n'ai pas pu traiter votre demande.",
          hotels: data.hotels || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id:     Date.now() + 1,
          role:   'ia',
          texte:  '❌ Erreur de connexion. Vérifiez que le serveur est démarré.',
          hotels: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={chatRef}
      style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}
    >
      {/* ── Fenêtre chat ─────────────────────────────────── */}
      {ouvert && (
        <div style={{
          position:      'absolute',
          bottom:        '70px',
          right:         0,
          width:         '380px',
          height:        '520px',
          background:    '#fff',
          borderRadius:  '15px',
          boxShadow:     '0 10px 30px rgba(0,0,0,0.2)',
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
        }}>

          {/* Header */}
          <div style={{
            background:      C.primary,
            color:           '#fff',
            padding:         '15px 20px',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'space-between',
            flexShrink:      0,
          }}>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>
              🤖 Assistant Hôtelière 2.0
            </span>
            <button
              onClick={() => setOuvert(false)}
              style={{
                background:     'rgba(255,255,255,0.2)',
                border:         'none',
                color:          '#fff',
                borderRadius:   '50%',
                width:          '28px',
                height:         '28px',
                cursor:         'pointer',
                fontSize:       '18px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                lineHeight:     1,
              }}
            >
              ×
            </button>
          </div>

          {/* Zone messages */}
          <div style={{
            flex:          1,
            overflowY:     'auto',
            padding:       '15px',
            background:    C.bg,
            display:       'flex',
            flexDirection: 'column',
          }}>

            {/* Utilisateur non connecté */}
            {!isConnecte ? (
              <div style={{
                backgroundColor: '#fff',
                borderRadius:    '0 12px 12px 12px',
                padding:         '20px',
                boxShadow:       '0 1px 3px rgba(0,0,0,0.1)',
                textAlign:       'center',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔐</div>
                <p style={{ margin: '0 0 14px', color: '#374151', fontSize: '14px', lineHeight: '1.6' }}>
                  Connectez-vous pour utiliser l'assistant IA
                </p>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    backgroundColor: C.primary,
                    color:           '#fff',
                    border:          'none',
                    borderRadius:    '8px',
                    padding:         '10px 24px',
                    fontSize:        '14px',
                    fontWeight:      '600',
                    cursor:          'pointer',
                  }}
                >
                  Se connecter
                </button>
              </div>
            ) : (
              <>
                {/* Liste des messages */}
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {/* Bulle */}
                    <div style={{
                      backgroundColor: msg.role === 'ia' ? '#fff' : C.primary,
                      color:           msg.role === 'ia' ? '#374151' : '#fff',
                      borderRadius:    msg.role === 'ia' ? '0 12px 12px 12px' : '12px 0 12px 12px',
                      padding:         '10px 15px',
                      maxWidth:        '80%',
                      marginBottom:    '6px',
                      marginLeft:      msg.role === 'user' ? 'auto' : undefined,
                      boxShadow:       '0 1px 3px rgba(0,0,0,0.08)',
                      fontSize:        '13px',
                      lineHeight:      '1.55',
                      whiteSpace:      'pre-wrap',
                    }}>
                      {msg.texte}
                    </div>

                    {/* Cartes hôtels recommandés */}
                    {msg.hotels && msg.hotels.length > 0 && (
                      <div style={{ maxWidth: '88%', marginBottom: '6px' }}>
                        {msg.hotels.map((hotel) => (
                          <HotelCarte
                            key={hotel.id}
                            hotel={hotel}
                            onVoir={(id) => { navigate(`/hotels/${id}`); setOuvert(false); }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Suggestions rapides (message de bienvenue uniquement) */}
                    {msg.showSuggestions && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => envoyerMessage(s)}
                            style={{
                              backgroundColor: '#fff',
                              border:          `1px solid ${C.secondary}`,
                              borderRadius:    '20px',
                              padding:         '7px 14px',
                              fontSize:        '12px',
                              color:           C.secondary,
                              cursor:          'pointer',
                              textAlign:       'left',
                              fontWeight:      '500',
                              transition:      'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Animation de chargement */}
                {loading && (
                  <div style={{
                    backgroundColor: '#fff',
                    borderRadius:    '0 12px 12px 12px',
                    padding:         '12px 16px',
                    maxWidth:        '80%',
                    boxShadow:       '0 1px 3px rgba(0,0,0,0.08)',
                    fontSize:        '13px',
                    color:           '#6b7280',
                    display:         'flex',
                    alignItems:      'center',
                    gap:             '6px',
                  }}>
                    🤖
                    <span style={{ letterSpacing: '2px', fontSize: '18px' }}>
                      <DotAnimation />
                    </span>
                  </div>
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Zone input */}
          {isConnecte && (
            <div style={{
              display:       'flex',
              padding:       '10px',
              background:    '#fff',
              borderTop:     '1px solid #eee',
              gap:           '8px',
              flexShrink:    0,
              alignItems:    'center',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    envoyerMessage();
                  }
                }}
                placeholder="Décrivez votre hôtel idéal..."
                disabled={loading}
                style={{
                  flex:         1,
                  padding:      '10px 14px',
                  border:       '1px solid #ddd',
                  borderRadius: '20px',
                  outline:      'none',
                  fontSize:     '13px',
                  color:        '#374151',
                }}
              />
              <button
                onClick={() => envoyerMessage()}
                disabled={loading || !input.trim()}
                style={{
                  backgroundColor: loading || !input.trim() ? '#d1d5db' : C.primary,
                  color:           '#fff',
                  border:          'none',
                  borderRadius:    '50%',
                  width:           '40px',
                  height:          '40px',
                  cursor:          loading || !input.trim() ? 'not-allowed' : 'pointer',
                  fontSize:        '18px',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  flexShrink:      0,
                  transition:      'background-color 0.2s',
                }}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Bouton flottant ──────────────────────────────── */}
      <button
        onClick={() => setOuvert((prev) => !prev)}
        style={{
          width:           '60px',
          height:          '60px',
          borderRadius:    '50%',
          backgroundColor: C.primary,
          border:          'none',
          cursor:          'pointer',
          fontSize:        '28px',
          boxShadow:       '0 4px 15px rgba(0,0,0,0.3)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          transition:      'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform  = 'scale(1.1)';
          e.currentTarget.style.boxShadow  = '0 6px 20px rgba(0,0,0,0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform  = 'scale(1)';
          e.currentTarget.style.boxShadow  = '0 4px 15px rgba(0,0,0,0.3)';
        }}
      >
        {ouvert ? '✕' : '🤖'}
      </button>
    </div>
  );
}

// ── Animation des points de chargement ─────────────────────
function DotAnimation() {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const iv = setInterval(() => {
      setDots((d) => d.length >= 3 ? '.' : d + '.');
    }, 400);
    return () => clearInterval(iv);
  }, []);
  return <span>{dots}</span>;
}
