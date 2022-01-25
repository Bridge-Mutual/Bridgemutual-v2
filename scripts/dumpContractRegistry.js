/*
 *  Trace user actions through the platform
 *
 *  Usage:
 *  truffle exec scripts/dumpContractRegistry.js [ --network development ]
 */

const fs = require("fs");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyBook = artifacts.require("PolicyBook");

const tProxyImplementationStorageSloth = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const tProxyAdminStorageSloth = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

const ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;

let defaultRegistryAddresses = {
  mainnet: "0x8050c5a46FC224E3BCfa5D7B7cBacB1e4010118d",
  rinkeby: "0x6CA9c8F505d7fD16C7a3bAf908FE1E4C7535D4f6",
  development: "0x56BEf90df3A321cCC993315a9225bBC2F949008a",
};

let selected_network = "development";

if (process.argv.includes("--network")) {
  network_arg = process.argv.indexOf("--network");
  selected_network = process.argv[network_arg + 1];
}

let deployedContracts = [];
let listPolicies = false;

const contractRegistryAddress = defaultRegistryAddresses[selected_network];
let policyBookRegistryAddress = "";

console.log("Network : ", selected_network);
console.log("ContractRegistry : ", contractRegistryAddress);
console.log(" ======== ");

module.exports = async (deployer, network, accounts) => {
  const contractsRegistry = await ContractsRegistry.at(contractRegistryAddress);

  let contractCounter = 0;

  for (const [key, functionCall] of Object.entries(contractsRegistry.methods)) {
    if (!key.match(/^get.*Contract()/) || key == "getContract(bytes32)") {
      continue;
    }
    if (key === "getContract") {
      continue;
    }

    methodName = key.replace("()", "");
    contractName = methodName.replace(/^get/, "").replace(/Contract$/, "");

    let contractAddress = ZERO_ADDRESS;
    let contractImplementation = null;
    let contractAdmin = null;

    try {
      /* eslint-disable indent */

      contractAddress = await functionCall.call();
      contractImplementation = await web3.eth.getStorageAt(contractAddress, tProxyImplementationStorageSloth);
      contractAdmin = await web3.eth.getStorageAt(contractAddress, tProxyAdminStorageSloth);
      if (contractName == "PolicyBookRegistry") {
        listPolicies = true;
        policyBookRegistryAddress = contractAddress;
      }
    } catch (e) {
      console.log("Reverting call:", key);
      console.log("ERR: " + contractName + " = " + methodName);
      continue;
    }
    let tuple = {
      name: contractName,
      address: contractAddress,
      implementation: contractImplementation.replace(/^0x000000000000000000000000/, "0x"),
      admin: contractAdmin.replace(/^0x000000000000000000000000/, "0x"),
    };

    deployedContracts.push(tuple);
  }

  console.table(deployedContracts);

  let output = "";
  for (let j = 0; j < deployedContracts.length; j++) {
    let res = deployedContracts[j];
    output += `${res.name}: network: ${selected_network}, address: ${res.address} `;
    output += `implementation: ${res.implementation}`;
    output += "\n";
  }

  await fs.writeFileSync(`.${selected_network}.filterererr.cache`, output);

  if (listPolicies) {
    let policies = [];
    let policyData = [];
    let policyBookRegistry = await PolicyBookRegistry.at(policyBookRegistryAddress);
    let policyBook = null;

    let policyList = await policyBookRegistry.list(0, 100);

    console.table(policyList);
  }
  process.exit(0);
};
