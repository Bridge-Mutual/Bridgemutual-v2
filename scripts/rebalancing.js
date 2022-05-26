/*
 *  Trace user actions through the platform
 *
 *  Usage:
 *  truffle exec scripts/rebalancing.js [ --network development ]
 */

console.log("> start");

const ContractsRegistry = artifacts.require("ContractsRegistry");
const CapitalPool = artifacts.require("CapitalPool");
require("dotenv").config();

let defaultRegistryAddresses = {
  mainnet_maintainer: "0x45269F7e69EE636067835e0DfDd597214A1de6ea",
  mainnetfork: "0x45269F7e69EE636067835e0DfDd597214A1de6ea",
  rinkeby_maintainer: "0x38DE74c5AC7D2A3bC81E566Ee318fdedB4a8E1F1",
  development: "0x8BdD79Df50e5478E65f1c643d486d27CbD3619B0",
};

let selected_network = "development";

if (process.argv.includes("--network")) {
  network_arg = process.argv.indexOf("--network");
  selected_network = process.argv[network_arg + 1];
}

const contractRegistryAddress = defaultRegistryAddresses[selected_network];

console.log("> using network", selected_network);
console.log("> contract Registry", contractRegistryAddress);

async function estimateGasPrice(threshold) {
  let currentGasPrice = await web3.eth.getGasPrice();

  console.log("currentGasPrice : ", currentGasPrice);

  // console.log('currentGasPrice : ', currentGasPrice, currentGasPrice/1000000000)
  let gasWithPremium = parseInt(currentGasPrice * 1.1);

  if (gasWithPremium > threshold) {
    return threshold;
  }

  return gasWithPremium;
}

module.exports = async (deployer, network, accounts) => {
  const contractsRegistry = await ContractsRegistry.at(contractRegistryAddress);
  console.log("Fetching CapitalPool Addresses : ");
  const capitalPoolAddress = await contractsRegistry.getCapitalPoolContract.call();
  const capitalPool = await CapitalPool.at(capitalPoolAddress);

  console.log("> Sending to CapitalPool", capitalPool.address);

  let tx = null;
  let txHash = "";
  let txCount = await web3.eth.getTransactionCount("0xc910BaE4B0a32c35b09F1ca26f42111BC54136DE");
  let txPendingCount = await web3.eth.getTransactionCount("0xc910BaE4B0a32c35b09F1ca26f42111BC54136DE", "pending");
  console.log("accounts : ", accounts);
  console.log("accounts : ", deployer);
  console.log("accounts : ", network);
  console.log("txCount : ", txCount);
  console.log("txPendingCount : ", txPendingCount);

  try {
    console.log(await capitalPool.rebalanceLiquidityCushion.request());
    console.log("Submitting: ");
    let useGasPrice = await estimateGasPrice(130000000000); //130
    console.log("used gas price", useGasPrice);

    tx = await capitalPool.rebalanceLiquidityCushion({ nonce: txCount, gasPrice: useGasPrice });
    txHash = tx.tx;
  } catch (e) {
    console.log("Failed transaction :", txHash);
    console.log("tx object : ", tx);
    console.log(e);
    process.exit(1);
  }

  console.log("tx :", tx.tx);

  process.exit(0);
};
