import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                    <div className="max-w-xl w-full p-6 bg-gray-900 rounded-lg border border-red-500/50">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
                        <details className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </details>
                        <button
                            className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white transition-colors"
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
