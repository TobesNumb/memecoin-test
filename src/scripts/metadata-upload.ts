import path from "node:path";
import { tokenConfig } from "../../token.config";
import { fail, heading, info, kv, parseFlags, runScript, warn } from "../lib/cli";
import {
  buildMetadataPreview,
  checkLinks,
  PUMP_IPFS_ENDPOINT,
  resolveLogo,
  saveUploadResult,
  uploadToPumpIpfs,
  validateTokenConfig,
} from "../lib/metadata";

runScript(async () => {
  const flags = parseFlags();
  if (flags.help) {
    info("Gebruik: npm run metadata:upload [-- --dry-run] [-- --allow-dead-links]");
    info("  --dry-run            toon wat er geüpload zou worden, zonder te uploaden");
    info("  --allow-dead-links   ga door ook als een link niet antwoordt (niet aanbevolen)");
    return;
  }

  heading(flags.dryRun ? "Metadata-upload (dry-run)" : "Metadata-upload naar IPFS via pump.fun");

  const { errors, warnings } = validateTokenConfig(tokenConfig);
  for (const warning of warnings) warn(warning);
  if (errors.length > 0) {
    fail(`token.config.ts is niet geldig:\n  - ${errors.join("\n  - ")}`);
  }

  const links = await checkLinks(tokenConfig);
  if (links.length > 0) {
    info("Linkcontrole (de metadata is na de upload onveranderbaar):");
    for (const result of links) {
      const status =
        result.status === null ? (result.error ?? "geen antwoord") : `HTTP ${result.status}`;
      kv(`  ${result.label}`, `${result.ok ? "ok" : "DOOD"}  ${status}  ${result.url}`);
    }
    const dead = links.filter((result) => !result.ok);
    if (dead.length > 0) {
      const message = `${dead.length} link(s) antwoorden niet. Zet ze live, maak ze leeg in token.config.ts, of forceer met --allow-dead-links.`;
      if (flags.allowDeadLinks) warn(message);
      else if (!flags.dryRun) fail(message);
      else warn(`${message} Zonder --dry-run stopt het script hier.`);
    }
  }

  const logo = resolveLogo(tokenConfig);
  kv("Endpoint", PUMP_IPFS_ENDPOINT);
  kv(
    "Logo",
    `${logo.relativePath} (${logo.mimeType}, ${(logo.bytes.length / 1024).toFixed(1)} kB)`,
  );
  info("\nMetadata die pump.fun zal opslaan:");
  info(JSON.stringify(buildMetadataPreview(tokenConfig), null, 2));

  if (flags.dryRun) {
    info("\nDry-run: er is niets geüpload.");
    return;
  }

  info("\nUploaden...");
  const result = await uploadToPumpIpfs(tokenConfig);
  const savedTo = saveUploadResult(result);

  heading("Klaar");
  kv("metadataUri", result.metadataUri);
  if (result.metadata) kv("image", result.metadata.image);
  kv("Opgeslagen in", savedTo);
  info(`\n\`npm run launch\` gebruikt ${path.basename(savedTo)} automatisch.`);
});
