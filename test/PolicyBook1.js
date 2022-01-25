const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const STBLMock = artifacts.require("STBLMock");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const LiquidityMining = artifacts.require("LiquidityMining");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const ClaimVoting = artifacts.require("ClaimVoting");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const CapitalPool = artifacts.require("CapitalPoolMock");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const ShieldMining = artifacts.require("ShieldMining");
const PolicyQuote = artifacts.require("PolicyQuote");
const PriceFeed = artifacts.require("PriceFeed");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WETHMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");

const PolicyBook = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const UserLeveragePool = artifacts.require("UserLeveragePoolMock");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");
const { time } = require("@openzeppelin/test-helpers");
const { ethers } = require("ethers");
const { sign2612 } = require("./helpers/signatures");
const { MAX_UINT256 } = require("./helpers/constants");
const policyBookContract = require("../build/contracts/PolicyBook.json");
const Wallet = require("ethereumjs-wallet").default;

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

function toBN(number) {
  return new BigNumber(number);
}

const eventFilter = async (contractAddress, eventName) => {
  const iface = new ethers.utils.Interface(policyBookContract.abi);
  let _provider = new ethers.providers.JsonRpcProvider(web3.currentProvider.host);
  const logs = await _provider.getLogs({
    address: contractAddress,
  });

  const decodedEvents = logs.map((log) => {
    if (web3.utils.sha3(eventName) == log.topics[0]) return iface.decodeEventLog(eventName, log.data, log.topics);
  });

  return decodedEvents;
};

const wei = web3.utils.toWei;

