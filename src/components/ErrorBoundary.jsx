// src/components/ErrorBoundary.jsx
import React from 'react';
import PropTypes from 'prop-types';
import api from '@/services/api.js';

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

  /* --------------------------------------------
     STATIC: Catch render-time errors
  -------------------------------------------- */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /* --------------------------------------------
     FULL CATCH: lifecycle-hook for side effects
  -------------------------------------------- */
  componentDidCatch(error, errorInfo) {
    console.error('❌ React ErrorBoundary caught:', error, errorInfo);

    this.setState({ errorInfo });

    /* --------------------------------------------
       1) LOCAL STORAGE FALLBACK TRACE
    -------------------------------------------- */
    try {
      const errorData = {
        message: error?.toString(),
        stack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        url: globalThis?.location?.href,
        userAgent: globalThis?.navigator?.userAgent,
      };

      localStorage.setItem('lastError', JSON.stringify(errorData));
    } catch {
      // ignore storage issues
    }

    /* --------------------------------------------
       2) REPORT TO BACKEND (optional)
    -------------------------------------------- */
    try {
      api.post('/api/feedback/report-bug', {
        description: error?.message || 'React component crash',
        context: {
          stack: errorInfo?.componentStack,
          url: globalThis?.location?.href,
        },
      }).catch(() => {});
    } catch {
      // swallow any reporting issues
    }

    /* --------------------------------------------
       3) AUTO RETRY (IF ENABLED)
    -------------------------------------------- */
    const autoRetry = this.props.autoRetry ?? 0;
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

  /* --------------------------------------------
     CLEANUP
  -------------------------------------------- */
  componentWillUnmount() {
    if (this.retryTimer) clearInterval(this.retryTimer);
  }

  /* --------------------------------------------
     RESET HANDLER
  -------------------------------------------- */
  handleReset = () => {
    if (this.retryTimer) clearInterval(this.retryTimer);

    if (this.props.onReset) {
      this.props.onReset();
      return;
    }

    // standard fallback reset
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      autoRetryCountdown: null,
    });
  };

  /* --------------------------------------------
     RENDER
  -------------------------------------------- */
  render() {
    const { hasError, error, errorInfo, autoRetryCountdown } = this.state;

    if (hasError) {
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>⚠️ Something went wrong</h2>
          <p>An unexpected UI error occurred.</p>

          {/* Auto retry countdown */}
          {autoRetryCountdown !== null && (
            <p className="text-muted">
              Retrying automatically in <strong>{autoRetryCountdown}s</strong>...
            </p>
          )}

          {/* Error details (dev only) */}
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
                <strong>{error?.toString()}</strong>
                <br />
                {errorInfo?.componentStack}
              </>
            ) : (
              <p>Technical details hidden in production mode.</p>
            )}
          </details>

          <button
            type="button"
            onClick={this.handleReset}
            className="btn-primary"
            style={{ marginTop: '1.5rem' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/* --------------------------------------------
   PROP TYPES
-------------------------------------------- */
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  autoRetry: PropTypes.number,
  onReset: PropTypes.func,
};
