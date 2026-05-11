;; spore-execute-v0 :: xor_5c mutator
;;
;; out[i] = in[i] XOR 0x5C for all i in 0..in_len.
;; Tests: loop, i32.load8_u, i32.xor, i32.store8, i32.add, i32.ge_u.
;; out_len = in_len.

(module
  (memory (export "memory") 1)
  (func (export "apply")
    (param $in_ptr i32) (param $in_len i32) (param $out_ptr i32)
    (result i32)
    (local $i i32)
    (block $exit
      (loop $loop
        (br_if $exit (i32.ge_u (local.get $i) (local.get $in_len)))
        (i32.store8
          (i32.add (local.get $out_ptr) (local.get $i))
          (i32.xor
            (i32.load8_u (i32.add (local.get $in_ptr) (local.get $i)))
            (i32.const 0x5C)))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)))
    (local.get $in_len)))
