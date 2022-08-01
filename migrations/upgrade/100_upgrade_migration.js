const { toBN } = require("./helpers/utils.js");
const { logTransaction, logAddress } = require("./helpers/logger.js");
const { assert } = require("chai");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const ReputationSystem = artifacts.require("ReputationSystem");
const StkBMIStaking = artifacts.require("StkBMIStaking");
const NFTStaking = artifacts.require("NFTStaking");
const LiquidityMiningStakingETH = artifacts.require("LiquidityMiningStakingETH");
const CapitalPool = artifacts.require("CapitalPool");
const PolicyBook = artifacts.require("PolicyBook");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const PolicyQuote = artifacts.require("PolicyQuote");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const STKBMIToken = artifacts.require("STKBMIToken");

const CompoundProtocol = artifacts.require("CompoundProtocol");
const AaveProtocol = artifacts.require("AaveProtocol");
const YearnProtocol = artifacts.require("YearnProtocol");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const YieldGenerator = artifacts.require("YieldGenerator");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const ClaimVoting = artifacts.require("ClaimVoting");
const BMIStaking = artifacts.require("BMIStaking");
const ShieldMining = artifacts.require("ShieldMining");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const BMICoverStaking = artifacts.require("BMICoverStaking");

const PRECISION = toBN(10).pow(25);
const wei = web3.utils.toWei;

//production
const contractRegistryAddressETH = "0x45269F7e69EE636067835e0DfDd597214A1de6ea";
const contractRegistryAddressBSC = "0xAF7F0F42Fca4ef71279b83837c4150070CB2e35e";
const contractRegistryAddressPOL = "";

// test
const contractRegistryAddressETH_test = "0xab4766480D2bB5786CFD41255FAB5e9628f04e86";
const contractRegistryAddressBSC_test = "0xeEEDAc8F8dC9Dd31c29BBCc7FD8Ac215d56C3d4b";
const contractRegistryAddressPOL_test = "0x8F8FE267DE0a926c2E19EC1990A6fb32a93Dd862";

// owners
const owner1 = "0xc97773e1df2cc54e51a005dff7cbbb6480ae2767"; //Mike
const owner2 = "0xaa5e721A6a8B1F61e5976a30B908D7F7f0798677"; //Amr

