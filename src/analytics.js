(function () {
  window.praktycznyZyskEvents = window.praktycznyZyskEvents || [];

  function track(event) {
    window.praktycznyZyskEvents.push({
      ...event,
      path: window.location.pathname,
      at: new Date().toISOString()
    });
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest("[data-track]");
    if (!link) return;
    track({
      type: link.dataset.track,
      label: link.dataset.trackLabel || link.textContent.trim(),
      href: link.getAttribute("href")
    });
  });
})();
