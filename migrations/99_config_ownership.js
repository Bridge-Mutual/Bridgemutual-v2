const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const BMICoverStaking = artifacts.require("BMICoverStaking");
const RewardsGenerator = artifacts.require("RewardsGenerator");

const BMIStaking = artifacts.require("BMIStaking");

const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMining = artifacts.require("LiquidityMining");

const CapitalPool = artifacts.require("CapitalPool");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const UserLeveragePool = artifacts.require("UserLeveragePool");

const LiquidityMiningStakingETH = artifacts.require("LiquidityMiningStakingETH");
const LiquidityMiningStakingUSDT = artifacts.require("LiquidityMiningStakingUSDT");

const ReinsurancePool = artifacts.require("ReinsurancePool");

const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const AaveProtocol = artifacts.require("AaveProtocol");
const CompoundProtocol = artifacts.require("CompoundProtocol");
const YearnProtocol = artifacts.require("YearnProtocol");
const YieldGenerator = artifacts.require("YieldGenerator");
const NFTStaking = artifacts.require("NFTStaking");
const ShieldMining = artifacts.require("ShieldMining");

// TODO validate finality of data below
//const ownerAddress = "0xc97773E1Df2cC54e51a005DFF7cBBb6480aE2767"; // Mike's address
const ownerAddress = "0xB98C1Fb3d404e983bc2dEAbCAd5E18B93a10E839"; // Carlos's address
//const ownerAddress = "0xaa5e721A6a8B1F61e5976a30B908D7F7f0798677"; // Amr's address
const contractRegistryAddress = "0xdbD45F257581c0C9d7f34B66057c60920C426073";

module.exports = async (deployer, network, accounts) => {
  //const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);
  const contractsRegistry = await ContractsRegistry.at(contractRegistryAddress);

  if (["mainnet", "bsc_mainnet", "polygon_mainnet", "rinkeby"].includes(network)) {
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());

    const bmiStaking = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());

    const bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());
    const liquidityMining = await LiquidityMining.at(await contractsRegistry.getLiquidityMiningContract());

    const liquidityMiningStakingETH = await LiquidityMiningStakingETH.at(
      await contractsRegistry.getLiquidityMiningStakingETHContract()
    );

    const liquidityMiningStakingUSDT = await LiquidityMiningStakingUSDT.at(
      await contractsRegistry.getLiquidityMiningStakingUSDTContract()
    );

    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());

    const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());

    const capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());

    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());

    const aaveProtocol = await AaveProtocol.at(await contractsRegistry.getAaveProtocolContract());
    const compoundProtocol = await CompoundProtocol.at(await contractsRegistry.getCompoundProtocolContract());
    const yearnProtocol = await YearnProtocol.at(await contractsRegistry.getYearnProtocolContract());

    const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());

    ////////////////////////////////////////////////////////////

    console.log();

    logTransaction(await bmiCoverStaking.transferOwnership(ownerAddress), "Ownership BMICoverStaking");
    logTransaction(await rewardsGenerator.transferOwnership(ownerAddress), "Ownership RewardsGenerator");

    logTransaction(await bmiStaking.transferOwnership(ownerAddress), "Ownership BMIStaking");

    logTransaction(await bmiUtilityNFT.transferOwnership(ownerAddress), "Ownership BMIUtilityNFT");
    logTransaction(await liquidityMining.transferOwnership(ownerAddress), "Ownership LiquidityMining");

    logTransaction(
      await liquidityMiningStakingETH.transferOwnership(ownerAddress),
      "Ownership LiquidityMiningStakingETH"
    );

    logTransaction(
      await liquidityMiningStakingUSDT.transferOwnership(ownerAddress),
      "Ownership LiquidityMiningStakingUSDT"
    );

    logTransaction(await reinsurancePool.transferOwnership(ownerAddress), "Ownership ReinsurancePool");

    logTransaction(await policyBookAdmin.transferOwnership(ownerAddress), "Ownership PolicyBookAdmin");

    logTransaction(await capitalPool.transferOwnership(ownerAddress), "Ownership CapitalPool");

    logTransaction(await policyBookFabric.transferOwnership(ownerAddress), "Ownership PolicyBookFabric");

    logTransaction(await aaveProtocol.transferOwnership(ownerAddress), "Ownership aaveProtocol");

    logTransaction(await compoundProtocol.transferOwnership(ownerAddress), "Ownership compoundProtocol");

    logTransaction(await yearnProtocol.transferOwnership(ownerAddress), "Ownership yearnProtocol");

    logTransaction(await yieldGenerator.transferOwnership(ownerAddress), "Ownership yieldGenerator");

    logTransaction(await shieldMining.transferOwnership(ownerAddress), "Ownership shieldMining");

    logTransaction(await nftStaking.transferOwnership(ownerAddress), "Ownership nftStaking");

    ////////////////////////////////////////////////////////////

    console.log();

    logTransaction(
      await contractsRegistry.grantRole(await contractsRegistry.REGISTRY_ADMIN_ROLE(), ownerAddress),
      "Granting admin role of ContractsRegistry"
    );

    logTransaction(
      await contractsRegistry.renounceRole(await contractsRegistry.REGISTRY_ADMIN_ROLE(), accounts[0]),
      "Renouncing deployer's admin role of ContractsRegistry"
    );
  }
};
