(module
  (memory (export "memory") 1)
  (func (export "apply") (param i32 i32 i32) (result i32)
    (drop (v128.const i32x4 0 0 0 0))
    (local.get 1)))

