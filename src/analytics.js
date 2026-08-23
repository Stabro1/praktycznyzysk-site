(function () {
  const endpoint = "https://statystykilp.vercel.app/api/track";
  const gaId = "G-XDC02MGC7M";
  const params = new URLSearchParams(window.location.search);
  if (params.get("owner") === "1" || params.get("no-track") === "1") {
    localStorage.setItem("pz_analytics_disabled", "1");
  }
  if (params.get("owner") === "0" || params.get("track") === "1") {
    localStorage.removeItem("pz_analytics_disabled");
  }
  const analyticsDisabled = localStorage.getItem("pz_analytics_disabled") === "1";
  window[`ga-disable-${gaId}`] = analyticsDisabled;
  if (analyticsDisabled) return;

  window.praktycznyZyskEvents = window.praktycznyZyskEvents || [];

  function visitId() {
    const key = "pz_vid";
    let id = localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      localStorage.setItem(key, id);
    }
    return id;
  }

  function send(event) {
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    const payload = {
      site: "pz",
      ...event,
      path: window.location.pathname,
      title: document.title,
      ref: document.referrer || "direct",
      vid: visitId(),
      utm_source: query.utm_source || "",
      utm_medium: query.utm_medium || "",
      utm_campaign: query.utm_campaign || "",
      utm_content: query.utm_content || "",
      utm_term: query.utm_term || ""
    };
    window.praktycznyZyskEvents.push({ ...payload, at: new Date().toISOString() });
    if (typeof window.gtag === "function") {
      window.gtag("event", event.type || "custom", {
        event_category: event.category || "engagement",
        event_label: event.label || event.target || "",
        offer_slug: event.offer_slug || ""
      });
    }
    const url = new URL(endpoint);
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    const img = new Image();
    img.referrerPolicy = "no-referrer-when-downgrade";
    img.src = url.toString();
  }

  send({ type: "view" });

  document.addEventListener("click", function (event) {
    const link = event.target.closest("[data-track]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    const label = link.dataset.trackLabel || link.textContent.trim();
    send({
      type: "click",
      category: href.startsWith("http") ? "affiliate" : "navigation",
      label,
      offer_slug: link.dataset.trackTarget || "",
      target: `${link.dataset.track || "link"}:${label}:${href}`
    });
  });
})();
