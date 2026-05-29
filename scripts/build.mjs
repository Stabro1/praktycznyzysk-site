import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "site.json"), "utf8"));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.copyFileSync(path.join(root, "src", "styles.css"), path.join(dist, "styles.css"));

const esc = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const stripSlash = (url) => url.replace(/^\/|\/$/g, "");
const outFile = (url) => {
  const clean = stripSlash(url);
  return clean ? path.join(dist, clean, "index.html") : path.join(dist, "index.html");
};
const writePage = (url, html) => {
  const file = outFile(url);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};

const pillarBySlug = new Map(data.pillars.map((pillar) => [pillar.slug, pillar]));

function navLinks() {
  return data.primaryNav.map((item) => `<a href="${esc(item.url)}">${esc(item.label)}</a>`).join("");
}

function breadcrumbs(items = []) {
  if (!items.length) return "";
  return `<nav class="breadcrumbs" aria-label="Breadcrumbs"><a href="/">Start</a>${items
    .map((item) => `<span>/</span><a href="${esc(item.url)}">${esc(item.label)}</a>`)
    .join("")}</nav>`;
}

function layout({ url = "/", title, description, body, crumbs = [] }) {
  const canonical = `https://${data.domain}${url === "/" ? "/" : url}`;
  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header">
    <nav class="nav" aria-label="Glowne">
      <a class="brand" href="/"><span class="mark">PZ</span><span>${esc(data.shortName)}</span></a>
      <div class="nav-links">${navLinks()}</div>
      <a class="nav-cta" href="/narzedzia">Narzedzia</a>
    </nav>
  </header>
  ${breadcrumbs(crumbs)}
  ${body}
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <strong>${esc(data.name)}</strong>
        <p>${esc(data.disclosure)}</p>
      </div>
      <div class="footer-links">
        <a href="/faq">FAQ</a>
        <a href="/o-nas">O nas</a>
        <a href="/kontakt">Kontakt</a>
        <a href="/polityka-prywatnosci">Polityka prywatnosci</a>
        <a href="/regulamin">Regulamin</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function cta(label, url, secondary = false) {
  return `<a class="button${secondary ? " secondary" : ""}" href="${esc(url)}">${esc(label)}</a>`;
}

function card(item, extra = "") {
  return `<article class="card">
    ${extra}
    <h3>${esc(item.name || item.label || item.title)}</h3>
    <p>${esc(item.description || item.note || "")}</p>
    ${item.url ? cta(item.cta || "Sprawdz", item.url, true) : ""}
  </article>`;
}

function linkList(links) {
  return `<div class="quick-links">${links
    .map((link) => `<a href="${esc(link.url)}">${esc(link.label)}</a>`)
    .join("")}</div>`;
}

function trustBlock() {
  return `<section class="band">
    <div class="section-head">
      <h2>Jak trzymamy zaufanie</h2>
      <p>Pokazujemy darmowe opcje, oznaczamy afiliacje i nie udajemy indywidualnej porady finansowej, prawnej ani ubezpieczeniowej.</p>
    </div>
    <div class="trust-grid">
      <div><strong>Darmowe najpierw</strong><span>Jesli istnieje sensowne darmowe zrodlo, pokazujemy je przed platnym.</span></div>
      <div><strong>Ryzyko widoczne</strong><span>Przy drogich decyzjach pokazujemy koszty, warunki i kiedy uwazac.</span></div>
      <div><strong>Jasne CTA</strong><span>Kazda strona ma prowadzic do jednego logicznego nastepnego kroku.</span></div>
    </div>
  </section>`;
}

function homePage() {
  const pillars = data.pillars.map((pillar) => card({ ...pillar, url: `/${pillar.slug}` })).join("");
  const popular = data.popular
    .map((item) => `<a class="list-card" href="${esc(item.url)}"><strong>${esc(item.label)}</strong><span>${esc(item.note)}</span></a>`)
    .join("");
  const tools = data.tools.slice(0, 6).map((tool) => card({ ...tool, url: `/narzedzia/${tool.slug}`, cta: "Otworz" })).join("");

  return layout({
    title: `${data.name} - ${data.tagline}`,
    description: data.description,
    body: `<main>
      <section class="hero">
        <div class="hero-inner">
          <div>
            <div class="eyebrow">PraktycznyZysk.pl</div>
            <h1>Praktyczne decyzje, ktore pomagaja nie przeplacac.</h1>
            <p class="lead">${esc(data.description)}</p>
            <div class="hero-actions">
              ${cta("Wybierz temat", "#piony")}
              ${cta("Najczesciej wybierane", "#najczesciej", true)}
            </div>
          </div>
          <aside class="hero-panel">
            <strong>Model serwisu</strong>
            <p>Homepage jest hubem marki. Sprzedaz i decyzje dzieja sie na landingach pionow i glebszych stronach z sociali.</p>
          </aside>
        </div>
      </section>

      <section id="piony">
        <div class="section-head">
          <h2>Wybierz obszar</h2>
          <p>Piec wejsc odpowiada pieciu kanalowym kategoriom social: finanse, ubezpieczenia, auto, praca i dom.</p>
        </div>
        <div class="grid cards-5">${pillars}</div>
      </section>

      <section id="najczesciej">
        <div class="section-head">
          <h2>Najczesciej wybierane</h2>
          <p>Szybkie wejscia do tematow, ktore najlepiej lacza ruch, zaufanie i monetyzacje.</p>
        </div>
        <div class="list-grid">${popular}</div>
      </section>

      <section>
        <div class="section-head">
          <h2>Narzedzia</h2>
          <p>Kazde narzedzie ma dac wynik, interpretacje i sekcje "Co dalej?".</p>
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
  const pages = data.pages.filter((page) => page.pillar === pillar.slug);

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
            <div class="hero-actions">${cta(pillar.cta, `/${pillar.slug}#start`)}${cta("Narzedzia", "/narzedzia", true)}</div>
          </div>
          <aside class="hero-panel">${linkList(pillar.priorityLinks)}</aside>
        </div>
      </section>
      <section id="start">
        <div class="section-head">
          <h2>Zacznij od tego</h2>
          <p>Najwazniejsze sciezki w tym pionie. Na mobile maja byc czytelne bez szukania w menu.</p>
        </div>
        <div class="list-grid">${pillar.priorityLinks
          .map((link) => `<a class="list-card" href="${esc(link.url)}"><strong>${esc(link.label)}</strong><span>Przejdz do nastepnego kroku</span></a>`)
          .join("")}</div>
      </section>
      <section>
        <div class="section-head">
          <h2>Podstrony pionu</h2>
          <p>Fundament pod kolejne sprinty: poradniki, rankingi, narzedzia i oferty.</p>
        </div>
        <div class="grid">${pages.map((page) => card({ ...page, name: page.title, url: page.url, cta: page.cta })).join("")}</div>
      </section>
      <section>
        <div class="section-head">
          <h2>Powiazane narzedzia</h2>
          <p>Narzedzia prowadza do wyniku i kolejnego kroku, nie sa ozdoba SEO.</p>
        </div>
        <div class="grid">${relatedTools.map((tool) => card({ ...tool, url: `/narzedzia/${tool.slug}`, cta: "Otworz" })).join("") || card({ name: "Narzedzia", description: "Zobacz wszystkie kalkulatory i checklisty.", url: "/narzedzia", cta: "Przejdz" })}</div>
      </section>
    </main>`
  });
}

function toolPage(tool) {
  return layout({
    url: `/narzedzia/${tool.slug}`,
    title: `${tool.name} | ${data.name}`,
    description: tool.description,
    crumbs: [
      { label: "Narzedzia", url: "/narzedzia" },
      { label: tool.name, url: `/narzedzia/${tool.slug}` }
    ],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Narzedzie</div>
            <h1>${esc(tool.name)}</h1>
            <p class="lead">${esc(tool.description)}</p>
          </div>
        </div>
      </section>
      <section>
        <div class="tool-shell">
          <div class="fake-form">
            <label>Kwota / wartosc</label><input value="" placeholder="np. 20000">
            <label>Okres / sytuacja</label><input value="" placeholder="np. 36 miesiecy">
            <button class="button" type="button">Pokaz wynik orientacyjny</button>
          </div>
          <div class="result-card">
            <span class="badge">Co dalej?</span>
            <h2>Wynik bedzie punktem startowym</h2>
            <p>Na tym etapie pokazujemy bezpieczny model narzedzia: input, wynik, interpretacja, ostrzezenie i nastepny krok. Nie udajemy decyzji bankowej, realnej skladki ani indywidualnej porady.</p>
            ${cta("Przejdz do nastepnego kroku", tool.next)}
          </div>
        </div>
      </section>
    </main>`
  });
}

function genericPage(page) {
  const pillar = pillarBySlug.get(page.pillar);
  return layout({
    url: page.url,
    title: `${page.title} | ${data.name}`,
    description: page.description,
    crumbs: [
      { label: pillar?.name ?? "Serwis", url: pillar ? `/${pillar.slug}` : "/" },
      { label: page.title, url: page.url }
    ],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">${esc(page.type)}</div>
            <h1>${esc(page.title)}</h1>
            <p class="lead">${esc(page.description)}</p>
            <div class="hero-actions">${cta(page.cta, page.ctaUrl)}</div>
          </div>
        </div>
      </section>
      <section>
        <div class="section-head">
          <h2>Najwazniejsze zasady</h2>
          <p>Ta strona jest fundamentem pod pelna tresc w kolejnych sprintach.</p>
        </div>
        <div class="trust-grid">
          <div><strong>Najpierw zrozum</strong><span>Co wybierasz, jakie sa koszty i gdzie sa ograniczenia.</span></div>
          <div><strong>Sprawdz ryzyko</strong><span>Przy finansach, ubezpieczeniach, aucie i domu decyzje moga kosztowac realne pieniadze.</span></div>
          <div><strong>Przejdz dalej</strong><span>Uzyj narzedzia, checklisty, rankingu albo poradnika powiazanego z tematem.</span></div>
        </div>
      </section>
    </main>`
  });
}

function toolsIndex() {
  return layout({
    url: "/narzedzia",
    title: `Narzedzia | ${data.name}`,
    description: "Kalkulatory i checklisty do finansow, ubezpieczen, auta, pracy i domu.",
    crumbs: [{ label: "Narzedzia", url: "/narzedzia" }],
    body: `<main>
      <section class="hero compact">
        <div class="hero-inner single">
          <div>
            <div class="eyebrow">Kalkulatory i checklisty</div>
            <h1>Policz, sprawdz i przejdz do nastepnego kroku.</h1>
            <p class="lead">Kazde narzedzie ma miec prosty input, wynik, interpretacje i jasne "Co dalej?".</p>
          </div>
        </div>
      </section>
      <section>
        <div class="grid">${data.tools.map((tool) => card({ ...tool, url: `/narzedzia/${tool.slug}`, cta: "Otworz" })).join("")}</div>
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

writePage("/", homePage());
for (const pillar of data.pillars) writePage(`/${pillar.slug}`, pillarPage(pillar));
writePage("/narzedzia", toolsIndex());
for (const tool of data.tools) writePage(`/narzedzia/${tool.slug}`, toolPage(tool));
for (const page of data.pages) writePage(page.url, genericPage(page));

writePage("/faq", simplePage("/faq", "FAQ", "Krotkie odpowiedzi na najwazniejsze pytania o serwis, afiliacje, narzedzia i decyzje."));
writePage("/o-nas", simplePage("/o-nas", "O nas", "PraktycznyZysk.pl pomaga podejmowac praktyczne decyzje i jasno oznacza, jak zarabia."));
writePage("/kontakt", simplePage("/kontakt", "Kontakt", "Miejsce na kontakt, wspolprace i partnerstwa afiliacyjne."));
writePage("/polityka-prywatnosci", simplePage("/polityka-prywatnosci", "Polityka prywatnosci", "Strona prawna do uzupelnienia przed formularzami leadowymi."));
writePage("/regulamin", simplePage("/regulamin", "Regulamin", "Zasady korzystania z serwisu do uzupelnienia przed pelnym uruchomieniem."));

const urls = [
  "/",
  ...data.pillars.map((pillar) => `/${pillar.slug}`),
  "/narzedzia",
  ...data.tools.map((tool) => `/narzedzia/${tool.slug}`),
  ...data.pages.map((page) => page.url),
  "/faq",
  "/o-nas",
  "/kontakt",
  "/polityka-prywatnosci",
  "/regulamin"
];

fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: https://${data.domain}/sitemap.xml\n`);
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>https://${data.domain}${url}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);

console.log(`Built ${dist} with ${urls.length} URLs`);
