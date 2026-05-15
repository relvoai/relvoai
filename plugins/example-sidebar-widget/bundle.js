/**
 * Example sidebar widget — frontend bundle.
 *
 * This file is shipped as a static asset and loaded by the admin SPA when the
 * plugin is enabled. It must self-register via the global Relvo AI plugin API.
 */
(function () {
  if (typeof window === 'undefined' || !window.Relvo || typeof window.Relvo.register !== 'function') {
    return;
  }

  window.Relvo.register({
    slug: 'example-sidebar-widget',
    slot: 'sidebar.section',
    component: function () {
      var el = document.createElement('div');
      el.className = 'relvoai-plugin-example-sidebar';
      el.textContent = 'Hello from example-sidebar-widget!';
      return el;
    },
    when: function () { return true; },
  });
})();
