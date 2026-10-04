# pump.fun: hoe maak je programmatisch een token aan? (onderzoek, 3 oktober 2026)

Dit document legt vast **welke officiële bronnen** we gebruiken om een token op
pump.fun te maken, wat we daarin hebben geverifieerd, en waar nog onzekerheid
zit. Niets hieronder is gegokt: elke program-ID en elk endpoint is herleidbaar
naar een bron in de lijst onderaan.

## Samenvatting

| Onderdeel                       | Keuze                                                                                    | Status              |
| ------------------------------- | ---------------------------------------------------------------------------------------- | ------------------- |
| On-chain token aanmaken         | Officiële SDK `@pump-fun/pump-sdk` v2.0.0, instructie `create_v2`                        | Geverifieerd        |
| Program-ID Pump (bonding curve) | `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` (mainnet **en** devnet)                    | Geverifieerd        |
| Metadata + logo naar IPFS       | `POST https://pump.fun/api/ipfs` (gebruikt door de pump.fun-webapp, niet gedocumenteerd) | De-facto standaard  |
| Alternatief voor IPFS           | Eigen metadata-URI (zelfde JSON-formaat) via `--uri` / config                            | Gepland             |
| Devnet                          | Programma staat op devnet; de pump.fun-website toont devnet-tokens niet                  | Geverifieerd (docs) |

## 1. De officiële SDK: `@pump-fun/pump-sdk`

- npm-pakket: `@pump-fun/pump-sdk`, laatste versie **2.0.0** (gepubliceerd
  2026-09-13), author `pump-fun`, maintainers van Baton Corporation (het bedrijf
  achter pump.fun). De README opent met "Official Pump program SDK".
- De officiële documentatie-repo `pump-fun/pump-public-docs` verwijst in haar
  README expliciet naar deze SDK als de TypeScript-SDK (en naar
  `pump-rust-client` voor Rust).
- Het pakket bevat de **IDL's** van de drie programma's (`src/idl/pump.json`,
  `pump_amm.json`, `pump_fees.json`) plus de volledige TypeScript-bron. De
  program-ID's hieronder zijn direct uit die IDL's en uit `src/sdk.ts` gelezen.

### Program-ID's (uit de IDL's in de SDK, bevestigd door pump-public-docs)

| Programma                                     | Program-ID                                    |
| --------------------------------------------- | --------------------------------------------- |
| Pump (bonding curve)                          | `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` |
| PumpSwap AMM                                  | `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA` |
| Pump Fees                                     | `pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ` |
| Mayhem (door `create_v2` vereist als account) | `MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e` |

Wij hardcoden deze adressen **niet** in onze eigen code: we importeren
`PUMP_PROGRAM_ID` enz. uit de SDK, zodat een SDK-update ze meeneemt.

### Welke instructie: `create_v2`

- `PumpSdk.createInstruction` (de oude `create`) is in de SDK gemarkeerd als
  `@deprecated Use createV2Instruction instead`.
- `create_v2` maakt een **Token-2022**-mint met 6 decimalen en gebruikt de
  argumenten `name`, `symbol`, `uri`, `creator`, `is_mayhem_mode`,
  `is_cashback_enabled` (deprecated, moet `false`), `creator_fee_bps`
  (optioneel) en `is_holder_reward` (optioneel).
- Limieten uit `docs/instructions/COIN_CREATION.md` van pump-public-docs:
  **naam max 32 tekens, ticker max 13 tekens, URI max 200 tekens.**
- Voor een gewone launch zetten wij `mayhemMode: false`, geen cashback, geen
  holder-reward, geen eigen creator fee, quote in SOL (standaard).
- "Dev buy" (eerste aankoop in dezelfde transactie): de SDK biedt
  `createV2AndBuyInstructions({ global, mint, name, symbol, uri, creator, user,
solAmount, amount, mayhemMode })`. Het `amount` berekenen we met
  `getBuyTokenAmountFromSolAmount({ global, feeConfig, mintSupply: null,
bondingCurve: null, amount, quoteMint: NATIVE_MINT })`; `global` en
  `feeConfig` komen via `OnlinePumpSdk.fetchGlobal()` / `fetchFeeConfig()`.
- Een losse `create_v2` kan **volledig offline** gebouwd worden
  (`PUMP_SDK.createV2Instruction(...)`, geen RPC nodig). Dat hebben we
  getest: de instructie heeft 16 accounts, 107 bytes data en wijst naar
  `6EF8…F6P`. Daardoor kan de dry-run altijd een overzicht tonen, ook zonder
  netwerk.

### Let op: ESM-build van een afhankelijkheid is kapot

