import fs from "node:fs";
import path from "node:path";
import type { TokenConfig } from "../../token.config";
import { PROJECT_ROOT } from "../config/env";

/**
 * Endpoint dat de pump.fun-webapp gebruikt om logo + metadata naar IPFS te
 * zetten. Niet officieel gedocumenteerd (zie docs/pumpfun.md); daarom
 * controleren we het antwoord strikt en bieden we `metadataUri` als uitweg.
 */
export const PUMP_IPFS_ENDPOINT = "https://pump.fun/api/ipfs";

/** Limieten uit pump-public-docs (docs/instructions/COIN_CREATION.md). */
export const NAME_MAX_LENGTH = 32;
export const SYMBOL_MAX_LENGTH = 13;
export const URI_MAX_LENGTH = 200;

const LOGO_MIME_TYPES: Readonly<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

/** Het JSON-formaat dat pump.fun op de metadata-URI verwacht. */
export interface PumpMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  showName: boolean;
  createdOn: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

export interface UploadResult {
  metadataUri: string;
  metadata: PumpMetadata | null;
  name: string;
  symbol: string;
  uploadedAt: string;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface ResolvedLogo {
  absolutePath: string;
  relativePath: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}

/** Waar `metadata:upload` zijn resultaat bewaart (map staat in .gitignore). */
export const LAUNCH_DIR = path.join(PROJECT_ROOT, ".launch");
export const UPLOAD_RESULT_PATH = path.join(LAUNCH_DIR, "metadata.json");

const PLACEHOLDER_PATTERN = /placeholder/i;

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/.test(value);
}

/** Geeft true als er ergens in de tekstvelden nog "PLACEHOLDER" staat. */
export function containsPlaceholder(config: TokenConfig): boolean {
  const fields = [
    config.name,
    config.symbol,
    config.description,
    config.links.x,
    config.links.telegram,
    config.links.website,
  ];
  return fields.some((value) => PLACEHOLDER_PATTERN.test(value));
}

/** Controleert token.config.ts tegen de limieten van pump.fun. */
export function validateTokenConfig(config: TokenConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = config.name.trim();
  if (name.length === 0) errors.push("name is leeg.");
  if (name.length > NAME_MAX_LENGTH) {
    errors.push(`name is ${name.length} tekens, maximaal ${NAME_MAX_LENGTH}.`);
  }

  const symbol = config.symbol.trim();
  if (symbol.length === 0) errors.push("symbol is leeg.");
  if (symbol.length > SYMBOL_MAX_LENGTH) {
    errors.push(`symbol is ${symbol.length} tekens, maximaal ${SYMBOL_MAX_LENGTH}.`);
  }
  if (/\s/.test(symbol)) errors.push("symbol mag geen spaties bevatten.");

  if (config.description.trim().length === 0) errors.push("description is leeg.");

  const linkEntries: [string, string][] = [
    ["x", config.links.x],
    ["telegram", config.links.telegram],
    ["website", config.links.website],
  ];
  for (const [label, value] of linkEntries) {
    if (value.length > 0 && !isHttpUrl(value)) {
      errors.push(`links.${label} is geen geldige http(s)-URL: "${value}".`);
    }
  }

  const logoPath = path.resolve(PROJECT_ROOT, config.logoPath);
  if (!fs.existsSync(logoPath)) {
    errors.push(`logo niet gevonden op ${config.logoPath}.`);
  } else if (!(path.extname(logoPath).toLowerCase() in LOGO_MIME_TYPES)) {
    errors.push(
      `logo heeft extensie ${path.extname(logoPath)}; toegestaan: ${Object.keys(LOGO_MIME_TYPES).join(", ")}.`,
    );
  }

  if (!Number.isFinite(config.devBuySol) || config.devBuySol < 0) {
    errors.push(`devBuySol moet een getal >= 0 zijn, kreeg ${String(config.devBuySol)}.`);
  }

  if (config.metadataUri.length > 0) {
    if (config.metadataUri.length > URI_MAX_LENGTH) {
      errors.push(`metadataUri is langer dan ${URI_MAX_LENGTH} tekens.`);
    }
    if (!/^(https?:\/\/|ipfs:\/\/)\S+$/.test(config.metadataUri)) {
      errors.push("metadataUri moet met https:// of ipfs:// beginnen.");
    }
  }

  if (containsPlaceholder(config)) {
    warnings.push(
      "token.config.ts bevat nog PLACEHOLDER-tekst. Prima voor een dry-run; versturen op mainnet wordt geweigerd.",
    );
  }

  return { errors, warnings };
}

export function resolveLogo(config: TokenConfig): ResolvedLogo {
  const absolutePath = path.resolve(PROJECT_ROOT, config.logoPath);
  const extension = path.extname(absolutePath).toLowerCase();
  const mimeType = LOGO_MIME_TYPES[extension];
  if (mimeType === undefined) {
    throw new Error(`Onbekend logoformaat "${extension}".`);
  }
  return {
    absolutePath,
    relativePath: path.relative(PROJECT_ROOT, absolutePath),
    fileName: path.basename(absolutePath),
    mimeType,
    bytes: fs.readFileSync(absolutePath),
  };
}

/** De metadata zoals pump.fun die zal opslaan; `image` is pas na de upload bekend. */
export function buildMetadataPreview(config: TokenConfig): PumpMetadata {
  const metadata: PumpMetadata = {
    name: config.name.trim(),
    symbol: config.symbol.trim(),
    description: config.description.trim(),
    image: "<wordt door de upload ingevuld>",
    showName: true,
    createdOn: "https://pump.fun",
  };
  if (config.links.x) metadata.twitter = config.links.x;
  if (config.links.telegram) metadata.telegram = config.links.telegram;
  if (config.links.website) metadata.website = config.links.website;
  return metadata;
}

