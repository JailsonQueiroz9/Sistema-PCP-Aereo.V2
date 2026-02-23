
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css'; // Importação essencial para o Vite processar o Tailwind

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento root para montar a aplicação.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
