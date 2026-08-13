import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "site.json"), "utf8"));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.copyFileSync(path.join(root, "src", "styles.css"), path.join(dist, "styles.css"));
fs.copyFileSync(path.join(root, "src", "analytics.js"), path.join(dist, "analytics.js"));
fs.copyFileSync(path.join(root, "src", "assets", "logo.jpg"), path.join(dist, "logo.jpg"));

const esc = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const jsonLd = (value) =>
  `<script type="application/ld+json">${JSON.stringify(value).replaceAll("<", "\\u003c")}</script>`;
const gaId = "G-XDC02MGC7M";
const indexNowKey = "b4b7f35b8ec64d33877b49d2b9c1b5af";

const stripSlash = (url) => url.replace(/^\/|\/$/g, "");
const absoluteUrl = (url = "/") => `https://${data.domain}${url === "/" ? "/" : url}`;
const previewBase = data.previewBase || "/podglad-stabro";
const outFile = (url) => {
  const clean = stripSlash(url);
  return clean ? path.join(dist, clean, "index.html") : path.join(dist, "index.html");
};
const writePage = (url, html) => {
  const file = outFile(url);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};
const previewUrl = (url) => `${previewBase}${url === "/" ? "" : url}`;
const previewHtml = (html) =>
  html
    .replaceAll(`href="/styles.css"`, `href="/styles.css"`)
    .replaceAll(`src="/analytics.js"`, `src="/analytics.js"`)
    .replaceAll(`href="/`, `href="${previewBase}/`)
    .replaceAll(`href="${previewBase}/styles.css"`, `href="/styles.css"`)
    .replaceAll(`src="${previewBase}/analytics.js"`, `src="/analytics.js"`);
const writePreviewPage = (url, html) => writePage(previewUrl(url), previewHtml(html));

const pillarBySlug = new Map(data.pillars.map((pillar) => [pillar.slug, pillar]));
const typeLabels = {
  guide: "Poradnik",
  ranking: "Ranking",
  comparison: "Porównanie",
  checklist: "Checklista",
  calculator: "Kalkulator",
  faq: "FAQ"
};
const categoryLabels = {
  account: "Konto osobiste",
  "business-account": "Konto firmowe",
  credit: "Kredyt lub pożyczka",
  payday: "Chwilówka / pożyczka online",
  "short-loan": "Chwilówka / pożyczka online",
  savings: "Oszczędzanie",
  insurance: "Ubezpieczenie",
  "credit-card": "Karta kredytowa",
  mortgage: "Kredyt hipoteczny",
  "business-loan": "Kredyt firmowy",
  "car-loan": "Kredyt samochodowy",
  crypto: "Giełda kryptowalut",
  other: "Pozostałe"
};

function titleFromUrl(url) {
  const last = stripSlash(url).split("/").pop() || "strona";
  return last
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const catalogPages = (data.sitemapSections || []).flatMap((section) =>
  section.pages.map((page) => ({
    type: section.type || "guide",
    pillar: section.pillar,
    cta: section.cta || "Sprawdź dalej",
    ctaUrl: section.ctaUrl || (section.pillar ? `/${section.pillar}` : "/"),
    description:
      page.description ||
      `Praktyczny przewodnik w sekcji ${section.label}: najważniejsze informacje, ryzyka i dalsze kroki.`,
    ...page,
    title: page.title || page.label || titleFromUrl(page.url)
  }))
);

const pageByUrl = new Map();
for (const page of [...catalogPages, ...(data.pages || [])]) pageByUrl.set(page.url, page);
const allPages = [...pageByUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
const offers = data.offers || [];
const blogArticles = data.blogArticles || [];
const focusedOfferPages = allPages.filter((page) => offers.some((offer) => offer.pages?.includes(page.url)));
const normalizeLabel = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const toolByTitle = new Map(data.tools.map((tool) => [normalizeLabel(tool.name), `/narzedzia/${tool.slug}`]));
const pageByTitle = new Map(allPages.map((page) => [normalizeLabel(page.title), page.url]));
const seoOverrides = {
  "/finanse/konta-z-premia": {
    title: "Konta z premią 2026 - ranking promocji bankowych | PraktycznyZysk.pl",
    description: "Konta osobiste z premią, bonusy za założenie konta i aktualne promocje bankowe. Sprawdź korzyści, warunki i aktualne promocje."
  },
  "/finanse/ranking-kont-z-premia": {
    title: "Ranking kont z premią 2026 - najlepsze promocje bankowe | PraktycznyZysk.pl",
    description: "Ranking kont z premią: premie za konto, warunki aktywności, opłaty i najważniejsze korzyści dla klienta."
  },
  "/finanse/konta-firmowe-z-premia": {
    title: "Konto firmowe z premią 2026 - ranking kont firmowych | PraktycznyZysk.pl",
    description: "Konta firmowe z premią dla JDG i firm. Porównaj bonusy, opłaty i warunki aktywności."
  },
  "/finanse/ranking-kont-firmowych": {
    title: "Ranking kont firmowych 2026 - konta firmowe z premią | PraktycznyZysk.pl",
    description: "Ranking kont firmowych z premiami, moneybackiem i opłatami. Sprawdź najważniejsze korzyści i warunki promocji."
  },
  "/finanse/chwilowki": {
    title: "Chwilówki online 2026 - pierwsza pożyczka za darmo | PraktycznyZysk.pl",
    description: "Chwilówki online, pierwsza pożyczka za darmo i pożyczki na dowód. Sprawdź RRSO, koszty, terminy spłaty i ryzyka."
  },
  "/finanse/ranking-chwilowek": {
    title: "Ranking chwilówek 2026 - pożyczki online i RRSO 0% | PraktycznyZysk.pl",
    description: "Ranking chwilówek online: darmowe pierwsze pożyczki, pożyczki na dowód, terminy spłaty, koszty i ostrzeżenia."
  },
  "/finanse/kredyty-gotowkowe": {
    title: "Kredyt gotówkowy ranking 2026 - kredyty online | PraktycznyZysk.pl",
    description: "Kredyty gotówkowe online, rankingi i kalkulatory. Sprawdź ratę, RRSO, całkowity koszt i warunki oferty."
  },
  "/finanse/ranking-kredytow-gotowkowych": {
    title: "Ranking kredytów gotówkowych 2026 - kredyt online | PraktycznyZysk.pl",
    description: "Ranking kredytów gotówkowych: RRSO, rata, kwota do spłaty, prowizje i najważniejsze warunki przed wnioskiem."
  },
  "/ubezpieczenia/oc-ac": {
    title: "OC AC 2026 - porównywarka, kalkulator i tanie OC | PraktycznyZysk.pl",
    description: "OC i AC samochodu: porównywarka, kalkulator OC, najtańsze OC, zakres ochrony i koszty po zakupie auta."
  },
  "/ubezpieczenia/ranking-oc": {
    title: "Najtańsze OC 2026 - ranking i kalkulator OC | PraktycznyZysk.pl",
    description: "Najtańsze OC, ranking OC i czynniki wpływające na składkę. Sprawdź, jak porównać polisę i nie przepłacić."
  },
  "/auto/historia-pojazdu": {
    title: "Historia pojazdu 2026 - sprawdzenie VIN i auta przed zakupem | PraktycznyZysk.pl",
    description: "Historia pojazdu, sprawdzenie VIN, raport VIN i checklista przed zakupem auta używanego. Sprawdź auto zanim zapłacisz."
  },
  "/auto/vin": {
    title: "Sprawdzenie VIN 2026 - raport VIN i historia auta | PraktycznyZysk.pl",
    description: "Sprawdzenie VIN, raport VIN, historia pojazdu i sygnały ostrzegawcze przed zakupem auta używanego."
  }
};

const seoLandingPages = [
  {
    url: "/finanse/konta-z-premia-czerwiec-2026",
    title: "Konta z premią czerwiec 2026 - aktualne promocje bankowe",
    description: "Aktualne konta z premią w czerwcu 2026: premie za konto osobiste, warunki aktywności i opłaty.",
    h1: "Konta z premią - czerwiec 2026",
    lead: "Najważniejsze promocje kont osobistych z premią. Zanim złożysz wniosek, sprawdź warunki aktywności, opłaty i termin wypłaty bonusu.",
    pageUrl: "/finanse/konta-z-premia",
    pillar: "finanse",
    keywords: ["konto z premią", "konta z premią ranking", "promocje bankowe", "konto osobiste z premią"]
  },
  {
    url: "/finanse/ranking-chwilowek-czerwiec-2026",
    title: "Ranking chwilówek czerwiec 2026 - pożyczki online i RRSO 0%",
    description: "Ranking chwilówek w czerwcu 2026: pierwsza pożyczka za darmo, pożyczki online, koszty, RRSO i terminy spłaty.",
    h1: "Ranking chwilówek - czerwiec 2026",
    lead: "Porównaj chwilówki i pożyczki online, ale najpierw sprawdź RRSO, całkowity koszt i konsekwencje opóźnienia w spłacie.",
    pageUrl: "/finanse/chwilowki",
    pillar: "finanse",
    keywords: ["ranking chwilówek", "pierwsza pożyczka za darmo", "chwilówki online", "pożyczka online na dowód"]
  },
  {
    url: "/ubezpieczenia/najtansze-oc-2026",
    title: "Najtańsze OC 2026 - kalkulator OC i porównanie polis",
    description: "Najtańsze OC w 2026 roku: jak porównać składkę, od czego zależy cena OC i kiedy sprawdzić OC/AC po zakupie auta.",
    h1: "Najtańsze OC 2026",
    lead: "OC ma taki sam obowiązkowy zakres, ale cena może mocno się różnić. Porównaj składkę, dodatki i warunki przed zakupem polisy.",
    pageUrl: "/ubezpieczenia/oc-ac",
    pillar: "ubezpieczenia",
    keywords: ["najtańsze OC", "kalkulator OC", "porównywarka OC", "tanie OC 2026"]
  },
  {
    url: "/auto/sprawdzenie-vin-historia-pojazdu-2026",
    title: "Sprawdzenie VIN i historia pojazdu 2026 - jak sprawdzić auto",
    description: "Sprawdzenie VIN, historia pojazdu i raport VIN przed zakupem auta. Zobacz, co sprawdzić przed podpisaniem umowy.",
    h1: "Sprawdzenie VIN i historia pojazdu",
    lead: "Najpierw sprawdź historię pojazdu i VIN, potem polisę, koszty po zakupie i finansowanie. To tańsze niż naprawianie złej decyzji.",
    pageUrl: "/auto/historia-pojazdu",
    pillar: "auto",
    keywords: ["historia pojazdu", "sprawdzenie VIN", "raport VIN", "jak sprawdzić auto przed kupnem"]
  }
];

const draftPromoPages = [
  {
    url: "/konkursy-i-promocje",
    title: "Konkursy i promocje, które warto sprawdzić | PraktycznyZysk.pl",
    h1: "Konkursy i promocje, które warto sprawdzić",
    description: "Aktualne konkursy, rabaty, kody promocyjne, bonusy i okazje ograniczone czasowo. Przed skorzystaniem sprawdź zasady, termin i regulamin.",
    category: "Promocje",
    note: "Sprawdź aktualne promocje, rabaty i bonusy w interesującej Cię kategorii.",
    checklist: [
      "Nazwa organizatora i źródło promocji.",
      "Data rozpoczęcia i zakończenia.",
      "Link do regulaminu lub pełnych warunków.",
      "Najważniejsze ograniczenia, wykluczenia i wymagane działania.",
      "Informacja, czy nagroda, rabat albo bonus wymaga zakupu lub rejestracji."
    ]
  }
];

function cardUrl(item = {}) {
  const label = normalizeLabel(item.title || item.label || item.name);
  return item.url || toolByTitle.get(label) || pageByTitle.get(label) || "";
}

function navLinks() {
  return data.primaryNav.map((item) => `<a href="${esc(item.url)}">${esc(item.label)}</a>`).join("");
}

function mobileMenu() {
  return `<details class="mobile-menu">
    <summary>Menu</summary>
    <div class="mobile-menu-panel">
      ${data.primaryNav
        .map((item) => {
          const slug = stripSlash(item.url);
          const pillar = pillarBySlug.get(slug);
          const quick = pillar?.priorityLinks || [];
          return `<div class="mobile-menu-section">
            <a class="mobile-menu-main" href="${esc(item.url)}">${esc(item.label)}</a>
            ${quick.map((link) => `<a href="${esc(link.url)}">${esc(link.label)}</a>`).join("")}
          </div>`;
        })
        .join("")}
      <div class="mobile-menu-section">
        <a class="mobile-menu-main" href="/poradniki">Poradniki</a>
        <a href="/faq">FAQ</a>
      </div>
    </div>
  </details>`;
}

function socialLinks() {
  if (!data.socialLinks?.length) return "";
  return `<div class="social-links">
    ${data.socialLinks
      .map(
        (item) =>
          `<a class="social-link ${esc(item.className || "")}" href="${esc(item.url)}" target="_blank" rel="noopener" aria-label="${esc(item.label)}" title="${esc(item.label)}">${esc(item.icon || item.label)}</a>`
      )
      .join("")}
  </div>`;
}

function breadcrumbs(items = []) {
  if (!items.length) return "";
  return `<nav class="breadcrumbs" aria-label="Breadcrumbs"><a href="/">Start</a>${items
    .map((item) => `<span>/</span><a href="${esc(item.url)}">${esc(item.label)}</a>`)
    .join("")}</nav>`;
}

function breadcrumbSchema(url = "/", crumbs = []) {
  const items = [{ label: "Start", url: "/" }, ...crumbs];
  if (url !== "/" && !items.some((item) => item.url === url)) items.push({ label: titleFromUrl(url), url });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.url)
    }))
  };
}

function baseSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo.jpg"),
    sameAs: data.sameAs || []
  };
}

function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: data.name,
    url: absoluteUrl("/"),
    inLanguage: "pl-PL",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/")}?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

function analyticsHead() {
  return `<script>
    (function(){
      var id='${gaId}';
      var params=new URLSearchParams(window.location.search);
      if(params.get('owner')==='1'||params.get('no-track')==='1') localStorage.setItem('pz_analytics_disabled','1');
      if(params.get('owner')==='0'||params.get('track')==='1') localStorage.removeItem('pz_analytics_disabled');
      window['ga-disable-'+id]=localStorage.getItem('pz_analytics_disabled')==='1';
    })();
  </script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  </script>`;
}

function layout({ url = "/", title, description, body, crumbs = [], noindex = false, schema = [] }) {
  const canonical = absoluteUrl(url);
  const image = absoluteUrl("/logo.jpg");
  const metaDescription =
    (description || "").length >= 110
      ? description
      : `${description || data.description} Sprawdź najważniejsze warunki, koszty, ryzyka i praktyczne kroki przed decyzją.`;
  const cleanDescription = metaDescription.length > 168 ? `${metaDescription.slice(0, 165).trim()}...` : metaDescription;
  const schemaBlocks = [baseSchema(), webSiteSchema(), ...(crumbs.length ? [breadcrumbSchema(url, crumbs)] : []), ...schema];
  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(cleanDescription)}">
  <meta name="robots" content="${noindex ? "noindex,follow" : "index,follow,max-image-preview:large"}">
  <meta name="theme-color" content="#0f172a">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pl_PL">
  <meta property="og:site_name" content="${esc(data.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(cleanDescription)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:image:alt" content="${esc(data.name)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(cleanDescription)}">
  <meta name="twitter:image" content="${esc(image)}">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="icon" href="/logo.jpg" type="image/jpeg">
  <link rel="stylesheet" href="/styles.css">
  ${analyticsHead()}
  ${schemaBlocks.map(jsonLd).join("\n  ")}
  <script defer src="/analytics.js"></script>
</head>
<body>
  <header class="site-header">
    <nav class="nav" aria-label="Główne">
      <a class="brand" href="/"><img class="brand-logo" src="/logo.jpg" alt="" width="42" height="42"><span>${esc(data.shortName)}</span></a>
      <div class="nav-links">${navLinks()}</div>
      ${mobileMenu()}
    </nav>
  </header>
  ${breadcrumbs(crumbs)}
  ${body}
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <strong>${esc(data.name)}</strong>
      </div>
      <div class="footer-links">
        ${data.primaryNav.map((item) => `<a href="${esc(item.url)}">${esc(item.label)}</a>`).join("")}
      </div>
      <div class="footer-links">
        <a href="/poradniki">Poradniki</a>
        <a href="/faq">FAQ</a>
        <a href="/o-nas">O nas</a>
        <a href="/kontakt">Kontakt</a>
      </div>
      ${socialLinks()}
      ${data.legalDisclaimer ? `<p class="legal-disclaimer">${esc(data.legalDisclaimer)}</p>` : ""}
    </div>
  </footer>
</body>
</html>`;
}

function privatePage() {
  return layout({
    url: "/",
    title: `${data.name} | Strona w przygotowaniu`,
    description: "Serwis jest tymczasowo prywatny do czasu uruchomienia finalnej wersji.",
    noindex: true,
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Tryb prywatny</div>
            <h1>PraktycznyZysk.pl jest w przygotowaniu.</h1>
            <p class="lead">Dopracowujemy finalną wersję serwisu, oferty partnerskie, oznaczenia i linki. Publiczna wersja wróci po zakończeniu konfiguracji.</p>
            <div class="notice">Strona nie prezentuje teraz rankingów, ofert ani linków afiliacyjnych.</div>
          </div>
        </div>
      </section>
    </main>`
  });
}

function externalLinkAttrs(url, sponsored = false) {
  const isExternal = /^https?:\/\//i.test(url || "");
  if (!isExternal) return "";
  return ` target="_blank" rel="${sponsored ? "nofollow sponsored noopener" : "noopener"}"`;
}

