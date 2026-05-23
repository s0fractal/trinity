// src/xA502_spore_apply_backend.ts — SPORE Apply Backend Adapter
// position: A/502 → liquid/action/byte02 (pipe execution layer)
// hex_dipole: "00 00 00 00 00 00 59 00"
//   action+executor, bucket A5 (liquid action), sub-byte 02
//
// Derived from liquid/00_core/pipe/spore_apply_backend.ts
// PoC for flat-src naming convention. Path resolution adapted for probe layout.

import {
  dirname,
  fromFileUrl,
  resolve,
} from "https://deno.land/std@0.224.0/path/mod.ts";

/**
 * SPORE Apply Backend Adapter
 *
 * Intercepts deterministic pure mutations and delegates them to the SPORE engine
 * (WASM / native execution). For Era 2080, this acts as the "Empty Center"
 * verification bridge.
 */
export class SporeApplyBackend {
  private static wasmInstance: WebAssembly.Instance | null = null;
  private static wasmMemory: WebAssembly.Memory | null = null;

  public static async loadWasm(): Promise<void> {
    if (this.wasmInstance) return;
    try {
      const currentDir = dirname(fromFileUrl(import.meta.url));
      // NOTE: in real flat-src layout this would resolve via repoPath() or env,
      // not a brittle relative chain. Probe uses ../../../../ because we are
      // probes/liquid-flat-src-v0/src/ instead of liquid/00_core/pipe/.
      const wasmPath = resolve(
        currentDir,
        "../../../../omega/public/v2/omega_v2_core.wasm",
      );

      const wasmBytes = Deno.readFileSync(wasmPath);
      const module = await WebAssembly.compile(wasmBytes);
      this.wasmInstance = await WebAssembly.instantiate(module, { env: {} });

      this.wasmMemory = this.wasmInstance.exports.memory as WebAssembly.Memory;
      console.error(`[SPORE Bridge] omega_v2_core.wasm loaded successfully.`);
    } catch (e) {
      console.warn(`[SPORE Bridge] Failed to load WASM module:`, e);
    }
  }

  /**
   * Delegates the state transition to the SPORE protocol.
   */
  public static async apply(
    mutatorHash: string,
    stateHash: string,
    inputHashes: string[] = [],
  ): Promise<any> {
    await this.loadWasm();

    if (!this.wasmInstance || !this.wasmMemory) {
      throw new Error(
        "[SPORE_DELEGATION_INTERCEPT] Spore runner WASM failed to load.",
      );
    }

    const combinedHashSource = `${mutatorHash}:${stateHash}:${
      inputHashes.join(",")
    }`;
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(combinedHashSource),
    );
    const fingerprint = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    console.error(
      `[SPORE Bridge SIM] protocol=spore.v0 backend=simulation ` +
        `mutator=${mutatorHash.substring(0, 8)}... state=${
          stateHash.substring(0, 8)
        }... ` +
        `fingerprint=${fingerprint.substring(0, 8)}...`,
    );

    return {
      protocol: "spore.v0",
      backend_kind: "simulation",
      simulation: true,
      receipt_kind: "simulated_spore_apply",
      output_hash: fingerprint,
      mutator: mutatorHash,
      state: stateHash,
      note:
        "Not a verified SPORE.v0 receipt. Replace with a real runtime adapter.",
    };
  }
}
