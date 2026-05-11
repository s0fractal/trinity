(module
  (memory (export "memory") 1)
  (func (export "apply") (param i32 i32 i32) (result i32)
    (drop (f32.const 1.0))
    (local.get 1)))