function draftPromoPage(page) {
  return layout({
    url: page.url,
    title: page.title,
    description: page.description,
    noindex: true,
    crumbs: [{ label: page.h1, url: page.url }],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">${esc(page.category)}</div>
            <h1>${esc(page.h1)}</h1>
            <p class="lead">${esc(page.description)}</p>
            <div class="notice">${esc(page.note)}</div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-heading">
          <span>Oferty partnerskie</span>
          <h2>Promocje według kategorii</h2>
          <p>Wybierz kategorię. Lista jest pobierana z aktualnego feedu partnera i pokazuje tylko dostępne oferty.</p>
        </div>
        <div class="filter-row" id="promo-filters" aria-label="Kategorie promocji">
          <button class="button secondary" data-category="all">Wszystkie</button>
          <button class="button secondary" data-category="finanse">Finanse</button>
          <button class="button secondary" data-category="zakupy">Zakupy</button>
          <button class="button secondary" data-category="dom">Dom i budowa</button>
          <button class="button secondary" data-category="inne">Inne</button>
        </div>
        <div class="grid cards-2" id="promo-list"><p class="notice">Ładowanie promocji…</p></div>
      </section>
      <script>
        (() => {
          const list = document.getElementById("promo-list");
          const filters = document.getElementById("promo-filters");
          let offers = [];
          const esc = (v) => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","'":"&#39;"}[c]));
          const category = (o) => { const s = [o.categoryName, o.programName, o.voucherName].join(" ").toLowerCase(); if (/finan|bank|kredyt|pożycz|konto|ubezpiec/.test(s)) return "finanse"; if (/dom|budow|mebl|remont|narzęd/.test(s)) return "dom"; if (/zakup|sklep|moda|elektr|sport|zdrow|suplement|kosmet/.test(s)) return "zakupy"; return "inne"; };
          const render = (selected = "all") => { const rows = offers.filter(o => selected === "all" || category(o) === selected); list.innerHTML = rows.length ? rows.map(o => '<article class="card"><span class="eyebrow">' + esc(o.categoryName || "Promocja") + '</span><h3>' + esc(o.voucherName || o.programName || "Oferta partnerska") + '</h3><p>' + esc(o.voucherText || "Sprawdź warunki i aktualny termin oferty.") + '</p>' + (o.voucherCode ? '<p><strong>Kod: ' + esc(o.voucherCode) + '</strong></p>' : "") + (o.voucherTrackingUrl ? '<a class="button" href="' + esc(o.voucherTrackingUrl) + '" target="_blank" rel="nofollow noopener">Sprawdź promocję</a>' : "") + '</article>').join("") : '<p class="notice">Brak aktywnych promocji w tej kategorii.</p>'; };
          filters.addEventListener("click", e => { const b = e.target.closest("[data-category]"); if (b) render(b.dataset.category); });
          fetch("/api/webe").then(r => r.ok ? r.json() : []).then(data => { offers = Array.isArray(data) ? data : []; render(); }).catch(() => { list.innerHTML = '<p class="notice">Promocje są chwilowo niedostępne.</p>'; });
        })();
      </script>
    </main>`
  });
}

function cta(label, url, secondary = false) {
  return `<a class="button${secondary ? " secondary" : ""}" href="${esc(url)}"${externalLinkAttrs(url, true)} data-track="cta" data-track-label="${esc(label)}">${esc(label)}</a>`;
}

function card(item, extra = "") {
  return `<article class="card">
    ${extra}
    <h3>${esc(item.name || item.label || item.title)}</h3>
    <p>${esc(item.description || item.note || "")}</p>
    ${item.url ? cta(item.cta || "Sprawdź", item.url, true) : ""}
  </article>`;
}

function pageCardCta(page) {
  if (page.type === "faq") return "Zobacz FAQ";
  if (page.type === "ranking") return "Zobacz ranking";
  if (page.type === "checklist") return "Sprawdź checklistę";
  if (page.type === "calculator") return "Otwórz kalkulator";
  return "Czytaj poradnik";
}

function offerCard(offer) {
  const highlights = (offer.pros && offer.pros.length ? offer.pros : offer.reward ? [offer.reward] : [])
    .filter(Boolean)
    .slice(0, 5);
  const partnerCondition = (offer.conditions || []).find((item) =>
    normalizeLabel(item).includes("aby skorzystac z promocji rozpocznij wniosek przyciskiem na tej stronie")
  );
  const processNote =
    "Nie przerywaj procesu: po kliknięciu przejdź całą rejestrację od razu. Nie zamykaj karty, nie odświeżaj strony i nie przechodź do innych zakładek.";
  const meta = [
    offer.reward ? { label: "Korzyść", value: offer.reward } : null,
    offer.difficulty
      ? {
          label: "Trudność",
          value: offer.difficulty
        }
      : null,
    offer.time ? { label: "Czas", value: offer.time } : null,
    offer.deadline ? { label: "Do kiedy", value: offer.deadline } : null,
    offer.audience ? { label: "Dla kogo", value: offer.audience } : null
  ].filter(Boolean);
  return `<article class="offer-card">
    <div>
      <span class="badge">${esc(categoryLabels[offer.category] || offer.category)}</span>
      <h3>${esc(offer.name)}</h3>
      <p>${esc(offer.summary)}</p>
      ${offer.reward ? `<p class="offer-benefit"><strong>Możesz zyskać:</strong> ${esc(offer.reward)}</p>` : ""}
    </div>
    <div class="offer-meta">${meta
      .map((item) => `<div><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`)
      .join("")}</div>
    <div class="offer-split">
      <div><strong>Najważniejsze korzyści</strong><ul>${highlights.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
      <div><strong>Uwaga</strong><p>${esc(offer.warning)}</p></div>
    </div>
    ${partnerCondition ? `<p class="partner-condition">Aby skorzystać z promocji, rozpocznij wniosek przyciskiem na tej stronie.</p>` : ""}
    <p class="partner-condition">${esc(processNote)}</p>
    <div class="update-stamp">Aktualizacja: ${esc(data.lastUpdated)}</div>
    ${cta(offer.affiliateUrl ? "Przejdź do oferty" : "Zobacz miejsce na link", offer.affiliateUrl || `/go/${offer.slug}`)}
  </article>`;
}

function offerBenefitList(offer) {
  const items = [
    offer.reward ? `Możesz zyskać: ${offer.reward}.` : "",
    offer.audience ? `Dla kogo: ${offer.audience}.` : ""
  ].filter(Boolean);
  return items.length ? `<ul class="tool-points">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
}

function offerInstructionBlock(offer) {
  if (!offer.instructions?.steps?.length && !offer.instructions?.notes?.length && !offer.instructions?.benefits?.length) return "";
  return `<section>
    <div class="section-head">
      <h2>${esc(offer.instructions?.title || "Jak odebrać premię krok po kroku")}</h2>
      <p>${esc(offer.instructions?.lead || "Przejdź przez proces od razu po kliknięciu przycisku, żeby promocja została poprawnie przypisana.")}</p>
    </div>
    ${offer.instructions?.steps?.length ? `<ol class="step-list">${offer.instructions.steps.map((step) => `<li><strong>${esc(step.title || step)}</strong>${step.text ? `<span>${esc(step.text)}</span>` : ""}</li>`).join("")}</ol>` : ""}
    ${offer.instructions?.benefits?.length ? `<div class="section-head compact-head"><h2>Co dostajesz</h2><p>Najważniejsze korzyści tej konkretnej oferty.</p></div><div class="check-grid">${offer.instructions.benefits.map((item) => `<div><span class="check-mark">OK</span><strong>${esc(item)}</strong></div>`).join("")}</div>` : ""}
    ${offer.instructions?.notes?.length ? `<div class="disclosure-box offer-notes"><strong>Pełna transparentność</strong>${offer.instructions.notes.map((note) => `<span>${esc(note)}</span>`).join("")}</div>` : ""}
  </section>`;
}

function offerPartnerRulesBlock(offer) {
  const slugs = new Set(["mbank-firmootwieracz"]);
  if (!slugs.has(offer.slug)) return "";
  return `<section class="cross-sell-section">
    <div class="disclosure-box offer-notes">
      <strong>Ważne, żeby premia została naliczona</strong>
      <span>Aby skorzystać z promocji, rozpocznij wniosek przyciskiem na tej stronie.</span>
      <span>Nie przerywaj procesu: po kliknięciu przejdź całą rejestrację od razu. Nie zamykaj karty, nie odświeżaj strony i nie przechodź do innych zakładek.</span>
    </div>
  </section>`;
}

function offerPlacementScore(offer) {
  return Number(offer.placementPriority || 0);
}

function sortOffersForPlacement(offerList) {
  return [...offerList].sort((a, b) => offerPlacementScore(b) - offerPlacementScore(a));
}

const homeTopOfferSlugs = [
  "mbank-ekonto-do-uslug-premia",
  "pekao-konto-przekorzystne-osobiste",
  "erste-santander-konto-smart-700",
  "alior-konto-z-bonusem"
];

function sortHomeTopOffers(offerList) {
  const pinned = homeTopOfferSlugs
    .map((slug) => offerList.find((offer) => offer.slug === slug))
    .filter(Boolean);
  const pinnedSlugs = new Set(pinned.map((offer) => offer.slug));
  const rest = sortOffersForPlacement(offerList.filter((offer) => !pinnedSlugs.has(offer.slug)));
  return [...pinned, ...rest];
}

function relatedOffersFor(page) {
  return sortOffersForPlacement(offers.filter((offer) => offer.pages?.includes(page.url))).slice(0, 4);
}

const fallbackOfferPages = {
  finanse: ["/finanse/konta-z-premia", "/finanse/konta-firmowe-z-premia", "/finanse/kredyty-gotowkowe", "/finanse/chwilowki"],
  ubezpieczenia: ["/ubezpieczenia/oc-ac"],
  auto: ["/auto/kredyt-na-auto", "/auto/leasing-czy-kredyt", "/ubezpieczenia/oc-ac", "/finanse/kredyty-gotowkowe"],
  dom: ["/finanse/kredyty-gotowkowe", "/finanse/rankingi", "/ubezpieczenia/oc-ac"]
};

function finalOffersFor({ page, pillarSlug, limit = 4 } = {}) {
  const direct = page ? relatedOffersFor(page) : [];
  if (direct.length) return direct.slice(0, limit);
  const slug = pillarSlug || page?.pillar;
  const targetPages = fallbackOfferPages[slug] || ["/oferty"];
  if (slug === "finanse") {
    return targetPages
      .map((targetPage) => sortOffersForPlacement(offers.filter((item) => item.pages?.includes(targetPage)))[0])
      .filter(Boolean)
      .slice(0, limit);
  }
  const seen = new Set();
  const result = [];
  for (const targetPage of targetPages) {
    for (const offer of sortOffersForPlacement(offers.filter((item) => item.pages?.includes(targetPage)))) {
      if (seen.has(offer.slug)) continue;
      seen.add(offer.slug);
      result.push(offer);
      if (result.length >= limit) return result;
    }
  }
  return result;
}

function offerSection(offerList, { title = "Sprawdź dostępne propozycje", description = "Porównaj podstawowe warunki i przejdź do wybranej oferty, jeśli pasuje do Twojej sytuacji.", moreUrl = "/oferty", moreLabel = "Zobacz więcej ofert" } = {}) {
  if (!offerList.length) return "";
  return `<section>
        <div class="section-head">
          <h2>${esc(title)}</h2>
          ${description ? `<p>${esc(description)}</p>` : ""}
        </div>
        <div class="offer-grid">${offerList.map((offer) => offerCard(offer)).join("")}</div>
        <div class="section-actions">${cta(moreLabel, moreUrl, true)}</div>
      </section>`;
}

function topOfferSection(offerList, options = {}) {
  return offerSection((offerList || []).slice(0, 6), {
    title: "Najlepsze propozycje na start",
    description: "",
    ...options
  });
}

function quickDecisionBlock(offerList) {
  if (!offerList.length) return "";
  return `<section class="compact-section">
        <div class="section-head">
          <h2>Jak wybrać w 30 sekund</h2>
          <p>Skup się na konkretnej korzyści, warunkach otrzymania bonusu i koszcie po zakończeniu promocji.</p>
        </div>
        <div class="trust-grid">
          <div><strong>1. Dopasuj typ oferty</strong><span>Wybierz konto, kredyt, pożyczkę, ubezpieczenie albo narzędzie zgodne z Twoją sytuacją.</span></div>
          <div><strong>2. Sprawdź warunki</strong><span>Zobacz kwotę premii, wymagane zgody, transakcje, opłaty i termin promocji.</span></div>
          <div><strong>3. Przejdź do partnera</strong><span>Kliknij ofertę dopiero wtedy, gdy warunki są jasne i pasują do tego, czego szukasz.</span></div>
        </div>
      </section>`;
}

function offerCopyForPage(page, hasDirectOffers) {
  if (hasDirectOffers) {
    return {
      title: "Polecane oferty",
      description: "Przed przejściem do partnera sprawdź podstawowe warunki, koszt, ryzyko i aktualność oferty."
    };
  }
  return {
    title: "Sprawdź dostępne propozycje",
    description: "Porównaj podstawowe warunki i przejdź do wybranej oferty, jeśli pasuje do Twojej sytuacji."
  };
}

function linkList(links) {
  return `<div class="quick-links">${links
    .map((link) => `<a href="${esc(link.url)}">${esc(link.label)}</a>`)
    .join("")}</div>`;
}

function sectionNav(pillar) {
  if (!pillar?.priorityLinks?.length) return "";
  return `<nav class="section-nav" aria-label="Menu sekcji">
    <strong>${esc(pillar.name)}</strong>
    <div>${pillar.priorityLinks.map((link) => `<a href="${esc(link.url)}">${esc(link.label)}</a>`).join("")}</div>
  </nav>`;
}

function nextStepBlock({ title = "Co dalej?", description = "Wybierz najlogiczniejszy następny krok.", links = [] }) {
  if (!links.length) return "";
  return `<section class="next-steps">
    <div class="section-head">
      <h2>${esc(title)}</h2>
      <p>${esc(description)}</p>
    </div>
    <div class="list-grid">${links
      .map((link) => `<a class="list-card" href="${esc(link.url)}"${externalLinkAttrs(link.url, true)}><strong>${esc(link.label)}</strong><span>${esc(link.note || "Przejdź do następnego kroku")}</span></a>`)
      .join("")}</div>
  </section>`;
}

const exchangeTableLinks = {
  OKX: "https://my.okx.com/pl/join/6029283",
  Kraken: "https://invite.kraken.com/JDNW/yfqo4yyp",
  "Bybit EU": "https://www.bybit.com/invite?ref=ME1EG&medium=referral&utm_campaign=evergreen",
  Coinbase: "https://coinbase.com/join/T7NNAZP?src=android-link"
};

function tableCell(row, column, index) {
  const value = String(row[column] || "");
  if (index !== 0) return esc(value);
  const exchangeName = Object.keys(exchangeTableLinks).find((name) => value.startsWith(name));
  if (!exchangeName) return esc(value);
  return `<a href="${esc(exchangeTableLinks[exchangeName])}" target="_blank" rel="nofollow sponsored noopener">${esc(exchangeName)}</a>${esc(value.slice(exchangeName.length))}`;
}

function renderContentBlocks(blocks = []) {
  if (!blocks.length) return "";
  return blocks
    .map((block) => {
      if (block.type === "comparison-table") {
        return `<section>
          <div class="section-head">
            <h2>${esc(block.title)}</h2>
            <p>${esc(block.description || "")}</p>
          </div>
          <div class="table-scroll">
            <table class="comparison-table">
              <thead>
                <tr>${(block.columns || []).map((column) => `<th>${esc(column)}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${(block.rows || [])
                  .map((row) => `<tr>${(block.columns || []).map((column, index) => `<td>${tableCell(row, column, index)}</td>`).join("")}</tr>`)
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>`;
      }
      if (block.type === "steps") {
        return `<section>
          <div class="section-head">
            <h2>${esc(block.title)}</h2>
            <p>${esc(block.description || "")}</p>
          </div>
          <ol class="step-list">${(block.items || [])
            .map((item) => `<li><strong>${esc(item.title)}</strong><span>${esc(item.text)}</span></li>`)
            .join("")}</ol>
        </section>`;
      }
      if (block.type === "checklist") {
        return `<section>
          <div class="section-head">
            <h2>${esc(block.title)}</h2>
            <p>${esc(block.description || "")}</p>
          </div>
          <div class="check-grid">${(block.items || [])
            .map((item) => `<div><span class="check-mark">OK</span><strong>${esc(item)}</strong></div>`)
            .join("")}</div>
        </section>`;
      }
      if (block.type === "warning") {
        return `<section class="warning-band">
          <div>
            <span class="badge">${esc(block.badge || "Uwaga")}</span>
            <h2>${esc(block.title)}</h2>
            <p>${esc(block.text)}</p>
          </div>
        </section>`;
      }
      return `<section>
        <div class="section-head">
          <h2>${esc(block.title)}</h2>
          <p>${esc(block.description || "")}</p>
        </div>
        <div class="trust-grid">${(block.items || [])
          .map((item) => {
            const url = cardUrl(item);
            const content = `<strong>${esc(item.title)}</strong><span>${esc(item.text)}</span>${url ? `<em>${esc(item.cta || "Przejdź dalej")}</em>` : ""}`;
            return url ? `<a class="trust-card" href="${esc(url)}">${content}</a>` : `<div>${content}</div>`;
          })
          .join("")}</div>
      </section>`;
    })
    .join("");
}

function trustBlock() {
  return `<section class="band">
    <div class="section-head">
      <h2>Jak pomagamy wybierać rozsądniej</h2>
      <p>Porządkujemy najważniejsze informacje, koszty i ryzyka, żeby łatwiej przejść od pytania do konkretnej decyzji.</p>
    </div>
    <div class="trust-grid">
      <div><strong>Najpierw konkret</strong><span>Pokazujemy najważniejsze warunki, koszty i ograniczenia bez zbędnego szukania.</span></div>
      <div><strong>Ryzyko widoczne</strong><span>Przy drogich decyzjach pokazujemy koszty, warunki i kiedy uważać.</span></div>
      <div><strong>Jasny następny krok</strong><span>Po przeczytaniu strony wiesz, co sprawdzić dalej i gdzie przejść.</span></div>
    </div>
  </section>`;
}

function affiliateDisclosureBlock() {
  return `<section class="affiliate-disclosure">
    <div>
      <span class="badge">Informacja</span>
      <p>${esc(data.disclosure)}</p>
    </div>
  </section>`;
}

function pageSchema(page, pillar) {
  const blocks = data.pageContent?.[page.url] || [];
  const faq = blocks.find((block) => /faq|pytania/i.test(block.title || "") && block.items?.length);
  const hasFaqItems = Boolean(faq?.items?.length);
  const type = page.type === "faq" && hasFaqItems ? "FAQPage" : page.type === "checklist" ? "HowTo" : "Article";
  const schema = {
    "@context": "https://schema.org",
    "@type": type,
    headline: page.title,
    description: page.description,
    url: absoluteUrl(page.url),
    inLanguage: "pl-PL",
    dateModified: data.lastUpdated,
    publisher: { "@type": "Organization", name: data.name, url: absoluteUrl("/") }
  };
  if (pillar) schema.articleSection = pillar.name;
  const checklist = blocks.find((block) => block.type === "checklist");
  if (type === "HowTo" && checklist?.items?.length) {
    schema.step = checklist.items.map((item, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: item
    }));
  }
  if (hasFaqItems) {
    schema["@type"] = "FAQPage";
    schema.mainEntity = (faq?.items || blocks.flatMap((block) => block.items || [])).slice(0, 8).map((item) => ({
      "@type": "Question",
      name: item.title || item,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.text || page.description
      }
    }));
  }
  return schema;
}

function offerSchema(offer) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: offer.name,
    description: offer.summary || offer.reward || offer.warning,
    category: categoryLabels[offer.category] || offer.category,
    url: absoluteUrl(`/go/${offer.slug}`),
    brand: offer.name.split(" - ")[0],
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/go/${offer.slug}`),
      availability: offer.affiliateUrl ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      price: "0",
      priceCurrency: "PLN"
    }
  };
}

function homePage() {
  const pillars = data.pillars.map((pillar) => card({ ...pillar, url: `/${pillar.slug}` })).join("");
  const popular = data.popular.map((item) => card(item)).join("");
  const seoLinks = seoLandingPages.map((page) => card({ name: page.h1, description: page.description, url: page.url, cta: "Sprawdź" })).join("");
  const tools = data.tools.slice(0, 6).map((tool) => card({ ...tool, url: `/narzedzia/${tool.slug}`, cta: "Otwórz" })).join("");
  const topOffers = sortHomeTopOffers(offers).slice(0, 6);

  return layout({
    title: `${data.name} - ${data.tagline}`,
    description: data.description,
    body: `<main>
      <section class="hero">
        <div class="hero-inner single centered">
          <div>
            <div class="eyebrow">PraktycznyZysk.pl</div>
            <h1>Sprawdź, gdzie możesz zyskać i czego nie przeoczyć.</h1>
            <p class="lead">${esc(data.description)}</p>
            <div class="hero-actions">${cta("Kategorie", "#piony")}${cta("Popularne tematy", "#popularne", true)}</div>
          </div>
        </div>
      </section>

      ${topOfferSection(topOffers, {
        title: "Oferty, od których warto zacząć",
        description: "",
        moreUrl: "/oferty",
        moreLabel: "Zobacz wszystkie oferty"
      })}
      ${quickDecisionBlock(topOffers)}

      <section id="piony">
        <div class="section-head">
          <h2>Wybierz kategorię</h2>
          <p>Przejdź do tematu, który chcesz sprawdzić: finanse, ubezpieczenia, auto albo dom.</p>
        </div>
        <div class="grid cards-5">${pillars}</div>
      </section>

      <section id="popularne">
        <div class="section-head">
          <h2>Popularne tematy</h2>
          <p>Najczęściej wybierane tematy, które warto policzyć albo porównać przed decyzją.</p>
        </div>
        <div class="list-grid">${popular}</div>
      </section>

      <section>
        <div class="section-head">
          <h2>Aktualne rankingi i poradniki</h2>
          <p>Strony przygotowane pod najważniejsze wyszukiwania: premie bankowe, chwilówki, OC i sprawdzenie auta.</p>
        </div>
        <div class="grid">${seoLinks}</div>
      </section>

      <section>
        <div class="section-head">
          <h2>Narzędzia</h2>
          <p>Kalkulatory i checklisty pomagają sprawdzić koszty, ryzyko i następny krok.</p>
        </div>
        <div class="grid">${tools}</div>
      </section>
      ${trustBlock()}
    </main>`
  });
}

function pillarPage(pillar) {
  const relatedTools = data.tools
    .filter((tool) => tool.next.includes(pillar.slug) || (pillar.slug === "auto" && tool.slug.includes("auta")) || (pillar.slug === "dom" && tool.slug.includes("remont")))
    .slice(0, 4);
  const pages = allPages.filter((page) => page.pillar === pillar.slug);
  const finalOffers = finalOffersFor({ pillarSlug: pillar.slug });
  const pillarSeoLinks = seoLandingPages
    .filter((page) => page.pillar === pillar.slug)
    .map((page) => `<a class="list-card" href="${esc(page.url)}"><strong>${esc(page.h1)}</strong><span>${esc(page.description)}</span></a>`)
    .join("");

  return layout({
    url: `/${pillar.slug}`,
    title: `${pillar.name} - ${pillar.label} | ${data.name}`,
    description: pillar.description,
    crumbs: [{ label: pillar.name, url: `/${pillar.slug}` }],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner">
          <div>
            <div class="eyebrow">${esc(pillar.label)}</div>
            <h1>${esc(pillar.name)}</h1>
            <p class="lead">${esc(pillar.description)}</p>
            <div class="hero-actions">${cta(pillar.cta, `/${pillar.slug}#start`)}${cta("Narzędzia", "/narzedzia", true)}</div>
          </div>
          <aside class="hero-panel">${linkList(pillar.priorityLinks)}</aside>
        </div>
      </section>
      ${topOfferSection(finalOffers, {
        description: "",
        moreUrl: offersUrlFor(pillar.slug),
        moreLabel: offerGroupLabel(pillar.slug).more
      })}
      ${quickDecisionBlock(finalOffers)}
      ${sectionNav(pillar)}
      <section id="start">
        <div class="section-head">
          <h2>Zacznij od tego</h2>
          <p>Najważniejsze tematy w tej kategorii. Wybierz ten, który najlepiej pasuje do Twojej sytuacji.</p>
        </div>
        <div class="list-grid">${pillar.priorityLinks
          .map((link) => `<a class="list-card" href="${esc(link.url)}"><strong>${esc(link.label)}</strong><span>Przejdź do następnego kroku</span></a>`)
          .join("")}</div>
      </section>
      <section>
        <div class="section-head">
          <h2>Warto zobaczyć</h2>
          <p>Najważniejsze poradniki i materiały związane z finansami.</p>
        </div>
        <div class="grid">${pages.map((page) => card({ ...page, name: page.title, url: page.url, cta: pageCardCta(page) })).join("")}</div>
      </section>
      <section>
        <div class="section-head">
          <h2>Powiązane narzędzia</h2>
          <p>Kalkulatory i checklisty pomagają policzyć koszt, porównać warunki albo przygotować się do decyzji.</p>
        </div>
        <div class="grid">${relatedTools.map((tool) => card({ ...tool, url: `/narzedzia/${tool.slug}`, cta: "Otwórz" })).join("") || card({ name: "Narzędzia", description: "Zobacz wszystkie kalkulatory i checklisty.", url: "/narzedzia", cta: "Przejdź" })}</div>
      </section>
      ${nextStepBlock({
        title: "Polecane dalej",
        description: "Najczęściej wybierane tematy i propozycje w tej kategorii.",
        links: [
          ...(pillar.slug === "finanse" ? [{ label: "Pozostałe", url: "/pozostale", note: "Telekomunikacja, zakupy i podróże" }] : []),
          ...finalOffers.map((offer) => ({ label: offer.name, url: offer.affiliateUrl || `/go/${offer.slug}`, note: "Przejdź do konkretnej oferty" })),
          ...pillar.priorityLinks.map((link) => ({ ...link, note: "Przejdź do tematu" }))
        ].slice(0, 4)
      })}
      ${finalOffers.length ? affiliateDisclosureBlock() : ""}
    </main>`
  });
}

const toolModels = {
  "kalkulator-zdolnosci-kredytowej": {
    type: "calculator",
    fields: ["Miesięczny dochód netto", "Stałe raty i zobowiązania", "Koszty życia", "Planowana rata"],
    resultTitle: "Orientacyjna zdolność i margines bezpieczeństwa",
    resultText: "Wynik pokazuje, czy w budżecie jest miejsce na nową ratę. To nie jest decyzja banku, tylko punkt startowy przed rankingiem i wnioskiem.",
    bullets: ["rata nie może zabierać całej nadwyżki", "sprawdź BIK przed wieloma wnioskami", "zostaw bufor na koszty stałe"]
  },
  "kalkulator-raty": {
    type: "calculator",
    fields: ["Kwota kredytu", "Okres w miesiącach", "Oprocentowanie lub szacowany koszt", "Prowizja"],
    resultTitle: "Rata, koszt i całkowita kwota do spłaty",
    resultText: "To narzędzie ma kierować do porównania kredytów dopiero po zrozumieniu raty i kosztu całkowitego.",
    bullets: ["porównuj RRSO i kwotę do spłaty", "niższa rata może oznaczać dłuższy okres", "sprawdź prowizję i ubezpieczenia"]
  },
  "kalkulator-rrso": {
    type: "calculator",
    fields: ["Kwota finansowania", "Kwota do oddania", "Okres spłaty", "Dodatkowe koszty"],
    resultTitle: "Szacunkowe RRSO i sygnał ryzyka",
    resultText: "RRSO ma pomagać porównać oferty, ale przy bardzo krótkich pożyczkach wynik może wyglądać skrajnie wysoko.",
    bullets: ["porównuj podobne kwoty i okresy", "0% wymaga spełnienia warunków", "zawsze sprawdź koszt po terminie"]
  },
  "kalkulator-oc": {
    type: "calculator",
    fields: ["Wiek kierowcy", "Historia szkód", "Pojemność i rocznik auta", "Kod pocztowy"],
    resultTitle: "Czynniki, które mogą podnieść składkę",
    resultText: "Bez integracji nie pokazujemy realnej składki. Pokazujemy czynniki ceny i przejście do porównania OC/AC.",
    bullets: ["OC porównuj przed końcem polisy", "przy AC sprawdź zakres i wykluczenia", "po zakupie auta sprawdź ciągłość OC"]
  },
  "budzet-domowy": {
    type: "calculator",
    fields: ["Dochody miesięczne", "Koszty stałe", "Raty i abonamenty", "Planowana rezerwa"],
    resultTitle: "Nadwyżka, deficyt i bezpieczny limit rat",
    resultText: "Budżet pokazuje, czy decyzja finansowa jest realna przed kredytem, chwilówką albo remontem.",
    bullets: ["najpierw rezerwa, potem rata", "oddziel potrzeby od zachcianek", "nie finansuj deficytu chwilówką"]
  },
  "checklista-kredyt": {
    type: "checklist",
    fields: ["RRSO widoczne", "Rata pasuje do budżetu", "Koszt całkowity znany", "Warunki i prowizje sprawdzone"],
    resultTitle: "Gotowość do porównania ofert",
    resultText: "Jeśli któryś punkt nie jest spełniony, wróć do kalkulatora raty albo RRSO i sprawdź koszt jeszcze raz.",
    bullets: ["nie składaj wielu wniosków naraz", "sprawdź całkowitą kwotę do spłaty", "czytaj warunki dodatkowych produktów"]
  },
  "checklista-chwilowka": {
    type: "checklist",
    fields: ["Znam termin spłaty", "Znam koszt po terminie", "Mam pieniądze na spłatę", "Nie spłacam innej chwilówki"],
    resultTitle: "Czerwone flagi przed chwilówką",
    resultText: "Jeśli nie masz pewnego planu spłaty w terminie, lepiej nie składać wniosku.",
    bullets: ["0% zwykle dotyczy pierwszej pożyczki", "opóźnienie może mocno podnieść koszt", "nie roluj zobowiązań"]
  },
  "checklista-zakup-auta": {
    type: "checklist",
    fields: ["VIN i rejestracja", "Historia gov.pl", "Oględziny i jazda próbna", "OC/AC i koszty po zakupie"],
    resultTitle: "Gotowość do decyzji o aucie",
    resultText: "Najpierw historia i stan auta, potem polisa i finansowanie. Raport VIN nie zastąpi oględzin.",
    bullets: ["sprawdź dane z dokumentami", "nie płać zaliczki pod presją", "policz serwis startowy i OC"]
  },
  "checklista-rozmowa-kwalifikacyjna": {
    type: "checklist",
    fields: ["CV dopasowane", "Odpowiedzi przygotowane", "Pytania do firmy", "Oczekiwania finansowe"],
    resultTitle: "Gotowość do rozmowy",
    resultText: "Po sprawdzeniu listy możesz przejść do poradnika CV, przygotowania rozmowy albo negocjacji wynagrodzenia.",
    bullets: ["przygotuj liczby i przykłady", "sprawdź firmę przed rozmową", "ustal minimalną akceptowalną stawkę"]
  },
  "checklista-remont": {
    type: "checklist",
    fields: ["Zakres prac", "Budżet i rezerwa", "Wykonawca i umowa", "Harmonogram i odbiór"],
    resultTitle: "Gotowość do startu remontu",
    resultText: "Remont bez zakresu, rezerwy i umowy łatwo ucieka z budżetu. Narzędzie prowadzi do planu i finansowania.",
    bullets: ["zostaw rezerwę na niespodzianki", "porównaj minimum kilka wycen", "nie zaczynaj bez pisemnego zakresu"]
  }
};

function renderToolInputs(model) {
  return (model.fields || [])
    .map((field, index) => {
      const input = model.type === "checklist"
        ? `<label class="check-row"><input type="checkbox" data-tool-input="${index}"><span>${esc(field)}</span></label>`
        : `<label>${esc(field)}</label><input inputmode="decimal" value="" data-tool-input="${index}" placeholder="${index === 0 ? "wpisz wartość" : "uzupełnij"}">`;
      return input;
    })
    .join("");
}

function offersUrlFor(slug) {
  return slug ? `/oferty/${slug}` : "/oferty";
}

function offersPageUrlFor(page) {
  return page?.url ? `/oferty${page.url}` : offersUrlFor(page?.pillar);
}

function seoMeta(page, fallbackTitle, fallbackDescription) {
  const override = seoOverrides[page.url] || {};
  const description = override.description || fallbackDescription || page.description || "";
  const expandedDescription =
    description.length >= 110
      ? description
      : `${description} Sprawdź najważniejsze warunki, koszty, ryzyka i praktyczne kroki przed decyzją.`;
  return {
    title: override.title || fallbackTitle,
    description: expandedDescription.length > 168 ? `${expandedDescription.slice(0, 165).trim()}...` : expandedDescription
  };
}

function offersForPageFirst(page, pillarSlug) {
  const direct = sortOffersForPlacement(offers.filter((offer) => offer.pages?.includes(page.url)));
  const seen = new Set(direct.map((offer) => offer.slug));
  const rest = sortOffersForPlacement(
    offers.filter((offer) => {
      if (seen.has(offer.slug)) return false;
      if (offer.pillar === pillarSlug) return true;
      return false;
    })
  );
  return [...direct, ...rest];
}

const offerGroupLabels = {
  finanse: {
    short: "Oferty finansowe",
    more: "Zobacz więcej ofert finansowych",
    title: "Oferty finansowe",
    lead: "Zobacz konta, premie, kredyty, pożyczki, lokaty i inne propozycje finansowe."
  },
  ubezpieczenia: {
    short: "Ubezpieczenia",
    more: "Zobacz więcej ubezpieczeń",
    title: "Ubezpieczenia",
    lead: "Zobacz propozycje ubezpieczeń i porównywarek, które możesz sprawdzić u partnera."
  },
  auto: {
    short: "Propozycje dla kierowców",
    more: "Zobacz więcej propozycji dla kierowców",
    title: "Propozycje dla kierowców",
    lead: "Zobacz ubezpieczenia, finansowanie i inne propozycje powiązane z autem."
  },
  dom: {
    short: "Finansowanie domu i remontu",
    more: "Zobacz finansowanie i ubezpieczenia",
    title: "Finansowanie i ubezpieczenia domu",
    lead: "Zobacz kredyty, finansowanie i ubezpieczenia powiązane z domem lub remontem."
  },
  pozostale: {
    short: "Pozostałe",
    more: "Zobacz oferty",
    title: "Pozostałe",
    lead: "Telekomunikacja, zakupy, podróże i inne propozycje z jasno opisaną korzyścią dla klienta."
  }
};

function offerGroupLabel(slug) {
  return offerGroupLabels[slug] || {
    short: "Propozycje",
    more: "Zobacz więcej propozycji",
    title: "Propozycje",
    lead: "Zobacz pełną listę propozycji i przejdź do wybranej oferty."
  };
}

function toolCalculatorScript(slug, type) {
  const safeSlug = JSON.stringify(slug);
  const safeType = JSON.stringify(type);
  return `<script>
  (function () {
    const slug = ${safeSlug};
    const type = ${safeType};
    const shell = document.querySelector("[data-tool-shell]");
    if (!shell) return;
    const output = shell.querySelector("[data-tool-output]");
    const button = shell.querySelector("[data-tool-action]");
    const inputs = Array.from(shell.querySelectorAll("[data-tool-input]"));
    const money = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 });
    const percent = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 });
    const numberValue = (input) => {
      const raw = String(input.value || "").replace(/\\s/g, "").replace(",", ".");
      const value = Number(raw);
      return Number.isFinite(value) ? value : 0;
    };
    const values = () => inputs.map((input) => input.type === "checkbox" ? input.checked : numberValue(input));
    const show = (title, lines) => {
      output.innerHTML = "<strong>" + title + "</strong><ul>" + lines.map((line) => "<li>" + line + "</li>").join("") + "</ul>";
    };
    const hasRequiredValues = () => inputs.every((input) => input.type === "checkbox" || String(input.value || "").trim() !== "");
    const calculate = () => {
      if (type === "checklist") {
        const checked = values().filter(Boolean).length;
        const total = inputs.length || 1;
        const ratio = checked / total;
        const title = ratio === 1 ? "Wygląda na komplet" : ratio >= 0.75 ? "Prawie gotowe" : "Brakuje ważnych punktów";
        show(title, [
          "Zaznaczone punkty: " + checked + " z " + total + ".",
          ratio === 1 ? "Możesz przejść do następnego kroku." : "Uzupełnij brakujące punkty przed decyzją.",
          "To szybka checklista do sprawdzenia najważniejszych punktów."
        ]);
        return;
      }
      if (!hasRequiredValues()) {
        show("Uzupełnij dane", [
          "Wpisz wartości we wszystkich polach i dopiero wtedy pokaż wynik.",
          "Puste pola nie są liczone jako 0 zł.",
          "Wynik nadal ma charakter orientacyjny."
        ]);
        return;
      }
      const v = values();
      if (slug === "kalkulator-raty") {
        const amount = v[0], months = Math.max(1, v[1]), annualRate = Math.max(0, v[2]) / 100, commission = Math.max(0, v[3]);
        const principal = amount + commission;
        const monthlyRate = annualRate / 12;
        const installment = monthlyRate ? principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)) : principal / months;
        const total = installment * months;
        show("Orientacyjna rata", [
          "Rata miesięczna: " + money.format(installment) + ".",
          "Całkowita kwota do spłaty: " + money.format(total) + ".",
          "Szacowany koszt finansowania: " + money.format(Math.max(0, total - amount)) + "."
        ]);
      } else if (slug === "kalkulator-rrso") {
        const amount = Math.max(1, v[0]), repay = Math.max(0, v[1]), months = Math.max(1, v[2]), extra = Math.max(0, v[3]);
        const total = repay + extra;
        const cost = Math.max(0, total - amount);
        const annualized = ((total / amount) - 1) * (12 / months) * 100;
        show("Szacunkowy koszt", [
          "Łączny koszt: " + money.format(cost) + ".",
          "Kwota do oddania z dodatkowymi kosztami: " + money.format(total) + ".",
          "Prosty roczny wskaźnik kosztu: około " + percent.format(Math.max(0, annualized)) + "%."
        ]);
      } else if (slug === "kalkulator-zdolnosci-kredytowej") {
        const income = v[0], debts = v[1], costs = v[2], planned = v[3];
        const surplus = income - debts - costs;
        const safeInstallment = Math.max(0, surplus * 0.45);
        const margin = surplus - planned;
        show("Orientacyjny bufor", [
          "Nadwyżka po kosztach i ratach: " + money.format(surplus) + ".",
          "Ostrożny limit nowej raty: " + money.format(safeInstallment) + ".",
          margin >= 0 ? "Po planowanej racie zostaje: " + money.format(margin) + "." : "Planowana rata przekracza budżet o: " + money.format(Math.abs(margin)) + "."
        ]);
      } else if (slug === "budzet-domowy") {
        const income = v[0], costs = v[1], debts = v[2], reserve = v[3];
        const balance = income - costs - debts - reserve;
        show("Budżet miesięczny", [
          "Wynik po kosztach, ratach i rezerwie: " + money.format(balance) + ".",
        "Bezpieczna dodatkowa rata nie może zjadać całej tej kwoty.",
          balance < 0 ? "Budżet jest pod kreską, najpierw ogranicz koszty lub raty." : "Zostaje bufor, ale zostaw miejsce na koszty nieregularne."
        ]);
      } else if (slug === "kalkulator-oc") {
        const age = v[0], claims = v[1], engine = v[2], year = v[3];
        const points = (age && age < 26 ? 2 : 0) + claims * 2 + (engine > 2000 ? 1 : 0) + (year && year < 2010 ? 1 : 0);
        const level = points >= 4 ? "wysokie ryzyko ceny" : points >= 2 ? "średnie ryzyko ceny" : "niższe ryzyko ceny";
        show("Czynniki składki OC", [
          "Profil wskazuje: " + level + ".",
          "Najmocniej wpływają: szkody, wiek kierowcy, pojemność i historia auta.",
          "To nie jest realna oferta OC. Do ceny potrzebna jest integracja z partnerem lub formularz ubezpieczyciela."
        ]);
      } else {
        show("Wynik orientacyjny", [
          "Narzędzie zebrało dane i pokazuje kierunek decyzji.",
          "Ten moduł wymaga jeszcze osobnego wzoru lub integracji, żeby liczyć pełny wynik."
        ]);
      }
    };
    button?.addEventListener("click", calculate);
  })();
  </script>`;
}

function toolPage(tool) {
  const model = toolModels[tool.slug] || {
    type: "calculator",
    fields: ["Kwota / wartość", "Okres / sytuacja"],
    resultTitle: "Wynik będzie punktem startowym",
    resultText: "Wynik potraktuj jako punkt startowy: sprawdź interpretację, ostrzeżenia i następny krok przed decyzją.",
    bullets: ["użyj wyniku jako punktu startowego", "sprawdź warunki przed kliknięciem", "przejdź do powiązanej strony"]
  };
  const related = [
    { label: "Wróć do narzędzi", url: "/narzedzia", note: "Zobacz pozostałe kalkulatory i checklisty" },
    { label: "Zobacz powiązany temat", url: tool.next, note: "Temat dobrany do wyniku" }
  ];
  const nextPage = pageByUrl.get(tool.next);
  const finalOffers = finalOffersFor({ page: nextPage, pillarSlug: nextPage?.pillar });
  return layout({
    url: `/narzedzia/${tool.slug}`,
    title: `${tool.name} | ${data.name}`,
    description: tool.description,
    crumbs: [
      { label: "Narzędzia", url: "/narzedzia" },
      { label: tool.name, url: `/narzedzia/${tool.slug}` }
    ],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Narzędzie</div>
            <h1>${esc(tool.name)}</h1>
            <p class="lead">${esc(tool.description)}</p>
          </div>
        </div>
      </section>
      ${topOfferSection(finalOffers, {
        title: "Propozycje dopasowane do tematu",
        description: "",
        moreUrl: offersUrlFor(nextPage?.pillar),
        moreLabel: offerGroupLabel(nextPage?.pillar).more
      })}
      ${quickDecisionBlock(finalOffers)}
      <section>
        <div class="tool-shell" data-tool-shell>
          <div class="fake-form">
            <span class="badge">${model.type === "checklist" ? "Checklista" : "Kalkulator"}</span>
            ${renderToolInputs(model)}
            <button class="button" type="button" data-tool-action>${model.type === "checklist" ? "Sprawdź gotowość" : "Pokaż wynik orientacyjny"}</button>
          </div>
          <div class="result-card">
            <span class="badge">Co dalej?</span>
            <h2>${esc(model.resultTitle)}</h2>
            <p>${esc(model.resultText)} Potraktuj wynik jako punkt wyjścia i sprawdź szczegóły przed decyzją.</p>
            <div class="calculated-result" data-tool-output></div>
            <ul class="tool-points">${model.bullets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
            ${cta("Przejdź do następnego kroku", tool.next)}
          </div>
        </div>
      </section>
      ${nextStepBlock({
        title: "Powiązane",
        description: "Po wyniku możesz przejść do poradnika, checklisty albo porównania ofert.",
        links: [
          ...finalOffers.map((offer) => ({ label: offer.name, url: offer.affiliateUrl || `/go/${offer.slug}`, note: "Przejdź do konkretnej oferty" })),
          ...related
        ].slice(0, 4)
      })}
      ${finalOffers.length ? affiliateDisclosureBlock() : ""}
      ${toolCalculatorScript(tool.slug, model.type)}
    </main>`
  });
}

