/**
 * token.config.ts — de ENIGE plek waar de tokengegevens staan.
 *
 * Dit bestand wordt gebruikt door:
 *   - de scripts (`metadata:upload`, `launch`) in Node;
 *   - de landingspagina in `web/` in de browser.
 * Houd het daarom puur data: geen Node-imports, geen geheimen.
 *
 * Fase 2: vervang alle PLACEHOLDER-waarden. Zolang er ergens "PLACEHOLDER" in
 * staat, weigert `launch` om op mainnet te versturen.
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
  name: "PLACEHOLDER Coin",
  symbol: "PLHDR",
  description:
    "PLACEHOLDER: korte, pakkende beschrijving van de memecoin. Vervang deze tekst in fase 2.",
  links: {
    x: "https://x.com/PLACEHOLDER",
    telegram: "https://t.me/PLACEHOLDER",
    website: "https://PLACEHOLDER.example",
  },
  logoPath: "assets/logo.png",
  devBuySol: 0,
  metadataUri: "",
  contractAddress: "",
};

export default tokenConfig;
