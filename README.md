# Memecoin-launch op pump.fun (fase 1: basis)

Dit project is het sjabloon om een memecoin op [pump.fun](https://pump.fun) (Solana) te
lanceren. Fase 1 bevat alleen de basis: configuratie, wallet-scripts, de metadata-upload,
een `launch`-script dat **standaard als dry-run** draait, en een placeholder-landingspagina.
De echte naam, het logo, de teksten en de lancering zelf komen in fase 2.

Hoe de pump.fun-integratie in elkaar zit en welke bronnen we gebruiken staat in
[`docs/pumpfun.md`](docs/pumpfun.md).

## Inhoud

1. [Vereisten](#1-vereisten)
2. [Installatie](#2-installatie)
3. [Configuratie](#3-configuratie)
4. [Wallet aanmaken en vullen](#4-wallet-aanmaken-en-vullen)
5. [Metadata en logo uploaden](#5-metadata-en-logo-uploaden)
6. [Dry-run](#6-dry-run)
7. [Testen op devnet](#7-testen-op-devnet)
8. [Lanceren op mainnet](#8-lanceren-op-mainnet)
9. [Landingspagina](#9-landingspagina)
10. [Veiligheid](#10-veiligheid)
11. [Problemen oplossen](#11-problemen-oplossen)
12. [Projectstructuur](#12-projectstructuur)
13. [Wat er in fase 2 moet gebeuren](#13-wat-er-in-fase-2-moet-gebeuren)

## 1. Vereisten

- Node.js **22.12 of nieuwer** en npm 10 (`node --version`).
- Een terminal. De scripts stellen bij het echte versturen een ja/nee-vraag en werken
  daarom niet in een niet-interactieve omgeving.
- Voor devnet-tests: gratis devnet-SOL (zie stap 4).
- Voor mainnet: echte SOL op de launch-wallet en bij voorkeur een eigen RPC-provider
  (Helius, QuickNode, Triton of vergelijkbaar). De publieke mainnet-RPC is traag en beperkt.

Het project gebruikt de officiële `@pump-fun/pump-sdk`. De scripts draaien in
CommonJS-modus omdat de ESM-build van een afhankelijkheid van die SDK kapot is; dat
merk je als gebruiker niet, maar het verklaart `"type": "commonjs"` in `package.json`.

## 2. Installatie

```bash
git clone <repo-url>
cd memecoin-test
npm install
cp .env.example .env
```

Controleer daarna dat alles werkt:

```bash
npm run typecheck
npm run lint
npm run launch          # dry-run met de placeholder-config, verstuurt niets
```

## 3. Configuratie

### `.env` (geheim, staat in `.gitignore`)

| Variabele                     | Betekenis                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `NETWORK`                     | `devnet` of `mainnet`. De flag `--network` van `launch` moet hiermee overeenkomen.            |
| `RPC_URL`                     | RPC-endpoint van dat netwerk.                                                                 |
| `KEYPAIR_PATH`                | Pad naar het keypair-bestand van de launch-wallet. Standaard `./keys/wallet.json`.            |
| `PRIORITY_FEE_MICRO_LAMPORTS` | Optioneel. Priority fee per compute unit; helpt op mainnet om sneller te landen. Standaard 0. |

### `token.config.ts` (de enige plek met tokengegevens)

| Veld              | Betekenis                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `name`            | Naam, maximaal 32 tekens (limiet van pump.fun).                                                |
| `symbol`          | Ticker, maximaal 13 tekens, zonder spaties.                                                    |
| `description`     | Beschrijving voor pump.fun en de website.                                                      |
| `links`           | `x`, `telegram`, `website`. Lege string = niet tonen.                                          |
| `logoPath`        | Pad naar het logo, relatief aan de projectmap. PNG, JPG, GIF of WEBP.                          |
| `devBuySol`       | Optionele eerste aankoop door de launch-wallet, in SOL, in dezelfde transactie. Standaard `0`. |
| `metadataUri`     | Optioneel: een al bestaande metadata-URI. Leeg = gebruik het resultaat van `metadata:upload`.  |
| `contractAddress` | Leeg tot na de launch. Daarna invullen zodat de website het toont.                             |

Zolang er ergens `PLACEHOLDER` in de tekstvelden staat, weigert `launch` om op mainnet te
versturen. Dry-runs en devnet werken wel.

### `assets/logo.png`

Vervang het placeholder-logo door het echte logo (vierkant, minimaal 512×512 is gebruikelijk)
of pas `logoPath` aan.

## 4. Wallet aanmaken en vullen

```bash
npm run wallet:create
```

Dit schrijft een nieuw keypair naar `KEYPAIR_PATH` (standaard `keys/wallet.json`), met
bestandsrechten 600, en toont alleen het publieke adres. Het script overschrijft nooit een
bestaand bestand. **Maak een back-up van dit bestand buiten git en deel het nooit.**

Je kunt ook een bestaande wallet gebruiken: zet het keypair-bestand van de Solana-CLI
(JSON-array) of een base58-geheime sleutel (zoals Phantom exporteert) op `KEYPAIR_PATH`.

Saldo controleren:

```bash
npm run wallet:balance
```

Devnet-SOL krijg je via <https://faucet.solana.com> of, met de Solana-CLI,
`solana airdrop 2 <adres> --url devnet`. Op mainnet stuur je zelf SOL naar het adres.

## 5. Metadata en logo uploaden

pump.fun verwacht een metadata-URI die naar een JSON-bestand wijst met naam, ticker,
beschrijving, logo en links. De webapp van pump.fun zet dat zelf op IPFS via
`https://pump.fun/api/ipfs`; dit script doet precies hetzelfde.

```bash
npm run metadata:upload -- --dry-run   # toont wat er geüpload zou worden
npm run metadata:upload                # uploadt echt en bewaart de URI
```

Het resultaat komt in `.launch/metadata.json` (staat in `.gitignore`). `launch` gebruikt dat
bestand automatisch en waarschuwt als de naam of ticker inmiddels is veranderd.

Dit endpoint is niet officieel gedocumenteerd. Werkt het niet, pin dan zelf een JSON in
hetzelfde formaat (het formaat staat in `src/lib/metadata.ts`, type `PumpMetadata`) en vul de
URI in bij `metadataUri` in `token.config.ts`, of geef hem mee met `--uri`.

## 6. Dry-run

```bash
npm run launch
```

Zonder flags doet `launch` nooit iets onomkeerbaars. Het script:

1. valideert `token.config.ts` tegen de limieten van pump.fun;
2. zoekt de metadata-URI (`--uri`, dan `token.config.ts`, dan `.launch/metadata.json`);
3. laadt de wallet, of gebruikt een tijdelijk adres als er nog geen is;
4. bouwt de `create_v2`-transactie (plus de dev buy als `devBuySol > 0`);
5. toont een overzicht: netwerk, RPC, wallet, het nieuwe contractadres, tokengegevens,
   dev buy en het aantal instructies;
6. simuleert de transactie via de RPC en toont de verbruikte compute units en de **exacte
   kosten** (fees, rent en eventuele dev buy) zoals de wallet die zou betalen.

Is de RPC niet bereikbaar, dan wordt de simulatie overgeslagen en zie je alleen het
overzicht. Het contractadres in een dry-run is een voorbeeld: bij elke run wordt een nieuwe
mint gegenereerd.

## 7. Testen op devnet

Het pump.fun-programma staat ook op devnet, dus de echte transactie is daar te testen. Let op:
**de website van pump.fun toont devnet-tokens niet** en pump.fun heeft geen devnet-API. Je
controleert het resultaat dus via de Solana Explorer, niet via pump.fun. Het is een
technische test, geen visuele.

```bash
# .env: NETWORK=devnet, RPC_URL=https://api.devnet.solana.com
npm run wallet:balance                          # genoeg devnet-SOL?
npm run metadata:upload                         # of gebruik --uri
npm run launch                                  # dry-run, simulatie moet slagen
npm run launch -- --network devnet --confirm    # verstuurt na een ja/nee-vraag
```

Het script toont daarna de signature, het contractadres en explorer-links, en bewaart alles
in `.launch/launch-devnet-<tijd>.json`.

Mislukt de simulatie op devnet terwijl de code klopt, dan kan dat komen doordat de
on-chain configuratie van pump.fun op devnet achterloopt op mainnet. Zie
[Problemen oplossen](#11-problemen-oplossen).

## 8. Lanceren op mainnet

Alleen als alles op devnet werkte en `token.config.ts` definitief is.

1. Zet in `.env`: `NETWORK=mainnet` en een mainnet-`RPC_URL` (liefst een eigen provider).
2. Zorg dat er genoeg SOL op de launch-wallet staat: de kosten uit de dry-run plus de dev buy
   plus een kleine marge.
3. Upload de definitieve metadata: `npm run metadata:upload`.
4. Dry-run: `npm run launch`. Controleer het overzicht en de kosten.
5. Verstuur:

```bash
npm run launch -- --network mainnet --confirm
```

Het script simuleert opnieuw, controleert het saldo, waarschuwt dat dit echt geld is en vraagt
om bevestiging. Alleen het letterlijke antwoord `ja` verstuurt; elk ander antwoord annuleert.
Na bevestiging zie je de signature, het contractadres en de link `https://pump.fun/coin/<adres>`.

Zet daarna `contractAddress` in `token.config.ts` op het contractadres en bouw de website
opnieuw.

## 9. Landingspagina

```bash
npm run web:dev       # ontwikkelserver, meestal op http://localhost:5173
npm run web:build     # statische build in web/dist
npm run web:preview   # bekijk de build lokaal
```

De pagina leest naam, ticker, beschrijving, links en het contractadres rechtstreeks uit
`token.config.ts` en serveert `assets/` als publieke map (`/logo.png`). Zolang
`contractAddress` leeg is, staat er "Nog niet gelanceerd". De styling is bewust neutraal; het
design komt in fase 2. `web/dist` kun je op elke statische host zetten (Netlify, Vercel,
GitHub Pages, Cloudflare Pages).

## 10. Veiligheid

- `.env`, `keys/`, `*.json`-keypairs en `.launch/` staan in `.gitignore`. Controleer met
  `git status` voordat je commit dat er geen geheimen bij zitten.
- De geheime sleutel wordt nooit gelogd. Het keypair-bestand krijgt rechten 600.
- `launch` is standaard een dry-run. Versturen vereist `--network <devnet|mainnet>` **en**
  `--confirm` **en** een letterlijk `ja` in de terminal. `--dry-run` wint altijd van `--confirm`.
- Het netwerk in de flag moet overeenkomen met `NETWORK` in `.env`, anders stopt het script.
- Op mainnet wordt geweigerd zolang de config `PLACEHOLDER`-tekst bevat, de simulatie niet
  slaagt of het saldo te laag is.
- Gebruik voor de launch een aparte wallet met alleen het benodigde bedrag, niet je hoofdwallet.
- Buiten scope en bewust niet aanwezig: sniper-, bundle- en auto-tradefuncties.

## 11. Problemen oplossen

| Melding of situatie                               | Oorzaak en oplossing                                                                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RPC ... is niet bereikbaar`                      | Controleer `RPC_URL` en je netwerk. Publieke RPC's weigeren soms; gebruik een eigen provider.                                                                                               |
| `--network X komt niet overeen met NETWORK=Y`     | Bewuste beveiliging. Zet `NETWORK` én `RPC_URL` in `.env` op het netwerk dat je bedoelt.                                                                                                    |
| `pump.fun antwoordde met HTTP 403/5xx` bij upload | Het endpoint is ongedocumenteerd en kan blokkeren. Probeer later opnieuw of pin de JSON zelf en gebruik `metadataUri`.                                                                      |
| `Keypair niet gevonden`                           | Draai `npm run wallet:create` of corrigeer `KEYPAIR_PATH`.                                                                                                                                  |
| Simulatie mislukt met een programma-fout          | Lees de laatste logs die het script toont. Op devnet kan de pump.fun-configuratie achterlopen; test dan met een kleinere dev buy of zonder. Op mainnet: niet versturen tot dit opgelost is. |
| `Saldo ... is lager dan de benodigde ...`         | Stort meer SOL op de launch-wallet.                                                                                                                                                         |
| Dev buy in dry-run niet zichtbaar                 | Een dev buy heeft de RPC nodig voor de bonding-curve-parameters; zonder RPC toont de dry-run alleen de create.                                                                              |

## 12. Projectstructuur

```
token.config.ts            alle tokengegevens (placeholders)
assets/logo.png            placeholder-logo
src/config/env.ts          leest en valideert .env
src/lib/cli.ts             flags, ja/nee-vraag, logging
src/lib/wallet.ts          keypair aanmaken/laden, saldo
src/lib/metadata.ts        validatie, metadata-formaat, IPFS-upload
src/lib/launch.ts          create_v2 (+ dev buy) bouwen, simuleren, versturen
src/scripts/*.ts           wallet-create, wallet-balance, metadata-upload, launch
web/                       Vite-landingspagina (eigen package.json, npm-workspace)
docs/pumpfun.md            onderzoek en bronnen van de pump.fun-integratie
.env.example               voorbeeld van de omgevingsvariabelen
```

Handige scripts: `npm run typecheck`, `npm run lint`, `npm run lint:fix`, `npm run format`,
`npm run format:check`.

## 13. Wat er in fase 2 moet gebeuren

- [ ] `token.config.ts`: echte `name`, `symbol`, `description` en `links` invullen.
- [ ] `assets/logo.png` vervangen door het echte logo (of `logoPath` aanpassen).
- [ ] Beslissen over `devBuySol` (standaard 0).
- [ ] Landingspagina: design, teksten en eventueel extra secties in `web/`.
- [ ] Launch-wallet aanmaken, back-uppen en vullen; eigen mainnet-RPC kiezen.
- [ ] Volledige doorloop op devnet, daarna de dry-run en de lancering op mainnet.
- [ ] Na de launch: `contractAddress` invullen en de website publiceren.
