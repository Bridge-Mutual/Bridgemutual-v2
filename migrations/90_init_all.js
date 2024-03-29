const { logTransaction, logAddress } = require("./helpers/logger.js");
const { mainnet, bsc, polygon } = require("./helpers/AddressCatalog.js");
const { toBN } = require("./helpers/utils.js");
const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const PriceFeed = artifacts.require("PriceFeed");

const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");

const BMICoverStaking = artifacts.require("BMICoverStaking");

const RewardsGenerator = artifacts.require("RewardsGenerator");

const BMIStaking = artifacts.require("BMIStaking");
const STKBMIToken = artifacts.require("STKBMIToken");

const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");

const NFTStaking = artifacts.require("NFTStaking");
const LiquidityMiningStakingETH = artifacts.require("LiquidityMiningStakingETH");
const LiquidityMiningStakingUSDT = artifacts.require("LiquidityMiningStakingUSDT");

const ClaimVoting = artifacts.require("ClaimVoting");
const ReputationSystem = artifacts.require("ReputationSystem");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const StkBMIStaking = artifacts.require("StkBMIStaking");

const PolicyBookImpl = artifacts.require("PolicyBook");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyQuote = artifacts.require("PolicyQuote");
const UserLeveragePool = artifacts.require("UserLeveragePool");

const CapitalPool = artifacts.require("CapitalPool");
const ShieldMining = artifacts.require("ShieldMining");

const YieldGenerator = artifacts.require("YieldGenerator");
const AaveProtocol = artifacts.require("AaveProtocol");
const CompoundProtocol = artifacts.require("CompoundProtocol");
const YearnProtocol = artifacts.require("YearnProtocol");

