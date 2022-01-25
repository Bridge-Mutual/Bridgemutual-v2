const ContractsRegistry = artifacts.require("ContractsRegistry");
const CapitalPool = artifacts.require("CapitalPoolMock");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const YieldGenerator = artifacts.require("YieldGenerator");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");

const STBLMock = artifacts.require("STBLMock");

const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyQuote = artifacts.require("PolicyQuote");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const LiquidityMining = artifacts.require("LiquidityMining");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const NFTStaking = artifacts.require("NFTStaking");
const ShieldMining = artifacts.require("ShieldMining");

const PolicyBook = artifacts.require("PolicyBook");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");

// AAVE
const AaveProtocol = artifacts.require("AaveProtocol");
const LendingPool = artifacts.require("LendingPoolMock");
const AToken = artifacts.require("ATokenMock");
const LendingPoolAddressesProvider = artifacts.require("LendingPoolAddressesProviderMock");

// COMPOUND
const CompoundProtocol = artifacts.require("CompoundProtocol");
const CToken = artifacts.require("CERC20Mock");
const Comptroller = artifacts.require("ComptrollerMock");
const Comp = artifacts.require("CompMock");

// YEARN
const YearnProtocol = artifacts.require("YearnProtocol");
const Vault = artifacts.require("VaultMock");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");

const { assert } = require("chai");

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

function toBN(number) {
  return new BigNumber(number);
}

const wei = web3.utils.toWei;
const { toWei } = web3.utils;

const PRECISION = toBN(10).pow(25);
const PRECESSION = toBN(10).pow(6);

const stblAmount = wei("10000", "mwei");
const initialDeposit = toWei("1000");

const compoundExchangeReate = toBN(10).pow(10).times(20070);

