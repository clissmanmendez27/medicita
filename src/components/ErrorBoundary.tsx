import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught unexpected error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-block">
              Error Inesperado Detectado
            </span>

            <h2 className="text-xl font-extrabold text-slate-900 font-sans">
              Lo sentimos, ocurrió un problema técnico
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed">
              El sistema ha registrado la incidencia y protegido tus datos clínicos. Puedes intentar recargar la vista o volver a la pantalla principal.
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700 text-left overflow-x-auto max-h-24">
                {this.state.error.message || 'Error desconocido'}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reintentar</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Volver al inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
