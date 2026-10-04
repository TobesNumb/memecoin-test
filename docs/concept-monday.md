# Concept: Monday ($MONDAY)

Vastgelegd op 4 oktober 2026, als onderbouwing van de keuzes in `token.config.ts`,
`assets/logo.png` en `web/`.

## De hype van dit weekend

Onderzocht via meme-overzichten, Wikipedia en Know Your Meme-vermeldingen in zoekresultaten
(de meeste meme-sites zijn vanuit de bouwomgeving niet direct bereikbaar).

| Kandidaat               | Status begin oktober 2026                                                                     | Oordeel                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Grr Mondays** (Ted 2) | Sinds september viraal op TikTok en Reels, 2,8 miljoen views in twee weken, nog volop formats | Sterkste hype, maar al bezet door `$GRRR` (pump.fun) en `$GRR` (Robinhood Chain) |
| 6-7 / "six seven"       | Al bijna een jaar oud, bronnen noemen het "dying"                                             | Te laat                                                                          |
| Mean Girls / 3 oktober  | Jaarlijks eendagsding rond 3 oktober                                                          | Voorbij zodra de datum voorbij is                                                |
| "Cash Cat"-golf         | Tientallen kopieën op pump.fun                                                                | Spam, geen eigen haak                                                            |

## De keuze: Monday

We rijden mee op de Grr Mondays-hype zonder een kopie van `$GRRR` te zijn:

- **Naam** `Monday`, **ticker** `MONDAY`. Breder dan de Ted-quote, meteen begrijpelijk, en
  niet gebonden aan filmmateriaal of personages.
- **Haak**: de coin voor iedereen die maandag haat. _Every Monday is a catalyst._ Elke week
  is er een natuurlijk moment waarop de community post (#GrrMondays met $MONDAY), en de
  landingspagina telt live af naar de volgende maandag.
- **Beschrijving** voor pump.fun, Engels omdat het publiek internationaal is:
  "The coin for everyone who hates Mondays. Grr. Fair launch on pump.fun, no presale, no
  team tokens. Every Monday is a catalyst. #GrrMondays"
- **Logo**: een eigen mascotte, een chagrijnig scheurkalenderblaadje met "MON" erop. Geen
  teddybeer, geen filmbeelden, geen echte personen. Gegenereerd met gpt-image-2 via
  ElevenLabs; de vier varianten staan in de flow van het account.
- **Links**: bewust leeg. Pas invullen als de accounts echt bestaan.

## Eerlijke inschatting

Een late instap op een hype die al coins heeft, zonder community, is de zwakste startpositie
die er is. Wat de kans verbetert:

1. **Timing**: lanceren op zondagavond of maandagochtend (Europese tijd), zodat de eerste
   posts samenvallen met de wekelijkse piek van het meme.
2. **Een paar mensen klaar**: zelfs vijf vrienden die op het eerste uur posten maken verschil.
3. **Transparantie**: de dev buy staat op de site; verkoop nooit stil.
4. **Niet forceren**: slaat het niet aan, laat het dan liggen. Niet bijkopen om "het te redden".

## Dev buy: advies

`devBuySol: 0.1` (ongeveer 12 dollar bij een SOL-koers van 120 dollar).

- Zonder community zet een grote dev buy alleen SOL vast in de curve en geeft het handelaren
  het signaal dat de maker veel houdt.
- Nul oogt onverschillig. Een kleine, zichtbare aankoop toont betrokkenheid.
- Groeit er vooraf wel een community, dan is 0,25 tot 0,5 SOL verdedigbaar. Meer niet voor
  een eerste coin.

## Landingspagina

- Stijl: donker navy, kalendergeel, "grr"-rood; display-font Anton via Google Fonts met
  Impact als fallback. Mobiel eerst.
- Secties: hero met logo en contractadres, aftelklok naar maandag, "What is $MONDAY?", "How to
  buy", tokenomics (1 miljard supply, geen presale, geen team-allocatie, dev buy uit de
  config), disclaimer.
- Teksten staan in `web/src/content.ts`; tokengegevens in `token.config.ts`.

## Checklist vóór de echte launch

- [ ] Logo definitief (eventueel een andere variant uit de flow kiezen).
- [ ] X-account en Telegram aanmaken en de links in `token.config.ts` zetten.
- [ ] Website publiceren en de URL in `token.config.ts` zetten.
- [ ] Generale repetitie doorlopen (`docs/generale-repetitie.md`).
- [ ] Eerste vijf posts klaarzetten voor het launchmoment.
- [ ] Launch op zondagavond of maandagochtend; daarna `contractAddress` invullen en de site
      opnieuw bouwen.
