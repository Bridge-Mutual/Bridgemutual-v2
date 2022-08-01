const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyQuote = artifacts.require("PolicyQuote");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
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
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const RewardsGenerator = artifacts.require("RewardsGeneratorMock");
const ReinsurancePool = artifacts.require("ReinsurancePoolMock");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const CapitalPool = artifacts.require("CapitalPoolMock");
const NFTStaking = artifacts.require("NFTStaking");
const ClaimVoting = artifacts.require("ClaimVoting");
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
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

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

async function getBlockTimestamp() {
  const latest = toBN(await web3.eth.getBlockNumber());
  return (await web3.eth.getBlock(latest)).timestamp;
}

const { toWei } = web3.utils;

contract("UserLeveragePool", async (accounts) => {
  const reverter = new Reverter(web3);
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  let contractsRegistry;
  let userLeveragePool;
  let bmiCoverStaking;
  let stbl;
  let capitalPool;
  let nftStaking;

  let bmi;
  let rewardsGenerator;
  let claimVoting;
  let leveragePortfolioView;

  let policyBookRegistry;
  let claimingRegistry;
  let policyRegistry;
  let reinsurancePool;
  let policyBookAdmin;
  let policyBookFabric;
  let policyBookMock;

  let bmiUtilityNFT;
  let policyBookFacade;

  let network;

  const epochPeriod = toBN(604800); // 7 days
  const initialDeposit = toBN(toWei("1000"));
  const epochsNumber = toBN(5);
  const premium = toBN(toWei("150"));

  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const USER3 = accounts[3];
  const insuranceContract4 = accounts[4];
  const insuranceContract5 = accounts[5];

  const PERCENTAGE_100 = toBN(10).pow(27);
  const APY_PRECISION = toBN(10 ** 5);
  const PRECISION = toBN(10).pow(25);
  let withdrawalPeriod;
  const withdrawalExpirePeriod = toBN(172800);

  const NOTHING = accounts[9];

  const getBMIXAmount = async (STBLAmount) => {
    return toBN(await userLeveragePool.convertSTBLToBMIX(STBLAmount));
  };

  const getSTBLAmount = async (bmiXAmount) => {
    return toBN(await userLeveragePool.convertBMIXToSTBL(bmiXAmount));
  };

  const convert = (amount) => {
    if (network == Networks.ETH) {
      const amountStbl = toBN(amount).div(toBN(10).pow(12));
      return amountStbl;
    } else if (network == Networks.BSC) {
      const amountStbl = toBN(amount);
      return amountStbl;
    }
  };

  before("setup", async () => {
    network = await getNetwork();
    contractsRegistry = await ContractsRegistry.new();
    const policyBookImpl = await PolicyBookMock.new();
    const policyBookFacadeImpl = await PolicyBookFacade.new();
    const userLeveragePoolImpl = await UserLeveragePool.new();
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
    const _policyRegistry = await PolicyRegistry.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _shieldMining = await ShieldMining.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _claimVoting = await ClaimVoting.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _yieldGenerator = await YieldGenerator.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _nftStaking = await NFTStaking.new();

    await contractsRegistry.__ContractsRegistry_init();
    await contractsRegistry.addContract(await contractsRegistry.STKBMI_STAKING_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REPUTATION_SYSTEM_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), sushiswapRouterMock.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.CLAIM_VOTING_NAME(), _claimVoting.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
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

    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());

    bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
    claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    leveragePortfolioView = await LeveragePortfolioView.at(await contractsRegistry.getLeveragePortfolioViewContract());

    await policyBookFabric.__PolicyBookFabric_init();
    await claimVoting.__ClaimVoting_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await rewardsGenerator.__RewardsGenerator_init(network);

    await policyBookAdmin.__PolicyBookAdmin_init(
      policyBookImpl.address,
      policyBookFacadeImpl.address,
      userLeveragePoolImpl.address
    );
    await bmiUtilityNFT.__BMIUtilityNFT_init();
    await capitalPool.__CapitalPool_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await reinsurancePool.__ReinsurancePool_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());

    if (network == Networks.ETH || network == Networks.POL) {
      await sushiswapRouterMock.setReserve(stbl.address, toWei(toBN(10 ** 3).toString()));
    } else if (network == Networks.BSC) {
      await sushiswapRouterMock.setReserve(stbl.address, toWei(toBN(10 ** 15).toString()));
    }

    await sushiswapRouterMock.setReserve(weth.address, toWei(toBN(10 ** 15).toString()));
    await sushiswapRouterMock.setReserve(bmi.address, toWei(toBN(10 ** 15).toString()));

    const userLeveragePoolAddress = (
      await policyBookFabric.createLeveragePools(
        insuranceContract5,
        ContractType.VARIUOS,
        "User Leverage Pool",
        "LevPf1"
      )
    ).logs[0].args.at;

    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await policyBookAdmin.setupPricingModel(
      PRECISION.times(80),
      PRECISION.times(80),
      PRECISION.times(2),
      PRECISION.times(2),
      toWei("10"),
      PRECISION.times(10),
      PRECISION.times(50),
      PRECISION.times(25),
      PRECISION.times(100)
    );

    await stbl.approve(policyBookFabric.address, getStableAmount("1000").times(3));

    const policyBookAddr = (
      await policyBookFabric.create(
        insuranceContract4,
        ContractType.CONTRACT,
        "test description",
        "TEST",
        initialDeposit,
        zeroAddress
      )
    ).logs[0].args.at;

    policyBookMock = await PolicyBookMock.at(policyBookAddr);

    let policyBookFacadeAddress = await policyBookMock.policyBookFacade();
    policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddress);

    withdrawalPeriod = toBN(await capitalPool.getWithdrawPeriod());

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
    let stblAmount;
    const amount = toBN(toWei("1000"));

    let liquidityAmount;
    let totalSupply;

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("10000");
      await stbl.transfer(USER1, stblAmount);

      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });
    });

    it("should not allow deposit of small value", async () => {
      await truffleAssert.reverts(userLeveragePool.addLiquidity(0, { from: USER1 }), "LP: Liquidity amount is zero");
    });

    it("should set correct values", async () => {
      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.toString());
      assert.equal(toBN(await userLeveragePool.balanceOf(USER1)).toString(), amount.toString());
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        convert(initialDeposit.plus(amount)).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(convert(amount)).toString());
    });

    it("should update the values correctly", async () => {
      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.toString());
      assert.equal(toBN(await userLeveragePool.balanceOf(USER1)).toString(), amount.toString());
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        convert(initialDeposit.plus(amount)).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(convert(amount)).toString());

      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.times(2).toString());
      assert.equal(toBN(await userLeveragePool.balanceOf(USER1)).toString(), amount.times(2).toString());
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        convert(amount).times(2).plus(convert(initialDeposit)).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(convert(amount).times(2)).toString());
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
    let stblAmount;
    const amount = toBN(toWei("1000"));

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("10000");
      await stbl.transfer(USER1, stblAmount);

      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });

      await userLeveragePool.approve(bmiCoverStaking.address, amount, { from: USER1 });
    });

    it("should correctly provide liquidity and make a stake (1)", async () => {
      await userLeveragePool.addLiquidityAndStake(amount, amount, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), amount.toString());

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        convert(initialDeposit.plus(amount)).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(convert(amount)).toString());

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
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(convert(amount)).toString());
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        convert(initialDeposit.plus(amount)).toString()
      );

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

  describe("withdrawLiquidity", async () => {
    let stblAmount;
    const liquidityAmount = toBN(toWei("10000"));
    const coverTokensAmount = toBN(toWei("5000"));

    const amountToWithdraw = toBN(toWei("1000"));

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("100000");
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });
      await stbl.approve(policyBookMock.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER2 });
      await stbl.approve(policyBookMock.address, stblAmount, { from: USER2 });

      await userLeveragePool.addLiquidity(liquidityAmount, { from: USER1 });
      await userLeveragePool.addLiquidity(liquidityAmount, { from: USER2 });
      await capitalPool.setliquidityCushionBalance(convert(liquidityAmount));

      policyBookMock.setTotalLiquidity(liquidityAmount);
      policyBookMock.setTotalCoverTokens(coverTokensAmount);
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, PRECISION.times(20), PRECISION.times(50));

      assert.equal(toBN(await policyBookMock.totalLiquidity()).toString(), liquidityAmount.toString());
      assert.equal(toBN(await policyBookMock.totalCoverTokens()).toString(), coverTokensAmount.toString());
    });

    it("should successfully withdraw tokens without queue", async () => {
      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), liquidityAmount.times(2).toString());

      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(convert(liquidityAmount)).toString());
      await capitalPool.addPremium(epochsNumber, premium, userLeveragePool.address);

      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw, { from: USER1 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      const disAmount = premium
        .idiv(epochPeriod.times(epochsNumber.plus(1)).idiv(24 * 60 * 60))
        .times(withdrawalPeriod.plus(10).idiv(24 * 60 * 60));

      await userLeveragePool.triggerPremiumsDistribution();

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      const expectedWithdrawalAmount = await getSTBLAmount(amountToWithdraw);

      await userLeveragePool.withdrawLiquidity({ from: USER1 });

      assert.closeTo(
        toBN(await userLeveragePool.totalLiquidity()).toNumber(),
        liquidityAmount.times(2).minus(expectedWithdrawalAmount).plus(disAmount).toNumber(),
        toBN("0.0000001").times(PRECISION).toNumber()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.closeTo(
        toBN(await stbl.balanceOf(USER1)).toNumber(),
        stblAmount.minus(convert(liquidityAmount)).plus(convert(expectedWithdrawalAmount)).toNumber(),
        0.9
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

      const balanceBeforeWithdrawal = toBN(await stbl.balanceOf(USER1));

      await capitalPool.setliquidityCushionBalance(getStableAmount("5000"));
      await capitalPool.sethardUsdtAccumulatedBalance(0);

      await userLeveragePool.withdrawLiquidity({ from: USER1 });

      const balanceAfterWithdrawal = toBN(await stbl.balanceOf(USER1));

      assert.equal(
        toBN((await userLeveragePool.withdrawalsInfo(USER1)).withdrawalAmount).toString(),
        amountToWithdraw.toString()
      );
      assert.isTrue(toBN((await userLeveragePool.withdrawalsInfo(USER1)).withdrawalAmount).gt(0));

      assert.equal(
        balanceAfterWithdrawal.minus(balanceBeforeWithdrawal).toString(),
        getStableAmount("5000").toString()
      );

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      await userLeveragePool.triggerPremiumsDistribution();

      await capitalPool.setliquidityCushionBalance(getStableAmount("1000"));
      await capitalPool.sethardUsdtAccumulatedBalance(0);

      await userLeveragePool.withdrawLiquidity({ from: USER1 });

      assert.equal(toBN((await userLeveragePool.withdrawalsInfo(USER1)).withdrawalAmount).toString(), 0);
    });

    it("reverts if withdrawal not ready", async () => {
      const reason = "LP: Withdrawal is not ready";

      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw, { from: USER1 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });
      await setCurrentTime(withdrawalPeriod.minus(1000));
      await truffleAssert.reverts(userLeveragePool.withdrawLiquidity({ from: USER1 }), reason);
    });

    it("reverts if there is ongoing withdraw request", async () => {
      const reason = "LP: ongoing withdrawl request";

      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw, { from: USER1 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toNumber(), WithdrawalStatus.PENDING);
      await truffleAssert.reverts(userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 }), reason);

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toNumber(), WithdrawalStatus.READY);
      await truffleAssert.reverts(userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 }), reason);
    });

    it("reverts if there is ongoing claim procedure", async () => {
      const reason = "LP: ongoing claim procedure";

      await policyBookFacade.deployLeverageFundsByLP(userLeveragePool.address);

      await policyBookFacade.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });
      const toApproveOnePercent = await policyBookFacade.getClaimApprovalAmount(USER1);
      await bmi.approve(claimVoting.address, toApproveOnePercent, { from: USER1 });

      await setCurrentTime(toBN(await policyRegistry.policyEndTime(USER1, policyBookMock.address)).toString());

      await policyBookMock.submitClaimAndInitializeVoting("", { from: USER1 });

      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw, { from: USER1 });

      await truffleAssert.reverts(userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 }), reason);
    });

    it("reverts if user do not have enough liquidity", async () => {
      const reason = "LP: Wrong announced amount";

      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw, { from: USER1 });
      await truffleAssert.reverts(
        userLeveragePool.requestWithdrawal(toBN(liquidityAmount).plus(100), { from: USER1 }),
        reason
      );
    });

    it("can request withdraw over another withdraw request", async () => {
      await policyBookFacade.deployLeverageFundsByLP(userLeveragePool.address);

      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw.times(5), { from: USER1 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw.times(5), { from: USER1 });

      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw.times(5), { from: USER2 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw.times(5), { from: USER2 });

      const expectedWithdrawalAmount = await getSTBLAmount(amountToWithdraw.times(5));

      assert.equal(
        toBN((await userLeveragePool.withdrawalsInfo(USER1)).withdrawalAmount).toString(),
        expectedWithdrawalAmount.toString()
      );
      assert.equal(
        toBN((await userLeveragePool.withdrawalsInfo(USER2)).withdrawalAmount).toString(),
        expectedWithdrawalAmount.toString()
      );
    });
    it("reverts if token to withdraw is zero", async () => {
      const reason = "LP: Amount is zero";

      await truffleAssert.reverts(userLeveragePool.requestWithdrawal(0, { from: USER1 }), reason);
    });
  });

  describe("extreme premium case", async () => {
    it("should not revert", async () => {
      const premium = toBN(toWei("80"));

      const stblAmount = getStableAmount("10000");
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
    let stblAmount;
    const amount = toBN(toWei("1000"));

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("10000");
    });

    it("should calculate correct APY without premium", async () => {
      assert.equal(toBN(await userLeveragePool.getAPY()).toString(), "0");
    });

    it("calculates correct APY without premium", async () => {
      assert.equal(toBN(await userLeveragePool.getAPY()), 0);
    });

    it("should calculate correct APY", async () => {
      await stbl.transfer(USER1, stblAmount);

      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });

      await userLeveragePool.addLiquidity(amount, { from: USER1 });

      await capitalPool.addPremium(epochs, premium, userLeveragePool.address, { from: USER1 });

      const expectedAPY = premium
        .idiv(epochPeriod.times(epochs + 1).idiv(24 * 60 * 60))
        .times(365)
        .times(100)
        .idiv(toBN(await userLeveragePool.totalSupply()).plus(await userLeveragePool.convertSTBLToBMIX(toWei("1"))));

      assert.closeTo(
        toBN(await userLeveragePool.getAPY())
          .idiv(APY_PRECISION)
          .toNumber(),
        expectedAPY.toNumber(),
        1
      );
    });
  });

  describe("unlockTokens", async () => {
    let stblAmount;
    const liquidityAmount = toBN(toWei("10000"));
    const coverTokensAmount = toBN(toWei("5000"));

    const epochsNumber = toBN(5);
    const premium = toBN(toWei("150"));
    const amountToWithdraw = toBN(toWei("1000"));

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("100000");
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });
      await stbl.approve(policyBookMock.address, stblAmount, { from: USER1 });

      await userLeveragePool.addLiquidity(liquidityAmount, { from: USER1 });
      await capitalPool.setliquidityCushionBalance(convert(liquidityAmount));

      policyBookMock.setTotalLiquidity(liquidityAmount);
      policyBookMock.setTotalCoverTokens(coverTokensAmount);
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, PRECISION.times(20), PRECISION.times(50));
    });

    it("reverts if withdraw amount is zero", async () => {
      const reason = "LP: Amount is zero";

      await truffleAssert.reverts(userLeveragePool.unlockTokens({ from: USER1 }), reason);
    });

    it("should unlock amount of tokens", async () => {
      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw, { from: USER1 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      await userLeveragePool.unlockTokens({ from: USER1 });

      assert.equal((await userLeveragePool.withdrawalsInfo(USER1)).withdrawalAmount.toNumber(), 0);
    });
  });

  describe("endEpoch", async () => {
    it("should calculate correct end epoch time", async () => {
      const secsInWeek = 7 * 24 * 60 * 60;
      const epochStartTime = toBN(await userLeveragePool.epochStartTime());
      const timestamp = toBN(await getBlockTimestamp());
      const endTime = epochStartTime.plus(secsInWeek);

      assert.equal(
        toBN(await userLeveragePool.secondsToEndCurrentEpoch()).toString(),
        endTime.minus(timestamp).toString()
      );
    });
  });

  describe("staking modifier", async () => {
    const amount = toBN(toWei("1000"));

    const liquidityAmount = toBN(toWei("1000"));
    const coverTokensAmount = toBN(toWei("500"));

    const insuranceContract1 = accounts[6];
    const insuranceContract2 = accounts[7];

    let policyBook1;
    let policyBookFacade1;
    let policyBook2;
    let policyBookFacade2;

    beforeEach("setup", async () => {
      const stblInitialDeposit = getStableAmount("10000");

      await stbl.approve(policyBookFabric.address, 0);
      await stbl.approve(policyBookFabric.address, stblInitialDeposit);

      // Setup PolicyBook 1
      const policyBookAddress1 = (
        await policyBookFabric.create(
          insuranceContract1,
          ContractType.CONTRACT,
          `test1 description`,
          `TEST1`,
          initialDeposit,
          zeroAddress
        )
      ).logs[0].args.at;
      policyBook1 = await PolicyBookMock.at(policyBookAddress1);
      const policyBookFacadeAddress1 = await policyBook1.policyBookFacade();
      policyBookFacade1 = await PolicyBookFacade.at(policyBookFacadeAddress1);

      await policyBookAdmin.whitelist(policyBook1.address, true);
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade1.address, true);

      policyBook1.setTotalLiquidity(liquidityAmount);
      policyBook1.setTotalCoverTokens(coverTokensAmount);
      await policyBookAdmin.setPolicyBookFacadeMPLs(
        policyBookFacade1.address,
        PRECISION.times(20),
        PRECISION.times(50)
      );

      // Setup PolicyBook 2
      const policyBookAddress2 = (
        await policyBookFabric.create(
          insuranceContract2,
          ContractType.CONTRACT,
          `test2 description`,
          `TEST2`,
          initialDeposit,
          zeroAddress
        )
      ).logs[0].args.at;
      policyBook2 = await PolicyBookMock.at(policyBookAddress2);
      const policyBookFacadeAddress2 = await policyBook2.policyBookFacade();
      policyBookFacade2 = await PolicyBookFacade.at(policyBookFacadeAddress2);

      await policyBookAdmin.whitelist(policyBook2.address, true);
      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade2.address, true);

      policyBook2.setTotalLiquidity(liquidityAmount);
      policyBook2.setTotalCoverTokens(coverTokensAmount);
      await policyBookAdmin.setPolicyBookFacadeMPLs(
        policyBookFacade2.address,
        PRECISION.times(20),
        PRECISION.times(50)
      );

      // Add liquidity and stake
      await stbl.transfer(USER1, stblInitialDeposit);

      await stbl.approve(userLeveragePool.address, stblInitialDeposit, { from: USER1 });
      await userLeveragePool.approve(bmiCoverStaking.address, amount, { from: USER1 });

      await userLeveragePool.addLiquidityAndStake(amount, amount, { from: USER1 });

      // Deploy to regular pool
      await policyBookFacade1.deployLeverageFundsByLP(userLeveragePool.address);
      await policyBookFacade2.deployLeverageFundsByLP(userLeveragePool.address);
    });

    it("should calculate correct rewards multiplier", async () => {
      await userLeveragePool.forceUpdateBMICoverStakingRewardMultiplier();

      const totalLiquidity = await userLeveragePool.totalLiquidity();

      // PolicyBook 1
      const totalLiquidityPolicyBook1 = await policyBook1.totalLiquidity();
      const totalCoverTokensPolicyBook1 = await policyBook1.totalCoverTokens();
      const _poolUR1 = toBN(totalCoverTokensPolicyBook1).times(PERCENTAGE_100).div(totalLiquidityPolicyBook1);

      const BM_b1 = (await rewardsGenerator.getPolicyBookReward(policyBook1.address)).rewardMultiplier;

      const L1 = toBN(await userLeveragePool.poolsLDeployedAmount(policyBook1.address))
        .times(PRECISION)
        .div(totalLiquidity);

      const M1 = await leveragePortfolioView.calcM(_poolUR1, userLeveragePool.address);

      const A1 = await userLeveragePool.a2_ProtocolConstant();

      // BMI mulit calcBMIMultiplier
      const calcBMIMultiplier1 = toBN(BM_b1)
        .times(L1)
        .times(M1)
        .div(PERCENTAGE_100)
        .times(A1)
        .div(PERCENTAGE_100)
        .div(10 ** 3);

      // PolicyBook 2
      const totalLiquidityPolicyBook2 = await policyBook2.totalLiquidity();
      const totalCoverTokensPolicyBook2 = await policyBook2.totalCoverTokens();
      const _poolUR2 = toBN(totalCoverTokensPolicyBook2).times(PERCENTAGE_100).div(totalLiquidityPolicyBook2);

      const BM_b2 = (await rewardsGenerator.getPolicyBookReward(policyBook2.address)).rewardMultiplier;

      const L2 = toBN(await userLeveragePool.poolsLDeployedAmount(policyBook2.address))
        .times(PRECISION)
        .div(totalLiquidity);
      const M2 = await leveragePortfolioView.calcM(_poolUR2, userLeveragePool.address);
      const A2 = await userLeveragePool.a2_ProtocolConstant();

      // BMI mulit calcBMIMultiplier
      const calcBMIMultiplier2 = toBN(BM_b2)
        .times(L2)
        .times(M2)
        .div(PERCENTAGE_100)
        .times(A2)
        .div(PERCENTAGE_100)
        .div(10 ** 3);

      const sumBMs = toBN(calcBMIMultiplier1).plus(calcBMIMultiplier2);

      const BM_l = (await rewardsGenerator.getPolicyBookReward(userLeveragePool.address)).rewardMultiplier;

      assert.equal(BM_l.toString(), sumBMs.idiv(10 ** 22).toString());
    });
  });

  describe("getWithdrawalStatus", async () => {
    let stblAmount;
    let liquidityAmount;
    let coverTokensAmount;
    let amountToWithdraw;
    let epochsNumber;

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("100000");
      liquidityAmount = toBN(toWei("10000"));
      coverTokensAmount = toBN(toWei("8000"));
      amountToWithdraw = toBN(toWei("1000"));
      epochsNumber = 5;
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });

      await userLeveragePool.approve(userLeveragePool.address, liquidityAmount.plus(amountToWithdraw), { from: USER1 });

      await userLeveragePool.addLiquidity(liquidityAmount, { from: USER1 });
    });

    it("should return NONE status if announce does not exists", async () => {
      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.NONE);
    });

    it("should return PENDING status if withdrawal period not expired", async () => {
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.PENDING);
    });

    it("should return READY status if withdrawal is possible", async () => {
      const timestamp = await getBlockTimestamp();
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      // await setCurrentTime(withdrawalPeriod.plus(timestamp));
      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);
    });

    it("should return READY status if withdrawal allowed after period", async () => {
      await userLeveragePool.requestWithdrawal(amountToWithdraw.times(5), { from: USER1 });
      await capitalPool.addPremium(epochsNumber, premium, userLeveragePool.address);

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();
      await capitalPool.setliquidityCushionBalance(getStableAmount("5000"));
      await capitalPool.sethardUsdtAccumulatedBalance(0);

      await userLeveragePool.withdrawLiquidity({ from: USER1 });
      assert.isTrue(toBN((await userLeveragePool.withdrawalsInfo(USER1)).withdrawalAmount).gt(0));

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);
    });

    it("should return EXPIRED status if withdrawal not possible, withdrawal expire period expired", async () => {
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      //await setCurrentTime(withdrawalPeriod.plus(withdrawalExpirePeriod).plus(10));
      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(withdrawalExpirePeriod).plus(10))
          .toString()
      );
      await time.advanceBlock();

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);
    });
  });

  describe("requestWithdrawal", async () => {
    let stblAmount;
    let liquidityAmount;
    let amountToWithdraw;

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("100000");
      liquidityAmount = toBN(toWei("10000"));
      amountToWithdraw = toBN(toWei("1000"));
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER2 });

      await userLeveragePool.approve(userLeveragePool.address, liquidityAmount.plus(amountToWithdraw), { from: USER1 });

      await userLeveragePool.addLiquidity(liquidityAmount, { from: USER1 });
    });

    it("should correctly announce withdrawal", async () => {
      const timestamp = await getBlockTimestamp();
      const txReceipt = await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });
      const event = await userLeveragePool.getPastEvents("WithdrawalRequested");

      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(userLeveragePool.address)).toString(),
        amountToWithdraw.toString()
      );

      assert.equal(event[0].event, "WithdrawalRequested");
      assert.equal(event[0].args._liquidityHolder, USER1);
      assert.equal(toBN(event[0].args._tokensToWithdraw).toString(), amountToWithdraw.toString());
      assert.closeTo(
        toBN(event[0].args._readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(toBN(timestamp)).toNumber(),
        3
      );

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.PENDING);

      const withdrawalInfo = await userLeveragePool.withdrawalsInfo(USER1);

      assert.equal(toBN(withdrawalInfo.withdrawalAmount).toString(), amountToWithdraw.toString());
      assert.closeTo(
        toBN(withdrawalInfo.readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(toBN(timestamp)).plus(1).toNumber(),
        2
      );
    });

    it("should announce withdrawal if withdrawal status EXPIRED and previous request less than new", async () => {
      let timestamp = await getBlockTimestamp();
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(userLeveragePool.address)).toString(),
        amountToWithdraw.toString()
      );

      const expiryDate = withdrawalPeriod.plus(toBN(timestamp)).plus(withdrawalExpirePeriod).plus(200);
      await setCurrentTime(expiryDate);

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);

      timestamp = await getBlockTimestamp();
      await userLeveragePool.requestWithdrawal(amountToWithdraw.times(2), { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw.times(2)).toString()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(userLeveragePool.address)).toString(),
        amountToWithdraw.times(2).toString()
      );

      const event = await userLeveragePool.getPastEvents("WithdrawalRequested");

      assert.equal(event[0].event, "WithdrawalRequested");
      assert.equal(event[0].args._liquidityHolder, USER1);
      assert.equal(toBN(event[0].args._tokensToWithdraw).toString(), amountToWithdraw.times(2).toString());
      assert.closeTo(
        toBN(event[0].args._readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(toBN(timestamp)).toNumber(),
        2
      );

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.PENDING);

      const withdrawalInfo = await userLeveragePool.withdrawalsInfo(USER1);

      assert.equal(toBN(withdrawalInfo.withdrawalAmount).toString(), amountToWithdraw.times(2).toString());
      assert.closeTo(
        toBN(withdrawalInfo.readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(toBN(timestamp)).toNumber(),
        1
      );
    });

    it("should announce withdrawal if withdrawal status EXPIRED and previous request greater than new", async () => {
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(userLeveragePool.address)).toString(),
        amountToWithdraw.toString()
      );

      const expiryDate = withdrawalPeriod.plus(withdrawalExpirePeriod).plus(10);

      //await setCurrentTime(expiryDate);
      await time.increaseTo(
        toBN(await time.latest())
          .plus(expiryDate)
          .toString()
      );
      await time.advanceBlock();

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);

      const timestamp = await getBlockTimestamp();
      await userLeveragePool.requestWithdrawal(amountToWithdraw.div(2), { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw.div(2)).toString()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(userLeveragePool.address)).toString(),
        amountToWithdraw.div(2).toString()
      );

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.PENDING);

      const withdrawalInfo = await userLeveragePool.withdrawalsInfo(USER1);
      assert.equal(toBN(withdrawalInfo.withdrawalAmount).toString(), amountToWithdraw.div(2).toString());
      assert.closeTo(
        toBN(withdrawalInfo.readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(timestamp).plus(1).toNumber(),
        1
      );
    });

    it("should correctly requestWithdrawal multiple times", async () => {
      let timestamp = await getBlockTimestamp();
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(userLeveragePool.address)).toString(),
        amountToWithdraw.toString()
      );

      await setCurrentTime(withdrawalPeriod.plus(timestamp).plus(withdrawalExpirePeriod).plus(10));

      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);

      timestamp = await getBlockTimestamp();
      await userLeveragePool.requestWithdrawal(amountToWithdraw.div(2), { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw.div(2)).toString()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(userLeveragePool.address)).toString(),
        amountToWithdraw.div(2).toString()
      );

      await setCurrentTime(withdrawalPeriod.plus(timestamp).plus(withdrawalExpirePeriod).plus(10));
      assert.equal(toBN(await userLeveragePool.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);

      await userLeveragePool.requestWithdrawal(amountToWithdraw.times(2), { from: USER1 });

      assert.equal(
        toBN(await userLeveragePool.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw.times(2)).toString()
      );
      assert.equal(
        toBN(await userLeveragePool.balanceOf(userLeveragePool.address)).toString(),
        amountToWithdraw.times(2).toString()
      );
    });

    it("should get exception, amount to be announced is greater than the available amount", async () => {
      await userLeveragePool.addLiquidity(liquidityAmount, { from: USER2 });

      const reason = "LP: Wrong announced amount";
      await truffleAssert.reverts(userLeveragePool.requestWithdrawal(liquidityAmount.plus(1), { from: USER1 }), reason);
    });
  });
});
