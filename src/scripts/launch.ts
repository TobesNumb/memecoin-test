import fs from "node:fs";
import path from "node:path";
import { Connection, Keypair } from "@solana/web3.js";
import { tokenConfig } from "../../token.config";
import { explorerLinks, loadEnv, parseNetwork, PROJECT_ROOT, type Network } from "../config/env";
import { askYes, fail, heading, info, kv, parseFlags, runScript, warn } from "../lib/cli";
import {
  buildLaunchPlan,
  computeUnitLimitFor,
  PUMP_PROGRAM_ID,
  sendLaunch,
  simulateLaunch,
  type LaunchPlan,
  type SimulationResult,
} from "../lib/launch";
import {
  containsPlaceholder,
  LAUNCH_DIR,
  resolveMetadataUri,
  validateTokenConfig,
} from "../lib/metadata";
import {
  getBalanceSol,
  lamportsToSol,
  loadWalletFile,
  solToLamports,
  walletFileExists,
} from "../lib/wallet";

const DRY_RUN_PLACEHOLDER_URI = "https://example.invalid/placeholder-metadata.json";

function printHelp(): void {
  info("Gebruik:");
  info(
    "  npm run launch                                   dry-run (standaard): bouwen, simuleren, overzicht",
  );
  info(
    "  npm run launch -- --network devnet --confirm     echt versturen op devnet (na ja/nee-vraag)",
  );
  info(
    "  npm run launch -- --network mainnet --confirm    echt versturen op mainnet (na ja/nee-vraag)",
  );
  info("  npm run launch -- --uri <metadata-uri>           gebruik een eigen metadata-URI");
  info("  npm run launch -- --dry-run                      forceer dry-run, ook met --confirm");
  info("\n--network moet overeenkomen met NETWORK in .env.");
}

