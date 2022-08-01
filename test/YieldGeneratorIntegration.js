const ContractsRegistry = artifacts.require("ContractsRegistry");
const CapitalPool = artifacts.require("CapitalPoolMock");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const YieldGenerator = artifacts.require("YieldGeneratorMock");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");

const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyQuote = artifacts.require("PolicyQuote");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const NFTStaking = artifacts.require("NFTStaking");
const ShieldMining = artifacts.require("ShieldMining");

const PolicyBook = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const UserLeveragePool = artifacts.require("UserLeveragePool");

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
const YearnProtocol = artifacts.require("YearnProtocolMock");
const Vault = artifacts.require("VaultMock");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

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
const PRECISION = toBN(10).pow(25);
const PRECESSION = toBN(10).pow(6);

const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
const DAYS_IN_YEAR = 365;
const BLOCKS_PER_DAY = 6450;
const BLOCKS_PER_YEAR = DAYS_IN_YEAR * BLOCKS_PER_DAY;

let stblAmount = getStableAmount("10000");
let stblInitialDeposit;
let depositAmount;
let withdrawAmount;
let rewardAmount;

contract("YieldGenerator", async (accounts) => {
  const reverter = new Reverter(web3);

  const owner = accounts[0];
  const leverageContract = accounts[1];
  const NOTHING = accounts[9];

  let contractsRegistry;

  let capitalPool;
  let reinsurancePool;
  let yieldGenerator;
  let stblMock;

  let aaveProtocol;
  let aToken;
  let lendingPool;
  let lendingPoolAddressesProvider;

  let compoundProtocol;
  let cToken;
  let comptroller;
  let comp;

  let yearnProtocol;
  let vault;

  let network;

  before("setup", async () => {
    network = await getNetwork();
    contractsRegistry = await ContractsRegistry.new();
    if (network == Networks.ETH) {
      stblMock = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stblMock = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }
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
    lendingPool = await LendingPool.new(aToken.address);
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
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CLAIMING_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_REGISTRY_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_ADMIN_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.SHIELD_MINING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

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
    await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), _aaveProtocol.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), _compoundProtocol.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), _yearnProtocol.address);

    // DEPLOY PROTOCOLS
    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());

    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());
    aaveProtocol = await AaveProtocol.at(await contractsRegistry.getDefiProtocol1Contract());
    compoundProtocol = await CompoundProtocol.at(await contractsRegistry.getDefiProtocol2Contract());
    yearnProtocol = await YearnProtocol.at(await contractsRegistry.getDefiProtocol3Contract());

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await rewardsGenerator.__RewardsGenerator_init(network);
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();

    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await yieldGenerator.__YieldGenerator_init(network);
    if (network == Networks.BSC || network == Networks.POL) {
      await yieldGenerator.updateProtocolNumbers(3);
    }
    await aaveProtocol.__AaveProtocol_init();
    await compoundProtocol.__CompoundProtocol_init();
    await yearnProtocol.__YearnProtocol_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.YIELD_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.DEFI_PROTOCOL_1_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.DEFI_PROTOCOL_2_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.DEFI_PROTOCOL_3_NAME());

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

    stblInitialDeposit = getStableAmount("1000");

    await stblMock.approve(policyBookFabric.address, stblInitialDeposit.times(6));

    // CREATION LP
    tx = await policyBookFabric.createLeveragePools(
      leverageContract,
      ContractType.VARIOUS,
      "User Leverage Pool",
      "USDT"
    );
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await aToken.setPool(lendingPool.address);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("Aave protocol", async () => {
    beforeEach("setup", async function () {
      if (network == parseInt(Networks.ETH)) {
        stblAmount = getStableAmount("10000");
        await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
        assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount.toFixed().toString());
        await yieldGenerator.setProtocolSettings(
          [true, true, true],
          [toBN(60).times(PRECISION), toBN(20).times(PRECISION), toBN(20).times(PRECISION)],
          [wei("0.002", "mwei"), wei("0.002", "mwei"), wei("0.002", "mwei")]
        );
      } else {
        this.skip();
      }
    });
    it("getAPR", async () => {
      depositAmount = getStableAmount("1000");

      const oneDayGain = toBN(await yieldGenerator.getOneDayGain(0)).div(PRECISION);

      const rate = toBN((await lendingPool.getReserveData(stblMock.address)).currentLiquidityRate);

      const expectedOneDayGain = toBN(rate).div(365).div(100);
      assert.equal(oneDayGain.toString(), expectedOneDayGain.div(PRECISION).toString());

      const oneDayReturn = oneDayGain.times(depositAmount); // 84377.94094353089 mgetStableAmount = 0.08 usdt
    });
    it("deposit", async () => {
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(aToken.address)).toString(), depositAmount.toFixed().toString());
      assert.equal(toBN(await aToken.balanceOf(aaveProtocol.address)).toString(), depositAmount.toString());

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount.toString());
      assert.equal(toBN(await aaveProtocol.totalDeposit()).toString(), depositAmount.toString());
    });

    it("withdraw", async () => {
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, depositAmount.times(2));
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(withdrawAmount).plus(1).toFixed().toString()
      );
      assert.equal(
        toBN(await stblMock.balanceOf(aToken.address)).toString(),
        getStableAmount("5397.058823").toString()
      );
      assert.equal(
        toBN(await aToken.balanceOf(aaveProtocol.address)).toString(),
        getStableAmount("5323.083778").toString()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), getStableAmount("8999.999999").toString());
      assert.equal(toBN(await aaveProtocol.totalDeposit()).toString(), getStableAmount("5397.058823").toString());
    });

    it("claimRewards", async () => {
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      rewardAmount = getStableAmount("100");
      await stblMock.mintArbitrary(aToken.address, rewardAmount);
      await yieldGenerator.claimRewards();

      assert.equal((await stblMock.balanceOf(reinsurancePool.address)).toString(), 0);
      assert.equal((await reinsurancePool.totalLiquidity()).toString(), wei("100"));
      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), rewardAmount.toString());
      assert.equal((await stblMock.balanceOf(aToken.address)).toString(), depositAmount.toFixed().toString());

      const liquidityIndex = await aToken.liquidityIndex();

      assert.closeTo(
        toBN(await aToken.balanceOf(aaveProtocol.address)).toNumber(),
        toBN(depositAmount).times(toBN(10).pow(27)).div(liquidityIndex).toNumber(),
        getStableAmount("0.000001").toNumber()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocol.totalRewards()).toString(), rewardAmount);
    });
  });

  describe("Compound protocol", async () => {
    let compoundExchangeRateInit;

    beforeEach("setup", async function () {
      if (network == parseInt(Networks.ETH)) {
        stblAmount = getStableAmount("10000");

        await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
        assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount.toFixed().toString());
        await yieldGenerator.setProtocolSettings(
          [true, true, true],
          [toBN(20).times(PRECISION), toBN(60).times(PRECISION), toBN(20).times(PRECISION)],
          [getStableAmount("0.002"), getStableAmount("0.002"), getStableAmount("0.002")]
        );
        compoundExchangeRateInit = await cToken.exchangeRateCurrent();
      } else {
        this.skip();
      }
    });
    it("getAPR", async () => {
      depositAmount = getStableAmount("1000");

      const oneDayGain = toBN(await yieldGenerator.getOneDayGain(1)).div(PRECISION);

      const rate = toBN(await cToken.getSupplyRatePerBlock())
        .times(BLOCKS_PER_DAY)
        .times(PRECISION);
      const mantissa = toBN(10).pow(18);

      const expectedOneDayGain = toBN(rate).div(mantissa);
      assert.equal(oneDayGain.toString(), expectedOneDayGain.div(PRECISION).toString());

      const oneDayReturn = oneDayGain.times(depositAmount); // 78685.62858345 mgetStableAmount = 0.07 usdt
    });
    it("deposit", async () => {
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(cToken.address)).toString(), depositAmount.toFixed().toString());

      assert.closeTo(
        toBN(await cToken.balanceOf(compoundProtocol.address)).toNumber(),
        toBN(depositAmount).times(toBN(10).pow(18)).div(compoundExchangeRateInit).decimalPlaces(0).toNumber(),
        getStableAmount("0.000001").toNumber()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount.toString());
      assert.equal(toBN(await compoundProtocol.totalDeposit()).toString(), depositAmount.toString());
    });

    it("withdraw", async () => {
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, depositAmount.times(2));
      await capitalPool.deposit(depositAmount);
      const mint1 = toBN(getStableAmount("3750"))
        .times(toBN(10).pow(18))
        .div(compoundExchangeRateInit)
        .decimalPlaces(0);
      const compoundExchangeRate1 = await cToken.exchangeRateCurrent();
      await capitalPool.deposit(depositAmount);
      const mint2 = toBN(getStableAmount("2647.05882"))
        .times(toBN(10).pow(18))
        .div(compoundExchangeRate1)
        .decimalPlaces(0);
      const compoundExchangeRate2 = await cToken.exchangeRateCurrent();

      await capitalPool.withdraw(withdrawAmount);
      const burn = toBN(getStableAmount("1000")).times(toBN(10).pow(18)).div(compoundExchangeRate2).decimalPlaces(0);

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(withdrawAmount).plus(1).toFixed().toString()
      );
      assert.equal(
        toBN(await stblMock.balanceOf(cToken.address)).toString(),
        getStableAmount("5397.058823").toString()
      );

      assert.closeTo(
        toBN(await cToken.balanceOf(compoundProtocol.address)).toNumber(),
        toBN(mint1).plus(mint2).minus(burn).toNumber(),
        toBN(getStableAmount("0.1")).toNumber()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), getStableAmount("8999.999999").toString());
      assert.equal(toBN(await compoundProtocol.totalDeposit()).toString(), getStableAmount("5397.058823").toString());
    });

    it("claimRewards", async () => {
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      rewardAmount = getStableAmount("75.784753");
      await stblMock.mintArbitrary(cToken.address, rewardAmount);
      await yieldGenerator.claimRewards();

      assert.equal((await stblMock.balanceOf(reinsurancePool.address)).toString(), 0);
      assert.equal((await reinsurancePool.totalLiquidity()).toString(), wei("75.784753"));
      assert.equal(toBN(await stblMock.balanceOf(capitalPool.address)).toString(), rewardAmount.toString());
      assert.equal(toBN(await stblMock.balanceOf(cToken.address)).toString(), depositAmount.toString());

      const compoundExchangeRate = await cToken.exchangeRateCurrent();
      assert.closeTo(
        toBN(await cToken.balanceOf(compoundProtocol.address)).toNumber(),
        toBN(depositAmount).times(toBN(10).pow(18)).div(compoundExchangeRate).decimalPlaces(0).toNumber(),
        toBN(getStableAmount("0.001683")).toNumber()
      );

      //assert.equal((await comp.balanceOf(reinsurancePool.address)).toString(), getStableAmount("1"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await compoundProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await compoundProtocol.totalRewards()).toString(), rewardAmount.toString());
    });
  });

  describe("Yearn protocol", async () => {
    let pricePerShareInit;

    beforeEach("setup", async function () {
      if (network == parseInt(Networks.ETH)) {
        stblAmount = getStableAmount("10000");

        await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
        assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount.toFixed().toString());
        await yieldGenerator.setProtocolSettings(
          [true, true, true],
          [toBN(20).times(PRECISION), toBN(20).times(PRECISION), toBN(60).times(PRECISION)],
          [getStableAmount("0.002"), getStableAmount("0.002"), getStableAmount("0.002")]
        );
        await yearnProtocol.updatePriceAndBlock();
        pricePerShareInit = await vault.pricePerShare();
        await vault.setPricePerShare(1047212); // + 83 in one day => 10000 in 4 months (approx reality)
      } else {
        this.skip();
      }
    });

    it("getAPR", async () => {
      depositAmount = getStableAmount("1000");

      const oneDayGain = toBN(await yieldGenerator.getOneDayGain(2)).div(PRECISION);

      const priceChange = toBN(await vault.pricePerShare())
        .minus(pricePerShareInit)
        .times(PRECISION);
      const nbDay = 0;

      const expectedOneDayGain = toBN(priceChange).div(PRECESSION);
      assert.equal(oneDayGain.toNumber(), expectedOneDayGain.div(PRECISION).toNumber());

      const oneDayReturn = oneDayGain.times(depositAmount); // 83333.33333333333 mgetStableAmount = 0.08 usdt
    });

    it("deposit", async function () {
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);

      assert.equal((await stblMock.balanceOf(vault.address)).toString(), depositAmount.toFixed().toString());
      assert.equal(
        toBN(await vault.balanceOf(yearnProtocol.address)).toString(),
        toBN(depositAmount).times(1047212).div(PRECESSION).toString()
      );
      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount.toString());
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), depositAmount.toString());
    });

    it("withdraw", async function () {
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, depositAmount.times(2));
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);

      await capitalPool.withdraw(withdrawAmount);

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(withdrawAmount).plus(1).toFixed().toString()
      );
      assert.equal(toBN(await stblMock.balanceOf(vault.address)).toString(), getStableAmount("3750.000000").toString());
      assert.equal(
        toBN(await vault.balanceOf(yearnProtocol.address)).toString(),
        getStableAmount("3927.045000").toString()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), getStableAmount("8999.999999").toString());
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), getStableAmount("3750.000000").toString());
    });

    it("claimsRewards", async function () {
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      rewardAmount = getStableAmount("107.125091");
      await stblMock.mintArbitrary(vault.address, rewardAmount);
      await yieldGenerator.claimRewards();

      assert.equal((await stblMock.balanceOf(reinsurancePool.address)).toString(), 0);
      assert.equal((await reinsurancePool.totalLiquidity()).toString(), wei("107.125091"));
      assert.equal(toBN(await stblMock.balanceOf(capitalPool.address)).toString(), rewardAmount.toString());
      assert.equal(toBN(await stblMock.balanceOf(vault.address)).toString(), depositAmount.toString());

      const pricePerShare = await vault.pricePerShare();
      assert.closeTo(
        toBN(await vault.balanceOf(yearnProtocol.address)).toNumber(),
        toBN(depositAmount).times(PRECESSION).div(pricePerShare).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalRewards()).toString(), rewardAmount.toString());
    });
  });
});
