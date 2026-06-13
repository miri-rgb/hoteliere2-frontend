import { Link, useLocation } from 'react-router-dom';

const C = { primary: '#1B3A6B', secondary: '#2980B9', white: '#ffffff' };

const LINKS = [
  { to: '/admin',              emoji: '📊', label: 'Dashboard'     },
  { to: '/admin/hotels',       emoji: '🏨', label: 'Hôtels'        },
  { to: '/admin/chambres',     emoji: '🛏️', label: 'Chambres'      },
  { to: '/admin/reservations', emoji: '📅', label: 'Réservations'  },
  { to: '/admin/users',        emoji: '👥', label: 'Utilisateurs'  },
];

export default function AdminSidebar() {
  const location = useLocation();
  const isActive = (path) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <aside style={{
      width: '220px',
      backgroundColor: C.primary,
      minHeight: 'calc(100vh - 64px)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '20px 20px 10px',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
      }}>
        Administration
      </div>

      {LINKS.map((link) => (
        <Link key={link.to} to={link.to} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          color: isActive(link.to) ? C.white : 'rgba(255,255,255,0.6)',
          textDecoration: 'none',
          backgroundColor: isActive(link.to) ? 'rgba(255,255,255,0.12)' : 'transparent',
          borderLeft: `3px solid ${isActive(link.to) ? C.secondary : 'transparent'}`,
          fontSize: '14px',
          fontWeight: isActive(link.to) ? '700' : '400',
          transition: 'all 0.15s',
        }}>
          <span style={{ fontSize: '15px' }}>{link.emoji}</span>
          {link.label}
        </Link>
      ))}
    </aside>
  );
}
