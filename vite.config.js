import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: { port: 5173, host: '0.0.0.0', allowedHosts: true, cors: true },
  preview: { port: 4173, host: true },
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
        home: resolve(__dirname, 'screens/home.html'),
        restaurant: resolve(__dirname, 'screens/restaurant.html'),
        cart: resolve(__dirname, 'screens/cart.html'),
        checkout: resolve(__dirname, 'screens/checkout.html'),
        tracking: resolve(__dirname, 'screens/tracking.html'),
        success: resolve(__dirname, 'screens/success.html'),
        account: resolve(__dirname, 'screens/account.html'),
        login: resolve(__dirname, 'screens/login.html'),
        ai: resolve(__dirname, 'screens/ai.html'),
      },
    },
  },
});
