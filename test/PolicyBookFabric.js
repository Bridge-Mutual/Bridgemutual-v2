const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const STBLMock = artifacts.require("STBLMock");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const LiquidityMiningMock = artifacts.require("LiquidityMiningMock");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const NFTStaking = artifacts.require("NFTStaking");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");

const PolicyRegistry = artifacts.require("PolicyRegistry");
const PolicyQuote = artifacts.require("PolicyQuote");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const CapitalPool = artifacts.require("CapitalPool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const ShieldMining = artifacts.require("ShieldMining");
const UserLeveragePool = artifacts.require("UserLeveragePool");

const PolicyBook = artifacts.require("PolicyBook");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");

const Reverter = require("./helpers/reverter");
const { setCurrentTime } = require("./helpers/utils");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");
const { assert } = require("chai");
const { init } = require("events");

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

contract("PolicyBookFabric", async (accounts) => {
  const reverter = new Reverter(web3);

  let policyBookRegistry;
  let policyBookFabric;
  let stbl;
  let liquidityMiningMock;
  let capitalPool;

  const CONTRACT1 = accounts[0];
  const CONTRACT2 = accounts[1];
  const CONTRACT3 = accounts[2];

  const TOKEN = "0x0000000000000000000000000000000000000000";

  const NOTHING = accounts[9];

  const LIQUIDITY_MINING_DURATION = toBN(60 * 60 * 24 * 7 * 2); // 2 weeks

  before("setup", async () => {
    const contractsRegistry = await ContractsRegistry.new();
    stbl = await STBLMock.new("stbl", "stbl", 6);

    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _liquidityMiningMock = await LiquidityMiningMock.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _nftStaking = await NFTStaking.new();

    const _policyRegistry = await PolicyRegistry.new();
    const _policyQuote = await PolicyQuote.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    const _policyBookImpl = await PolicyBook.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.PRICE_FEED_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REINSURANCE_POOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CLAIMING_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_QUOTE_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LEGACY_REWARDS_GENERATOR_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.YIELD_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);

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
      await contractsRegistry.LIQUIDITY_REGISTRY_NAME(),
      _liquidityRegistry.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_NAME(),
      _bmiCoverStaking.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_NAME(),
      _liquidityMiningMock.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGenerator.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.NFT_STAKING_NAME(), _nftStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_REGISTRY_NAME(), _policyRegistry.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      _claimingRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );

    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    liquidityMiningMock = await LiquidityMiningMock.at(await contractsRegistry.getLiquidityMiningContract());
    const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());

    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());

    await liquidityMiningMock.__LiquidityMining_init();
    await rewardsGenerator.__RewardsGenerator_init();

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("create", async () => {
    const initialDeposit = wei("1000");

    beforeEach("setup", async () => {
      await setCurrentTime(1);

      await liquidityMiningMock.startLiquidityMining();

      await setCurrentTime(LIQUIDITY_MINING_DURATION.plus(100));

      await stbl.approve(policyBookFabric.address, toBN(initialDeposit).times(2));
    });

    it("should instantiate contract at saved address", async () => {
      await policyBookFabric.create(
        CONTRACT1,
        ContractType.STABLECOIN,
        "Test description",
        "TEST",
        initialDeposit,
        TOKEN
      );
      const address = await policyBookRegistry.policyBookFor(CONTRACT1);
      const book = await PolicyBook.at(address);

      assert.equal(await book.insuranceContractAddress(), CONTRACT1);
      assert.equal(await book.contractType(), ContractType.STABLECOIN);
      assert.equal(await book.name(), "Test description");
      assert.equal(await book.symbol(), "bmiV2TESTCover");
    });

    it("should emit created event", async () => {
      const result = await policyBookFabric.create(
        CONTRACT1,
        ContractType.STABLECOIN,
        "placeholder",
        "placeholder",
        initialDeposit,
        TOKEN
      );
      const address = await policyBookRegistry.policyBookFor(CONTRACT1);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, "Created");
      assert.equal(result.logs[0].args.insured, CONTRACT1);
      assert.equal(result.logs[0].args.contractType, ContractType.STABLECOIN);
      assert.equal(result.logs[0].args.at, address);
    });

    it("should not allow to create dublicate by the same address", async () => {
      await policyBookFabric.create(
        CONTRACT1,
        ContractType.STABLECOIN,
        "placeholder",
        "placeholder",
        initialDeposit,
        TOKEN
      );
      await truffleAssert.reverts(
        policyBookFabric.create(
          CONTRACT1,
          ContractType.STABLECOIN,
          "placeholder",
          "placeholder",
          initialDeposit,
          TOKEN
        ),
        "PolicyBook for the contract is already created"
      );
    });

    it("should add policy to registry", async () => {
      const result = await policyBookFabric.create(CONTRACT1, 1, "placeholder", "placeholder", initialDeposit, TOKEN);
      const bookAddress = result.logs[0].args.at;

      assert.equal(await policyBookRegistry.policyBookFor(CONTRACT1), bookAddress);
    });

    it("should increase count of books", async () => {
      assert.equal(await policyBookRegistry.count(), 0);

      await policyBookFabric.create(
        CONTRACT1,
        ContractType.STABLECOIN,
        "placeholder",
        "placeholder",
        initialDeposit,
        TOKEN
      );

      assert.equal(await policyBookRegistry.count(), 1);
    });

    it("should not allow to create with initial liquidity < 1000 STBL", async () => {
      await truffleAssert.reverts(
        policyBookFabric.create(CONTRACT1, ContractType.STABLECOIN, "placeholder", "placeholder", wei("10"), TOKEN),
        "PBF: Too small deposit"
      );
    });

    it("should create with initial liquidity = 9999 STBL", async () => {
      await stbl.approve(policyBookFabric.address, 0);
      await stbl.approve(policyBookFabric.address, wei("9999"));

      const result = await policyBookFabric.create(
        CONTRACT1,
        ContractType.STABLECOIN,
        "placeholder",
        "placeholder",
        wei("9999"),
        TOKEN
      );
      const policyBook = await PolicyBook.at(result.logs[0].args.at);

      assert.equal(toBN(await policyBook.totalLiquidity()).toString(), toBN(wei("9999")).toString());
    });

    it("should get exception, Project description is too long", async () => {
      const longDesc = "a".repeat(201);
      const reason = "PBF: Project description is too long";

      await truffleAssert.reverts(
        policyBookFabric.create(CONTRACT1, 1, longDesc, "placeholder", initialDeposit, TOKEN),
        reason
      );
    });

    it("should allow to create with Project descriptions within length", async () => {
      const shortDesc = "";
      const maxLenghtDesc = "a".repeat(200);

      const reason = "PBF: Project description is too long";

      await truffleAssert.passes(
        policyBookFabric.create(CONTRACT1, 1, shortDesc, "placeholder", initialDeposit, TOKEN),
        reason
      );
      await stbl.approve(policyBookFabric.address, 0);
      await stbl.approve(policyBookFabric.address, initialDeposit);
      await truffleAssert.passes(
        policyBookFabric.create(CONTRACT2, 1, maxLenghtDesc, "placeholder", initialDeposit, TOKEN),
        reason
      );
    });

    it("should get exception, Project Symbol is too long, or short", async () => {
      const shortSymbol = "";
      const maxLenghtSymbol = "a".repeat(30);
      const longSymbol = "a".repeat(31);

      const reason = "PBF: Project symbol is too long/short";
      await truffleAssert.reverts(
        policyBookFabric.create(CONTRACT1, 1, "placeholder", shortSymbol, initialDeposit, TOKEN),
        reason
      );
      await truffleAssert.reverts(
        policyBookFabric.create(CONTRACT1, 1, "placeholder", longSymbol, initialDeposit, TOKEN),
        reason
      );
      await truffleAssert.passes(
        policyBookFabric.create(CONTRACT1, 1, "placeholder", maxLenghtSymbol, initialDeposit, TOKEN),
        reason
      );
    });

    it("should transfer token to capitalPool", async () => {
      await policyBookFabric.create(CONTRACT1, 1, "placeholder", "symbol", initialDeposit, TOKEN);
      assert.equal((await stbl.balanceOf(capitalPool.address)).toString(), 1 * 10 ** 9);
    });
  });

  describe("create with LME", async () => {
    const initialDeposit = wei("1000");

    beforeEach("setup", async () => {
      await stbl.approve(policyBookFabric.address, toBN(initialDeposit));
    });
    it("should create PolicyBook before LME for free", async () => {
      await truffleAssert.passes(
        policyBookFabric.create(CONTRACT1, 1, "placeholder", "placeholder", initialDeposit, TOKEN),
        "Should create with 0 deposit when LME has not started"
      );
    });

    it("should fail to create during LME", async () => {
      await setCurrentTime(1);

      await liquidityMiningMock.startLiquidityMining();

      await stbl.approve(policyBookFabric.address, 0);
      await stbl.approve(policyBookFabric.address, wei("1000"));

      await truffleAssert.reverts(
        policyBookFabric.create(CONTRACT1, ContractType.STABLECOIN, "", "placeholder", wei("1000"), TOKEN),
        "PBF: Creation is blocked during LME"
      );
    });

    it("should create after LME", async () => {
      await setCurrentTime(1);

      await liquidityMiningMock.startLiquidityMining();

      await setCurrentTime(LIQUIDITY_MINING_DURATION.plus(100));

      await stbl.approve(policyBookFabric.address, 0);
      await stbl.approve(policyBookFabric.address, wei("1000"));

      await policyBookFabric.create(CONTRACT1, ContractType.STABLECOIN, "", "placeholder", wei("1000"), TOKEN);
    });
  });

  describe("getBooks", async () => {
    let bookAddrArr;

    beforeEach("setup", async () => {
      const initialDeposit = wei("1000");

      await stbl.approve(policyBookFabric.address, toBN(initialDeposit).times(3));

      await setCurrentTime(1);

      await liquidityMiningMock.startLiquidityMining();

      await setCurrentTime(LIQUIDITY_MINING_DURATION.plus(100));

      const book1 = await policyBookFabric.create(
        CONTRACT1,
        ContractType.SERVICE,
        "placeholder",
        "placeholder",
        initialDeposit,
        TOKEN
      );
      const book2 = await policyBookFabric.create(
        CONTRACT2,
        ContractType.STABLECOIN,
        "placeholder",
        "placeholder",
        initialDeposit,
        TOKEN
      );
      const book3 = await policyBookFabric.create(
        CONTRACT3,
        ContractType.CONTRACT,
        "placeholder",
        "placeholder",
        initialDeposit,
        TOKEN
      );

      assert.equal(await policyBookRegistry.count(), 3);
      bookAddrArr = [book1.logs[0].args.at, book2.logs[0].args.at, book3.logs[0].args.at];
    });

    it("should return valid if inside range", async () => {
      const result = await policyBookRegistry.list(0, 3);
      assert.deepEqual(result, bookAddrArr);
    });

    it("should return valid longer than range", async () => {
      const result = await policyBookRegistry.list(1, 3);
      assert.deepEqual(result, bookAddrArr.slice(1, 3));
    });

    it("should return valid outside of range", async () => {
      const result = await policyBookRegistry.list(3, 10);
      assert.deepEqual(result, []);
    });
  });
});
