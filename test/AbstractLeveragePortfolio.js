const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyQuote = artifacts.require("PolicyQuote");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const YieldGeneratorMock = artifacts.require("YieldGeneratorMock");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WrappedTokenMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const PriceFeed = artifacts.require("PriceFeed");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const ClaimVoting = artifacts.require("ClaimVoting");
const ReinsurancePool = artifacts.require("ReinsurancePoolMock");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const CapitalPool = artifacts.require("CapitalPool");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacadeMock");
const UserLeveragePool = artifacts.require("UserLeveragePoolMock");
const BMIStaking = artifacts.require("BMIStaking");
const AaveProtocol = artifacts.require("AaveProtocol");
const YearnProtocol = artifacts.require("YearnProtocol");
const CompoundProtocol = artifacts.require("CompoundProtocol");
const ShieldMining = artifacts.require("ShieldMining");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const LeveragePortfolioContract = require("../build/contracts/AbstractLeveragePortfolio.json");

const { ethers } = require("ethers");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");

const setCurrentTime = require("./helpers/ganacheTimeTraveler");
const { time } = require("@openzeppelin/test-helpers");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

const { assert } = require("chai");

const wei = web3.utils.toWei;

const ContractType = {
  CONTRACT: 0,
  STABLECOIN: 1,
  SERVICE: 2,
  EXCHANGE: 3,
  VARIUOS: 4,
};

function toBN(number) {
  return new BigNumber(number);
}

const { toWei } = web3.utils;

