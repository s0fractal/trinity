/** Minimal process adapter used by the AgentSeal → Warrant example. */
export function checkedWarrantOutput(
  args: string[],
  result: { code: number; stdout: Uint8Array; stderr: Uint8Array },
): string {
  const decoder = new TextDecoder();
  const out = decoder.decode(result.stdout).trim();
  const err = decoder.decode(result.stderr).trim();
  if (result.code !== 0) {
    throw new Error(
      `warrant ${args.join(" ")} failed (${result.code}): ${err || out}`,
    );
  }
  return out || err;
}

export async function runWarrant(
  binary: string,
  store: string,
  args: string[],
): Promise<string> {
  const result = await new Deno.Command(binary, {
    args: ["--store", store, ...args],
    stdout: "piped",
    stderr: "piped",
  }).output();
  return checkedWarrantOutput(args, result);
}
