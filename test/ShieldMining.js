const AaveProtocol = artifacts.require("AaveProtocol");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const BMIMock = artifacts.require("BMIMock");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const CapitalPool = artifacts.require("CapitalPoolMock");
const ClaimVoting = artifacts.require("ClaimVoting");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const ClaimingRegistryMock = artifacts.require("ClaimingRegistryMock");
const CompoundProtocol = artifacts.require("CompoundProtocol");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const LiquidityMining = artifacts.require("LiquidityMining");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const NFTStaking = artifacts.require("NFTStaking");
const PolicyBook = artifacts.require("PolicyBook");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyQuote = artifacts.require("PolicyQuote");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const PriceFeed = artifacts.require("PriceFeed");
const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ReinsurancePool = artifacts.require("ReinsurancePoolMock");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const STBLMock = artifacts.require("STBLMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const WETHMock = artifacts.require("WETHMock");
const YearnProtocol = artifacts.require("YearnProtocol");
const YieldGenerator = artifacts.require("YieldGenerator");
const YieldGeneratorMock = artifacts.require("YieldGeneratorMock");
const ShieldMining = artifacts.require("ShieldMiningMock");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const { advanceBlockAtTime } = require("./helpers/ganacheTimeTraveler");
const setCurrentTime = require("./helpers/ganacheTimeTraveler");
const { time } = require("@openzeppelin/test-helpers");

const { assert } = require("chai");
const { ethers } = require("ethers");

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

contract("ShieldMining", async (accounts) => {
  const reverter = new Reverter(web3);

  let contractsRegistry;
  let policyBookMock;
  let bmiCoverStaking;
  let bmiCoverStakingView;
  let liquidityMining;
  let stbl;
  let bmi;

  let rewardsGenerator;
  let claimVoting;
  let leveragePortfolioView;

  let claimingRegistry;
  let claimingRegistryMock;
  let policyRegistry;
  let capitalPool;
  let policyBookRegistryProxy;
  let reinsurancePool;
  let aaveProtocol;
  let yearnProtocol;
  let compoundProtocol;
  let policyQuote;
  let nftStaking;
  let bmiUtilityNFT;
  let yieldGenerator;
  let userLeveragePool;
  let policyBookAdmin;
  let sushiswapRouterMock;
  let shieldMining;
  let userLeveragePoolSM;

  let policyBookFabric;
  let policyBook;
  let policyBookSm;
  let policyBookFacade;
  let policyBookSmFacade;

  const epochPeriod = toBN(604800); // 7 days

  const OWNER = accounts[0];
  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const CONTRACT1 = accounts[3];
  const CONTRACT2 = accounts[4];
  const CONTRACT3 = accounts[5];
  const USER3 = accounts[6];
  const USER4 = accounts[7];

  const ADDRESS_ZERO = ethers.constants.AddressZero;
  const DECIMALS18 = toBN(10).pow(18);
  const PRECISION = toBN(10).pow(25);

  const PERCENTAGE_100 = toBN(10).pow(27);
  const APY_PRECISION = toBN(10 ** 5);
  const withdrawalPeriod = toBN(691200); // 8 days
  const BLOCKS_PER_DAY = toBN(6450);

  const initialDeposit = toWei("1000");

  const NOTHING = accounts[9];
  const DISTRIBUTOR = accounts[5];

  const getBMIXAmount = async (STBLAmount) => {
    return toBN(await policyBookMock.convertSTBLToBMIX(STBLAmount));
  };

  const getSTBLAmount = async (bmiXAmount) => {
    return toBN(await policyBookMock.convertBMIXToSTBL(bmiXAmount));
  };

  async function getPreviousBlockTimestamp() {
    const latest = toBN(await web3.eth.getBlockNumber());
    return (await web3.eth.getBlock(latest.minus(1))).timestamp;
  }

  async function getBlockTimestamp() {
    const latest = toBN(await web3.eth.getBlockNumber());
    return (await web3.eth.getBlock(latest)).timestamp;
  }

  async function getCurrentBlock() {
    const block = await web3.eth.getBlock("latest");
    return block.number;
  }

  const getTransactionBlock = (tx) => tx.receipt.blockNumber;

  async function advanceBlocks(amount) {
    for (let i = 0; i < amount; i++) {
      await advanceBlockAtTime(1);
    }
  }

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    const policyBookImpl = await PolicyBookMock.new();
    const policyBookFacadeImpl = await PolicyBookFacade.new();
    const weth = await WETHMock.new("weth", "weth");
    let sushiswapRouterMock = await SushiswapRouterMock.new();
    bmi = await BMIMock.new(OWNER);
    stbl = await STBLMock.new("stbl", "stbl", 6);
    //shieldToken = await STBLMock.new("shieldToken", "SMT", 6);
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _priceFeed = await PriceFeed.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyQuote = await PolicyQuote.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _capitalPool = await CapitalPool.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _liquidityMining = await LiquidityMining.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _claimingRegistryMock = await ClaimingRegistryMock.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _claimVoting = await ClaimVoting.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _yieldGenerator = await YieldGenerator.new();
    const userLeveragePoolImpl = await UserLeveragePool.new();
    const _aaveProtocol = await AaveProtocol.new();
    const _compoundProtocol = await CompoundProtocol.new();
    const _yearnProtocol = await YearnProtocol.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LEGACY_REWARDS_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_REGISTRY_NAME(), _liquidityRegistry.address);
    // await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_FABRIC_NAME(), _policyBookFabric.address);
    await contractsRegistry.addContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addContract(await contractsRegistry.REPUTATION_SYSTEM_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.SUSHISWAP_ROUTER_NAME(), sushiswapRouterMock.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.VBMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.WETH_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.YIELD_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );

    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.CLAIM_VOTING_NAME(), _claimVoting.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.LIQUIDITY_MINING_NAME(), _liquidityMining.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);
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
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);

    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());
    claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
    claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    liquidityMining = await LiquidityMining.at(await contractsRegistry.getLiquidityMiningContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    sushiswapRouterMock = await SushiswapRouterMock.at(await contractsRegistry.getSushiswapRouterContract());
    yieldGenerator = await YieldGeneratorMock.at(await contractsRegistry.getYieldGeneratorContract());
    shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    leveragePortfolioView = await LeveragePortfolioView.at(await contractsRegistry.getLeveragePortfolioViewContract());

    await bmiCoverStaking.__BMICoverStaking_init();
    await bmiUtilityNFT.__BMIUtilityNFT_init();
    await capitalPool.__CapitalPool_init();
    await claimVoting.__ClaimVoting_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await liquidityMining.__LiquidityMining_init();
    await nftStaking.__NFTStaking_init();
    await policyBookAdmin.__PolicyBookAdmin_init(
      policyBookImpl.address,
      policyBookFacadeImpl.address,
      userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await reinsurancePool.__ReinsurancePool_init();
    await rewardsGenerator.__RewardsGenerator_init();
    await yieldGenerator.__YieldGenerator_init();
    await shieldMining.__ShieldMining_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

    await sushiswapRouterMock.setReserve(stbl.address, toWei(toBN(10 ** 3).toString()));
    await sushiswapRouterMock.setReserve(weth.address, toWei(toBN(10 ** 15).toString()));
    await sushiswapRouterMock.setReserve(bmi.address, toWei(toBN(10 ** 15).toString()));

    await policyBookAdmin.setupPricingModel(
      PRECISION.times(80),
      PRECISION.times(2),
      toWei("10"),
      PRECISION.times(10),
      PRECISION.times(50),
      PRECISION.times(25),
      PRECISION.times(100)
    );

    await stbl.approve(policyBookFabric.address, initialDeposit);

    const policyBookEmpty = (
      await policyBookFabric.create(
        CONTRACT1,
        ContractType.CONTRACT,
        "test description",
        "TEST",
        initialDeposit,
        ADDRESS_ZERO
      )
    ).logs[0].args.at;

    const policyBookSM = (
      await policyBookFabric.create(
        CONTRACT2,
        ContractType.CONTRACT,
        "test description2",
        "TEST2",
        initialDeposit,
        stbl.address
      )
    ).logs[0].args.at;

    const userLeveragePoolAddress = (
      await policyBookFabric.createLeveragePools(ContractType.VARIUOS, "User Leverage Pool", "LevPf1")
    ).logs[0].args.at;

    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.setLeveragePortfolioProtocolConstant(
      userLeveragePool.address,
      PRECISION.times(45),
      PRECISION.times(2),
      PRECISION.times(100),
      PRECISION.times(100)
    );

    policyBook = await PolicyBookMock.at(policyBookEmpty);
    policyBookSm = await PolicyBookMock.at(policyBookSM);

    const policyBookFacadeAddress = await policyBook.policyBookFacade();
    policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddress);

    const policyBookSMFacadeAddress = await policyBookSm.policyBookFacade();
    policyBookSmFacade = await PolicyBookFacade.at(policyBookSMFacadeAddress);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("restriction to create a shield mining (owner)", () => {
    beforeEach(async () => {
      await stbl.approve(shieldMining.address, toWei("25000"));
    });

    it("should revert if the policy book does not exist", async () => {
      await truffleAssert.reverts(
        shieldMining.associateShieldMining(reinsurancePool.address, stbl.address),
        "SM: Not a PolicyBook"
      );
    });

    it("could change an already attached shield mining", async () => {
      await shieldMining.associateShieldMining(policyBook.address, stbl.address);
      await shieldMining.associateShieldMining(policyBook.address, bmi.address);
      assert.equal(await shieldMining.getShieldTokenAddress(policyBook.address), bmi.address);
    });

    it("could not change an already attached shield mining by anyone", async () => {
      await shieldMining.associateShieldMining(policyBook.address, stbl.address);
      await truffleAssert.reverts(
        shieldMining.associateShieldMining(policyBook.address, bmi.address, { from: USER2 }),
        "SM: no access"
      );
      assert.equal(await shieldMining.getShieldTokenAddress(policyBook.address), stbl.address);
    });

    it("should revert if duration is not in the range", async () => {
      await shieldMining.associateShieldMining(policyBook.address, stbl.address);
      await truffleAssert.reverts(
        shieldMining.fillShieldMining(policyBook.address, toWei("500"), 21),
        "SM: out of minimum/maximum duration"
      );

      await truffleAssert.reverts(
        shieldMining.fillShieldMining(policyBook.address, toWei("500"), 367),
        "SM: out of minimum/maximum duration"
      );
    });

    it("should revert SM token is a contract", async () => {
      await truffleAssert.reverts(
        policyBookFabric.create(
          CONTRACT3,
          ContractType.CONTRACT,
          "test description2",
          "TEST2",
          initialDeposit,
          policyQuote.address
        ),
        "SM: is not an ERC20"
      );
    });

    it("should revert SM token is an account", async () => {
      await truffleAssert.reverts(
        policyBookFabric.create(CONTRACT3, ContractType.CONTRACT, "test description2", "TEST2", initialDeposit, USER2),
        "Address:"
      );
    });

    it("should revert if refill is call before createSM", async () => {
      await truffleAssert.reverts(
        shieldMining.fillShieldMining(policyBook.address, toWei("500"), 45),
        "SM: no shield mining associated"
      );
    });

    it("should revert if deposit small amount", async () => {
      await shieldMining.associateShieldMining(policyBook.address, stbl.address);
      await truffleAssert.reverts(shieldMining.fillShieldMining(policyBook.address, 100, 45), "SM: amount is zero");
    });
  });

  describe("fillShieldMining", async () => {
    const duration1 = PRECISION.times(0.02);
    const duration2 = PRECISION.times(0.01);
    const duration3 = PRECISION.times(0.01);
    const amount1 = toWei("256");
    const amount2 = toWei("63");
    const amount3 = toWei("189");
    const totalAmount = toWei("508");
    const stbleAmount = toWei("508", "mwei");

    beforeEach(async () => {
      await stbl.approve(shieldMining.address, stbleAmount, { from: USER1 });
      await stbl.transfer(USER1, stbleAmount);
    });

    it("should update reward per token before - checking shield mining info", async () => {
      let fromBlock1 = await getCurrentBlock();

      let endBlock1 = toBN(fromBlock1).plus(
        duration1.div(PRECISION).times(BLOCKS_PER_DAY).integerValue(BigNumber.ROUND_DOWN)
      );

      // refill1
      let tx = await shieldMining.mockFillShieldMining(policyBookSm.address, amount1, duration1, { from: USER1 });
      let info = await shieldMining.getShieldMiningInfo(policyBookSm.address);

      assert.equal(info._decimals.toString(), "6");
      assert.equal(info._firstBlockWithReward.toString(), getTransactionBlock(tx).toString());

      assert.equal(info._lastBlockWithReward.toString(), endBlock1.toString());
      assert.equal(info._lastUpdateBlock.toString(), getTransactionBlock(tx).toString());
      assert.equal(info._rewardTokensLocked.toString(), amount1);
      assert.equal(info._nearestLastBlocksWithReward.toString(), 0);
      assert.equal(info._rewardPerBlock.toString(), toWei("2"));
      assert.equal(info._tokenPerDay.toString(), toBN(info._rewardPerBlock).times(BLOCKS_PER_DAY).toFixed().toString());

      assert.equal(info._rewardPerTokenStored.toString(), 0);
      assert.equal(info._totalSupply.toString(), initialDeposit.toString());

      assert.equal(
        toBN(await stbl.balanceOf(shieldMining.address)).toString(),
        toBN(amount1)
          .idiv(10 ** 12)
          .toString()
      );
      await advanceBlocks(10);

      // refill2
      let fromBlock2 = await getCurrentBlock();
      let endBlock2 = toBN(fromBlock2).plus(
        duration2.div(PRECISION).times(BLOCKS_PER_DAY).integerValue(BigNumber.ROUND_DOWN)
      );
      tx = await shieldMining.mockFillShieldMining(policyBookSm.address, amount2, duration2, { from: USER1 });
      info = await shieldMining.getShieldMiningInfo(policyBookSm.address);

      assert.equal(info._firstBlockWithReward.toString(), getTransactionBlock(tx).toString());

      assert.equal(info._lastBlockWithReward.toString(), endBlock1.toString());
      assert.equal(info._lastUpdateBlock.toString(), getTransactionBlock(tx).toString());
      assert.equal(info._rewardTokensLocked.toString(), toBN(amount1).plus(toBN(amount2)).toFixed().toString());

      assert.equal(info._nearestLastBlocksWithReward.toString(), endBlock1.toString());
      assert.equal(info._rewardPerBlock.toString(), toWei("3"));
      assert.equal(info._tokenPerDay.toString(), toBN(info._rewardPerBlock).times(BLOCKS_PER_DAY).toFixed().toString());

      assert.equal(info._rewardPerTokenStored.toString(), toWei("0.022"));

      assert.equal(
        toBN(await stbl.balanceOf(shieldMining.address)).toString(),
        toBN(amount1)
          .plus(toBN(amount2))
          .idiv(10 ** 12)
          .toFixed()
          .toString()
      );
    });

    it("should update reward per token before - checking shield mining info - different SM token decimals", async () => {
      await shieldMining.associateShieldMining(policyBookSm.address, bmi.address);
      await bmi.approve(shieldMining.address, totalAmount, { from: USER1 });
      await bmi.transfer(USER1, totalAmount);

      let fromBlock1 = await getCurrentBlock();

      let endBlock1 = toBN(fromBlock1).plus(
        duration1.div(PRECISION).times(BLOCKS_PER_DAY).integerValue(BigNumber.ROUND_DOWN)
      );

      // refill1
      let tx = await shieldMining.mockFillShieldMining(policyBookSm.address, amount1, duration1, { from: USER1 });
      let info = await shieldMining.getShieldMiningInfo(policyBookSm.address);

      assert.equal(info._decimals.toString(), "18");
      assert.equal(info._firstBlockWithReward.toString(), getTransactionBlock(tx).toString());

      assert.equal(info._lastBlockWithReward.toString(), endBlock1.toString());
      assert.equal(info._lastUpdateBlock.toString(), getTransactionBlock(tx).toString());
      assert.equal(info._rewardTokensLocked.toString(), amount1);
      assert.equal(info._nearestLastBlocksWithReward.toString(), 0);
      assert.equal(info._rewardPerBlock.toString(), toWei("2"));
      assert.equal(info._tokenPerDay.toString(), toBN(info._rewardPerBlock).times(BLOCKS_PER_DAY).toFixed().toString());

      assert.equal(info._rewardPerTokenStored.toString(), 0);
      assert.equal(info._totalSupply.toString(), initialDeposit.toString());

      assert.equal(toBN(await bmi.balanceOf(shieldMining.address)).toString(), toBN(amount1).toString());
      await advanceBlocks(10);

      // refill2
      let fromBlock2 = await getCurrentBlock();
      let endBlock2 = toBN(fromBlock2).plus(
        duration2.div(PRECISION).times(BLOCKS_PER_DAY).integerValue(BigNumber.ROUND_DOWN)
      );
      tx = await shieldMining.mockFillShieldMining(policyBookSm.address, amount2, duration2, { from: USER1 });
      info = await shieldMining.getShieldMiningInfo(policyBookSm.address);

      assert.equal(info._firstBlockWithReward.toString(), getTransactionBlock(tx).toString());

      assert.equal(info._lastBlockWithReward.toString(), endBlock1.toString());
      assert.equal(info._lastUpdateBlock.toString(), getTransactionBlock(tx).toString());
      assert.equal(info._rewardTokensLocked.toString(), toBN(amount1).plus(toBN(amount2)).toFixed().toString());

      assert.equal(info._nearestLastBlocksWithReward.toString(), endBlock1.toString());
      assert.equal(info._rewardPerBlock.toString(), toWei("3"));
      assert.equal(info._tokenPerDay.toString(), toBN(info._rewardPerBlock).times(BLOCKS_PER_DAY).toFixed().toString());

      assert.equal(info._rewardPerTokenStored.toString(), toWei("0.022"));

      assert.equal(
        toBN(await bmi.balanceOf(shieldMining.address)).toString(),
        toBN(amount1).plus(toBN(amount2)).toFixed().toString()
      );
    });

    it("should update reward per token with every deposit - checking overlapping rewards", async () => {
      let fromBlock1 = await getCurrentBlock();
      let endBlock1 = toBN(fromBlock1).plus(
        duration1.div(PRECISION).times(BLOCKS_PER_DAY).integerValue(BigNumber.ROUND_DOWN)
      );

      // refill1
      let tx = await shieldMining.mockFillShieldMining(policyBookSm.address, amount1, duration1, { from: USER1 });

      let info = await shieldMining.getShieldMiningInfo(policyBookSm.address);
      await advanceBlocks(10);
      let fromBlock2 = await getCurrentBlock();
      let endBlock2 = toBN(fromBlock2).plus(
        duration2.div(PRECISION).times(BLOCKS_PER_DAY).integerValue(BigNumber.ROUND_DOWN)
      );

      // refill2
      tx = await shieldMining.mockFillShieldMining(policyBookSm.address, amount2, duration2, { from: USER1 });

      info = await shieldMining.getShieldMiningInfo(policyBookSm.address);

      await advanceBlocks(85);

      let fromBlock3 = await getCurrentBlock();
      let endBlock3 = toBN(fromBlock3).plus(
        duration3.div(PRECISION).times(BLOCKS_PER_DAY).integerValue(BigNumber.ROUND_DOWN)
      );

      //refill3
      tx = await shieldMining.mockFillShieldMining(policyBookSm.address, amount3, duration3, { from: USER1 });

      info = await shieldMining.getShieldMiningInfo(policyBookSm.address);
      assert.equal(info._lastBlockWithReward.toString(), endBlock3.toString());
      assert.equal(info._lastUpdateBlock.toString(), getTransactionBlock(tx).toString());
      assert.equal(
        info._rewardTokensLocked.toString(),
        toBN(amount1).plus(toBN(amount2)).plus(toBN(amount3)).toFixed().toString()
      );

      assert.equal(info._nearestLastBlocksWithReward.toString(), endBlock1.toString());
      assert.equal(info._rewardPerBlock.toString(), toWei("5"));

      assert.equal(info._rewardPerTokenStored.toString(), toWei("0.257"));

      assert.equal(
        toBN(await stbl.balanceOf(shieldMining.address)).toString(),
        toBN(amount1)
          .plus(toBN(amount2))
          .plus(toBN(amount3))
          .idiv(10 ** 12)
          .toFixed()
          .toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), 0);
      await advanceBlocks(1);

      tx = await shieldMining.getReward(policyBookSm.address, ADDRESS_ZERO, { from: USER1 });
      info = await shieldMining.getShieldMiningInfo(policyBookSm.address);

      assert.equal(info._lastBlockWithReward.toString(), endBlock3.toString());
      assert.equal(info._rewardPerBlock.toString(), toWei("5"));
      assert.equal(info._lastUpdateBlock.toString(), getTransactionBlock(tx).toString());
      assert.equal(info._nearestLastBlocksWithReward.toString(), endBlock1.toString());

      assert.equal(info._rewardPerTokenStored.toString(), toWei("0.267"));

      await advanceBlocks(65);

      tx = await shieldMining.getReward(policyBookSm.address, ADDRESS_ZERO, { from: USER1 });
      info = await shieldMining.getShieldMiningInfo(policyBookSm.address);
      assert.equal(
        info._rewardPerTokenStored.toString(),
        toBN(amount1).plus(amount2).plus(amount3).div(initialDeposit).times(DECIMALS18).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), 0);
      assert.equal(
        toBN(await stbl.balanceOf(shieldMining.address)).toString(),
        toBN(amount1)
          .plus(toBN(amount2))
          .plus(toBN(amount3))
          .idiv(10 ** 12)
          .toFixed()
          .toString()
      );
      tx = await shieldMining.getReward(policyBookSm.address, ADDRESS_ZERO, { from: OWNER });
      assert.equal(toBN(await stbl.balanceOf(shieldMining.address)).toString(), 0);
    });
  });

  describe("coverage pool participation in SM", async () => {
    const duration1 = PRECISION.times(0.02);

    const amount1 = toWei("256");
    const totalAmount = toWei("256");
    const stbleAmount = toWei("256", "mwei");

    const stblAmount1 = toBN(toWei("100000", "mwei"));
    const liquidityAmount1 = toBN(toWei("5000"));
    const amountToWithdraw = toBN(toWei("1000"));
    let policyBook1;
    let policyBookFacade1;

    beforeEach(async () => {
      await stbl.approve(shieldMining.address, stbleAmount, { from: USER1 });
      await stbl.transfer(USER1, stbleAmount);
      await stbl.transfer(USER2, stblAmount1);
      await stbl.approve(policyBookFabric.address, stblAmount1, { from: USER2 });

      const policyBookAddrees = (
        await policyBookFabric.create(
          CONTRACT3,
          ContractType.CONTRACT,
          "test description2",
          "TEST2",
          initialDeposit,
          stbl.address,
          { from: USER2 }
        )
      ).logs[0].args.at;

      policyBook1 = await PolicyBookMock.at(policyBookAddrees);

      const policyBookFacadeAddress = await policyBook1.policyBookFacade();
      policyBookFacade1 = await PolicyBookFacade.at(policyBookFacadeAddress);

      await stbl.transfer(USER3, stblAmount1);
      await stbl.approve(policyBook1.address, stblAmount1, { from: USER3 });
      await capitalPool.setliquidityCushionBalance(toBN(liquidityAmount1.idiv(10 ** 12)));
    });

    it("add liquidity", async () => {
      // refill1
      let tx = await shieldMining.mockFillShieldMining(policyBook1.address, amount1, duration1, { from: USER1 });
      await advanceBlocks(10);

      tx = await policyBookFacade1.addLiquidity(liquidityAmount1, { from: USER3 });

      await advanceBlocks(10);

      tx = await shieldMining.getReward(policyBook1.address, ADDRESS_ZERO, { from: USER2 });
      tx = await shieldMining.getReward(policyBook1.address, ADDRESS_ZERO, { from: USER3 });

      let info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      assert.equal(info._totalSupply.toString(), toBN(initialDeposit).plus(liquidityAmount1).toFixed().toString());
      // 22 block passed * 2 reward per bolck
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        toBN(stblAmount1)
          .minus(toBN(initialDeposit).idiv(10 ** 12))
          .plus(toBN(toWei("25.666666", "mwei")))
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER3)).toString(),
        toBN(stblAmount1)
          .minus(liquidityAmount1.idiv(10 ** 12))
          .plus(toBN(toWei("19.999999", "mwei")))
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(shieldMining.address)).toString(),
        toBN(amount1)
          .idiv(10 ** 12)
          .minus(toBN(toWei("45.666665", "mwei")))
          .toString()
      );
    });

    it("withdraw liquidity", async () => {
      // refill1
      let tx = await shieldMining.mockFillShieldMining(policyBook1.address, amount1, duration1, { from: USER1 });
      await advanceBlocks(10);

      await policyBookFacade1.addLiquidity(liquidityAmount1, { from: USER3 });

      await advanceBlocks(10);

      // withdraw liq
      await policyBook1.approve(policyBook1.address, amountToWithdraw, { from: USER3 });
      await policyBookFacade1.requestWithdrawal(amountToWithdraw, { from: USER3 });
      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      await policyBookFacade1.withdrawLiquidity({ from: USER3 });

      await advanceBlocks(1);

      tx = await shieldMining.getReward(policyBook1.address, ADDRESS_ZERO, { from: USER2 });
      await advanceBlocks(1);
      tx = await shieldMining.getReward(policyBook1.address, ADDRESS_ZERO, { from: USER3 });

      let info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      assert.equal(
        info._totalSupply.toString(),
        toBN(initialDeposit).plus(liquidityAmount1).minus(amountToWithdraw).toFixed().toString()
      );
      // 30 block passed * 2 reward per bolck
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        toBN(stblAmount1)
          .minus(toBN(initialDeposit).idiv(10 ** 12))
          .plus(toBN(toWei("27.8", "mwei")))
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER3)).toString(),
        toBN(stblAmount1)
          .minus(liquidityAmount1.idiv(10 ** 12))
          .plus(amountToWithdraw.idiv(10 ** 12))
          .plus(toBN(toWei("31.4", "mwei")))
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(shieldMining.address)).toString(),
        toBN(amount1)
          .idiv(10 ** 12)
          .minus(toBN(toWei("59.2", "mwei")))
          .toString()
      );
    });
  });

  describe("user leverage pool participation in SM", async () => {
    const duration1 = PRECISION.times(0.02);

    const amount1 = toWei("256");

    const stbleAmount = toWei("256", "mwei");

    const stblAmount1 = toBN(toWei("100000", "mwei"));
    const liquidityAmount1 = toBN(toWei("5000"));
    const coverTokensAmount = toBN(toWei("3000"));
    const amountToWithdraw = toBN(toWei("1000"));
    const poolUR = PRECISION.times(50);
    let policyBook1;
    let policyBookFacade1;

    beforeEach(async () => {
      await stbl.approve(shieldMining.address, stbleAmount, { from: USER1 });
      await stbl.transfer(USER1, stbleAmount);
      await stbl.transfer(USER2, stblAmount1);
      await stbl.approve(policyBookFabric.address, stblAmount1, { from: USER2 });

      const policyBookAddrees = (
        await policyBookFabric.create(
          CONTRACT3,
          ContractType.CONTRACT,
          "test description2",
          "TEST2",
          initialDeposit,
          stbl.address,
          { from: USER2 }
        )
      ).logs[0].args.at;

      policyBook1 = await PolicyBookMock.at(policyBookAddrees);

      const policyBookFacadeAddress = await policyBook1.policyBookFacade();
      policyBookFacade1 = await PolicyBookFacade.at(policyBookFacadeAddress);

      await stbl.transfer(USER3, stblAmount1);
      await stbl.approve(policyBook1.address, stblAmount1, { from: USER3 });

      await stbl.transfer(USER4, stblAmount1);
      await stbl.approve(userLeveragePool.address, stblAmount1, { from: USER4 });

      await policyBookAdmin.setPolicyBookFacadeMPLs(
        policyBookFacade1.address,
        PRECISION.times(80),
        PRECISION.times(30)
      );
      await policyBook1.setTotalCoverTokens(coverTokensAmount);
      await capitalPool.setliquidityCushionBalance(toBN(liquidityAmount1.idiv(10 ** 12)));
    });

    it("add liquidity", async () => {
      // refill1
      let tx = await shieldMining.mockFillShieldMining(policyBook1.address, amount1, duration1, { from: USER1 });
      await advanceBlocks(10);

      await policyBookFacade1.addLiquidity(liquidityAmount1, { from: USER3 });

      await advanceBlocks(10);

      await userLeveragePool.addLiquidity(liquidityAmount1, { from: USER4 });

      await advanceBlocks(10);

      tx = await shieldMining.getReward(policyBook1.address, ADDRESS_ZERO, { from: USER2 });
      tx = await shieldMining.getReward(policyBook1.address, ADDRESS_ZERO, { from: USER3 });
      tx = await shieldMining.getReward(policyBook1.address, userLeveragePool.address, { from: USER4 });

      info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      const multiplier = await leveragePortfolioView.calcM(poolUR, userLeveragePool.address);

      const leveragedAmount = await policyBookFacade1.LUuserLeveragePool(userLeveragePool.address);

      const participatedLeveragedAmount = toBN(leveragedAmount).times(multiplier).idiv(PERCENTAGE_100).toFixed();

      assert.equal(
        info._totalSupply.toString(),
        toBN(initialDeposit).plus(liquidityAmount1).plus(participatedLeveragedAmount).toFixed().toString()
      );
      // 35 block passed * 2 reward per bolck
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        toBN(stblAmount1)
          .minus(toBN(initialDeposit).idiv(10 ** 12))
          .plus(toBN(toWei("26.651006", "mwei")))
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER3)).toString(),
        toBN(stblAmount1)
          .minus(liquidityAmount1.idiv(10 ** 12))
          .plus(toBN(toWei("23.702460", "mwei")))
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(USER4)).toString(),
        toBN(stblAmount1)
          .minus(liquidityAmount1.idiv(10 ** 12))
          .plus(toBN(toWei("19.020134", "mwei")))
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(shieldMining.address)).toString(),
        toBN(amount1)
          .idiv(10 ** 12)
          .minus(toBN(toWei("69.3736", "mwei")))
          .toString()
      );
    });

    it("withdraw liquidity", async () => {
      await reinsurancePool.setVtotalLiquidity(liquidityAmount1);
      // refill1
      let tx = await shieldMining.mockFillShieldMining(policyBook1.address, amount1, duration1, { from: USER1 });
      let info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      await advanceBlocks(10);

      tx = await policyBookFacade1.addLiquidity(liquidityAmount1, { from: USER3 });
      info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      await advanceBlocks(10);

      tx = await userLeveragePool.addLiquidity(liquidityAmount1, { from: USER4 });
      info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      await advanceBlocks(10);

      // withdraw liq
      await userLeveragePool.approve(userLeveragePool.address, amountToWithdraw, { from: USER4 });
      await userLeveragePool.requestWithdrawal(amountToWithdraw, { from: USER4 });
      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.plus(10))
          .toString()
      );
      await time.advanceBlock();

      tx = await userLeveragePool.withdrawLiquidity({ from: USER4 });
      info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      const list = await userLeveragePool.listleveragedCoveragePools(0, 10);

      await advanceBlocks(1);

      tx = await shieldMining.getReward(policyBook1.address, ADDRESS_ZERO, { from: USER2 });
      info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      tx = await shieldMining.getReward(policyBook1.address, ADDRESS_ZERO, { from: USER3 });
      info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      tx = await shieldMining.getReward(policyBook1.address, userLeveragePool.address, { from: USER4 });
      info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      info = await shieldMining.getShieldMiningInfo(policyBook1.address);

      const multiplier = await leveragePortfolioView.calcM(poolUR, userLeveragePool.address);

      const leveragedAmount = await policyBookFacade1.LUuserLeveragePool(userLeveragePool.address);

      const participatedLeveragedAmount = toBN(leveragedAmount).times(multiplier).idiv(PERCENTAGE_100).toFixed();

      assert.equal(
        info._totalSupply.toString(),
        toBN(initialDeposit).plus(liquidityAmount1).plus(participatedLeveragedAmount).toFixed().toString()
      );
      // 41 block passed * 2 reward per bolck
      assert.equal(
        toBN(await stbl.balanceOf(USER2)).toString(),
        toBN(stblAmount1)
          .minus(toBN(initialDeposit).idiv(10 ** 12))
          .plus(toBN(toWei("27.576978", "mwei")))
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(USER3)).toString(),
        toBN(stblAmount1)
          .minus(liquidityAmount1.idiv(10 ** 12))
          .plus(toBN(toWei("28.468597", "mwei"))) //28.468597
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(USER4)).toString(),
        toBN(stblAmount1)
          .minus(liquidityAmount1.idiv(10 ** 12))
          .plus(amountToWithdraw.idiv(10 ** 12))
          .plus(toBN(toWei("25.137236", "mwei")))
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(shieldMining.address)).toString(),
        toBN(amount1)
          .idiv(10 ** 12)
          .minus(toBN(toWei("81.182811", "mwei")))
          .toString()
      );
    });
  });

  describe("list of deposit", () => {
    let shieldDeposit = toWei("1200");
    let createBlock;
    let numberOfBlock = 45 * 6450;

    beforeEach(async () => {
      await stbl.approve(shieldMining.address, toBN(shieldDeposit).times(4));
      createBlock = await getCurrentBlock();
      await shieldMining.fillShieldMining(policyBookSm.address, shieldDeposit, 45);
      await shieldMining.fillShieldMining(policyBookSm.address, shieldDeposit, 45);
      await shieldMining.fillShieldMining(policyBookSm.address, shieldDeposit, 45);
    });

    it("should display three deposit", async () => {
      const result = await shieldMining.getDepositList(OWNER, 0, 10);
      result.forEach(async (deposit, index) => {
        assert.equal(deposit.policyBook, policyBookSm.address, "pb address");
        assert.equal(deposit.amount.toString(), shieldDeposit.toString(), "sm deposit");
        assert.equal(deposit.duration, 45, "duration");
        assert.equal(deposit.startBlock, createBlock + 1 + index, "start");
        assert.equal(deposit.endBlock, createBlock + index + numberOfBlock, "end");
      });
    });
  });
});
