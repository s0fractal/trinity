import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidFqdnPrefix, isValidSha256Hex } from "./x4010_hash.ts";

Deno.test("x4010_hash - isValidFqdnPrefix", () => {
  assert(isValidFqdnPrefix("h.e3b0c44298fc"));
  assert(isValidFqdnPrefix("h.000000000000"));
  assert(isValidFqdnPrefix("h.1a2b3c4d5e6f"));
  assert(isValidFqdnPrefix("h.ffffff999999"));

  assertEquals(isValidFqdnPrefix(""), false);
  assertEquals(isValidFqdnPrefix("h.e3b"), false);
  assertEquals(isValidFqdnPrefix("h.e3b0c44298f"), false);
  assertEquals(isValidFqdnPrefix("h.e3b0c44298fca"), false);
  assertEquals(isValidFqdnPrefix("h.E3B0C44298FC"), false);
  assertEquals(isValidFqdnPrefix("h.e3b0c44298fg"), false);
  assertEquals(isValidFqdnPrefix("e3b0c44298fc"), false);
  assertEquals(isValidFqdnPrefix("h.e3b0c44298fc\n"), false);
  assertEquals(isValidFqdnPrefix(" h.e3b0c44298fc"), false);
  assertEquals(isValidFqdnPrefix("h.e3b0c44298fc "), false);
});

Deno.test("x4010_hash - isValidSha256Hex", () => {
  const validHash =
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const upperHash =
    "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855";
  const allZeros =
    "0000000000000000000000000000000000000000000000000000000000000000";

  assert(isValidSha256Hex(validHash));
  assert(isValidSha256Hex(allZeros));

  assertEquals(isValidSha256Hex(""), false);
  assertEquals(isValidSha256Hex(upperHash), false);
  assertEquals(isValidSha256Hex(validHash.slice(0, 63)), false);
  assertEquals(isValidSha256Hex(validHash + "a"), false);
  assertEquals(isValidSha256Hex(validHash.replace("c", "g")), false);
  assertEquals(isValidSha256Hex(" " + validHash), false);
  assertEquals(isValidSha256Hex(validHash + " "), false);
});
