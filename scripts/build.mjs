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
    cta: section.cta || "Sprawdz dalej",
    ctaUrl: section.ctaUrl || (section.pillar ? `/${section.pillar}` : "/"),
    description:
      page.description ||
      `Fundament strony w sekcji ${section.label}. Ta podstrona ma jasny cel, miejsce w architekturze i nastepny krok.`,
    ...page,
    title: page.title || page.label || titleFromUrl(page.url)
  }))
);

const pageByUrl = new Map();
for (const page of [...catalogPages, ...(data.pages || [])]) pageByUrl.set(page.url, page);
const allPages = [...pageByUrl.values()].sort((a, b) => a.url.localeCompare(b.url));

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
          const quick = pillar?.priorityLinks?.slice(0, 3) || [];
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
      ${mobileMenu()}
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
        ${data.primaryNav.map((item) => `<a href="${esc(item.url)}">${esc(item.label)}</a>`).join("")}
      </div>
      <div class="footer-links">
        <a href="/poradniki">Poradniki</a>
        <a href="/faq">FAQ</a>
        <a href="/o-nas">O nas</a>
        <a href="/kontakt">Kontakt</a>
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

function sectionNav(pillar) {
  if (!pillar?.priorityLinks?.length) return "";
  return `<nav class="section-nav" aria-label="Menu sekcji">
    <strong>${esc(pillar.name)}</strong>
    <div>${pillar.priorityLinks.map((link) => `<a href="${esc(link.url)}">${esc(link.label)}</a>`).join("")}</div>
  </nav>`;
}

function nextStepBlock({ title = "Co dalej?", description = "Wybierz najlogiczniejszy nastepny krok.", links = [] }) {
  if (!links.length) return "";
  return `<section class="next-steps">
    <div class="section-head">
      <h2>${esc(title)}</h2>
      <p>${esc(description)}</p>
    </div>
    <div class="list-grid">${links
      .map((link) => `<a class="list-card" href="${esc(link.url)}"><strong>${esc(link.label)}</strong><span>${esc(link.note || "Przejdz do nastepnego kroku")}</span></a>`)
      .join("")}</div>
  </section>`;
}

function renderContentBlocks(blocks = []) {
  if (!blocks.length) return "";
  return blocks
    .map((block) => {
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
          .map((item) => `<div><strong>${esc(item.title)}</strong><span>${esc(item.text)}</span></div>`)
          .join("")}</div>
      </section>`;
    })
    .join("");
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
  const pages = allPages.filter((page) => page.pillar === pillar.slug);

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
      ${sectionNav(pillar)}
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
      ${nextStepBlock({
        title: "Najlepszy nastepny krok",
        description: "Te przejscia lacza ruch, SEO i monetyzacje bez mieszania pionow.",
        links: pillar.priorityLinks.map((link) => ({ ...link, note: "Najwazniejsza sciezka w tej sekcji" }))
      })}
    </main>`
  });
}