contract("AbstractLeveragePortfolio", async (accounts) => {
  const reverter = new Reverter(web3);

  let contractsRegistry;
  let policyBookMock;
  let policyBookFacade;
  let policyBookMock2;
  let policyBookFacade2;
  let policyBookMock3;
  let policyBookFacade3;
  let bmiUtilityNFT;
  let nftStaking;
  let bmiCoverStaking;
  let stbl;
  let yieldGenerator;
  let bmi;
  let rewardsGenerator;
  let reinsurancePool;
  let policyBookRegistry;
  let policyQuote;

  let policyBookAdmin;
  let decodedResult;
  let policyBookFabric;
  let leveragePortfolioView;
  let withdrawalPeriod;

  let userLeveragePool;

  const insuranceContract = accounts[4];

  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const USER3 = accounts[3];

  const PRECISION = toBN(10).pow(25);
  const insuranceContract2 = accounts[5];
  const insuranceContract3 = accounts[6];
  const insuranceContract4 = accounts[7];
  const insuranceContract5 = accounts[8];
  const NOTHING = accounts[9];
  let network;

  const initialDeposit = toBN(toWei("1000"));

  const transactionFilter = async (contractAddress) => {
    const iface = new ethers.utils.Interface(LeveragePortfolioContract.abi);
    let _provider = new ethers.providers.JsonRpcProvider(web3.currentProvider.host);
    const logs = await _provider.getLogs({
      address: contractAddress,
    });

    const log = iface.parseLog(logs[0]);

    return log.args;
  };

  before("setup", async () => {
    network = await getNetwork();

    contractsRegistry = await ContractsRegistry.new();
    const policyBookImpl = await PolicyBookMock.new();
    const policyBookFacadeImpl = await PolicyBookFacade.new();
    const weth = await WETHMock.new("weth", "weth");
    const sushiswapRouterMock = await SushiswapRouterMock.new();
    bmi = await BMIMock.new(USER1);

    if (network == Networks.ETH) {
      stbl = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stbl = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }

    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _capitalPool = await CapitalPool.new();
    const _priceFeed = await PriceFeed.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyQuote = await PolicyQuote.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _yieldGenerator = await YieldGeneratorMock.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _claimVoting = await ClaimVoting.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _bmiStaking = await BMIStaking.new();
    const _aaveProtocol = await AaveProtocol.new();
    const _compoundProtocol = await CompoundProtocol.new();
    const _yearnProtocol = await YearnProtocol.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    await contractsRegistry.__ContractsRegistry_init();
    await contractsRegistry.addContract(await contractsRegistry.STKBMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REPUTATION_SYSTEM_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.YIELD_GENERATOR_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), sushiswapRouterMock.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.CLAIM_VOTING_NAME(), _claimVoting.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);

    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_NAME(),
      _bmiCoverStaking.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_REGISTRY_NAME(), _policyRegistry.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      _claimingRegistry.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_REGISTRY_NAME(),
      _liquidityRegistry.address
    );

    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(),
      _policyBookRegistry.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_FABRIC_NAME(),
      _policyBookFabric.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGenerator.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.NFT_STAKING_NAME(), _nftStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), _bmiUtilityNFT.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(),
      _stakingMock.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(),
      _stakingMock.address
    );

    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_STAKING_NAME(), _bmiStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), _aaveProtocol.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), _compoundProtocol.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), _yearnProtocol.address);

    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    leveragePortfolioView = await LeveragePortfolioView.at(await contractsRegistry.getLeveragePortfolioViewContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());
    await policyBookAdmin.__PolicyBookAdmin_init(
      policyBookImpl.address,
      policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    await reinsurancePool.__ReinsurancePool_init();
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await nftStaking.__NFTStaking_init();
    await rewardsGenerator.__RewardsGenerator_init(network);
    await capitalPool.__CapitalPool_init();
    await bmiUtilityNFT.__BMIUtilityNFT_init();
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());

    const userLeveragePoolAddress = (
      await policyBookFabric.createLeveragePools(
        insuranceContract4,
        ContractType.VARIUOS,
        "User Leverage Pool",
        "LevPf1"
      )
    ).logs[0].args.at;

    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);

    const userLeveragePoolAddress2 = (
      await policyBookFabric.createLeveragePools(
        insuranceContract5,
        ContractType.VARIUOS,
        "User Leverage Pool",
        "LevPf2"
      )
    ).logs[0].args.at;

    userLeveragePool2 = await UserLeveragePool.at(userLeveragePoolAddress2);

    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await policyBookAdmin.whitelist(userLeveragePoolAddress2, true);

    await policyBookAdmin.setupPricingModel(
      PRECISION.times(80),
      PRECISION.times(80),
      PRECISION.times(2),
      PRECISION.times(2),
      wei("10"),
      PRECISION.times(10),
      PRECISION.times(50),
      PRECISION.times(25),
      PRECISION.times(100)
    );

    await stbl.approve(policyBookFabric.address, getStableAmount("1000").times(3));

    // await setCurrentTime(1);

    const policyBookAddr = (
      await policyBookFabric.create(
        insuranceContract,
        ContractType.CONTRACT,
        "test description",
        "TEST",
        initialDeposit,
        "0x0000000000000000000000000000000000000000"
      )
    ).logs[0].args.at;

    policyBookMock = await PolicyBookMock.at(policyBookAddr);

    let policyBookFacadeAddress = await policyBookMock.policyBookFacade();
    policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddress);

    // setup some pools
    // pool2
    policyBookMock2 = await PolicyBookMock.at(
      (
        await policyBookFabric.create(
          insuranceContract2,
          ContractType.CONTRACT,
          "test description",
          "TEST2",
          initialDeposit,
          "0x0000000000000000000000000000000000000000"
        )
      ).logs[0].args.at
    );
    policyBookFacadeAddress = await policyBookMock2.policyBookFacade();
    policyBookFacade2 = await PolicyBookFacade.at(policyBookFacadeAddress);

    // pool3
    policyBookMock3 = await PolicyBookMock.at(
      (
        await policyBookFabric.create(
          insuranceContract3,
          ContractType.CONTRACT,
          "test description",
          "TEST3",
          initialDeposit,
          "0x0000000000000000000000000000000000000000"
        )
      ).logs[0].args.at
    );

    policyBookFacadeAddress = await policyBookMock3.policyBookFacade();
    policyBookFacade3 = await PolicyBookFacade.at(policyBookFacadeAddress);

    await policyBookAdmin.setLeveragePortfolioRebalancingThreshold(userLeveragePool.address, PRECISION);

    await policyBookAdmin.setPolicyBookFacadeRebalancingThreshold(policyBookFacade.address, PRECISION);
    withdrawalPeriod = toBN(await capitalPool.getWithdrawPeriod());
    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  async function createPolicyBooks(index) {
    await stbl.approve(policyBookFabric.address, getStableAmount("100"));
    let insured;
    if (index < 10) {
      insured = "0x000000000000000000000000000000000000000" + index;
    } else if (index >= 10) {
      insured = "0x00000000000000000000000000000000000000" + index;
    }
    let policyBookMock1 = await PolicyBookMock.at(
      (
        await policyBookFabric.create(
          insured,
          ContractType.CONTRACT,
          "test description " + index,
          "TEST" + index,
          wei("100"),
          "0x0000000000000000000000000000000000000000"
        )
      ).logs[0].args.at
    );

    let policyBookFacadeAddress1 = await policyBookMock1.policyBookFacade();

    let policyBookFacade1 = await PolicyBookFacade.at(policyBookFacadeAddress1);

    await policyBookMock1.setTotalLiquidity(toBN(toWei("10000")));
    await policyBookMock1.setTotalCoverTokens(toBN(toWei("6000")));

    await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade1.address, PRECISION.times(80), PRECISION.times(30));
    return policyBookMock1;
  }

  async function createLeveragePools(index) {
    const userLeveragePoolAddress1 = (
      await policyBookFabric.createLeveragePools(
        "0x000000000000000000000000000000000000000" + index,
        ContractType.VARIUOS,
        "User Leverage Pool",
        "LevPf2"
      )
    ).logs[0].args.at;

    let userLeveragePool1 = await UserLeveragePool.at(userLeveragePoolAddress1);
    return userLeveragePool1;
  }

  describe("deployLeverageStable - check the formula", async () => {
    const liquidityAmount = toBN(toWei("1000000"));
    const coverTokensAmount = toBN(toWei("500000"));
    const virtualLiquidityAmount = toBN(toWei("5000000"));

    beforeEach("setup", async () => {
      //setup for user leverage pool - 5 MM
      userLeveragePool.setVtotalLiquidity(virtualLiquidityAmount);
      // setup fot reinsurance pool - 5 MM
      reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount);
      // setup for policy book - liq 1 MM and cover 500,000
      policyBookMock.setTotalLiquidity(liquidityAmount);
      policyBookMock.setTotalCoverTokens(coverTokensAmount);
      // set MPL for policy book for both pools RP and UserLP
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, PRECISION.times(20), PRECISION.times(50));

      assert.equal(toBN(await policyBookMock.totalLiquidity()).toString(), liquidityAmount.toString());
      assert.equal(toBN(await policyBookMock.totalCoverTokens()).toString(), coverTokensAmount.toString());

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), virtualLiquidityAmount.toString());
      assert.equal(toBN(await reinsurancePool.totalLiquidity()).toString(), virtualLiquidityAmount.toString());
    });

    it("should correctly deploye leverage stable from RP and UserLP", async () => {
      await policyBookFacade.deployLeverageFundsByLP(userLeveragePool.address);
      decodedResult = await transactionFilter(userLeveragePool.address);

      assert.equal(decodedResult.deployedAmount.toString(), toWei("1946428.571428571428571428"));

      await policyBookFacade.deployLeverageFundsByRP();
      decodedResult = await transactionFilter(reinsurancePool.address);

      assert.equal(decodedResult.deployedAmount.toString(), toWei("4866071.428571428571428571"));
    });

    it("should correctly deploye leverage stable from RP and UserLP - safe pricing model", async () => {
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      await policyBookFacade.deployLeverageFundsByLP(userLeveragePool.address);
      decodedResult = await transactionFilter(userLeveragePool.address);

      assert.equal(decodedResult.deployedAmount.toString(), toWei("607142.857142857142857142"));

      await policyBookFacade.deployLeverageFundsByRP();
      decodedResult = await transactionFilter(reinsurancePool.address);

      assert.equal(decodedResult.deployedAmount.toString(), toWei("1517857.142857142857142857"));
    });
  });

  describe("deployVirtuakStable - check the formula", async () => {
    const liquidityAmount = toBN(toWei("1000000"));
    const coverTokensAmount = toBN(toWei("500000"));

    const virtualLiquidityAmount = toBN(toWei("5000000"));

    beforeEach("setup", async () => {
      // setup fot reinsurance pool - 5 MM
      reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount);
      // setup for policy book - liq 1 MM and cover 500,000
      policyBookMock.setTotalLiquidity(liquidityAmount);
      policyBookMock.setTotalCoverTokens(coverTokensAmount);
      // set MPL for policy book for both pools RP and UserLP
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, PRECISION.times(20), PRECISION.times(50));
    });

    it("should correctly deploye virtual stable from RP", async () => {
      await policyBookFacade.deployVirtualFundsByRP();

      decodedResult = await transactionFilter(reinsurancePool.address);

      assert.equal(decodedResult.deployedAmount.toString(), toWei("5000000"));
    });
  });

  describe("deployeLeverageAndVirtualStable", async () => {
    const totalLiquidityAmount1 = toBN(toWei("1000000"));
    const coverTokensAmount1 = toBN(toWei("500000"));
    const totalLiquidityAmount2 = toBN(toWei("10000"));
    const coverTokensAmount2 = toBN(toWei("6000"));
    const totalLiquidityAmount3 = toBN(toWei("100000"));
    const coverTokensAmount3 = toBN(toWei("30000"));

    const liquidityAmount1 = toBN(toWei("150000"));
    const liquidityAmount2 = toBN(toWei("2000"));
    const liquidityAmount3 = toBN(toWei("15000"));
    const smallLiquidityAmount = toBN(toWei("10000"));

    const virtualLiquidityAmount = toBN(toWei("1000000"));

    beforeEach("setup", async () => {
      const stblLiquidityAmount2 = getStableAmount("2000");
      const stblLiquidityAmount3 = getStableAmount("15000");
      const stblLiquidityAmount1 = getStableAmount("150000");

      //setup for user leverage pool - 1 MM
      await userLeveragePool.setVtotalLiquidity(virtualLiquidityAmount);
      // setup fot reinsurance pool - 1 MM
      await reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount);
      // setup for policy book - liq 1 MM and cover 500,000
      await policyBookMock.setTotalLiquidity(totalLiquidityAmount1);
      await policyBookMock.setTotalCoverTokens(coverTokensAmount1);
      // set MPL for policy book for both pools RP and UserLP
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, PRECISION.times(80), PRECISION.times(30));

      // setup pool2
      // setup for policy book - liq 10 KK and cover 6000
      await policyBookMock2.setTotalLiquidity(totalLiquidityAmount2);
      await policyBookMock2.setTotalCoverTokens(coverTokensAmount2);
      // set MPL for policy book for both pools RP and UserLP
      await policyBookAdmin.setPolicyBookFacadeMPLs(
        policyBookFacade2.address,
        PRECISION.times(80),
        PRECISION.times(30)
      );

      // setup pool3
      // setup for policy book - liq 100 KK and cover 30000
      await policyBookMock3.setTotalLiquidity(totalLiquidityAmount3);
      await policyBookMock3.setTotalCoverTokens(coverTokensAmount3);
      // set MPL for policy book for both pools RP and UserLP
      await policyBookAdmin.setPolicyBookFacadeMPLs(
        policyBookFacade3.address,
        PRECISION.times(80),
        PRECISION.times(50)
      );

      await stbl.transfer(USER1, stblLiquidityAmount1.times(2));

      await stbl.approve(policyBookMock.address, stblLiquidityAmount1.times(2), { from: USER1 });

      await stbl.transfer(USER2, stblLiquidityAmount2);

      await stbl.approve(policyBookMock2.address, stblLiquidityAmount2, { from: USER2 });

      await stbl.transfer(USER3, stblLiquidityAmount3);

      await stbl.approve(policyBookMock3.address, stblLiquidityAmount3, { from: USER3 });
    });

    it("should correctly deploye leverage and virtual stable by policy book - above threshold", async () => {
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("4845454.545454545454545453")
      );

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("779784.679950092631101374"));
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("945215.320049907368898634"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("6570454.545454545454545461"));

      assert.equal(
        (await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("4845454.545454545454545453")
      );

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("1725000.000000000000000008")
      );
      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("945215.320049907368898634")
      );

      // pool2
      await policyBookFacade2.addLiquidity(liquidityAmount2, { from: USER2 });

      assert.equal(
        (await policyBookFacade2.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("59454.545454545454545454")
      );

      assert.equal((await policyBookFacade2.VUreinsurnacePool()).toString(), toWei("13078.089461713419257012"));
      assert.equal((await policyBookFacade2.LUreinsurnacePool()).toString(), toWei("9217.365083741126197533"));

      assert.equal((await policyBookFacade2.totalLeveragedLiquidity()).toString(), toWei("81749.999999999999999999"));

      assert.equal(
        (await userLeveragePool.poolsLDeployedAmount(policyBookMock2.address)).toString(),
        toWei("59454.545454545454545454")
      );

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock2.address)).toString(),
        toWei("22295.454545454545454545")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock2.address)).toString(),
        toWei("13078.089461713419257012")
      );

      // pool3
      await policyBookFacade3.addLiquidity(liquidityAmount3, { from: USER3 });

      assert.equal(
        (await policyBookFacade3.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("217692.307692307692307691")
      );
      assert.equal((await policyBookFacade3.VUreinsurnacePool()).toString(), toWei("34292.246142122309011237"));
      assert.equal((await policyBookFacade3.LUreinsurnacePool()).toString(), toWei("101765.44616556999868107"));

      assert.equal((await policyBookFacade3.totalLeveragedLiquidity()).toString(), toWei("353749.999999999999999998"));

      assert.equal(
        (await userLeveragePool.poolsLDeployedAmount(policyBookMock3.address)).toString(),
        toWei("217692.307692307692307691")
      );

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock3.address)).toString(),
        toWei("136057.692307692307692307")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock3.address)).toString(),
        toWei("34292.246142122309011237")
      );
    });

    it("should correctly deploye leverage and virtual stable by policy book - above threshold - 2 levpf", async () => {
      //setup for user leverage pool 2  - 1 MM
      await userLeveragePool2.setVtotalLiquidity(virtualLiquidityAmount);

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("2805263.157894736842105262")
      );

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool2.address)).toString(),
        toWei("2805263.157894736842105262")
      );

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("106758.364160618946890839"));
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("945215.320049907368898634"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("6662499.999999999999999997"));

      assert.equal(
        (await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("2805263.157894736842105262")
      );

      assert.equal(
        (await userLeveragePool2.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("2805263.157894736842105262")
      );

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("1051973.684210526315789473")
      );
      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("945215.320049907368898634")
      );
    });

    it("should not deploye leverage stable by policy book above max leverage pools", async () => {
      //setup for user leverage pool 2  - 1 MM
      await userLeveragePool2.setVtotalLiquidity(virtualLiquidityAmount);
      // add third pool
      let leverage3 = await createLeveragePools(0);
      await leverage3.setVtotalLiquidity(virtualLiquidityAmount);

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      // add fourth pool
      let leverage4 = await createLeveragePools(1);
      await leverage4.setVtotalLiquidity(virtualLiquidityAmount);

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(leverage4.address)).toString(), 0);
      assert.equal((await policyBookFacade.countUserLeveragePools()).toString(), 3);

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("1488571.428571428571428571")
      );

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool2.address)).toString(),
        toWei("1488571.428571428571428571")
      );

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(leverage3.address)).toString(),
        toWei("1488571.428571428571428571")
      );
    });

    it("should not deploye leverage and virtual stable by policy book - below threshold", async () => {
      await policyBookFacade.addLiquidity(smallLiquidityAmount, { from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);
      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);
    });

    it("should correctly deploye leverage and virtual stable by policy book - above threshold - twice", async () => {
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("4845454.545454545454545453")
      );

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("779784.679950092631101374"));
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("945215.320049907368898634"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("6570454.545454545454545461"));

      assert.equal(
        (await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("4845454.545454545454545453")
      );

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("1725000.000000000000000008")
      );
      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("945215.320049907368898634")
      );

      // second time
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("4736363.636363636363636362")
      );

      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("938508.897064344169982731"));
      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("837627.466572019466380905"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("6512499.999999999999999998"));

      assert.equal(
        (await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("4736363.636363636363636362")
      );

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("1776136.363636363636363636")
      );
      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("938508.897064344169982731")
      );
    });

    it("should correctly deploye leverage  by user leverage pool - above threshold", async () => {
      await userLeveragePool.addInvestedPools(policyBookMock.address);
      await userLeveragePool.addInvestedPools(policyBookMock2.address);
      await userLeveragePool.addInvestedPools(policyBookMock3.address);

      const partialAmount = toBN(toWei("500000"));
      const stblPartialAmount = getStableAmount("500000");

      userLeveragePool.setVtotalLiquidity(partialAmount);

      await stbl.transfer(USER1, stblPartialAmount);

      await stbl.approve(userLeveragePool.address, stblPartialAmount, { from: USER1 });

      await userLeveragePool.addLiquidity(partialAmount, { from: USER1 });

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("4954545.454545454545454545")
      );

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("4954545.454545454545454545"));
      // pool2

      assert.equal(
        (await policyBookFacade2.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("60909.090909090909090909")
      );

      assert.equal((await policyBookFacade2.totalLeveragedLiquidity()).toString(), toWei("60909.090909090909090909"));

      // pool3

      assert.equal(
        (await policyBookFacade3.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("226923.076923076923076923")
      );

      assert.equal((await policyBookFacade3.totalLeveragedLiquidity()).toString(), toWei("226923.076923076923076923"));
    });

    it("should correctly deploye leverage  by user leverage pool - below threshold", async () => {
      const partialAmount = toBN(toWei("10000"));
      const stblPartialAmount = getStableAmount("10000");

      await stbl.transfer(USER1, stblPartialAmount);

      await stbl.approve(userLeveragePool.address, stblPartialAmount, { from: USER1 });
      await userLeveragePool.addLiquidity(partialAmount, { from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);
    });

    it("should correctly deploye leverage  by user leverage pool - above threshold - twice", async () => {
      await userLeveragePool.addInvestedPools(policyBookMock.address);
      await userLeveragePool.addInvestedPools(policyBookMock2.address);
      await userLeveragePool.addInvestedPools(policyBookMock3.address);

      const partialAmount = toBN(toWei("500000"));
      const stblPartialAmount = getStableAmount("500000");

      userLeveragePool.setVtotalLiquidity(partialAmount);

      await stbl.transfer(USER1, stblPartialAmount.times(2));

      await stbl.approve(userLeveragePool.address, stblPartialAmount.times(2), { from: USER1 });

      await userLeveragePool.addLiquidity(partialAmount, { from: USER1 });

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("4954545.454545454545454545")
      );

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("4954545.454545454545454545"));

      //second time
      await userLeveragePool.addLiquidity(partialAmount, { from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), toWei("5450000"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("5450000"));
    });

    it("should not deploy leverage by user leverage pool above max invested pools", async () => {
      await userLeveragePool.addInvestedPools(policyBookMock.address);
      await userLeveragePool.addInvestedPools(policyBookMock2.address);
      await userLeveragePool.addInvestedPools(policyBookMock3.address);

      for (var i = 3; i < 20; i++) {
        let policyBookMock1 = await createPolicyBooks(i);
        await userLeveragePool.addInvestedPools(policyBookMock1.address);
      } // added 20 pools
      //added the 21 pool
      let policyBookMockLast = await createPolicyBooks(i);

      let policyBookFacadeAddress = await policyBookMockLast.policyBookFacade();

      let policyBookFacadeLast = await PolicyBookFacade.at(policyBookFacadeAddress);

      await stbl.transfer(USER1, getStableAmount("150000"));

      await stbl.approve(policyBookMockLast.address, getStableAmount("150000"), { from: USER1 });

      await policyBookFacadeLast.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal((await userLeveragePool.countleveragedCoveragePools()).toString(), 20);
      assert.equal((await policyBookFacadeLast.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacadeLast.totalLeveragedLiquidity()).toString(), 0);
    });

    it("should correctly deploye leverage and virtual  by reinsurance pool - above threshold", async () => {
      await reinsurancePool.addInvestedPools(policyBookMock.address);
      await reinsurancePool.addInvestedPools(policyBookMock2.address);
      await reinsurancePool.addInvestedPools(policyBookMock3.address);

      const partialAmount = toBN(toWei("500000"));

      await reinsurancePool.reevaluateProvidedLeverageStable(partialAmount, { from: USER1 });

      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("952018.278750952018278750"));

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("547981.72124904798172125"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("1500000"));

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), toWei("1500000"));

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("952018.278750952018278750")
      );
      // pool2
      assert.equal((await policyBookFacade2.VUreinsurnacePool()).toString(), toWei("13709.063214013709063214"));
      assert.equal((await policyBookFacade2.LUreinsurnacePool()).toString(), toWei("9131.845876895381845876"));

      assert.equal((await policyBookFacade2.totalLeveragedLiquidity()).toString(), toWei("22840.90909090909090909"));

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock2.address)).toString(),
        toWei("22840.90909090909090909")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock2.address)).toString(),
        toWei("13709.063214013709063214")
      );
      // pool3

      assert.equal((await policyBookFacade3.LUreinsurnacePool()).toString(), toWei("107554.265041888804265041"));
      assert.equal((await policyBookFacade3.VUreinsurnacePool()).toString(), toWei("34272.658035034272658035"));

      assert.equal((await policyBookFacade3.totalLeveragedLiquidity()).toString(), toWei("141826.923076923076923076"));
      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock3.address)).toString(),
        toWei("141826.923076923076923076")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock3.address)).toString(),
        toWei("34272.658035034272658035")
      );
    });

    it("should correctly deploye leverage and virtual  by reinsurance pool - below threshold", async () => {
      await reinsurancePool.addInvestedPools(policyBookMock.address);
      await reinsurancePool.addInvestedPools(policyBookMock2.address);
      await reinsurancePool.addInvestedPools(policyBookMock3.address);

      const partialAmount1 = toBN(toWei("500000"));
      const partialAmount2 = toBN(toWei("10000"));

      await reinsurancePool.reevaluateProvidedLeverageStable(partialAmount1, { from: USER1 });

      await reinsurancePool.reevaluateProvidedLeverageStable(partialAmount2, { from: USER1 });

      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("952018.278750952018278750"));

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("547981.72124904798172125"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("1500000"));

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), toWei("1500000"));

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("952018.278750952018278750")
      );
      // pool2
      assert.equal((await policyBookFacade2.VUreinsurnacePool()).toString(), toWei("13709.063214013709063214"));
      assert.equal((await policyBookFacade2.LUreinsurnacePool()).toString(), toWei("9131.845876895381845876"));

      assert.equal((await policyBookFacade2.totalLeveragedLiquidity()).toString(), toWei("22840.90909090909090909"));

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock2.address)).toString(),
        toWei("22840.90909090909090909")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock2.address)).toString(),
        toWei("13709.063214013709063214")
      );
      // pool3

      assert.equal((await policyBookFacade3.LUreinsurnacePool()).toString(), toWei("107554.265041888804265041"));
      assert.equal((await policyBookFacade3.VUreinsurnacePool()).toString(), toWei("34272.658035034272658035"));

      assert.equal((await policyBookFacade3.totalLeveragedLiquidity()).toString(), toWei("141826.923076923076923076"));
      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock3.address)).toString(),
        toWei("141826.923076923076923076")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock3.address)).toString(),
        toWei("34272.658035034272658035")
      );
    });

    it("should correctly deploye leverage and virtual  by reinsurance pool - above threshold - twice", async () => {
      await reinsurancePool.addInvestedPools(policyBookMock.address);
      await reinsurancePool.addInvestedPools(policyBookMock2.address);
      await reinsurancePool.addInvestedPools(policyBookMock3.address);

      const partialAmount1 = toBN(toWei("500000"));
      const partialAmount2 = toBN(toWei("500000"));

      await reinsurancePool.reevaluateProvidedLeverageStable(partialAmount1, { from: USER1 });

      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("952018.278750952018278750"));

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("547981.72124904798172125"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("1500000"));

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), toWei("1500000"));

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("952018.278750952018278750")
      );
      // pool2
      assert.equal((await policyBookFacade2.VUreinsurnacePool()).toString(), toWei("13709.063214013709063214"));
      assert.equal((await policyBookFacade2.LUreinsurnacePool()).toString(), toWei("9131.845876895381845876"));

      assert.equal((await policyBookFacade2.totalLeveragedLiquidity()).toString(), toWei("22840.90909090909090909"));

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock2.address)).toString(),
        toWei("22840.90909090909090909")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock2.address)).toString(),
        toWei("13709.063214013709063214")
      );
      // pool3

      assert.equal((await policyBookFacade3.LUreinsurnacePool()).toString(), toWei("107554.265041888804265041"));
      assert.equal((await policyBookFacade3.VUreinsurnacePool()).toString(), toWei("34272.658035034272658035"));

      assert.equal((await policyBookFacade3.totalLeveragedLiquidity()).toString(), toWei("141826.923076923076923076"));
      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock3.address)).toString(),
        toWei("141826.923076923076923076")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock3.address)).toString(),
        toWei("34272.658035034272658035")
      );

      // second time
      await reinsurancePool.setVtotalLiquidity(toBN(virtualLiquidityAmount).times(2));
      await reinsurancePool.reevaluateProvidedLeverageStable(toBN(partialAmount2).times(2), { from: USER1 });

      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("1904036.557501904036557501"));

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("1015606.299640953106299641"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("2919642.857142857142857142"));

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("2919642.857142857142857142")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("1904036.557501904036557501")
      );
      // pool2
      assert.equal((await policyBookFacade2.VUreinsurnacePool()).toString(), toWei("27418.126428027418126428"));
      assert.equal((await policyBookFacade2.LUreinsurnacePool()).toString(), toWei("8474.730714829724730714"));

      assert.equal((await policyBookFacade2.totalLeveragedLiquidity()).toString(), toWei("35892.857142857142857142"));

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock2.address)).toString(),
        toWei("35892.857142857142857142")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock2.address)).toString(),
        toWei("27418.126428027418126428")
      );
      // pool3

      assert.equal((await policyBookFacade3.LUreinsurnacePool()).toString(), toWei("136315.795041042565795041"));
      assert.equal((await policyBookFacade3.VUreinsurnacePool()).toString(), toWei("68545.31607006854531607"));

      assert.equal((await policyBookFacade3.totalLeveragedLiquidity()).toString(), toWei("204861.111111111111111111"));
      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock3.address)).toString(),
        toWei("204861.111111111111111111")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock3.address)).toString(),
        toWei("68545.31607006854531607")
      );
    });

    it("should correctly not deploye leverage and virtual stable by policy book - policy total liq zero", async () => {
      await policyBookMock.setTotalLiquidity(0);
      await policyBookMock.setTotalCoverTokens(0);
      const stblPartialAmount = getStableAmount("150000");
      await stbl.approve(userLeveragePool.address, stblPartialAmount, { from: USER1 });
      await userLeveragePool.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);
      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);
    });

    it("should correctly not deploye leverage and virtual stable by policy book - leverage total liq zero", async () => {
      await userLeveragePool.setVtotalLiquidity(0);

      await reinsurancePool.setVtotalLiquidity(0);

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);
      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);
    });

    it("should correctly not deploye leverage and virtual stable by policy book - mpl zero", async () => {
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, 0, 0);
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);
      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);
    });

    it("should correctly not deploye leverage and virtual stable by policy book - cover zero", async () => {
      await policyBookMock.setTotalCoverTokens(0);

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);
      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);
    });
  });

  describe("deployeLeverageAndVirtualStable - rebalancing", async () => {
    const totalLiquidityAmount1 = toBN(toWei("1000000"));
    const coverTokensAmount1 = toBN(toWei("500000"));
    const totalLiquidityAmount2 = toBN(toWei("10000"));
    const coverTokensAmount2 = toBN(toWei("6000"));
    const totalLiquidityAmount3 = toBN(toWei("100000"));
    const coverTokensAmount3 = toBN(toWei("30000"));

    const liquidityAmount1 = toBN(toWei("150000"));
    const liquidityAmount2 = toBN(toWei("2000"));
    const liquidityAmount3 = toBN(toWei("15000"));
    const smallLiquidityAmount = toBN(toWei("10000"));

    const virtualLiquidityAmount = toBN(toWei("1000000"));

    const epochPeriod = toBN(604800); // 7 days

    const epochsNumber = toBN(5);

    beforeEach("setup", async () => {
      const stblLiquidityAmount2 = getStableAmount("2000");
      const stblLiquidityAmount3 = getStableAmount("15000");
      const stblLiquidityAmount1 = getStableAmount("150000");

      //setup for user leverage pool - 1 MM
      await userLeveragePool.setVtotalLiquidity(virtualLiquidityAmount);
      // setup fot reinsurance pool - 1 MM
      await reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount);
      // setup for policy book - liq 1 MM and cover 500,000
      await policyBookMock.setTotalLiquidity(totalLiquidityAmount1);
      await policyBookMock.setTotalCoverTokens(coverTokensAmount1);
      // set MPL for policy book for both pools RP and UserLP
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, PRECISION.times(80), PRECISION.times(30));

      // setup pool2
      // setup for policy book - liq 10 KK and cover 6000
      await policyBookMock2.setTotalLiquidity(totalLiquidityAmount2);
      await policyBookMock2.setTotalCoverTokens(coverTokensAmount2);
      // set MPL for policy book for both pools RP and UserLP
      await policyBookAdmin.setPolicyBookFacadeMPLs(
        policyBookFacade2.address,
        PRECISION.times(80),
        PRECISION.times(30)
      );

      // setup pool3
      // setup for policy book - liq 100 KK and cover 30000
      await policyBookMock3.setTotalLiquidity(totalLiquidityAmount3);
      await policyBookMock3.setTotalCoverTokens(coverTokensAmount3);
      // set MPL for policy book for both pools RP and UserLP
      await policyBookAdmin.setPolicyBookFacadeMPLs(
        policyBookFacade3.address,
        PRECISION.times(80),
        PRECISION.times(50)
      );

      await stbl.transfer(USER1, stblLiquidityAmount1.times(2));

      await stbl.approve(policyBookMock.address, stblLiquidityAmount1.times(2), { from: USER1 });

      await stbl.transfer(USER2, stblLiquidityAmount2);

      await stbl.approve(policyBookMock2.address, stblLiquidityAmount2, { from: USER2 });

      await stbl.transfer(USER3, stblLiquidityAmount3);

      await stbl.approve(policyBookMock3.address, stblLiquidityAmount3, { from: USER3 });
    });

    it("should correctly deleverage deployed funds by policy book", async () => {
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      await policyBookMock.approve(policyBookMock.address, liquidityAmount1, { from: USER1 });

      await policyBookFacade.requestWithdrawal((await policyBookMock.balanceOf(USER1)).toString(), { from: USER1 });

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      // withdraw liq - rebalance
      await policyBookFacade.withdrawLiquidity({ from: USER1 });

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("4954545.454545454545454545")
      );

      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("952018.27875095201827875"));
      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("547981.72124904798172125"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("6454545.454545454545454545"));

      assert.equal(
        (await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("4954545.454545454545454545")
      );

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), toWei("1500000"));
      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("952018.27875095201827875")
      );
    });

    it("should correctly rebalance deployed funds by policy book - buy policy", async () => {
      await policyBookFacade.buyPolicy(toBN(5), toBN(toWei("100000")), { from: USER1 });

      assert.closeTo(
        toBN(await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toNumber(),
        toBN(toWei("6090311.822929883736960438")).toNumber(),
        toBN(toWei("0.9")).toNumber()
      );

      assert.closeTo(
        toBN(await policyBookFacade.VUreinsurnacePool()).toNumber(),
        toBN(toWei("966530.999538164251207729")).toNumber(),
        toBN(toWei("0.9")).toNumber()
      );
      assert.closeTo(
        toBN(await policyBookFacade.LUreinsurnacePool()).toNumber(),
        toBN(toWei("34188.428200915419296309")).toNumber(),
        toBN(toWei("0.9")).toNumber()
      );

      assert.closeTo(
        toBN(await policyBookFacade.totalLeveragedLiquidity()).toNumber(),
        toBN(toWei("7091031.250668963407464476")).toNumber(),
        toBN(toWei("0.9")).toNumber()
      );

      assert.closeTo(
        toBN(await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toNumber(),
        toBN(toWei("6090311.822929883736960438")).toNumber(),
        toBN(toWei("0.9")).toNumber()
      );

      assert.closeTo(
        toBN(await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toNumber(),
        toBN(toWei("1000719.427739079670504038")).toNumber(),
        toBN(toWei("0.9")).toNumber()
      );
      assert.closeTo(
        toBN(await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toNumber(),
        toBN(toWei("966530.999538164251207729")).toNumber(),
        toBN(toWei("0.9")).toNumber()
      );
    });

    it("should correctly deleverage deployed funds  by user leverage pool", async () => {
      await userLeveragePool.addInvestedPools(policyBookMock.address);
      await userLeveragePool.addInvestedPools(policyBookMock2.address);
      await userLeveragePool.addInvestedPools(policyBookMock3.address);

      const partialAmount = toBN(toWei("500000"));
      const stblPartialAmount = getStableAmount("500000");

      userLeveragePool.setVtotalLiquidity(partialAmount);

      await stbl.transfer(USER1, stblPartialAmount.times(2));

      await stbl.approve(userLeveragePool.address, stblPartialAmount.times(2), { from: USER1 });

      await userLeveragePool.addLiquidity(partialAmount, { from: USER1 });

      await userLeveragePool.approve(userLeveragePool.address, partialAmount, { from: USER1 });

      await userLeveragePool.requestWithdrawal(toBN(toWei("250000")), { from: USER1 });

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      // withdraw liq - rebalance
      await userLeveragePool.withdrawLiquidity({ from: USER1 });

      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("3892857.142857142857142857")
      );

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("3892857.142857142857142857"));
    });

    it("should correctly deleverage deployed funds  by reinsurance pool", async () => {
      await reinsurancePool.addInvestedPools(policyBookMock.address);
      await reinsurancePool.addInvestedPools(policyBookMock2.address);
      await reinsurancePool.addInvestedPools(policyBookMock3.address);

      const partialAmount1 = toBN(toWei("500000"));

      await reinsurancePool.setVtotalLiquidity(toBN(virtualLiquidityAmount).times(2));
      await reinsurancePool.reevaluateProvidedLeverageStable(toBN(partialAmount1).times(2), { from: USER1 });

      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("1904036.557501904036557501"));

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("1015606.299640953106299641"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("2919642.857142857142857142"));

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("2919642.857142857142857142")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("1904036.557501904036557501")
      );
      // pool2
      assert.equal((await policyBookFacade2.VUreinsurnacePool()).toString(), toWei("27418.126428027418126428"));
      assert.equal((await policyBookFacade2.LUreinsurnacePool()).toString(), toWei("8474.730714829724730714"));

      assert.equal((await policyBookFacade2.totalLeveragedLiquidity()).toString(), toWei("35892.857142857142857142"));

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock2.address)).toString(),
        toWei("35892.857142857142857142")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock2.address)).toString(),
        toWei("27418.126428027418126428")
      );
      // pool3

      assert.equal((await policyBookFacade3.LUreinsurnacePool()).toString(), toWei("136315.795041042565795041"));
      assert.equal((await policyBookFacade3.VUreinsurnacePool()).toString(), toWei("68545.31607006854531607"));

      assert.equal((await policyBookFacade3.totalLeveragedLiquidity()).toString(), toWei("204861.111111111111111111"));
      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock3.address)).toString(),
        toWei("204861.111111111111111111")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock3.address)).toString(),
        toWei("68545.31607006854531607")
      );

      //deleverage
      await reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount);

      await reinsurancePool.reevaluateProvidedLeverageStable(partialAmount1, { from: USER1 });

      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("952018.278750952018278750"));

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), toWei("547981.72124904798172125"));

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("1500000"));

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), toWei("1500000"));

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("952018.278750952018278750")
      );
      // pool2
      assert.equal((await policyBookFacade2.VUreinsurnacePool()).toString(), toWei("13709.063214013709063214"));
      assert.equal((await policyBookFacade2.LUreinsurnacePool()).toString(), toWei("9131.845876895381845876"));

      assert.equal((await policyBookFacade2.totalLeveragedLiquidity()).toString(), toWei("22840.90909090909090909"));

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock2.address)).toString(),
        toWei("22840.90909090909090909")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock2.address)).toString(),
        toWei("13709.063214013709063214")
      );
      // pool3

      assert.equal((await policyBookFacade3.LUreinsurnacePool()).toString(), toWei("107554.265041888804265041"));
      assert.equal((await policyBookFacade3.VUreinsurnacePool()).toString(), toWei("34272.658035034272658035"));

      assert.equal((await policyBookFacade3.totalLeveragedLiquidity()).toString(), toWei("141826.923076923076923076"));
      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock3.address)).toString(),
        toWei("141826.923076923076923076")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock3.address)).toString(),
        toWei("34272.658035034272658035")
      );
    });

    it("should correctly deleverage deployed funds by policy book - total liq zero", async () => {
      await policyBookMock.setTotalCoverTokens(toBN(toWei("75000")));
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });
      assert.isTrue(toBN(await policyBookFacade.totalLeveragedLiquidity()).gt(0));
      await policyBookMock.setTotalCoverTokens(0);
      await policyBookMock.approve(policyBookMock.address, liquidityAmount1, { from: USER1 });

      await policyBookFacade.requestWithdrawal((await policyBookMock.balanceOf(USER1)).toString(), { from: USER1 });

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      // withdraw liq - rebalance
      await policyBookFacade.withdrawLiquidity({ from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);
      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);
    });

    it("should correctly deleverage deployed funds by policy book - total cover zero", async () => {
      await policyBookMock.setTotalCoverTokens(toBN(toWei("75000")));
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });
      assert.isTrue(toBN(await policyBookFacade.totalLeveragedLiquidity()).gt(0));
      await policyBookMock.setTotalCoverTokens(0);
      await policyBookMock.approve(policyBookMock.address, liquidityAmount1, { from: USER1 });

      await policyBookFacade.requestWithdrawal(toWei("100"), { from: USER1 });

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      // withdraw liq - rebalance
      await policyBookFacade.withdrawLiquidity({ from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);
      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);
    });

    it("should correctly deleverage deployed funds by policy book - mpl zero", async () => {
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });
      assert.isTrue(toBN(await policyBookFacade.totalLeveragedLiquidity()).gt(0));
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, 0, 0);
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });
      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);
      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);
    });

    it("should correctly deleverage deployed funds by leverage pool - leverage liq zero", async () => {
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });
      assert.isTrue(toBN(await policyBookFacade.totalLeveragedLiquidity()).gt(0));
      await userLeveragePool.setVtotalLiquidity(0);
      await reinsurancePool.setVtotalLiquidity(0);

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), 0);

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);
      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);
    });
  });

  describe("userLeverageMuliplier", async () => {
    it("should correctly calculate multiplier", async () => {
      // setup protocol constant
      await policyBookAdmin.setLeveragePortfolioProtocolConstant(
        userLeveragePool.address,
        PRECISION.times(45),
        PRECISION.times(2),
        PRECISION.times(100),
        PRECISION.times(100)
      );

      const M1 = "4.5454545454545454545454545";
      const M2 = "14.2857142857142857142857142";
      const M3 = "6.4516129032258064516129032";

      let poolUR = PRECISION.times(1);
      assert.equal(
        toBN(await leveragePortfolioView.calcM(poolUR, userLeveragePool.address)).toString(),
        PRECISION.times(M1).toString()
      );

      poolUR = PRECISION.times(31);
      assert.equal(
        toBN(await leveragePortfolioView.calcM(poolUR, userLeveragePool.address)).toString(),
        PRECISION.times(M2).toString()
      );

      poolUR = PRECISION.times(76);
      assert.equal(
        toBN(await leveragePortfolioView.calcM(poolUR, userLeveragePool.address)).toString(),
        PRECISION.times(M3).toString()
      );
    });
  });
});