function genericPage(page) {
  const pillar = pillarBySlug.get(page.pillar);
  const meta = seoMeta(page, `${page.title} | ${data.name}`, page.description);
  const contentBlocks = data.pageContent?.[page.url] || [];
  const pageOffers = relatedOffersFor(page);
  const finalOffers = finalOffersFor({ page, pillarSlug: page.pillar });
  const offersCopy = offerCopyForPage(page, pageOffers.length > 0);
  const sectionLinks = pillar?.priorityLinks || [];
  const relatedTools = data.tools
    .filter((tool) => tool.next.includes(page.pillar || "") || tool.next === page.url)
    .slice(0, 3);
  const genericLinks = [
    ...(pillar?.priorityLinks || []).slice(0, 3).map((link) => ({ ...link, note: "Dobry następny krok w tym temacie" })),
    ...relatedTools.map((tool) => ({ label: tool.name, url: `/narzedzia/${tool.slug}`, note: tool.description }))
  ].slice(0, 4);
  return layout({
    url: page.url,
    title: meta.title,
    description: meta.description,
    schema: [pageSchema(page, pillar)],
    crumbs: [
      { label: pillar?.name ?? "Serwis", url: pillar ? `/${pillar.slug}` : "/" },
      { label: page.title, url: page.url }
    ],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">${esc(typeLabels[page.type] || page.type)}</div>
            <h1>${esc(page.title)}</h1>
            <p class="lead">${esc(meta.description)}</p>
            <div class="hero-actions">${cta(page.cta, page.ctaUrl)}</div>
          </div>
        </div>
      </section>
      ${topOfferSection(finalOffers, {
        title: offersCopy.title,
        description: "",
        moreUrl: pageOffers.length ? offersPageUrlFor(page) : offersUrlFor(page.pillar),
        moreLabel: offerGroupLabel(page.pillar).more
      })}
      ${quickDecisionBlock(finalOffers)}
      ${sectionNav(pillar)}
      ${renderContentBlocks(contentBlocks)}
      <section>
        <div class="section-head">
          <h2>Najważniejsze zasady</h2>
          <p>Zanim przejdziesz dalej, sprawdź koszt, warunki, ograniczenia i ryzyko decyzji.</p>
        </div>
        <div class="trust-grid">
          <div><strong>Najpierw zrozum</strong><span>Co wybierasz, jakie są koszty i gdzie są ograniczenia.</span></div>
          <div><strong>Sprawdź ryzyko</strong><span>Przy finansach, ubezpieczeniach, aucie i domu decyzje mogą kosztować realne pieniądze.</span></div>
          <div><strong>Przejdź dalej</strong><span>Użyj narzędzia, checklisty, rankingu albo poradnika powiązanego z tematem.</span></div>
        </div>
      </section>
      <section>
        <div class="section-head">
          <h2>Powiązane tematy</h2>
          <p>Sprawdź też tematy, które często pomagają podjąć lepszą decyzję.</p>
        </div>
        <div class="list-grid">${
          genericLinks.length
            ? genericLinks
                .map((link) => `<a class="list-card" href="${esc(link.url)}"><strong>${esc(link.label)}</strong><span>${esc(link.note)}</span></a>`)
                .join("")
            : sectionLinks
            .map((link) => `<a class="list-card" href="${esc(link.url)}"><strong>${esc(link.label)}</strong><span>Dobry następny krok w tym temacie</span></a>`)
            .join("") ||
          `<a class="list-card" href="/narzedzia"><strong>Narzędzia</strong><span>Kalkulatory i checklisty do dalszej decyzji.</span></a>`
        }</div>
      </section>
      ${nextStepBlock({
        links: [
          ...finalOffers.map((offer) => ({ label: offer.name, url: offer.affiliateUrl || `/go/${offer.slug}`, note: "Przejdź do konkretnej oferty" })),
          { label: page.cta, url: page.ctaUrl, note: "Zobacz powiązany temat" },
          ...(pillar ? [{ label: `Wróć do ${pillar.name}`, url: `/${pillar.slug}`, note: "Zobacz całą sekcję" }] : [])
        ].slice(0, 4)
      })}
      ${finalOffers.length ? affiliateDisclosureBlock() : ""}
    </main>`
  });
}

function renderArticleContent(article) {
  return (article.sections || [])
    .map((section) => {
      const intro = section.text ? `<p>${esc(section.text)}</p>` : "";
      const list = section.items?.length ? `<ul class="tool-points">${section.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
      return `<h2>${esc(section.heading)}</h2>${intro}${list}`;
    })
    .join("");
}

function blogIndex() {
  const featured = blogArticles
    .map(
      (article) => `<article class="card">
        <div class="update-stamp">Aktualizacja: ${esc(article.updated || data.lastUpdated)}</div>
        <h3>${esc(article.h1 || article.title)}</h3>
        <p>${esc(article.description)}</p>
        ${cta("Czytaj artykuł", article.url, true)}
      </article>`
    )
    .join("");
  return layout({
    url: "/blog",
    title: `Blog | ${data.name}`,
    description: "Poradniki o kontach z premią, promocjach bankowych, warunkach wpływu, płatnościach kartą i podatkach od bonusów.",
    crumbs: [{ label: "Blog", url: "/blog" }],
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: `Blog ${data.name}`,
        url: absoluteUrl("/blog")
      }
    ],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Blog</div>
            <h1>Blog o promocjach bankowych i praktycznych decyzjach finansowych</h1>
            <p class="lead">Krótkie poradniki pomagające sprawdzić warunki, regulaminy, opłaty i terminy zanim klikniesz w ofertę.</p>
            <div class="hero-actions">${cta("Konta z premią", "/finanse/konta-z-premia")}${cta("Wszystkie oferty", "/oferty/finanse", true)}</div>
          </div>
        </div>
      </section>
      <section>
        <div class="section-head">
          <h2>Promocje bankowe</h2>
          <p>Promocje kont osobistych i firmowych potrafią dać realny bonus, ale decydują szczegóły regulaminu: kto może skorzystać, jakie aktywności trzeba wykonać i kiedy bank wypłaca premię.</p>
        </div>
        <div class="grid">${featured}</div>
      </section>
      ${affiliateDisclosureBlock()}
    </main>`
  });
}

function blogArticlePage(article) {
  const categoryLabel = article.ctaUrl?.includes("konta-firmowe")
    ? "Konta firmowe z premią"
    : article.ctaUrl?.includes("kredyty-gotowkowe")
      ? "Kredyty gotówkowe"
      : article.ctaUrl?.includes("chwilowki")
        ? "Chwilówki"
        : "Konta z premią";
  const riskNotice = article.ctaUrl?.includes("kredyty-gotowkowe")
    ? "Przed podpisaniem umowy sprawdź formularz informacyjny, RRSO, ratę i całkowitą kwotę do zapłaty."
    : article.ctaUrl?.includes("chwilowki")
      ? "Przed podpisaniem umowy sprawdź RRSO, całkowitą kwotę do zapłaty, termin spłaty i koszty opóźnienia. Pożyczaj tylko wtedy, gdy masz realny plan terminowej spłaty."
    : "Warunki promocji bankowych, opłaty, stawki, terminy i definicje aktywności mogą się zmieniać. Decydujący jest zawsze aktualny regulamin konkretnej promocji oraz tabela opłat banku.";
  const related = blogArticles
    .filter((item) => item.url !== article.url)
    .slice(0, 4)
    .map((item) => ({ label: item.h1 || item.title, url: item.url, note: item.description }));
  return layout({
    url: article.url,
    title: `${article.title} | ${data.name}`,
    description: article.description,
    crumbs: [
      { label: "Blog", url: "/blog" },
      { label: article.h1 || article.title, url: article.url }
    ],
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.h1 || article.title,
        description: article.description,
        dateModified: article.updated || data.lastUpdated,
        author: { "@type": "Organization", name: data.name },
        publisher: { "@type": "Organization", name: data.name, logo: { "@type": "ImageObject", url: absoluteUrl("/logo.jpg") } },
        mainEntityOfPage: absoluteUrl(article.url)
      }
    ],
    body: `<main>
      <article class="article-page">
        <header class="article-hero">
          <div class="eyebrow">${esc(categoryLabel)}</div>
          <h1>${esc(article.h1 || article.title)}</h1>
          <p class="lead">${esc(article.description)}</p>
          <div class="update-stamp">Aktualizacja: ${esc(article.updated || data.lastUpdated)}</div>
          <div class="notice">${esc(riskNotice)}</div>
        </header>
        <div class="article-content">
          ${article.intro.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
          ${renderArticleContent(article)}
          <h2>Podsumowanie</h2>
          <p>${esc(article.summary)}</p>
          <div class="hero-actions">${cta(article.ctaLabel || "Zobacz aktualne konta z premią", article.ctaUrl || "/finanse/konta-z-premia")}</div>
        </div>
      </article>
      ${nextStepBlock({ title: "Powiązane poradniki", description: "Sprawdź kolejne elementy promocji zanim złożysz wniosek.", links: related })}
      ${affiliateDisclosureBlock()}
    </main>`
  });
}

function blogArticleUrls() {
  return blogArticles.map((article) => article.url);
}

function offersIndex() {
  const categoryLinks = data.pillars.map((pillar) => ({
    label: offerGroupLabel(pillar.slug).short,
    url: offersUrlFor(pillar.slug),
    note: offerGroupLabel(pillar.slug).lead
  }));
  return layout({
    url: "/oferty",
    title: `Oferty | ${data.name}`,
    description: "Katalog ofert finansowych i ubezpieczeniowych z najważniejszymi warunkami.",
    crumbs: [{ label: "Oferty", url: "/oferty" }],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Oferty</div>
            <h1>Oferty, które możesz porównać.</h1>
            <p class="lead">Sprawdź podstawowe warunki, możliwe korzyści i wybierz propozycję dopasowaną do Twojej sytuacji.</p>
          </div>
        </div>
      </section>
      ${nextStepBlock({ title: "Kategorie ofert", description: "Wybierz kategorię, żeby zobaczyć pełną listę dostępnych propozycji.", links: categoryLinks })}
      <section>
        <div class="offer-grid">${offers.map((offer) => offerCard(offer)).join("")}</div>
      </section>
    </main>`
  });
}

