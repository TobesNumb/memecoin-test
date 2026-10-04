import fs from "node:fs";
import path from "node:path";
import { Keypair, LAMPORTS_PER_SOL, type Connection, type PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Maakt een nieuw keypair en schrijft het in het Solana-CLI-formaat (JSON-array
 * van 64 bytes) naar `filePath`. Weigert een bestaand bestand te overschrijven.
 */
export function createWalletFile(filePath: string): PublicKey {
  if (fs.existsSync(filePath)) {
    throw new Error(
      `Er bestaat al een keypair op ${filePath}. Verwijder of verplaats het eerst zelf; dit script overschrijft nooit.`,
    );
  }
  const keypair = Keypair.generate();
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)), { mode: 0o600 });
  return keypair.publicKey;
}

/**
 * Leest een keypair-bestand. Ondersteunt het Solana-CLI-formaat (JSON-array) en
 * een base58-geheime sleutel zoals Phantom die exporteert.
 */
export function loadWalletFile(filePath: string): Keypair {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Keypair niet gevonden op ${filePath}. Maak er een met \`npm run wallet:create\` of pas KEYPAIR_PATH in .env aan.`,
    );
  }
  const raw = fs.readFileSync(filePath, "utf8").trim();
  let secret: Uint8Array;
  if (raw.startsWith("[")) {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((n) => typeof n === "number")) {
      throw new Error(`${filePath} bevat geen geldige JSON-array met bytes.`);
    }
    secret = Uint8Array.from(parsed);
  } else {
    secret = bs58.decode(raw);
  }
  if (secret.length !== 64) {
    throw new Error(`${filePath} bevat ${secret.length} bytes, een geheime sleutel heeft er 64.`);
  }
  return Keypair.fromSecretKey(secret);
}

export function walletFileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export async function getBalanceSol(connection: Connection, owner: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(owner, "confirmed");
  return lamports / LAMPORTS_PER_SOL;
}

export function lamportsToSol(lamports: number | bigint): string {
  const value = Number(lamports) / LAMPORTS_PER_SOL;
  return `${value.toFixed(6)} SOL`;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}
