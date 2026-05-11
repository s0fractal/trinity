;; spore-execute-v0 :: nop mutator
;;
;; Returns out_len = 0 immediately. Smallest possible mutator. Used
;; as the ATP/fuel baseline: fuel cost of nop ≈ C_apply_base.

(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    (i32.const 0)))