function seoLandingPage(landing) {
  const basePage = pageByUrl.get(landing.pageUrl) || { url: landing.pageUrl, title: landing.h1, pillar: landing.pillar };
  const pillar = pillarBySlug.get(landing.pillar);
  const pageOffers = relatedOffersFor(basePage);
  const finalOffers = finalOffersFor({ page: basePage, pillarSlug: landing.pillar, limit: 8 });
  const links = [
    { label: basePage.title || landing.h1, url: landing.pageUrl, note: "Główny poradnik i ranking w tym temacie" },
    { label: `Oferty: ${basePage.title || landing.h1}`, url: offersPageUrlFor(basePage), note: "Karty ofert i najważniejsze warunki" },
    ...(pillar?.priorityLinks || []).slice(0, 3).map((link) => ({ ...link, note: "Powiązany money hub" }))
  ];
  return layout({
    url: landing.url,
    title: `${landing.title} | ${data.name}`,
    description: landing.description,
    crumbs: [
      { label: pillar?.name || "Serwis", url: pillar ? `/${pillar.slug}` : "/" },
      { label: landing.h1, url: landing.url }
    ],
    schema: [breadcrumbSchema(landing.url, [{ label: pillar?.name || "Serwis", url: pillar ? `/${pillar.slug}` : "/" }])],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">SEO / aktualizacja ${esc(data.lastUpdated)}</div>
            <h1>${esc(landing.h1)}</h1>
            <p class="lead">${esc(landing.lead)}</p>
            <div class="hero-actions">${cta("Sprawdź oferty", offersPageUrlFor(basePage))}${cta("Czytaj główny poradnik", landing.pageUrl, true)}</div>
          </div>
        </div>
      </section>
      ${topOfferSection(finalOffers, {
        title: "Oferty powiązane z tym tematem",
        description: "",
        moreUrl: offersPageUrlFor(basePage),
        moreLabel: "Zobacz pełną listę ofert"
      })}
      ${quickDecisionBlock(finalOffers)}
      <section>
        <div class="section-head">
          <h2>Najważniejsze frazy i intencje</h2>
          <p>Ta strona jest przygotowana pod zapytania, które zwykle mają intencję porównania, wyboru oferty albo sprawdzenia warunków.</p>
        </div>
        <div class="list-grid">${landing.keywords
          .map((keyword) => `<div class="list-card"><strong>${esc(keyword)}</strong><span>Porównaj korzyści, koszty i warunki przed przejściem do partnera.</span></div>`)
          .join("")}</div>
      </section>
      ${nextStepBlock({ title: "Powiązane strony", description: "Wewnętrzne linkowanie wzmacnia główne huby SEO i prowadzi użytkownika do decyzji.", links })}
      ${affiliateDisclosureBlock()}
    </main>`
  });
}

function offersPillarIndex(pillar) {
  const groupLabel = offerGroupLabel(pillar.slug);
  const pillarOffers = offers.filter((offer) => {
    if (offer.pillar === pillar.slug) return true;
    return finalOffersFor({ pillarSlug: pillar.slug, limit: 50 }).some((item) => item.slug === offer.slug);
  });
  return layout({
    url: offersUrlFor(pillar.slug),
    title: `${groupLabel.title} | ${data.name}`,
    description: groupLabel.lead,
    crumbs: [
      { label: "Oferty", url: "/oferty" },
      { label: groupLabel.short, url: offersUrlFor(pillar.slug) }
    ],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Oferty</div>
            <h1>${esc(groupLabel.title)}</h1>
            <p class="lead">${esc(groupLabel.lead)}</p>
          </div>
        </div>
      </section>
      <section>
        <div class="offer-grid">${pillarOffers.map((offer) => offerCard(offer)).join("")}</div>
      </section>
    </main>`
  });
}

