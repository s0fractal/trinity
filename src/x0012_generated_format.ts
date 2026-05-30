// src/x0012_generated_format.ts — shared formatter helper for generated files
// maturity: active
// skill_safe: yes-readonly
// Coordinate 0012 = void/primitives → singular → singular → mirror (formatting primitive).
// Centralizes call to deno fmt so generators do not duplicate Deno Command logic.

export async function formatGeneratedFile(path: string): Promise<void> {
  const proc = new Deno.Command(Deno.execPath(), {
    args: ["fmt", path],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stderr } = await proc.output();
  if (code !== 0) {
    const errText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to format file ${path}: ${errText}`);
  }
}
