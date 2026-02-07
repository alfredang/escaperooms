/* ============================================
   Main - Bootstrap Entry Point
   ============================================ */

import { App } from './app.js';

document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.init();
    window.app = app;
});