function offersFocusedPage(page) {
  const pillar = pillarBySlug.get(page.pillar);
  const groupLabel = offerGroupLabel(page.pillar);
  const orderedOffers = offersForPageFirst(page, page.pillar);
  const directCount = orderedOffers.filter((offer) => offer.pages?.includes(page.url)).length;
  return layout({
    url: offersPageUrlFor(page),
    title: `${page.title} - oferty | ${data.name}`,
    description: `Oferty powiązane z kategorią ${page.title}. Porównaj korzyści, warunki i dostępne promocje z sekcji ${pillar?.name || "oferty"}.`,
    crumbs: [
      { label: "Oferty", url: "/oferty" },
      { label: groupLabel.short, url: offersUrlFor(page.pillar) },
      { label: page.title, url: offersPageUrlFor(page) }
    ],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Oferty</div>
            <h1>${esc(page.title)} - oferty</h1>
            <p class="lead">Porównaj propozycje z tej kategorii i wybierz ofertę dopasowaną do swojej sytuacji.</p>
          </div>
        </div>
      </section>
      <section>
        <div class="section-head">
          <h2>${esc(page.title)}</h2>
          <p>${directCount ? "Te propozycje są najlepiej dopasowane do tej kategorii." : "Zobacz najbliższe propozycje z tej sekcji."}</p>
        </div>
        <div class="offer-grid">${orderedOffers.map((offer) => offerCard(offer)).join("")}</div>
      </section>
    </main>`
  });
}

function goPage(offer) {
  const hasDestination = Boolean(offer.affiliateUrl);
  const offerLead = offer.summary || `${offer.name}. ${offer.reward ? `Możesz zyskać: ${offer.reward}.` : "Sprawdź najważniejsze warunki oferty."}`;
  const primaryPage = (offer.pages || []).map((url) => pageByUrl.get(url)).find(Boolean);
  const similarOffersUrl = primaryPage ? offersPageUrlFor(primaryPage) : offersUrlFor(offer.pillar);
  return layout({
    url: `/go/${offer.slug}`,
    title: `${offer.name} | ${data.name}`,
    description: offerLead,
    noindex: true,
    schema: [offerSchema(offer)],
    crumbs: [
      { label: "Oferty", url: "/oferty" },
      { label: offer.name, url: `/go/${offer.slug}` }
    ],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">${hasDestination ? "Oferta partnera" : "Oferta w przygotowaniu"}</div>
            <h1>${esc(offer.name)}</h1>
            <p class="lead">${esc(offerLead)}</p>
            ${offerBenefitList(offer)}
            <div class="hero-actions">${hasDestination ? cta("Przejdź do oferty", offer.affiliateUrl) : ""}${cta("Podobne oferty", similarOffersUrl, true)}</div>
          </div>
        </div>
      </section>
      ${offerInstructionBlock(offer)}
      ${offerPartnerRulesBlock(offer)}
      <section class="warning-band">
        <div>
          <span class="badge">${hasDestination ? "Oferta" : "Oferta niedostępna"}</span>
          <h2>${hasDestination ? "Sprawdź ofertę u partnera" : "Ta oferta nie jest teraz dostępna"}</h2>
          <p>${hasDestination ? "Kliknięcie prowadzi do zewnętrznego partnera. Warunki i dostępność oferty mogą się zmienić, więc sprawdź je przed złożeniem wniosku." : "Ta oferta nie jest teraz dostępna. Wróć do katalogu i wybierz inną propozycję."}</p>
          ${hasDestination ? `<div class="hero-actions">${cta("Przejdź do partnera", offer.affiliateUrl)}${cta("Zobacz podobne oferty", similarOffersUrl, true)}</div>` : ""}
        </div>
      </section>
      <section>
        <div class="offer-grid">${offerCard(offer)}</div>
        <div class="section-actions">${cta("Zobacz inne podobne oferty", similarOffersUrl, true)}</div>
      </section>
    </main>`
  });
}

