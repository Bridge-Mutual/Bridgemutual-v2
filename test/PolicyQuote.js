const ContractsRegistry = artifacts.require("ContractsRegistry");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyQuote = artifacts.require("PolicyQuote");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const CapitalPool = artifacts.require("CapitalPool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const NFTStaking = artifacts.require("NFTStaking");
const ShieldMining = artifacts.require("ShieldMining");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const UserLeveragePool = artifacts.require("UserLeveragePoolMock");
const YieldGenerator = artifacts.require("YieldGenerator");

const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

const { assert } = require("chai");
const { ethers } = require("ethers");

const ContractType = {
  CONTRACT: 0,
  STABLECOIN: 1,
  SERVICE: 2,
  EXCHANGE: 3,
  VARIOUS: 4,
};

function toBN(number) {
  return new BigNumber(number);
}

const { toWei } = web3.utils;
const wei = web3.utils.toWei;
const PRECISION = toBN(10).pow(25);

contract("PolicyQuote", async (accounts) => {
  const reverter = new Reverter(web3);

  let contractsRegistry;
  let stbl;

  let policyQuote;
  let policyBookMock;

  let policyBookAdmin;

  let network;

  const insuranceContract = accounts[8];
  const insuranceContract2 = accounts[7];
  const NOTHING = accounts[9];

  const epochsNumber = 5;
  const coverTokensAmount = toWei("1000");

  /*
   * QUOTE_SCENARIO_A:
   * quote for a policy book that has the following setup
   * * Utilization ratio > 51
   * * Quote is for a yearly
   * * Policybook is not whitelisted (Considerated Moderate Risk)
   */
  const QUOTE_SCENARIO_A = toBN(wei("159375")).idiv(10);

  /*
   * QUOTE_SCENARIO_B:
   * quote for a policy book that has the following setup
   * * Utilization ratio > 51
   * * Quote is for a yearly
   * * Policybook is whitelisted (Considerated Safe Risk)
   */
  const QUOTE_SCENARIO_B = toBN(wei("6375"));

  const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
  const MINIMUM_INSURANCE_COST = toBN(wei("10"));

  before("setup", async () => {
    network = await getNetwork();
    contractsRegistry = await ContractsRegistry.new();
    if (network == Networks.ETH) {
      stbl = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stbl = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyQuote = await PolicyQuote.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _nftStaking = await NFTStaking.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _yieldGenerator = await YieldGenerator.new();

    const _policyBookImpl = await PolicyBookMock.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);

    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.PRICE_FEED_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_FABRIC_NAME(),
      _policyBookFabric.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_REGISTRY_NAME(), _policyRegistry.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(),
      _policyBookRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      _claimingRegistry.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_REGISTRY_NAME(),
      _liquidityRegistry.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGenerator.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_NAME(),
      _bmiCoverStaking.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.NFT_STAKING_NAME(), _nftStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    const capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await rewardsGenerator.__RewardsGenerator_init(network);
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();
    await yieldGenerator.__YieldGenerator_init(network);

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());

    const initialDeposit = toWei("1000");
    const stblInitialDeposit = getStableAmount("1000");

    await stbl.approve(policyBookFabric.address, stblInitialDeposit);

    // CREATION PB
    let tx = await policyBookFabric.create(
      insuranceContract,
      ContractType.CONTRACT,
      "test description",
      "TEST",
      initialDeposit,
      ethers.constants.AddressZero
    );
    const policyBookAddress = tx.logs[0].args.at;
    policyBookMock = await PolicyBookMock.at(policyBookAddress);
    const policyBookFacadeAddress = await policyBookMock.policyBookFacade();
    policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddress);
    await policyBookAdmin.whitelist(policyBookAddress, true);
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

    tx = await policyBookFabric.createLeveragePools(
      insuranceContract2,
      ContractType.VARIOUS,
      "User Leverage Pool",
      "USDT"
    );
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("getQuote", async () => {
    let seconds;
    let myMoney;
    let total;
    let bought;

    it("calculating annual cost where UR = 51% < RISKY, (doc example 1)", async () => {
      seconds = SECONDS_IN_YEAR;
      myMoney = wei("100000"); // 100k
      total = wei("10000000"); // 10mil
      bought = wei("5000000"); // 5mil

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));

      assert.equal(calculatedRiskyPrice.toString(), QUOTE_SCENARIO_A.toString(), "UR < RISKY case is incorrect");
      assert.equal(
        calculatedSafePrice.toString(),
        QUOTE_SCENARIO_B.toString(),
        "Safe asset UR < RISKY case is incorrect"
      );
    });

    it("calculating annual cost where UR = 90% > RISKY, (doc example 2)", async () => {
      seconds = SECONDS_IN_YEAR;
      myMoney = wei("4000000"); // 4mil
      total = wei("10000000"); // 10mil
      bought = wei("5000000"); // 5mil

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));

      assert.equal(calculatedRiskyPrice.toString(), toBN(wei("2500000")).toString(), "UR > RISKY case is incorrect");
      assert.equal(
        calculatedSafePrice.toString(),
        toBN(wei("1200000")).toString(),
        "Safe asset UR < RISKY case is incorrect"
      );
    });

    it("calculating annual cost where UR = 3% < RISKY", async () => {
      seconds = SECONDS_IN_YEAR;
      myMoney = wei("100000"); // 100k
      total = wei("10000000"); // 10mil
      bought = wei("200000"); // 200k

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));

      assert.equal(calculatedRiskyPrice.toString(), toBN(wei("2000")), "UR < RISKY case is incorrect");
      assert.equal(calculatedSafePrice.toString(), toBN(wei("2000")), "Safe asset UR < RISKY case is incorrect");
    });

    it("calculating 100 days cost where UR = 51% < RISKY", async () => {
      seconds = 100 * 24 * 60 * 60;
      myMoney = wei("100000"); // 100k
      total = wei("10000000"); // 10mil
      bought = wei("5000000"); // 5mil

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));

      const riskyExpectedPrice = QUOTE_SCENARIO_A.times(seconds).idiv(SECONDS_IN_YEAR);
      const safeExpectedPrice = QUOTE_SCENARIO_B.times(seconds).idiv(SECONDS_IN_YEAR);

      assert.equal(calculatedRiskyPrice.toString(), riskyExpectedPrice.toString(), "UR < RISKY case is incorrect");
      assert.equal(
        calculatedSafePrice.toString(),
        safeExpectedPrice.toString(),
        "Safe asset UR < RISKY case is incorrect"
      );
    });

    it("calculating 3 day cost where UR = 51% < RISKY", async () => {
      seconds = 3 * 24 * 60 * 60;
      myMoney = wei("100000"); // 100k
      total = wei("10000000"); // 10mil
      bought = wei("5000000"); // 5mil

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));

      const riskyExpectedPrice = QUOTE_SCENARIO_A.times(seconds).idiv(SECONDS_IN_YEAR);
      const safeExpectedPrice = QUOTE_SCENARIO_B.times(seconds).idiv(SECONDS_IN_YEAR);

      assert.equal(calculatedRiskyPrice.toString(), riskyExpectedPrice.toString(), "UR < RISKY case is incorrect");
      assert.equal(
        calculatedSafePrice.toString(),
        safeExpectedPrice.toString(),
        "Safe asset UR < RISKY case is incorrect"
      );
    });

    it("calculating 99 days cost where UR = 51% < RISKY", async () => {
      seconds = 99 * 24 * 60 * 60;
      myMoney = wei("100000"); // 100k
      total = wei("10000000"); // 10mil
      bought = wei("5000000"); // 5mil

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));

      const riskyExpectedPrice = QUOTE_SCENARIO_A.times(seconds).idiv(SECONDS_IN_YEAR);
      const safeExpectedPrice = QUOTE_SCENARIO_B.times(seconds).idiv(SECONDS_IN_YEAR);

      assert.equal(calculatedRiskyPrice.toString(), riskyExpectedPrice.toString(), "UR < RISKY case is incorrect");
      assert.equal(
        calculatedSafePrice.toString(),
        safeExpectedPrice.toString(),
        "Safe asset UR < RISKY case is incorrect"
      );
    });

    it("calculating 0 seconds cost", async () => {
      seconds = 0;
      myMoney = wei("100000"); // 100k
      total = wei("10000000"); // 10mil
      bought = wei("5000000"); // 5mil

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      await truffleAssert.reverts(
        policyQuote.getQuote(seconds, myMoney, policyBookMock.address),
        "PolicyQuote: Invalid duration"
      );
    });

    it("calculating 10 years cost", async () => {
      seconds = 10 * 365 * 24 * 60 * 60;
      myMoney = wei("100000"); // 100k
      total = wei("10000000"); // 10mil
      bought = wei("5000000"); // 5mil

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      await truffleAssert.reverts(
        policyQuote.getQuote(seconds, myMoney, policyBookMock.address),
        "PolicyQuote: Invalid duration"
      );
    });

    it("calculating annual cost, forcing minimal percentage threshold", async () => {
      seconds = SECONDS_IN_YEAR;
      myMoney = wei("10000");
      total = wei("10000000"); // 10mil
      bought = 0;

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));

      const riskyExpectedPrice = toBN(wei("200"));

      assert.equal(calculatedRiskyPrice.toString(), riskyExpectedPrice.toString(), "Less than minimal");
      assert.equal(
        calculatedRiskyPrice.toString(),
        calculatedSafePrice.toString(),
        "Unexpected cost difference between asset classes"
      );
    });

    it("calculating annual cost, forcing minimal cost threshold", async () => {
      seconds = 10;
      myMoney = wei("10");
      total = wei("10000000"); // 10mil
      bought = 0;

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));

      assert.equal(calculatedRiskyPrice.toString(), MINIMUM_INSURANCE_COST.toString());
      assert.equal(calculatedSafePrice.toString(), MINIMUM_INSURANCE_COST.toString());
    });

    it("calculating 1 year cost where UR = 51% < RISKY + really big money", async () => {
      seconds = toBN(365).times(24).times(60).times(60); // 10 years
      myMoney = wei(toBN(10).pow(12).toString()); // 1tril
      total = wei(toBN(10).pow(14).toString()); // 100tril
      bought = wei(toBN(10).pow(13).times(5).toString()); // 50tril

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      const riskyExpectedPrice = toBN(wei("159375000000"));

      assert.equal(calculatedRiskyPrice.toString(), riskyExpectedPrice.toString(), "UR < RISKY case is incorrect");
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);

      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      const safeExpectedPrice = toBN(wei("63750000000"));

      assert.equal(
        calculatedSafePrice.toString(),
        safeExpectedPrice.toString(),
        "Safe asset UR < RISKY case is incorrect"
      );
    });

    it("edge case: calculating annual cost where UR = 100% > RISKY", async () => {
      seconds = SECONDS_IN_YEAR;
      myMoney = wei("500000"); // 500k
      total = wei("1000000"); // 1mil
      bought = wei("500000"); // 500k

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      const calculatedRiskyPrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);
      const calculatedSafePrice = toBN(await policyQuote.getQuote(seconds, myMoney, policyBookMock.address));

      assert.equal(calculatedRiskyPrice.toString(), toBN(wei("500000")).toString(), "UR > RISKY case is incorrect");
      assert.equal(calculatedSafePrice.toString(), toBN(wei("250000")).toString(), "UR > RISKY case is incorrect");
    });

    it("require more tokens than there exists (should revert)", async () => {
      seconds = SECONDS_IN_YEAR;
      myMoney = wei("600000"); // 600k
      total = wei("1000000"); // 1mil
      bought = wei("500000"); // 500k

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      await truffleAssert.reverts(
        policyQuote.getQuote(seconds, myMoney, policyBookMock.address),
        "PolicyQuote: Requiring more than there exists"
      );
    });

    it("pool is empty (should revert)", async () => {
      seconds = SECONDS_IN_YEAR;
      myMoney = wei("1"); // 0
      total = 0; // 0
      bought = 0; // 0

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      await truffleAssert.reverts(
        policyQuote.getQuote(seconds, myMoney, policyBookMock.address),
        "PolicyQuote: Requiring more than there exists"
      );
    });

    it("forcing overflow (should revert)", async () => {
      seconds = SECONDS_IN_YEAR;
      myMoney = toBN(4).times(toBN(10).pow(toBN(76)));
      total = toBN(10).times(toBN(10).pow(toBN(76)));
      bought = toBN(5).times(toBN(10).pow(toBN(76)));

      await policyBookMock.setTotalLiquidity(total);
      await policyBookMock.setTotalCoverTokens(bought);

      await truffleAssert.reverts(
        policyQuote.getQuote(seconds, myMoney, policyBookMock.address),
        "SafeMath: multiplication overflow"
      );
    });
  });
});
