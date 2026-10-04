import {
  bondingCurvePda,
  getBuyTokenAmountFromSolAmount,
  OnlinePumpSdk,
  PUMP_PROGRAM_ID,
  PUMP_SDK,
} from "@pump-fun/pump-sdk";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  type Connection,
  type Keypair,
  type PublicKey,
  type TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import type { TokenConfig } from "../../token.config";
import { solToLamports } from "./wallet";

export { PUMP_PROGRAM_ID };

export const MAX_COMPUTE_UNITS = 1_400_000;

export interface LaunchParams {
  config: TokenConfig;
  uri: string;
  payer: PublicKey;
  mint: PublicKey;
  priorityFeeMicroLamports: number;
  /** Nodig voor een dev buy (de bonding-curve-parameters komen van de chain). */
  connection: Connection | null;
}

export interface LaunchPlan {
  mode: "create" | "create-and-buy";
  mint: PublicKey;
  bondingCurve: PublicKey;
  payer: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  devBuyLamports: number;
  priorityFeeMicroLamports: number;
  instructions: TransactionInstruction[];
}

export interface SimulationResult {
  ok: boolean;
  error: string | null;
  logs: string[];
  unitsConsumed: number | null;
  preBalanceLamports: number;
  /** Lamports die de wallet in de simulatie kwijtraakte (fees + rent + dev buy). */
  costLamports: number | null;
}

/**
 * Bouwt de instructies voor `create_v2` (plus de eerste aankoop als devBuySol > 0).
 * Zonder dev buy gebeurt dit volledig offline.
 */
export async function buildLaunchPlan(params: LaunchParams): Promise<LaunchPlan> {
  const { config, uri, payer, mint, priorityFeeMicroLamports, connection } = params;
  const name = config.name.trim();
  const symbol = config.symbol.trim();
  const devBuyLamports = solToLamports(config.devBuySol);

  const common = {
    mint,
    name,
    symbol,
    uri,
    creator: payer,
    user: payer,
    mayhemMode: false,
  };

  const instructions: TransactionInstruction[] = [];
  if (priorityFeeMicroLamports > 0) {
    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFeeMicroLamports }),
    );
  }

  let mode: LaunchPlan["mode"];
  if (devBuyLamports > 0) {
    if (!connection) {
      throw new Error(
        "Een dev buy vereist een bereikbare RPC om de bonding-curve-parameters op te halen.",
      );
    }
    const online = new OnlinePumpSdk(connection);
    const [global, feeConfig] = await Promise.all([online.fetchGlobal(), online.fetchFeeConfig()]);
    const solAmount = new BN(devBuyLamports);
    const amount = getBuyTokenAmountFromSolAmount({
      global,
      feeConfig,
      mintSupply: null,
      bondingCurve: null,
      amount: solAmount,
      quoteMint: NATIVE_MINT,
    });
    instructions.push(
      ...(await PUMP_SDK.createV2AndBuyInstructions({ global, ...common, solAmount, amount })),
    );
    mode = "create-and-buy";
  } else {
    instructions.push(await PUMP_SDK.createV2Instruction(common));
    mode = "create";
  }

  return {
    mode,
    mint,
    bondingCurve: bondingCurvePda(mint),
    payer,
    name,
    symbol,
    uri,
    devBuyLamports,
    priorityFeeMicroLamports,
    instructions,
  };
}

function buildTransaction(
  plan: LaunchPlan,
  recentBlockhash: string,
  computeUnitLimit: number | null,
): VersionedTransaction {
  const instructions = [...plan.instructions];
  if (computeUnitLimit !== null) {
    instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }));
  }
  const message = new TransactionMessage({
    payerKey: plan.payer,
    recentBlockhash,
    instructions,
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

/** Simuleert de transactie zonder te ondertekenen en meet wat de wallet zou betalen. */
export async function simulateLaunch(
  connection: Connection,
  plan: LaunchPlan,
): Promise<SimulationResult> {
  const preBalanceLamports = await connection.getBalance(plan.payer, "confirmed");
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const transaction = buildTransaction(plan, blockhash, null);

  const { value } = await connection.simulateTransaction(transaction, {
    sigVerify: false,
    commitment: "confirmed",
    accounts: { encoding: "base64", addresses: [plan.payer.toBase58()] },
  });

  const postBalance = value.accounts?.[0]?.lamports;
  const costLamports =
    value.err === null && typeof postBalance === "number" ? preBalanceLamports - postBalance : null;

  return {
    ok: value.err === null,
    error: value.err === null ? null : JSON.stringify(value.err),
    logs: value.logs ?? [],
    unitsConsumed: typeof value.unitsConsumed === "number" ? value.unitsConsumed : null,
    preBalanceLamports,
    costLamports,
  };
}

/** Kiest een compute-unit-limiet op basis van de simulatie, met 20% marge. */
export function computeUnitLimitFor(simulation: SimulationResult): number | null {
  if (simulation.unitsConsumed === null || simulation.unitsConsumed === 0) return null;
  return Math.min(MAX_COMPUTE_UNITS, Math.ceil(simulation.unitsConsumed * 1.2));
}

/** Ondertekent met de wallet en de nieuwe mint, verstuurt en wacht op bevestiging. */
export async function sendLaunch(
  connection: Connection,
  plan: LaunchPlan,
  payer: Keypair,
  mint: Keypair,
  computeUnitLimit: number | null,
): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const transaction = buildTransaction(plan, blockhash, computeUnitLimit);
  transaction.sign([payer, mint]);

  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  const confirmation = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  if (confirmation.value.err !== null) {
    throw new Error(
      `Transactie ${signature} is verstuurd maar mislukt: ${JSON.stringify(confirmation.value.err)}`,
    );
  }
  return signature;
}
