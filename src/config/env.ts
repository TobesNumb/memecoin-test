import path from "node:path";
import { config as loadDotenv } from "dotenv";

export type Network = "devnet" | "mainnet";

export interface Env {
  network: Network;
  rpcUrl: string;
  keypairPath: string;
  priorityFeeMicroLamports: number;
  /** Optionele harde grens: launch weigert te versturen als de simulatie meer kost. */
  maxSpendSol: number | null;
}

/** Absolute projectmap (de map met package.json en token.config.ts). */
export const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const DEFAULT_RPC: Record<Network, string> = {
  devnet: "https://api.devnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
};

export function parseNetwork(value: string | undefined): Network {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "devnet") return "devnet";
  if (normalized === "mainnet" || normalized === "mainnet-beta") return "mainnet";
  throw new Error(`Ongeldig netwerk "${value ?? ""}". Gebruik "devnet" of "mainnet".`);
}

/** Leest .env uit de projectmap en valideert de waarden. */
export function loadEnv(): Env {
  loadDotenv({ path: path.join(PROJECT_ROOT, ".env"), quiet: true });

  const network = parseNetwork(process.env["NETWORK"] ?? "devnet");
  const rpcUrl = (process.env["RPC_URL"] ?? "").trim() || DEFAULT_RPC[network];
  if (!/^https?:\/\//.test(rpcUrl)) {
    throw new Error(`RPC_URL moet met http(s):// beginnen, kreeg "${rpcUrl}".`);
  }

  const keypairPath = path.resolve(
    PROJECT_ROOT,
    (process.env["KEYPAIR_PATH"] ?? "").trim() || "./keys/wallet.json",
  );

  const feeRaw = (process.env["PRIORITY_FEE_MICRO_LAMPORTS"] ?? "0").trim();
  const priorityFeeMicroLamports = Number(feeRaw);
  if (!Number.isInteger(priorityFeeMicroLamports) || priorityFeeMicroLamports < 0) {
    throw new Error(
      `PRIORITY_FEE_MICRO_LAMPORTS moet een geheel getal >= 0 zijn, kreeg "${feeRaw}".`,
    );
  }

  const maxSpendRaw = (process.env["MAX_SPEND_SOL"] ?? "").trim();
  let maxSpendSol: number | null = null;
  if (maxSpendRaw.length > 0) {
    maxSpendSol = Number(maxSpendRaw);
    if (!Number.isFinite(maxSpendSol) || maxSpendSol <= 0) {
      throw new Error(`MAX_SPEND_SOL moet een getal > 0 zijn, kreeg "${maxSpendRaw}".`);
    }
  }

  return { network, rpcUrl, keypairPath, priorityFeeMicroLamports, maxSpendSol };
}

/** Explorer-links voor een transactie of adres op het gekozen netwerk. */
export function explorerLinks(network: Network, kind: "tx" | "address", id: string): string[] {
  const cluster = network === "devnet" ? "?cluster=devnet" : "";
  const solscanKind = kind === "tx" ? "tx" : "account";
  return [
    `https://explorer.solana.com/${kind}/${id}${cluster}`,
    `https://solscan.io/${solscanKind}/${id}${cluster}`,
  ];
}
