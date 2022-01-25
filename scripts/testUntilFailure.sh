#!/bin/bash

# Usage: migrationPacing <max_amount_of_retries>
#
# Script that keeps running the unit test suite until it passes or the
# maximium amount of test tries is reached, some rounding issues prevent
# testing to run consistently.

max_retries=${1:-3}
export PATH="./node_modules/.bin:$PATH"

timestamp=$(date +%s);

restartGanacheIfRunning() {

  echo "Restarting Ganahce"
  lsof -t -i:8545;
  is_network_running=$?

  if [ $is_network_running -eq 0 ]; then
    kill $(lsof -t -i:8545);
    rm /tmp/tmp-* -rf;
  fi

  npm run private-network-quiet & > /dev/null

}

npm run compile || exit 1

for ((x=0; x<$max_retries; x++)); do

  branch_name=$(git branch --show-current);
  branch_reference=${branch_name:0:10};
  test_filename=$branch_reference"_"$timestamp"_"$x".test.out";
  test_filename=$(echo $test_filename | tr / - )

  echo $test_filename

  restartGanacheIfRunning

  truffle test --bail --migrations_directory test --compile-none > $test_filename 2>&1
  success=$?

  if [ $success -eq 0 ]; then
    echo "Success at retry # $x"
    tail -n 20 *.test.out
    exit 0
  fi
done

tail -n 20 *.test.out

echo "Ran out of tries for $timestamp"
exit 1
