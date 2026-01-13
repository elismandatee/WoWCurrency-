
import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  /**
   * Making children optional to ensure compatibility with various usage patterns.
   */
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in their child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 */
// Fix: Explicitly use React.Component with generics and declare properties to ensure 'props' and 'state' are visible to the TypeScript compiler.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly declare props and state as class properties to resolve "Property does not exist" errors in specific TS environments.
  public props: ErrorBoundaryProps;
  public state: ErrorBoundaryState = {
    hasError: false
  };

  // Fix: Standard constructor that calls super(props) and explicitly sets this.props to satisfy inheritance tracking.
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service for debugging.
    console.error("Uncaught error:", error, errorInfo);
  }

  public render(): ReactNode {
    // Check if an error has occurred to determine which UI to display.
    // Fix: Accessed this.state which is now correctly visible via property declaration.
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-800 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h1>
          <p className="text-center mb-6">We've encountered an unexpected error. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    // Fix: Access to this.props is now correctly resolved by the compiler using the explicit class property declaration.
    return this.props.children;
  }
}

export default ErrorBoundary;
