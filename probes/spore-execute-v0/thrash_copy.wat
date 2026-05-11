;; spore-execute-v0 :: thrash_copy mutator
;;
;; Attempted DoS: loop in_len times, each iteration does
;; memory.copy(32) of fixed-region bytes. Purpose: try to exploit
;; the bulk-memory free-pass if v1 fuel undercharges memory.copy.
;;
;; Under v1: each memory.copy(32) costs 4 + 2×32 = 68 fuel.
;; Plus 3 const operands and 4 increment+br ops = 75 fuel/iter body.
;; Plus exit check 4 fuel × (in_len + 1).
;; Total ≈ 5 (apply) + 2 (block/loop) + 4(N+1) + 75N + 1 ≈ 79N + 12.

(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    (local $i i32)
    (block $exit
      (loop $loop
        (br_if $exit (i32.ge_u (local.get $i) (local.get $in_len)))
        (memory.copy (i32.const 32) (i32.const 0) (i32.const 32))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)))
    (i32.const 0)))
