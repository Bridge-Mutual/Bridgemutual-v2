const PolicyBook = artifacts.require("PolicyBookMock");
const PolicyQuote = artifacts.require("PolicyQuoteMock");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WrappedTokenMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const PriceFeed = artifacts.require("PriceFeed");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const UserLeveragePool = artifacts.require("UserLeveragePoolMock");
const CapitalPool = artifacts.require("CapitalPoolMock");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const ShieldMining = artifacts.require("ShieldMining");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const ClaimVoting = artifacts.require("ClaimVoting");
const YieldGenerator = artifacts.require("YieldGenerator");

const Reverter = require("./helpers/reverter");
const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");
const truffleAssert = require("truffle-assertions");
const { ethers } = require("ethers");
const { assert } = require("chai");
const BigNumber = require("bignumber.js");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

const ContractType = {
  CONTRACT: 0,
  STABLECOIN: 1,
  SERVICE: 2,
  EXCHANGE: 3,
  VARIOUS: 4,
};
const ClaimStatus = {
  CAN_CLAIM: 0,
  UNCLAIMABLE: 1,
  PENDING: 2,
  AWAITING_CALCULATION: 3,
  REJECTED_CAN_APPEAL: 4,
  REJECTED: 5,
  ACCEPTED: 6,
};

const WithdrawalStatus = {
  NONE: 0,
  PENDING: 1,
  READY: 2,
  EXPIRED: 3,
};

const BN = web3.utils.BN;
const wei = web3.utils.toWei;

function toBNN(number) {
  return new BigNumber(number);
}

function toBN(value) {
  if (typeof value === "number") value = value.toString();
  return new BN(value);
}

function toWeiBN(value) {
  if (typeof value === "number") value = value.toString();
  return new BN(wei(value));
}

function toMWeiBN(value) {
  if (typeof value === "number") value = value.toString();
  return new BN(wei(value, "mwei"));
}

async function getBlockTimestamp() {
  const latest = toBN(await web3.eth.getBlockNumber());
  return (await web3.eth.getBlock(latest)).timestamp;
}

const secondsInADay = 60 * 60 * 24;
const nonProtocolMultiplier = 0.8;

const setDay = async (day) => {
  const timestamp = await getBlockTimestamp();
  await setCurrentTime(timestamp + secondsInADay * day);
};

