/*
 *  Trace user actions through the platform
 *
 *  Usage:
 *  truffle exec scripts/rebalancing.js [ --network development ]
 */

const ContractsRegistry = artifacts.require("ContractsRegistry");
const CapitalPool = artifacts.require("CapitalPool");
require("dotenv").config();

let defaultRegistryAddresses = {
  mainnet_maintainer: "0x8050c5a46FC224E3BCfa5D7B7cBacB1e4010118d",
  rinkeby_mainter: "0x18D3489229A6eCB1064Ec15C1C49f44869dEF7E5",
  development: "0x56BEf90df3A321cCC993315a9225bBC2F949008a",
};

let selected_network = "development";

if (process.argv.includes("--network")) {
  network_arg = process.argv.indexOf("--network");
  selected_network = process.argv[network_arg + 1];
}

module.exports = async (deployer, network, accounts) => {
  const currentBlock = await web3.eth.getBlock("latest");
  const currentTime = currentBlock.timestamp;

  const contractRegistryAddress = defaultRegistryAddresses[selected_network];

  const contractsRegistry = await ContractsRegistry.at(contractRegistryAddress);
  const capitalPoolAddress = await contractsRegistry.getCapitalPoolContract();
  const capitalPool = await CapitalPool.at(capitalPoolAddress);

  console.log(await capitalPool.getPastEvents("LiquidityCushionLocked"));

  let tx = null;

  try {
    tx = await capitalPool.rebalanceLiquidityCushion();
  } catch (e) {
    console.log(e);
  }

  let eventleft = await capitalPool.getPastEvents("LiquidityCushionLocked");

  console.log("event : ", eventleft);

  process.exit(0);
};