contract("PolicyBook", async (accounts) => {
  const reverter = new Reverter(web3);
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const PERCENTAGE_100 = toBN(10).pow(27);
  const PRECISION = toBN(10).pow(25);
  const PROTOCOL_PERCENTAGE = 20 * PRECISION;
  const APY_PRECISION = toBN(10 ** 5);

  const epochPeriod = toBN(604800); // 7 days
  const withdrawalPeriod = toBN(691200); // 8 days

  const epochsNumber = toBN(5);
  const initialDeposit = wei("1000");
  const stblAmount = toBN(wei("100000", "mwei"));
  const liquidityAmount = toBN(wei("5000"));
  const amountToWithdraw = toBN(wei("1000"));
  const coverTokensAmount = toBN(wei("1000"));

  let contractsRegistry;
  let stbl;
  let bmi;

  let capitalPool;
  let reinsurancePool;
  let userLeveragePool;
  let leveragePortfolioView;

  let bmiUtilityNFT;
  let nftStaking;
  let bmiCoverStaking;
  let bmiCoverStakingView;
  let liquidityMining;

  let policyBookRegistry;
  let policyBookFabric;
  let policyBookAdmin;
  let policyQuote;
  let policyRegistry;

  let claimVoting;
  let claimingRegistry;

  let _policyBookImpl;
  let _policyBookFacadeImpl;
  let _userLeveragePoolImpl;

  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const USER3 = accounts[3];
  const USER4 = accounts[4];
  const insuranceContract1 = accounts[5];
  const insuranceContract2 = accounts[6];
  const DISTRIBUTOR = accounts[8];
  const NOTHING = accounts[9];

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    stbl = await STBLMock.new("stbl", "stbl", 6);
    bmi = await BMIMock.new(USER1);
    const weth = await WETHMock.new("weth", "weth");
    const sushiswapRouterMock = await SushiswapRouterMock.new();

    _policyBookImpl = await PolicyBook.new();
    _policyBookFacadeImpl = await PolicyBookFacade.new();
    _userLeveragePoolImpl = await UserLeveragePool.new();

    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _claimVoting = await ClaimVoting.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _liquidityMining = await LiquidityMining.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _shieldMining = await ShieldMining.new();
    const _policyQuote = await PolicyQuote.new();
    const _priceFeed = await PriceFeed.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LEGACY_REWARDS_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.YIELD_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REPUTATION_SYSTEM_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.VBMI_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.WETH_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.SUSHISWAP_ROUTER_NAME(), sushiswapRouterMock.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGenerator.address
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
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      _claimingRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CLAIM_VOTING_NAME(), _claimVoting.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_REGISTRY_NAME(), _policyRegistry.address);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_REGISTRY_NAME(), _liquidityRegistry.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.LIQUIDITY_MINING_NAME(), _liquidityMining.address);
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

    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_NAME(),
      _bmiCoverStaking.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );

    policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    liquidityMining = await LiquidityMining.at(await contractsRegistry.getLiquidityMiningContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await claimVoting.__ClaimVoting_init();
    await liquidityMining.__LiquidityMining_init();
    await rewardsGenerator.__RewardsGenerator_init();
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();
    await bmiUtilityNFT.__BMIUtilityNFT_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_UTILITY_NFT_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());

    await sushiswapRouterMock.setReserve(stbl.address, wei(toBN(10 ** 3).toString()));
    await sushiswapRouterMock.setReserve(weth.address, wei(toBN(10 ** 15).toString()));
    await sushiswapRouterMock.setReserve(bmi.address, wei(toBN(10 ** 15).toString()));

    await policyBookAdmin.setupPricingModel(
      PRECISION.times(80),
      PRECISION.times(2),
      wei("10"),
      PRECISION.times(10),
      PRECISION.times(50),
      PRECISION.times(25),
      PRECISION.times(100)
    );

    await reverter.snapshot();
  });

  beforeEach("creation of PB", async () => {
    setCurrentTime(1);
    await stbl.approve(policyBookFabric.address, 0);
    await stbl.approve(policyBookFabric.address, toBN(initialDeposit).times(2));

    const tx1 = await policyBookFabric.create(
      insuranceContract1,
      ContractType.CONTRACT,
      `test1 description`,
      `TEST1`,
      initialDeposit,
      zeroAddress
    );
    const policyBookAddress1 = tx1.logs[0].args.at;
    policyBook1 = await PolicyBook.at(policyBookAddress1);
    const policyBookFacadeAddress1 = await policyBook1.policyBookFacade();
    policyBookFacade1 = await PolicyBookFacade.at(policyBookFacadeAddress1);

    await policyBookAdmin.whitelist(policyBook1.address, true);
    await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade1.address, true);

    const tx2 = await policyBookFabric.create(
      insuranceContract2,
      ContractType.CONTRACT,
      `test2 description`,
      `TEST2`,
      initialDeposit,
      zeroAddress
    );
    const policyBookAddress2 = tx2.logs[0].args.at;
    policyBook2 = await PolicyBook.at(policyBookAddress2);
    const policyBookFacadeAddress2 = await policyBook2.policyBookFacade();
    policyBookFacade2 = await PolicyBookFacade.at(policyBookFacadeAddress2);

    await policyBookAdmin.whitelist(policyBook2.address, true);
    await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade2.address, true);

    const tx = await policyBookFabric.createLeveragePools(ContractType.VARIOUS, "User Leverage Pool", "USDT");
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await liquidityMining.startLiquidityMining();
  });
  afterEach("revert", reverter.revert);

  describe("creation checks", async () => {
    it("has expected token name", async () => {
      assert.equal(await policyBook1.name(), "test1 description");
      assert.equal(await policyBook2.name(), "test2 description");
      assert.equal(await userLeveragePool.name(), "User Leverage Pool");
    });
    it("has expected token symbol", async () => {
      assert.equal(await policyBook1.symbol(), "bmiV2TEST1Cover");
      assert.equal(await policyBook2.symbol(), "bmiV2TEST2Cover");
      assert.equal(await userLeveragePool.symbol(), "bmiV2USDTCover");
    });
  });
  describe("buyPolicy", async () => {
    let priceTotal;
    let price;
    let protocolPrice;

    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER2 });

      await stbl.transfer(USER3, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER3 });

      await stbl.transfer(USER4, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER4 });

      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER1 });
      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER2 });

      assert.equal(
        (await policyBook1.totalLiquidity()).toString(),
        toBN(initialDeposit).plus(toBN(liquidityAmount).times(2)).toFixed().toString()
      );
      assert.equal((await policyBook1.balanceOf(USER1)).toString(), liquidityAmount.toFixed().toString());
      assert.equal((await policyBook1.balanceOf(USER2)).toString(), liquidityAmount.toFixed().toString());

      priceTotal = await policyQuote.getQuote(epochPeriod.times(5).minus(5), coverTokensAmount, policyBook1.address);
      protocolPrice = toBN(priceTotal).times(0.2).dp(0, BigNumber.ROUND_FLOOR);
      price = toBN(priceTotal).minus(protocolPrice);

      await policyBookAdmin.whitelistDistributor(DISTRIBUTOR, toBN(5).times(PRECISION));
    });
    it("reverts if PolicyBookFacade is not caller", async () => {
      const reason = "PB: Not a PBFc";
      const FEES = toBN(3);

      await truffleAssert.reverts(
        policyBook1.buyPolicy(USER1, USER1, epochsNumber, coverTokensAmount, FEES, DISTRIBUTOR, {
          from: USER1,
        }),
        reason
      );
    });
    it("reverts if holder already exists", async () => {
      const reason = "PB: The holder already exists";
      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

      await truffleAssert.reverts(
        policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 }),
        reason
      );
    });
    it.skip("reverts if claim is pendind", async () => {
      const reason = "PB: Claim is pending";

      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });
      const toApproveOnePercent = await policyBookFacade1.getClaimApprovalAmount(USER1);
      await bmi.approve(claimVoting.address, toApproveOnePercent, { from: USER1 });
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await truffleAssert.reverts(
        policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER2 }),
        reason
      );
    });
    it("reverts if there is not enough liquidity", async () => {
      const reason = "PB: Not enough liquidity";

      await truffleAssert.reverts(
        policyBookFacade1.buyPolicy(epochsNumber, liquidityAmount.plus(wei("10000000")), { from: USER1 }),
        reason
      );
    });
    it("reverts if cover is less than minimum coverage", async () => {
      const reason = "PB: Wrong cover";

      await truffleAssert.reverts(policyBookFacade1.buyPolicy(epochsNumber, 0, { from: USER1 }), reason);
    });
    it("reverts if epoch is not > 0 and is bigger than maximum epoch", async () => {
      const reason = "PB: Wrong epoch duration";
      await truffleAssert.reverts(policyBookFacade1.buyPolicy(0, coverTokensAmount, { from: USER1 }), reason);
      await truffleAssert.reverts(policyBookFacade1.buyPolicy(1000000, coverTokensAmount, { from: USER1 }), reason);
    });
    it("buyPolicy correctly", async () => {
      const virtualEpochs = toBN(2);

      assert.equal(await policyBook1.lastDistributionEpoch(), 1);
      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

      let totalCoverTokens = toBN(await policyBook1.totalCoverTokens());
      let epochAmounts = toBN(await policyBook1.epochAmounts(epochsNumber.plus(virtualEpochs)));

      assert.equal(totalCoverTokens.toString(), coverTokensAmount.toString());
      assert.equal(epochAmounts, coverTokensAmount.toString());

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(initialDeposit)
          .times(2) // 2 policy book created
          .plus(toBN(liquidityAmount).times(2)) // liquidity added 2 times
          .plus(priceTotal)
          .idiv(10 ** 12)
          .toFixed()
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount
          .minus(toBN(liquidityAmount).idiv(10 ** 12))
          .minus(toBN(priceTotal).idiv(10 ** 12))
          .toString()
      );
    });
    it("buyPolicyFor correctly", async () => {
      const virtualEpochs = toBN(2);

      assert.equal(await policyBook1.lastDistributionEpoch(), 1);
      await policyBookFacade1.buyPolicyFor(USER1, epochsNumber, coverTokensAmount, {
        from: USER2,
      });

      let totalCoverTokens = toBN(await policyBook1.totalCoverTokens());
      let epochAmounts = toBN(await policyBook1.epochAmounts(epochsNumber.plus(virtualEpochs)));

      assert.equal(totalCoverTokens.toString(), coverTokensAmount.toString());
      assert.equal(epochAmounts, coverTokensAmount.toString());

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(initialDeposit)
          .times(2) // 2 policy book created
          .plus(toBN(liquidityAmount).times(2)) // liquidity added 2 times
          .plus(priceTotal)
          .idiv(10 ** 12)
          .toFixed()
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount.minus(toBN(liquidityAmount).idiv(10 ** 12)).toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        stblAmount
          .minus(toBN(liquidityAmount).idiv(10 ** 12))
          .minus(toBN(priceTotal).idiv(10 ** 12))
          .toString()
      );
    });
    it("buyPolicyFromDistributor correctly", async () => {
      const virtualEpochs = toBN(2);

      const distributorFees = await policyBookAdmin.distributorFees(DISTRIBUTOR);
      assert.equal(distributorFees.toString(), toBN(5).times(PRECISION).toFixed().toString());
      const distributorAmount = toBN(priceTotal).times(toBN(distributorFees).div(PRECISION)).div(100);

      assert.equal(await policyBook1.lastDistributionEpoch(), 1);
      await policyBookFacade1.buyPolicyFromDistributor(epochsNumber, coverTokensAmount, DISTRIBUTOR, { from: USER1 });

      let totalCoverTokens = toBN(await policyBook1.totalCoverTokens());
      let epochAmounts = toBN(await policyBook1.epochAmounts(epochsNumber.plus(virtualEpochs)));

      assert.equal(totalCoverTokens.toString(), coverTokensAmount.toString());
      assert.equal(epochAmounts, coverTokensAmount.toString());

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(initialDeposit)
          .times(2) // 2 policy book created
          .plus(toBN(liquidityAmount).times(2)) // liquidity added 2 times
          .plus(toBN(priceTotal).minus(distributorAmount))
          .idiv(10 ** 12)
          .toFixed()
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(DISTRIBUTOR)).toString(),
        toBN(distributorAmount)
          .idiv(10 ** 12)
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount
          .minus(toBN(liquidityAmount).idiv(10 ** 12))
          .minus(toBN(priceTotal).idiv(10 ** 12))
          .toString()
      );
    });
    it("buyPolicyFromDistributorFor correctly", async () => {
      const virtualEpochs = toBN(2);

      const distributorFees = await policyBookAdmin.distributorFees(DISTRIBUTOR);
      assert.equal(distributorFees.toString(), toBN(5).times(PRECISION).toFixed().toString());
      const distributorAmount = toBN(priceTotal).times(toBN(distributorFees).div(PRECISION)).div(100);

      assert.equal(await policyBook1.lastDistributionEpoch(), 1);
      await policyBookFacade1.buyPolicyFromDistributorFor(USER1, epochsNumber, coverTokensAmount, DISTRIBUTOR, {
        from: USER2,
      });

      let totalCoverTokens = toBN(await policyBook1.totalCoverTokens());
      let epochAmounts = toBN(await policyBook1.epochAmounts(epochsNumber.plus(virtualEpochs)));

      assert.equal(totalCoverTokens.toString(), coverTokensAmount.toString());
      assert.equal(epochAmounts, coverTokensAmount.toString());

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(initialDeposit)
          .times(2) // 2 policy book created
          .plus(toBN(liquidityAmount).times(2)) // liquidity added 2 times
          .plus(toBN(priceTotal).minus(distributorAmount))
          .idiv(10 ** 12)
          .toFixed()
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(DISTRIBUTOR)).toString(),
        toBN(distributorAmount)
          .idiv(10 ** 12)
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount.minus(toBN(liquidityAmount).idiv(10 ** 12)).toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        stblAmount
          .minus(toBN(liquidityAmount).idiv(10 ** 12))
          .minus(toBN(priceTotal).idiv(10 ** 12))
          .toString()
      );
    });
    it("updateEpochsInfo correctly", async () => {
      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER1 });
      const virtualEpochs = toBN(2);
      const epochsNumbers = [1, 3, 2, 1];
      const usersAmounts = [
        liquidityAmount.div(2),
        liquidityAmount.div(2),
        coverTokensAmount.times(10),
        coverTokensAmount,
      ];

      assert.equal(await policyBook1.lastDistributionEpoch(), 1);
      await policyBookFacade1.buyPolicy(epochsNumbers[0], usersAmounts[0], { from: USER1 });
      await policyBookFacade1.buyPolicy(epochsNumbers[1], usersAmounts[1], { from: USER2 });

      let currentTotalCoverTokens = usersAmounts[0].plus(usersAmounts[1]);
      assert.equal(toBN(await policyBook1.totalCoverTokens()).toString(), currentTotalCoverTokens.toString());
      assert.equal(
        toBN(await policyBook1.epochAmounts(virtualEpochs.plus(epochsNumbers[0]))).toString(),
        usersAmounts[0].toString()
      );
      assert.equal(
        toBN(await policyBook1.epochAmounts(virtualEpochs.plus(epochsNumbers[1]))).toString(),
        usersAmounts[1].toString()
      );

      await setCurrentTime(epochPeriod.times(3).plus(10));

      await policyBookFacade1.buyPolicy(epochsNumbers[2], usersAmounts[2], { from: USER3 });
      assert.equal(await policyBook1.lastDistributionEpoch(), 4);

      currentTotalCoverTokens = usersAmounts[1].plus(usersAmounts[2]);
      assert.equal(toBN(await policyBook1.totalCoverTokens()).toString(), currentTotalCoverTokens.toString());
      assert.equal(await policyBook1.epochAmounts(virtualEpochs.plus(epochsNumbers[0])), 0);
      assert.equal(
        toBN(await policyBook1.epochAmounts(virtualEpochs.plus(epochsNumbers[1]))).toString(),
        usersAmounts[1].toString()
      );
      assert.equal(
        toBN(await policyBook1.epochAmounts(virtualEpochs.plus(3).plus(epochsNumbers[2]))).toString(),
        usersAmounts[2].toString()
      );

      await setCurrentTime(epochPeriod.times(12).plus(10));

      await policyBookFacade1.buyPolicy(epochsNumbers[3], usersAmounts[3], { from: USER4 });
      assert.equal(await policyBook1.lastDistributionEpoch(), 13);

      assert.equal(toBN(await policyBook1.totalCoverTokens()).toString(), coverTokensAmount.toString());
      assert.equal(await policyBook1.epochAmounts(virtualEpochs.plus(epochsNumbers[0])), 0);
      assert.equal(await policyBook1.epochAmounts(virtualEpochs.plus(epochsNumbers[1])), 0);
      assert.equal(
        toBN(await policyBook1.epochAmounts(toBN(await policyBook1.lastDistributionEpoch()).plus(2))).toString(),
        coverTokensAmount.toString()
      );
    });
    it("buyPolicy when previous policy expired", async () => {
      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });
      assert.equal(toBN(await policyBook1.totalCoverTokens()).toString(), coverTokensAmount.toString());
      let policyInfo = await policyRegistry.policyInfos(USER1, policyBook1.address);
      assert.equal(toBN(policyInfo.coverAmount).toString(), coverTokensAmount.toString());

      await setCurrentTime(toBN(epochsNumber).plus(3).times(epochPeriod).plus(10));

      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER2 });
      assert.equal(toBN(await policyBook1.totalCoverTokens()).toString(), coverTokensAmount.toString());
      policyInfo = await policyRegistry.policyInfos(USER2, policyBook1.address);
      assert.equal(toBN(policyInfo.coverAmount).toString(), coverTokensAmount.toString());
    });
    it("emits a PolicyBought event", async () => {
      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, {
        from: USER1,
      });
      let decodedEvents = await eventFilter(
        policyBook1.address,
        "PolicyBought(address,uint256,uint256,uint256,address)"
      );
      assert.equal(decodedEvents[0]._policyHolder, USER1);
      assert.equal(decodedEvents[0]._coverTokens.toString(), coverTokensAmount.toFixed().toString());
      assert.equal(decodedEvents[0]._price.toString(), toBN(priceTotal).toFixed().toString());
      assert.equal(decodedEvents[0]._newTotalCoverTokens.toString(), coverTokensAmount.toFixed().toString());
      assert.equal(decodedEvents[0]._distributor, zeroAddress);
    });
    describe("buyPolicy withPremiumDistribution", async () => {
      const PLATINUM_NFT_ID = 1;
      const GOLD_NFT_ID = 2;

      let priceTotalDiscountByPlatNFT;
      let priceTotalDiscountByGoldNFT;

      beforeEach("setup", async () => {
        const NFTRewards = [PLATINUM_NFT_ID, GOLD_NFT_ID];

        await bmiUtilityNFT.mintNFTs(USER1, NFTRewards, [1, 1]);
        await bmiUtilityNFT.setApprovalForAll(nftStaking.address, true, { from: USER1 });

        priceTotalDiscountByPlatNFT = toBN(priceTotal).minus(toBN(priceTotal).times(0.15).dp(0, BigNumber.ROUND_FLOOR));
        priceTotalDiscountByGoldNFT = toBN(priceTotal).minus(toBN(priceTotal).times(0.1).dp(0, BigNumber.ROUND_FLOOR));
      });

      it("should get discount 15% for policy premium by lock platinum NFT", async () => {
        await nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 });

        await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

        assert.equal(
          toBN(await stbl.balanceOf(USER1)).toString(),
          stblAmount
            .minus(toBN(liquidityAmount).idiv(10 ** 12))
            .minus(toBN(priceTotalDiscountByPlatNFT).idiv(10 ** 12))
            .toString()
        );
      });
      it("should get discount 10% for policy premium by lock gold NFT", async () => {
        await nftStaking.lockNFT(GOLD_NFT_ID, { from: USER1 });

        await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

        assert.equal(
          toBN(await stbl.balanceOf(USER1)).toString(),
          stblAmount
            .minus(toBN(liquidityAmount).idiv(10 ** 12))
            .minus(toBN(priceTotalDiscountByGoldNFT).idiv(10 ** 12))
            .toString()
        );
      });
      it("should get discount 15% for policy premium by lock gold NFT then platinum NFT", async () => {
        await nftStaking.lockNFT(GOLD_NFT_ID, { from: USER1 });

        await nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 });

        await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

        assert.equal(
          toBN(await stbl.balanceOf(USER1)).toString(),
          stblAmount
            .minus(toBN(liquidityAmount).idiv(10 ** 12))
            .minus(toBN(priceTotalDiscountByPlatNFT).idiv(10 ** 12))
            .toString()
        );
      });
      it("should get discount 15% for policy premium by lock platinum NFT then gold NFT", async () => {
        await nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 });

        await nftStaking.lockNFT(GOLD_NFT_ID, { from: USER1 });

        await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

        assert.equal(
          toBN(await stbl.balanceOf(USER1)).toString(),
          stblAmount
            .minus(toBN(liquidityAmount).idiv(10 ** 12))
            .minus(toBN(priceTotalDiscountByPlatNFT).idiv(10 ** 12))
            .toString()
        );
      });
    });
  });
  describe("addLiquidity", async () => {
    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER1 });
      await stbl.approve(policyBook2.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER2 });
      await stbl.approve(policyBook2.address, stblAmount, { from: USER2 });
    });
    it("reverts if Liquidity Amount is null", async () => {
      const reason = "PB: Liquidity amount is zero";

      await truffleAssert.reverts(policyBookFacade1.addLiquidity(1000, { from: USER1 }), reason);
    });
    it("addLiquidity correctly", async () => {
      const balanceCPBefore = await stbl.balanceOf(capitalPool.address);
      const balanceUBefore = await stbl.balanceOf(USER1);

      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER1 });

      assert.equal(
        toBN(await policyBook1.totalLiquidity()).toString(),
        toBN(initialDeposit).plus(liquidityAmount).toString()
      );
      assert.equal(toBN(await policyBook1.balanceOf(USER1)).toString(), toBN(liquidityAmount).toString());
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore)
          .plus(liquidityAmount.idiv(10 ** 12))
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        toBN(balanceUBefore)
          .minus(liquidityAmount.idiv(10 ** 12))
          .toString()
      );
    });
    it("updates addLiquidity correctly", async () => {
      const balanceCPBefore = await stbl.balanceOf(capitalPool.address);
      const balanceUBefore = await stbl.balanceOf(USER1);
      const totalLiquidityBefore = await policyBook2.totalLiquidity();
      const balanceBMIXBefore = toBN(await policyBook2.balanceOf(USER1));

      await policyBookFacade2.addLiquidity(liquidityAmount, { from: USER1 });

      assert.equal(
        toBN(await policyBook2.totalLiquidity()).toString(),
        toBN(totalLiquidityBefore).plus(liquidityAmount).toString()
      );
      assert.equal(
        toBN(await policyBook2.balanceOf(USER1)).toString(),
        toBN(balanceBMIXBefore).plus(liquidityAmount).toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore)
          .plus(liquidityAmount.idiv(10 ** 12))
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        toBN(balanceUBefore)
          .minus(liquidityAmount.idiv(10 ** 12))
          .toString()
      );

      await policyBookFacade2.addLiquidity(liquidityAmount, { from: USER1 });

      assert.equal(
        toBN(await policyBook2.totalLiquidity()).toString(),
        toBN(totalLiquidityBefore).plus(liquidityAmount.times(2)).toString()
      );
      assert.equal(
        toBN(await policyBook2.balanceOf(USER1)).toString(),
        toBN(balanceBMIXBefore).plus(liquidityAmount.times(2)).toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore)
          .plus(liquidityAmount.times(2).idiv(10 ** 12))
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        toBN(balanceUBefore)
          .minus(liquidityAmount.times(2).idiv(10 ** 12))
          .toString()
      );
    });
    it("addLiquidityFromDistributorFor correctly", async () => {
      const balanceCPBefore = await stbl.balanceOf(capitalPool.address);
      const balanceU1Before = await stbl.balanceOf(USER1);
      const balanceU2Before = await stbl.balanceOf(USER2);

      await policyBookFacade1.addLiquidityFromDistributorFor(USER1, liquidityAmount, { from: USER2 });

      assert.equal(
        toBN(await policyBook1.totalLiquidity()).toString(),
        toBN(initialDeposit).plus(liquidityAmount).toString()
      );
      assert.equal(toBN(await policyBook1.balanceOf(USER1)).toString(), toBN(liquidityAmount).toString());
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore)
          .plus(liquidityAmount.idiv(10 ** 12))
          .toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), toBN(balanceU1Before).toString());
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        toBN(balanceU2Before)
          .minus(liquidityAmount.idiv(10 ** 12))
          .toString()
      );
    });
    it("updates addLiquidityFromDistributorFor correctly", async () => {
      const balanceCPBefore = await stbl.balanceOf(capitalPool.address);
      const balanceU1Before = await stbl.balanceOf(USER1);
      const balanceU2Before = await stbl.balanceOf(USER2);
      const totalLiquidityBefore = await policyBook2.totalLiquidity();
      const balanceBMIXBefore = toBN(await policyBook2.balanceOf(USER1));

      await policyBookFacade2.addLiquidityFromDistributorFor(USER1, liquidityAmount, { from: USER2 });

      assert.equal(
        toBN(await policyBook2.totalLiquidity()).toString(),
        toBN(totalLiquidityBefore).plus(liquidityAmount).toString()
      );
      assert.equal(
        toBN(await policyBook2.balanceOf(USER1)).toString(),
        toBN(balanceBMIXBefore).plus(liquidityAmount).toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore)
          .plus(liquidityAmount.idiv(10 ** 12))
          .toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), toBN(balanceU1Before).toString());
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        toBN(balanceU2Before)
          .minus(liquidityAmount.idiv(10 ** 12))
          .toString()
      );

      await policyBookFacade2.addLiquidityFromDistributorFor(USER1, liquidityAmount, { from: USER2 });

      assert.equal(
        toBN(await policyBook2.totalLiquidity()).toString(),
        toBN(totalLiquidityBefore).plus(liquidityAmount.times(2)).toString()
      );
      assert.equal(
        toBN(await policyBook2.balanceOf(USER1)).toString(),
        toBN(balanceBMIXBefore).plus(liquidityAmount.times(2)).toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore)
          .plus(liquidityAmount.times(2).idiv(10 ** 12))
          .toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), toBN(balanceU1Before).toString());
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        toBN(balanceU2Before)
          .minus(liquidityAmount.times(2).idiv(10 ** 12))
          .toString()
      );
    });
    it("mints correct BMIX amount if total supply < total liquidity", async () => {
      const totalLiquidity = toBN(wei("100000"));
      const totalSupply = toBN(wei("20000"));

      await policyBook2.setTotalLiquidity(totalLiquidity, { from: USER2 });
      assert.equal((await policyBook2.totalLiquidity()).toString(), toBN(totalLiquidity).toFixed().toString());
      await policyBook2.mint(toBN(totalSupply).minus(initialDeposit), { from: USER2 });
      assert.equal((await policyBook2.totalSupply()).toString(), toBN(totalSupply).toFixed().toString());

      let STBLToBMIXRatio = await policyBook2.getSTBLToBMIXRatio();
      assert.equal(STBLToBMIXRatio.toString(), PERCENTAGE_100.times(5).toFixed().toString());

      await policyBookFacade2.addLiquidity(liquidityAmount, { from: USER1 });
      const expectedBMIXAmount = liquidityAmount.div(5);

      assert.equal(
        toBN(await policyBook2.totalLiquidity())
          .toFixed()
          .toString(),
        toBN(totalLiquidity).plus(liquidityAmount).toFixed().toString()
      );
      assert.equal(toBN(await policyBook2.balanceOf(USER1)).toNumber(), toBN(expectedBMIXAmount).toNumber());
    });
    it("mints correct BMIX amount if total supply > total liquidity", async () => {
      const totalLiquidity = toBN(wei("20000"));
      const totalSupply = toBN(wei("100000"));

      await policyBook2.setTotalLiquidity(totalLiquidity, { from: USER2 });
      assert.equal((await policyBook2.totalLiquidity()).toString(), toBN(totalLiquidity).toFixed().toString());
      await policyBook2.mint(toBN(totalSupply).minus(initialDeposit), { from: USER2 });
      assert.equal((await policyBook2.totalSupply()).toString(), toBN(totalSupply).toFixed().toString());

      let STBLToBMIXRatio = await policyBook2.getSTBLToBMIXRatio();
      assert.equal(STBLToBMIXRatio.toString(), PERCENTAGE_100.times(0.2).toFixed().toString());

      await policyBookFacade2.addLiquidity(liquidityAmount, { from: USER1 });
      const expectedBMIXAmount = liquidityAmount.times(5);

      assert.equal(
        toBN(await policyBook2.totalLiquidity())
          .toFixed()
          .toString(),
        toBN(totalLiquidity).plus(liquidityAmount).toFixed().toString()
      );
      assert.equal(toBN(await policyBook2.balanceOf(USER1)).toNumber(), toBN(expectedBMIXAmount).toNumber());
    });
    it.skip("emits a LiquidityAdded event", async () => {
      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER1 });

      let decodedEvents = await eventFilter(policyBook1.address, "LiquidityAdded(address,uint256,uint256)");
      assert.equal(decodedEvents[0]._liquidityHolder, USER1);
      assert.equal(decodedEvents[0]._liquidityAmount, liquidityAmount.toString());
      assert.equal(decodedEvents[0]._newTotalLiquidity, toBN(initialDeposit).plus(liquidityAmount).toString());
    });
    describe("addLiquidityAndStake", async () => {
      beforeEach("setup", async () => {
        await policyBook1.approve(bmiCoverStaking.address, liquidityAmount, { from: USER1 });
        await policyBook1.approve(bmiCoverStaking.address, liquidityAmount, { from: USER2 });
      });
      it("reverts if staking amount is wrong", async () => {
        const reason = "PB: Wrong staking amount";

        await truffleAssert.reverts(
          policyBookFacade1.addLiquidityAndStake(liquidityAmount, liquidityAmount.plus(1), { from: USER1 }),
          reason
        );
      });
      it("provides liquidity and make a stake (1)", async () => {
        await policyBookFacade1.addLiquidityAndStake(liquidityAmount, liquidityAmount, { from: USER1 });

        assert.equal(
          toBN(await policyBook1.totalLiquidity()).toString(),
          toBN(initialDeposit).plus(liquidityAmount).toString()
        );
        assert.equal(
          toBN(await stbl.balanceOf(USER1)).toString(),
          toBN(stblAmount)
            .minus(toBN(liquidityAmount).idiv(10 ** 12))
            .toString()
        );
        assert.equal(
          toBN(await stbl.balanceOf(capitalPool.address)).toString(),
          toBN(toBN(initialDeposit).times(2).plus(liquidityAmount))
            .idiv(10 ** 12)
            .toString()
        );

        assert.equal(
          toBN((await bmiCoverStakingView.stakingInfoByToken(1)).stakedBMIXAmount).toString(),
          liquidityAmount.toString()
        );

        assert.equal(await bmiCoverStaking.balanceOf(USER1), 1);
        assert.equal(await bmiCoverStaking.ownerOf(1), USER1);
      });
      it("provides liquidity and make a stake (2)", async () => {
        await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER1 });
        await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER2 });

        const priceTotal = await policyQuote.getQuote(
          epochPeriod.times(5).minus(5),
          coverTokensAmount,
          policyBook1.address
        );

        await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER2 });

        //await setCurrentTime(12 * 7 * 24 * 60 * 60 + 10);

        await policyBookFacade1.addLiquidityAndStake(liquidityAmount, liquidityAmount, { from: USER1 });

        assert.equal(
          toBN(await policyBook1.totalLiquidity())
            .toFixed()
            .toString(),
          toBN(initialDeposit).plus(toBN(liquidityAmount).times(3)).toFixed().toString()
        );
        assert.equal(
          toBN(await stbl.balanceOf(USER1)).toString(),
          toBN(stblAmount)
            .minus(
              toBN(liquidityAmount)
                .times(2)
                .idiv(10 ** 12)
            )
            .toString()
        );

        assert.equal(
          toBN(await stbl.balanceOf(capitalPool.address)).toString(),
          toBN(initialDeposit)
            .times(2) // 2 policy book created
            .plus(toBN(liquidityAmount).times(3)) // liquidity added 2 times
            .plus(priceTotal)
            .idiv(10 ** 12)
            .toFixed()
            .toString()
        );

        assert.equal(
          toBN((await bmiCoverStakingView.stakingInfoByToken(1)).stakedBMIXAmount).toString(),
          liquidityAmount.toString()
        );

        assert.equal(await bmiCoverStaking.balanceOf(USER1), 1);
        assert.equal(await bmiCoverStaking.ownerOf(1), USER1);
      });
      it("provides liquidity and make a stake not for the full amount", async () => {
        const stakeAmount = toBN(wei("500"));

        await policyBookFacade1.addLiquidityAndStake(liquidityAmount, stakeAmount, { from: USER1 });

        assert.equal(
          toBN(await policyBook1.totalLiquidity()).toString(),
          toBN(initialDeposit).plus(liquidityAmount).toString()
        );
        assert.equal(
          toBN(await stbl.balanceOf(USER1)).toString(),
          toBN(stblAmount)
            .minus(toBN(liquidityAmount).idiv(10 ** 12))
            .toString()
        );
        assert.equal(
          toBN(await stbl.balanceOf(capitalPool.address)).toString(),
          toBN(toBN(initialDeposit).times(2).plus(liquidityAmount))
            .idiv(10 ** 12)
            .toString()
        );

        assert.equal(
          toBN((await bmiCoverStakingView.stakingInfoByToken(1)).stakedBMIXAmount).toString(),
          stakeAmount.toString()
        );

        assert.equal(await bmiCoverStaking.balanceOf(USER1), 1);
        assert.equal(await bmiCoverStaking.ownerOf(1), USER1);
      });
    });
  });
  describe("withdrawLiquidity", async () => {
    let priceTotal;
    let protocolPrice;
    let price;

    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER2 });

      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER1 });
      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER2 });

      assert.equal(
        (await policyBook1.totalLiquidity()).toString(),
        toBN(initialDeposit).plus(toBN(liquidityAmount).times(2)).toFixed().toString()
      );
      assert.equal((await policyBook1.balanceOf(USER1)).toString(), liquidityAmount.toFixed().toString());
      assert.equal((await policyBook1.balanceOf(USER2)).toString(), liquidityAmount.toFixed().toString());

      priceTotal = await policyQuote.getQuote(epochsNumber, coverTokensAmount, policyBook1.address);
      protocolPrice = toBN(priceTotal).times(20).idiv(100);
      price = toBN(priceTotal).minus(protocolPrice);

      await capitalPool.setliquidityCushionBalance(toBN(liquidityAmount.idiv(10 ** 12)));

      await liquidityMining.createTeam("someTestTeam", { from: USER1 });
      await liquidityMining.joinTheTeam(USER1, { from: USER2 });
    });
    it("reverts if withdrawal not ready", async () => {
      const reason = "PB: Withdrawal is not ready";

      await policyBook1.approve(policyBook1.address, amountToWithdraw, { from: USER1 });
      await policyBookFacade1.requestWithdrawal(amountToWithdraw, { from: USER1 });
      await setCurrentTime(withdrawalPeriod.minus(1000));
      await truffleAssert.reverts(policyBookFacade1.withdrawLiquidity({ from: USER1 }), reason);
    });
    it("reverts if user do not have enough liquidity", async () => {
      const reason = "PB: Wrong announced amount";

      await policyBook1.approve(policyBook1.address, amountToWithdraw, { from: USER1 });
      await truffleAssert.reverts(
        policyBookFacade1.requestWithdrawal(toBN(liquidityAmount).plus(100), { from: USER1 }),
        reason
      );
    });
    it("reverts if not enough liquidity", async () => {
      const reason = "PB: Not enough free liquidity";

      await policyBookFacade1.buyPolicy(epochsNumber, toBN(coverTokensAmount).times(10), { from: USER2 });

      await policyBook1.approve(policyBook1.address, amountToWithdraw.times(4), { from: USER1 });
      await truffleAssert.reverts(
        policyBookFacade1.requestWithdrawal(amountToWithdraw.times(4), { from: USER1 }),
        reason
      );
    });
    it("withdraw tokens without queue", async () => {
      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER2 });

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(initialDeposit)
          .times(2) // 2 policy book created
          .plus(toBN(liquidityAmount).times(2)) // liquidity added 2 times
          .plus(priceTotal)
          .idiv(10 ** 12)
          .toFixed()
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        stblAmount
          .minus(toBN(liquidityAmount).idiv(10 ** 12))
          .minus(toBN(priceTotal).idiv(10 ** 12))
          .toString()
      );
      assert.equal(
        toBN(await policyBook1.totalLiquidity())
          .toFixed()
          .toString(),
        toBN(initialDeposit).plus(toBN(liquidityAmount).times(2)).toFixed().toString()
      );

      await policyBook1.approve(policyBook1.address, amountToWithdraw, { from: USER1 });
      await policyBookFacade1.requestWithdrawal(amountToWithdraw, { from: USER1 });
      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      const disAmount = price
        .idiv(epochPeriod.times(epochsNumber.plus(2)).idiv(24 * 60 * 60))
        .times(withdrawalPeriod.plus(10).idiv(24 * 60 * 60));

      //await policyBook1.triggerPremiumsDistribution();

      assert.equal(toBN(await policyBook1.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      const expectedWithdrawalAmount = toBN(await policyBook1.convertBMIXToSTBL(amountToWithdraw));

      await policyBookFacade1.withdrawLiquidity({ from: USER1 });

      assert.equal(
        toBN(await policyBook1.totalLiquidity())
          .toFixed()
          .toString(),
        toBN(initialDeposit)
          .plus(toBN(liquidityAmount).times(2))
          .minus(expectedWithdrawalAmount)
          .plus(disAmount)
          .toFixed()
          .toString()
      );
      assert.equal(
        toBN(await policyBook1.balanceOf(USER1)).toString(),
        toBN(liquidityAmount).minus(amountToWithdraw).toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(initialDeposit)
          .times(2) // 2 policy book created
          .plus(toBN(liquidityAmount).times(2)) // liquidity added 2 times
          .minus(expectedWithdrawalAmount)
          .plus(priceTotal)
          .idiv(10 ** 12)
          .plus(1)
          .toFixed()
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount
          .minus(liquidityAmount.idiv(10 ** 12))
          .plus(expectedWithdrawalAmount.idiv(10 ** 12))
          .toString()
      );
    });
    it("withdraw tokens if 2 weeks expired", async () => {
      await liquidityMining.investSTBL(liquidityAmount, policyBook1.address, { from: USER1 });

      const neededTime = toBN(await liquidityMining.getEndLMTime());
      await setCurrentTime(neededTime);

      await policyBook1.approve(policyBook1.address, amountToWithdraw, { from: USER1 });
      await policyBookFacade1.requestWithdrawal(amountToWithdraw, { from: USER1 });

      await setCurrentTime(withdrawalPeriod.plus(neededTime).plus(10));

      assert.equal(toBN(await policyBook1.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      await policyBookFacade1.withdrawLiquidity({ from: USER1 });

      assert.equal(
        toBN(await policyBook1.totalLiquidity())
          .toFixed()
          .toString(),
        toBN(initialDeposit).plus(toBN(liquidityAmount).times(3)).minus(amountToWithdraw).toFixed().toString()
      );
      assert.equal(
        toBN(await policyBook1.balanceOf(USER1)).toString(),
        toBN(liquidityAmount).times(2).minus(amountToWithdraw).toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(initialDeposit)
          .times(2) // 2 policy book created
          .plus(toBN(liquidityAmount).times(3)) // liquidity added 3 times
          .minus(amountToWithdraw)
          .idiv(10 ** 12)
          .toFixed()
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount
          .minus(
            toBN(liquidityAmount)
              .times(2)
              .idiv(10 ** 12)
          )
          .plus(amountToWithdraw.idiv(10 ** 12))
          .toString()
      );
    });
    it("withdraw part of the requested amount", async () => {
      await policyBook1.approve(policyBook1.address, amountToWithdraw.times(2), { from: USER1 });
      await policyBookFacade1.requestWithdrawal(amountToWithdraw.times(2), { from: USER1 });

      await policyBookFacade1.buyPolicy(epochsNumber, toBN(coverTokensAmount).times(10), { from: USER2 });
      assert.equal(toBN(await policyBook1.totalCoverTokens()).toString(), toBN(coverTokensAmount).times(10).toString());

      await setCurrentTime(withdrawalPeriod.plus(10));
      assert.equal(toBN(await policyBook1.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      await policyBook1.triggerPremiumsDistribution();

      const availableAmount = toBN(await policyBook1.totalLiquidity()).minus(await policyBook1.totalCoverTokens());
      const balanceBeforeWithdrawal = toBN(await stbl.balanceOf(USER1));

      assert.equal(
        toBN((await policyBook1.withdrawalsInfo(USER1)).withdrawalAmount).toString(),
        amountToWithdraw.times(2).toString()
      );

      await policyBookFacade1.withdrawLiquidity({ from: USER1 });
      const balanceAfterWithdrawal = toBN(await stbl.balanceOf(USER1));

      assert.equal(
        balanceAfterWithdrawal.minus(balanceBeforeWithdrawal).toNumber(),
        toBN(availableAmount)
          .idiv(10 ** 12)
          .toNumber(),
        1
      );
    });
    it("withdraw multiple times", async () => {
      await policyBook1.approve(policyBook1.address, amountToWithdraw.times(2), { from: USER1 });
      await policyBookFacade1.requestWithdrawal(amountToWithdraw.times(2), { from: USER1 });

      await policyBookFacade1.buyPolicy(epochsNumber, toBN(coverTokensAmount).times(10), { from: USER2 });
      assert.equal(toBN(await policyBook1.totalCoverTokens()).toString(), toBN(coverTokensAmount).times(10).toString());

      await setCurrentTime(withdrawalPeriod.plus(10));
      assert.equal(toBN(await policyBook1.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      await policyBook1.triggerPremiumsDistribution();

      const availableAmount = toBN(await policyBook1.totalLiquidity()).minus(await policyBook1.totalCoverTokens());
      const balanceBeforeWithdrawal = toBN(await stbl.balanceOf(USER1));

      assert.equal(
        toBN((await policyBook1.withdrawalsInfo(USER1)).withdrawalAmount).toString(),
        amountToWithdraw.times(2).toString()
      );

      await policyBookFacade1.withdrawLiquidity({ from: USER1 });
      const balanceAfterWithdrawal = toBN(await stbl.balanceOf(USER1));

      assert.closeTo(
        balanceAfterWithdrawal.minus(balanceBeforeWithdrawal).toNumber(),
        toBN(availableAmount)
          .idiv(10 ** 12)
          .toNumber(),
        1
      );

      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER2 });

      obj = await policyBook1.withdrawalsInfo(USER1);
      await setCurrentTime(toBN(obj.readyToWithdrawDate).plus(10));
      await policyBookFacade1.withdrawLiquidity({ from: USER1 });

      assert.equal(toBN((await policyBook1.withdrawalsInfo(USER1)).withdrawalAmount).toString(), 0);
    });
  });
  describe("getSTBLToBMIXRatio", async () => {
    it("returns current rate when total supply = 0", async () => {
      assert.equal(toBN(await policyBook1.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.toString());
    });

    it("returns current rate when total supply = total liquidity", async () => {
      const totalLiquidity = toBN(wei("100000"));
      const totalSupply = toBN(wei("100000"));

      await policyBook1.setTotalLiquidity(totalLiquidity, { from: USER1 });
      assert.equal((await policyBook1.totalLiquidity()).toString(), toBN(totalLiquidity).toFixed().toString());
      await policyBook1.mint(toBN(totalSupply).minus(initialDeposit), { from: USER1 });
      assert.equal((await policyBook1.totalSupply()).toString(), toBN(totalSupply).toFixed().toString());

      assert.equal(toBN(await policyBook1.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.toString());
    });

    it("returns current rate when total supply < total liquidity", async () => {
      const totalLiquidity = toBN(wei("100000"));
      const totalSupply = toBN(wei("20000"));

      await policyBook1.setTotalLiquidity(totalLiquidity, { from: USER1 });
      assert.equal((await policyBook1.totalLiquidity()).toString(), toBN(totalLiquidity).toFixed().toString());
      await policyBook1.mint(toBN(totalSupply).minus(initialDeposit), { from: USER1 });
      assert.equal((await policyBook1.totalSupply()).toString(), toBN(totalSupply).toFixed().toString());

      assert.equal(toBN(await policyBook1.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.times(5).toString());
    });

    it("returns current rate when total supply > total liquidity", async () => {
      const totalLiquidity = toBN(wei("20000"));
      const totalSupply = toBN(wei("100000"));

      await policyBook1.setTotalLiquidity(totalLiquidity, { from: USER1 });
      assert.equal((await policyBook1.totalLiquidity()).toString(), toBN(totalLiquidity).toFixed().toString());
      await policyBook1.mint(toBN(totalSupply).minus(initialDeposit), { from: USER1 });
      assert.equal((await policyBook1.totalSupply()).toString(), toBN(totalSupply).toFixed().toString());

      assert.equal(toBN(await policyBook1.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.times(0.2).toString());
    });

    it("returns current rate after several changes", async () => {
      let totalLiquidity = toBN(wei("20000"));
      let totalSupply = toBN(wei("100000"));

      await policyBook1.setTotalLiquidity(totalLiquidity, { from: USER1 });
      assert.equal((await policyBook1.totalLiquidity()).toString(), toBN(totalLiquidity).toFixed().toString());
      await policyBook1.mint(toBN(totalSupply).minus(initialDeposit), { from: USER1 });
      assert.equal((await policyBook1.totalSupply()).toString(), toBN(totalSupply).toFixed().toString());

      assert.equal(toBN(await policyBook1.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.times(0.2).toString());

      totalLiquidity = toBN(wei("400000"));
      await policyBook1.setTotalLiquidity(totalLiquidity, { from: USER1 });
      assert.equal((await policyBook1.totalLiquidity()).toString(), toBN(totalLiquidity).toFixed().toString());

      assert.equal(toBN(await policyBook1.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.times(4).toString());

      totalLiquidity = toBN(wei("1"));
      await policyBook1.setTotalLiquidity(totalLiquidity, { from: USER1 });
      assert.equal((await policyBook1.totalLiquidity()).toString(), toBN(totalLiquidity).toFixed().toString());

      assert.equal(toBN(await policyBook1.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.div(100000).toString());

      totalLiquidity = toBN(wei("100000"));
      await policyBook1.setTotalLiquidity(totalLiquidity, { from: USER1 });
      assert.equal((await policyBook1.totalLiquidity()).toString(), toBN(totalLiquidity).toFixed().toString());

      assert.equal(toBN(await policyBook1.getSTBLToBMIXRatio()).toString(), PERCENTAGE_100.toString());
    });
  });
  describe("submitClaimAndInitializeVoting", async () => {
    beforeEach(async function () {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER2 });

      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER1 });
      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER2 });

      assert.equal(
        (await policyBook1.totalLiquidity()).toString(),
        toBN(initialDeposit).plus(toBN(liquidityAmount).times(2)).toFixed().toString()
      );
      assert.equal((await policyBook1.balanceOf(USER1)).toString(), liquidityAmount.toFixed().toString());
      assert.equal((await policyBook1.balanceOf(USER2)).toString(), liquidityAmount.toFixed().toString());

      await bmi.transfer(USER2, wei("1000000"), { from: USER1 });
    });

    it("reverts if no coverage", async () => {
      const reason = "CV: Claimer has no coverage";

      await truffleAssert.reverts(policyBook1.submitClaimAndInitializeVoting("", { from: USER1 }), reason);
    });

    it("submits new claim", async () => {
      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });
      assert.equal(await policyRegistry.getPoliciesLength(USER1), 1);

      const toApproveOnePercent = await policyBookFacade1.getClaimApprovalAmount(USER1);
      assert.equal(toBN(toApproveOnePercent).toString(), coverTokensAmount.idiv(100).toString());

      await bmi.approve(claimVoting.address, toApproveOnePercent, { from: USER1 });
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimsCount = await claimingRegistry.countPolicyClaimerClaims(USER1);
      assert.equal(claimsCount, 1);

      const claims = await claimVoting.myClaims(0, claimsCount, { from: USER1 });

      assert.equal(claims[0][0], 1);
      assert.equal(claims[0][1], policyBook1.address);
      assert.equal(claims[0][2], "");
      assert.equal(claims[0][3], false);
      assert.equal(toBN(claims[0][4]).toString(), coverTokensAmount.toString());
      assert.equal(claims[0][5], ClaimStatus.PENDING);
      assert.equal(claims[0][6], 0);
    });

    it("does not allow two identical claims", async () => {
      const reason = "ClaimingRegistry: The claimer can't submit this claim";

      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });
      assert.equal(await policyRegistry.getPoliciesLength(USER1), 1);

      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER2 });
      assert.equal(await policyRegistry.getPoliciesLength(USER2), 1);

      const toApproveOnePercent1 = await policyBookFacade1.getClaimApprovalAmount(USER1);
      assert.equal(toBN(toApproveOnePercent1).toString(), coverTokensAmount.idiv(100).toString());

      const toApproveOnePercent2 = await policyBookFacade1.getClaimApprovalAmount(USER2);
      assert.equal(toBN(toApproveOnePercent2).toString(), coverTokensAmount.idiv(100).toString());

      await bmi.approve(claimVoting.address, toBN(toApproveOnePercent1).times(2).toString(), { from: USER1 });
      await bmi.approve(claimVoting.address, toApproveOnePercent2, { from: USER2 });

      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await truffleAssert.reverts(policyBook1.submitClaimAndInitializeVoting("", { from: USER1 }), reason);

      const claimsCount = await claimingRegistry.countPolicyClaimerClaims(USER1);
      assert.equal(claimsCount.toNumber(), 1);

      const claims = await claimVoting.myClaims(0, claimsCount, { from: USER1 });

      assert.equal(claims[0][0], 1);
      assert.equal(claims[0][1], policyBook1.address);
      assert.equal(claims[0][2], "");
      assert.equal(claims[0][3], false);
      assert.equal(toBN(claims[0][4]).toString(), coverTokensAmount.toString());
      assert.equal(claims[0][5], ClaimStatus.PENDING);
      assert.equal(claims[0][6], 0);
    });
  });
  describe("APY", async () => {
    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook1.address, stblAmount, { from: USER2 });
    });
    it("calculates correct APY without premium", async () => {
      assert.equal(toBN(await policyBook1.getAPY()), 0);
    });
    it("calculates correct APY with premium", async () => {
      const priceTotal = toBN(
        (await policyBook1.getPolicyPrice(epochsNumber, coverTokensAmount, USER2, { from: USER2 })).totalPrice
      );

      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, { from: USER2 });

      const expectedAPY = priceTotal
        .times(80)
        .idiv(100)
        .idiv(epochPeriod.times(epochsNumber + 2).idiv(24 * 60 * 60))
        .times(365)
        .times(100)
        .idiv(toBN(await policyBook1.totalSupply()).plus(await policyBook1.convertSTBLToBMIX(wei("1"))));

      assert.equal(
        toBN(await policyBook1.getAPY())
          .idiv(APY_PRECISION)
          .toString(),
        expectedAPY.toString()
      );
    });
  });
  describe("extreme premium case", async () => {
    it("should not revert", async () => {
      await stbl.approve(policyBook1.address, stblAmount);
      console.log(policyBook1.address);
      console.log(policyBookFacade1.address);
      await policyBookFacade1.addLiquidity(liquidityAmount);

      const USERS = [USER1, USER2, USER3, USER4];
      for (let i = 0; i < 4; i++) {
        await stbl.transfer(USERS[i], stblAmount);
        await stbl.approve(policyBook1.address, stblAmount, { from: USERS[i] });

        await policyBookFacade1.buyPolicy(1, toBN(wei("100")).times(i + 1), { from: USERS[i] });

        await policyBook1.getAPY();

        await setCurrentTime(epochPeriod.times(i + 1));
      }
    });
  });
  describe("permit", async () => {
    it("changes allowance through permit", async () => {
      const wallet = Wallet.generate();
      const walletAddress = wallet.getAddressString();
      const amount = toBN(10).pow(25);
      const contractData = { name: "bmiTESTCover", verifyingContract: policyBook1.address };
      const transactionData = {
        owner: walletAddress,
        spender: USER1,
        value: amount,
      };
      const { v, r, s } = sign2612(contractData, transactionData, wallet.getPrivateKey());

      await policyBook1.permit(walletAddress, USER1, amount.toString(10), MAX_UINT256.toString(10), v, r, s, {
        from: USER1,
      });
      assert.equal(toBN(await policyBook1.allowance(walletAddress, USER1)).toString(), amount.toString());
    });
    it("fails if try to use same signed data", async () => {
      const reason = "ERC20Permit: invalid signature";

      const wallet = Wallet.generate();
      const walletAddress = wallet.getAddressString();
      const amount = toBN(10).pow(25);
      const contractData = { name: "bmiTESTCover", verifyingContract: policyBook1.address };
      const transactionData = {
        owner: walletAddress,
        spender: USER1,
        value: amount,
      };
      const { v, r, s } = sign2612(contractData, transactionData, wallet.getPrivateKey());

      await policyBook1.permit(walletAddress, USER1, amount.toString(10), MAX_UINT256.toString(10), v, r, s, {
        from: USER1,
      });

      await truffleAssert.reverts(
        policyBook1.permit(walletAddress, USER1, amount.toString(10), MAX_UINT256.toString(10), v, r, s, {
          from: USER1,
        }),
        reason
      );
    });
  });
});
