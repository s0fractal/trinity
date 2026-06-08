import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  Chord,
  VoiceProfile,
  isReferenceMatch,
  renderVoiceMemory,
} from "./x8A00_voice_memory_gen.ts";

const MOCK_PROPOSAL: Chord = {
  filename: "x7700_952000_claude_proposal-to-refactor.myc.md",
  rel_path: "src/x7700_952000_claude_proposal-to-refactor.myc.md",
  sort_key: 1000,
  voice: "claude",
  topic: "proposal-to-refactor",
  mode: "proposal",
  stance: "PROPOSE",
  bucket_coord: "7700",
  source_hash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  source_size: 100,
  closes: null,
  closes_hash: null,
  hears: null,
  references: null,
  body: "# Proposal to refactor\nThis is a mock proposal.",
};

Deno.test("isReferenceMatch - exact filename matches", () => {
  const candidate: Chord = {
    ...MOCK_PROPOSAL,
    filename: "x7700_952010_gemini_aye-to-refactor.myc.md",
    rel_path: "src/x7700_952010_gemini_aye-to-refactor.myc.md",
    mode: "cowitness",
    stance: "AYE",
    hears: ["x7700_952000_claude_proposal-to-refactor.myc.md"],
  };
  assert(isReferenceMatch(candidate, MOCK_PROPOSAL));
});

Deno.test("isReferenceMatch - stem matches", () => {
  const candidate: Chord = {
    ...MOCK_PROPOSAL,
    filename: "x7700_952010_gemini_aye-to-refactor.myc.md",
    rel_path: "src/x7700_952010_gemini_aye-to-refactor.myc.md",
    mode: "cowitness",
    stance: "AYE",
    references: ["x7700_952000_claude_proposal-to-refactor"],
  };
  assert(isReferenceMatch(candidate, MOCK_PROPOSAL));
});

Deno.test("isReferenceMatch - hash matches", () => {
  const candidate: Chord = {
    ...MOCK_PROPOSAL,
    filename: "x7700_952010_gemini_aye-to-refactor.myc.md",
    rel_path: "src/x7700_952010_gemini_aye-to-refactor.myc.md",
    mode: "cowitness",
    stance: "AYE",
    closes_hash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  };
  assert(isReferenceMatch(candidate, MOCK_PROPOSAL));
});

Deno.test("isReferenceMatch - closes path_hint object matches", () => {
  const candidate: Chord = {
    ...MOCK_PROPOSAL,
    filename: "x7700_952015_claude_receipt-to-refactor.myc.md",
    rel_path: "src/x7700_952015_claude_receipt-to-refactor.myc.md",
    mode: "receipt",
    stance: "RECEIPT",
    closes: {
      path_hint: "x7700_952000_claude_proposal-to-refactor.myc.md",
      relation: "implements",
    },
  };
  assert(isReferenceMatch(candidate, MOCK_PROPOSAL));
});

Deno.test("isReferenceMatch - fallback body word matches", () => {
  const candidate: Chord = {
    ...MOCK_PROPOSAL,
    filename: "x7700_952010_gemini_aye-to-refactor.myc.md",
    rel_path: "src/x7700_952010_gemini_aye-to-refactor.myc.md",
    mode: "cowitness",
    stance: "AYE",
    body: "We approve the changes proposed in x7700_952000_claude_proposal-to-refactor. Excellent design.",
  };
  assert(isReferenceMatch(candidate, MOCK_PROPOSAL));
});

Deno.test("isReferenceMatch - self reference ignored", () => {
  assert(!isReferenceMatch(MOCK_PROPOSAL, MOCK_PROPOSAL));
});

Deno.test("renderVoiceMemory - visual elements rendered correct", () => {
  const voice: VoiceProfile = {
    filename: "x8A10_voice_claude.myc.json",
    rel_path: "src/x8A10_voice_claude.myc.json",
    identity: "claude-opus-4-7",
    key: "claude",
    handles: ["claude"],
    source_hash: "123",
    source_size: 10,
  };

  const receipt: Chord = {
    filename: "x7700_952015_claude_receipt-to-refactor.myc.md",
    rel_path: "src/x7700_952015_claude_receipt-to-refactor.myc.md",
    sort_key: 1005,
    voice: "claude",
    topic: "receipt-to-refactor",
    mode: "receipt",
    stance: "RECEIPT",
    bucket_coord: "7700",
    source_hash: "234",
    source_size: 100,
    closes: "x7700_952000_claude_proposal-to-refactor",
    closes_hash: null,
    hears: null,
    references: null,
    body: "Closes the proposal.",
  };

  const cowitness: Chord = {
    filename: "x7700_952010_gemini_aye-to-refactor.myc.md",
    rel_path: "src/x7700_952010_gemini_aye-to-refactor.myc.md",
    sort_key: 1002,
    voice: "gemini",
    topic: "aye-to-refactor",
    mode: "cowitness",
    stance: "AYE",
    bucket_coord: "7700",
    source_hash: "345",
    source_size: 100,
    closes: null,
    closes_hash: null,
    hears: ["x7700_952000_claude_proposal-to-refactor"],
    references: null,
    body: "Aye.",
  };

  const output = renderVoiceMemory(
    voice,
    [MOCK_PROPOSAL, receipt],
    { generated_at: null, manifest_hash: "hash", source_files: 2 },
    [MOCK_PROPOSAL, cowitness, receipt]
  );

  // Assertions
  assert(output.includes("Closed by [`x7700_952015_claude_receipt-to-refactor.myc.md`](./x7700_952015_claude_receipt-to-refactor.myc.md)"));
  assert(output.includes("- **gemini**: [AYE](./x7700_952010_gemini_aye-to-refactor.myc.md)"));
});
