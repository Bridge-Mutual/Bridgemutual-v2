docker run --rm -v $(pwd):/repo ethereum/solc:$1 \
  --abi \
  --bin \
  --allow-paths /repo \
  --optimize --optimize-runs 1 \
  --output-dir /repo/build/contracts/abi --overwrite \
  @openzeppelin=/repo/node_modules/@openzeppelin \
  @uniswap=/repo/node_modules/@uniswap \
  /repo/$2 # contracts/interfaces/shield_mining/IShieldMiningView.sol