function toolsIndex() {
  return layout({
    url: "/narzedzia",
    title: `Narzędzia | ${data.name}`,
    description: "Kalkulatory i checklisty do finansów, ubezpieczeń, auta, pracy i domu.",
    crumbs: [{ label: "Narzędzia", url: "/narzedzia" }],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Kalkulatory i checklisty</div>
            <h1>Policz, sprawdź i przejdź do następnego kroku.</h1>
            <p class="lead">Kalkulatory i checklisty pomagają szybko sprawdzić koszty, warunki i następny krok.</p>
          </div>
        </div>
      </section>
      <section>
        <div class="grid">${data.tools.map((tool) => card({ ...tool, url: `/narzedzia/${tool.slug}`, cta: "Otwórz" })).join("")}</div>
      </section>
    </main>`
  });
}

function simplePage(url, title, description) {
  return layout({
    url,
    title: `${title} | ${data.name}`,
    description,
    crumbs: [{ label: title, url }],
    body: `<main><section class="hero compact"><div class="hero-inner single"><div><h1>${esc(title)}</h1><p class="lead">${esc(description)}</p></div></div></section></main>`
  });
}

function aboutPage() {
  const description =
    "PraktycznyZysk.pl pomaga szybciej porównać ważne decyzje z obszaru finansów, ubezpieczeń, auta, pracy i domu.";
  const benefits = [
    {
      title: "Mniej chaosu przed decyzją",
      text: "Zbieramy w jednym miejscu najważniejsze pytania, koszty, warunki i ryzyka, żeby nie trzeba było skakać między dziesiątkami stron."
    },
    {
      title: "Praktyczne porównanie",
      text: "Pokazujemy, co naprawdę warto sprawdzić: RRSO, ratę, termin spłaty, zakres ochrony, wymagania promocji, koszty po zakupie albo następny krok w procesie."
    },
    {
      title: "Kalkulatory i checklisty",
      text: "Narzędzia pomagają szybko policzyć orientacyjny koszt, sprawdzić gotowość do decyzji i wyłapać czerwone flagi przed kliknięciem dalej."
    },
    {
      title: "Prosty język",
      text: "Unikamy lania wody. Strony mają prowadzić do konkretu: co sprawdzić, na co uważać i gdzie przejść, jeśli temat pasuje do Twojej sytuacji."
    }
  ];
  return layout({
    url: "/o-nas",
    title: `O nas | ${data.name}`,
    description,
    crumbs: [{ label: "O nas", url: "/o-nas" }],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <h1>O nas</h1>
            <p class="lead">${esc(description)}</p>
          </div>
        </div>
      </section>
      <section>
        <div class="section-head">
          <h2>Co zyskujesz na stronie</h2>
          <p>PraktycznyZysk.pl ma ułatwiać szybkie, rozsądne decyzje bez przekopywania się przez niepotrzebne treści.</p>
        </div>
        <div class="trust-grid">${benefits
          .map((item) => `<div><strong>${esc(item.title)}</strong><span>${esc(item.text)}</span></div>`)
          .join("")}</div>
      </section>
      <section>
        <div class="section-head">
          <h2>Jak pomagamy</h2>
          <p>Każdy temat staramy się sprowadzić do prostego układu: najważniejsze informacje, ryzyka, narzędzie albo checklista i logiczny następny krok.</p>
        </div>
        <div class="list-grid">
          <a class="list-card" href="/finanse"><strong>Finanse</strong><span>Konta, kredyty, lokaty i pożyczki opisane przez koszty, warunki i sens decyzji.</span></a>
          <a class="list-card" href="/ubezpieczenia"><strong>Ubezpieczenia</strong><span>OC, AC i porównania zakresu ochrony bez skupiania się wyłącznie na cenie.</span></a>
          <a class="list-card" href="/auto"><strong>Auto</strong><span>Historia pojazdu, VIN, zakup auta i koszty, które warto sprawdzić przed decyzją.</span></a>
          <a class="list-card" href="/narzedzia"><strong>Narzędzia</strong><span>Kalkulatory i checklisty, które pomagają szybciej przejść od pytania do konkretu.</span></a>
        </div>
      </section>
    </main>`
  });
}

