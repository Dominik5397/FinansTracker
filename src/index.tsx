import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Komentujemy import BrowserRouter, ponieważ nie jest używany
// import { BrowserRouter } from 'react-router-dom';

// Próbujemy uruchomić aplikację nawet jeśli nie ma service workera
let serviceWorkerRegistration;
try {
  serviceWorkerRegistration = require('./serviceWorkerRegistration');
} catch (e) {
  console.warn('Service Worker registration failed:', e);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Włączamy Service Worker tylko jeśli dostępny
if (serviceWorkerRegistration) {
  serviceWorkerRegistration.register({
    onUpdate: (registration: ServiceWorkerRegistration) => {
      // Gdy pojawi się nowa wersja, powiadom użytkownika
      const waitingServiceWorker = registration.waiting;
      
      if (waitingServiceWorker) {
        waitingServiceWorker.addEventListener("statechange", (event: Event) => {
          const target = event.target as ServiceWorker;
          if (target.state === "activated") {
            // Nowa wersja jest gotowa, odśwież stronę
            window.location.reload();
          }
        });
        waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
      }
    },
  });
}
