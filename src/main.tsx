import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './contexts/AppContext.tsx';
import './index.css';

/**
 * Rejestracja Service Workera dla obsługi powiadomień PWA i Offline.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker zarejestrowany pomyślnie z zakresem: ', registration.scope);
      },
      (err) => {
        console.log('ServiceWorker - błąd rejestracji: ', err);
      }
    );
  });
}

// Inicjalizacja głównego drzewa React
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* AppProvider zarządza stanem użytkownika i autoryzacją w całej aplikacji */}
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
