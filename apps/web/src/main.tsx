import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthGate from './auth/AuthGate';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>{(user, accessToken, onAccessTokenChange, onLogout) => <App user={user} accessToken={accessToken} onAccessTokenChange={onAccessTokenChange} onLogout={onLogout} />}</AuthGate>
  </React.StrictMode>,
);
