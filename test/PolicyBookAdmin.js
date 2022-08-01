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
const ClaimVoting = artifacts.require("ClaimVoting");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const CapitalPool = artifacts.require("CapitalPool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const ShieldMining = artifacts.require("ShieldMining");
const PolicyQuote = artifacts.require("PolicyQuote");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const PriceFeed = artifacts.require("PriceFeed");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WrappedTokenMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const YieldGenerator = artifacts.require("YieldGenerator");

const PolicyBook = artifacts.require("PolicyBookMock");
const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

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

const wei = web3.utils.toWei;

contract("PolicyBookAdmin", async (accounts) => {
  const reverter = new Reverter(web3);
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const PRECISION = 10 ** 25;
  const PROTOCOL_PERCENTAGE = 20 * PRECISION;

  const DEFAULT_REBALANCING_THRESHOLD = 10 ** 23;
  const NEW_REBALANCING_THRESHOLD = 3 * PRECISION;

  const DECIMALS18 = 10 ** 18;
  const DEFAULT_MAX_CAPACITY = 3500000 * DECIMALS18;
  const NEW_MAX_CAPACITY = 3600000 * DECIMALS18;

  const DEFAULT_TARGET_UR = toBN(PRECISION).times(45);
  const NEW_TARGET_UR = toBN(PRECISION).times(40);

  const DEFAULT_D_CONSTANT = toBN(PRECISION).times(5);
  const NEW_D_CONSTANT = toBN(PRECISION).times(3);

  const DEFAULT_A_CONSTANT = toBN(PRECISION).times(100);
  const NEW_A_CONSTANT = toBN(PRECISION).times(90);

  const DEFAULT_MAX_CONSTANT = toBN(PRECISION).times(100);
  const NEW_MAX_CONSTANT = toBN(PRECISION).times(90);

  const USER_LEVERAGE_MPL = 2;
  const REINSURANCE_POOL_MPL = 2;

  let initialDeposit, stblInitialDeposit, amount, stblAmount;

  let contractsRegistry;
  let stbl;
  let bmi;

  let policyBookRegistry;
  let policyBookFabric;
  let policyBookAdmin;

  let claimVoting;
  let claimingRegistry;

  let _policyBookImpl;
  let _policyBookFacadeImpl;
  let _userLeveragePoolImpl;

  let policyBooks = [];
  let policyBookAddresses = [];
  let policyBookFacades = [];
  let policyBookFacadeAddresses = [];

  let network;

  const USER1 = accounts[4];
  const USER2 = accounts[5];
  const NOTHING = accounts[9];
  const insuranceContracts = [accounts[0], accounts[1], accounts[2], accounts[3], accounts[6]];
  const DISTRIBUTORS = [accounts[0], accounts[1], accounts[2], accounts[3]];

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

    _policyBookImpl = await PolicyBookMock.new();
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
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _shieldMining = await ShieldMining.new();
    const _policyQuote = await PolicyQuote.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _priceFeed = await PriceFeed.new();
    const _yieldGenerator = await YieldGenerator.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REPUTATION_SYSTEM_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.STKBMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

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
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
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
    await claimVoting.__ClaimVoting_init();
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
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
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
      toBN(PRECISION).times(80),
      toBN(PRECISION).times(80),
      toBN(PRECISION).times(2),
      toBN(PRECISION).times(2),
      wei("10"),
      toBN(PRECISION).times(10),
      toBN(PRECISION).times(50),
      toBN(PRECISION).times(25),
      toBN(PRECISION).times(100)
    );

    await reverter.snapshot();
  });

  beforeEach("creation of PB & UL", async () => {
    initialDeposit = wei("1000");
    stblInitialDeposit = getStableAmount("1000");
    stblAmount = getStableAmount("100000");
    amount = toBN(wei("1000"));

    policyBooks = [];
    policyBookAddresses = [];
    policyBookFacades = [];
    policyBookFacadeAddresses = [];
    await stbl.approve(policyBookFabric.address, 0);
    await stbl.approve(policyBookFabric.address, stblInitialDeposit.times(4));

    for (i = 0; i < 4; i++) {
      const tx = await policyBookFabric.create(
        insuranceContracts[i],
        ContractType.CONTRACT,
        `test${i} description`,
        `TEST${i}`,
        initialDeposit,
        zeroAddress
      );
      const policyBookAddress = tx.logs[0].args.at;
      const policyBook = await PolicyBook.at(policyBookAddress);
      policyBooks.push(policyBook);
      policyBookAddresses.push(policyBook.address);
      const policyBookFacadeAddress = await policyBook.policyBookFacade();
      const policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddress);
      policyBookFacades.push(policyBookFacade);
      policyBookFacadeAddresses.push(policyBookFacade.address);
    }
    const tx = await policyBookFabric.createLeveragePools(
      insuranceContracts[4],
      ContractType.VARIOUS,
      "User Leverage Pool",
      "USDT"
    );
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);
  });
  afterEach("revert", reverter.revert);

  describe("upgradePolicyBooks / getCurrentPolicyBooksImplementation", async () => {
    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBookAddresses[0], stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBookAddresses[0], stblAmount, { from: USER2 });

      await policyBookFacades[0].addLiquidity(amount, { from: USER1 });
      await policyBookFacades[0].addLiquidity(amount, { from: USER2 });

      assert.equal((await policyBooks[0].totalLiquidity()).toString(), amount.times(3).toString(10));
      assert.equal((await policyBooks[0].balanceOf(USER1)).toString(), amount.toString(10));
      assert.equal((await policyBooks[0].balanceOf(USER2)).toString(), amount.toString(10));

      const cap = await policyBookAdmin.MAX_DISTRIBUTOR_FEE();
      assert.equal(cap.toString(), toBN(20).times(PRECISION).toFixed().toString());

      assert.equal(await policyBookAdmin.getCurrentPolicyBooksImplementation(), _policyBookImpl.address);
    });

    it("reverts if address zero", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.upgradePolicyBooks(zeroAddress, 0, await policyBookRegistry.count()),
        "PolicyBookAdmin: Zero address"
      );
    });

    it("reverts if invalid contract address", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.upgradePolicyBooks(NOTHING, 0, await policyBookRegistry.count()),
        "PolicyBookAdmin: Invalid address"
      );
    });

    it("upgradePolicyBooks / getImplementationOfPolicyBook", async () => {
      const _policyBookImpl2 = await PolicyBookMock.new();

      await policyBookAdmin.upgradePolicyBooks(_policyBookImpl2.address, 0, await policyBookRegistry.count());

      const policyBookAddress = await policyBookRegistry.policyBookFor(insuranceContracts[0]);
      const policyBook = await PolicyBook.at(policyBookAddress);
      assert.equal(policyBooks[0].address, policyBook.address);

      await truffleAssert.reverts(
        policyBookAdmin.getImplementationOfPolicyBook.call(USER1),
        "PolicyBookAdmin: Not a PolicyBook"
      );
      assert.equal(
        await policyBookAdmin.getImplementationOfPolicyBook.call(policyBooks[0].address),
        _policyBookImpl2.address
      );
      assert.equal(await policyBookAdmin.getCurrentPolicyBooksImplementation(), _policyBookImpl2.address);
    });

    it("upgradePolicyBooksAndCall", async () => {
      const _policyBookImpl2 = await PolicyBookMock.new();

      const numberStats = await policyBookAdmin.upgradePolicyBooksAndCall(
        _policyBookImpl2.address,
        0,
        await policyBookRegistry.count(),
        "numberStats()"
      );

      const policyBook = await PolicyBook.at(policyBooks[0].address);
      assert.equal(await policyBookAdmin.getCurrentPolicyBooksImplementation(), _policyBookImpl2.address);

      //assert.equal(await policyBook.numberStats()[0], numberStats[0]);
    });
  });

  describe("upgradePolicyBookFacades / getCurrentPolicyBooksFacadeImplementation", async () => {
    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBookAddresses[0], stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBookAddresses[0], stblAmount, { from: USER2 });

      await policyBookFacades[0].addLiquidity(amount, { from: USER1 });
      await policyBookFacades[0].addLiquidity(amount, { from: USER2 });

      assert.equal((await policyBooks[0].totalLiquidity()).toString(), amount.times(3).toString(10));
      assert.equal((await policyBooks[0].balanceOf(USER1)).toString(), amount.toString(10));
      assert.equal((await policyBooks[0].balanceOf(USER2)).toString(), amount.toString(10));

      const cap = await policyBookAdmin.MAX_DISTRIBUTOR_FEE();
      assert.equal(cap.toString(), toBN(20).times(PRECISION).toFixed().toString());

      assert.equal(await policyBookAdmin.getCurrentPolicyBooksFacadeImplementation(), _policyBookFacadeImpl.address);
    });

    it("reverts if address zero", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.upgradePolicyBookFacades(zeroAddress, 0, await policyBookRegistry.count()),
        "PolicyBookAdmin: Zero address"
      );
    });

    it("reverts if invalid contract address", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.upgradePolicyBookFacades(NOTHING, 0, await policyBookRegistry.count()),
        "PolicyBookAdmin: Invalid address"
      );
    });

    it("upgradePolicyBookFacades / getImplementationOfPolicyBookFacade", async () => {
      const _policyBookFacadeImpl2 = await PolicyBookFacade.new();

      await policyBookAdmin.upgradePolicyBookFacades(
        _policyBookFacadeImpl2.address,
        0,
        await policyBookRegistry.count()
      );

      const policyBookAddress = await policyBookRegistry.policyBookFor(insuranceContracts[0]);
      const policyBook = await PolicyBook.at(policyBookAddress);
      const policyBookFacadeAddress = await policyBook.policyBookFacade();
      const policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddress);
      assert.equal(policyBookFacades[0].address, policyBookFacade.address);

      await truffleAssert.reverts(
        policyBookAdmin.getImplementationOfPolicyBookFacade.call(USER1),
        "PolicyBookAdmin: Not a PolicyBookFacade"
      );
      assert.equal(
        await policyBookAdmin.getImplementationOfPolicyBookFacade.call(policyBookFacades[0].address),
        _policyBookFacadeImpl2.address
      );
      assert.equal(await policyBookAdmin.getCurrentPolicyBooksFacadeImplementation(), _policyBookFacadeImpl2.address);
    });

    it("upgradePolicyBookFacadesAndCall", async () => {
      const _policyBookFacadeImpl2 = await PolicyBookFacade.new();

      const userLeveragePools = await policyBookAdmin.upgradePolicyBookFacadesAndCall(
        _policyBookFacadeImpl2.address,
        0,
        await policyBookRegistry.count(),
        "countUserLeveragePools()"
      );

      const policyBookFacade = await PolicyBookFacade.at(policyBookFacades[0].address);
      assert.equal(await policyBookAdmin.getCurrentPolicyBooksFacadeImplementation(), _policyBookFacadeImpl2.address);

      //assert.equal(await policyBookFacade.countUserLeveragePools()[0], userLeveragePools[0]);
    });
  });

  describe("upgradeUserLeveragePools / getCurrentUserLeveragePoolImplementation", async () => {
    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(userLeveragePool.address, stblAmount, { from: USER2 });

      await userLeveragePool.addLiquidity(amount, { from: USER1 });
      await userLeveragePool.addLiquidity(amount, { from: USER2 });

      assert.equal((await userLeveragePool.totalLiquidity()).toString(), amount.times(2).toString(10));
      assert.equal((await userLeveragePool.balanceOf(USER1)).toString(), amount.toString(10));
      assert.equal((await userLeveragePool.balanceOf(USER2)).toString(), amount.toString(10));

      const cap = await policyBookAdmin.MAX_DISTRIBUTOR_FEE();
      assert.equal(cap.toString(), toBN(20).times(PRECISION).toFixed().toString());

      assert.equal(await policyBookAdmin.getCurrentUserLeverageImplementation(), _userLeveragePoolImpl.address);
    });

    it("reverts if address zero", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.upgradeUserLeveragePools(zeroAddress, 0, await policyBookRegistry.count()),
        "PolicyBookAdmin: Zero address"
      );
    });

    it("reverts if invalid contract address", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.upgradeUserLeveragePools(NOTHING, 0, await policyBookRegistry.count()),
        "PolicyBookAdmin: Invalid address"
      );
    });

    it("upgradeUserLeveragePools", async () => {
      const _userLeveragePoolImpl2 = await UserLeveragePool.new();

      await policyBookAdmin.upgradeUserLeveragePools(
        _userLeveragePoolImpl2.address,
        0,
        await policyBookRegistry.count()
      );

      const userLeveragePool2 = await UserLeveragePool.at(userLeveragePool.address);
      assert.equal(userLeveragePool.address, userLeveragePool2.address);

      assert.equal(await policyBookAdmin.getCurrentUserLeverageImplementation(), _userLeveragePoolImpl2.address);
    });

    it("upgradeUserLeveragePoolsAndCall", async () => {
      const _userLeveragePoolImpl2 = await UserLeveragePool.new();

      const infoAdmin = await policyBookAdmin.upgradeUserLeveragePoolsAndCall(
        _userLeveragePoolImpl2.address,
        0,
        await policyBookRegistry.count(),
        "info()"
      );

      const userLeveragePool2 = await UserLeveragePool.at(userLeveragePool.address);
      assert.equal(await policyBookAdmin.getCurrentUserLeverageImplementation(), _userLeveragePoolImpl2.address);

      //assert.equal(await userLeveragePool2.info()[0], infoAdmin[0]);
    });
  });

  describe("whitelist", async () => {
    it("reverts if not owner", async () => {
      await truffleAssert.reverts(policyBookAdmin.whitelist(policyBooks[0], true, { from: USER1 }));
    });
    it("reverts if not policy book", async () => {
      await truffleAssert.reverts(policyBookAdmin.whitelist(USER1, true), "PolicyBookAdmin: Not a PB");
    });

    it("whitelist", async () => {
      assert.equal(await policyBooks[0].whitelisted(), false);
      await policyBookAdmin.whitelist(policyBooks[0].address, true);
      assert.equal(await policyBooks[0].whitelisted(), true);

      let res = await policyBookRegistry.listWhitelisted(0, await policyBookRegistry.countWhitelisted());
      assert.equal(res.length, 2);
      assert.equal(res[0], userLeveragePool.address);
      assert.equal(res[1], policyBooks[0].address);

      res = await policyBookRegistry.listByTypeWhitelisted(
        ContractType.CONTRACT,
        0,
        await policyBookRegistry.countByTypeWhitelisted(ContractType.CONTRACT)
      );
      assert.equal(res.length, 1);
      assert.equal(res[0], policyBooks[0].address);
    });

    it("whitelist and then blacklist", async () => {
      assert.equal(await policyBooks[0].whitelisted(), false);
      await policyBookAdmin.whitelist(policyBooks[0].address, true);
      await policyBookAdmin.whitelist(policyBooks[0].address, false);
      assert.equal(await policyBooks[0].whitelisted(), false);

      let res = await policyBookRegistry.listWhitelisted(0, await policyBookRegistry.countWhitelisted());
      assert.equal(res.length, 1);

      res = await policyBookRegistry.listByTypeWhitelisted(
        ContractType.CONTRACT,
        0,
        await policyBookRegistry.countByTypeWhitelisted(ContractType.CONTRACT)
      );
      assert.equal(res.length, 0);
    });

    it("emits a PolicyBookWhitelisted event", async () => {
      assert.equal(await policyBooks[0].whitelisted(), false);
      const result = await policyBookAdmin.whitelist(policyBooks[0].address, true);
      assert.equal(await policyBooks[0].whitelisted(), true);

      assert.equal(result.logs[0].event, "PolicyBookWhitelisted");
      assert.equal(result.logs[0].args[0], policyBooks[0].address);
      assert.equal(result.logs[0].args[1], true);
    });
  });
  describe("whitelistDistributor", async () => {
    it("reverts if not owner", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], toBN(5).times(PRECISION), { from: USER1 })
      );
    });
    it("reverts if zero address", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.whitelistDistributor(zeroAddress, toBN(5).times(PRECISION)),
        "PBAdmin: Null is forbidden"
      );
    });
    it("reverts if fee = 0", async () => {
      await truffleAssert.reverts(policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], 0), "PBAdmin: Fee cannot be 0");
    });
    it("reverts if fee > max fee", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], toBN(50).times(PRECISION)),
        "PBAdmin: Fee is over max cap"
      );
    });
    it("whitelist distributor", async () => {
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[0]), false);
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[1]), false);

      await policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], 5);

      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[0]), true);
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[1]), false);
    });
    it("changes the distributor's fee", async () => {
      await policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], toBN(5).times(PRECISION)); // 5%
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[0]), true);

      await policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], toBN(1).times(PRECISION)); // 1%
      assert.equal(
        toBN(await policyBookAdmin.distributorFees(DISTRIBUTORS[0])).toString(),
        toBN(1).times(PRECISION).toString()
      );
    });
    it("emits a DistributorWhitelisted event", async () => {
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[0]), false);

      const result = await policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], 5);

      assert.equal(result.logs[0].event, "DistributorWhitelisted");
      assert.equal(result.logs[0].args[0], DISTRIBUTORS[0]);
      assert.equal(result.logs[0].args[1].toNumber(), 5);
    });
  });
  describe("blacklistDistributor", async () => {
    it("reverts if not owner", async () => {
      await policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], 5);
      await truffleAssert.reverts(policyBookAdmin.blacklistDistributor(DISTRIBUTORS[0], { from: USER1 }));
    });
    it("blacklist distributor", async () => {
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[0]), false);
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[1]), false);

      await policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], 5);
      await policyBookAdmin.whitelistDistributor(DISTRIBUTORS[1], 5);

      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[0]), true);
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[1]), true);

      await policyBookAdmin.blacklistDistributor(DISTRIBUTORS[0]);

      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[0]), false);
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[1]), true);

      assert.equal(await policyBookAdmin.isWhitelistedDistributor(zeroAddress), false);
      await policyBookAdmin.blacklistDistributor(zeroAddress);
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(zeroAddress), false);
    });
    it("emits a DistributorWhitelisted event", async () => {
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[0]), false);

      await policyBookAdmin.whitelistDistributor(DISTRIBUTORS[0], 5);
      const result = await policyBookAdmin.blacklistDistributor(DISTRIBUTORS[0]);

      assert.equal(result.logs[0].event, "DistributorBlacklisted");
      assert.equal(result.logs[0].args[0], DISTRIBUTORS[0]);
    });
  });
  describe("isWhitelistedDistributor / listDistributors / countDistributors", async () => {
    it("collects distributors", async () => {
      for (i = 0; i < 4; i++) {
        await policyBookAdmin.whitelistDistributor(DISTRIBUTORS[i], toBN(i + 1).times(PRECISION));
      }

      let countDistributors = await policyBookAdmin.countDistributors();
      assert.equal(countDistributors, 4);
      let listDistributors = await policyBookAdmin.listDistributors(0, countDistributors);

      assert.equal(listDistributors._distributors.length, 4);
      for (i = 0; i < 4; i++) {
        assert.equal(listDistributors._distributors[i], DISTRIBUTORS[i]);
        assert.equal(
          listDistributors._distributorsFees[i].toString(),
          toBN(i + 1)
            .times(PRECISION)
            .toFixed()
            .toString()
        );
      }

      await policyBookAdmin.blacklistDistributor(DISTRIBUTORS[0]);

      countDistributors = await policyBookAdmin.countDistributors();
      assert.equal(countDistributors, 3);
      listDistributors = await policyBookAdmin.listDistributors(0, countDistributors);

      assert.equal(listDistributors._distributors.length, 3);
      assert.equal(listDistributors._distributors[0], DISTRIBUTORS[3]);
      assert.equal(listDistributors._distributorsFees[0].toString(), toBN(4).times(PRECISION).toFixed().toString());
      assert.equal(listDistributors._distributors[1], DISTRIBUTORS[1]);
      assert.equal(listDistributors._distributorsFees[1].toString(), toBN(2).times(PRECISION).toFixed().toString());
      assert.equal(listDistributors._distributors[2], DISTRIBUTORS[2]);
      assert.equal(listDistributors._distributorsFees[2].toString(), toBN(3).times(PRECISION).toFixed().toString());

      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[0]), false);
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[1]), true);
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[2]), true);
      assert.equal(await policyBookAdmin.isWhitelistedDistributor(DISTRIBUTORS[3]), true);
    });
  });
  describe("whitelistBatch", async () => {
    it("reverts if not owner", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.whitelistBatch(policyBookAddresses, [true, true, true, true], { from: USER1 })
      );
    });
    it("reverts if lenght not match", async () => {
      await truffleAssert.reverts(
        policyBookAdmin.whitelistBatch(policyBookAddresses, [true, true, true]),
        "PolicyBookAdmin: Length mismatch"
      );
    });
    it("whitelist batch", async () => {
      assert.equal(await policyBooks[0].whitelisted(), false);
      assert.equal(await policyBooks[1].whitelisted(), false);
      assert.equal(await policyBooks[2].whitelisted(), false);
      assert.equal(await policyBooks[3].whitelisted(), false);

      await policyBookAdmin.whitelistBatch(policyBookAddresses, [true, true, true, true]);

      assert.equal(await policyBooks[0].whitelisted(), true);
      assert.equal(await policyBooks[1].whitelisted(), true);
      assert.equal(await policyBooks[2].whitelisted(), true);
      assert.equal(await policyBooks[3].whitelisted(), true);
    });
    it("whitelist batch and then blacklist batch", async () => {
      assert.equal(await policyBooks[0].whitelisted(), false);
      assert.equal(await policyBooks[1].whitelisted(), false);
      assert.equal(await policyBooks[2].whitelisted(), false);
      assert.equal(await policyBooks[3].whitelisted(), false);

      await policyBookAdmin.whitelistBatch(policyBookAddresses, [true, true, true, true]);
      await policyBookAdmin.whitelistBatch(policyBookAddresses, [true, false, false, true]);

      assert.equal(await policyBooks[0].whitelisted(), true);
      assert.equal(await policyBooks[1].whitelisted(), false);
      assert.equal(await policyBooks[2].whitelisted(), false);
      assert.equal(await policyBooks[3].whitelisted(), true);
    });
  });
  describe("updateImageUriOfClaim", async () => {
    const URI1 = "uri-1";
    const URI2 = "uri-2";
    let claimIndex;

    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBookAddresses[0], stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBookAddresses[0], stblAmount, { from: USER2 });

      await policyBookFacades[0].addLiquidity(amount, { from: USER1 });
      await policyBookFacades[0].addLiquidity(amount, { from: USER2 });

      assert.equal((await policyBooks[0].totalLiquidity()).toString(), amount.times(3).toString(10));
      assert.equal((await policyBooks[0].balanceOf(USER1)).toString(), amount.toString(10));
      assert.equal((await policyBooks[0].balanceOf(USER2)).toString(), amount.toString(10));

      await policyBookFacades[0].buyPolicy(5, amount, { from: USER1 });
      const toApproveOnePercent = await policyBookFacades[0].getClaimApprovalAmount(USER1);
      await bmi.approve(claimVoting.address, toApproveOnePercent, { from: USER1 });
      await policyBooks[0].submitClaimAndInitializeVoting(URI1, { from: USER1 });
      claimIndex = await claimingRegistry.claimIndex(USER1, policyBooks[0].address);
    });

    it("reverts if not owner", async () => {
      await truffleAssert.reverts(policyBookAdmin.updateImageUriOfClaim(claimIndex, URI2, { from: USER2 }));
    });
    it("updates image URI of claim", async () => {
      assert.equal((await claimingRegistry.claimInfo(claimIndex)).evidenceURI, URI1);

      await policyBookAdmin.updateImageUriOfClaim(claimIndex, URI2);

      assert.equal((await claimingRegistry.claimInfo(claimIndex)).evidenceURI, URI2);
    });
    it("emits a UpdatedImageURI event", async () => {
      const result = await policyBookAdmin.updateImageUriOfClaim(claimIndex, URI2);

      assert.equal(result.logs[0].event, "UpdatedImageURI");
      assert.equal(result.logs[0].args[0].toString(), claimIndex.toString());
      assert.equal(result.logs[0].args[1], URI1);
      assert.equal(result.logs[0].args[2], URI2);
    });
  });
  describe("setPolicyBookFacadeMPLs", async () => {
    it("sets MPLs", async () => {
      assert.equal(await policyBookFacades[0].userleveragedMPL(), 0);
      assert.equal(await policyBookFacades[0].reinsurancePoolMPL(), 0);

      await policyBookAdmin.setPolicyBookFacadeMPLs(
        policyBookFacades[0].address,
        USER_LEVERAGE_MPL,
        REINSURANCE_POOL_MPL
      );

      assert.equal(await policyBookFacades[0].userleveragedMPL(), USER_LEVERAGE_MPL);
      assert.equal(await policyBookFacades[0].reinsurancePoolMPL(), REINSURANCE_POOL_MPL);
    });
  });
  describe("setPolicyBookFacadeRebalancingThreshold", async () => {
    it("sets rebalancing threshold", async () => {
      assert.equal(
        (await policyBookFacades[0].rebalancingThreshold()).toString(),
        toBN(DEFAULT_REBALANCING_THRESHOLD).toFixed().toString()
      );

      await policyBookAdmin.setPolicyBookFacadeRebalancingThreshold(
        policyBookFacades[0].address,
        toBN(NEW_REBALANCING_THRESHOLD).toFixed().toString()
      );

      assert.equal(
        (await policyBookFacades[0].rebalancingThreshold()).toString(),
        toBN(NEW_REBALANCING_THRESHOLD).toFixed().toString()
      );
    });
  });
  describe("setPolicyBookFacadeSafePricingModel", async () => {
    it("sets princing model", async () => {
      assert.equal(await policyBookFacades[0].safePricingModel(), false);

      await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacades[0].address, true);

      assert.equal(await policyBookFacades[0].safePricingModel(), true);
    });
  });
  describe("setLeveragePortfolioRebalancingThreshold", async () => {
    it("sets rebalancing threshold", async () => {
      assert.equal(
        (await userLeveragePool.rebalancingThreshold()).toString(),
        toBN(DEFAULT_REBALANCING_THRESHOLD).toFixed().toString()
      );

      await policyBookAdmin.setLeveragePortfolioRebalancingThreshold(
        userLeveragePool.address,
        toBN(NEW_REBALANCING_THRESHOLD).toFixed().toString()
      );

      assert.equal(
        (await userLeveragePool.rebalancingThreshold()).toString(),
        toBN(NEW_REBALANCING_THRESHOLD).toFixed().toString()
      );
    });
  });
  describe("setLeveragePortfolioProtocolConstant", async () => {
    it("sets protocol constants", async () => {
      assert.equal((await userLeveragePool.targetUR()).toString(), toBN(DEFAULT_TARGET_UR).toFixed().toString());
      assert.equal(
        (await userLeveragePool.d_ProtocolConstant()).toString(),
        toBN(DEFAULT_D_CONSTANT).toFixed().toString()
      );
      assert.equal(
        (await userLeveragePool.a_ProtocolConstant()).toString(),
        toBN(DEFAULT_A_CONSTANT).toFixed().toString()
      );
      assert.equal(
        (await userLeveragePool.max_ProtocolConstant()).toString(),
        toBN(DEFAULT_MAX_CONSTANT).toFixed().toString()
      );

      await policyBookAdmin.setLeveragePortfolioProtocolConstant(
        userLeveragePool.address,
        NEW_TARGET_UR,
        NEW_D_CONSTANT,
        NEW_A_CONSTANT,
        NEW_MAX_CONSTANT
      );

      assert.equal((await userLeveragePool.targetUR()).toString(), toBN(NEW_TARGET_UR).toFixed().toString());
      assert.equal((await userLeveragePool.d_ProtocolConstant()).toString(), toBN(NEW_D_CONSTANT).toFixed().toString());
      assert.equal((await userLeveragePool.a_ProtocolConstant()).toString(), toBN(NEW_A_CONSTANT).toFixed().toString());
      assert.equal(
        (await userLeveragePool.max_ProtocolConstant()).toString(),
        toBN(NEW_MAX_CONSTANT).toFixed().toString()
      );
    });
  });
  describe("setUserLeverageMaxCapacities", async () => {
    it("sets max capacity", async () => {
      assert.equal(
        (await userLeveragePool.maxCapacities()).toString(),
        toBN(DEFAULT_MAX_CAPACITY).toFixed().toString()
      );

      await policyBookAdmin.setUserLeverageMaxCapacities(
        userLeveragePool.address,
        toBN(NEW_MAX_CAPACITY).toFixed().toString()
      );

      assert.equal((await userLeveragePool.maxCapacities()).toString(), toBN(NEW_MAX_CAPACITY).toFixed().toString());
    });
  });
});
