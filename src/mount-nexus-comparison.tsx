import React from 'react';
import ReactDOM from 'react-dom/client';
import { NexusComparisonSection } from '../components/ui/nexus-comparison-slider';
import '../styles/globals.css';

const mountEl = document.getElementById('nexus-pricing-root');
if (mountEl) {
  const root = ReactDOM.createRoot(mountEl);
  root.render(<NexusComparisonSection />);
}