/** Bouwt het multipart-formulier precies zoals de pump.fun-webapp het verstuurt. */
export function buildUploadForm(config: TokenConfig, logo: ResolvedLogo): FormData {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(logo.bytes)], { type: logo.mimeType }),
    logo.fileName,
  );
  form.append("name", config.name.trim());
  form.append("symbol", config.symbol.trim());
  form.append("description", config.description.trim());
  form.append("twitter", config.links.x);
  form.append("telegram", config.links.telegram);
  form.append("website", config.links.website);
  form.append("showName", "true");
  return form;
}

function isPumpMetadata(value: unknown): value is PumpMetadata {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record["name"] === "string" &&
    typeof record["symbol"] === "string" &&
    typeof record["image"] === "string"
  );
}

/** Uploadt logo + metadata en geeft de metadata-URI terug. Gooit een fout bij elk onverwacht antwoord. */
export async function uploadToPumpIpfs(config: TokenConfig): Promise<UploadResult> {
  const logo = resolveLogo(config);
  const form = buildUploadForm(config, logo);

  let response: Response;
  try {
    response = await fetch(PUMP_IPFS_ENDPOINT, {
      method: "POST",
      body: form,
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Upload naar ${PUMP_IPFS_ENDPOINT} mislukt: ${reason}`, { cause: error });
  }

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(
      `pump.fun antwoordde met HTTP ${response.status}: ${bodyText.slice(0, 300)}\n` +
        "Probeer het later opnieuw, of pin de metadata zelf en zet de URI in token.config.ts (metadataUri).",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch (error: unknown) {
    throw new Error(`pump.fun gaf geen JSON terug: ${bodyText.slice(0, 300)}`, { cause: error });
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Onverwacht antwoord van pump.fun (geen object).");
  }
  const record = parsed as Record<string, unknown>;
  const metadataUri = record["metadataUri"];
  if (typeof metadataUri !== "string" || metadataUri.length === 0) {
    throw new Error(`Antwoord bevat geen metadataUri: ${bodyText.slice(0, 300)}`);
  }
  if (metadataUri.length > URI_MAX_LENGTH) {
    throw new Error(
      `metadataUri is ${metadataUri.length} tekens, pump.fun staat ${URI_MAX_LENGTH} toe.`,
    );
  }

  return {
    metadataUri,
    metadata: isPumpMetadata(record["metadata"]) ? record["metadata"] : null,
    name: config.name.trim(),
    symbol: config.symbol.trim(),
    uploadedAt: new Date().toISOString(),
  };
}

export function saveUploadResult(result: UploadResult): string {
  fs.mkdirSync(LAUNCH_DIR, { recursive: true });
  fs.writeFileSync(UPLOAD_RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`);
  return path.relative(PROJECT_ROOT, UPLOAD_RESULT_PATH);
}

export function loadUploadResult(): UploadResult | null {
  if (!fs.existsSync(UPLOAD_RESULT_PATH)) return null;
  const parsed: unknown = JSON.parse(fs.readFileSync(UPLOAD_RESULT_PATH, "utf8"));
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  if (typeof record["metadataUri"] !== "string") return null;
  return {
    metadataUri: record["metadataUri"],
    metadata: isPumpMetadata(record["metadata"]) ? record["metadata"] : null,
    name: typeof record["name"] === "string" ? record["name"] : "",
    symbol: typeof record["symbol"] === "string" ? record["symbol"] : "",
    uploadedAt: typeof record["uploadedAt"] === "string" ? record["uploadedAt"] : "",
  };
}

export interface LinkCheckResult {
  label: string;
  url: string;
  ok: boolean;
  status: number | null;
  error: string | null;
}

/**
 * Controleert of elke ingevulde link echt antwoordt. De metadata op pump.fun is
 * onveranderbaar, dus een dode link blijft voor altijd staan.
 */
export async function checkLinks(config: TokenConfig): Promise<LinkCheckResult[]> {
  const entries: [string, string][] = [
    ["x", config.links.x],
    ["telegram", config.links.telegram],
    ["website", config.links.website],
  ];
  const results: LinkCheckResult[] = [];
  for (const [label, url] of entries) {
    if (url.length === 0) continue;
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; memecoin-launch link check)" },
      });
      results.push({ label, url, ok: response.status < 400, status: response.status, error: null });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      results.push({ label, url, ok: false, status: null, error: reason.split("\n")[0] ?? reason });
    }
  }
  return results;
}

export type MetadataUriSource = "flag" | "config" | "upload" | "none";

export interface ResolvedMetadataUri {
  uri: string | null;
  source: MetadataUriSource;
  /** Gevuld als het opgeslagen uploadresultaat bij een andere naam/ticker hoort. */
  mismatch: string | null;
}

/** Volgorde: --uri, dan token.config.ts (metadataUri), dan het resultaat van metadata:upload. */
export function resolveMetadataUri(
  flagUri: string | undefined,
  config: TokenConfig,
): ResolvedMetadataUri {
  if (flagUri !== undefined && flagUri.length > 0) {
    return { uri: flagUri, source: "flag", mismatch: null };
  }
  if (config.metadataUri.length > 0) {
    return { uri: config.metadataUri, source: "config", mismatch: null };
  }
  const upload = loadUploadResult();
  if (upload) {
    const mismatch =
      upload.name !== config.name.trim() || upload.symbol !== config.symbol.trim()
        ? `.launch/metadata.json hoort bij "${upload.name}" (${upload.symbol}), token.config.ts zegt "${config.name.trim()}" (${config.symbol.trim()}). Draai metadata:upload opnieuw.`
        : null;
    return { uri: upload.metadataUri, source: "upload", mismatch };
  }
  return { uri: null, source: "none", mismatch: null };
}
