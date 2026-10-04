/**
 * token.config.ts — de ENIGE plek waar de tokengegevens staan.
 *
 * Dit bestand wordt gebruikt door:
 *   - de scripts (`metadata:upload`, `launch`) in Node;
 *   - de landingspagina in `web/` in de browser.
 * Houd het daarom puur data: geen Node-imports, geen geheimen.
 *
 * Zolang er ergens "PLACEHOLDER" in staat, weigert `launch` om op mainnet te
 * versturen. Het concept achter deze invulling staat in docs/concept-monday.md.
 */

export interface TokenLinks {
  /** Link naar het X-/Twitter-account, of een lege string. */
  x: string;
  /** Link naar de Telegram-groep of -kanaal, of een lege string. */
  telegram: string;
  /** Link naar de website, of een lege string. */
  website: string;
}

export interface TokenConfig {
  /** Naam van de token. pump.fun staat maximaal 32 tekens toe. */
  name: string;
  /** Ticker/symbool. pump.fun staat maximaal 13 tekens toe. */
  symbol: string;
  /** Beschrijving die op pump.fun en de website verschijnt. */
  description: string;
  /** Sociale links. Lege strings worden overgeslagen. */
  links: TokenLinks;
  /** Pad naar het logo, relatief aan de projectmap. PNG, JPG, GIF of WEBP. */
  logoPath: string;
  /**
   * Optionele "dev buy": hoeveel SOL de launch-wallet direct bij het aanmaken
   * koopt, in dezelfde transactie. 0 = geen dev buy (standaard).
   */
  devBuySol: number;
  /**
   * Optioneel: een al bestaande metadata-URI (bijv. zelf gepind op IPFS).
   * Als dit leeg is, gebruikt `launch` het resultaat van `npm run metadata:upload`.
   */
  metadataUri: string;
  /**
   * Het contractadres (mint) van de token. Leeg tot na de launch; daarna hier
   * invullen zodat de website het toont.
   */
  contractAddress: string;
}

export const tokenConfig: TokenConfig = {
  name: "Monday",
  symbol: "MONDAY",
  description:
    "The coin for everyone who hates Mondays. Grr. Fair launch on pump.fun, no presale, no team tokens. Every Monday is a catalyst. #GrrMondays",
  links: {
    // Invullen zodra het account bestaat; metadata:upload controleert of de link leeft.
    x: "",
    // Invullen zodra de groep bestaat, bijv. "https://t.me/mondaycoinsol".
    telegram: "",
    // GitHub Pages van deze repo; wordt live zodra Pages aanstaat en main gedeployd is.
    website: "https://tobesnumb.github.io/memecoin-test/",
  },
  logoPath: "assets/logo.png",
  devBuySol: 0.1,
  metadataUri: "",
  contractAddress: "",
};

export default tokenConfig;
