#!/bin/bash

# Usage: migrationPacing <networkName>
#
# Script that attempts to help better control the transaction rate during a new
# deployment. And provides step and script information on failure
# Public RPC's usually not supports the tx intensive process of deploying BMI


set -e # abort on first error

# Migration sequence
# 1_initial_migration.js
# 2_contracts_registry_migration.js
# 3_token_migration.js
# 4_registry_migration.js
# 5_uniswap_info_migration.js
# 6_bmicoverstaking_and_rewardsgenerator_migration.js
# 7_bmistaking_migration.js
# 8_liquiditymining_migration.js
# 9_liquidity_mining_staking_migration.js
# 10_claimvoting_migration.js
# 11_policy_books_fabric_migration.js
# 12_liquidity_mining_staking_USDT_migration.js
# 13_nft_staking_migration.js
# 14_yield_generator_migration.js
# 90_init_all.js
# 91_policybooks_migration.js
# 97_config_uniswap.js
# 98_config_rewards.js
# 99_config_ownership.js

[ "$#" -eq 1 ] || (echo -e "Network must be indicateed explicitly e.g. :\n$ migrationPacing.sh development\n" && exit 2)

networkName=$1
intervalPause=1

set -x # show commands s they run
set -e # bail when error detected

npx truffle compile
npx truffle migrate  --f 1 --to 1 --reset  --network $networkName                2>&1 | tee -a $networkName.env.out
npx truffle migrate  --f 2 --to 2          --network $networkName                2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota

npx truffle migrate  --f 3 --to 3          --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
npx truffle migrate  --f 4 --to 4          --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota

npx truffle migrate  --f 5 --to 5          --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
npx truffle migrate  --f 6 --to 6          --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota

npx truffle migrate  --f 7 --to 7          --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
npx truffle migrate  --f 8 --to 8          --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota

npx truffle migrate  --f 9 --to 9          --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
npx truffle migrate  --f 10 --to 10          --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota

npx truffle migrate  --f 11 --to 11         --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota

npx truffle migrate  --f 12 --to 12         --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
npx truffle migrate  --f 13 --to 13         --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota

npx truffle migrate  --f 14 --to 14         --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
npx truffle migrate  --f 90 --to 90         --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota

npx truffle migrate  --f 91 --to 91       --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
npx truffle migrate  --f 97 --to 97       --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota
npx truffle migrate  --f 98 --to 98       --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
npx truffle migrate  --f 99 --to 99       --network $networkName --compile-none 2>&1 | tee -a $networkName.env.out
sleep $intervalPause # Prevent maxing out the rpc client quota


cp $networkName.env.out build/
npx truffle-export-abi

echo "Abi file generated"
zip -r ContractAbis_$(date '+%Y-%m-%d_%s').zip build/ > /dev/null

echo "ContractAbis_$(date '+%Y-%m-%d_%s').zip"
