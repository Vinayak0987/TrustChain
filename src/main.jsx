import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import all CSS mimicking the static HTML <link> tags
import './styles/design-system.css';
import './styles/app.css';
import './styles/filters.css';
import './styles/landing.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
