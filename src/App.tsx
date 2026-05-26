import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Gallery from './pages/Gallery';
import GalleryDetail from './pages/GalleryDetail';
import Wiki from './pages/Wiki';
import WikiArticle from './pages/WikiArticle';

import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminGallery from './pages/AdminGallery';
import News from './pages/News';
import CalendarPage from './pages/CalendarPage';

/**
 * Główny komponent aplikacji definiujący strukturę nawigacji (Routing).
 * Używa React Router do mapowania adresów URL na odpowiednie komponenty stron.
 */
import { createBrowserRouter, RouterProvider, createRoutesFromElements } from 'react-router-dom';
import ComingSoon from './components/ComingSoon';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="aktualnosci" element={<ComingSoon title="Aktualności" />} />
      <Route path="o-nas" element={<ComingSoon title="O nas" />} />
      <Route path="wydarzenia" element={<Events />} />
      <Route path="wydarzenia/:id" element={<EventDetail />} />
      <Route path="kalendarz" element={<CalendarPage />} />
      <Route path="galeria" element={<ComingSoon title="Galeria" />} />
      <Route path="galeria/:id" element={<ComingSoon title="Galeria" />} />
      <Route path="wiki" element={<ComingSoon title="Wiki" />} />
      <Route path="wiki/:id" element={<ComingSoon title="Wiki" />} />

      {/* Chronione ścieżki - wymagają zalogowania */}
      <Route path="profil" element={<ProtectedRoute requiredRole="user"><Profile /></ProtectedRoute>} />
      <Route path="admin" element={<ProtectedRoute requiredRole="user"><Admin /></ProtectedRoute>} />
      <Route path="admin/galeria" element={<ProtectedRoute requiredRole="user"><AdminGallery /></ProtectedRoute>} />
    </Route>
  )
);

export default function App() {
  return (
    <RouterProvider router={router} />
  );
}

