const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const ClaimVoting = artifacts.require("ClaimVotingMock");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const CapitalPool = artifacts.require("CapitalPoolMock");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const ShieldMining = artifacts.require("ShieldMining");
const PolicyQuote = artifacts.require("PolicyQuote");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const PriceFeed = artifacts.require("PriceFeed");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WrappedTokenMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const ReputationSystem = artifacts.require("ReputationSystemMock");
const STKBMITokenMock = artifacts.require("STKBMITokenMock");
const StkBMIStaking = artifacts.require("StkBMIStaking");

const PolicyBook = artifacts.require("PolicyBookMock");
const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");
const { signClaimVoting } = require("./helpers/signatures");
const ethSigUtil = require("eth-sig-util");
const ethUtil = require("ethereumjs-util");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

const aesjs = require("aes-js");

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

const VoteStatus = {
  VOTED_PENDING_CALCULATION: 0,
  MINORITY: 1,
  MAJORITY: 2,
  RECEIVED: 3,
};

function toBN(number) {
  return new BigNumber(number);
}

async function getBlockTimestamp() {
  const latest = toBN(await web3.eth.getBlockNumber());
  return (await web3.eth.getBlock(latest)).timestamp;
}

const wei = web3.utils.toWei;

contract("StkBMIStaking", async (accounts) => {
  const reverter = new Reverter(web3);
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const PRECISION = toBN(10).pow(25);
  const PROTOCOL_PERCENTAGE = 20 * PRECISION;
  const PERCENTAGE_100 = toBN(10).pow(27);

  const initialDeposit = wei("1000");
  let stblInitialDeposit;
  let stblAmount;
  const coverTokensAmount = toBN(wei("10000"));
  const liquidityAmount = toBN(wei("25000"));

  let contractsRegistry;
  let stbl;
  let bmi;

  let reinsurancePool;

  let policyBookRegistry;
  let policyRegistry;
  let policyBookFabric;
  let policyBookAdmin;

  let policyBook1, policyBookFacade1;
  let policyBook2, policyBookFacade2;

  let claimVoting;
  let claimingRegistry;
  let stkBMI;
  let stkBMIStaking;
  let bmiMock;

  let capitalPool;
  let reputationSystem;

  let timestamp;
  let network;

  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const USER3 = accounts[3];
  const USER4 = accounts[4];
  const USER5 = accounts[5];
  const USER6 = accounts[6];
  const insuranceContract1 = accounts[7];
  const insuranceContract2 = accounts[8];
  const NOTHING = accounts[9];

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
    bmi = await BMIMock.new(USER1);
    const weth = await WETHMock.new("weth", "weth");
    const sushiswapRouterMock = await SushiswapRouterMock.new();

    const _policyBookImpl = await PolicyBookMock.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();

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
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _shieldMining = await ShieldMining.new();
    const _policyQuote = await PolicyQuote.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _priceFeed = await PriceFeed.new();
    const _reputationSystem = await ReputationSystem.new();
    const _stkBMI = await STKBMITokenMock.new();
    const _stkBMIStaking = await StkBMIStaking.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), sushiswapRouterMock.address);

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
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REPUTATION_SYSTEM_NAME(),
      _reputationSystem.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), _stkBMI.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_STAKING_NAME(), _stkBMIStaking.address);

    policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    reputationSystem = await ReputationSystem.at(await contractsRegistry.getReputationSystemContract());
    stkBMI = await STKBMITokenMock.at(await contractsRegistry.getSTKBMIContract());
    stkBMIStaking = await StkBMIStaking.at(await contractsRegistry.getStkBMIStakingContract());

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await claimVoting.__ClaimVoting_init();
    await rewardsGenerator.__RewardsGenerator_init(network);
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();
    await reputationSystem.__ReputationSystem_init([]);
    await stkBMI.__STKBMIToken_init();
    await stkBMIStaking.__StkBMIStaking_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REPUTATION_SYSTEM_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_STAKING_NAME());
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

    await reverter.snapshot();
  });

  beforeEach("setup", async () => {
    stblInitialDeposit = getStableAmount("1000");
    stblAmount = getStableAmount("100000");
    setCurrentTime(1);
    await stbl.approve(policyBookFabric.address, 0);
    await stbl.approve(policyBookFabric.address, stblInitialDeposit.times(2));

    await stbl.transfer(reinsurancePool.address, stblAmount);
  });
  afterEach("revert", reverter.revert);

  async function mintStkBMI(user, amount) {
    await stkBMI.mintArbitrary(user, amount); // 1 mil
  }

  describe("StkBMIStaking lock and unlock", async () => {
    it("should lockStkBMI and unlock", async () => {
      const StkBMIAmount = wei("1000");

      await mintStkBMI(USER2, StkBMIAmount);
      await stkBMI.approve(stkBMIStaking.address, StkBMIAmount, { from: USER2 });
      await stkBMIStaking.lockStkBMI(StkBMIAmount, { from: USER2 });

      assert.equal(await stkBMIStaking.stakedStkBMI(USER2, { from: USER2 }), StkBMIAmount);
      assert.equal(await stkBMI.balanceOf(USER2), 0);

      await stkBMIStaking.unlockStkBMI(StkBMIAmount, { from: USER2 });

      assert.equal(await stkBMIStaking.stakedStkBMI(USER2, { from: USER2 }), 0);
      assert.equal(await stkBMI.balanceOf(USER2), StkBMIAmount);
    });
  });

  describe("check fail cases", async () => {
    it("should revert 0 stkBmi transaction", async () => {
      await truffleAssert.reverts(stkBMIStaking.lockStkBMI(0, { from: USER2 }), "StkBMIStaking: can't lock 0 tokens");
    });
  });

  describe("check slash tokens", async () => {
    it("should fail slash", async () => {
      const StkBMIAmount = wei("1000");

      await mintStkBMI(USER2, StkBMIAmount);
      await stkBMI.approve(stkBMIStaking.address, StkBMIAmount, { from: USER2 });
      await stkBMIStaking.lockStkBMI(StkBMIAmount, { from: USER2 });

      await truffleAssert.reverts(
        stkBMIStaking.slashUserTokens(USER2, StkBMIAmount),
        "StkBMIStaking: Not a ClaimVoting contract"
      );
    });

    it("should revert if user unlocks and has no tokens", async () => {
      const StkBMIAmount = wei("1000");
      await mintStkBMI(stkBMIStaking.address, StkBMIAmount);

      await truffleAssert.reverts(
        stkBMIStaking.unlockStkBMI(StkBMIAmount, { from: USER3 }),
        "StkBMIStaking: No staked amount"
      );
    });
  });
});
