import path from "node:path";
import { loadEnv, PROJECT_ROOT } from "../config/env";
import { heading, info, kv, runScript, warn } from "../lib/cli";
import { createWalletFile } from "../lib/wallet";

runScript(async () => {
  const env = loadEnv();
  heading("Nieuwe launch-wallet aanmaken");
  const publicKey = createWalletFile(env.keypairPath);
  kv("Bestand", path.relative(PROJECT_ROOT, env.keypairPath));
  kv("Publiek adres", publicKey.toBase58());
  info("");
  warn("Dit bestand bevat de geheime sleutel. Maak een back-up buiten git en deel het nooit.");
  warn(
    "Stort SOL op dit adres voordat je lanceert (devnet: `solana airdrop` of faucet.solana.com).",
  );
  await Promise.resolve();
});
