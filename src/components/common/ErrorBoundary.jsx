import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Erreur capturée:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fef2f2',
          padding: '24px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ color: '#dc2626', margin: '0 0 12px' }}>
              Erreur de rendu détectée
            </h2>
            <p style={{ color: '#6b7280', margin: '0 0 16px' }}>
              Une erreur JavaScript s'est produite. Voici les détails :
            </p>
            <pre style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/login';
              }}
              style={{
                marginTop: '16px',
                backgroundColor: '#1B3A6B',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
