import { render } from "preact";
import { initI18n } from "./lib/i18n";
import App from "./App";

// Initialize i18n first (before any UI rendering)
initI18n();

// Mount root Preact app
render(<App />, document.getElementById("app")!);
