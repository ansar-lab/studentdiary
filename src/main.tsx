import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppLoaderWrapper from "@/components/AppLoaderWrapper";
import "./index.css";
import { Workbox } from 'workbox-window';

// PWA registration with Workbox
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const wb = new Workbox('/sw.js');
    
    // Add event listeners for various service worker events
    wb.addEventListener('installed', event => {
      if (event.isUpdate) {
        console.log('New content is available, please refresh.');
        if (confirm('New content is available. Reload to update?')) {
          window.location.reload();
        }
      } else {
        console.log('App is ready for offline use.');
      }
    });

    wb.addEventListener('activated', event => {
      if (event.isUpdate) {
        console.log('Service worker has been updated.');
      } else {
        console.log('Service worker has been installed and is active.');
      }
    });

    // Register the service worker
    wb.register()
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<AppLoaderWrapper />);
