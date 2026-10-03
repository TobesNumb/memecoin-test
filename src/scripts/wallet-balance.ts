import { Connection } from "@solana/web3.js";
import { explorerLinks, loadEnv } from "../config/env";
import { heading, info, kv, runScript } from "../lib/cli";
import { getBalanceSol, loadWalletFile } from "../lib/wallet";

runScript(async () => {
  const env = loadEnv();
  const wallet = loadWalletFile(env.keypairPath);
  const connection = new Connection(env.rpcUrl, "confirmed");

  heading("Saldo van de launch-wallet");
  kv("Netwerk", env.network);
  kv("RPC", env.rpcUrl);
  kv("Adres", wallet.publicKey.toBase58());
  const balance = await getBalanceSol(connection, wallet.publicKey);
  kv("Saldo", `${balance.toFixed(6)} SOL`);
  info("");
  for (const link of explorerLinks(env.network, "address", wallet.publicKey.toBase58())) {
    info(`  ${link}`);
  }
});
