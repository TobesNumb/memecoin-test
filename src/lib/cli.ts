import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { parseArgs } from "node:util";

export interface CliFlags {
  network: string | undefined;
  confirm: boolean;
  dryRun: boolean;
  uri: string | undefined;
  allowDeadLinks: boolean;
  help: boolean;
}

/** Parseert de command-line-flags die de scripts gebruiken. Onbekende flags geven een fout. */
export function parseFlags(argv: string[] = process.argv.slice(2)): CliFlags {
  const { values } = parseArgs({
    args: argv,
    options: {
      network: { type: "string" },
      confirm: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      uri: { type: "string" },
      "allow-dead-links": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  return {
    network: values.network,
    confirm: values.confirm,
    dryRun: values["dry-run"],
    uri: values.uri,
    allowDeadLinks: values["allow-dead-links"],
    help: values.help,
  };
}

/** Stelt een vraag in de terminal; alleen het letterlijke antwoord "ja" telt als ja. */
export async function askYes(question: string): Promise<boolean> {
  if (!stdin.isTTY) {
    warn("Geen interactieve terminal: de ja/nee-vraag kan niet gesteld worden. Geannuleerd.");
    return false;
  }
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(`${question} [typ "ja" om door te gaan] `)).trim();
    return answer === "ja";
  } finally {
    rl.close();
  }
}

export function heading(text: string): void {
  console.log(`\n=== ${text} ===`);
}

export function kv(label: string, value: string | number | boolean): void {
  console.log(`${label.padEnd(22)} ${String(value)}`);
}

export function info(text: string): void {
  console.log(text);
}

export function warn(text: string): void {
  console.warn(`! ${text}`);
}

export function fail(text: string, code = 1): never {
  console.error(`\nFOUT: ${text}`);
  process.exit(code);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Voert een script uit en zet onverwachte fouten om in een nette foutmelding. */
export function runScript(main: () => Promise<void>): void {
  main().catch((error: unknown) => {
    fail(errorMessage(error));
  });
}
