const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyQuote = artifacts.require("PolicyQuote");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const YieldGenerator = artifacts.require("YieldGenerator");
const STBLMock = artifacts.require("STBLMock");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WETHMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const PriceFeed = artifacts.require("PriceFeed");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const LiquidityMining = artifacts.require("LiquidityMining");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const ClaimVoting = artifacts.require("ClaimVoting");
const ReinsurancePool = artifacts.require("ReinsurancePoolMock");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const CapitalPool = artifacts.require("CapitalPool");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacadeMock");
const UserLeveragePool = artifacts.require("UserLeveragePoolMock");
const BMIStaking = artifacts.require("BMIStaking");

const ShieldMining = artifacts.require("ShieldMining");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const LeveragePortfolioContract = require("../build/contracts/AbstractLeveragePortfolio.json");
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
const { time } = require("@openzeppelin/test-helpers");
const { ethers } = require("ethers");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");

const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");

const { assert } = require("chai");

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

const { toWei } = web3.utils;

contract("CapitalPool", async (accounts) => {
  const reverter = new Reverter(web3);
  const epochPeriod = toBN(604800);
  const withdrawalPeriod = toBN(691200); // 8 days

  let contractsRegistry;
  let policyBookMock;
  let policyBookFacade;
  let policyBookMock2;
  let policyBookFacade2;
  let policyBookMock3;
  let policyBookFacade3;
  let bmiUtilityNFT;
  let nftStaking;
  let bmiCoverStaking;
  let liquidityMining;
  let stbl;
  let yieldGenerator;
  let bmi;
  let rewardsGenerator;
  let reinsurancePool;
  let policyBookRegistry;
  let policyQuote;
  let policyRegistry;

  let policyBookAdmin;
  let decodedResult;
  let policyBookFabric;
  let leveragePortfolioView;
  let aaveProtocol;
  let aToken;
  let lendingPoolAddressesProvider;

  let compoundProtocol;
  let cToken;
  let comptroller;
  let comp;

  let yearnProtocol;
  let vault;

  let userLeveragePool;

  const insuranceContract = accounts[6];

  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const USER3 = accounts[3];

  const PRECISION = toBN(10).pow(25);
  const insuranceContract2 = accounts[7];
  const insuranceContract3 = accounts[8];
  const NOTHING = accounts[9];

  const initialDeposit = toBN(toWei("1000"));
  const stblInitialDeposit = toBN(toWei("1000", "mwei"));

  const transactionFilter = async (contractAddress) => {
    const iface = new ethers.utils.Interface(LeveragePortfolioContract.abi);
    let _provider = new ethers.providers.JsonRpcProvider(web3.currentProvider.host);
    const logs = await _provider.getLogs({
      address: contractAddress,
    });

    const log = iface.parseLog(logs[0]);

    return log.args;
  };

  const getSTBLAmount = async (bmiXAmount) => {
    return toBN(await policyBookMock.convertBMIXToSTBL(bmiXAmount));
  };

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    const policyBookImpl = await PolicyBookMock.new();
    const policyBookFacadeImpl = await PolicyBookFacade.new();
    const weth = await WETHMock.new("weth", "weth");
    const sushiswapRouterMock = await SushiswapRouterMock.new();
    bmi = await BMIMock.new(USER1);
    stbl = await STBLMock.new("stbl", "stbl", 6);
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _capitalPool = await CapitalPool.new();
    const _priceFeed = await PriceFeed.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyQuote = await PolicyQuote.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _liquidityMining = await LiquidityMining.new();
    const _yieldGenerator = await YieldGenerator.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _claimVoting = await ClaimVoting.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _bmiStaking = await BMIStaking.new();

    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    // AAVE DEPLOYMENT
    aToken = await AToken.new(stbl.address, toBN(10).pow(27));
    const lendingPool = await LendingPool.new(aToken.address);
    lendingPoolAddressesProvider = await LendingPoolAddressesProvider.new(lendingPool.address);
    const _aaveProtocol = await AaveProtocol.new();

    // COMPOUND DEPLOYMENT
    comp = await Comp.new();
    comptroller = await Comptroller.new(comp.address);
    cToken = await CToken.new(stbl.address);
    const _compoundProtocol = await CompoundProtocol.new();

    // YEARN DEPLOYMENT
    vault = await Vault.new(stbl.address);
    const _yearnProtocol = await YearnProtocol.new();

    await contractsRegistry.__ContractsRegistry_init();
    await contractsRegistry.addContract(await contractsRegistry.VBMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REPUTATION_SYSTEM_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LEGACY_REWARDS_GENERATOR_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.WETH_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.SUSHISWAP_ROUTER_NAME(), sushiswapRouterMock.address);
    await contractsRegistry.addContract(
      await contractsRegistry.AAVE_LENDPOOL_ADDRESS_PROVIDER_NAME(),
      lendingPoolAddressesProvider.address
    );
    await contractsRegistry.addContract(await contractsRegistry.AAVE_ATOKEN_NAME(), aToken.address);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_COMPTROLLER_NAME(), comptroller.address);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_CTOKEN_NAME(), cToken.address);
    await contractsRegistry.addContract(await contractsRegistry.YEARN_VAULT_NAME(), vault.address);

    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
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
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
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

    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_STAKING_NAME(), _bmiStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), _aaveProtocol.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.COMPOUND_PROTOCOL_NAME(),
      _compoundProtocol.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), _yearnProtocol.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), _aaveProtocol.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.COMPOUND_PROTOCOL_NAME(),
      _compoundProtocol.address
    );

    await contractsRegistry.addProxyContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), _yearnProtocol.address);
    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    liquidityMining = await LiquidityMining.at(await contractsRegistry.getLiquidityMiningContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    leveragePortfolioView = await LeveragePortfolioView.at(await contractsRegistry.getLeveragePortfolioViewContract());
    bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());
    policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());
    aaveProtocol = await AaveProtocol.at(await contractsRegistry.getAaveProtocolContract());
    compoundProtocol = await CompoundProtocol.at(await contractsRegistry.getCompoundProtocolContract());
    yearnProtocol = await YearnProtocol.at(await contractsRegistry.getYearnProtocolContract());

    await policyBookAdmin.__PolicyBookAdmin_init(
      policyBookImpl.address,
      policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );

    await reinsurancePool.__ReinsurancePool_init();
    await policyBookFabric.__PolicyBookFabric_init();
    await nftStaking.__NFTStaking_init();
    await rewardsGenerator.__RewardsGenerator_init();
    await liquidityMining.__LiquidityMining_init();
    await capitalPool.__CapitalPool_init();
    await bmiUtilityNFT.__BMIUtilityNFT_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await yieldGenerator.__YieldGenerator_init();
    await aaveProtocol.__AaveProtocol_init();
    await compoundProtocol.__CompoundProtocol_init();
    await yearnProtocol.__YearnProtocol_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.YIELD_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.AAVE_PROTOCOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.COMPOUND_PROTOCOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.YEARN_PROTOCOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

    await sushiswapRouterMock.setReserve(stbl.address, toWei(toBN(10 ** 3).toString()));
    await sushiswapRouterMock.setReserve(weth.address, toWei(toBN(10 ** 15).toString()));
    await sushiswapRouterMock.setReserve(bmi.address, toWei(toBN(10 ** 15).toString()));

    const userLeveragePoolAddress = (
      await policyBookFabric.createLeveragePools(ContractType.VARIUOS, "User Leverage Pool", "USDT")
    ).logs[0].args.at;

    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);

    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await policyBookAdmin.setupPricingModel(
      PRECISION.times(80),
      PRECISION.times(2),
      toWei("10"),
      PRECISION.times(10),
      PRECISION.times(50),
      PRECISION.times(25),
      PRECISION.times(100)
    );

    await stbl.approve(policyBookFabric.address, initialDeposit.times(3));

    //setCurrentTime(1);
    const policyBookAddr = (
      await policyBookFabric.create(
        insuranceContract,
        ContractType.CONTRACT,
        "test description",
        "TEST",
        initialDeposit,
        "0x0000000000000000000000000000000000000000"
      )
    ).logs[0].args.at;

    policyBookMock = await PolicyBookMock.at(policyBookAddr);

    let policyBookFacadeAddress = await policyBookMock.policyBookFacade();
    policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddress);

    // setup some pools
    // pool2
    policyBookMock2 = await PolicyBookMock.at(
      (
        await policyBookFabric.create(
          insuranceContract2,
          ContractType.CONTRACT,
          "test description",
          "TEST2",
          initialDeposit,
          "0x0000000000000000000000000000000000000000"
        )
      ).logs[0].args.at
    );
    policyBookFacadeAddress = await policyBookMock2.policyBookFacade();
    policyBookFacade2 = await PolicyBookFacade.at(policyBookFacadeAddress);

    // pool3
    policyBookMock3 = await PolicyBookMock.at(
      (
        await policyBookFabric.create(
          insuranceContract3,
          ContractType.CONTRACT,
          "test description",
          "TEST3",
          initialDeposit,
          "0x0000000000000000000000000000000000000000"
        )
      ).logs[0].args.at
    );

    policyBookFacadeAddress = await policyBookMock3.policyBookFacade();
    policyBookFacade3 = await PolicyBookFacade.at(policyBookFacadeAddress);

    await liquidityMining.startLiquidityMining();
    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("check pools balances", async () => {
    const liquidityAmount1 = toBN(toWei("150000"));
    const liquidityAmount2 = toBN(toWei("2000"));
    const liquidityAmount3 = toBN(toWei("15000"));

    const stblLiquidityAmount1 = toBN(toWei("150000", "mwei"));
    const stblLiquidityAmount2 = toBN(toWei("2000", "mwei"));
    const stblLiquidityAmount3 = toBN(toWei("15000", "mwei"));

    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblLiquidityAmount1.times(2));

      await stbl.approve(policyBookMock.address, stblLiquidityAmount1, { from: USER1 });

      await stbl.approve(userLeveragePool.address, stblLiquidityAmount1, { from: USER1 });

      await stbl.transfer(USER2, stblLiquidityAmount2);

      await stbl.approve(policyBookMock2.address, stblLiquidityAmount2, { from: USER2 });

      await stbl.transfer(USER3, stblLiquidityAmount3);

      await stbl.approve(policyBookMock3.address, stblLiquidityAmount3, { from: USER3 });
    });

    it("should correctly update balances of coverage pools, ULP & RP - add liquidity", async () => {
      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal(
        (await capitalPool.regularCoverageBalance(policyBookMock.address)).toString(),
        stblLiquidityAmount1.plus(stblInitialDeposit)
      );

      assert.equal(
        (await capitalPool.hardUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1.plus(stblInitialDeposit.times(3))
      );

      assert.equal(
        (await capitalPool.virtualUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1.plus(stblInitialDeposit.times(3))
      );

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        stblLiquidityAmount1.plus(stblInitialDeposit.times(3))
      );

      // pool2
      await policyBookFacade2.addLiquidity(liquidityAmount2, { from: USER2 });

      assert.equal(
        (await capitalPool.regularCoverageBalance(policyBookMock2.address)).toString(),
        stblLiquidityAmount2.plus(stblInitialDeposit)
      );

      assert.equal(
        (await capitalPool.hardUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1.plus(stblLiquidityAmount2).plus(stblInitialDeposit.times(3))
      );

      assert.equal(
        (await capitalPool.virtualUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1.plus(stblLiquidityAmount2).plus(stblInitialDeposit.times(3))
      );

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        stblLiquidityAmount1.plus(stblLiquidityAmount2).plus(stblInitialDeposit.times(3))
      );
      // pool3
      await policyBookFacade3.addLiquidity(liquidityAmount3, { from: USER3 });

      assert.equal(
        (await capitalPool.regularCoverageBalance(policyBookMock3.address)).toString(),
        stblLiquidityAmount3.plus(stblInitialDeposit)
      );

      assert.equal(
        (await capitalPool.hardUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1.plus(stblLiquidityAmount2).plus(stblLiquidityAmount3).plus(stblInitialDeposit.times(3))
      );

      assert.equal(
        (await capitalPool.virtualUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1.plus(stblLiquidityAmount2).plus(stblLiquidityAmount3).plus(stblInitialDeposit.times(3))
      );

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        stblLiquidityAmount1.plus(stblLiquidityAmount2).plus(stblLiquidityAmount3).plus(stblInitialDeposit.times(3))
      );

      // user leverage pool
      await userLeveragePool.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal((await capitalPool.leveragePoolBalance(userLeveragePool.address)).toString(), stblLiquidityAmount1);

      assert.equal(
        (await capitalPool.hardUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1
          .times(2)
          .plus(stblLiquidityAmount2)
          .plus(stblLiquidityAmount3)
          .plus(stblInitialDeposit.times(3))
      );

      assert.equal(
        (await capitalPool.virtualUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1
          .times(2)
          .plus(stblLiquidityAmount2)
          .plus(stblLiquidityAmount3)
          .plus(stblInitialDeposit.times(3))
      );

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        stblLiquidityAmount1
          .times(2)
          .plus(stblLiquidityAmount2)
          .plus(stblLiquidityAmount3)
          .plus(stblInitialDeposit.times(3))
      );

      // reinsurance pool
      await reinsurancePool.addLiquidity(stblLiquidityAmount1);

      assert.equal((await capitalPool.reinsurancePoolBalance()).toString(), stblLiquidityAmount1);

      assert.equal(
        (await capitalPool.hardUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1
          .times(3)
          .plus(stblLiquidityAmount2)
          .plus(stblLiquidityAmount3)
          .plus(stblInitialDeposit.times(3))
      );

      assert.equal(
        (await capitalPool.virtualUsdtAccumulatedBalance()).toString(),
        stblLiquidityAmount1
          .times(3)
          .plus(stblLiquidityAmount2)
          .plus(stblLiquidityAmount3)
          .plus(stblInitialDeposit.times(3))
      );
    });
  });

  describe("add premiun", async () => {
    const liquidityAmount1 = toBN(toWei("50000"));
    const stblLiquidityAmount1 = toBN(toWei("50000", "mwei"));
    const stblLiquidityAmount = toBN(toWei("200000", "mwei"));
    const coverTokensAmount = toBN(toWei("1000"));
    const coverTokensAmount1 = toBN(toWei("50500"));

    const virtualLiquidityAmount1 = toBN(toWei("3000000"));
    const virtualLiquidityAmount2 = toBN(toWei("1000000"));

    const epochsNumber = toBN(4);

    let priceTotal;
    let price;
    let protocolPrice;

    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblLiquidityAmount);

      await stbl.approve(policyBookMock.address, stblLiquidityAmount, { from: USER1 });

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      assert.equal(
        toBN(await policyBookMock.totalLiquidity()).toString(),
        toBN(liquidityAmount1).plus(toWei("1000")).toString()
      );

      priceTotal = toBN(
        await policyQuote.getQuote(epochPeriod.times(5).minus(5), coverTokensAmount, policyBookMock.address)
      );
      protocolPrice = priceTotal.times(0.2).dp(0, BigNumber.ROUND_FLOOR);
      price = priceTotal.minus(protocolPrice);
    });

    it("should correctly add premium for coverage pool + RP protocol fee - without user leverage and RP virtual balances", async () => {
      assert.equal(await policyBookMock.lastDistributionEpoch(), 1);
      await policyBookFacade.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

      assert.equal(
        toBN(await capitalPool.regularCoverageBalance(policyBookMock.address)).toString(),
        stblLiquidityAmount1
          .plus(stblInitialDeposit)
          .plus(price.idiv(10 ** 12))
          .toString()
      );

      assert.equal((await capitalPool.reinsurancePoolBalance()).toString(), protocolPrice.idiv(10 ** 12).toString());

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        stblLiquidityAmount1.plus(stblInitialDeposit.times(3)).plus(priceTotal.idiv(10 ** 12))
      );

      assert.equal((await reinsurancePool.totalLiquidity()).toString(), protocolPrice.toString());
    });

    it("should correctly add premium for coverage pool + RP protocol fee - with RP virtual balances", async () => {
      // setup fot reinsurance pool - 1 MM
      reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount1);
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, 0, PRECISION.times(30));
      await policyBookMock.setTotalCoverTokens(coverTokensAmount1);

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      // check deployed virtual to the pool
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("688062.5"));

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);
      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("688062.5"));

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), toWei("688062.5"));

      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), toWei("688062.5"));

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal(await policyBookMock.lastDistributionEpoch(), 1);
      await policyBookFacade.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

      assert.equal(
        toBN(await capitalPool.regularCoverageBalance(policyBookMock.address)).toString(),
        stblLiquidityAmount1
          .times(2)
          .plus(stblInitialDeposit)
          .plus(toBN(toWei("1.023999", "mwei")))
          .toString()
      );

      assert.equal(
        (await capitalPool.reinsurancePoolBalance()).toString(),
        protocolPrice
          .idiv(10 ** 12)
          .plus(toBN(toWei("6.975999", "mwei")))
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        stblLiquidityAmount1
          .times(2)
          .plus(stblInitialDeposit.times(3))
          .plus(priceTotal.idiv(10 ** 12))
      );
    });

    it("should correctly add premium for coverage pool + RP protocol fee - with user leverage balances", async () => {
      // setup fot user leverage pool - 1 MM
      await policyBookAdmin.setLeveragePortfolioProtocolConstant(
        userLeveragePool.address,
        PRECISION.times(45),
        PRECISION.times(2),
        PRECISION.times(100),
        PRECISION.times(100)
      );
      userLeveragePool.setVtotalLiquidity(virtualLiquidityAmount2);
      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, PRECISION.times(80), 0);
      await policyBookMock.setTotalCoverTokens(coverTokensAmount1);

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      // check deployed virtual to the pool
      assert.equal((await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(), toWei("688062.5"));
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("688062.5"));

      assert.equal((await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(), toWei("688062.5"));

      assert.equal((await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal((await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(), 0);

      assert.equal(await policyBookMock.lastDistributionEpoch(), 1);

      await policyBookFacade.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

      assert.equal(
        toBN(await capitalPool.regularCoverageBalance(policyBookMock.address)).toString(),
        stblLiquidityAmount1
          .times(2)
          .plus(stblInitialDeposit)
          .plus(toBN(toWei("2.443056", "mwei")))
          .toString()
      );

      assert.equal(
        (await capitalPool.leveragePoolBalance(userLeveragePool.address)).toString(),
        toBN(toWei("5.556943", "mwei")).toString()
      );

      assert.equal((await capitalPool.reinsurancePoolBalance()).toString(), protocolPrice.idiv(10 ** 12).toString());

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        stblLiquidityAmount1
          .times(2)
          .plus(stblInitialDeposit.times(3))
          .plus(priceTotal.idiv(10 ** 12))
      );
    });

    it("should correctly add premium for coverage pool + RP protocol fee - with user leverage balances + RP virtual balance", async () => {
      // setup fot user leverage pool - 1 MM
      await policyBookAdmin.setLeveragePortfolioProtocolConstant(
        userLeveragePool.address,
        PRECISION.times(45),
        PRECISION.times(2),
        PRECISION.times(100),
        PRECISION.times(100)
      );
      userLeveragePool.setVtotalLiquidity(virtualLiquidityAmount2);
      reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount2);

      await policyBookAdmin.setPolicyBookFacadeMPLs(policyBookFacade.address, PRECISION.times(80), PRECISION.times(30));
      await policyBookMock.setTotalCoverTokens(coverTokensAmount1);

      await policyBookFacade.addLiquidity(liquidityAmount1, { from: USER1 });

      // check deployed virtual to the pool
      assert.equal(
        (await policyBookFacade.LUuserLeveragePool(userLeveragePool.address)).toString(),
        toWei("500409.090909090909090909")
      );
      assert.equal((await policyBookFacade.VUreinsurnacePool()).toString(), toWei("187653.40909090909090909"));

      assert.equal((await policyBookFacade.LUreinsurnacePool()).toString(), 0);

      assert.equal((await policyBookFacade.totalLeveragedLiquidity()).toString(), toWei("688062.499999999999999999"));

      assert.equal(
        (await userLeveragePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("500409.090909090909090909")
      );

      assert.equal(
        (await reinsurancePool.poolsLDeployedAmount(policyBookMock.address)).toString(),
        toWei("187653.40909090909090909")
      );

      assert.equal(
        (await reinsurancePool.poolsVDeployedAmount(policyBookMock.address)).toString(),
        toWei("187653.40909090909090909")
      );

      assert.equal(await policyBookMock.lastDistributionEpoch(), 1);

      await policyBookFacade.buyPolicy(epochsNumber, coverTokensAmount, { from: USER1 });

      assert.equal(
        toBN(await capitalPool.regularCoverageBalance(policyBookMock.address)).toString(),
        stblLiquidityAmount1
          .times(2)
          .plus(stblInitialDeposit)
          .plus(toBN(toWei("1.772971", "mwei")))
          .toString()
      );

      assert.equal(
        (await capitalPool.leveragePoolBalance(userLeveragePool.address)).toString(),
        toBN(toWei("2.932928", "mwei")).toString()
      );

      assert.equal(
        (await capitalPool.reinsurancePoolBalance()).toString(),
        protocolPrice
          .idiv(10 ** 12)
          .plus(toBN(toWei("3.2941", "mwei")))
          .toString()
      );

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        stblLiquidityAmount1
          .times(2)
          .plus(stblInitialDeposit.times(3))
          .plus(priceTotal.idiv(10 ** 12))
      );
    });
  });

  describe("liquidty cushion rebalancing", async () => {
    const stblAmount = toBN(toWei("100000", "mwei"));
    const liquidityAmount = toBN(toWei("10000"));
    const stblLiquidityAmount = toBN(toWei("10000", "mwei"));

    const amountToWithdraw = toBN(toWei("1000"));
    const stblAmountToWithdraw = toBN(toWei("1000", "mwei"));

    beforeEach("setup", async () => {
      await stbl.transfer(USER1, stblAmount);

      await stbl.approve(policyBookMock.address, stblAmount, { from: USER1 });

      await stbl.transfer(USER2, stblAmount);

      await stbl.approve(policyBookMock.address, stblAmount, { from: USER2 });

      await policyBookFacade.addLiquidity(liquidityAmount, { from: USER1 });
    });

    it("should successfully withdraw tokens", async () => {
      assert.equal(
        toBN(await policyBookMock.totalLiquidity()).toString(),
        liquidityAmount.plus(initialDeposit).toString()
      );

      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), stblAmount.minus(stblLiquidityAmount).toString());
      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        stblLiquidityAmount.plus(stblInitialDeposit.times(3)).toString()
      );

      // withdraw first time
      await policyBookMock.approve(policyBookMock.address, amountToWithdraw, { from: USER1 });
      await policyBookFacade.requestWithdrawal(amountToWithdraw, { from: USER1 });

      await capitalPool.rebalanceLiquidityCushion();
      // not include until before withdrawl time by 25 hr
      assert.equal(toBN(await capitalPool.liquidityCushionBalance()).toString(), 0);
      assert.equal(toBN(await capitalPool.hardUsdtAccumulatedBalance()).toString(), 0);
      assert.equal(toBN(await stbl.balanceOf(capitalPool.address)).toString(), 0);

      assert.equal(
        toBN(await yieldGenerator.totalDeposit()).toString(),
        stblLiquidityAmount.plus(stblInitialDeposit.times(3)).toString()
      );

      // increase time here
      await time.increaseTo(
        toBN(await time.latest())
          .plus(withdrawalPeriod.minus(24 * 60 * 60).plus(10))
          .toString()
      );
      await time.advanceBlock();

      const newCompoundExchangeReate = toBN(10).pow(10).times(21591);
      await cToken.setExchangeRateStored(newCompoundExchangeReate);

      await capitalPool.rebalanceLiquidityCushion();

      console.log((await capitalPool.isLiqCushionPaused()).toString());

      assert.equal(toBN(await capitalPool.liquidityCushionBalance()).toString(), stblAmountToWithdraw.toString());
      assert.equal(toBN(await capitalPool.hardUsdtAccumulatedBalance()).toString(), 0);
      assert.equal(toBN(await stbl.balanceOf(capitalPool.address)).toString(), stblAmountToWithdraw.toString());

      assert.equal(
        toBN(await yieldGenerator.totalDeposit()).toString(),
        stblLiquidityAmount.plus(stblInitialDeposit.times(3)).minus(stblAmountToWithdraw)
      );

      await time.increaseTo(
        toBN(await time.latest())
          .plus(24 * 60 * 60)
          .toString()
      );
      await time.advanceBlock();

      assert.equal(toBN(await policyBookMock.getWithdrawalStatus(USER1)).toString(), WithdrawalStatus.READY);

      let expectedWithdrawalAmount = await getSTBLAmount(amountToWithdraw);

      await policyBookFacade.withdrawLiquidity({ from: USER1 });

      assert.equal(
        toBN(await policyBookMock.totalLiquidity()).toString(),
        liquidityAmount.minus(expectedWithdrawalAmount).plus(initialDeposit).toString()
      );
      assert.equal(
        toBN(await policyBookMock.balanceOf(USER1)).toString(),
        liquidityAmount.minus(amountToWithdraw).toString()
      );

      assert.equal(toBN(await stbl.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(toBN(await capitalPool.liquidityCushionBalance()).toString(), 0);
      assert.equal(
        toBN(await stbl.balanceOf(USER1)).toString(),
        stblAmount.minus(stblLiquidityAmount).plus(stblAmountToWithdraw).toString()
      );
    });
  });
});
