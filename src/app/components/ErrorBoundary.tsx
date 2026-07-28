'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IconWarning } from './Icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[React ErrorBoundary Caught Exception]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: 30,
          margin: 20,
          background: 'var(--danger-50)',
          border: '1px solid var(--danger-200)',
          borderRadius: 12,
          textAlign: 'center'
        }}>
          <div style={{ color: 'var(--danger-600)', fontSize: '2.5rem', marginBottom: 12 }}>
            <IconWarning size={40} />
          </div>
          <h3 style={{ color: 'var(--danger-800)', fontSize: '1.2rem', marginBottom: 8 }}>
            Bir Hata Oluştu (Error Caught)
          </h3>
          <p style={{ color: 'var(--danger-700)', fontSize: '0.9rem', marginBottom: 16 }}>
            {this.state.error?.message || 'Arayüz yüklenirken bir beklenmeyen hata meydana geldi.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tekrar Deneyin
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
