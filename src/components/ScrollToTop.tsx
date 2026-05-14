import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Komponent automatycznie przewijający stronę na górę przy każdej zmianie ścieżki (URL).
 * Rozwiązuje problem zachowania pozycji przewijania między podstronami w React Router.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
