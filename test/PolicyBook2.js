const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyQuote = artifacts.require("PolicyQuote");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const ClaimVoting = artifacts.require("ClaimVoting");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WrappedTokenMock");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const PriceFeed = artifacts.require("PriceFeed");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const RewardsGeneratorMock = artifacts.require("RewardsGeneratorMock");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const AaveProtocol = artifacts.require("AaveProtocol");
const CompoundProtocol = artifacts.require("CompoundProtocol");
const YearnProtocol = artifacts.require("YearnProtocol");
const CapitalPool = artifacts.require("CapitalPoolMock");
const ShieldMining = artifacts.require("ShieldMining");
const YieldGenerator = artifacts.require("YieldGenerator");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");

const { assert } = require("chai");
const { sign2612 } = require("./helpers/signatures");
const { setTetherAllowance, getRegisteredContracts, setCurrentTime } = require("./helpers/utils");
const { ethers } = require("ethers");
const { time } = require("@openzeppelin/test-helpers");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

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
};

function toBN(number) {
  return new BigNumber(number);
}

async function getBlockTimestamp() {
  const latest = toBN(await web3.eth.getBlockNumber());
  return (await web3.eth.getBlock(latest)).timestamp;
}

const wei = web3.utils.toWei;

contract("PolicyBook2", async (accounts) => {
  const reverter = new Reverter(web3);

  let contractsRegistry;
  let policyBook;
  let stbl;
  let bmi;
  let nftStaking;
  let capitalPool;
  let policyQuote;

  let network;

  const insuranceContract = accounts[0];
  const insuranceContract2 = accounts[3];
  const USER1 = accounts[1];
  const user1PrivateKey = "c4ce20adf2b728fe3005be128fb850397ec352d1ea876e3035e46d547343404f";
  const USER2 = accounts[2];

  const PRECISION = toBN(10).pow(25);

  let withdrawalPeriod;
  const withdrawalExpirePeriod = toBN(172800);

  const NOTHING = accounts[9];
  const ADDRESS_ZERO = ethers.constants.AddressZero;

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
    const _priceFeed = await PriceFeed.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _rewardsGenerator = await RewardsGeneratorMock.new();
    const _policyQuote = await PolicyQuote.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _capitalPool = await CapitalPool.new();
    const _aaveProtocol = await AaveProtocol.new();
    const _compoundProtocol = await CompoundProtocol.new();
    const _yearnProtocol = await YearnProtocol.new();
    const _shieldMining = await ShieldMining.new();
    const _claimVoting = await ClaimVoting.new();
    const _yieldGenerator = await YieldGenerator.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), _aaveProtocol.address);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), _compoundProtocol.address);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), _yearnProtocol.address);
    await contractsRegistry.addContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);

    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), sushiswapRouterMock.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGenerator.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_NAME(),
      _bmiCoverStaking.address
    );
    await contractsRegistry.addContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    await contractsRegistry.addProxyContract(await contractsRegistry.CLAIM_VOTING_NAME(), _claimVoting.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
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
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_REGISTRY_NAME(),
      _liquidityRegistry.address
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

    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const rewardsGeneratorMock = await RewardsGeneratorMock.at(await contractsRegistry.getRewardsGeneratorContract());
    const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());

    await policyBookFabric.__PolicyBookFabric_init();
    await policyBookAdmin.__PolicyBookAdmin_init(
      policyBookImpl.address,
      policyBookFacadeImpl.address,
      userLeveragePoolImpl.address
    );
    await claimingRegistry.__ClaimingRegistry_init();
    await reinsurancePool.__ReinsurancePool_init();
    await rewardsGeneratorMock.__RewardsGenerator_init();
    await nftStaking.__NFTStaking_init();
    await yieldGenerator.__YieldGenerator_init(network);
    await capitalPool.__CapitalPool_init();

    try {
      await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.YIELD_GENERATOR_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());
    } catch (e) {
      // Shows contacts with missing initializations
      console.log("getRegisteredContracts : ", await getRegisteredContracts(contractsRegistry, "missing"));
      throw e;
    }
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

    const initialDeposit = wei("1000");
    const stblInitialDeposit = getStableAmount("1000");

    const tx = await policyBookFabric.createLeveragePools(
      insuranceContract2,
      ContractType.VARIOUS,
      "User Leverage Pool",
      "USDT"
    );
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await stbl.approve(policyBookFabric.address, stblInitialDeposit);

    const policyBookAddr = (
      await policyBookFabric.create(
        insuranceContract,
        ContractType.CONTRACT,
        "placeholder",
        "TEST",
        initialDeposit,
        ADDRESS_ZERO
      )
    ).logs[0].args.at;

    policyBook = await PolicyBookMock.at(policyBookAddr);
    policyBookFacade = await PolicyBookFacade.at(await policyBook.policyBookFacade());

    withdrawalPeriod = toBN(await capitalPool.getWithdrawPeriod());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("getWithdrawalStatus", async () => {
    let stblAmount;
    let liquidityAmount;
    let coverTokensAmount;
    let amountToWithdraw;
    let epochsNumber;

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("100000");
      liquidityAmount = toBN(wei("10000"));
      coverTokensAmount = toBN(wei("8000"));
      amountToWithdraw = toBN(wei("1000"));
      epochsNumber = 5;
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook.address, stblAmount, { from: USER1 });

      await policyBook.approve(policyBook.address, liquidityAmount.plus(amountToWithdraw), { from: USER1 });

      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER1 });
    });

    it("should return NONE status if announce does not exists", async () => {
      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.NONE);
    });

    it("should return PENDING status if withdrawal period not expired", async () => {
      await policyBookFacade.requestWithdrawal(amountToWithdraw, { from: USER1 });

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.PENDING);
    });

    it("should return READY status if withdrawal is possible", async () => {
      const timestamp = await getBlockTimestamp();
      await policyBookFacade.requestWithdrawal(amountToWithdraw, { from: USER1 });

      await setCurrentTime(withdrawalPeriod.plus(timestamp));

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);
    });

    it("should return READY status if withdrawal allowed after period", async () => {
      await policyBookFacade.requestWithdrawal(amountToWithdraw.times(5), { from: USER1 });
      await policyBookFacade.buyPolicy(epochsNumber, wei("5000"), { from: USER1 });

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();
      await capitalPool.setliquidityCushionBalance(getStableAmount("5000"));
      await capitalPool.sethardUsdtAccumulatedBalance(0);

      await policyBookFacade.withdrawLiquidity({ from: USER1 });
      assert.isTrue(toBN((await policyBook.withdrawalsInfo(USER1)).withdrawalAmount).gt(0));

      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);
    });

    it("should return EXPIRED status if withdrawal not possible, withdrawal expire period expired", async () => {
      await policyBookFacade.requestWithdrawal(amountToWithdraw, { from: USER1 });

      await setCurrentTime(withdrawalPeriod.plus(withdrawalExpirePeriod).plus(10));

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);
    });
  });

  describe("requestWithdrawal", async () => {
    let stblAmount;
    let liquidityAmount;
    let amountToWithdraw;

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("100000");
      liquidityAmount = toBN(wei("10000"));
      amountToWithdraw = toBN(wei("1000"));
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook.address, stblAmount, { from: USER2 });

      await policyBook.approve(policyBook.address, liquidityAmount.plus(amountToWithdraw), { from: USER1 });

      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER1 });
    });

    it("should correctly announce withdrawal", async () => {
      const timestamp = await getBlockTimestamp();
      const txReceipt = await policyBookFacade.requestWithdrawal(amountToWithdraw, { from: USER1 });
      const event = await policyBook.getPastEvents("WithdrawalRequested");

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.equal(toBN(await policyBook.balanceOf(policyBook.address)).toString(), amountToWithdraw.toString());

      assert.equal(event[0].event, "WithdrawalRequested");
      assert.equal(event[0].args._liquidityHolder, USER1);
      assert.equal(toBN(event[0].args._tokensToWithdraw).toString(), amountToWithdraw.toString());
      assert.closeTo(
        toBN(event[0].args._readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(toBN(timestamp)).toNumber(),
        1
      );

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.PENDING);

      const withdrawalInfo = await policyBook.withdrawalsInfo(USER1);

      assert.equal(toBN(withdrawalInfo.withdrawalAmount).toString(), amountToWithdraw.toString());
      assert.closeTo(
        toBN(withdrawalInfo.readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(toBN(timestamp)).plus(1).toNumber(),
        1
      );
    });

    it("should announce withdrawal if withdrawal status EXPIRED and previous request less than new", async () => {
      let timestamp = await getBlockTimestamp();
      await policyBookFacade.requestWithdrawal(amountToWithdraw, { from: USER1 });

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.equal(toBN(await policyBook.balanceOf(policyBook.address)).toString(), amountToWithdraw.toString());

      const expiryDate = withdrawalPeriod.plus(toBN(timestamp)).plus(withdrawalExpirePeriod).plus(200);
      await setCurrentTime(expiryDate);

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);

      timestamp = await getBlockTimestamp();
      await policyBookFacade.requestWithdrawal(amountToWithdraw.times(2), { from: USER1 });

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw.times(2)).toString()
      );
      assert.equal(
        toBN(await policyBook.balanceOf(policyBook.address)).toString(),
        amountToWithdraw.times(2).toString()
      );

      const event = await policyBook.getPastEvents("WithdrawalRequested");

      assert.equal(event[0].event, "WithdrawalRequested");
      assert.equal(event[0].args._liquidityHolder, USER1);
      assert.equal(toBN(event[0].args._tokensToWithdraw).toString(), amountToWithdraw.times(2).toString());
      assert.closeTo(
        toBN(event[0].args._readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(toBN(timestamp)).toNumber(),
        1
      );

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.PENDING);

      const withdrawalInfo = await policyBook.withdrawalsInfo(USER1);

      assert.equal(toBN(withdrawalInfo.withdrawalAmount).toString(), amountToWithdraw.times(2).toString());
      assert.closeTo(
        toBN(withdrawalInfo.readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(toBN(timestamp)).toNumber(),
        1
      );
    });

    it("should announce withdrawal if withdrawal status EXPIRED and previous request greater than new", async () => {
      await policyBookFacade.requestWithdrawal(amountToWithdraw, { from: USER1 });

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.equal(toBN(await policyBook.balanceOf(policyBook.address)).toString(), amountToWithdraw.toString());

      const expiryDate = withdrawalPeriod.plus(withdrawalExpirePeriod).plus(10);
      await setCurrentTime(expiryDate);

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);

      const timestamp = await getBlockTimestamp();
      await policyBookFacade.requestWithdrawal(amountToWithdraw.div(2), { from: USER1 });

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw.div(2)).toString()
      );
      assert.equal(toBN(await policyBook.balanceOf(policyBook.address)).toString(), amountToWithdraw.div(2).toString());

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.PENDING);

      const withdrawalInfo = await policyBook.withdrawalsInfo(USER1);
      assert.equal(toBN(withdrawalInfo.withdrawalAmount).toString(), amountToWithdraw.div(2).toString());
      assert.closeTo(
        toBN(withdrawalInfo.readyToWithdrawDate).toNumber(),
        withdrawalPeriod.plus(timestamp).plus(1).toNumber(),
        1
      );
    });

    it("should correctly requestWithdrawal multiple times", async () => {
      let timestamp = await getBlockTimestamp();
      await policyBookFacade.requestWithdrawal(amountToWithdraw, { from: USER1 });

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.equal(toBN(await policyBook.balanceOf(policyBook.address)).toString(), amountToWithdraw.toString());

      await setCurrentTime(withdrawalPeriod.plus(timestamp).plus(withdrawalExpirePeriod).plus(10));

      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);

      timestamp = await getBlockTimestamp();
      await policyBookFacade.requestWithdrawal(amountToWithdraw.div(2), { from: USER1 });

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw.div(2)).toString()
      );
      assert.equal(toBN(await policyBook.balanceOf(policyBook.address)).toString(), amountToWithdraw.div(2).toString());

      await setCurrentTime(withdrawalPeriod.plus(timestamp).plus(withdrawalExpirePeriod).plus(10));
      assert.equal(toBN(await policyBook.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.EXPIRED);

      await policyBookFacade.requestWithdrawal(amountToWithdraw.times(2), { from: USER1 });

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw.times(2)).toString()
      );
      assert.equal(
        toBN(await policyBook.balanceOf(policyBook.address)).toString(),
        amountToWithdraw.times(2).toString()
      );
    });

    it("should get exception, amount to be announced is greater than the available amount", async () => {
      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER2 });

      const reason = "PB: Wrong announced amount";
      await truffleAssert.reverts(policyBookFacade.requestWithdrawal(liquidityAmount.plus(1), { from: USER1 }), reason);
    });
  });

  describe("requestWithdrawalWithPermit", async () => {
    let stblAmount;
    let liquidityAmount;
    let amountToWithdraw;

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("100000");
      liquidityAmount = toBN(wei("10000"));
      amountToWithdraw = toBN(wei("1000"));
    });

    it.skip("should correctly request withdrawal without approve", async () => {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook.address, liquidityAmount, { from: USER1 });

      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER1 });
      await setCurrentTime(1);

      const buffer = Buffer.from(user1PrivateKey, "hex");
      const contractData = { name: "bmiTESTCover", verifyingContract: policyBook.address };
      const transactionData = {
        owner: USER1,
        spender: policyBook.address,
        value: amountToWithdraw,
      };

      const { v, r, s } = sign2612(contractData, transactionData, buffer);

      const txReceipt = await policyBook.requestWithdrawalWithPermit(amountToWithdraw, v, r, s, { from: USER1 });

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );
      assert.equal(toBN(await policyBook.balanceOf(policyBook.address)).toString(), amountToWithdraw.toString());

      assert.equal(txReceipt.logs.length, 4);
      assert.equal(txReceipt.logs[3].event, "WithdrawalRequested");
      assert.equal(txReceipt.logs[3].args._liquidityHolder, USER1);
      assert.equal(toBN(txReceipt.logs[3].args._tokensToWithdraw).toString(), amountToWithdraw.toString());
      assert.equal(toBN(txReceipt.logs[3].args._readyToWithdrawDate).toString(), withdrawalPeriod.plus(1).toString());
    });
  });

  describe("unlockTokens", async () => {
    let stblAmount;
    let liquidityAmount;
    let amountToRequest;

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("1000000");
      liquidityAmount = toBN(wei("1000"));
      amountToRequest = toBN(wei("800"));
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook.address, stblAmount, { from: USER1 });

      await setCurrentTime(1);

      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER1 });

      await policyBook.approve(policyBook.address, liquidityAmount.plus(amountToRequest), { from: USER1 });

      assert.equal(toBN(await policyBook.balanceOf(USER1)).toString(), liquidityAmount);
    });

    it("should successfully unlock tokens", async () => {
      await policyBookFacade.requestWithdrawal(amountToRequest, { from: USER1 });

      assert.equal(
        toBN(await policyBook.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToRequest).toString()
      );
      assert.equal(
        toBN((await policyBook.withdrawalsInfo(USER1)).withdrawalAmount).toString(),
        amountToRequest.toString()
      );
      assert.equal(toBN(await policyBook.balanceOf(policyBook.address)).toString(), amountToRequest.toString());

      await policyBook.unlockTokens({ from: USER1 });

      assert.equal(toBN(await policyBook.balanceOf(USER1)).toString(), liquidityAmount.toString());
      assert.equal(toBN((await policyBook.withdrawalsInfo(USER1)).withdrawalAmount).toString(), 0);
    });

    it("should get exception if withdrawal amount equal zero", async () => {
      await truffleAssert.reverts(policyBook.unlockTokens({ from: USER1 }), "PB: Amount is zero");
    });
  });

  describe("endEpoch", async () => {
    it("should calculate correct end epoch time", async () => {
      const secsInWeek = 7 * 24 * 60 * 60;
      const epochStartTime = toBN(await policyBook.epochStartTime());
      const timestamp = toBN(await getBlockTimestamp());
      const endTime = epochStartTime.plus(secsInWeek);

      assert.equal(
        toBN(await policyBookFacade.secondsToEndCurrentEpoch()).toString(),
        endTime.minus(timestamp).toString()
      );
    });
  });

  describe("staking modifier", async () => {
    const POLICY_BOOK_FABRIC = accounts[8];
    const POLICY_BOOK_ADMIN = accounts[7];

    let policyBookMock;
    let policyBookFacadeMock;
    let rewardsGenerator;

    beforeEach("setup", async () => {
      policyBookMock = await PolicyBookMock.new();
      policyBookFacadeMock = await PolicyBookFacade.new();

      const _policyBookRegistry = await PolicyBookRegistry.new();
      const _rewardsGenerator = await RewardsGeneratorMock.new();

      await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_FABRIC_NAME(), POLICY_BOOK_FABRIC);
      await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_ADMIN_NAME(), POLICY_BOOK_ADMIN);

      await contractsRegistry.addProxyContract(
        await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(),
        _policyBookRegistry.address
      );
      await contractsRegistry.addProxyContract(
        await contractsRegistry.REWARDS_GENERATOR_NAME(),
        _rewardsGenerator.address
      );

      rewardsGenerator = await RewardsGeneratorMock.at(await contractsRegistry.getRewardsGeneratorContract());
      const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());

      await rewardsGenerator.__RewardsGenerator_init();
      await policyBookMock.__PolicyBookMock_init(NOTHING, ContractType.CONTRACT);
      await policyBookFacadeMock.__PolicyBookFacade_init(policyBookMock.address, accounts[0], wei("1000"));

      await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
      await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
      await policyBookMock.setDependencies(contractsRegistry.address);
      await policyBookFacadeMock.setDependencies(contractsRegistry.address);

      await policyBookRegistry.add(
        NOTHING,
        ContractType.CONTRACT,
        policyBookMock.address,
        policyBookFacadeMock.address,
        {
          from: POLICY_BOOK_FABRIC,
        }
      );

      await policyBookMock.setPolicyBookFacade(policyBookFacadeMock.address, { from: POLICY_BOOK_FABRIC });

      await policyBookMock.whitelist(true, { from: POLICY_BOOK_ADMIN });
    });

    it("should calculate correct rewards multiplier (1)", async () => {
      await policyBookMock.setTotalCoverTokens(wei("5000000"));
      await policyBookMock.setTotalLiquidity(wei("10000000"));

      await policyBookFacadeMock.forceUpdateBMICoverStakingRewardMultiplier();

      assert.equal(
        toBN((await rewardsGenerator.getPolicyBookReward(policyBookMock.address)).rewardMultiplier).toString(),
        "100000"
      );
    });

    it("should calculate correct rewards multiplier (2)", async () => {
      await policyBookMock.setTotalCoverTokens(wei("9000000"));
      await policyBookMock.setTotalLiquidity(wei("10000000"));

      await policyBookFacadeMock.forceUpdateBMICoverStakingRewardMultiplier();

      assert.equal(
        toBN((await rewardsGenerator.getPolicyBookReward(policyBookMock.address)).rewardMultiplier).toString(),
        "150000"
      );
    });

    it("should calculate correct rewards multiplier (3)", async () => {
      await policyBookMock.setTotalCoverTokens(wei("600000"));
      await policyBookMock.setTotalLiquidity(wei("10000000"));

      await policyBookFacadeMock.forceUpdateBMICoverStakingRewardMultiplier();

      assert.equal(
        toBN((await rewardsGenerator.getPolicyBookReward(policyBookMock.address)).rewardMultiplier).toString(),
        "23500"
      );
    });

    it("should calculate correct rewards multiplier (4)", async () => {
      await policyBookMock.whitelist(false, { from: POLICY_BOOK_ADMIN });

      await policyBookMock.setTotalCoverTokens(wei("600000"));
      await policyBookMock.setTotalLiquidity(wei("10000000"));

      await policyBookFacadeMock.forceUpdateBMICoverStakingRewardMultiplier();

      assert.equal(
        toBN((await rewardsGenerator.getPolicyBookReward(policyBookMock.address)).rewardMultiplier).toString(),
        "0"
      );

      await policyBookMock.whitelist(true, { from: POLICY_BOOK_ADMIN });

      assert.equal(
        toBN((await rewardsGenerator.getPolicyBookReward(policyBookMock.address)).rewardMultiplier).toString(),
        "23500"
      );

      await policyBookMock.whitelist(false, { from: POLICY_BOOK_ADMIN });

      assert.equal(
        toBN((await rewardsGenerator.getPolicyBookReward(policyBookMock.address)).rewardMultiplier).toString(),
        "0"
      );
    });
  });
});
