import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback. Defaults to the built-in recovery UI. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Catches render-time React errors in the subtree and shows a recoverable
 * error screen instead of a blank page.  Wrap route outlets or complex
 * feature sections with this component.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="text-red-400" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Something went wrong</h2>
            <p className="text-sm text-slate-400 max-w-sm">
              An unexpected error occurred. You can try refreshing the page or clicking below to
              recover.
            </p>
            {this.state.errorMessage && (
              <p className="mt-2 text-xs text-slate-500 font-mono">{this.state.errorMessage}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 text-sm bg-[#6366F1] text-white rounded-lg hover:bg-[#5558E3] transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
