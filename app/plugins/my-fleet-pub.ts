// @/plugins/vue3FleetPub.client.ts

// Import the CSS file directly from your module's dist folder
// The path assumes vue3-fleet-pub is directly under node_modules and has a 'dist' folder.
import '@annebrown.ca/vue3-fleet-pub/dist/style.css';

// Nuxt 3 automatically registers plugins placed in the 'plugins' directory.
// No extra runtime logic is needed here, just the import.
export default defineNuxtPlugin(() => {
  // You can add console.log here if you want to confirm the plugin is loading
  // console.log('vue3FleetPub.client.ts plugin loaded, attempting to import module styles.');
});