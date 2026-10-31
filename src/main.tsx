import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Salão Luxe Uncaught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8a7122] border border-[#d4af37]/30 flex items-center justify-center text-black font-extrabold text-xl mb-4 shadow-xl">
            SL
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Salão Luxe — Portal VIP</h1>
          <p className="text-neutral-400 text-xs max-w-md mb-6 leading-relaxed">
            A aplicação foi inicializada com segurança. Clique no botão abaixo para restaurar a prévia.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-3 bg-[#d4af37] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#d4af37]/20 hover:bg-[#b8860b] transition-all cursor-pointer"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
