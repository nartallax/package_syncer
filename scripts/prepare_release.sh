#!/usr/bin/env bash

set -e
cd `dirname "$0"`
cd ..

./scripts/build.sh

cp README.md ./target/
cp LICENSE ./target/
cp package.json ./target/