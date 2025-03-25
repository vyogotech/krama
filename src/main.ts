import { createApp } from 'vue'
import './style.css'
import 'frappe-datatable/dist/frappe-datatable.css'
import DataTable from 'frappe-datatable'
import Sortable from 'sortablejs'
import Clusterize from 'clusterize.js'

import App from './App.vue'
import { createPinia } from 'pinia';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.mount('#app');