const Networks = {
  ETH: 0,
  BSC: 1,
  POL: 2,
};
const PRECISION = toBN(10).pow(25);
const wei = web3.utils.toWei;
let bmiStaking;
let liquidityMiningStakingETH;
let liquidityMiningStakingUSDT;
let aaveProtocol;
let compoundProtocol;
let yearnProtocol;
let team;
module.exports = async (deployer, network, accounts) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  const priceFeed = await PriceFeed.at(await contractsRegistry.getPriceFeedContract());

  const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
  const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
  const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
  const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());

  const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());

  const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());

  const stkBMIToken = await STKBMIToken.at(await contractsRegistry.getSTKBMIContract());

  const bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());

  const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    bmiStaking = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());
    liquidityMiningStakingETH = await LiquidityMiningStakingETH.at(
      await contractsRegistry.getLiquidityMiningStakingETHContract()
    );

    liquidityMiningStakingUSDT = await LiquidityMiningStakingUSDT.at(
      await contractsRegistry.getLiquidityMiningStakingUSDTContract()
    );

    aaveProtocol = await AaveProtocol.at(await contractsRegistry.getDefiProtocol1Contract());
    compoundProtocol = await CompoundProtocol.at(await contractsRegistry.getDefiProtocol2Contract());
    yearnProtocol = await YearnProtocol.at(await contractsRegistry.getDefiProtocol3Contract());
  }
  const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());

  const claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
  const reputationSystem = await ReputationSystem.at(await contractsRegistry.getReputationSystemContract());
  const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
  const stkBMIStaking = await StkBMIStaking.at(await contractsRegistry.getStkBMIStakingContract());

  const capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());

  const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

  const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
  const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
  const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());

  ////////////////////////////////////////////////////////////

  console.log();

  logTransaction(await policyBookFabric.__PolicyBookFabric_init(), "Init PolicyBookFabric");

  logTransaction(await claimingRegistry.__ClaimingRegistry_init(), "Init ClaimingRegistry");

  logTransaction(await bmiCoverStaking.__BMICoverStaking_init(), "Init BMICoverStaking");

  logTransaction(await bmiUtilityNFT.__BMIUtilityNFT_init(), "Init BMIUtilityNFT");

  logTransaction(await nftStaking.__NFTStaking_init(), "Init NFTStaking");
  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    logTransaction(
      await liquidityMiningStakingETH.__LiquidityMiningStakingETH_init(),
      "Init LiquidityMiningStakingETH"
    );
    logTransaction(
      await liquidityMiningStakingUSDT.__LiquidityMiningStakingUSDT_init(),
      "Init LiquidityMiningStakingUSDT"
    );

    logTransaction(await bmiStaking.__BMIStaking_init(0), "Init BMIStaking");

    logTransaction(await stkBMIToken.__STKBMIToken_init(), "Init STKBMIToken");

    logTransaction(await aaveProtocol.__AaveProtocol_init(), "Init Aave Protocol");
    logTransaction(await compoundProtocol.__CompoundProtocol_init(), "Init Compound Protocol");
    logTransaction(await yearnProtocol.__YearnProtocol_init(), "Init Yearn Protocol");
    team = mainnet.team;
  } else {
    logTransaction(await bmiCoverStaking.setAllowStakeProfit(false), "BMICoverStaking setAllowStakeProfit");
    logTransaction(await nftStaking.configureNetwork(false), "NFTSTAKING configureNetwork");
    team = bsc.team;
  }
  logTransaction(await claimVoting.__ClaimVoting_init(), "Init ClaimVoting");
  logTransaction(await reputationSystem.__ReputationSystem_init(team), "Init ReputationSystem");
  logTransaction(await reinsurancePool.__ReinsurancePool_init(), "Init ReinsurancePool");
  logTransaction(await stkBMIStaking.__StkBMIStaking_init(), "Init StkBMIStaking");

  logTransaction(await capitalPool.__CapitalPool_init(), "Init CapitalPool");

  const policyBookImplAddress = (await PolicyBookImpl.deployed()).address;
  const policyBookFacadeImplAddress = (await PolicyBookFacade.deployed()).address;
  const userLeverageImplAddress = (await UserLeveragePool.deployed()).address;

  logTransaction(
    await policyBookAdmin.__PolicyBookAdmin_init(
      policyBookImplAddress,
      policyBookFacadeImplAddress,
      userLeverageImplAddress
    ),
    "Init PolicyBookAdmin"
  );
  let _network;
  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    _network = Networks.ETH;
  } else if (["bsc_test", "bsc_development", "bsc_mainnet"].includes(network)) {
    _network = Networks.BSC;
  } else if (["polygon_test", "polygon_development", "polygon_mainnet"].includes(network)) {
    _network = Networks.POL;
  }

  logTransaction(await rewardsGenerator.__RewardsGenerator_init(_network), "Init RewardsGenerator");
  logTransaction(await yieldGenerator.__YieldGenerator_init(_network), "Init YieldGenerator");
  logTransaction(await shieldMining.__ShieldMining_init(_network), "Init ShieldMining");

  ////////////////////////////////////////////////////////////

  console.log();

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME()),
    "Inject PriceFeed"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME()),
    "Inject PolicyRegistry"
  );
  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME()),
    "Inject PolicyBookRegistry"
  );
  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME()),
    "Inject ClaimingRegistry"
  );
  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME()),
    "Inject LiquidityRegistry"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME()),
    "Inject BMICoverStaking"
  );
  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME()),
    "Inject BMICoverStakingView"
  );
  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME()),
    "Inject RewardsGenerator"
  );

  // logTransaction(
  //   await contractsRegistry.injectDependencies(await contractsRegistry.BMI_UTILITY_NFT_NAME()),
  //   "Inject BMIUtilityNFT"
  // );
  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME()),
    "Inject NFTStaking"
  );

  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    logTransaction(
      await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME()),
      "Inject LiquidityMiningStakingETH"
    );

    logTransaction(
      await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME()),
      "Inject LiquidityMiningStakingUSDT"
    );

    logTransaction(
      await contractsRegistry.injectDependencies(await contractsRegistry.BMI_STAKING_NAME()),
      "Inject BMIStaking"
    );

    logTransaction(
      await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_NAME()),
      "Inject STKBMIToken"
    );

    logTransaction(
      await contractsRegistry.injectDependencies(await contractsRegistry.DEFI_PROTOCOL_1_NAME()),
      "Inject AaveProtocol"
    );

    logTransaction(
      await contractsRegistry.injectDependencies(await contractsRegistry.DEFI_PROTOCOL_2_NAME()),
      "Inject CompoundProtocol"
    );

    logTransaction(
      await contractsRegistry.injectDependencies(await contractsRegistry.DEFI_PROTOCOL_3_NAME()),
      "Inject YearnProtocol"
    );
  }

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME()),
    "Inject ShieldMining"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME()),
    "Inject ClaimVoting"
  );
  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.REPUTATION_SYSTEM_NAME()),
    "Inject ReputationSystem"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME()),
    "Inject ReinsurancePool"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME()),
    "Inject PolicyBookFabric"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME()),
    "Inject PolicyBookAdmin"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME()),
    "Inject CapitalPool"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.YIELD_GENERATOR_NAME()),
    "Inject YieldGenerator"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME()),
    "Inject LeveragePortfolioView"
  );

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME()),
    "Inject PolicyQuote"
  );

  ////////////////////////////////////////////////////////////

  /// configiuration

  let capitalPool_mantainer;

  if (!["mainnet", "bsc_mainnet", "polygon_mainnet"].includes(network)) {
    logTransaction(await capitalPool.setRebalanceDuration(toBN(3600)), "capitalPool setRebalanceDuration");
  }
  if (["ropsten", "rinkeby", "mainnet", "development"].includes(network)) {
    capitalPool_mantainer = mainnet.capitalPool_mantainer;
    if (["development"].includes(network)) {
      capitalPool_mantainer = accounts[0];
    }
    logTransaction(await capitalPool.setMaintainer(capitalPool_mantainer), "CapitalPool setMaintainer ");

    logTransaction(
      await yieldGenerator.setProtocolSettings(
        [true, true, true],
        [toBN(45).times(PRECISION), toBN(45).times(PRECISION), toBN(10).times(PRECISION)],
        [wei("0.002", "mwei"), wei("0.002", "mwei"), wei("0.002", "mwei")]
      ),
      "set defi protocol setting"
    );
  } else {
    logTransaction(await capitalPool.allowDeployFundsToDefi(false), "CapitalPool disable DeployFundsToDefi");
    logTransaction(await stkBMIStaking.setEnableBMIStakingAccess(false), "stkBMIStaking setEnableBMIStakingAccess");
  }

  logTransaction(
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_STAKING_NAME()),
    "Inject StkBMIStaking"
  );

  console.log("\n+--------------------------------------------------------------------------------+\n");

  logAddress("ContractsRegistry", contractsRegistry.address);

  logAddress("PriceFeed", priceFeed.address);

  logAddress("PolicyBookRegistry", policyBookRegistry.address);
  logAddress("PolicyRegistry", policyRegistry.address);
  logAddress("ClaimingRegistry", claimingRegistry.address);
  logAddress("LiquidityRegistry", liquidityRegistry.address);

  logAddress("BMICoverStaking", bmiCoverStaking.address);
  logAddress("RewardsGenerator", rewardsGenerator.address);

  logAddress("STKBMIToken", stkBMIToken.address);

  logAddress("BMIUtilityNFT", bmiUtilityNFT.address);

  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    logAddress("BMIStaking", bmiStaking.address);
    logAddress("LiquidityMiningStakingETH", liquidityMiningStakingETH.address);
    logAddress("LiquidityMiningStakingUSDT", liquidityMiningStakingUSDT.address);
    logAddress("AaveProtocol", aaveProtocol.address);
    logAddress("CompoundProtocol", compoundProtocol.address);
    logAddress("YearnProtocol", yearnProtocol.address);
  }
  logAddress("NFTStaking", nftStaking.address);
  logAddress("ClaimVoting", claimVoting.address);
  logAddress("ReputationSystem", reputationSystem.address);
  logAddress("ReinsurancePool", reinsurancePool.address);
  logAddress("StkBMIStaking", stkBMIStaking.address);

  logAddress("PolicyBookFabric", policyBookFabric.address);
  logAddress("PolicyBookAdmin", policyBookAdmin.address);
  logAddress("PolicyQuote", policyQuote.address);

  logAddress("CapitalPool", capitalPool.address);
  logAddress("YieldGenerator", yieldGenerator.address);

  console.log("+--------------------------------------------------------------------------------+");
};
