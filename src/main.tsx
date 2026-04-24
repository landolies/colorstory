import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import './index.css';
import { Index } from './pages/Index';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Index />
    </ErrorBoundary>
    <Toaster position="bottom-center" duration={1500} />
  </StrictMode>,
);
