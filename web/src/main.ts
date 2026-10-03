import "./style.css";
import { tokenConfig, type TokenConfig } from "../../token.config";

/**
 * Eenvoudige placeholder-landingspagina. Alle gegevens komen uit token.config.ts.
 * Er wordt bewust geen innerHTML met configwaarden gebruikt (alleen textContent),
 * zodat de pagina veilig blijft als de teksten later veranderen.
 */

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderHero(config: TokenConfig): HTMLElement {
  const hero = el("section", "hero");

  const logo = el("img", "hero__logo");
  logo.src = `/${config.logoPath.split("/").pop() ?? "logo.png"}`;
  logo.alt = `Logo van ${config.name}`;
  logo.width = 128;
  logo.height = 128;
  hero.append(logo);

  hero.append(el("h1", "hero__name", config.name));
  hero.append(el("p", "hero__ticker", `$${config.symbol}`));
  hero.append(el("p", "hero__description", config.description));
  return hero;
}

function renderContract(config: TokenConfig): HTMLElement {
  const card = el("section", "card");
  card.append(el("h2", undefined, "Contractadres"));
  const row = el("div", "contract");

  if (config.contractAddress) {
    const address = el("code", "contract__address", config.contractAddress);
    const copy = el("button", "button", "Kopieer");
    copy.type = "button";
    copy.addEventListener("click", () => {
      navigator.clipboard
        .writeText(config.contractAddress)
        .then(() => {
          copy.textContent = "Gekopieerd";
          window.setTimeout(() => (copy.textContent = "Kopieer"), 1500);
        })
        .catch(() => {
          copy.textContent = "Kopiëren mislukt";
        });
    });
    row.append(address, copy);

    const pump = el("a", undefined, "Bekijk op pump.fun");
    pump.href = `https://pump.fun/coin/${config.contractAddress}`;
    pump.target = "_blank";
    pump.rel = "noopener noreferrer";
    const links = el("ul", "links");
    const item = el("li");
    item.append(pump);
    links.append(item);
    card.append(row, el("div", undefined), links);
  } else {
    row.append(el("span", "contract__pending", "Nog niet gelanceerd."));
    card.append(row);
  }
  return card;
}

function renderLinks(config: TokenConfig): HTMLElement | null {
  const entries: [string, string][] = [
    ["X", config.links.x],
    ["Telegram", config.links.telegram],
    ["Website", config.links.website],
  ];
  const visible = entries.filter(([, url]) => url.length > 0);
  if (visible.length === 0) return null;

  const card = el("section", "card");
  card.append(el("h2", undefined, "Links"));
  const list = el("ul", "links");
  for (const [label, url] of visible) {
    const item = el("li");
    const anchor = el("a", undefined, label);
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    item.append(anchor);
    list.append(item);
  }
  card.append(list);
  return card;
}

function render(config: TokenConfig): void {
  document.title = `${config.name} ($${config.symbol})`;
  const app = document.getElementById("app");
  if (!app) throw new Error("Element #app ontbreekt in index.html.");
  app.replaceChildren();

  app.append(renderHero(config), renderContract(config));
  const links = renderLinks(config);
  if (links) app.append(links);
  app.append(el("p", "footer", "Placeholder-pagina. Design en teksten volgen in fase 2."));
}

render(tokenConfig);
