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
const PolicyRegistry = artifacts.require("PolicyRegistry");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const ClaimVoting = artifacts.require("ClaimVoting");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const CapitalPool = artifacts.require("CapitalPoolMock");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const ShieldMining = artifacts.require("ShieldMining");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const YieldGenerator = artifacts.require("YieldGenerator");

const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");
const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");
const { assert } = require("chai");
const { time } = require("@openzeppelin/test-helpers");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

function toBN(number) {
  return new BigNumber(number);
}

const ContractType = {
  CONTRACT: 0,
  STABLECOIN: 1,
  SERVICE: 2,
  EXCHANGE: 3,
  VARIOUS: 4,
};

const WithdrawalStatus = {
  NONE: 0,
  PENDING: 1,
  READY: 2,
  EXPIRED: 3,
  IN_QUEUE: 4,
};

const wei = web3.utils.toWei;

async function getBlockTimestamp() {
  const latest = toBN(await web3.eth.getBlockNumber());
  return (await web3.eth.getBlock(latest)).timestamp;
}

contract("LiquidityRegistry", async (accounts) => {
  const reverter = new Reverter(web3);

  let contractsRegistry;
  let policyBook, policyBookFacade;
  let bmiCoverStaking;
  let stbl;
  let bmi;
  let liquidityRegistry;
  let policyBookFabric;
  let policyBookAdmin;
  let nftStaking;
  let network;
  let capitalPool;

  let initialDeposit, stblInitialDeposit;

  const insuranceContract = "0x0000000000000000000000000000000000000001";
  const insuranceContract2 = "0x0000000000000000000000000000000000000002";
  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const TOKEN = "0x0000000000000000000000000000000000000000";

  let oneToken;
  let withdrawalPeriod;
  const readyToWithdrawPeriod = 2 * 24 * 60 * 60; // 2 days

  const NOTHING = accounts[9];
  const PRECISION = toBN(10).pow(25);

  before("setup", async () => {
    network = await getNetwork();
    contractsRegistry = await ContractsRegistry.new();
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
    const _priceFeed = await PriceFeed.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyQuote = await PolicyQuote.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _claimVoting = await ClaimVoting.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _capitalPool = await CapitalPool.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _yieldGenerator = await YieldGenerator.new();

    const _policyBookImpl = await PolicyBookMock.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.STKBMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REPUTATION_SYSTEM_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), sushiswapRouterMock.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.CLAIM_VOTING_NAME(), _claimVoting.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_NAME(),
      _bmiCoverStaking.address
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
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());

    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());

    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

    await claimingRegistry.__ClaimingRegistry_init();
    await claimVoting.__ClaimVoting_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await rewardsGenerator.__RewardsGenerator_init(network);
    await nftStaking.__NFTStaking_init();

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await capitalPool.__CapitalPool_init();
    await yieldGenerator.__YieldGenerator_init(network);

    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

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

    initialDeposit = wei("1000");
    stblInitialDeposit = getStableAmount("1000");

    await stbl.approve(policyBookFabric.address, stblInitialDeposit);

    await setCurrentTime(1);

    const policyBookAddr = (
      await policyBookFabric.create(
        insuranceContract,
        ContractType.CONTRACT,
        "test description",
        "TEST",
        initialDeposit,
        TOKEN
      )
    ).logs[0].args.at;

    policyBook = await PolicyBookMock.at(policyBookAddr);
    const policyBookFacadeAddress = await policyBook.policyBookFacade();
    policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddress);

    await policyBookAdmin.whitelist(policyBookAddr, true);

    const tx = await policyBookFabric.createLeveragePools(
      insuranceContract2,
      ContractType.VARIOUS,
      "User Leverage Pool",
      "USDT"
    );
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await rewardsGenerator.setRewardPerBlock(wei("100"));

    await capitalPool.setliquidityCushionBalance(toBN(wei("100000")));

    withdrawalPeriod = toBN(await capitalPool.getWithdrawPeriod());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  async function createPolicyBooks(numberOfPolicyBooks, isWhitelist) {
    const policyBooks = [];
    const policyBookFacades = [];

    for (let i = 0; i < numberOfPolicyBooks; i++) {
      /// @dev When interacting with TetherToken contract use 6 decimal amounts
      /// @dev When interacting with BMI contracts use 18 decimal amounts
      const initialDeposit = toBN(wei("1000"));
      await stbl.approve(policyBookFabric.address, 0);
      await stbl.approve(policyBookFabric.address, stblInitialDeposit);

      //await setCurrentTime(1);

      const policyBookAddri = (
        await policyBookFabric.create(
          accounts[i + 1],
          ContractType.CONTRACT,
          "test description" + i,
          "TEST" + i,
          initialDeposit,
          TOKEN
        )
      ).logs[0].args.at;

      const policyBooki = await PolicyBookMock.at(policyBookAddri);
      const policyBookFacadeAddri = await policyBooki.policyBookFacade();
      policyBookFacadei = await PolicyBookFacade.at(policyBookFacadeAddri);

      policyBooks.push(policyBooki);
      policyBookFacades.push(policyBookFacadei);

      await policyBookAdmin.whitelist(policyBookAddri, isWhitelist);
    }

    return [policyBooks, policyBookFacades];
  }

  describe("tryToAddPolicyBook", async () => {
    let stblAmount;
    let liquidityAmount;

    beforeEach("setup", async () => {
      oneToken = getStableAmount("1");
      stblAmount = oneToken.times(100);
      liquidityAmount = toBN(wei("1")).times(10);
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook.address, stblAmount, { from: USER1 });
    });

    it("should correctly add policy book address when the user add liquidity", async () => {
      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER1 });

      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER1), [policyBook.address]);
    });

    it("should correctly add policy books addresses when the user add liquidity in different policy books", async () => {
      const numberOfPolicyBooks = 3;
      const [policyBooks, policyBookFacades] = await createPolicyBooks(numberOfPolicyBooks, true);
      const policyBooksAddresses = [];

      for (let i = 0; i < numberOfPolicyBooks; i++) {
        await stbl.approve(policyBooks[i].address, stblAmount, { from: USER1 });
        await policyBookFacades[i].addLiquidity(liquidityAmount, { from: USER1 });
        policyBooksAddresses.push(policyBooks[i].address);
      }

      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER1), policyBooksAddresses);
    });

    it("should correctly update liqudity registry after transfer nft", async () => {
      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER1 });

      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER1), [policyBook.address]);
      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER2), []);

      await policyBook.approve(bmiCoverStaking.address, liquidityAmount, { from: USER1 });

      await bmiCoverStaking.stakeBMIX(liquidityAmount, policyBook.address, { from: USER1 });

      assert.equal(await bmiCoverStaking.totalStaked(USER1), liquidityAmount.toString());
      assert.equal(await bmiCoverStaking.totalStaked(USER2), 0);

      await bmiCoverStaking.safeTransferFrom(USER1, USER2, 1, 1, [], { from: USER1 });

      assert.equal(await bmiCoverStaking.totalStaked(USER1), 0);
      assert.equal(toBN(await bmiCoverStaking.totalStaked(USER2)).toString(), liquidityAmount.toString());

      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER1), []);
      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER2), [policyBook.address]);
    });
  });

  describe("tryToRemovePolicyBook", async () => {
    let stblAmount;
    let liquidityAmount;

    beforeEach("setup", async () => {
      oneToken = getStableAmount("1");
      stblAmount = oneToken.times(10000);
      liquidityAmount = toBN(wei("1")).times(1000);
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook.address, stblAmount, { from: USER2 });
    });

    it("should correctly remove policy book address when the user withdraw liquidity", async () => {
      await policyBook.approve(policyBook.address, liquidityAmount.plus(liquidityAmount), { from: USER1 });
      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER1 });

      await policyBookFacade.requestWithdrawal(liquidityAmount, { from: USER1 });

      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER1), [policyBook.address]);

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(withdrawalPeriod).plus(10));

      await policyBookFacade.withdrawLiquidity({ from: USER1 });

      assert.equal(await bmiCoverStaking.totalStaked(USER1), 0);
      assert.equal(await policyBook.balanceOf(USER1), 0);
      assert.equal(await policyBook.getWithdrawalStatus(USER1), WithdrawalStatus.NONE);
      assert.isTrue(toBN((await policyBook.withdrawalsInfo(USER1)).withdrawalAmount).eq(0));

      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER1), []);
    });

    it("should not remove policy book address if user have staking", async () => {
      const stakeAmount = toBN(wei("1")).times(4);

      await policyBook.approve(policyBook.address, liquidityAmount, { from: USER1 });
      await policyBook.approve(bmiCoverStaking.address, stakeAmount, { from: USER1 });

      await policyBookFacade.addLiquidityAndStake(liquidityAmount, stakeAmount, { from: USER1 });

      await policyBookFacade.requestWithdrawal(liquidityAmount.minus(stakeAmount), { from: USER1 });

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(withdrawalPeriod).plus(10));

      await policyBookFacade.withdrawLiquidity({ from: USER1 });

      assert.equal(await bmiCoverStaking.totalStaked(USER1), stakeAmount.toString());
      assert.equal(await policyBook.balanceOf(USER1), 0);

      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER1), [policyBook.address]);
    });

    it("should not remove policy book address if user have pending withdrawal", async () => {
      await policyBook.approve(policyBook.address, liquidityAmount, { from: USER1 });
      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER1 });

      await policyBookFacade.requestWithdrawal(liquidityAmount, { from: USER1 });

      const epochsNumber = 5;
      const coverTokensAmount = toBN(wei("1")).times(1000);
      await policyBookFacade.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });
      await capitalPool.setliquidityCushionBalance(getStableAmount("1000"));
      await capitalPool.sethardUsdtAccumulatedBalance(0);
      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(withdrawalPeriod).plus(10));

      await policyBookFacade.withdrawLiquidity({ from: USER1 });

      assert.isTrue(toBN((await policyBook.withdrawalsInfo(USER1)).withdrawalAmount).gt(0));

      assert.deepEqual(await liquidityRegistry.getPolicyBooksArr(USER1), [policyBook.address]);
    });
  });

  describe("getLiquidityInfos", async () => {
    let stblAmount;
    let liquidityAmount;
    let requestAmount;
    let policyBooksCount = 3;

    let stakeAmount;
    let policyBooks;
    let policyBookFacades;
    let policyBooksAddresses;

    before("setup", async () => {
      oneToken = getStableAmount("1");
      stblAmount = oneToken.times(100);
      liquidityAmount = toBN(wei("1")).times(10);
      requestAmount = toBN(wei("1")).times(4);
      policyBooksCount = 3;
      stakeAmount = toBN(wei("1")).times(3);
      await stbl.mintArbitrary(USER1, stblAmount.times(policyBooksCount));
      await stbl.approve(policyBook.address, stblAmount, { from: USER1 });

      [policyBooks, policyBookFacades] = await createPolicyBooks(policyBooksCount, true);
      policyBooksAddresses = [];

      for (let i = 0; i < policyBooksCount; i++) {
        await stbl.approve(policyBooks[i].address, 0, { from: USER1 });
        await stbl.approve(policyBooks[i].address, stblAmount, { from: USER1 });
        await policyBooks[i].approve(bmiCoverStaking.address, liquidityAmount, { from: USER1 });

        await policyBookFacades[i].addLiquidityAndStake(liquidityAmount, stakeAmount, { from: USER1 });
        policyBooksAddresses.push(policyBooks[i].address);
      }
    });

    it("should return correct infos if policy book not whitelisted", async () => {
      await policyBookAdmin.whitelist(policyBooksAddresses[0], false);

      for (let i = 0; i < 2; i++) {
        await policyBooks[i].approve(policyBooks[i].address, 0, { from: USER1 });
        await policyBooks[i].approve(policyBooks[i].address, requestAmount, { from: USER1 });
        await policyBookFacades[i].requestWithdrawal(requestAmount, { from: USER1 });
      }

      const result = await liquidityRegistry.getLiquidityInfos(USER1, 0, 5);

      assert.equal(result.length, 3);

      const firstInfo = result[0];

      assert.equal(toBN(firstInfo.lockedAmount).toString(), requestAmount.toString());
      assert.equal(
        toBN(firstInfo.availableAmount).toString(),
        liquidityAmount.minus(requestAmount).minus(stakeAmount).toString()
      );
      assert.equal(
        toBN(firstInfo.bmiXRatio).toString(),
        toBN(await policyBooks[0].convertBMIXToSTBL(toBN(wei("1")))).toString()
      );

      const secondInfo = result[1];

      assert.equal(toBN(secondInfo.lockedAmount).toString(), requestAmount.toString());
      assert.equal(
        toBN(secondInfo.availableAmount).toString(),
        liquidityAmount.minus(requestAmount).minus(stakeAmount).toString()
      );
    });
  });

  describe("getWithdrawalRequests", async () => {
    let stblAmount;
    let liquidityAmount;
    let requestAmount;
    let policyBooksCount;

    let policyBooks, policyBookFacades;
    let policyBooksAddresses;

    beforeEach("setup", async () => {
      oneToken = getStableAmount("1");
      stblAmount = oneToken.times(10000);
      liquidityAmount = toBN(wei("1")).times(1000);
      requestAmount = toBN(wei("1")).times(400);
      policyBooksCount = 3;
      await stbl.mintArbitrary(USER1, stblAmount.times(policyBooksCount));
      await stbl.approve(policyBook.address, 0, { from: USER1 });
      await stbl.approve(policyBook.address, stblAmount, { from: USER1 });

      [policyBooks, policyBookFacades] = await createPolicyBooks(policyBooksCount, true);
      policyBooksAddresses = [];

      for (let i = 0; i < policyBooksCount; i++) {
        await stbl.approve(policyBooks[i].address, 0, { from: USER1 });
        await stbl.approve(policyBooks[i].address, stblAmount, { from: USER1 });

        await policyBooks[i].approve(policyBooks[i].address, liquidityAmount.plus(requestAmount.times(2)), {
          from: USER1,
        });
        await policyBookFacades[i].addLiquidity(liquidityAmount, { from: USER1 });

        policyBooksAddresses.push(policyBooks[i].address);
      }
    });

    it("should return correct values", async () => {
      //await setCurrentTime(10);

      await policyBookFacades[0].requestWithdrawal(requestAmount, { from: USER1 });
      await policyBookFacades[2].requestWithdrawal(requestAmount.times(2), { from: USER1 });

      const resultArr = await liquidityRegistry.getWithdrawalRequests(USER1, 0, 5);

      const arrLength = resultArr[0];
      const requestsArr = resultArr[1];

      assert.equal(arrLength, 2);

      const firstInfo = requestsArr[0];

      assert.equal(firstInfo.policyBookAddr, policyBooksAddresses[0]);
      assert.equal(toBN(firstInfo.requestAmount).toString(), requestAmount.toString());
      assert.equal(toBN(firstInfo.requestSTBLAmount).toString(), requestAmount.toString());
      assert.equal(toBN(firstInfo.availableLiquidity).toString(), liquidityAmount.plus(wei("1000")).toString());
      assert.closeTo(
        toBN(firstInfo.readyToWithdrawDate).toNumber(),
        toBN(await time.latest())
          .plus(withdrawalPeriod)
          .toNumber(),
        1
      ); // more or less one seconde
      assert.equal(toBN(firstInfo.endWithdrawDate).toString(), 0);

      const secondInfo = requestsArr[1];

      assert.equal(secondInfo.policyBookAddr, policyBooksAddresses[2]);
      assert.equal(toBN(secondInfo.requestAmount).toString(), requestAmount.times(2).toString());
      assert.equal(toBN(secondInfo.requestSTBLAmount).toString(), requestAmount.times(2).toString());
      assert.equal(toBN(secondInfo.availableLiquidity).toString(), liquidityAmount.plus(wei("1000")).toString());
    });

    it("should return correct end withdraw date if withdraw possible", async () => {
      await policyBookFacades[0].requestWithdrawal(requestAmount, { from: USER1 });

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(withdrawalPeriod).plus(10));

      const resultArr = await liquidityRegistry.getWithdrawalRequests(USER1, 0, 5);

      const arrLength = resultArr[0];
      const requestsArr = resultArr[1];

      assert.equal(arrLength, 1);

      const firstInfo = requestsArr[0];

      assert.equal(firstInfo.policyBookAddr, policyBooksAddresses[0]);

      assert.equal((await policyBooks[0].getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      assert.equal(
        toBN(firstInfo.endWithdrawDate).toString(),
        toBN(await time.latest())
          .plus(readyToWithdrawPeriod - 10)
          .toString()
      );
    });

    it("should return correct array if user have second wirhdraw request", async () => {
      await policyBookFacades[0].requestWithdrawal(requestAmount, { from: USER1 });
      await policyBookFacades[1].requestWithdrawal(requestAmount, { from: USER1 });

      const epochsNumber = 5;
      const coverTokensAmount = toBN(wei("1")).times(1600);

      await policyBookFacades[1].buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });
      await capitalPool.setliquidityCushionBalance(getStableAmount("200"));
      await capitalPool.sethardUsdtAccumulatedBalance(0);
      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(withdrawalPeriod).plus(10));
      await policyBookFacades[1].withdrawLiquidity({ from: USER1 });

      assert.equal(await policyBooks[1].getWithdrawalStatus(USER1), WithdrawalStatus.PENDING);

      const resultArr = await liquidityRegistry.getWithdrawalRequests(USER1, 0, 5);

      const arrLength = resultArr[0];
      const requestsArr = resultArr[1];

      assert.equal(arrLength, 2);

      const firstInfo = requestsArr[0];
      const secondInfo = requestsArr[1];

      assert.equal(firstInfo.policyBookAddr, policyBooksAddresses[0]);
      assert.equal(secondInfo.policyBookAddr, policyBooksAddresses[1]);
    });
  });

  describe("getPendingWithdrawalRequestAmount", async () => {
    let stblAmount;
    let liquidityAmount;
    let requestAmount;
    let policyBooksCount;

    let policyBooks, policyBookFacades;
    let policyBooksAddresses;

    beforeEach("setup", async () => {
      oneToken = getStableAmount("1");
      stblAmount = oneToken.times(10000);
      liquidityAmount = toBN(wei("1")).times(1000);
      requestAmount = toBN(wei("1")).times(400);
      policyBooksCount = 3;
      await stbl.mintArbitrary(USER1, stblAmount.times(policyBooksCount));
      await stbl.mintArbitrary(USER2, stblAmount.times(policyBooksCount));

      [policyBooks, policyBookFacades] = await createPolicyBooks(policyBooksCount, true);
      policyBooksAddresses = [];

      for (let i = 0; i < policyBooksCount; i++) {
        await stbl.approve(policyBooks[i].address, 0, { from: USER1 });
        await stbl.approve(policyBooks[i].address, stblAmount, { from: USER1 });
        await stbl.approve(policyBooks[i].address, 0, { from: USER2 });
        await stbl.approve(policyBooks[i].address, stblAmount, { from: USER2 });

        await policyBooks[i].approve(policyBooks[i].address, liquidityAmount.plus(requestAmount.times(2)), {
          from: USER1,
        });
        await policyBookFacades[i].addLiquidity(liquidityAmount, { from: USER1 });
        await policyBooks[i].approve(policyBooks[i].address, liquidityAmount.plus(requestAmount.times(2)), {
          from: USER2,
        });
        await policyBookFacades[i].addLiquidity(liquidityAmount, { from: USER2 });

        policyBooksAddresses.push(policyBooks[i].address);
      }
    });

    it("should return the right amount of pending withdrawal (pending)", async () => {
      await policyBookFacades[0].requestWithdrawal(requestAmount, { from: USER1 });
      await policyBookFacades[0].requestWithdrawal(requestAmount, { from: USER2 });
      await policyBookFacades[2].requestWithdrawal(requestAmount.times(2), { from: USER1 });

      const timestamp = await getBlockTimestamp();
      const rebalanceDuration = (await capitalPool.rebalanceDuration()).toNumber();
      await setCurrentTime(timestamp + withdrawalPeriod.toNumber() - rebalanceDuration + 10);

      assert.equal(await liquidityRegistry.getPolicyBooksArrLength(USER1), 3);
      const _limit = await liquidityRegistry.getWithdrawlRequestUsersListCount();
      const result = await liquidityRegistry.getAllPendingWithdrawalRequestsAmount(_limit);

      assert.equal(toBN(result).toString(), requestAmount.times(4).toString());
    });

    it("should return the right amount of pending withdrawal (ready)", async () => {
      await policyBookFacades[0].requestWithdrawal(requestAmount, { from: USER1 });
      await policyBookFacades[0].requestWithdrawal(requestAmount, { from: USER2 });
      await policyBookFacades[2].requestWithdrawal(requestAmount.times(2), { from: USER1 });

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(withdrawalPeriod).plus(10));
      const _limit = await liquidityRegistry.getWithdrawlRequestUsersListCount();
      const result = await liquidityRegistry.getAllPendingWithdrawalRequestsAmount(_limit);

      assert.equal(toBN(result).toString(), requestAmount.times(4).toString());

      const limit1 = await liquidityRegistry.getPoolWithdrawlRequestsUsersListCount(policyBooksAddresses[0]);
      const limit2 = await liquidityRegistry.getPoolWithdrawlRequestsUsersListCount(policyBooksAddresses[2]);

      const result1 = await liquidityRegistry.getPendingWithdrawalAmountByPolicyBook(policyBooksAddresses[0], limit1);
      const result2 = await liquidityRegistry.getPendingWithdrawalAmountByPolicyBook(policyBooksAddresses[2], limit2);

      assert.equal(toBN(result1).toString(), requestAmount.times(2).toString());
      assert.equal(toBN(result2).toString(), requestAmount.times(2).toString());
    });

    it("should return the right amount of pending withdrawal (expired)", async () => {
      await policyBookFacades[0].requestWithdrawal(requestAmount, { from: USER1 });
      await policyBookFacades[0].requestWithdrawal(requestAmount, { from: USER2 });
      await policyBookFacades[2].requestWithdrawal(requestAmount.times(2), { from: USER1 });

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(timestamp + withdrawalPeriod.toNumber() + readyToWithdrawPeriod + 10);

      const limit1 = await liquidityRegistry.getPoolWithdrawlRequestsUsersListCount(policyBooksAddresses[0]);
      const limit2 = await liquidityRegistry.getPoolWithdrawlRequestsUsersListCount(policyBooksAddresses[2]);

      const result1 = await liquidityRegistry.getPendingWithdrawalAmountByPolicyBook(policyBooksAddresses[0], limit1);
      const result2 = await liquidityRegistry.getPendingWithdrawalAmountByPolicyBook(policyBooksAddresses[2], limit2);

      assert.equal(result1.toString(), 0);
      assert.equal(result2.toString(), 0);
    });
  });
});
