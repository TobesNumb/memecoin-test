# Launch-kit $MONDAY

Alles wat nog tussen nu en de launch zit, in volgorde. De techniek is klaar; wat rest zijn
accounts, de website live zetten en de launch zelf, die lokaal gebeurt met jouw wallet.

**Stuur nooit een private key of seed phrase naar wie dan ook, ook niet naar een AI-sessie.**
De scripts hebben alleen een lokaal keypair-bestand nodig.

## 1. Accounts (eenmalig, door jou)

### X

- Handle, in volgorde van voorkeur: `@MondayCoinSol`, `@mondayonsol`, `@grrmondaycoin`.
- Weergavenaam: `Monday ($MONDAY)`
- Profielfoto: `assets/logo.png`
- Bio (past in 160 tekens):

  > The coin for everyone who hates Mondays. Grr. Fair launch on pump.fun. Every Monday is a catalyst. #GrrMondays

- Website in het profiel: `https://tobesnumb.github.io/memecoin-test/`
- Zet de X-URL daarna in `token.config.ts` bij `links.x`.

### Telegram

- Groep of kanaal `Monday ($MONDAY)`, handle bij voorkeur `t.me/mondaycoinsol`.
- Beschrijving: dezelfde tekst als de X-bio.
- Welkomstbericht vastpinnen (tekst in deel 5).
- Zet de Telegram-URL in `token.config.ts` bij `links.telegram`.

## 2. Website live (eenmalig, door jou)

1. GitHub: Settings, Pages, Build and deployment, Source: **GitHub Actions**. De workflow
   `deploy-web.yml` probeert dit ook zelf aan te zetten.
2. Merge de fase-2-branch naar `main`. Elke push naar `main` bouwt `web/` en publiceert
   `web/dist` naar `https://tobesnumb.github.io/memecoin-test/`.
3. Open de URL en plak hem in een Telegram-chat: er moet een voorvertoning met logo
   verschijnen. Dat komt van de social-metatags in `web/index.html`.
4. Eigen domein later (bijvoorbeeld `mondaycoin.fun`)? Stel het in bij Pages en zet de nieuwe
   URL in `links.website` **vóór** de metadata-upload.

## 3. Wat onherroepelijk is

De metadata-upload zet naam, ticker, beschrijving, logo en links vast. Daarna is niets meer
te wijzigen. Daarom controleert `npm run metadata:upload` eerst of elke ingevulde link
antwoordt en stopt het bij een dode link. Omzeilen kan alleen bewust met `--allow-dead-links`.

Checklist vóór de upload:

- [ ] Alle links in `token.config.ts` openen in een browser.
- [ ] Beschrijving en logo definitief.
- [ ] `npm run metadata:upload -- --dry-run` toont geen waarschuwingen.

## 4. Draaiboek voor de launchdag

Beste moment: zondagavond of maandagochtend (Europese tijd), vlak voor de wekelijkse piek van
#GrrMondays.

**T-24 uur**

- Accounts bestaan, website is live, links staan in `token.config.ts` en zijn gepusht.
- Generale repetitie gedaan volgens `docs/generale-repetitie.md`.
- Launch-wallet (een andere dan de repetitiewallet) gevuld: dev buy 0,1 SOL plus ongeveer
  0,05 SOL kosten plus marge. Stort 0,3 SOL.
- Posts uit deel 5 klaargezet; vijf mensen weten dat ze op het eerste uur posten.

**T-60 minuten**

```
# .env
NETWORK=mainnet
RPC_URL=https://<jouw-mainnet-rpc>
KEYPAIR_PATH=./keys/wallet.json
PRIORITY_FEE_MICRO_LAMPORTS=50000
MAX_SPEND_SOL=0.2
```

```bash
npm run wallet:balance                 # ongeveer 0,3 SOL op de launch-wallet
npm run metadata:upload                # linkcontrole, upload, bewaart de URI
npm run launch                         # dry-run: simulatie moet slagen, kosten controleren
```

**T-0**

```bash
npm run launch -- --network mainnet --confirm
```

Typ `ja`. Kopieer het contractadres uit de uitvoer; het staat ook in
`.launch/launch-mainnet-<tijd>.json`.

**T+2 minuten**

1. Launchpost op X (deel 5) met contractadres en pump.fun-link. Vastpinnen.
2. Welkomstbericht in Telegram bijwerken met het contractadres. Vastpinnen.
3. `contractAddress` in `token.config.ts` invullen, committen, pushen naar `main`. De website
   toont het adres met kopieerknop binnen een paar minuten.

**T+15 minuten tot T+24 uur**

- Post 2 (hoe koop je) na een kwartier, post 3 (meme-oproep) na een uur.
- Maandagochtend: post 4, de aftelklok staat op nul.
- Reageer op elke vraag. Verkoop nooit stil; kondig elke verkoop uit de dev buy vooraf aan.

## 5. Teksten (Engels, klaar om te plakken)

**Launchpost / vastgepind op X**

> $MONDAY is live. The coin for everyone who hates Mondays. Grr.
>
> CA: `<contractadres>`
> pump.fun: https://pump.fun/coin/<contractadres>
>
> Fair launch. No presale. No team tokens. Dev buy: 0.1 SOL, disclosed.
> #GrrMondays

**Post 2, hoe koop je**

> How to get $MONDAY in three steps:
>
> 1. Phantom wallet
> 2. Some SOL
> 3. pump.fun/coin/<contractadres>, connect, swap
>
> Every Monday is a catalyst.

**Post 3, meme-oproep**

> Post your Monday. Tag it #GrrMondays. Add $MONDAY.
> That's the whole joke.

**Post 4, maandagochtend**

> It's Monday. Grr.
> The countdown hit zero: https://tobesnumb.github.io/memecoin-test/
> $MONDAY #GrrMondays

**Welkomstbericht Telegram**

> Welcome to $MONDAY, the coin for everyone who hates Mondays.
>
> CA: `<contractadres>`
> Buy: https://pump.fun/coin/<contractadres>
> Site: https://tobesnumb.github.io/memecoin-test/
>
> Fair launch on pump.fun. No presale, no team tokens, dev buy 0.1 SOL (disclosed).
> Every Monday the community posts its Monday with #GrrMondays and $MONDAY.
> This is a meme coin: no utility, no promises, only spend what you can afford to lose.

**Antwoord op "wen moon" en soortgelijke vragen**

> No roadmap. Just Mondays.

## 6. Wat ik nog van je nodig heb

Geen sleutels. Wel:

1. De publieke URL's van X en Telegram zodra ze bestaan. Ik zet ze in `token.config.ts`,
   controleer de links en push.
2. Bevestiging dat Pages aanstaat en de website opent.
3. Je akkoord op de dev buy van 0,1 SOL, of een ander bedrag.

De launch zelf draai je lokaal met de commando's uit deel 4. Wil je begeleiding tijdens het
draaien, start dan Claude Code lokaal in de repo-map: jouw keypair blijft dan op je eigen
computer en de sessie kan de scripts voor je uitvoeren en de uitvoer meelezen.

## 7. Formaliteiten

- Bewaar alle `.launch/*.json`-bestanden en de explorer-links van de transacties als
  administratie, buiten git.
- Creator fees die je via pump.fun claimt zijn inkomsten; de dev buy en latere verkopen zijn
  transacties die je mogelijk moet aangeven. Hoe dat in België of Nederland uitpakt, is een
  vraag voor een adviseur. Dit is geen fiscaal of juridisch advies.
- Beloof nooit rendement, ook niet als grap in een post.
