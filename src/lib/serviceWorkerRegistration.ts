// File to register service worker
import { dev } from '$app/environment';

// Register service worker only in production
export function registerServiceWorker() {
    if ('serviceWorker' in navigator && !dev) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/service-worker.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}
