const PolicyBook = artifacts.require("PolicyBook");
const PolicyQuote = artifacts.require("PolicyQuote");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const STBLMock = artifacts.require("STBLMock");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WETHMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const PriceFeed = artifacts.require("PriceFeed");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const LiquidityMining = artifacts.require("LiquidityMining");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const CapitalPool = artifacts.require("CapitalPoolMock");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const UserLeveragePool = artifacts.require("UserLeveragePoolMock");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const PolicyBookFacade = artifacts.require("PolicyBookFacadeMock");
const YieldGenerator = artifacts.require("YieldGenerator");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const ShieldMining = artifacts.require("ShieldMining");

const { time } = require("@openzeppelin/test-helpers");
const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const Wallet = require("ethereumjs-wallet").default;
//const setCurrentTime = require("./helpers/ganacheTimeTraveler");
const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");
const { sign2612 } = require("./helpers/signatures");
const { MAX_UINT256 } = require("./helpers/constants");
const { assert } = require("chai");

const ContractType = {
  CONTRACT: 0,
  STABLECOIN: 1,
  SERVICE: 2,
  EXCHANGE: 3,
  VARIUOS: 4,
};

const WithdrawalStatus = {
  NONE: 0,
  PENDING: 1,
  READY: 2,
  EXPIRED: 3,
};

function toBN(number) {
  return new BigNumber(number);
}

const { toWei } = web3.utils;

