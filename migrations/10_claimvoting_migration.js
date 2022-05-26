const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const ClaimVoting = artifacts.require("ClaimVoting");
const ReputationSystem = artifacts.require("ReputationSystem");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const CapitalPool = artifacts.require("CapitalPool");
const StkBMIStaking = artifacts.require("StkBMIStaking");

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(ClaimVoting);
  const claimVoting = await ClaimVoting.deployed();

  await deployer.deploy(ReputationSystem);
  const reputationSystem = await ReputationSystem.deployed();

  await deployer.deploy(StkBMIStaking);
  const stkBMIStaking = await StkBMIStaking.deployed();

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.CLAIM_VOTING_NAME(), claimVoting.address),
    "AddProxy ClaimVoting"
  );
  logTransaction(
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REPUTATION_SYSTEM_NAME(),
      reputationSystem.address
    ),
    "AddProxy ReputationSystem"
  );

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_STAKING_NAME(), stkBMIStaking.address),
    "AddProxy StkBMIStaking"
  );
};
