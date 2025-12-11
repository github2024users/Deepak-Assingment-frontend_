import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';

// Find the root div in index.html
const container = document.getElementById('root');

// Create React 18 root and render the App component
const root = createRoot(container);
root.render(<App />);
