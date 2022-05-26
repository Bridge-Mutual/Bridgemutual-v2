const BigNumber = require("bignumber.js");
const { time } = require("@openzeppelin/test-helpers");

function toBN(number) {
  return new BigNumber(number);
}
const wei = web3.utils.toWei;

const Networks = {
  ETH: 0,
  BSC: 1,
  POL: 2,
};
let network;

async function setTetherAllowance(spender, amount, holder, stblContract) {
  let currentAllowance = BigNumber(await stblContract.allowance(holder, spender));

  if (!BigNumber.isBigNumber(amount)) {
    amount = BigNumber(amount);
  }

  if (amount.isGreaterThan(currentAllowance)) {
    if (!currentAllowance.eq(0)) {
      await stblContract.approve(spender, 0, { from: holder });
    }

    await stblContract.approve(spender, amount, { from: holder });
  }
}

function sortByKey(listObject) {
  let result = {};
  result = Object.keys(listObject)
    .sort()
    .reduce((obj, key) => {
      obj[key] = listObject[key];
      return obj;
    }, {});

  return result;
}

async function getRegisteredContracts(registryContract, filter = "all") {
  let contractList = [];
  let unregisterList = [];
  let keyNames = [];
  for (const [key, functionCall] of Object.entries(registryContract.methods)) {
    if (key.match(/.*_NAME\(\)/)) {
      keyNames[key] = await functionCall.call();
    }

    if (key.match(/^get.*Contract\(\)/)) {
      contractName = key.replace(/^get/, "");
      contractName = contractName.replace(/Contract()$/, "");

      try {
        contractAddress = await functionCall.call();
        contractList[contractName] = contractAddress;
      } catch (e) {
        unregisterList[contractName] = "Missing contract";
      }
    }
  }

  let result = [];

  if (filter == "missing") {
    result["missing"] = sortByKey(unregisterList);
  }
  if (filter == "added") {
    result["added"] = sortByKey(contractList);
  }
  if (filter == "all") {
    result["added"] = sortByKey(contractList);
    result["missing"] = sortByKey(unregisterList);
  }
  if (filter == "names") {
    result["names"] = sortByKey(keyNames);
  }

  return result;
}

async function setCurrentTime(nbSeconds) {
  let newTime = toBN(await time.latest()).plus(nbSeconds);
  await time.increase(newTime.toString());
}

function getStableAmount(amount) {
  if (network == Networks.ETH || network == Networks.POL) {
    return toBN(wei(amount, "mwei"));
  } else if (network == Networks.BSC) {
    return toBN(wei(amount));
  }
}

async function getNetwork() {
  networkId = await web3.eth.net.getId();
  if (networkId == "80001") {
    network = Networks.ETH;
    return Networks.ETH;
  } else if (networkId == "80002") {
    network = Networks.BSC;
    return Networks.BSC;
  } else if (networkId == "80003") {
    network = Networks.POL;
    return Networks.POL;
  }
}

module.exports = {
  setTetherAllowance,
  getRegisteredContracts,
  setCurrentTime,
  Networks,
  getNetwork,
  getStableAmount,
};
