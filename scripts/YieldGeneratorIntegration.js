// start ganache fork mainnet
// ganache-cli --fork https://eth-mainnet.alchemyapi.io/v2/d8JbLuMr-FcW3yYlDPFZASEHuyC0SQxP --unlock <richTetherOwner>
const ContractsRegistry = artifacts.require("ContractsRegistry");
const CapitalPool = artifacts.require("CapitalPoolMock");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const YieldGenerator = artifacts.require("YieldGenerator");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const IERC20 = artifacts.require("IERC20");

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
const UserLeveragePool = artifacts.require("UserLeveragePool");

const tetherAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const richTetherOwner = "0x69166e49d2fd23E4cbEA767d7191bE423a7733A5";

// AAVE
const AaveProtocol = artifacts.require("AaveProtocol");
const ILendingPool = artifacts.require("ILendingPool");
const ILendinPoolAddressesProvider = artifacts.require("ILendingPoolAddressesProvider");
const lendingPoolAddressesProviderAddress = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";
const aTokenAddress = "0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811";

// COMPOUND
const CompoundProtocol = artifacts.require("CompoundProtocol");
const IComptroller = artifacts.require("IComptroller");
const ICERC20 = artifacts.require("ICERC20");
const comptrollerAddress = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b";
const cTokenAddress = "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9";

// YEARN
const YearnProtocol = artifacts.require("YearnProtocol");
const IVault = artifacts.require("IVault");
const vaultAddress = "0x7Da96a3891Add058AdA2E826306D812C638D87a7";

const Reverter = require("../test/helpers/reverter");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");

const { assert } = require("chai");
const { compileFunction } = require("vm");

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

const PRECISION = toBN(10).pow(25);
const PRECESSION = toBN(10).pow(6);

const virtualAmount = wei("100000", "mwei");
const stblAmount = wei("10000", "mwei");

