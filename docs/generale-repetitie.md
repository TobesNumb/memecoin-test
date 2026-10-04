# Generale repetitie op mainnet met een wegwerpwallet

Doel: de hele flow één keer écht doorlopen, van wallet tot website, met een overduidelijke
testcoin en een budget van ongeveer 20 dollar. Na afloop weet je precies wat de echte launch
in fase 2 kost, hoe lang alles duurt en waar het schuurt.

Lees eerst de [README](../README.md). Dit draaiboek vult die aan voor één specifiek scenario.

## Budget

Bij een SOL-koers van ongeveer 120 dollar (4 oktober 2026) is 20 dollar ongeveer 0,16 SOL.
De bedragen hieronder zijn richtwaarden; de dry-run toont het exacte bedrag voor jouw run.

| Post                                             | SOL (richtwaarde) | Toelichting                                                  |
| ------------------------------------------------ | ----------------- | ------------------------------------------------------------ |
| Storting op de wegwerpwallet                     | 0,16              | ongeveer 20 dollar                                           |
| Aanmaken van de coin (rent voor accounts, fees)  | 0,02 tot 0,03     | de simulatie in de dry-run toont het exacte bedrag           |
| Dev buy, om ook het create-and-buy-pad te testen | 0,02              | ongeveer 2,40 dollar; `devBuySol` in `token.config.ts`       |
| Priority fee                                     | minder dan 0,0001 | `PRIORITY_FEE_MICRO_LAMPORTS=50000`                          |
| Uitgavenlimiet `MAX_SPEND_SOL`                   | 0,06              | harde rem: kost de simulatie meer, dan wordt niets verstuurd |
| Blijft over om terug te sturen                   | ongeveer 0,10     | plus wat je terugkrijgt als je de dev buy terugverkoopt      |

## Vooraf

1. Node 22.12 of nieuwer, de repo gecloned, `npm install` gedaan.
2. **Een nieuwe wegwerpwallet.** Aanrader: maak in Phantom (of een andere wallet-app) een
   nieuw account aan en exporteer de private key (base58). Plak die als enige inhoud in
   `keys/wallet.json`. De scripts lezen dat formaat. Voordeel: na de test kun je via de
   pump.fun-website met dezelfde wallet verkopen en opruimen. Alternatief:
   `npm run wallet:create` en later importeren in Phantom.
3. **Een mainnet-RPC.** Maak een gratis account bij Helius, QuickNode of Alchemy en gebruik
   die URL. De publieke RPC werkt soms, maar faalt vaak precies op het moment dat je verstuurt.
4. **Stort ongeveer 0,16 SOL** op de wegwerpwallet vanaf een exchange of je hoofdwallet. Let
   op: die overboeking is on-chain zichtbaar. "Wegwerp" betekent apart, niet anoniem.
5. Controleer `git status`: `.env` en `keys/` mogen nooit als te committen bestand verschijnen.

## Stap 1: `.env`

```
NETWORK=mainnet
RPC_URL=https://<jouw-mainnet-rpc>
KEYPAIR_PATH=./keys/wallet.json
PRIORITY_FEE_MICRO_LAMPORTS=50000
MAX_SPEND_SOL=0.06
```

## Stap 2: `token.config.ts` voor de test

Vervang alle `PLACEHOLDER`-tekst, anders weigert `launch` op mainnet. Gebruik een naam die
niemand voor een echt project aanziet en gebruik **niet** de naam of ticker die je straks echt
wilt gebruiken; die wil je vers houden.

```ts
name: "Generale Repetitie",
symbol: "REPTEST",
description:
  "Technische test van een launch-sjabloon. Geen project, geen roadmap, geen waarde. Niet kopen.",
links: { x: "", telegram: "", website: "" },
logoPath: "assets/logo.png",
devBuySol: 0.02,
metadataUri: "",
contractAddress: "",
```

Het placeholder-logo is prima voor de test. Wil je ook de links testen, gebruik dan echte
test-accounts van jezelf, geen verzonnen adressen.

## Stap 3: saldo

```bash
npm run wallet:balance
```

Verwacht ongeveer 0,16 SOL op het juiste adres, netwerk `mainnet`.

## Stap 4: metadata

```bash
npm run metadata:upload -- --dry-run
npm run metadata:upload
```

