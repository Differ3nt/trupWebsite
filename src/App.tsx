import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Gallery from './pages/Gallery';
import GalleryDetail from './pages/GalleryDetail';
import Wiki from './pages/Wiki';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="o-nas" element={<About />} />
          <Route path="wydarzenia" element={<Events />} />
          <Route path="wydarzenia/:id" element={<EventDetail />} />
          <Route path="galeria" element={<Gallery />} />
          <Route path="galeria/:id" element={<GalleryDetail />} />
          <Route path="wiki" element={<Wiki />} />
          <Route path="profil" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