contract("YieldGenerator", async (accounts) => {
  const reverter = new Reverter(web3);

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

  let yearnProtocol;
  let vault;

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    stblMock = await IERC20.at(tetherAddress);

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

    const _aaveProtocol = await AaveProtocol.new();
    const _compoundProtocol = await CompoundProtocol.new();
    const _yearnProtocol = await YearnProtocol.new();

    aToken = await IERC20.at(aTokenAddress);
    lendingPoolAddressesProvider = await ILendinPoolAddressesProvider.at(lendingPoolAddressesProviderAddress);
    cToken = await ICERC20.at(cTokenAddress);
    comptroller = await IComptroller.at(comptrollerAddress);
    vault = await IVault.at(vaultAddress);

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
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());

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

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("Aave protocol", async () => {
    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(virtualAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), virtualAmount);
      await yieldGenerator.setProtocolSettings(
        [true, true, true],
        [toBN(45).times(PRECISION), toBN(45).times(PRECISION), toBN(10).times(PRECISION)],
        [true, true, true]
      );
    });

    it("deposit", async () => {
      const depositAmount = wei("1000", "mwei");
      await stblMock.transfer(capitalPool.address, stblAmount, { from: richTetherOwner });
      const balanceCPBefore = await stblMock.balanceOf(capitalPool.address);
      assert.equal(balanceCPBefore, stblAmount);
      const balanceATBefore = await stblMock.balanceOf(aToken.address);
      await capitalPool.deposit(depositAmount);

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).minus(depositAmount).toString()
      );
      assert.equal(
        (await stblMock.balanceOf(aToken.address)).toString(),
        toBN(balanceATBefore).plus(depositAmount).toString()
      );
      assert.equal(
        toBN(await aToken.balanceOf(aaveProtocol.address)).toString(),
        toBN(await aaveProtocol.totalValue()).toString()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocol.totalDeposit()).toString(), depositAmount);
    });

    it("withdraw ", async () => {
      const depositAmount = wei("1000", "mwei");
      const withdrawAmount = wei("1000", "mwei");
      let balanceATBefore = await stblMock.balanceOf(aToken.address);
      await stblMock.transfer(capitalPool.address, stblAmount, { from: richTetherOwner });
      await capitalPool.deposit(depositAmount);

      assert.equal(
        (await stblMock.balanceOf(aToken.address)).toString(),
        toBN(balanceATBefore).plus(depositAmount).toString()
      );
      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(stblAmount).minus(depositAmount).toString()
      );

      const balanceCPBefore = await stblMock.balanceOf(capitalPool.address);
      assert.equal(balanceCPBefore, toBN(stblAmount).minus(toBN(depositAmount)).toString());
      balanceATBefore = await stblMock.balanceOf(aToken.address);

      await capitalPool.withdraw(withdrawAmount);

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).plus(withdrawAmount).toString()
      );
      assert.equal(
        (await stblMock.balanceOf(aToken.address)).toString(),
        toBN(balanceATBefore).minus(withdrawAmount).toString()
      );
      assert.equal(
        toBN(await aToken.balanceOf(aaveProtocol.address)).toString(),
        toBN(await aaveProtocol.totalValue()).toString()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal(toBN(await aaveProtocol.totalDeposit()).toString(), 0);
    });

    it("claimRewards", async () => {
      const depositAmount = wei("1000", "mwei");

      let balanceATBefore = await stblMock.balanceOf(aToken.address);
      await stblMock.transfer(capitalPool.address, stblAmount, { from: richTetherOwner });
      await capitalPool.deposit(depositAmount);

      assert.equal(
        (await stblMock.balanceOf(aToken.address)).toString(),
        toBN(balanceATBefore).plus(depositAmount).toString()
      );
      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(stblAmount).minus(depositAmount).toString()
      );

      const balanceCPBefore = await stblMock.balanceOf(capitalPool.address);
      assert.equal(balanceCPBefore, toBN(stblAmount).minus(toBN(depositAmount)).toString());
      balanceATBefore = await stblMock.balanceOf(aToken.address);
      const totalValue = toBN(await aToken.balanceOf(aaveProtocol.address)).toString();

      await yieldGenerator.claimRewards();

      const rewardAmount = toBN(await stblMock.balanceOf(capitalPool.address))
        .minus(toBN(stblAmount).minus(toBN(depositAmount)).toString())
        .toString();
      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).plus(rewardAmount)
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), totalValue);
      assert.equal(toBN(await aaveProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocol.totalRewards()).toString(), rewardAmount);
    });
  });

  describe("Compound protocol", async () => {
    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(virtualAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), virtualAmount);
      await yieldGenerator.setProtocolSettings(
        [true, true, true],
        [toBN(20).times(PRECISION), toBN(60).times(PRECISION), toBN(20).times(PRECISION)],
        [true, true, true]
      );
    });

    it("deposit", async () => {
      const depositAmount = wei("1000", "mwei");
      await stblMock.transfer(capitalPool.address, stblAmount, { from: richTetherOwner });
      const balanceCPBefore = await stblMock.balanceOf(capitalPool.address);
      assert.equal(balanceCPBefore, stblAmount);
      const balanceCTBefore = await stblMock.balanceOf(cToken.address);
      await capitalPool.deposit(depositAmount);

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).minus(depositAmount).toString()
      );
      assert.equal(
        (await stblMock.balanceOf(cToken.address)).toString(),
        toBN(balanceCTBefore).plus(depositAmount).toString()
      );

      assert.closeTo(
        toBN(await cToken.balanceOf(compoundProtocol.address)).toNumber(),
        toBN(depositAmount)
          .times(toBN(10).pow(18))
          .div(await cToken.exchangeRateStored())
          .decimalPlaces(0)
          .toNumber(),
        toBN(wei("0.000001", "mwei")).toNumber()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await compoundProtocol.totalDeposit()).toString(), depositAmount);
    });

    it("withdraw ", async () => {
      const depositAmount = wei("1000", "mwei");
      const withdrawAmount = wei("1000", "mwei");
      let balanceCTBefore = await stblMock.balanceOf(cToken.address);
      await stblMock.transfer(capitalPool.address, stblAmount, { from: richTetherOwner });
      await capitalPool.deposit(depositAmount);

      assert.equal(
        (await stblMock.balanceOf(cToken.address)).toString(),
        toBN(balanceCTBefore).plus(depositAmount).toString()
      );
      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(stblAmount).minus(depositAmount).toString()
      );

      const balanceCPBefore = await stblMock.balanceOf(capitalPool.address);
      // assert.equal(balanceCPBefore.toString(), toBN(stblAmount).minus(toBN(depositAmount).times(2)).toString());
      balanceCTBefore = await stblMock.balanceOf(cToken.address);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).plus(withdrawAmount).toString()
      );
      assert.equal(
        (await stblMock.balanceOf(cToken.address)).toString(),
        toBN(balanceCTBefore).minus(withdrawAmount).toString()
      );

      await compoundProtocol._totalValue();

      assert.closeTo(
        toBN(await cToken.balanceOf(compoundProtocol.address)).toNumber(),
        toBN(await compoundProtocol.totalValue())
          .times(toBN(10).pow(18))
          .div(await cToken.exchangeRateStored())
          .decimalPlaces(0)
          .toNumber(),
        toBN(1000).toNumber()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal(toBN(await compoundProtocol.totalDeposit()).toString(), 0);
    });

    it("claimRewards", async () => {
      const depositAmount = wei("1000", "mwei");

      let balanceCTBefore = await stblMock.balanceOf(cToken.address);
      await stblMock.transfer(capitalPool.address, stblAmount, { from: richTetherOwner });
      await capitalPool.deposit(depositAmount);
      assert.equal(
        (await stblMock.balanceOf(cToken.address)).toString(),
        toBN(balanceCTBefore).plus(depositAmount).toString()
      );
      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(stblAmount).minus(depositAmount).toString()
      );

      balanceCTBefore = await stblMock.balanceOf(cToken.address);

      const totalValue = toBN(await cToken.balanceOf(compoundProtocol.address))
        .times(toBN(await cToken.exchangeRateStored()))
        .div(toBN(10).pow(18))
        .toString();

      //     .decimalPlaces(0)
      //     .toNumber(),.toString();
      const balanceCPBefore = await stblMock.balanceOf(capitalPool.address);

      await yieldGenerator.claimRewards();
      const rewardAmount = toBN(await stblMock.balanceOf(capitalPool.address))
        .minus(toBN(stblAmount).minus(toBN(depositAmount)).toString())
        .toString();

      // assert.closeTo(
      //   toBN(await cToken.balanceOf(compoundProtocol.address)).toNumber(),
      //   toBN(depositAmount)
      //     .times(toBN(10).pow(18))
      //     .div(await cToken.exchangeRateStored())
      //     .decimalPlaces(0)
      //     .toNumber(),
      //   toBN(wei("0.000001", "mwei")).toNumber()
      // );

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).plus(rewardAmount).toString()
      );

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      // assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), totalValue);
      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        toBN(totalValue).toNumber(),
        toBN(wei("0.000001", "mwei")).toNumber()
      );
      assert.equal(toBN(await compoundProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await compoundProtocol.totalRewards()).toString(), rewardAmount);
    });
  });

  describe("Yearn protocol", async () => {
    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(virtualAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), virtualAmount);
      await yieldGenerator.setProtocolSettings(
        [true, true, true],
        [toBN(20).times(PRECISION), toBN(20).times(PRECISION), toBN(60).times(PRECISION)],
        [true, true, true]
      );
    });

    it("deposit", async function () {
      const depositAmount = wei("1000", "mwei");
      await stblMock.transfer(capitalPool.address, stblAmount, { from: richTetherOwner });
      const balanceCPBefore = await stblMock.balanceOf(capitalPool.address);
      assert.equal(balanceCPBefore, stblAmount);
      const balanceVBefore = await stblMock.balanceOf(vault.address);
      await capitalPool.deposit(depositAmount);

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).minus(depositAmount).toString()
      );

      assert.equal(
        (await stblMock.balanceOf(vault.address)).toString(),
        toBN(balanceVBefore).plus(depositAmount).toString()
      );
      assert.closeTo(
        toBN(await vault.balanceOf(yearnProtocol.address)).toNumber(),
        toBN(depositAmount)
          .idiv(await vault.pricePerShare())
          .times(PRECESSION)
          .toNumber(),
        toBN(wei("0.0001")).toNumber()
      );
      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), depositAmount);
    });

    it("withdraw", async function () {
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.transfer(capitalPool.address, stblAmount, { from: richTetherOwner });
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      const balanceCPBefore = await stblMock.balanceOf(capitalPool.address);
      assert.equal(balanceCPBefore.toString(), toBN(stblAmount).minus(toBN(depositAmount).times(2)).toString());
      const balanceVBefore = await stblMock.balanceOf(vault.address);
      const balanceYBefore = await vault.balanceOf(yearnProtocol.address);

      await capitalPool.withdraw(withdrawAmount);
      const amountWithdrawn = await capitalPool.withdraw.call(withdrawAmount); // 999552600

      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).plus(amountWithdrawn).toString()
      );
      assert.closeTo(
        (await stblMock.balanceOf(vault.address)).toNumber(),
        toBN(balanceVBefore)
          .minus(
            toBN(amountWithdrawn)
              .idiv(await vault.pricePerShare())
              .times(PRECESSION)
          )
          .toNumber(),
        toBN(wei("0.0001")).toNumber()
      );
      assert.closeTo(
        toBN(await vault.balanceOf(yearnProtocol.address)).toNumber(),
        toBN(balanceYBefore)
          .minus(
            toBN(amountWithdrawn)
              .div(await vault.pricePerShare())
              .times(PRECESSION)
          )
          .toNumber(),
        toBN(wei("0.0001")).toNumber()
      );

      assert.equal(
        toBN(await yieldGenerator.totalDeposit()).toString(),
        toBN(depositAmount).times(2).minus(amountWithdrawn).toString()
      );
      assert.equal(
        toBN(await yearnProtocol.totalDeposit()).toString(),
        toBN(depositAmount).times(2).minus(amountWithdrawn).toString()
      );
    });

    it("claimRewards", async function () {
      const depositAmount = wei("1000", "mwei");
      const rewardAmount = wei("0", "mwei");

      await stblMock.transfer(capitalPool.address, stblAmount, { from: richTetherOwner });
      await capitalPool.deposit(depositAmount);
      const balanceCPBefore = await stblMock.balanceOf(capitalPool.address);
      assert.equal(balanceCPBefore.toString(), toBN(stblAmount).minus(depositAmount).toString());
      const balanceVBefore = await stblMock.balanceOf(vault.address);
      const balanceYBefore = await vault.balanceOf(yearnProtocol.address);

      await yieldGenerator.claimRewards();

      //assert.equal((await stblMock.balanceOf(reinsurancePool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).plus(rewardAmount).toString()
      );
      assert.equal((await stblMock.balanceOf(vault.address)).toString(), balanceVBefore);
      assert.equal(toBN(await vault.balanceOf(yearnProtocol.address)).toString(), toBN(balanceYBefore));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocol.totalRewards()).toString(), rewardAmount);
    });
  });
});
