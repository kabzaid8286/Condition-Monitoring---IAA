import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    try {
      localStorage.setItem('condition_monitoring_active_view', 'overview');
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-primary)' }}>
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Something went wrong loading this view</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="btn"
              style={{
                background: 'var(--accent)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset to Overview
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

