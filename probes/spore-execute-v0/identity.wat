;; spore-execute-v0 :: identity mutator
;;
;; ABI per ../SPEC.md:
;;   apply(in_ptr, in_len, out_ptr) -> out_len
;; Copies in_len bytes from in_ptr to out_ptr, returns in_len.
;; Output bytes therefore equal input bytes; this is the simplest
;; possible basis mutator.

(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    (memory.copy (local.get $out_ptr) (local.get $in_ptr) (local.get $in_len))
    (local.get $in_len)))
