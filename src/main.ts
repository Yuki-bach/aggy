import { mount } from "svelte";
import { initI18n } from "./lib/i18n.svelte";
import App from "./App.svelte";

// Initialize i18n first (before any UI rendering)
initI18n();

// Mount root Svelte app
mount(App, { target: document.querySelector("#app")! });
