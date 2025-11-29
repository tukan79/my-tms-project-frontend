import React from 'react';
import PropTypes from 'prop-types';
import api from '@/services/api.js'; // jeśli chcesz raportować błędy do backendu

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      autoRetryCountdown: null,
    };

    this.retryTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Component Error Caught:', error, errorInfo);
    this.setState({ errorInfo });

    // 1️⃣ Zapisz błąd lokalnie (np. dla diagnostyki)
    const errorData = {
      message: error?.toString(),
      stack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: globalThis.location?.href,
      userAgent: globalThis.navigator?.userAgent,
    };
    localStorage.setItem('lastError', JSON.stringify(errorData));

    // 2️⃣ (Opcjonalnie) Wyślij do backendu
    api.post('/api/feedback/report-bug', {
      description: error?.message || 'React component crash',
      context: errorData,
    }).catch(() => {
      // Pomijamy błędy raportowania
    });

    // 3️⃣ Automatyczne odświeżenie po X sekundach
    const autoRetry = this.props.autoRetry ?? 0; // domyślnie wyłączone
    if (autoRetry > 0) {
      let countdown = autoRetry;
      this.setState({ autoRetryCountdown: countdown });
      this.retryTimer = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(this.retryTimer);
          this.handleReset();
        } else {
          this.setState({ autoRetryCountdown: countdown });
        }
      }, 1000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) clearInterval(this.retryTimer);
  }

  handleReset = () => {
    if (this.retryTimer) clearInterval(this.retryTimer);
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        autoRetryCountdown: null,
      });
    }
  };

  render() {
    const { hasError, error, errorInfo, autoRetryCountdown } = this.state;

    if (hasError) {
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>⚠️ Something went wrong!</h2>
          <p>We’re sorry — an unexpected error occurred.</p>

          {autoRetryCountdown !== null && (
            <p style={{ color: 'gray', marginTop: '0.5rem' }}>
              Retrying automatically in {autoRetryCountdown}s...
            </p>
          )}

          <details
            style={{
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              padding: '1rem',
              borderRadius: '8px',
              marginTop: '1rem',
            }}
          >
            <summary>Error details</summary>
            {isDev ? (
              <>
                {error?.toString()}
                <br />
                {errorInfo?.componentStack}
              </>
            ) : (
              <p>Technical details hidden in production mode.</p>
            )}
          </details>

          <button
            onClick={this.handleReset}
            className="btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Try Again Now
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  autoRetry: PropTypes.number,
  onReset: PropTypes.func,
};
