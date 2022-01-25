async function addContract(contractsRegistry, contractName, contractAddress) {
  await contractsRegistry.addContract(contractName, contractAddress);
}

async function addProxyContract(contractsRegistry, contractName, contractAddress) {
  await contractsRegistry.addProxyContract(contractName, contractAddress);
}

async function injectDependencies(contractsRegistry, contractName) {
  await contractsRegistry.injectDependencies(contractName);
}

async function addContractsFromList(contractsRegistry, contracts) {
  for (let i = 0; i < contracts.length; i++) {
    await addContract(contractsRegistry, contracts[i][0], contracts[i][1]);
  }
}

async function addProxyContractsFromList(contractsRegistry, proxyContracts) {
  for (let i = 0; i < proxyContracts.length; i++) {
    await addProxyContract(contractsRegistry, proxyContracts[i][0], proxyContracts[i][1]);
  }
}

async function injectDependenciesFromList(contractsRegistry, contractAddresses, nameHashes = null) {
  for (let i = 0; i < contractAddresses.length; i++) {
    try {
      await injectDependencies(contractsRegistry, contractAddresses[i]);
    } catch (e) {
      console.log("Dependency indjection faled at : ");
      console.log(i, contractAddresses[i]);

      process.exit(111);
    }
  }
}

module.exports = {
  artifacts,
  addContractsFromList,
  addProxyContractsFromList,
  injectDependenciesFromList,
};
