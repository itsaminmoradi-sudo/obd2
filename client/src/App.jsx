import React from 'react';
import { OBDProvider } from './context/OBDContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';

export default function App() {
  return (
    <OBDProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Home />
        </main>
      </div>
    </OBDProvider>
  );
}
