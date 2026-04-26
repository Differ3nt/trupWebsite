import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Gallery from './pages/Gallery';
import GalleryDetail from './pages/GalleryDetail';
import Wiki from './pages/Wiki';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminGallery from './pages/AdminGallery';
import News from './pages/News';
import CalendarPage from './pages/CalendarPage';

/**
 * Główny komponent aplikacji definiujący strukturę nawigacji (Routing).
 * Używa React Router do mapowania adresów URL na odpowiednie komponenty stron.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout zawiera elementy wspólne dla wszystkich stron: Header, Footer, Sidebar */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="aktualnosci" element={<News />} />
          <Route path="o-nas" element={<About />} />
          <Route path="wydarzenia" element={<Events />} />
          <Route path="wydarzenia/:id" element={<EventDetail />} />
          <Route path="kalendarz" element={<CalendarPage />} />
          <Route path="galeria" element={<Gallery />} />
          <Route path="galeria/:id" element={<GalleryDetail />} />
          <Route path="wiki" element={<Wiki />} />
          
          {/* Chronione ścieżki - wymagają zalogowania */}
          <Route path="profil" element={<ProtectedRoute requiredRole="user"><Profile /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute requiredRole="user"><Admin /></ProtectedRoute>} />
          <Route path="admin/galeria" element={<ProtectedRoute requiredRole="user"><AdminGallery /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