Open de getoonde `metadataUri` in je browser en controleer naam, ticker, beschrijving en
afbeelding. IPFS-gateways zijn soms traag; even wachten mag.

**Plan B** als de upload een HTTP 403 of 5xx geeft: zet dezelfde JSON (de dry-run toont het
formaat; vul `image` met een publieke https-URL naar je logo) op een publieke plek, bijvoorbeeld
een GitHub Gist, en gebruik de raw-URL met `--uri`. De URI moet korter zijn dan 200 tekens.

## Stap 5: dry-run

```bash
npm run launch
```

Controleer in het overzicht, in deze volgorde:

- Netwerk `mainnet` en de juiste RPC.
- Wallet is de wegwerpwallet, niet je hoofdwallet.
- Dev buy `0.02 SOL`, uitgavenlimiet `0.06 SOL`.
- Simulatie `geslaagd`, met de kosten uitgesplitst in dev buy en fees/rent.

Noteer de kosten. Mislukt de simulatie, dan niet verder: lees de programma-logs die het script
toont en probeer eventueel eerst met `devBuySol: 0`.

## Stap 6: versturen

```bash
npm run launch -- --network mainnet --confirm
```

Het script simuleert opnieuw, controleert de uitgavenlimiet en het saldo, waarschuwt dat dit
echt geld is en stelt de vraag. Typ letterlijk `ja`. Daarna zie je de signature, het
contractadres en explorer-links. Alles staat ook in `.launch/launch-mainnet-<tijd>.json`.

## Stap 7: controleren

- **Explorer**: transactie geslaagd, mint-adres bestaat, token-programma is Token-2022.
- **pump.fun**: `https://pump.fun/coin/<contractadres>` toont naam, ticker, logo, beschrijving
  en links. Dit kan een minuut duren.
- **Wallet**: de tokens van de dev buy zijn zichtbaar in Phantom.
- **Website**: vul `contractAddress` in `token.config.ts` in en draai `npm run web:dev`. Het
  adres, de kopieerknop en de pump.fun-link moeten verschijnen.
- **Noteer** wat je in fase 2 anders wilt: lengte van de beschrijving, kwaliteit van het logo
  op de pump.fun-pagina, volgorde van de links, hoe lang alles duurde.

## Stap 8: opruimen

1. Optioneel: verkoop de dev buy terug via de pump.fun-website met de wegwerpwallet. Dat kost
   ongeveer de handelsfee heen en terug. Dit sjabloon heeft bewust geen verkoopfunctie.
2. Heeft iemand anders toevallig gehandeld, dan kun je op pump.fun je creator fees claimen.
3. Stuur de resterende SOL terug naar je hoofdwallet.
4. Bewaar of verwijder `keys/wallet.json`, maar **hergebruik deze wallet niet** voor de echte
   launch. De testcoin blijft voor altijd aan dit adres hangen.
5. Zet `token.config.ts` terug naar de placeholders (`git checkout token.config.ts`) en
   verwijder `.launch/metadata.json`, zodat fase 2 schoon begint.

## Wat je in deze repetitie niet doet

- De echte toekomstige naam of ticker gebruiken.
- De link delen of reclame maken; anders kopen mensen een testcoin.
- Je hoofdwallet gebruiken, ook niet "even" als betaler.

## Als het misgaat

| Situatie                                          | Wat te doen                                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--network mainnet komt niet overeen met NETWORK` | Zet `NETWORK` en `RPC_URL` in `.env` allebei op mainnet.                                      |
| Simulatie mislukt met een foutcode `6xxx`         | Fout van het pump.fun-programma. Lees de logs, zie `docs/pumpfun.md`, probeer zonder dev buy. |
| `meer dan de uitgavenlimiet`                      | Bewuste rem. Verlaag `devBuySol` of verhoog `MAX_SPEND_SOL` als je de kosten begrijpt.        |
| Transactie verstuurd maar mislukt                 | Alleen de fee is weg, de coin bestaat niet. Probeer opnieuw met een hogere priority fee.      |
| `Blockhash not found` of `expired`                | De RPC was traag. Gewoon opnieuw proberen, liefst met een eigen RPC-provider.                 |
| Upload geeft 403 of 5xx                           | Plan B uit stap 4.                                                                            |
| Coin niet zichtbaar op pump.fun                   | Even wachten en de pagina verversen; controleer intussen in de explorer of de mint bestaat.   |
