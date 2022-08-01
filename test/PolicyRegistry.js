const ContractsRegistry = artifacts.require("ContractsRegistry");
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
const CapitalPool = artifacts.require("CapitalPool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const NFTStaking = artifacts.require("NFTStaking");
const ShieldMining = artifacts.require("ShieldMining");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const YieldGenerator = artifacts.require("YieldGenerator");

const PolicyBook = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const UserLeveragePool = artifacts.require("UserLeveragePool");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");
const { assert } = require("chai");
const { time } = require("@openzeppelin/test-helpers");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

const ContractType = {
  CONTRACT: 0,
  STABLECOIN: 1,
  SERVICE: 2,
  EXCHANGE: 3,
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

contract("PolicyRegistry", async (accounts) => {
  const reverter = new Reverter(web3);

  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const insuranceContract = accounts[3];
  const PBF = accounts[4];
  const BOOK1 = accounts[5];
  const BOOK2 = accounts[6];
  const BOOK3 = accounts[7];
  const PBFacade = accounts[9];
  const NOTHING = accounts[9];

  const oneWeek = toBN(7).times(24).times(60).times(60);

  const PRECISION = toBN(10).pow(25);

  let policyRegistry;
  let policyBookRegistry;
  let stbl;
  let network;

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

    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyQuote = await PolicyQuote.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _nftStaking = await NFTStaking.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _yieldGenerator = await YieldGenerator.new();

    const _policyBookImpl = await PolicyBook.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);

    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_ADMIN_NAME(), PBFacade);
    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), PBFacade);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_FABRIC_NAME(), PBF);
    await contractsRegistry.addContract(await contractsRegistry.PRICE_FEED_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

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
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
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
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    const capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());

    await claimingRegistry.__ClaimingRegistry_init();
    await rewardsGenerator.__RewardsGenerator_init(network);
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("isPolicyValid", async () => {
    const durationSeconds = toBN(1000000);
    const premium = toBN(wei("5000"));
    const coverAmount = toBN(wei("100000"));

    beforeEach("setup state", async () => {
      await policyBookRegistry.add(BOOK1, ContractType.CONTRACT, BOOK1, PBFacade, { from: PBF });
      await policyBookRegistry.add(BOOK2, ContractType.CONTRACT, BOOK2, PBFacade, { from: PBF });

      await setCurrentTime(1);
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 });
    });

    it("should return true if user have active policy", async () => {
      assert.equal(await policyRegistry.isPolicyValid(USER1, BOOK1), true);
    });

    it("should return false if user policy expires", async () => {
      await setCurrentTime(durationSeconds.plus(10));
      assert.equal(await policyRegistry.isPolicyValid(USER1, BOOK1), false);
    });

    it("should return false if user do not have a policy", async () => {
      assert.equal(await policyRegistry.isPolicyValid(USER1, BOOK2), false);
    });
  });

  describe("isPolicyActive", async () => {
    const durationSeconds = toBN(1000000);
    const premium = toBN(wei("5000"));
    const coverAmount = toBN(wei("100000"));

    beforeEach("setup state", async () => {
      await policyBookRegistry.add(BOOK1, ContractType.CONTRACT, BOOK1, PBFacade, { from: PBF });
      await policyBookRegistry.add(BOOK2, ContractType.CONTRACT, BOOK2, PBFacade, { from: PBF });

      await setCurrentTime(1);
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 });
    });

    it("should return true if user have active policy", async () => {
      assert.equal(await policyRegistry.isPolicyActive(USER1, BOOK1), true);
    });

    it("should return false if user policy ended", async () => {
      await setCurrentTime(durationSeconds.plus(10));
      assert.equal(await policyRegistry.isPolicyActive(USER1, BOOK1), true);
      await setCurrentTime(durationSeconds.plus(oneWeek).plus(10));
      assert.equal(await policyRegistry.isPolicyActive(USER1, BOOK1), false);
    });

    it("should return false if user do not have a policy", async () => {
      assert.equal(await policyRegistry.isPolicyActive(USER1, BOOK2), false);
    });
  });

  describe("isPolicyExist", async () => {
    const durationSeconds = toBN(1000000);
    const premium = toBN(wei("5000"));
    const coverAmount = toBN(wei("100000"));

    beforeEach("setup state", async () => {
      await policyBookRegistry.add(BOOK1, ContractType.CONTRACT, BOOK1, PBFacade, { from: PBF });
      await policyBookRegistry.add(BOOK2, ContractType.CONTRACT, BOOK2, PBFacade, { from: PBF });

      await setCurrentTime(1);
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 });
    });

    it("should return true if user have a policy", async () => {
      assert.equal(await policyRegistry.policyExists(USER1, BOOK1), true);
    });

    it("should return false if user do not have a policy", async () => {
      assert.equal(await policyRegistry.policyExists(USER1, BOOK2), false);
    });
  });

  describe("getPoliciesInfo", async () => {
    const durationSeconds = toBN(10000);
    const premium = toBN(wei("5000"));
    const coverAmount = toBN(wei("100000"));

    beforeEach("setup state", async () => {
      await policyBookRegistry.add(BOOK1, ContractType.CONTRACT, BOOK1, PBFacade, { from: PBF });
      await policyBookRegistry.add(BOOK2, ContractType.CONTRACT, BOOK2, PBFacade, { from: PBF });
      await policyBookRegistry.add(BOOK3, ContractType.CONTRACT, BOOK3, PBFacade, { from: PBF });

      await setCurrentTime(1);
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 });
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds.times(2), { from: BOOK2 });
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds.times(3), { from: BOOK3 });

      const policies = (await policyRegistry.getPoliciesInfo(USER1, true, 0, 10))[1];
      assert.deepEqual(policies, [BOOK1, BOOK2, BOOK3]);

      assert.equal(toBN(await policyRegistry.getPoliciesLength(USER1)).toString(), 3);
    });

    it("should return the correct list of active policies", async () => {
      let size = await policyRegistry.getPoliciesLength(USER1);
      let resultArr = await policyRegistry.getPoliciesInfo(USER1, true, 0, size);

      assert.equal(resultArr[0], 3);
      assert.deepEqual(resultArr[1], [BOOK1, BOOK2, BOOK3]);

      await setCurrentTime(durationSeconds.times(2).plus(oneWeek).plus(10));

      size = await policyRegistry.getPoliciesLength(USER1);
      resultArr = await policyRegistry.getPoliciesInfo(USER1, true, 0, size);

      assert.equal(resultArr[0].toString(), 1);
      assert.equal(resultArr[1][0], BOOK3);
      assert.equal(resultArr[3][0], ClaimStatus.CAN_CLAIM);
    });

    it("should return the correct list of inactive policies", async () => {
      let size = await policyRegistry.getPoliciesLength(USER1);
      let resultArr = await policyRegistry.getPoliciesInfo(USER1, false, 0, size);

      assert.equal(resultArr[0], 0);

      await setCurrentTime(durationSeconds.times(2).plus(oneWeek).plus(10));

      size = await policyRegistry.getPoliciesLength(USER1);
      resultArr = await policyRegistry.getPoliciesInfo(USER1, false, 0, size);

      assert.equal(resultArr[0].toString(), 2);
      assert.equal(resultArr[1][0], BOOK1);
      assert.equal(resultArr[1][1], BOOK2);

      await setCurrentTime(durationSeconds.times(3).plus(oneWeek).plus(10));

      size = await policyRegistry.getPoliciesLength(USER1);
      resultArr = await policyRegistry.getPoliciesInfo(USER1, false, 0, size);

      assert.equal(resultArr[0], 3);
      assert.deepEqual(resultArr[1], [BOOK1, BOOK2, BOOK3]);
    });

    it("should return an empty list if the user does not have a policy", async () => {
      let size = await policyRegistry.getPoliciesLength(USER2);
      let result = await policyRegistry.getPoliciesInfo(USER2, true, 0, size);
      assert.equal(result[0], 0);

      size = await policyRegistry.getPoliciesLength(USER2);
      result = await policyRegistry.getPoliciesInfo(USER2, false, 0, size);
      assert.equal(result[0], 0);
    });
  });

  describe("addPolicy", async () => {
    const durationSeconds = toBN(1000000);
    const premium = toBN(wei("5000"));
    const coverAmount = toBN(wei("100000"));

    beforeEach("setup state", async () => {
      await policyBookRegistry.add(insuranceContract, ContractType.CONTRACT, BOOK1, PBFacade, { from: PBF });
    });

    it("should emit correct event", async () => {
      await setCurrentTime(1);
      const result = await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 });

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, "PolicyAdded");
      assert.equal(result.logs[0].args._userAddr, USER1);
      assert.equal(result.logs[0].args._policyBook, BOOK1);
      assert.equal(toBN(result.logs[0].args._coverAmount).toString(), coverAmount.toString());
    });

    it("should set correct values", async () => {
      await setCurrentTime(1);
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 });

      const resultArr = await policyRegistry.getPoliciesInfo(USER1, true, 0, 10);
      assert.deepEqual(resultArr[1], [BOOK1]);

      const policyInfo = resultArr[2][0];

      assert.equal(toBN(policyInfo.coverAmount).toString(), coverAmount.toString());
      assert.equal(toBN(policyInfo.premium).toString(), premium.toString());
      assert.equal(toBN(policyInfo.startTime).toString(), (await time.latest()).toString());
      assert.equal(toBN(policyInfo.endTime).toString(), durationSeconds.plus(await time.latest()).toString());
    });

    it("should correct add several policies", async () => {
      await setCurrentTime(1);
      const insuranceContract1 = accounts[6];
      await policyBookRegistry.add(insuranceContract1, ContractType.CONTRACT, BOOK1, PBFacade, { from: PBF });

      const insuranceContract2 = accounts[7];
      await policyBookRegistry.add(insuranceContract2, ContractType.CONTRACT, BOOK2, PBFacade, { from: PBF });

      await setCurrentTime(10);
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 });
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK2 });

      const policies = (await policyRegistry.getPoliciesInfo(USER1, true, 0, 10))[1];
      assert.deepEqual(policies, [BOOK1, BOOK2]);
    });

    it("should get exception, policy already exists", async () => {
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 });

      const reason = "The policy already exists";
      await truffleAssert.reverts(
        policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 }),
        reason
      );
    });
  });

  describe("removePolicy", async () => {
    const durationSeconds = toBN(1000000);
    const premium = toBN(wei("5000"));
    const coverAmount = toBN(wei("100000"));

    beforeEach("setup state", async () => {
      await policyBookRegistry.add(BOOK1, ContractType.CONTRACT, BOOK1, PBFacade, { from: PBF });
      await policyBookRegistry.add(BOOK2, ContractType.CONTRACT, BOOK2, PBFacade, { from: PBF });
      await policyBookRegistry.add(BOOK3, ContractType.CONTRACT, BOOK3, PBFacade, { from: PBF });

      await setCurrentTime(1);
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK1 });
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK2 });
      await policyRegistry.addPolicy(USER1, coverAmount, premium, durationSeconds, { from: BOOK3 });

      const policies = (await policyRegistry.getPoliciesInfo(USER1, true, 0, 10))[1];

      assert.deepEqual(policies, [BOOK1, BOOK2, BOOK3]);
      assert.equal(toBN(await policyRegistry.getPoliciesLength(USER1)).toString(), 3);
    });

    it("should correctly remove last element in the list", async () => {
      await policyRegistry.removePolicy(USER1, { from: BOOK3 });
      assert.equal(toBN(await policyRegistry.getPoliciesLength(USER1)).toString(), 2);
    });

    it("should emit correct event", async () => {
      const result = await policyRegistry.removePolicy(USER1, { from: BOOK3 });
      assert.equal(toBN(await policyRegistry.getPoliciesLength(USER1)).toString(), 2);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, "PolicyRemoved");
      assert.equal(result.logs[0].args._userAddr, USER1);
      assert.equal(result.logs[0].args._policyBook, BOOK3);
    });

    it("should correctly remove an item from the center of the list ", async () => {
      await policyRegistry.removePolicy(USER1, { from: BOOK1 });
      assert.equal(toBN(await policyRegistry.getPoliciesLength(USER1)).toString(), 2);

      const policies = (await policyRegistry.getPoliciesInfo(USER1, true, 0, 10))[1];
      assert.deepEqual(policies, [BOOK3, BOOK2]);
    });

    it("should get exception, policy already exists", async () => {
      const BOOK4 = accounts[8];
      await policyBookRegistry.add(BOOK4, ContractType.CONTRACT, BOOK4, PBFacade, { from: PBF });

      const reason = "This policy is not on the list";
      await truffleAssert.reverts(policyRegistry.removePolicy(USER1, { from: BOOK4 }), reason);
    });
  });
});
