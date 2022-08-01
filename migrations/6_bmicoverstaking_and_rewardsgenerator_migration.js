const { bsc, mainnet, polygon } = require("./helpers/AddressCatalog.js");
const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const RewardsGenerator = artifacts.require("RewardsGenerator");

let bmiTreasury;

module.exports = async (deployer, network, accounts) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(BMICoverStaking);
  const bmiCoverStaking = await BMICoverStaking.deployed();

  await deployer.deploy(BMICoverStakingView);
  const bmiCoverStakingView = await BMICoverStakingView.deployed();

  await deployer.deploy(RewardsGenerator);
  const rewardsGenerator = await RewardsGenerator.deployed();

  if (["mainnet"].includes(network)) {
    bmiTreasury = mainnet.bmi_treasury;
  } else if (["bsc_mainnet"].includes(network)) {
    bmiTreasury = bsc.bmi_treasury;
  } else if (["polygon_mainnet"].includes(network)) {
    bmiTreasury = polygon.bmi_treasury;
  } else bmiTreasury = accounts[0];

  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), bmiTreasury),
    "Add bmiTreasury"
  );

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), bmiCoverStaking.address),
    "AddProxy BMICoverStaking"
  );

  logTransaction(
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      bmiCoverStakingView.address
    ),
    "AddProxy BMICoverStakingView"
  );

  logTransaction(
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      rewardsGenerator.address
    ),
    "AddProxy RewardsGenerator"
  );
};
