// 0100 = 0 (void) → 1 (singularity) → 0 → 0
// "primitive registry of singular handles"
//
// coordinate: 0100
// handles: [glossary, lookupHandle]
// rationale: void-bucket primitive that maintains singular identities (1).
//            same-bucket sibling of 0042_dispatch (free direct import).

export interface HandleRecord {
  readonly handle: string;
  readonly coordinate: string;
}

const records = new Map<string, string>();

export function registerHandle(handle: string, coordinate: string): void {
  records.set(handle, coordinate);
}

export function lookupHandle(handle: string): HandleRecord | undefined {
  const coord = records.get(handle);
  return coord ? { handle, coordinate: coord } : undefined;
}
