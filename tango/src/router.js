/**
 * Minimal hash-based SPA router.
 *
 * @module router
 */

/** @type {Object<string, { mount: Function, unmount: Function }>} */
const routes = {};
let currentModule = null;
let container = null;

/**
 * Register a route.
 * @param {string} path - Hash path (e.g., '/' or '/tango')
 * @param {{ mount: Function, unmount: Function }} module
 */
export function register(path, module) {
  routes[path] = module;
}

/**
 * Navigate to a path programmatically.
 * @param {string} path
 */
export function navigate(path) {
  window.location.hash = '#' + path;
}

/**
 * Get the current route path.
 * @returns {string}
 */
function getCurrentPath() {
  const hash = window.location.hash || '#/';
  return hash.slice(1) || '/';
}

/**
 * Handle route changes.
 */
async function handleRoute() {
  const path = getCurrentPath();
  const module = routes[path] || routes['/'];

  if (!module) {
    console.warn(`No route registered for: ${path}`);
    return;
  }

  // Unmount current module
  if (currentModule && currentModule.unmount) {
    currentModule.unmount();
  }

  // Clear container
  container.innerHTML = '';

  // Mount new module
  currentModule = module;
  await module.mount(container);
}

/**
 * Initialize the router.
 * @param {HTMLElement} appContainer - The #app element
 */
export function init(appContainer) {
  container = appContainer;
  window.addEventListener('hashchange', handleRoute);

  // Handle initial route
  if (!window.location.hash) {
    window.location.hash = '#/';
  }
  handleRoute();
}