const toolModels = {
  "kalkulator-zdolnosci-kredytowej": {
    type: "calculator",
    fields: ["Miesieczny dochod netto", "Stale raty i zobowiazania", "Koszty zycia", "Planowana rata"],
    resultTitle: "Orientacyjna zdolnosc i margines bezpieczenstwa",
    resultText: "Wynik powinien pokazac, czy budzet ma miejsce na nowa rate. To nie jest decyzja banku, tylko filtr przed rankingiem i wnioskiem.",
    bullets: ["rata nie powinna zabierac calej nadwyzki", "sprawdz BIK przed wieloma wnioskami", "zostaw bufor na koszty stale"]
  },
  "kalkulator-raty": {
    type: "calculator",
    fields: ["Kwota kredytu", "Okres w miesiacach", "Oprocentowanie lub szacowany koszt", "Prowizja"],
    resultTitle: "Rata, koszt i calkowita kwota do splaty",
    resultText: "To narzedzie ma kierowac do porownania kredytow dopiero po zrozumieniu raty i kosztu calkowitego.",
    bullets: ["porownuj RRSO i kwote do splaty", "nizsza rata moze oznaczac dluzszy okres", "sprawdz prowizje i ubezpieczenia"]
  },
  "kalkulator-rrso": {
    type: "calculator",
    fields: ["Kwota finansowania", "Kwota do oddania", "Okres splaty", "Dodatkowe koszty"],
    resultTitle: "Szacunkowe RRSO i sygnal ryzyka",
    resultText: "RRSO ma pomagac porownac oferty, ale przy bardzo krotkich pozyczkach wynik moze wygladac skrajnie wysoko.",
    bullets: ["porownuj podobne kwoty i okresy", "0% wymaga spelnienia warunkow", "zawsze sprawdz koszt po terminie"]
  },
  "kalkulator-oc": {
    type: "calculator",
    fields: ["Wiek kierowcy", "Historia szkod", "Pojemnosc i rocznik auta", "Kod pocztowy"],
    resultTitle: "Czynniki, ktore moga podniesc skladke",
    resultText: "Bez integracji nie pokazujemy realnej skladki. Pokazujemy czynniki ceny i przejscie do porownania OC/AC.",
    bullets: ["OC porownuj przed koncem polisy", "przy AC sprawdz zakres i wykluczenia", "po zakupie auta sprawdz ciaglosc OC"]
  },
  "budzet-domowy": {
    type: "calculator",
    fields: ["Dochody miesieczne", "Koszty stale", "Raty i abonamenty", "Planowana rezerwa"],
    resultTitle: "Nadwyzka, deficyt i bezpieczny limit rat",
    resultText: "Budzet ma pokazac, czy decyzja finansowa jest realna, zanim uzytkownik przejdzie do kredytu, chwilowki albo remontu.",
    bullets: ["najpierw rezerwa, potem rata", "oddziel potrzeby od zachcianek", "nie finansuj deficytu chwilowka"]
  },
  "checklista-kredyt": {
    type: "checklist",
    fields: ["RRSO widoczne", "Rata pasuje do budzetu", "Koszt calkowity znany", "Warunki i prowizje sprawdzone"],
    resultTitle: "Gotowosc do porownania ofert",
    resultText: "Jesli ktorys punkt nie jest spelniony, uzytkownik powinien wrocic do kalkulatora raty albo RRSO.",
    bullets: ["nie skladaj wielu wnioskow naraz", "sprawdz calkowita kwote do splaty", "czytaj warunki dodatkowych produktow"]
  },
  "checklista-chwilowka": {
    type: "checklist",
    fields: ["Znam termin splaty", "Znam koszt po terminie", "Mam pieniadze na splate", "Nie splacam innej chwilowki"],
    resultTitle: "Czerwone flagi przed chwilowka",
    resultText: "Ta checklista ma ograniczac ryzykowne klikniecia. Chwilowka bez pewnej splaty jest zlym produktem dla uzytkownika.",
    bullets: ["0% zwykle dotyczy pierwszej pozyczki", "opoznienie moze mocno podniesc koszt", "nie roluj zobowiazan"]
  },
  "checklista-zakup-auta": {
    type: "checklist",
    fields: ["VIN i rejestracja", "Historia gov.pl", "Ogledziny i jazda probna", "OC/AC i koszty po zakupie"],
    resultTitle: "Gotowosc do decyzji o aucie",
    resultText: "Najpierw historia i stan auta, potem polisa i finansowanie. Raport VIN nie zastapi ogledzin.",
    bullets: ["sprawdz dane z dokumentami", "nie plac zaliczki pod presja", "policz serwis startowy i OC"]
  },
  "checklista-rozmowa-kwalifikacyjna": {
    type: "checklist",
    fields: ["CV dopasowane", "Odpowiedzi przygotowane", "Pytania do firmy", "Oczekiwania finansowe"],
    resultTitle: "Gotowosc do rozmowy",
    resultText: "Uzytkownik ma wyjsc z narzedzia do rozmowy kwalifikacyjnej, kreatora CV albo negocjacji wynagrodzenia.",
    bullets: ["przygotuj liczby i przyklady", "sprawdz firme przed rozmowa", "ustal minimalna akceptowalna stawke"]
  },
  "checklista-remont": {
    type: "checklist",
    fields: ["Zakres prac", "Budzet i rezerwa", "Wykonawca i umowa", "Harmonogram i odbior"],
    resultTitle: "Gotowosc do startu remontu",
    resultText: "Remont bez zakresu, rezerwy i umowy latwo ucieka z budzetu. Narzedzie prowadzi do planu i finansowania.",
    bullets: ["zostaw rezerwe na niespodzianki", "porownaj minimum kilka wycen", "nie zaczynaj bez pisemnego zakresu"]
  }
};

function renderToolInputs(model) {
  return (model.fields || [])
    .map((field, index) => {
      const input = model.type === "checklist"
        ? `<label class="check-row"><input type="checkbox"><span>${esc(field)}</span></label>`
        : `<label>${esc(field)}</label><input value="" placeholder="${index === 0 ? "wpisz wartosc" : "uzupelnij"}">`;
      return input;
    })
    .join("");
}

