import "./style.css";
import { tokenConfig, type TokenConfig } from "../../token.config";
import { content } from "./content";

/**
 * Landingspagina van $MONDAY. Tokengegevens komen uit token.config.ts, de
 * teksten uit content.ts. Configwaarden gaan alleen via textContent in de DOM.
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

function link(href: string, label: string, className: string): HTMLAnchorElement {
  const anchor = el("a", className, label);
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  return anchor;
}

function pumpUrl(config: TokenConfig): string {
  return `https://pump.fun/coin/${config.contractAddress}`;
}

function socialLinks(config: TokenConfig): [string, string][] {
  const entries: [string, string][] = [
    ["X", config.links.x],
    ["Telegram", config.links.telegram],
    ["Website", config.links.website],
  ];
  return entries.filter(([, url]) => url.length > 0);
}

// --- Hero ------------------------------------------------------------------

function renderHero(config: TokenConfig): HTMLElement {
  const hero = el("section", "hero");

  const logo = el("img", "hero__logo");
  logo.src = `${import.meta.env.BASE_URL}${config.logoPath.split("/").pop() ?? "logo.png"}`;
  logo.alt = `${config.name} logo`;
  logo.width = 180;
  logo.height = 180;

  hero.append(
    logo,
    el("h1", "hero__name", config.name),
    el("p", "hero__ticker", `$${config.symbol}`),
    el("p", "hero__tagline", content.tagline),
    el("p", "hero__grr", content.grr),
    renderContract(config),
  );

  const actions = el("div", "hero__actions");
  if (config.contractAddress) {
    actions.append(link(pumpUrl(config), content.cta.buy, "button button--primary"));
  }
  for (const [label, url] of socialLinks(config)) {
    actions.append(link(url, label, "button button--ghost"));
  }
  if (actions.childElementCount > 0) hero.append(actions);
  return hero;
}

function renderContract(config: TokenConfig): HTMLElement {
  const box = el("div", "contract");
  box.append(el("p", "contract__label", "Contract address"));

  if (!config.contractAddress) {
    box.append(el("p", "contract__pending", content.cta.launchingSoon));
    return box;
  }

  const row = el("div", "contract__row");
  const address = el("code", "contract__address", config.contractAddress);
  const copy = el("button", "button button--secondary", content.cta.copy);
  copy.type = "button";
  copy.addEventListener("click", () => {
    navigator.clipboard
      .writeText(config.contractAddress)
      .then(() => {
        copy.textContent = content.cta.copied;
        window.setTimeout(() => (copy.textContent = content.cta.copy), 1500);
      })
      .catch(() => {
        copy.textContent = content.cta.copyFailed;
      });
  });
  row.append(address, copy);
  box.append(row);
  return box;
}

// --- Countdown to Monday ---------------------------------------------------

function nextMondayStart(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const daysUntil = (8 - start.getDay()) % 7 || 7; // 1..7 dagen tot de volgende maandag
  start.setDate(start.getDate() + daysUntil);
  return start;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function renderCountdown(): HTMLElement {
  const section = el("section", "countdown");
  const inner = el("div", "countdown__inner");
  const heading = el("p", "countdown__heading");
  const time = el("p", "countdown__time");
  const sub = el("p", "countdown__sub");
  inner.append(heading, time, sub);
  section.append(inner);

  const tick = (): void => {
    const now = new Date();
    const isMonday = now.getDay() === 1;
    const remaining = nextMondayStart(now).getTime() - now.getTime();
    heading.textContent = isMonday ? content.countdown.itIsMonday : content.countdown.heading;
    time.textContent = formatRemaining(remaining);
    sub.textContent = isMonday ? content.countdown.nextOne : "";
    sub.hidden = !isMonday;
  };
  tick();
  window.setInterval(tick, 1000);
  return section;
}

// --- Sections --------------------------------------------------------------

function renderCards(
  heading: string,
  items: readonly { title: string; text: string }[],
  numbered: boolean,
): HTMLElement {
  const section = el("section", "section");
  section.append(el("h2", "section__heading", heading));
  const grid = el("div", "cards");
  items.forEach((item, index) => {
    const card = el("article", "card");
    if (numbered) card.append(el("span", "card__step", String(index + 1)));
    card.append(el("h3", "card__title", item.title), el("p", "card__text", item.text));
    grid.append(card);
  });
  section.append(grid);
  return section;
}

function renderTokenomics(config: TokenConfig): HTMLElement {
  const section = el("section", "section");
  section.append(el("h2", "section__heading", content.tokenomics.heading));
  const table = el("table", "table");
  const body = el("tbody");
  const rows: { label: string; value: string }[] = [
    ...content.tokenomics.rows,
    {
      label: content.tokenomics.devBuyLabel,
      value: config.devBuySol > 0 ? `${config.devBuySol} SOL` : content.tokenomics.devBuyNone,
    },
  ];
  for (const row of rows) {
    const tr = el("tr");
    const th = el("th", undefined, row.label);
    th.scope = "row";
    tr.append(th, el("td", undefined, row.value));
    body.append(tr);
  }
  table.append(body);
  section.append(table);
  return section;
}

function renderFooter(config: TokenConfig): HTMLElement {
  const footer = el("footer", "footer");
  const socials = socialLinks(config);
  if (socials.length > 0) {
    const list = el("ul", "links");
    for (const [label, url] of socials) {
      const item = el("li");
      item.append(link(url, label, "button button--ghost"));
      list.append(item);
    }
    footer.append(list);
  }
  footer.append(
    el("p", "footer__disclaimer", content.disclaimer),
    el("p", "footer__made", content.madeWith),
  );
  return footer;
}

// --- Page ------------------------------------------------------------------

function render(config: TokenConfig): void {
  document.title = `${config.name} ($${config.symbol})`;
  const app = document.getElementById("app");
  if (!app) throw new Error("Element #app is missing in index.html.");
  app.replaceChildren(
    renderHero(config),
    renderCountdown(),
    renderCards(content.about.heading, content.about.cards, false),
    renderCards(content.howToBuy.heading, content.howToBuy.steps, true),
    renderTokenomics(config),
    renderFooter(config),
  );
}

render(tokenConfig);
