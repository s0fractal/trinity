(module
  (memory (export "memory") 1)
  (func (export "apply") (param i32 i32 i32) (result i32)
    (drop (memory.grow (i32.const 1)))
    (local.get 1)))