function faqPage() {
  const questions = [
    {
      title: "Czym jest PraktycznyZysk.pl?",
      text: "To serwis z praktycznymi poradnikami, kalkulatorami, checklistami i ofertami z obszaru finansów, ubezpieczeń, auta, pracy i domu."
    },
    {
      title: "Czy linki na stronie są afiliacyjne?",
      text: data.disclosure
    },
    {
      title: "Czy korzystanie z serwisu kosztuje?",
      text: "Nie. Treści, checklisty i kalkulatory dostępne na stronie są bezpłatne."
    },
    {
      title: "Czy warunki ofert mogą się zmienić?",
      text: "Tak. Premie, prowizje, RRSO, wymagania i dostępność oferty mogą zmienić się po stronie banku, pożyczkodawcy, ubezpieczyciela lub innego partnera. Przed decyzją zawsze sprawdź aktualne warunki u partnera."
    },
    {
      title: "Czy kalkulatory pokazują decyzję banku albo ubezpieczyciela?",
      text: "Nie. Kalkulatory pomagają oszacować koszt, ratę, budżet lub ryzyko. Przed wyborem oferty sprawdź szczegóły bezpośrednio u partnera."
    },
    {
      title: "Na co uważać przy pożyczkach i chwilówkach?",
      text: "Sprawdź RRSO, całkowitą kwotę do spłaty, termin, koszt opóźnienia i warunki promocji 0%. Nie bierz pożyczki tylko dlatego, że rata wygląda nisko."
    },
    {
      title: "Jak zgłosić błąd w ofercie?",
      text: "Napisz na kontakt@praktycznyzysk.pl i podaj nazwę oferty oraz link do strony, na której widzisz błąd."
    }
  ];
  return layout({
    url: "/faq",
    title: `FAQ | ${data.name}`,
    description: "Odpowiedzi na najczęstsze pytania o serwis, oferty, linki afiliacyjne, kalkulatory i bezpieczeństwo decyzji.",
    crumbs: [{ label: "FAQ", url: "/faq" }],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">FAQ</div>
            <h1>Najczęstsze pytania</h1>
            <p class="lead">Krótko i konkretnie: jak działa serwis, na co uważać przy ofertach i gdzie zgłosić błąd.</p>
          </div>
        </div>
      </section>
      <section>
        <div class="legal-list">${questions
          .map((item) => `<article><h2>${esc(item.title)}</h2><p>${esc(item.text)}</p></article>`)
          .join("")}</div>
      </section>
    </main>`
  });
}

function contactPage() {
  return layout({
    url: "/kontakt",
    title: `Kontakt | ${data.name}`,
    description: "Kontakt w sprawie błędów, współpracy, ofert partnerskich i treści na PraktycznyZysk.pl.",
    crumbs: [{ label: "Kontakt", url: "/kontakt" }],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Kontakt</div>
            <h1>Napisz do PraktycznyZysk.pl</h1>
            <p class="lead">W sprawie współpracy, korekty oferty, zgłoszenia błędu albo kontaktu redakcyjnego napisz na adres:</p>
            <div class="hero-actions">${cta("kontakt@praktycznyzysk.pl", "mailto:kontakt@praktycznyzysk.pl")}</div>
          </div>
        </div>
      </section>
      <section>
        <div class="trust-grid">
          <div><strong>Zgłoszenie błędu</strong><span>Podaj nazwę oferty, adres strony i krótki opis tego, co wymaga poprawy.</span></div>
          <div><strong>Współpraca</strong><span>Napisz, jakiej kategorii dotyczy propozycja: finanse, ubezpieczenia, auto albo dom.</span></div>
          <div><strong>Warunki ofert</strong><span>Jeśli pytasz o konkretną ofertę, przed decyzją sprawdź także aktualne warunki bezpośrednio u partnera.</span></div>
        </div>
      </section>
    </main>`
  });
}

function legalPage(url, title, description, sections) {
  return layout({
    url,
    title: `${title} | ${data.name}`,
    description,
    crumbs: [{ label: title, url }],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Strona prawna</div>
            <h1>${esc(title)}</h1>
            <p class="lead">${esc(description)}</p>
            <div class="update-stamp">Aktualizacja: ${esc(data.lastUpdated)}</div>
          </div>
        </div>
      </section>
      <section>
        <div class="legal-list">${sections
          .map((section) => `<article>
            <h2>${esc(section.title)}</h2>
            <p>${esc(section.text)}</p>
          </article>`)
          .join("")}</div>
      </section>
    </main>`
  });
}

if (data.privateMode) {
  writePage("/", privatePage());
  writePreviewPage("/", homePage());
  for (const pillar of data.pillars) writePreviewPage(`/${pillar.slug}`, pillarPage(pillar));
  writePreviewPage("/narzedzia", toolsIndex());
  for (const tool of data.tools) writePreviewPage(`/narzedzia/${tool.slug}`, toolPage(tool));
  writePreviewPage("/oferty", offersIndex());
  for (const pillar of data.pillars) writePreviewPage(offersUrlFor(pillar.slug), offersPillarIndex(pillar));
  for (const page of focusedOfferPages) writePreviewPage(offersPageUrlFor(page), offersFocusedPage(page));
  for (const offer of offers) writePreviewPage(`/go/${offer.slug}`, goPage(offer));
  for (const page of allPages) writePreviewPage(page.url, genericPage(page));
  for (const landing of seoLandingPages) writePreviewPage(landing.url, seoLandingPage(landing));
  writePreviewPage("/blog", blogIndex());
  for (const article of blogArticles) writePreviewPage(article.url, blogArticlePage(article));
  writePreviewPage("/faq", faqPage());
  writePreviewPage("/o-nas", aboutPage());
  writePreviewPage("/kontakt", contactPage());
  writePreviewPage(
    "/polityka-prywatnosci",
    legalPage("/polityka-prywatnosci", "Polityka prywatności", "Jak traktujemy dane, kliknięcia i przekierowania do zewnętrznych ofert.", [
      { title: "Zakres danych", text: "Serwis nie wymaga zakładania konta. Jeśli przechodzisz do zewnętrznego partnera, dalsze przetwarzanie danych odbywa się według zasad tego partnera." },
      { title: "Kliknięcia i analityka", text: "Możemy mierzyć anonimowe kliknięcia w linki i przyciski, żeby poprawiać układ strony. Nie zapisujemy wrażliwych danych finansowych w tych zdarzeniach." },
      { title: "Partnerzy", text: "Po kliknięciu linku afiliacyjnego możesz trafić do banku, pożyczkodawcy, ubezpieczyciela albo innego partnera. Warunki prywatności po przejściu określa ten dostawca." }
    ])
  );
  writePreviewPage(
    "/regulamin",
    legalPage("/regulamin", "Regulamin", "Zasady korzystania z serwisu, ofert i kalkulatorów.", [
      { title: "Charakter serwisu", text: "PraktycznyZysk.pl publikuje informacje, narzędzia, checklisty i porównania, które pomagają szybciej sprawdzić koszty, warunki i dostępne propozycje." },
      { title: "Oferty i linki", text: "Karty ofert mogą zawierać linki afiliacyjne. Przed decyzją sprawdź aktualne warunki bezpośrednio u partnera." },
      { title: "Narzędzia", text: "Kalkulatory i checklisty pomagają uporządkować dane przed wyborem oferty. Wynik traktuj jako punkt startowy do sprawdzenia warunków u partnera." }
    ])
  );
  fs.writeFileSync(path.join(dist, "404.html"), privatePage());
  fs.writeFileSync(path.join(dist, "robots.txt"), "User-agent: *\nDisallow: /\n");
  fs.writeFileSync(
    path.join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n`
  );
  console.log(`Built ${dist} in private mode`);
  process.exit(0);
}

writePage("/", homePage());
for (const pillar of data.pillars) writePage(`/${pillar.slug}`, pillarPage(pillar));
writePage("/narzedzia", toolsIndex());
for (const tool of data.tools) writePage(`/narzedzia/${tool.slug}`, toolPage(tool));
writePage("/oferty", offersIndex());
for (const pillar of data.pillars) writePage(offersUrlFor(pillar.slug), offersPillarIndex(pillar));
for (const page of focusedOfferPages) writePage(offersPageUrlFor(page), offersFocusedPage(page));
for (const offer of offers) writePage(`/go/${offer.slug}`, goPage(offer));
for (const page of allPages) writePage(page.url, genericPage(page));
for (const landing of seoLandingPages) writePage(landing.url, seoLandingPage(landing));
writePage("/blog", blogIndex());
for (const article of blogArticles) writePage(article.url, blogArticlePage(article));
for (const page of draftPromoPages) writePage(page.url, draftPromoPage(page));

writePage("/faq", faqPage());
writePage("/o-nas", aboutPage());
writePage("/kontakt", contactPage());
writePage(
  "/polityka-prywatnosci",
  legalPage("/polityka-prywatnosci", "Polityka prywatności", "Jak traktujemy dane, kliknięcia i przekierowania do zewnętrznych ofert.", [
    { title: "Zakres danych", text: "Serwis nie wymaga zakładania konta. Jeśli przechodzisz do zewnętrznego partnera, dalsze przetwarzanie danych odbywa się według zasad tego partnera." },
    { title: "Kliknięcia i analityka", text: "Możemy mierzyć anonimowe kliknięcia w linki i przyciski, żeby poprawiać układ strony. Nie zapisujemy wrażliwych danych finansowych w tych zdarzeniach." },
    { title: "Partnerzy", text: "Po kliknięciu linku afiliacyjnego możesz trafić do banku, pożyczkodawcy, ubezpieczyciela albo innego partnera. Warunki prywatności po przejściu określa ten dostawca." }
  ])
);
writePage(
  "/regulamin",
  legalPage("/regulamin", "Regulamin", "Zasady korzystania z serwisu, ofert i kalkulatorów.", [
    { title: "Charakter serwisu", text: "PraktycznyZysk.pl publikuje informacje, narzędzia, checklisty i porównania, które pomagają szybciej sprawdzić koszty, warunki i dostępne propozycje." },
    { title: "Oferty i linki", text: "Karty ofert mogą zawierać linki afiliacyjne. Przed decyzją sprawdź aktualne warunki bezpośrednio u partnera." },
    { title: "Narzędzia", text: "Kalkulatory i checklisty pomagają uporządkować dane przed wyborem oferty. Wynik traktuj jako punkt startowy do sprawdzenia warunków u partnera." }
  ])
);

const urls = [
  "/",
  ...data.pillars.map((pillar) => `/${pillar.slug}`),
  "/narzedzia",
  ...data.tools.map((tool) => `/narzedzia/${tool.slug}`),
  "/oferty",
  ...data.pillars.map((pillar) => offersUrlFor(pillar.slug)),
  ...focusedOfferPages.map((page) => offersPageUrlFor(page)),
  ...allPages.map((page) => page.url),
  ...seoLandingPages.map((landing) => landing.url),
  "/blog",
  ...blogArticleUrls(),
  "/faq",
  "/o-nas",
  "/kontakt",
  "/polityka-prywatnosci",
  "/regulamin"
];

function uniqueUrls(urlList) {
  return [...new Set(urlList)].sort((a, b) => a.localeCompare(b));
}

function sitemapPriority(url) {
  if (url === "/") return "1.0";
  if (data.pillars.some((pillar) => `/${pillar.slug}` === url)) return "0.9";
  if (url.startsWith("/oferty") || url.startsWith("/narzedzia")) return "0.8";
  if (url.includes("ranking") || url.includes("konta-z-premia") || url.includes("kredyty") || url.includes("oc")) return "0.8";
  return "0.6";
}

function sitemapChangefreq(url) {
  if (url === "/" || url.startsWith("/oferty") || url.includes("ranking")) return "weekly";
  if (url.startsWith("/narzedzia")) return "monthly";
  return "monthly";
}

fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: https://${data.domain}/sitemap.xml\n`);
fs.writeFileSync(path.join(dist, `${indexNowKey}.txt`), indexNowKey);
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls(urls)
    .map((url) => `  <url><loc>${absoluteUrl(url)}</loc><lastmod>${data.lastUpdated}</lastmod><changefreq>${sitemapChangefreq(url)}</changefreq><priority>${sitemapPriority(url)}</priority></url>`)
    .join("\n")}\n</urlset>\n`
);

fs.writeFileSync(
  path.join(dist, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#0f172a"/><circle cx="32" cy="32" r="20" fill="#00e676"/><path d="M20 38l8 8 17-30" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`
);
fs.writeFileSync(
  path.join(dist, "llms.txt"),
  `# ${data.name}\n\n${data.description}\n\nGłówne sekcje:\n- Finanse: https://${data.domain}/finanse\n- Ubezpieczenia: https://${data.domain}/ubezpieczenia\n- Auto: https://${data.domain}/auto\n- Dom: https://${data.domain}/dom\n- Narzędzia: https://${data.domain}/narzedzia\n\nSitemap: https://${data.domain}/sitemap.xml\n`
);

console.log(`Built ${dist} with ${uniqueUrls(urls).length} URLs`);