function toolPage(tool) {
  const model = toolModels[tool.slug] || {
    type: "calculator",
    fields: ["Kwota / wartosc", "Okres / sytuacja"],
    resultTitle: "Wynik bedzie punktem startowym",
    resultText: "Na tym etapie pokazujemy bezpieczny model narzedzia: input, wynik, interpretacja, ostrzezenie i nastepny krok.",
    bullets: ["uzyj wyniku jako punktu startowego", "sprawdz warunki przed kliknieciem", "przejdz do powiazanej strony"]
  };
  const related = [
    { label: "Wroc do narzedzi", url: "/narzedzia", note: "Zobacz pozostale kalkulatory i checklisty" },
    { label: "Przejdz do wyniku", url: tool.next, note: "Najblizszy krok po uzyciu narzedzia" }
  ];
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
            <span class="badge">${model.type === "checklist" ? "Checklista" : "Kalkulator"}</span>
            ${renderToolInputs(model)}
            <button class="button" type="button">${model.type === "checklist" ? "Sprawdz gotowosc" : "Pokaz wynik orientacyjny"}</button>
          </div>
          <div class="result-card">
            <span class="badge">Co dalej?</span>
            <h2>${esc(model.resultTitle)}</h2>
            <p>${esc(model.resultText)} Nie udajemy decyzji bankowej, realnej skladki ani indywidualnej porady.</p>
            <ul class="tool-points">${model.bullets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
            ${cta("Przejdz do nastepnego kroku", tool.next)}
          </div>
        </div>
      </section>
      ${nextStepBlock({
        title: "Powiazane przejscia",
        description: "Narzedzie nie powinno konczyc sesji. Wynik ma kierowac do decyzji.",
        links: related
      })}
    </main>`
  });
}

function genericPage(page) {
  const pillar = pillarBySlug.get(page.pillar);
  const contentBlocks = data.pageContent?.[page.url] || [];
  const sectionLinks = pillar?.priorityLinks || [];
  const relatedTools = data.tools
    .filter((tool) => tool.next.includes(page.pillar || "") || tool.next === page.url)
    .slice(0, 3);
  const genericLinks = [
    ...(pillar?.priorityLinks || []).slice(0, 3).map((link) => ({ ...link, note: "Wazny krok w tym pionie" })),
    ...relatedTools.map((tool) => ({ label: tool.name, url: `/narzedzia/${tool.slug}`, note: tool.description }))
  ].slice(0, 4);
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
      ${sectionNav(pillar)}
      ${renderContentBlocks(contentBlocks)}
      <section>
        <div class="section-head">
          <h2>Najwazniejsze zasady</h2>
          <p>Ta strona jest czescia pelnej mapy serwisu. Teraz ma fundament SEO, CTA i linkowanie; w kolejnych sprintach dostanie pelna tresc lub modul ofertowy.</p>
        </div>
        <div class="trust-grid">
          <div><strong>Najpierw zrozum</strong><span>Co wybierasz, jakie sa koszty i gdzie sa ograniczenia.</span></div>
          <div><strong>Sprawdz ryzyko</strong><span>Przy finansach, ubezpieczeniach, aucie i domu decyzje moga kosztowac realne pieniadze.</span></div>
          <div><strong>Przejdz dalej</strong><span>Uzyj narzedzia, checklisty, rankingu albo poradnika powiazanego z tematem.</span></div>
        </div>
      </section>
      <section>
        <div class="section-head">
          <h2>Powiazane tematy</h2>
          <p>Linki sa dobierane kontekstowo, zeby uzytkownik nie konczyl w slepej uliczce.</p>
        </div>
        <div class="list-grid">${
          genericLinks.length
            ? genericLinks
                .map((link) => `<a class="list-card" href="${esc(link.url)}"><strong>${esc(link.label)}</strong><span>${esc(link.note)}</span></a>`)
                .join("")
            : sectionLinks
            .map((link) => `<a class="list-card" href="${esc(link.url)}"><strong>${esc(link.label)}</strong><span>Wazny krok w tym pionie</span></a>`)
            .join("") ||
          `<a class="list-card" href="/narzedzia"><strong>Narzedzia</strong><span>Kalkulatory i checklisty do dalszej decyzji.</span></a>`
        }</div>
      </section>
      ${nextStepBlock({
        links: [
          { label: page.cta, url: page.ctaUrl, note: "Glowny nastepny krok tej strony" },
          ...(pillar ? [{ label: `Wroc do ${pillar.name}`, url: `/${pillar.slug}`, note: "Zobacz cala sekcje" }] : [])
        ]
      })}
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
for (const page of allPages) writePage(page.url, genericPage(page));

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
  ...allPages.map((page) => page.url),
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