let contractRegistryAddress;
let owner;
module.exports = async (deployer, network) => {
  if (["mainnet", "server_fork", "development"].includes(network)) {
    contractRegistryAddress = contractRegistryAddressETH;
    owner = owner1;
  } else if (["bsc_mainnet"].includes(network)) {
    contractRegistryAddress = contractRegistryAddressBSC;
    owner = owner1;
  } else if (["polygon_mainnet"].includes(network)) {
    contractRegistryAddress = contractRegistryAddressPOL;
    owner = owner1;
  }
  if (["ropsten", "rinkeby"].includes(network)) {
    contractRegistryAddress = contractRegistryAddressETH_test;
    owner = owner2;
  } else if (["bsc_test"].includes(network)) {
    contractRegistryAddress = contractRegistryAddressBSC_test;
    owner = owner2;
  } else if (["polygon_test"].includes(network)) {
    contractRegistryAddress = contractRegistryAddressPOL_test;
    owner = owner2;
  }
  const contractsRegistry = await ContractsRegistry.at(contractRegistryAddress);

  // bmiCoverStaking contract
  await deployer.deploy(BMICoverStaking);
  const bmiCoverStaking = await BMICoverStaking.deployed();

  logAddress("bmiCoverStaking", bmiCoverStaking.address);
  logAddress("bmiCoverStakingName", await contractsRegistry.BMI_COVER_STAKING_NAME());

  // bmiCoverStakingVIEW contract
  await deployer.deploy(BMICoverStakingView);
  const bmiCoverStakingView = await BMICoverStakingView.deployed();

  logAddress("bmiCoverStakingView", bmiCoverStakingView.address);
  logAddress("bmiCoverStakingViewName", await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());

  // BMIStaking contract
  await deployer.deploy(BMIStaking);
  const bmiStaking = await BMIStaking.deployed();

  logAddress("bmiStaking", bmiStaking.address);
  logAddress("bmiStakingName", await contractsRegistry.BMI_STAKING_NAME());

  // BMIUtilityNFT contract
  await deployer.deploy(BMIUtilityNFT);
  const bmiUtilityNFT = await BMIUtilityNFT.deployed();

  logAddress("bmiUtilityNFT", bmiUtilityNFT.address);
  logAddress("bmiUtilityNFTName", await contractsRegistry.BMI_UTILITY_NFT_NAME());

  // capitalPool contract
  await deployer.deploy(CapitalPool);
  const capitalPool = await CapitalPool.deployed();

  logAddress("capitalPool", capitalPool.address);
  logAddress("capitalPoolName", await contractsRegistry.CAPITAL_POOL_NAME());

  //claimingRegistry contract
  await deployer.deploy(ClaimingRegistry);
  const claimingRegistry = await ClaimingRegistry.deployed();

  logAddress("claimingRegistry", claimingRegistry.address);
  logAddress("claimingRegistryName", await contractsRegistry.CLAIMING_REGISTRY_NAME());

  //claimVoting contract
  await deployer.deploy(ClaimVoting);
  const claimVoting = await ClaimVoting.deployed();

  logAddress("claimVoting", claimVoting.address);
  logAddress("claimVotingName", await contractsRegistry.CLAIM_VOTING_NAME());

  //LeveragePortfolioView contract
  await deployer.deploy(LeveragePortfolioView);
  const leveragePortfolioView = await LeveragePortfolioView.deployed();

  logAddress("leveragePortfolioView", leveragePortfolioView.address);
  logAddress("leveragePortfolioViewName", await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());

  //LiquidityMiningStakingETH
  await deployer.deploy(LiquidityMiningStakingETH);
  const liquidityMiningStakingETH = await LiquidityMiningStakingETH.deployed();

  logAddress("liquidityMiningStakingETH", liquidityMiningStakingETH.address);
  logAddress("liquidityMiningStakingETHName", await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME());

  //LiquidityRegistry contract
  await deployer.deploy(LiquidityRegistry);
  const liquidityRegistry = await LiquidityRegistry.deployed();

  logAddress("liquidityRegistry", liquidityRegistry.address);
  logAddress("liquidityRegistryName", await contractsRegistry.LIQUIDITY_REGISTRY_NAME());

  // NFT Staking contract
  await deployer.deploy(NFTStaking);
  const nftStaking = await NFTStaking.deployed();

  logAddress("nftStaking", nftStaking.address);
  logAddress("nftStakingName", await contractsRegistry.NFT_STAKING_NAME());

  // policybookAdmin contract
  await deployer.deploy(PolicyBookAdmin);
  const policyBookAdmin = await PolicyBookAdmin.deployed();

  logAddress("policyBookAdmin", policyBookAdmin.address);
  logAddress("policyBookAdminName", await contractsRegistry.POLICY_BOOK_ADMIN_NAME());

  // policybookFabric contract
  await deployer.deploy(PolicyBookFabric);
  const policyBookFabric = await PolicyBookFabric.deployed();

  logAddress("policyBookFabric", policyBookFabric.address);
  logAddress("ppolicyBookFabricName", await contractsRegistry.POLICY_BOOK_FABRIC_NAME());

  // PolicyBookRegistry contract
  await deployer.deploy(PolicyBookRegistry);
  const policyBookRegistry = await PolicyBookRegistry.deployed();

  logAddress("policyBookRegistry", policyBookRegistry.address);
  logAddress("policyBookRegistryName", await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());

  // PolicyQuote contract
  await deployer.deploy(PolicyQuote);
  const policyQuote = await PolicyQuote.deployed();

  logAddress("policyQuote", policyQuote.address);
  logAddress("policyQuoteName", await contractsRegistry.POLICY_QUOTE_NAME());

  // PolicyRegistry contract
  await deployer.deploy(PolicyRegistry);
  const policyRegistry = await PolicyRegistry.deployed();

  logAddress("policyRegistry", policyRegistry.address);
  logAddress("policyRegistryName", await contractsRegistry.POLICY_REGISTRY_NAME());

  // ReinsurancePool contract
  await deployer.deploy(ReinsurancePool);
  const reinsurancePool = await ReinsurancePool.deployed();

  logAddress("reinsurancePool", reinsurancePool.address);
  logAddress("reinsurancePoolName", await contractsRegistry.REINSURANCE_POOL_NAME());

  // ReputationSystem contract
  await deployer.deploy(ReputationSystem);
  const reputationSystem = await ReputationSystem.deployed();

  logAddress("reputationSystem", reputationSystem.address);
  logAddress("reputationSystemName", await contractsRegistry.REPUTATION_SYSTEM_NAME());

  // rewardsGenerator contract
  await deployer.deploy(RewardsGenerator);
  const rewardsGenerator = await RewardsGenerator.deployed();

  logAddress("rewardsGenerator", rewardsGenerator.address);
  logAddress("rewardsGeneratorName", await contractsRegistry.REWARDS_GENERATOR_NAME());

  //shieldMining contract
  await deployer.deploy(ShieldMining);
  const shieldMining = await ShieldMining.deployed();

  logAddress("shieldMining", shieldMining.address);
  logAddress("shieldMiningName", await contractsRegistry.SHIELD_MINING_NAME());

  //StkBMIStaking
  await deployer.deploy(StkBMIStaking);
  const stkBMIStaking = await StkBMIStaking.deployed();

  logAddress("stkBMIStaking", stkBMIStaking.address);
  logAddress("stkBMIStakingName", await contractsRegistry.STKBMI_STAKING_NAME());

  //yieldGenerator contract
  await deployer.deploy(YieldGenerator);
  const yieldGenerator = await YieldGenerator.deployed();

  logAddress("yieldGenerator", yieldGenerator.address);
  logAddress("yieldGeneratorName", await contractsRegistry.YIELD_GENERATOR_NAME());

  //Aave contract
  await deployer.deploy(AaveProtocol);
  const aaveProtocol = await AaveProtocol.deployed();

  logAddress("aaveProtocol", aaveProtocol.address);
  logAddress("aaveProtocolName", await contractsRegistry.DEFI_PROTOCOL_1_NAME());

  //Compound contract
  await deployer.deploy(CompoundProtocol);
  const compoundProtocol = await CompoundProtocol.deployed();

  logAddress("compoundProtocol", compoundProtocol.address);
  logAddress("compoundProtocolName", await contractsRegistry.DEFI_PROTOCOL_2_NAME());

  //Yearn contract
  await deployer.deploy(YearnProtocol);
  const yearnProtocol = await YearnProtocol.deployed();

  logAddress("yearnProtocol", yearnProtocol.address);
  logAddress("yearnProtocolName", await contractsRegistry.DEFI_PROTOCOL_3_NAME());

  //STKBMIToken contract
  await deployer.deploy(STKBMIToken);
  const stkBMIToken = await STKBMIToken.deployed();

  logAddress("stkBMIToken", stkBMIToken.address);
  logAddress("stkBMITokenName", await contractsRegistry.STKBMI_NAME());

  //policybook contract
  await deployer.deploy(PolicyBook);
  const policyBook = await PolicyBook.deployed();

  //policybookFacade contract
  await deployer.deploy(PolicyBookFacade);
  const policyBookFacade = await PolicyBookFacade.deployed();

  logAddress("policyBookFacade", policyBookFacade.address);

  //UserLeveragePool contract
  await deployer.deploy(UserLeveragePool);
  const userLeveragePool = await UserLeveragePool.deployed();

  logAddress("userLeveragePool", userLeveragePool.address);

  /// *******************************upgrade contracts - admins tx ******************************
  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), bmiCoverStaking.address, {
      from: owner,
    }),
    "Upgrade bmiCoverStaking"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      bmiCoverStakingView.address,
      {
        from: owner,
      }
    ),
    "Upgrade bmiCoverStakingView"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.BMI_STAKING_NAME(), bmiStaking.address, {
      from: owner,
    }),
    "Upgrade bmiStaking"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), bmiUtilityNFT.address, {
      from: owner,
    }),
    "Upgrade bmiUtilityNFT"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.CAPITAL_POOL_NAME(), capitalPool.address, {
      from: owner,
    }),
    "Upgrade capitalPool"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      claimingRegistry.address,
      {
        from: owner,
      }
    ),
    "Upgrade claimingRegistry"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.CLAIM_VOTING_NAME(), claimVoting.address, {
      from: owner,
    }),
    "Upgrade claimVoting"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      rewardsGenerator.address,
      {
        from: owner,
      }
    ),
    "Upgrade LeveragePortfolioView"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(),
      liquidityMiningStakingETH.address,
      {
        from: owner,
      }
    ),
    "Upgrade liquidityMiningStakingETH"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(
      await contractsRegistry.LIQUIDITY_REGISTRY_NAME(),
      liquidityRegistry.address,
      {
        from: owner,
      }
    ),
    "Upgrade liquidityRegistry"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.NFT_STAKING_NAME(), nftStaking.address, {
      from: owner,
    }),
    "Upgrade nftStaking"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.POLICY_BOOK_ADMIN_NAME(), policyBookAdmin.address, {
      from: owner,
    }),
    "Upgrade policyBookAdmin"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(
      await contractsRegistry.POLICY_BOOK_FABRIC_NAME(),
      policyBookFabric.address,
      {
        from: owner,
      }
    ),
    "Upgrade policyBookFabric"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(
      await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(),
      policyBookRegistry.address,
      {
        from: owner,
      }
    ),
    "Upgrade policyBookRegistry"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.POLICY_QUOTE_NAME(), policyQuote.address, {
      from: owner,
    }),
    "Upgrade policyQuote"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.POLICY_REGISTRY_NAME(), policyRegistry.address, {
      from: owner,
    }),
    "Upgrade policyRegistry"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.REINSURANCE_POOL_NAME(), reinsurancePool.address, {
      from: owner,
    }),
    "Upgrade reinsurancePool"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(
      await contractsRegistry.REPUTATION_SYSTEM_NAME(),
      reputationSystem.address,
      {
        from: owner,
      }
    ),
    "Upgrade reputationSystem"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      rewardsGenerator.address,
      {
        from: owner,
      }
    ),
    "Upgrade rewardsGenerator"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.SHIELD_MINING_NAME(), shieldMining.address, {
      from: owner,
    }),
    "Upgrade shieldMining"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.STKBMI_STAKING_NAME(), stkBMIStaking.address, {
      from: owner,
    }),
    "Upgrade stkBMIStaking"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.YIELD_GENERATOR_NAME(), yieldGenerator.address, {
      from: owner,
    }),
    "Upgrade yieldGenerator"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), aaveProtocol.address, {
      from: owner,
    }),
    "Upgrade aaveProtocol"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), compoundProtocol.address, {
      from: owner,
    }),
    "Upgrade compoundProtocol"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), yearnProtocol.address, {
      from: owner,
    }),
    "Upgrade yearnProtocol"
  );

  logTransaction(
    await contractsRegistry.upgradeContract(await contractsRegistry.STKBMI_NAME(), stkBMIToken.address, {
      from: owner,
    }),
    "Upgrade stkBMIToken"
  );

  const policyBookAdminProxy = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());

  logTransaction(
    await policyBookAdminProxy.upgradeUserLeveragePools(userLeveragePool.address, 0, 1, {
      from: owner,
    }),
    "Upgrade userLeveragePool"
  );

  logTransaction(
    await policyBookAdminProxy.upgradePolicyBooks(policyBook.address, 0, 5, {
      from: owner,
    }),
    "Upgrade policyBook"
  );

  logTransaction(
    await policyBookAdminProxy.upgradePolicyBookFacades(policyBookFacade.address, 0, 5, {
      from: owner,
    }),
    "Upgrade policyBookFacade"
  );

  ///************************** initialize contracts ***********************

  const bmiCoverStakingContract = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
  const bmiCoverStakingViewContract = await BMICoverStakingView.at(
    await contractsRegistry.getBMICoverStakingViewContract()
  );
  const bmiStakingContract = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());
  const bmiUtilityNFTContract = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());
  const capitalPoolContract = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
  const claimingRegistryContract = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
  const claimVotingContract = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
  const leveragePortfolioViewContract = await LeveragePortfolioView.at(
    await contractsRegistry.getLeveragePortfolioViewContract()
  );
  const LiquidityMiningStakingETHContract = await LiquidityMiningStakingETH.at(
    await contractsRegistry.getLiquidityMiningStakingETHContract()
  );
  const liquidityRegistryContract = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
  const nftStakingContract = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
  const policyBookFabricContract = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
  const policyBookRegistryContract = await PolicyBookRegistry.at(
    await contractsRegistry.getPolicyBookRegistryContract()
  );
  const policyQuoteContract = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
  const policyRegistryContract = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
  const reinsurancePoolContract = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
  const reputationSystemContract = await ReputationSystem.at(await contractsRegistry.getReputationSystemContract());
  const rewardsGeneratorContract = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
  const shieldMiningContract = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
  const stkBMIStakingContract = await StkBMIStaking.at(await contractsRegistry.getStkBMIStakingContract());
  const yieldGeneratorContract = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());
  const stkBMI = await STKBMIToken.at(await contractsRegistry.getSTKBMIContract());
  const aaveProtocolContract = await AaveProtocol.at(await contractsRegistry.getDefiProtocol1Contract());
  const compoundProtocolContract = await CompoundProtocol.at(await contractsRegistry.getDefiProtocol2Contract());
  const yearnProtocolContract = await YearnProtocol.at(await contractsRegistry.getDefiProtocol3Contract());

  //************************** configuration tx */
  // logTransaction(
  //   await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME(), {
  //     from: owner,
  //   }),
  //   "Inject shieldMining"
  // );

  //*****************************testing state */
  assert.equal(
    (await bmiCoverStakingContract.bmiToken()).toString(),
    (await contractsRegistry.getBMIContract()).toString()
  );

  assert.equal(
    (await bmiCoverStakingContract.bmiTreasury()).toString(),
    (await contractsRegistry.getBMITreasury()).toString()
  );
};
