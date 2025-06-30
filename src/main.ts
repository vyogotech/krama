import { createApp } from 'vue'
import './style.css'
import 'frappe-datatable/dist/frappe-datatable.css'
import DataTable from 'frappe-datatable'
import Sortable from 'sortablejs'
import Clusterize from 'clusterize.js'

import App from './App.vue'
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import enMessages from './locales/en.json'; // Default English messages

const app = createApp(App);

// Setup Pinia
const pinia = createPinia();
app.use(pinia);

// Setup Vue I18n
const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: 'en', // Set default locale
  fallbackLocale: 'en', // Fallback locale
  messages: {
    en: enMessages, // Load default English messages
  },
  // silentTranslationWarn: true, // Optionally suppress warnings for missing translations during development
});
app.use(i18n);

app.mount('#app');