contract("PolicyBookPremiumDistribution", async (accounts) => {
  const reverter = new Reverter(web3);

  let policyBook;
  let stbl;
  let policyQuote;
  let nftStaking;
  let userLeveragePool;
  let capitalPool;

  let network;

  const insuranceContract = accounts[4];
  const insuranceContract2 = accounts[5];
  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const USER3 = accounts[3];
  const NOTHING = accounts[9];

  const PRECISION = toBNN(10).pow(25);

  const TOKEN = "0x0000000000000000000000000000000000000000";

  const liquidityAmount = toWeiBN("300000");

  before("setup", async () => {
    network = await getNetwork();
    const contractsRegistry = await ContractsRegistry.new();
    if (network == Networks.ETH) {
      stbl = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stbl = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }

    const _policyBookImpl = await PolicyBook.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();

    const weth = await WETHMock.new("weth", "weth");
    const sushiswapRouterMock = await SushiswapRouterMock.new();
    const bmi = await BMIMock.new(USER1);

    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _priceFeed = await PriceFeed.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _policyQuote = await PolicyQuote.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _claimVoting = await ClaimVoting.new();
    const _yieldGenerator = await YieldGenerator.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REPUTATION_SYSTEM_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.STKBMI_STAKING_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), sushiswapRouterMock.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGenerator.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CLAIM_VOTING_NAME(), _claimVoting.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_REGISTRY_NAME(), _liquidityRegistry.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_REGISTRY_NAME(), _policyRegistry.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(),
      _policyBookRegistry.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_FABRIC_NAME(),
      _policyBookFabric.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      _claimingRegistry.address
    );
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
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    const claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());
    const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await claimVoting.__ClaimVoting_init();
    await rewardsGenerator.__RewardsGenerator_init();
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();
    await bmiUtilityNFT.__BMIUtilityNFT_init();
    await yieldGenerator.__YieldGenerator_init(network);

    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_UTILITY_NFT_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());

    if (network == Networks.ETH || network == Networks.POL) {
      await sushiswapRouterMock.setReserve(stbl.address, wei(toBN(10 ** 3).toString()));
    } else if (network == Networks.BSC) {
      await sushiswapRouterMock.setReserve(stbl.address, wei(toBN(10 ** 15).toString()));
    }

    await sushiswapRouterMock.setReserve(weth.address, wei(toBN(10 ** 15).toString()));
    await sushiswapRouterMock.setReserve(bmi.address, wei(toBN(10 ** 15).toString()));

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

    const tx = await policyBookFabric.createLeveragePools(
      insuranceContract2,
      ContractType.VARIOUS,
      "User Leverage Pool",
      "USDT"
    );
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);

    const initialDeposit = wei("1000");
    const stblInitialDeposit = getStableAmount("1000");
    await stbl.approve(policyBookFabric.address, stblInitialDeposit);

    await setDay(1);

    const policyBookAddr = (
      await policyBookFabric.create(
        insuranceContract,
        ContractType.CONTRACT,
        "placeholder",
        "placeholder",
        initialDeposit,
        TOKEN
      )
    ).logs[0].args.at;
    policyBook = await PolicyBook.at(policyBookAddr);
    const policyBookFacadeAddr = await policyBook.policyBookFacade();
    policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddr);
    //await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade.address, true);

    await stbl.mintArbitrary(USER1, getStableAmount("200000"));
    await stbl.approve(policyBook.address, getStableAmount("200000"), { from: USER1 });

    await stbl.mintArbitrary(USER2, getStableAmount("200000"));
    await stbl.approve(policyBook.address, getStableAmount("200000"), { from: USER2 });

    await stbl.mintArbitrary(USER3, getStableAmount("200000"));
    await stbl.approve(policyBook.address, getStableAmount("200000"), { from: USER3 });

    await policyBookFacade.addLiquidity(liquidityAmount.div(toBN(3)), { from: USER1 });
    await policyBookFacade.addLiquidity(liquidityAmount.div(toBN(3)), { from: USER2 });
    await policyBookFacade.addLiquidity(liquidityAmount.div(toBN(3)), { from: USER3 });

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  const approximatelyEqual = (bn1, bn2, precision = toBN(wei("20"))) => {
    const difference = bn1.sub(bn2).abs();
    assert.isTrue(
      difference.lt(precision),
      `${web3.utils.fromWei(bn1).toString()} is not approximately equal to ${web3.utils.fromWei(bn2).toString()}`
    );
  };

  const compareLiquidity = async (additional) => {
    approximatelyEqual(
      await policyBook.totalLiquidity(),
      liquidityAmount.add(toWeiBN("1000")).add(toWeiBN(additional))
    );
  };

  const triggerDistribution = async () => {
    return await policyBook.triggerPremiumsDistribution();
  };

  describe("calculations", async () => {
    it("should correctly distribute with a large gap in calculation", async () => {
      const tokenAmount = 400;
      await policyQuote.setQuote(toWeiBN(tokenAmount / 4));
      await policyBookFacade.buyPolicy(5, toWeiBN("1000"), { from: USER1 });
      await policyQuote.setQuote(toWeiBN((tokenAmount / 4) * 3));
      await policyBookFacade.buyPolicy(20, toWeiBN("2000"), { from: USER2 });

      const epoch = await policyBook.lastPremiumDistributionEpoch();

      await setDay(301);

      await triggerDistribution(); // 90 days
      await triggerDistribution(); // 90 days

      await compareLiquidity(tokenAmount * nonProtocolMultiplier);
      assert.equal(toBN(await policyBook.lastPremiumDistributionEpoch()).toString(), epoch.toNumber() + 182);
    });

    it("should correctly distribute larger than max and then distribute zeros", async () => {
      await setDay(1);

      const tokenAmount = 400;
      await policyQuote.setQuote(toWeiBN(tokenAmount / 4));
      await policyBookFacade.buyPolicy(5, toWeiBN("1000"), { from: USER1 });
      await policyQuote.setQuote(toWeiBN((tokenAmount / 4) * 3));
      await policyBookFacade.buyPolicy(20, toWeiBN("2000"), { from: USER2 });

      await setDay(201);
      await triggerDistribution(); // 90 days
      await triggerDistribution(); // 90 days

      await compareLiquidity(tokenAmount * nonProtocolMultiplier);

      await setDay(401);
      await triggerDistribution();

      await compareLiquidity(tokenAmount * nonProtocolMultiplier);
    });

    it("should not distribute on the same day", async () => {
      await setDay(1);

      const tokenAmount = 400;
      await policyQuote.setQuote(toWeiBN(tokenAmount / 4));
      await policyBookFacade.buyPolicy(5, toWeiBN("1000"), { from: USER1 });
      await policyQuote.setQuote(toWeiBN((tokenAmount / 4) * 3));
      await policyBookFacade.buyPolicy(20, toWeiBN("2000"), { from: USER2 });

      await triggerDistribution();

      await compareLiquidity(0);
    });

    it("should distribute correct amount on the next day", async () => {
      const tokenAmount1 = 252;
      const tokenAmount2 = 210;

      await setDay(1);

      await policyQuote.setQuote(toWeiBN(tokenAmount1));
      await policyBookFacade.buyPolicy(4, toWeiBN("1000"), { from: USER1 });
      await policyQuote.setQuote(toWeiBN(tokenAmount2));
      await policyBookFacade.buyPolicy(1, toWeiBN("2000"), { from: USER2 });

      await setDay(2);
      await triggerDistribution();

      await compareLiquidity(((tokenAmount1 + tokenAmount2) / 7) * nonProtocolMultiplier);
    });

    it("should distribute correct amount on the last days", async () => {
      await setDay(1);

      const tokenAmount = 140;
      await policyQuote.setQuote(toWeiBN(tokenAmount));
      await policyBookFacade.buyPolicy(1, toWeiBN("2000"), { from: USER2 });

      await setDay(14);
      await triggerDistribution();
      await compareLiquidity(((tokenAmount * 13) / 14) * nonProtocolMultiplier);
      await setDay(15);
      await triggerDistribution();
      await compareLiquidity(tokenAmount * nonProtocolMultiplier);
      await setDay(16);
      await triggerDistribution();
      await compareLiquidity(tokenAmount * nonProtocolMultiplier);
    });

    it("should not distribute in the same day twice", async () => {
      await setDay(1);

      const tokenAmount = 140;
      await policyQuote.setQuote(toWeiBN(tokenAmount));
      await policyBookFacade.buyPolicy(1, toWeiBN("2000"), { from: USER2 });

      await setDay(2);
      await triggerDistribution();
      await compareLiquidity((tokenAmount / 14) * nonProtocolMultiplier);
      await triggerDistribution();
      await compareLiquidity((tokenAmount / 14) * nonProtocolMultiplier);
    });
  });

  describe("triggers", async () => {
    const tokenAmount = 140;

    beforeEach(async () => {
      await setDay(1);

      await policyQuote.setQuote(toWeiBN(tokenAmount));
      await policyBookFacade.buyPolicy(1, toWeiBN("2000"), { from: USER1 });
    });

    it("buy policy distributes premiums", async () => {
      await setDay(2);
      await policyBookFacade.buyPolicy(1, toWeiBN("2000"), { from: USER2 });

      await compareLiquidity((tokenAmount / 14) * nonProtocolMultiplier);
    });

    it("add liquidity distributes premiums", async () => {
      await setDay(2);
      await policyBookFacade.addLiquidity(toWeiBN("10"), { from: USER1 });

      await compareLiquidity((tokenAmount / 14) * nonProtocolMultiplier + 10);
    });

    it("request withdrawal distributes premiums", async () => {
      await setDay(2);
      await policyBook.approve(policyBook.address, toBN("10"), { from: USER1 });
      await policyBookFacade.requestWithdrawal(toBN("10"), { from: USER1 });

      await compareLiquidity((tokenAmount / 14) * nonProtocolMultiplier);
    });

    it("withdraw liquidity distributes premiums", async () => {
      await capitalPool.setliquidityCushionBalance(wei("1000"));
      await policyBook.approve(policyBook.address, toBN("10"), { from: USER1 });
      await policyBookFacade.requestWithdrawal(toBN("10"), { from: USER1 });
      const secsInDay = 24 * 60 * 60;
      const withdrawPeriodPlusOne = (await capitalPool.getWithdrawPeriod()).toNumber() / secsInDay + 1;
      await setDay(withdrawPeriodPlusOne);
      await policyBookFacade.withdrawLiquidity({ from: USER1 });

      await compareLiquidity(tokenAmount * nonProtocolMultiplier * (withdrawPeriodPlusOne / 14));
    });
  });
});
