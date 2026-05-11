;; spore-execute-v0 :: trap_unreachable mutator
;;
;; Executes the WASM `unreachable` instruction immediately.
;; Tests: unconditional trap.

(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    unreachable))
