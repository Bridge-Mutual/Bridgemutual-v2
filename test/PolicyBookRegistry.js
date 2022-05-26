const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyQuote = artifacts.require("PolicyQuote");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const CapitalPool = artifacts.require("CapitalPool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const ShieldMining = artifacts.require("ShieldMining");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const YieldGenerator = artifacts.require("YieldGenerator");

const PolicyBook = artifacts.require("PolicyBook");
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

contract("PolicyBookRegistry", async (accounts) => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const reverter = new Reverter(web3);

  let policyBookRegistry;
  let stbl;
  let policyBookFabric;
  let nftStaking;
  let policyBookAdmin;
  let policyBookFacade;
  let userLeveragePool;

  let network;

  const DISTRIBUTOR = accounts[2];
  const NON_FABRIC = accounts[3];
  const NOTHING = accounts[9];

  const PRECISION = toBN(10).pow(25);

  let initialDeposit, stblInitialDeposit;

  before("setup", async () => {
    network = await getNetwork();
    const contractsRegistry = await ContractsRegistry.new();
    if (network == Networks.ETH) {
      stbl = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stbl = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }

    const _capitalPool = await CapitalPool.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _policyQuote = await PolicyQuote.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _yieldGenerator = await YieldGenerator.new();

    const _reinsurancePool = await ReinsurancePool.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    const _policyBookImpl = await PolicyBook.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.PRICE_FEED_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REINSURANCE_POOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);

    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      _claimingRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_REGISTRY_NAME(), _policyRegistry.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_NAME(),
      _bmiCoverStaking.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
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
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);
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
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());

    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await rewardsGenerator.__RewardsGenerator_init();
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();
    await yieldGenerator.__YieldGenerator_init(network);

    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

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

    const tx = await policyBookFabric.createLeveragePools(NOTHING, ContractType.VARIOUS, "User Leverage Pool", "USDT");
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);

    initialDeposit = wei("1000");
    stblInitialDeposit = getStableAmount("1000");

    await stbl.approve(policyBookFabric.address, stblInitialDeposit);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("add", async () => {
    const CONTRACT = accounts[3];
    const BOOK1 = accounts[4];
    const FACADE1 = accounts[5];

    beforeEach("setup", async () => {
      initialDeposit = wei("1000");
      stblInitialDeposit = getStableAmount("1000");
    });

    it("should not allow not fabric to add", async () => {
      await truffleAssert.reverts(
        policyBookRegistry.add(CONTRACT, ContractType.CONTRACT, BOOK1, FACADE1, { from: NON_FABRIC }),
        "PolicyBookRegistry: Not a PolicyBookFabric"
      );
    });

    it("should not allow to add duplicate by the same address", async () => {
      await policyBookFabric.create(CONTRACT, ContractType.CONTRACT, "TestBook", "TB", initialDeposit, zeroAddress);
      await truffleAssert.reverts(
        policyBookFabric.create(CONTRACT, ContractType.CONTRACT, "TestBook", "TB", initialDeposit, zeroAddress),
        "PolicyBookRegistry: PolicyBook for the contract is already created"
      );
    });

    it("should increase count of books", async () => {
      assert.equal(await policyBookRegistry.count(), 1);
      await policyBookFabric.create(CONTRACT, ContractType.CONTRACT, "TestBook", "TB", initialDeposit, zeroAddress);
      assert.equal(await policyBookRegistry.count(), 2);
      assert.equal(await policyBookRegistry.countByType(ContractType.CONTRACT), 1);
    });

    it("should save policy book by address", async () => {
      assert.equal(await policyBookRegistry.policyBookFor(CONTRACT), zeroAddress);
      const policyBookAddr = (
        await policyBookFabric.create(CONTRACT, ContractType.CONTRACT, "TestBook", "TB", initialDeposit, zeroAddress)
      ).logs[0].args.at;
      assert.equal(await policyBookRegistry.policyBookFor(CONTRACT), policyBookAddr);
    });

    it("should save policy book", async () => {
      assert.deepEqual(await policyBookRegistry.list(0, 10), [userLeveragePool.address]);
      const policyBookAddr = (
        await policyBookFabric.create(CONTRACT, ContractType.CONTRACT, "TestBook", "TB", initialDeposit, zeroAddress)
      ).logs[0].args.at;
      assert.deepEqual(await policyBookRegistry.list(0, 10), [userLeveragePool.address, policyBookAddr]);
      assert.deepEqual(await policyBookRegistry.listByType(ContractType.CONTRACT, 0, 10), [policyBookAddr]);
    });
  });

  describe("buyPolicyBatch", async () => {
    const CONTRACT1 = accounts[3];
    const CONTRACT2 = accounts[4];

    beforeEach("setup", async () => {
      initialDeposit = wei("1000");
      stblInitialDeposit = getStableAmount("1000");
    });

    it.skip("should buy policy batch", async () => {
      // TODO on buyPolicyBatch function before calling buyPolicyFor() :
      // · transfer funds (getPolicyPrice) to address(this) for each purchase
      // · approve PolicyBook to spend address(this) funds

      await stbl.approve(policyBookFabric.address, 0);
      await stbl.approve(policyBookFabric.address, stblInitialDeposit);

      await policyBookFabric.create(CONTRACT1, ContractType.CONTRACT, "TestBook", "TB1", initialDeposit, zeroAddress);
      policyBook1 = await PolicyBook.at(await policyBookRegistry.policyBookFor(CONTRACT1));

      await policyBookFabric.create(CONTRACT2, ContractType.CONTRACT, "TestBook", "TB2", initialDeposit, zeroAddress);
      policyBook2 = await PolicyBook.at(await policyBookRegistry.policyBookFor(CONTRACT2));

      const policyBookFacadeAddress1 = await policyBook1.policyBookFacade();
      policyBookFacade1 = await PolicyBookFacade.at(policyBookFacadeAddress1);
      const policyBookFacadeAddress2 = await policyBook2.policyBookFacade();
      policyBookFacade2 = await PolicyBookFacade.at(policyBookFacadeAddress2);

      await stbl.approve(policyBook1.address, getStableAmount("5000"));
      await stbl.approve(policyBook2.address, getStableAmount("5000"));

      await policyBookFacade1.addLiquidity(wei("1000"));
      await policyBookFacade2.addLiquidity(wei("999"));

      await policyBookRegistry.buyPolicyBatch(
        [policyBook1.address, policyBook2.address],
        [5, 6],
        [wei("1000"), wei("999")]
      );

      const info1 = await policyBook1.userStats(accounts[0]);
      const info2 = await policyBook2.userStats(accounts[0]);

      assert.equal(toBN(info1.coverTokens).toString(), toBN(wei("1000")).toString());
      assert.equal(toBN(info2.coverTokens).toString(), toBN(wei("999")).toString());
    });
  });

  describe("listWithStats", async () => {
    const CONTRACT = accounts[3];

    beforeEach("setup", async () => {
      initialDeposit = wei("1000");
      stblInitialDeposit = getStableAmount("1000");
    });

    it("should return correct values", async () => {
      await stbl.approve(policyBookFabric.address, 0);
      await stbl.approve(policyBookFabric.address, stblInitialDeposit.times(2));

      await policyBookFabric.create(
        CONTRACT,
        ContractType.CONTRACT,
        "TestBook",
        "TB",
        toBN(initialDeposit).times(2),
        zeroAddress
      );
      const result = await policyBookRegistry.listWithStats(0, 2);

      assert.equal(result[0][1], await policyBookRegistry.policyBookFor(CONTRACT));
      assert.equal(result[1][1][0], "bmiV2TBCover");
      assert.equal(result[1][1][1], CONTRACT);
      assert.equal(result[1][1][2], ContractType.CONTRACT);
      assert.equal(toBN(result[1][1][3]).toString(), toBN(wei("2000")).toString());
      assert.equal(toBN(result[1][1][4]).toString(), toBN(wei("2000")).toString());
      assert.equal(result[1][1][5], 0);
      assert.equal(result[1][1][6], 0);
      assert.equal(result[1][1][7], 0);
      assert.equal(toBN(result[1][1][8]).toString(), toBN(wei("15.625")).toString());
      assert.equal(toBN(result[1][1][9]).toString(), toBN(wei("1")).toString());
      assert.equal(result[1][1][10], false);
    });
  });

  describe("listWithStatsByType", async () => {
    const CONTRACT = accounts[3];

    it("should return correct values", async () => {
      await policyBookFabric.create(CONTRACT, ContractType.CONTRACT, "TestBook", "TB", initialDeposit, zeroAddress);
      const result = await policyBookRegistry.listWithStatsByType(ContractType.CONTRACT, 0, 1);

      assert.equal(result[0][0], await policyBookRegistry.policyBookFor(CONTRACT));
      assert.equal(result[1][0][0], "bmiV2TBCover");
      assert.equal(result[1][0][1], CONTRACT);
      assert.equal(result[1][0][2], ContractType.CONTRACT);
      assert.equal(toBN(result[1][0][3]).toString(), toBN(wei("1000")).toString());
      assert.equal(toBN(result[1][0][4]).toString(), toBN(wei("1000")).toString());
      assert.equal(result[1][0][5], 0);
      assert.equal(result[1][0][6], 0);
      assert.equal(result[1][0][7], 0);
      assert.equal(toBN(result[1][0][8]).toString(), toBN(wei("100")).toString());
      assert.equal(toBN(result[1][0][9]).toString(), toBN(wei("1")).toString());
      assert.equal(result[1][0][10], false);
    });
  });

  describe("getBooks", async () => {
    const contracts = accounts.slice(3, 6);
    let bookAddresses;

    beforeEach("setup", async () => {
      initialDeposit = wei("1000");
      stblInitialDeposit = getStableAmount("1000");

      bookAddresses = [];
      for (let i = 0; i < 3; i++) {
        await stbl.approve(policyBookFabric.address, 0);
        await stbl.approve(policyBookFabric.address, initialDeposit);

        const policyBookAddr = (
          await policyBookFabric.create(
            contracts[i],
            ContractType.CONTRACT,
            "TestBook",
            "TB",
            initialDeposit,
            zeroAddress
          )
        ).logs[0].args.at;

        bookAddresses.push(policyBookAddr);
      }
    });

    it("should return valid if inside range", async () => {
      const result1 = await policyBookRegistry.list(0, 4);
      const result2 = await policyBookRegistry.listByType(ContractType.CONTRACT, 0, 4);
      const result3 = await policyBookRegistry.listByType(ContractType.STABLECOIN, 0, 4);

      assert.deepEqual(result1.slice(1, 4), bookAddresses);
      assert.deepEqual(result1.slice(1, 4), result2);
      assert.deepEqual(result3, []);
    });

    it("should return valid longer than range", async () => {
      const result1 = await policyBookRegistry.list(1, 3);
      const result2 = await policyBookRegistry.listByType(ContractType.CONTRACT, 0, 3);
      const result3 = await policyBookRegistry.listByType(ContractType.STABLECOIN, 0, 3);

      assert.deepEqual(result1, bookAddresses);
      assert.deepEqual(result1, result2);
      assert.deepEqual(result3, []);
    });

    it("should return valid longer than range", async () => {
      const result1 = await policyBookRegistry.list(3, 10);
      const result2 = await policyBookRegistry.listByType(ContractType.CONTRACT, 3, 10);
      const result3 = await policyBookRegistry.listByType(ContractType.STABLECOIN, 3, 10);

      assert.deepEqual(result1.slice(1, 10), []);
      assert.deepEqual(result1.slice(1, 10), result2);
      assert.deepEqual(result3, []);
    });
  });
});
