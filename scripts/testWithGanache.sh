#!/bin/bash/

# Usage: sh scripts/testWithGanache.sh test/<file_name>.js <DO_COMPILE/COMPILE_NONE>


PID=$(lsof -i:8545 | awk 'NR==2' | awk '{print $2}')
if [ "$PID" != "" ];
then
  echo "killing PID $PID"
  kill -9 $PID
  rm -rf /tmp/tmp-* &
fi

ganache-cli \
  --chainId 99999 \
  --quiet &

if [ "$2" = "DO_COMPILE" ];
then
  echo "WILL COMPILE!"
  truffle test $1 \
    --network development \
    --stacktrace-extra \
    --migrations_directory none # a hack to skip migrations
elif [ "$2" = "COMPILE_NONE" ];
then
  echo "$2"
  truffle test $1 \
    --network development \
    --stacktrace-extra \
    --migrations_directory none \
    --compile-none # skip compilation step
else
  exit 0
fi

exit 1