contract("YieldGenerator", async (accounts) => {
  const reverter = new Reverter(web3);

  const owner = accounts[0];
  const insuranceContract = accounts[1];
  const NOTHING = accounts[9];

  let contractsRegistry;

  let capitalPool;
  let reinsurancePool;
  let yieldGenerator;
  let stblMock;

  let aaveProtocol;
  let aToken;
  let lendingPoolAddressesProvider;

  let compoundProtocol;
  let cToken;
  let comptroller;
  let comp;

  let yearnProtocol;
  let vault;

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    stblMock = await STBLMock.new("mockSTBL", "MSTBL", 6);

    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _yieldGenerator = await YieldGenerator.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyQuote = await PolicyQuote.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _liquidityMining = await LiquidityMining.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _nftStaking = await NFTStaking.new();
    const _shieldMining = await ShieldMining.new();

    const _policyBookImpl = await PolicyBook.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();

    // AAVE DEPLOYMENT
    aToken = await AToken.new(stblMock.address, toBN(10).pow(27));
    const lendingPool = await LendingPool.new(aToken.address);
    lendingPoolAddressesProvider = await LendingPoolAddressesProvider.new(lendingPool.address);
    const _aaveProtocol = await AaveProtocol.new();

    // COMPOUND DEPLOYMENT
    comp = await Comp.new();
    comptroller = await Comptroller.new(comp.address);
    cToken = await CToken.new(stblMock.address);
    const _compoundProtocol = await CompoundProtocol.new();

    // YEARN DEPLOYMENT
    vault = await Vault.new(stblMock.address);
    const _yearnProtocol = await YearnProtocol.new();

    // SET UP CONTRACTS REGISTERY
    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblMock.address);

    await contractsRegistry.addContract(await contractsRegistry.PRICE_FEED_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LEGACY_REWARDS_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CLAIMING_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_ADMIN_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.SHIELD_MINING_NAME(), NOTHING);

    await contractsRegistry.addContract(
      await contractsRegistry.AAVE_LENDPOOL_ADDRESS_PROVIDER_NAME(),
      lendingPoolAddressesProvider.address
    );
    await contractsRegistry.addContract(await contractsRegistry.AAVE_ATOKEN_NAME(), aToken.address);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_COMPTROLLER_NAME(), comptroller.address);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_CTOKEN_NAME(), cToken.address);
    await contractsRegistry.addContract(await contractsRegistry.YEARN_VAULT_NAME(), vault.address);

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
    await contractsRegistry.addProxyContract(await contractsRegistry.LIQUIDITY_MINING_NAME(), _liquidityMining.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGenerator.address
    );
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

    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), _aaveProtocol.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.COMPOUND_PROTOCOL_NAME(),
      _compoundProtocol.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), _yearnProtocol.address);

    // DEPLOY PROTOCOLS
    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const liquidityMining = await LiquidityMining.at(await contractsRegistry.getLiquidityMiningContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());

    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());
    aaveProtocol = await AaveProtocol.at(await contractsRegistry.getAaveProtocolContract());
    compoundProtocol = await CompoundProtocol.at(await contractsRegistry.getCompoundProtocolContract());
    yearnProtocol = await YearnProtocol.at(await contractsRegistry.getYearnProtocolContract());

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await liquidityMining.__LiquidityMining_init();
    await rewardsGenerator.__RewardsGenerator_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();

    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await yieldGenerator.__YieldGenerator_init();
    await aaveProtocol.__AaveProtocol_init();
    await compoundProtocol.__CompoundProtocol_init();
    await yearnProtocol.__YearnProtocol_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.YIELD_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.AAVE_PROTOCOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.COMPOUND_PROTOCOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.YEARN_PROTOCOL_NAME());

    await aToken.setPool(lendingPool.address);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("Aave protocol", async () => {
    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount);
      await yieldGenerator.setProtocolSettings(
        [true, true, true],
        [toBN(60).times(PRECISION), toBN(20).times(PRECISION), toBN(20).times(PRECISION)],
        [true, true, true]
      );
    });
    it("deposit", async () => {
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(aToken.address)).toString(), depositAmount);
      assert.equal(toBN(await aToken.balanceOf(aaveProtocol.address)).toString(), depositAmount);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocol.totalDeposit()).toString(), depositAmount);
    });

    it("withdraw ", async () => {
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), toBN(withdrawAmount).plus(1).toString());
      assert.equal((await stblMock.balanceOf(aToken.address)).toString(), wei("5397.058823", "mwei"));
      assert.equal(toBN(await aToken.balanceOf(aaveProtocol.address)).toString(), wei("5397.058823", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("8999.999999", "mwei"));
      assert.equal(toBN(await aaveProtocol.totalDeposit()).toString(), wei("5397.058823", "mwei"));
    });

    // TODO it can't test with mocks , it tested in mainnet test
    it.skip("claimRewards", async () => {
      const depositAmount = wei("1000", "mwei");
      const rewardAmount = wei("100", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      //  configure yiled rewards which will mint to ths aave protocol
      await stblMock.mintArbitrary(owner, rewardAmount);
      await stblMock.approve(aToken.address, rewardAmount, { from: owner });

      const newLiquidityIndex = toBN(10).pow(26).times(11);
      await aToken.setLiquidityIndex(newLiquidityIndex);
      await aToken.mintInterest(aaveProtocol.address, { from: owner });

      await yieldGenerator.claimRewards();

      assert.equal((await stblMock.balanceOf(reinsurancePool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), wei("100", "mwei"));
      assert.equal((await stblMock.balanceOf(aToken.address)).toString(), depositAmount);

      assert.closeTo(
        toBN(await aToken.balanceOf(aaveProtocol.address)).toNumber(),
        toBN(depositAmount).toNumber(),
        toBN(wei("0.000001", "mwei")).toNumber()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocol.totalRewards()).toString(), wei("100", "mwei"));
    });
  });

  describe("Compound protocol", async () => {
    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount);
      await yieldGenerator.setProtocolSettings(
        [true, true, true],
        [toBN(20).times(PRECISION), toBN(60).times(PRECISION), toBN(20).times(PRECISION)],
        [true, true, true]
      );

      const newCompoundExchangeReate = toBN(10).pow(10).times(20070);
      await cToken.setExchangeRateStored(newCompoundExchangeReate);
    });
    it("deposit", async () => {
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(cToken.address)).toString(), depositAmount);

      assert.closeTo(
        toBN(await cToken.balanceOf(compoundProtocol.address)).toNumber(),
        toBN(depositAmount).times(toBN(10).pow(18)).div(compoundExchangeReate).decimalPlaces(0).toNumber(),
        toBN(wei("0.000001", "mwei")).toNumber()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await compoundProtocol.totalDeposit()).toString(), depositAmount);
    });

    it("withdraw ", async () => {
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), toBN(withdrawAmount).plus(1));
      assert.equal((await stblMock.balanceOf(cToken.address)).toString(), wei("5397.058823", "mwei"));

      assert.closeTo(
        toBN(await cToken.balanceOf(compoundProtocol.address)).toNumber(),
        toBN(wei("5397.058823", "mwei")).times(toBN(10).pow(18)).div(compoundExchangeReate).decimalPlaces(0).toNumber(),
        toBN(wei("0.000001", "mwei")).toNumber()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("8999.999999", "mwei"));
      assert.equal(toBN(await compoundProtocol.totalDeposit()).toString(), wei("5397.058823", "mwei"));
    });

    it("claimRewards", async () => {
      const depositAmount = wei("1000", "mwei");
      const rewardAmount = wei("75.784753", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      //  configure yiled rewards which will mint to ths compound protocol
      await stblMock.mintArbitrary(owner, rewardAmount);
      await stblMock.approve(cToken.address, rewardAmount, { from: owner });

      const newCompoundExchangeReate = toBN(10).pow(10).times(21591);
      await cToken.setExchangeRateStored(newCompoundExchangeReate);
      await cToken.mintInterest(compoundProtocol.address, { from: owner });

      await yieldGenerator.claimRewards();

      assert.equal((await stblMock.balanceOf(reinsurancePool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), rewardAmount);
      assert.equal(await stblMock.balanceOf(cToken.address), depositAmount);

      assert.closeTo(
        toBN(await cToken.balanceOf(compoundProtocol.address)).toNumber(),
        toBN(depositAmount).times(toBN(10).pow(18)).div(newCompoundExchangeReate).decimalPlaces(0).toNumber(),
        toBN(wei("0.001683", "mwei")).toNumber()
      );

      //assert.equal((await comp.balanceOf(reinsurancePool.address)).toString(), wei("1"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await compoundProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await compoundProtocol.totalRewards()).toString(), rewardAmount);
    });
  });

  describe("Yearn protocol", async () => {
    const PRICE_PER_SHARE_1 = toBN(10).pow(0);
    const PRICE_PER_SHARE_MORE = toBN(10).pow(1);

    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount);
      await yieldGenerator.setProtocolSettings(
        [true, true, true],
        [toBN(20).times(PRECISION), toBN(20).times(PRECISION), toBN(60).times(PRECISION)],
        [true, true, true]
      );
    });

    it("deposit when price per share = 1", async function () {
      const depositAmount = wei("1000", "mwei");
      await vault.setPricePerShare(PRICE_PER_SHARE_1);
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);

      assert.equal((await stblMock.balanceOf(vault.address)).toString(), depositAmount);
      assert.equal(
        toBN(await vault.balanceOf(yearnProtocol.address)).toString(),
        toBN(depositAmount)
          .times(await vault.pricePerShare())
          .div(PRECESSION)
          .toString()
      );
      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), depositAmount);
    });
    it("deposit when price per share = 10", async function () {
      const depositAmount = wei("1000", "mwei");
      await vault.setPricePerShare(PRICE_PER_SHARE_MORE);
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);

      assert.equal((await stblMock.balanceOf(vault.address)).toString(), depositAmount);
      assert.equal(
        toBN(await vault.balanceOf(yearnProtocol.address)).toString(),
        toBN(depositAmount)
          .times(await vault.pricePerShare())
          .div(PRECESSION)
          .toString()
      );
      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), depositAmount);
    });

    it("withdraw when price per share remains the same", async function () {
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await vault.setPricePerShare(PRICE_PER_SHARE_1);
      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), toBN(withdrawAmount).plus(1).toString());
      assert.equal((await stblMock.balanceOf(vault.address)).toString(), wei("5397.058823", "mwei"));
      assert.equal(toBN(await vault.balanceOf(yearnProtocol.address)).toString(), wei("5397.058823", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("8999.999999", "mwei"));
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), wei("5397.058823", "mwei"));
    });

    it("withdraw when price per share = 10", async function () {
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await vault.setPricePerShare(PRICE_PER_SHARE_1);
      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);

      await vault.setPricePerShare(PRICE_PER_SHARE_MORE);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), toBN(withdrawAmount).plus(1).toString());
      assert.equal((await stblMock.balanceOf(vault.address)).toString(), wei("5397.058823", "mwei"));
      assert.equal(toBN(await vault.balanceOf(yearnProtocol.address)).toString(), wei("6297.058823", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("8999.999999", "mwei"));
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), wei("5397.058823", "mwei"));
    });

    it("claims no reward when price per share remains the same", async function () {
      const depositAmount = wei("1000", "mwei");
      const rewardAmount = wei("100", "mwei");
      await vault.setPricePerShare(PRICE_PER_SHARE_1);
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      await stblMock.mintArbitrary(owner, rewardAmount);
      await stblMock.approve(vault.address, rewardAmount, { from: owner });
      await vault.mintInterest(yearnProtocol.address, { from: owner });

      await yieldGenerator.claimRewards();

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(vault.address)).toString(), depositAmount);
      assert.equal((await stblMock.balanceOf(reinsurancePool.address)).toString(), 0);
      assert.equal(
        toBN(await vault.balanceOf(yearnProtocol.address)).toString(),
        toBN(depositAmount)
          .times(await vault.pricePerShare())
          .div(PRECESSION)
          .toString()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalRewards()).toString(), 0);
    });

    it("claims reward when price per share = 10", async function () {
      const depositAmount = wei("1000", "mwei");
      const rewardAmount = wei("9000", "mwei");
      await vault.setPricePerShare(PRICE_PER_SHARE_1);
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      await vault.setPricePerShare(PRICE_PER_SHARE_MORE);
      await stblMock.mintArbitrary(owner, rewardAmount);
      await stblMock.approve(vault.address, rewardAmount, { from: owner });
      await vault.mintInterest(yearnProtocol.address, { from: owner });

      await yieldGenerator.claimRewards();

      assert.equal((await stblMock.balanceOf(reinsurancePool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), wei("9000", "mwei"));
      assert.equal((await stblMock.balanceOf(vault.address)).toString(), depositAmount);
      assert.equal(toBN(await vault.balanceOf(yearnProtocol.address)).toString(), wei("100", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalRewards()).toString(), wei("9000", "mwei"));
    });
  });
});