contract("UserLeveragePool", async (accounts) => {
  const reverter = new Reverter(web3);

  let contractsRegistry;
  let userLeveragePool;
  let bmiCoverStaking;
  let liquidityMining;
  let stbl;
  let capitalPool;

  let bmi;
  let rewardsGenerator;
  let leveragePortfolioView;

  let policyBookRegistry;
  let claimingRegistry;
  let reinsurancePool;
  let policyBookAdmin;
  let policyBookFabric;

  let bmiUtilityNFT;
  let policyBookFacade;

  const epochPeriod = toBN(604800); // 7 days

  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const USER3 = accounts[3];
  const USER4 = accounts[4];

  const PERCENTAGE_100 = toBN(10).pow(27);
  const APY_PRECISION = toBN(10 ** 5);
  const withdrawalPeriod = toBN(691200); // 8 days

  const NOTHING = accounts[9];

  const getBMIXAmount = async (STBLAmount) => {
    return toBN(await userLeveragePool.convertSTBLToBMIX(STBLAmount));
  };

  const getSTBLAmount = async (bmiXAmount) => {
    return toBN(await userLeveragePool.convertBMIXToSTBL(bmiXAmount));
  };

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    const policyBookImpl = await PolicyBook.new();
    const policyBookFacadeImpl = await PolicyBookFacade.new();
    const userLeveragePoolImpl = await UserLeveragePool.new();
    const weth = await WETHMock.new("weth", "weth");
    const sushiswapRouterMock = await SushiswapRouterMock.new();
    bmi = await BMIMock.new(USER1);
    stbl = await STBLMock.new("stbl", "stbl", 6);
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _capitalPool = await CapitalPool.new();
    const _priceFeed = await PriceFeed.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyQuote = await PolicyQuote.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _shieldMining = await ShieldMining.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _liquidityMining = await LiquidityMining.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _yieldGenerator = await YieldGenerator.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();

    await contractsRegistry.__ContractsRegistry_init();
    await contractsRegistry.addContract(await contractsRegistry.VBMI_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LEGACY_REWARDS_GENERATOR_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.WETH_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.SUSHISWAP_ROUTER_NAME(), sushiswapRouterMock.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.LIQUIDITY_MINING_NAME(), _liquidityMining.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_NAME(),
      _bmiCoverStaking.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);
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

    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);

    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), _bmiUtilityNFT.address);

    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    liquidityMining = await LiquidityMining.at(await contractsRegistry.getLiquidityMiningContract());

    bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());

    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());

    await policyBookFabric.__PolicyBookFabric_init();

    await bmiCoverStaking.__BMICoverStaking_init();
    await rewardsGenerator.__RewardsGenerator_init();
    await liquidityMining.__LiquidityMining_init();

    await policyBookAdmin.__PolicyBookAdmin_init(
      policyBookImpl.address,
      policyBookFacadeImpl.address,
      userLeveragePoolImpl.address
    );
    await bmiUtilityNFT.__BMIUtilityNFT_init();
    await capitalPool.__CapitalPool_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

    await sushiswapRouterMock.setReserve(stbl.address, toWei(toBN(10 ** 3).toString()));
    await sushiswapRouterMock.setReserve(weth.address, toWei(toBN(10 ** 15).toString()));
    await sushiswapRouterMock.setReserve(bmi.address, toWei(toBN(10 ** 15).toString()));
    const userLeveragePoolAddress = (
      await policyBookFabric.createLeveragePools(ContractType.VARIUOS, "User Leverage Pool", "LevPf1")
    ).logs[0].args.at;

    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("creation checks", async () => {
    it("should have expected token name", async () => {
      assert.equal(await userLeveragePool.name(), "User Leverage Pool");
    });

    it("should have expected token symbol", async () => {
      assert.equal(await userLeveragePool.symbol(), "bmiV2LevPf1Cover");
    });
  });

  describe("getSTBLToBMIXRatio", async () => {
    let liquidityAmount;
    let totalSupply;

    it("shold return current rate if total supply = 0", async () => {
      assert.equal(toBN(await userLeveragePool.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.toString());
    });

    it("shold return current rate if total supply = total liquidity", async () => {
      liquidityAmount = toBN(toWei("1000"));
      totalSupply = liquidityAmount;

      await userLeveragePool.setVtotalLiquidity(liquidityAmount, { from: USER1 });
      await userLeveragePool.mint(totalSupply, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.toString());
    });

    it("shold return current rate if total supply < total liquidity", async () => {
      liquidityAmount = toBN(toWei("1000"));
      totalSupply = toBN(toWei("200"));

      await userLeveragePool.setVtotalLiquidity(liquidityAmount, { from: USER1 });
      await userLeveragePool.mint(totalSupply, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.times(5).toString());
    });

    it("shold return current rate if total supply > total liquidity", async () => {
      liquidityAmount = toBN(toWei("1000"));
      totalSupply = toBN(toWei("2000"));

      await userLeveragePool.setVtotalLiquidity(liquidityAmount, { from: USER1 });
      await userLeveragePool.mint(totalSupply, { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.getSTBLToBMIXRatio()).toString(),
        PERCENTAGE_100.times(5).div(10).toString()
      );
    });

    it("shold return current rate after several changes", async () => {
      liquidityAmount = toBN(toWei("1000"));
      totalSupply = toBN(toWei("2000"));

      await userLeveragePool.setVtotalLiquidity(liquidityAmount, { from: USER1 });
      await userLeveragePool.mint(totalSupply, { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.getSTBLToBMIXRatio()).toString(),
        PERCENTAGE_100.times(5).div(10).toString()
      );

      liquidityAmount = toBN(toWei("3000"));
      await userLeveragePool.setVtotalLiquidity(liquidityAmount, { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.getSTBLToBMIXRatio()).toString(),
        PERCENTAGE_100.times(15).div(10).toString()
      );

      liquidityAmount = toBN(toWei("1"));
      await userLeveragePool.setVtotalLiquidity(liquidityAmount, { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.getSTBLToBMIXRatio()).toString(),
        PERCENTAGE_100.times(5).div(10000).toString()
      );

      liquidityAmount = toBN(toWei("2000"));
      await userLeveragePool.setVtotalLiquidity(liquidityAmount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.toString());
    });
  });

  describe("addLiquidity", async () => {
    const stblAmount = toBN(toWei("10000", "mwei"));
    const amount = toBN(toWei("1000"));

    let liquidityAmount;
    let totalSupply;

    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);

      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });
    });

    it("should not allow deposit of small value", async () => {
      await truffleAssert.reverts(userLeveragePool.addLiquidity(1000, { from: USER1 }), "LP: Liquidity amount is zero");
    });

    it("should set correct values", async () => {
      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.toString());
      assert.equal(toBN(await userLeveragePool.balanceOf(USER1)).toString(), amount.toString());
      assert.equal(toBN(await stbl.balanceOf(capitalPool.address)).toString(), amount.idiv(10 ** 12).toString());
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(amount.idiv(10 ** 12)).toString());
    });

    it("should update the values correctly", async () => {
      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.toString());
      assert.equal(toBN(await userLeveragePool.balanceOf(USER1)).toString(), amount.toString());
      assert.equal(toBN(await stbl.balanceOf(capitalPool.address)).toString(), amount.idiv(10 ** 12).toString());
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(amount.idiv(10 ** 12)).toString());

      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.times(2).toString());
      assert.equal(toBN(await userLeveragePool.balanceOf(USER1)).toString(), amount.times(2).toString());
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        amount
          .times(2)
          .idiv(10 ** 12)
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount.minus(amount.times(2).idiv(10 ** 12)).toString()
      );
    });

    it("should mint correct BMIX amount if total supply < total liquidity", async () => {
      liquidityAmount = toBN(toWei("1000"));
      totalSupply = toBN(toWei("200"));

      await userLeveragePool.setVtotalLiquidity(liquidityAmount, { from: USER2 });
      await userLeveragePool.mint(totalSupply, { from: USER2 });

      assert.equal(toBN(await userLeveragePool.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.times(5).toString());

      await userLeveragePool.addLiquidity(amount, { from: USER1 });
      const expectedBMIXAmount = amount.div(5);

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.plus(liquidityAmount).toString());
      assert.equal(toBN(await userLeveragePool.balanceOf(USER1)).toString(), expectedBMIXAmount.toString());
    });

    it("should mint correct BMIX amount if total supply > total liquidity", async () => {
      liquidityAmount = toBN(toWei("4000"));
      totalSupply = toBN(toWei("10000"));

      await userLeveragePool.setVtotalLiquidity(liquidityAmount, { from: USER2 });
      await userLeveragePool.mint(totalSupply, { from: USER2 });

      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      const expectedBMIXAmount = toBN(toWei("2500"));

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.plus(liquidityAmount).toString());

      assert.equal(toBN(await userLeveragePool.balanceOf(USER1)).toString(), expectedBMIXAmount.toString());
    });
  });

  describe("addLiquidityAndStake", async () => {
    const stblAmount = toBN(toWei("10000", "mwei"));
    const amount = toBN(toWei("1000"));

    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);

      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });

      await userLeveragePool.approve(bmiCoverStaking.address, amount, { from: USER1 });
    });

    it("should correctly provide liquidity and make a stake (1)", async () => {
      await userLeveragePool.addLiquidityAndStake(amount, amount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.toString());

      assert.equal(toBN(await stbl.balanceOf(capitalPool.address)).toString(), amount.idiv(10 ** 12).toString());
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(amount.idiv(10 ** 12)).toString());

      assert.equal(
        toBN((await bmiCoverStakingView.stakingInfoByToken(1)).stakedBMIXAmount).toString(),
        amount.toString()
      );
      assert.equal(await bmiCoverStaking.balanceOf(USER1), 1);
      assert.equal(await bmiCoverStaking.ownerOf(1), USER1);
    });

    it("should correctly provide liquidity and make a stake not for the full amount", async () => {
      const stakeAmount = toBN(toWei("500"));

      await userLeveragePool.addLiquidityAndStake(amount, stakeAmount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.toString());
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(amount.idiv(10 ** 12)).toString());
      assert.equal(toBN(await stbl.balanceOf(capitalPool.address)).toString(), amount.idiv(10 ** 12).toString());

      assert.equal(await bmiCoverStaking.balanceOf(USER1), 1);
      assert.equal(await bmiCoverStaking.ownerOf(1), USER1);
    });

    it("should get exception, LP: Wrong staking amount", async () => {
      const reason = "LP: Wrong staking amount";

      await truffleAssert.reverts(
        userLeveragePool.addLiquidityAndStake(amount, amount.plus(1), { from: USER1 }),
        reason
      );
    });
  });

  describe.skip("withdrawLiquidity", async () => {
    const stblAmount = toBN(toWei("100000", "mwei"));
    const liquidityAmount = toBN(toWei("10000"));
    const epochsNumber = toBN(5);
    const premium = toBN(toWei("150"));
    const amountToWithdraw = toBN(toWei("1000"));

    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);

      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);

      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER2 });

      await userLeveragePool.addLiquidity(liquidityAmount, { from: USER1 });

      await capitalPool.setliquidityCushionBalance(liquidityAmount);

      //await setCurrentTime(1);
    });

    it("should successfully withdraw tokens without queue", async () => {
      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), liquidityAmount.toString());

      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount.minus(liquidityAmount.idiv(10 ** 12)).toString()
      );
      await capitalPool.addPremium(epochsNumber, premium, userLeveragePool.address);

      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw, { from: USER1 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });
      // console.log(toBN(await time.latest()).toString());
      // let newTime = toBN(await time.latest()).plus(withdrawalPeriod.plus(10));
      // console.log(newTime.toString());
      console.log(toBN(await time.latest()).toString());
      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      console.log(toBN(await time.latest()).toString());
      await time.advanceBlock();
      //await setCurrentTime(withdrawalPeriod.plus(10));

      const disAmount = premium
        .idiv(epochPeriod.times(epochsNumber.plus(2)).idiv(24 * 60 * 60))
        .times(withdrawalPeriod.plus(10).idiv(24 * 60 * 60));

      console.log(disAmount.toString());

      await userLeveragePool.triggerPremiumsDistribution();

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      const expectedWithdrawalAmount = await getSTBLAmount(amountToWithdraw);
      console.log(expectedWithdrawalAmount.toString());

      await userLeveragePool.withdrawLiquidity({ from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.totalLiquidity()).toString(),
        liquidityAmount.minus(expectedWithdrawalAmount).plus(disAmount).toString()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount
          .minus(liquidityAmount.idiv(10 ** 12))
          .plus(expectedWithdrawalAmount.idiv(10 ** 12))
          .toString()
      );
    });

    it("should successfully withdraw part of the requested amount", async () => {
      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw.times(6), { from: USER1 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw.times(6), { from: USER1 });

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();
      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      await userLeveragePool.triggerPremiumsDistribution();

      const availableAmount = toBN(await userLeveragePool.totalLiquidity()).minus(
        await userLeveragePool.totalCoverTokens()
      );
      const balanceBeforeWithdrawal = toBN(await stbl.balanceOf(USER1));

      await userLeveragePool.withdrawLiquidity({ from: USER1 });

      const balanceAfterWithdrawal = toBN(await stbl.balanceOf(USER1));

      assert.equal(
        toBN((await userLeveragePool.withdrawalsInfo(USER1)).withdrawalAmount).toString(),
        amountToWithdraw
          .times(6)
          .minus(await getBMIXAmount(availableAmount))
          .toString()
      );
      assert.equal(
        balanceAfterWithdrawal.minus(balanceBeforeWithdrawal).toString(),
        availableAmount
          .minus(1)
          .idiv(10 ** 12)
          .toString()
      );
    });

    it("should successfully withdraw multiple times", async () => {
      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw.times(6), { from: USER1 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw.times(6), { from: USER1 });

      const currentCoverTokens = coverTokensAmount.times(2);

      await policyBookFacade.buyPolicy(epochsNumber, currentCoverTokens, { from: USER2 });
      assert.equal(toBN(await userLeveragePool.totalCoverTokens()).toString(), currentCoverTokens.toString());

      await setCurrentTime(withdrawalPeriod.plus(10));

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      await userLeveragePool.triggerPremiumsDistribution();

      await userLeveragePool.withdrawLiquidity({ from: USER1 });

      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER2 });

      await userLeveragePool.withdrawLiquidity({ from: USER1 });

      assert.equal(toBN((await userLeveragePool.withdrawalsInfo(USER1)).withdrawalAmount).toString(), 0);
    });

    it("should get exception if user do not have ready requested withdrawal", async () => {
      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw, { from: USER1 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      await setCurrentTime(withdrawalPeriod.minus(1000));

      const reason = "PB: Withdrawal is not ready";
      await truffleAssert.reverts(userLeveragePool.withdrawLiquidity({ from: USER1 }), reason);
    });
  });

  describe("extreme premium case", async () => {
    it("should not revert", async () => {
      const premium = toBN(toWei("80"));

      const stblAmount = toBN(toWei("10000", "mwei"));
      const amount = toBN(toWei("1000"));

      await stbl.transfer(USER1, stblAmount);

      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });

      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      for (let i = 1; i < 5; i++) {
        await capitalPool.addPremium(1, premium, userLeveragePool.address, { from: USER1 });

        await userLeveragePool.getAPY();

        await setCurrentTime(epochPeriod.times(i));
      }
    });
  });

  describe("APY", async () => {
    const epochs = 13;
    const premium = toBN(toWei("150"));
    const stblAmount = toBN(toWei("10000", "mwei"));
    const amount = toBN(toWei("1000"));

    it("should calculate correct APY without premium", async () => {
      assert.equal(toBN(await userLeveragePool.getAPY()).toString(), "0");
    });

    it("should calculate correct APY", async () => {
      await stbl.transfer(USER1, stblAmount);

      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });

      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      await capitalPool.addPremium(epochs, premium, userLeveragePool.address, { from: USER1 });

      const expectedAPY = premium

        .idiv(epochPeriod.times(epochs + 2).idiv(24 * 60 * 60))
        .times(365)
        .times(100)
        .idiv(toBN(await userLeveragePool.totalSupply()).plus(await userLeveragePool.convertSTBLToBMIX(toWei("1"))));

      assert.equal(
        toBN(await userLeveragePool.getAPY())
          .idiv(APY_PRECISION)
          .toString(),
        expectedAPY.toString()
      );
    });
  });
});