`@pump-fun/pump-sdk@2.0.0` hangt af van `@pump-fun/agent-payments-sdk@1.0.7`.
De ESM-build daarvan doet `import { BN } from "@coral-xyz/anchor"` terwijl
Anchor een CommonJS-pakket is; Node 22 weigert dat ("Named export 'BN' not
found"). De **CommonJS-entry werkt wel**. Daarom draaien onze Node-scripts in
CommonJS-modus (`"type": "commonjs"` + `tsx`). De landingspagina in `web/` is
een los Vite-project en heeft hier geen last van.

## 2. Metadata en logo naar IPFS

pump.fun verwacht in `uri` een JSON-bestand met minimaal `name`, `symbol`,
`description` en `image`. De pump.fun-webapp zelf (en alle bekende SDK's)
uploaden logo + metadata via:

```
POST https://pump.fun/api/ipfs      (multipart/form-data)
  file         = het logo (png/jpg/gif/webp)
  name         = naam
  symbol       = ticker
  description  = beschrijving
  twitter      = (optioneel) X-link
  telegram     = (optioneel) Telegram-link
  website      = (optioneel) website
  showName     = "true"

Antwoord (JSON):
  { "metadataUri": "https://ipfs.io/ipfs/<cid>",
    "metadata": { "name", "symbol", "description", "image", "showName",
                  "createdOn": "https://pump.fun", "twitter", "telegram", "website" } }
```

**Status van dit endpoint:** het staat **niet** in pump-public-docs en pump.fun
publiceert er geen documentatie over. Het is wel het endpoint dat de webapp
gebruikt en dat o.a. `rckprtr/pumpdotfun-sdk` (`src/pumpfun.ts`,
`createTokenMetadata`) en PumpPortal's documentatie beschrijven. Het kan dus
zonder aankondiging veranderen. Daarom:

- `metadata:upload` gebruikt dit endpoint, maar controleert het antwoord
  strikt (er moet een `metadataUri` terugkomen) en slaat het resultaat lokaal
  op.
- Als het endpoint ooit wegvalt, kun je de JSON in hetzelfde formaat zelf
  pinnen (bijv. Pinata of NFT.Storage) en de URI via `token.config.ts`
  (`metadataUri`) of `--uri` meegeven aan `launch`. De JSON-structuur staat in
  `src/lib/metadata.ts` zodat je die 1-op-1 kunt hergebruiken.

## 3. Devnet

- `PUMP_PROGRAM_README.md` (pump-public-docs): "The Pump program is deployed
  at address `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` on both Mainnet and
  Devnet." De SDK-README gebruikt zelf `https://api.devnet.solana.com` in haar
  voorbeelden en heeft een `devnet`-releasebranch.
- Dus: op devnet kun je de echte `create_v2`-transactie uitvoeren en
  controleren dat alles klopt. **De pump.fun-website toont devnet-tokens
  niet**, en pump.fun biedt geen devnet-API (PumpPortal FAQ zegt hetzelfde).
  Devnet is dus een technische test, geen visuele.
- Omdat `Global`/fee-config accounts op devnet kunnen achterlopen op mainnet,
  behandelt `launch` een mislukte simulatie op devnet als informatief en op
  mainnet als blokkerend.

## 4. Beperking van de ontwikkelomgeving waarin dit is gebouwd

De cloud-sandbox waarin fase 1 is gebouwd heeft **geen** netwerktoegang tot
Solana-RPC's (`api.devnet.solana.com`, `api.mainnet-beta.solana.com`) en niet
tot `pump.fun`. Geverifieerd is daarom: installatie van de SDK, offline bouwen
van de `create_v2`-transactie, typecheck, lint en de dry-run-overzichten.
**Niet** in de sandbox geverifieerd (wel door jou lokaal te doen, zie README):
de RPC-simulatie, `wallet:balance` en de echte IPFS-upload.

## Bronnen

Officieel (pump.fun / Baton):

1. npm: `@pump-fun/pump-sdk` — https://www.npmjs.com/package/@pump-fun/pump-sdk
   (versie 2.0.0, 2026-09-13; README in het pakket: "Official Pump program SDK";
   bevat `src/idl/pump.json`, `pump_amm.json`, `pump_fees.json`).
2. GitHub `pump-fun/pump-public-docs` — https://github.com/pump-fun/pump-public-docs
   - README (verwijst naar `@pump-fun/pump-sdk` als TypeScript-SDK)
   - `docs/PUMP_PROGRAM_README.md` (program-ID, "on both Mainnet and Devnet",
     `create`-instructie, bonding-curve parameters)
   - `docs/instructions/COIN_CREATION.md` (`create_v2`, argumenten, limieten
     32/13/200, Token-2022 met 6 decimalen)
   - `idl/` (IDL's; identiek aan die in het npm-pakket)
3. npm: `@pump-fun/pump-swap-sdk` — https://www.npmjs.com/package/@pump-fun/pump-swap-sdk
   (zelfde maintainers; homepage `https://docs.pump.fun`, vanuit de sandbox niet
   bereikbaar).

Community (alleen gebruikt voor het ongedocumenteerde IPFS-endpoint):

4. `rckprtr/pumpdotfun-sdk`, `src/pumpfun.ts` (`createTokenMetadata`) en
   `src/types.ts` (`CreateTokenMetadata`, `TokenMetadata`) —
   https://github.com/rckprtr/pumpdotfun-sdk
5. PumpPortal FAQ — https://pumpportal.fun/FAQ/ (geen devnet-API; beschrijft
   dezelfde IPFS-upload). Vanuit de sandbox niet bereikbaar; via zoekresultaat
   geraadpleegd.

Niet gebruikt: `pumpdotfun-sdk` op npm (laatste release maart 2025, kent
`create_v2` niet) en andere community-SDK's. Geen enkele bron is een
pump.fun-API-endpoint voor handel of sniping; dat is buiten scope.