function saveLaunchRecord(network: Network, plan: LaunchPlan, signature: string | null): string {
  fs.mkdirSync(LAUNCH_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(LAUNCH_DIR, `launch-${network}-${stamp}.json`);
  fs.writeFileSync(
    file,
    `${JSON.stringify(
      {
        network,
        mint: plan.mint.toBase58(),
        bondingCurve: plan.bondingCurve.toBase58(),
        name: plan.name,
        symbol: plan.symbol,
        uri: plan.uri,
        devBuyLamports: plan.devBuyLamports,
        signature,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
  return path.relative(PROJECT_ROOT, file);
}

function printSimulation(simulation: SimulationResult, plan: LaunchPlan): void {
  kv("Resultaat", simulation.ok ? "geslaagd" : `MISLUKT: ${simulation.error ?? "onbekend"}`);
  kv("Compute units", simulation.unitsConsumed ?? "onbekend");
  kv("Saldo wallet", lamportsToSol(simulation.preBalanceLamports));
  if (simulation.costLamports !== null) {
    const feesAndRent = simulation.costLamports - plan.devBuyLamports;
    kv("Kosten (totaal)", lamportsToSol(simulation.costLamports));
    kv("  waarvan dev buy", lamportsToSol(plan.devBuyLamports));
    kv("  waarvan fees/rent", lamportsToSol(feesAndRent));
  }
  if (!simulation.ok) {
    info("\nLaatste programma-logs:");
    for (const line of simulation.logs.slice(-15)) info(`  ${line}`);
  }
}

runScript(async () => {
  const flags = parseFlags();
  if (flags.help) {
    printHelp();
    return;
  }

  const env = loadEnv();

  // --- Netwerk en modus ---------------------------------------------------
  if (flags.network !== undefined) {
    const flagNetwork = parseNetwork(flags.network);
    if (flagNetwork !== env.network) {
      fail(
        `--network ${flagNetwork} komt niet overeen met NETWORK=${env.network} in .env. ` +
          "Pas .env aan (inclusief RPC_URL) zodat beide hetzelfde netwerk noemen.",
      );
    }
  }
  if (flags.confirm && flags.network === undefined) {
    fail("--confirm werkt alleen samen met --network devnet of --network mainnet.");
  }
  const willSend = flags.confirm && flags.network !== undefined && !flags.dryRun;

  heading(
    willSend ? `LAUNCH OP ${env.network.toUpperCase()}` : "DRY-RUN: er wordt niets verstuurd",
  );

  // --- Configuratie -------------------------------------------------------
  const { errors, warnings } = validateTokenConfig(tokenConfig);
  for (const warning of warnings) warn(warning);
  if (errors.length > 0) {
    fail(`token.config.ts is niet geldig:\n  - ${errors.join("\n  - ")}`);
  }
  if (willSend && env.network === "mainnet" && containsPlaceholder(tokenConfig)) {
    fail("token.config.ts bevat nog PLACEHOLDER-tekst. Vul eerst de echte gegevens in.");
  }

  // --- Metadata-URI -------------------------------------------------------
  const resolved = resolveMetadataUri(flags.uri, tokenConfig);
  if (resolved.mismatch !== null) {
    if (willSend) fail(resolved.mismatch);
    warn(resolved.mismatch);
  }
  let uri = resolved.uri;
  if (uri === null) {
    if (willSend) {
      fail("Geen metadata-URI gevonden. Draai eerst `npm run metadata:upload` of geef --uri mee.");
    }
    uri = DRY_RUN_PLACEHOLDER_URI;
    warn("Geen metadata-URI gevonden; de dry-run gebruikt een placeholder-URI.");
  }

  // --- Wallet -------------------------------------------------------------
  let payer: Keypair;
  if (walletFileExists(env.keypairPath)) {
    payer = loadWalletFile(env.keypairPath);
  } else {
    if (willSend) {
      fail(
        `Keypair niet gevonden op ${env.keypairPath}. Maak er een met \`npm run wallet:create\`.`,
      );
    }
    payer = Keypair.generate();
    warn("Geen keypair gevonden; de dry-run gebruikt een tijdelijk, leeg adres.");
  }

  // --- RPC ----------------------------------------------------------------
  const connection = new Connection(env.rpcUrl, "confirmed");
  let rpcReachable = true;
  try {
    await connection.getLatestBlockhash("confirmed");
  } catch (error: unknown) {
    rpcReachable = false;
    const reason = error instanceof Error ? error.message : String(error);
    if (willSend) fail(`RPC ${env.rpcUrl} is niet bereikbaar: ${reason}`);
    warn(`RPC ${env.rpcUrl} is niet bereikbaar (${reason.split("\n")[0] ?? reason}).`);
  }

  // --- Transactie bouwen --------------------------------------------------
  const mint = Keypair.generate();
  let config = tokenConfig;
  if (config.devBuySol > 0 && !rpcReachable) {
    warn("Een dev buy vereist RPC; het overzicht toont daarom alleen de create-instructie.");
    config = { ...config, devBuySol: 0 };
  }
  const plan = await buildLaunchPlan({
    config,
    uri,
    payer: payer.publicKey,
    mint: mint.publicKey,
    priorityFeeMicroLamports: env.priorityFeeMicroLamports,
    connection: rpcReachable ? connection : null,
  });

  // --- Overzicht ----------------------------------------------------------
  heading("Overzicht");
  kv("Modus", willSend ? "VERSTUREN" : "dry-run");
  kv("Netwerk", env.network);
  kv("RPC", env.rpcUrl);
  kv("Pump-programma", PUMP_PROGRAM_ID.toBase58());
  kv("Wallet (betaler)", payer.publicKey.toBase58());
  kv("Creator", payer.publicKey.toBase58());
  kv("Mint (contractadres)", plan.mint.toBase58());
  kv("Bonding curve", plan.bondingCurve.toBase58());
  kv("Naam", plan.name);
  kv("Ticker", plan.symbol);
  kv(
    "Beschrijving",
    config.description.length > 80 ? `${config.description.slice(0, 77)}...` : config.description,
  );
  kv(
    "Metadata-URI",
    `${plan.uri} (bron: ${resolved.uri === null ? "placeholder" : resolved.source})`,
  );
  kv("Dev buy", `${config.devBuySol} SOL`);
  kv("Priority fee", `${plan.priorityFeeMicroLamports} micro-lamports/CU`);
  kv(
    "Uitgavenlimiet",
    env.maxSpendSol === null ? "geen (MAX_SPEND_SOL niet gezet)" : `${env.maxSpendSol} SOL`,
  );
  kv("Instructies", `${plan.instructions.length} (${plan.mode})`);

  // --- Simulatie ----------------------------------------------------------
  heading("Simulatie");
  let simulation: SimulationResult | null = null;
  if (!rpcReachable) {
    warn(
      "Overgeslagen: RPC niet bereikbaar. Draai dit lokaal met een werkende RPC_URL voor de kosten.",
    );
  } else {
    simulation = await simulateLaunch(connection, plan);
    printSimulation(simulation, plan);
  }

  if (!willSend) {
    info("\nDit was een dry-run. Versturen kan alleen met:");
    info(`  npm run launch -- --network ${env.network} --confirm`);
    return;
  }

  // --- Laatste controles en bevestiging ------------------------------------
  if (!simulation?.ok) {
    fail("De simulatie is niet geslaagd; er wordt niets verstuurd.");
  }
  if (env.maxSpendSol !== null && simulation.costLamports !== null) {
    const limitLamports = solToLamports(env.maxSpendSol);
    if (simulation.costLamports > limitLamports) {
      fail(
        `De simulatie kost ${lamportsToSol(simulation.costLamports)}, meer dan de uitgavenlimiet van ${env.maxSpendSol} SOL (MAX_SPEND_SOL). Er wordt niets verstuurd.`,
      );
    }
  }
  const balanceSol = await getBalanceSol(connection, payer.publicKey);
  const neededLamports =
    (simulation.costLamports ?? solToLamports(config.devBuySol)) + solToLamports(0.005);
  if (solToLamports(balanceSol) < neededLamports) {
    fail(
      `Saldo ${balanceSol.toFixed(6)} SOL is lager dan de benodigde ${lamportsToSol(neededLamports)} (inclusief marge).`,
    );
  }

  heading("Bevestiging");
  if (env.network === "mainnet") {
    warn(
      "Dit verstuurt een ECHTE transactie op MAINNET met echt geld. Dit kan niet ongedaan worden gemaakt.",
    );
  }
  const confirmed = await askYes(
    `Token "${plan.name}" (${plan.symbol}) nu aanmaken op ${env.network}?`,
  );
  if (!confirmed) {
    info("Geannuleerd. Er is niets verstuurd.");
    return;
  }

  // --- Versturen ----------------------------------------------------------
  const record = saveLaunchRecord(env.network, plan, null);
  info(`Versturen... (gegevens vooraf bewaard in ${record})`);
  const signature = await sendLaunch(
    connection,
    plan,
    payer,
    mint,
    computeUnitLimitFor(simulation),
  );
  const finalRecord = saveLaunchRecord(env.network, plan, signature);

  heading("Verstuurd en bevestigd");
  kv("Signature", signature);
  kv("Contractadres", plan.mint.toBase58());
  kv("Bewaard in", finalRecord);
  info("");
  for (const link of explorerLinks(env.network, "tx", signature)) info(`  ${link}`);
  if (env.network === "mainnet") info(`  https://pump.fun/coin/${plan.mint.toBase58()}`);
  info("\nZet contractAddress in token.config.ts op het contractadres zodat de website het toont.");
});
