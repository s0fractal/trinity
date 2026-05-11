;; spore-execute-v0 :: sum_bytes mutator
;;
;; out = little-endian i32(sum of all input bytes treated as u8).
;; Tests: loop, i32.load8_u, i32.add accumulator, i32 store, variable
;;        output length (4 regardless of input length).
;; out_len = 4.

(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    (local $i i32)
    (local $sum i32)
    (block $exit
      (loop $loop
        (br_if $exit (i32.ge_u (local.get $i) (local.get $in_len)))
        (local.set $sum
          (i32.add
            (local.get $sum)
            (i32.load8_u (i32.add (local.get $in_ptr) (local.get $i)))))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)))
    (i32.store (local.get $out_ptr) (local.get $sum))
    (i32.const 4)))
