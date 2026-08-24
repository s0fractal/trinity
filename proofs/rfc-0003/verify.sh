#!/bin/sh
# Elaborate the kernel and run the guard. Exits non-zero on any failure.
set -eu
cd "$(dirname "$0")"

mkdir -p .build/HSP
lean HSP/TransformKind.lean -o .build/HSP/TransformKind.olean
lean HSP/LossProfile.lean   -o .build/HSP/LossProfile.olean
lean HSP/Suitability.lean   -o .build/HSP/Suitability.olean
LEAN_PATH=.build lean HSP/Counterexamples.lean

python3 proof_guard.py
