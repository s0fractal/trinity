;; spore-execute-v0 :: trap_oob mutator
;;
;; Reads from memory offset 1_000_000 — well beyond the single
;; 64 KiB page declared by the memory section. Tests: out-of-bounds
;; memory access trap.

(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    (i32.load (i32.const 1000000))))
