import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "site.json"), "utf8"));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.mkdirSync(path.join(dist, "go"), { recursive: true });
fs.copyFileSync(path.join(root, "src", "styles.css"), path.join(dist, "styles.css"));

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const categoryBySlug = new Map(data.categories.map((category) => [category.slug, category]));

function layout({ title, description, body }) {
  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="https://${data.domain}/">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header">
    <nav class="nav" aria-label="Glowne">
      <a class="brand" href="/"><span class="mark">PZ</span><span>${esc(data.name)}</span></a>
      <div class="nav-links">
        <a href="/#kategorie">Kategorie</a>
        <a href="/#oferty">Oferty</a>
        <a href="/#rankingi">Rankingi</a>
        <a class="button secondary" href="/#kontakt">Wspolpraca</a>
      </div>
    </nav>
  </header>
  ${body}
  <footer class="site-footer" id="kontakt">
    <div class="footer-inner">
      <strong>${esc(data.name)}</strong>
      <span>${esc(data.disclosure)}</span>
    </div>
  </footer>
</body>
</html>`;
}

const categoryCards = data.categories
  .map(
    (category) => `<article class="category" id="${esc(category.slug)}">
  <h3>${esc(category.name)}</h3>
  <p>${esc(category.description)}</p>
  <span class="angle">${esc(category.angle)}</span>
</article>`
  )
  .join("\n");

const offerCards = data.offers
  .map((offer) => {
    const category = categoryBySlug.get(offer.category);
    return `<article class="offer">
  <span class="badge">${esc(offer.badge)}</span>
  <h3>${esc(offer.title)}</h3>
  <p>${esc(offer.summary)}</p>
  <ul class="pros">${offer.pros.map((pro) => `<li>${esc(pro)}</li>`).join("")}</ul>
  <a class="button" href="/go/${esc(offer.slug)}">${esc(offer.cta)}</a>
  <p class="rank-meta">${esc(category?.name ?? "Oferta")}</p>
</article>`;
  })
  .join("\n");

const rankItems = data.offers
  .slice(0, 5)
  .map((offer, index) => {
    const category = categoryBySlug.get(offer.category);
    return `<div class="rank-item">
  <span class="rank-no">${index + 1}</span>
  <div>
    <div class="rank-title">${esc(offer.title)}</div>
    <div class="rank-meta">${esc(category?.name ?? "Oferta")} - ${esc(offer.summary)}</div>
  </div>
  <a class="button secondary" href="/go/${esc(offer.slug)}">Sprawdz</a>
</div>`;
  })
  .join("\n");

const home = layout({
  title: "Praktyczny Zysk - rankingi, narzedzia i oferty afiliacyjne",
  description: data.tagline,
  body: `<main>
  <section class="hero">
    <div class="hero-inner">
      <div>
        <div class="eyebrow">Praktycznyzysk.pl</div>
        <h1>Wybieraj oferty, ktore maja sens finansowy.</h1>
        <p class="lead">${esc(data.tagline)}</p>
        <div class="hero-actions">
          <a class="button" href="#oferty">Zobacz oferty</a>
          <a class="button secondary" href="#kategorie">Przegladaj kategorie</a>
        </div>
      </div>
      <aside class="hero-panel" aria-label="Zakres serwisu">
        <div class="metric-grid">
          <div class="metric"><strong>${data.categories.length}</strong><span>kategorii do rozbudowy pod SEO i afiliacje</span></div>
          <div class="metric"><strong>${data.offers.length}</strong><span>startowych ofert z redirectami afiliacyjnymi</span></div>
          <div class="metric"><strong>/go</strong><span>wlasne linki do mierzenia klikniec</span></div>
          <div class="metric"><strong>SEO</strong><span>rankingi, porownania i poradniki jako kolejne sekcje</span></div>
        </div>
      </aside>
    </div>
  </section>

  <section id="kategorie">
    <div class="section-head">
      <h2>Kategorie</h2>
      <p>Struktura przygotowana pod rozbudowe: osobne rankingi, poradniki, porownania i strony ofert dla kazdej niszy.</p>
    </div>
    <div class="category-grid">${categoryCards}</div>
  </section>

  <section id="oferty">
    <div class="section-head">
      <h2>Oferty na start</h2>
      <p>Linki sa podmienialne w jednym pliku danych. Na razie czesc prowadzi do placeholderow, zeby bezpiecznie przygotowac szkielet serwisu.</p>
    </div>
    <div class="offer-grid">${offerCards}</div>
  </section>

  <section id="rankingi">
    <div class="section-head">
      <h2>Ranking praktycznych wyborow</h2>
      <p>Gotowe miejsce pod evergreen SEO: najlepsze konta, narzedzia AI, hostingi, produkty domowe, kursy i suplementy.</p>
    </div>
    <div class="rank-box">
      <div class="rank-list">${rankItems}</div>
    </div>
  </section>

  <section>
    <div class="disclosure">${esc(data.disclosure)} Material ma charakter informacyjny i komercyjny. Warunki ofert trzeba zawsze sprawdzic u dostawcy.</div>
  </section>
</main>`
});

fs.writeFileSync(path.join(dist, "index.html"), home);

for (const offer of data.offers) {
  const target = offer.url;
  const redirect = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url=${esc(target)}">
  <title>Przekierowanie - ${esc(offer.title)}</title>
</head>
<body>
  <p>Przekierowanie do: <a href="${esc(target)}">${esc(offer.title)}</a></p>
</body>
</html>`;
  fs.writeFileSync(path.join(dist, "go", `${offer.slug}.html`), redirect);
}

fs.writeFileSync(path.join(dist, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://praktycznyzysk.pl/sitemap.xml\n");
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://praktycznyzysk.pl/</loc></url></urlset>\n`
);

console.log(`Built ${dist}`);
