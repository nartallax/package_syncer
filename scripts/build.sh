#!/usr/bin/env bash

set -e
cd `dirname "$0"`
cd ..

rm -rf target
./node_modules/.bin/imploder --tsconfig tsconfig.json

echo "#!/usr/bin/env node" > ./target/result.js
cat ./target/package_syncer.js >> ./target/result.js
mv ./target/result.js ./target/package_syncer.js
chmod +x ./target/package_syncer.js