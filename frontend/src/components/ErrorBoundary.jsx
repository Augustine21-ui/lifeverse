// frontend/src/components/ErrorBoundary.jsx
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🛑 ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });

    // Optional: send to your error service
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify({ error: error.message, stack: error.stack }) }).catch(() => {});
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Allow custom fallback
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="max-w-md w-full card p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={28} />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-white mb-2">
              {this.props.title || 'Something went wrong'}
            </h2>
            <p className="text-sm text-white/50 mb-5">
              {this.props.message ||
                "This section couldn't load. Your data is safe — try again."}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 text-xs text-white/40 bg-black/20 rounded-lg p-3">
                <summary className="cursor-pointer">Error details (dev only)</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
              >
                <RefreshCw size={14} /> Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
              >
                <Home size={14} /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}