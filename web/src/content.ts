/**
 * Alle teksten van de landingspagina. Naam, ticker, beschrijving, links,
 * dev buy en contractadres komen uit token.config.ts; dit bestand bevat de
 * rest van de copy, in het Engels omdat het publiek van pump.fun internationaal is.
 */

export const content = {
  tagline: "The coin for everyone who hates Mondays.",
  grr: "Grr.",
  countdown: {
    heading: "Next Monday in",
    itIsMonday: "It's Monday. Grr.",
    nextOne: "Next one in",
  },
  about: {
    heading: "What is $MONDAY?",
    cards: [
      {
        title: "The meme",
        text: "#GrrMondays: you post what your Monday actually looks like, slap the hashtag on it, and that's the whole joke. The internet does it every single week.",
      },
      {
        title: "The coin",
        text: "A meme coin launched fair on pump.fun. No presale, no team allocation, no roadmap. Just a token for the worst day of the week.",
      },
      {
        title: "The ritual",
        text: "Every Monday the community posts its Monday with $MONDAY. Every Monday is a catalyst. The weekend is just the countdown.",
      },
    ],
  },
  howToBuy: {
    heading: "How to buy",
    steps: [
      {
        title: "Get a Solana wallet",
        text: "Install Phantom or another Solana wallet on your phone or in your browser.",
      },
      {
        title: "Get some SOL",
        text: "Buy SOL on an exchange and send it to your wallet, or buy it inside the wallet app.",
      },
      {
        title: "Swap on pump.fun",
        text: "Open the $MONDAY page on pump.fun, connect your wallet and swap SOL for $MONDAY.",
      },
    ],
  },
  tokenomics: {
    heading: "Tokenomics",
    rows: [
      { label: "Total supply", value: "1,000,000,000" },
      { label: "Presale", value: "None" },
      { label: "Team allocation", value: "None" },
      { label: "Launch", value: "Fair launch on the pump.fun bonding curve" },
      { label: "Liquidity", value: "Moves to PumpSwap when the curve graduates" },
    ],
    devBuyLabel: "Disclosed dev buy",
    devBuyNone: "None",
  },
  cta: {
    buy: "Buy on pump.fun",
    launchingSoon: "Launching soon. The contract address will appear here.",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Copy failed",
  },
  disclaimer:
    "$MONDAY is a meme coin. It has no intrinsic value, no utility and makes no promises. Nothing here is financial advice. Only spend what you can afford to lose.",
  madeWith: "Made with grr.",
} as const;
