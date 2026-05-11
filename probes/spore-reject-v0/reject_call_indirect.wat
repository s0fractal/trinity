(module
  (type $t (func (result i32)))
  (table 1 funcref)
  (elem (i32.const 0) $target)
  (memory (export "memory") 1)
  (func $target (type $t) (i32.const 7))
  (func (export "apply") (param i32 i32 i32) (result i32)
    (drop (call_indirect (type $t) (i32.const 0)))
    (local.get 1)))

