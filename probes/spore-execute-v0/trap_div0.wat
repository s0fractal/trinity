;; spore-execute-v0 :: trap_div0 mutator
;;
;; Triggers WASM integer division by zero trap.
;; Tests: trap signaling at the apply boundary.

(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    (i32.div_u (i32.const 1) (i32.const 0))))
