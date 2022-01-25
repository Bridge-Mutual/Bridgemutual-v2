const STBLMock = artifacts.require("STBLMock");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const ClaimingRegistryMock = artifacts.require("ClaimingRegistryMock");
const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyRegistryMock = artifacts.require("PolicyRegistryMock");
const PolicyBook = artifacts.require("PolicyBook");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyQuote = artifacts.require("PolicyQuote");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const LiquidityMining = artifacts.require("LiquidityMining");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const CapitalPool = artifacts.require("CapitalPool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const ShieldMining = artifacts.require("ShieldMining");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const UserLeveragePool = artifacts.require("UserLeveragePool");

const BigNumber = require("bignumber.js");
const { assert } = require("chai");
const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");
const truffleAssert = require("truffle-assertions");

const ClaimStatus = {
  CAN_CLAIM: 0,
  UNCLAIMABLE: 1,
  PENDING: 2,
  AWAITING_CALCULATION: 3,
  REJECTED_CAN_APPEAL: 4,
  REJECTED: 5,
  ACCEPTED: 6,
};

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

contract("ClaimingRegistry", async (accounts) => {
  let stblMock;
  let claimingRegistryMock;
  let policyRegistryMock;
  let policyBookAdmin;
  let nftStaking;

  const USER1 = accounts[0];
  const USER2 = accounts[1];
  const INSURED1 = accounts[2];
  const INSURED2 = accounts[3];
  const TOKEN1 = "0x0000000000000000000000000000000000000000";
  const TOKEN2 = "0x0000000000000000000000000000000000000000";
  const CLAIM_VOTING = accounts[6];
  const NOTHING = accounts[9];

  let policyBook1;
  let policyBook2;

  beforeEach("setup", async () => {
    const contractsRegistry = await ContractsRegistry.new();
    const _policyBookImpl = await PolicyBook.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _policyQuote = await PolicyQuote.new();
    const _claimingRegistryMock = await ClaimingRegistryMock.new();
    const _policyRegistryMock = await PolicyRegistryMock.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _liquidityMining = await LiquidityMining.new();
    stblMock = await STBLMock.new("stblMock", "stblMock", 6);
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.PRICE_FEED_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REINSURANCE_POOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LEGACY_REWARDS_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.YIELD_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), CLAIM_VOTING);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblMock.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGenerator.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(),
      _policyBookRegistry.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_FABRIC_NAME(),
      _policyBookFabric.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      _claimingRegistryMock.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_REGISTRY_NAME(),
      _policyRegistryMock.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_REGISTRY_NAME(),
      _liquidityRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.LIQUIDITY_MINING_NAME(), _liquidityMining.address);
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
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );

    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    const liquidityMining = await LiquidityMining.at(await contractsRegistry.getLiquidityMiningContract());
    policyRegistryMock = await PolicyRegistryMock.at(await contractsRegistry.getPolicyRegistryContract());
    claimingRegistryMock = await ClaimingRegistryMock.at(await contractsRegistry.getClaimingRegistryContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());

    await rewardsGenerator.__RewardsGenerator_init();
    await claimingRegistryMock.__ClaimingRegistry_init();
    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await liquidityMining.__LiquidityMining_init();
    await nftStaking.__NFTStaking_init();
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await policyBookFabric.__PolicyBookFabric_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());

    const initialDeposit = wei("1000");

    await stblMock.approve(policyBookFabric.address, wei("2000"));

    await setCurrentTime(1);

    let tx1 = await policyBookFabric.create(INSURED1, ContractType.STABLECOIN, "mock1", "1", initialDeposit, TOKEN1);
    const policyBookAddress1 = tx1.logs[0].args.at;
    policyBook1 = await PolicyBook.at(policyBookAddress1);
    const policyBookFacadeAddress1 = await policyBook1.policyBookFacade();
    policyBookFacade1 = await PolicyBookFacade.at(policyBookFacadeAddress1);

    await setCurrentTime(1);

    let tx2 = await policyBookFabric.create(INSURED2, ContractType.STABLECOIN, "mock2", "1", initialDeposit, TOKEN2);
    const policyBookAddress2 = tx2.logs[0].args.at;
    policyBook2 = await PolicyBook.at(policyBookAddress2);
    const policyBookFacadeAddress2 = await policyBook2.policyBookFacade();
    policyBookFacade2 = await PolicyBookFacade.at(policyBookFacadeAddress2);

    const tx = await policyBookFabric.createLeveragePools(ContractType.VARIOUS, "User Leverage Pool", "USDT");
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await policyRegistryMock.setPolicyEndTime(USER1, policyBook1.address, toBN(365).times(24).times(60).times(60));
    await policyRegistryMock.setPolicyEndTime(USER1, policyBook2.address, toBN(365).times(24).times(60).times(60));
    await policyRegistryMock.setPolicyEndTime(USER2, policyBook1.address, toBN(365).times(24).times(60).times(60));
    await policyRegistryMock.setPolicyEndTime(USER2, policyBook2.address, toBN(365).times(24).times(60).times(60));
  });

  describe("submitClaim()", async () => {
    it("should submit new claim", async () => {
      let claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 0);

      await setCurrentTime(1);

      const res = await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, {
        from: CLAIM_VOTING,
      });
      const id = res.logs[0].args.claimIndex;

      console.log("SubmitClaim gas used: " + res.receipt.gasUsed);

      assert.equal(id, 1);

      claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 1);

      assert.equal(await claimingRegistryMock.claimExists(id), true);
      assert.equal(await claimingRegistryMock.hasClaim(USER1, policyBook1.address), true);
      assert.equal(await claimingRegistryMock.isClaimAnonymouslyVotable(id), true);
      assert.equal(await claimingRegistryMock.isClaimExposablyVotable(id), false);
      assert.equal(await claimingRegistryMock.isClaimPending(id), true);
      assert.equal(await claimingRegistryMock.countPendingClaims(), 1);
      assert.equal(await claimingRegistryMock.countClaims(), 1);
      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.PENDING);

      await setCurrentTime(toBN(await claimingRegistryMock.anonymousVotingDuration(id)).plus(10));

      assert.equal(await claimingRegistryMock.isClaimAnonymouslyVotable(id), false);
      assert.equal(await claimingRegistryMock.isClaimExposablyVotable(id), true);
    });

    it("shouldn't submit second identical claim", async () => {
      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING })
      ).logs[0].args.claimIndex;

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", 0, false, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );

      await policyBookAdmin.updateImageUriOfClaim(id, "placeholder2");

      claim = await claimingRegistryMock.claimInfo(id);
      assert.equal(claim[2], "placeholder2");

      //should fail even after changing evidenceUri
      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", 0, false, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("should submit two claims", async () => {
      let claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 0);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });
      await claimingRegistryMock.submitClaim(USER1, policyBook2.address, "", 0, false, { from: CLAIM_VOTING });

      claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 2);
    });

    it("should submit claims for different users", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });
      await claimingRegistryMock.submitClaim(USER2, policyBook2.address, "", 0, false, { from: CLAIM_VOTING });

      let claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 1);

      claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER2);

      assert.equal(claimsCount, 1);
    });

    it("should make claim AWAITING_CALCULATION", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING })
      ).logs[0].args.claimIndex;
      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.PENDING);

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.AWAITING_CALCULATION);
    });

    it("shouldn't submit appeal at first", async () => {
      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't submit appeal on PENDING claim", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't submit appeal on ACCEPTED claim", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.ACCEPTED);

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't submit appeal on AWAITING_CALCULATION claim", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.AWAITING_CALCULATION);

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("should submit appeal on REJECTED_CAN_APPEAL claim", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      assert.equal(await claimingRegistryMock.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.claimStatus(2), ClaimStatus.PENDING);
      assert.equal(await claimingRegistryMock.isClaimAppeal(2), true);

      assert.equal(await claimingRegistryMock.claimStatus(1), ClaimStatus.REJECTED);
    });

    it("shouldn't submit appeal on appeal", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING });

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't submit claim on PENDING appeal", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING });

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("should be able to submit claim on REJECTED appeal", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.claimStatus(3), ClaimStatus.PENDING);
      assert.equal(await claimingRegistryMock.isClaimAppeal(3), false);
    });

    it("shouldn't be able to submit claim on ACCEPTED appeal", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, true, { from: CLAIM_VOTING });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.ACCEPTED);

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });
  });

  describe("acceptClaim()", async () => {
    const epochsNumber = toBN(5);
    const coverTokensAmount = wei("1000");
    const stblAmount = wei("10000");
    const liquidityAmount = wei("5000");

    it("should not accept not AWAITING_CALCULATION claim", async () => {
      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING })
      ).logs[0].args.claimIndex;

      await truffleAssert.reverts(
        claimingRegistryMock.acceptClaim(id, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claim is not awaiting"
      );
    });

    it("should accept the claim", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      const res = await claimingRegistryMock.acceptClaim(id, { from: CLAIM_VOTING });

      console.log("AcceptClaim gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      assert.equal(res.logs.length, 1);
      assert.equal(res.logs[0].event, "ClaimAccepted");
    });
  });

  describe("rejectClaim()", async () => {
    it("should not reject not AWAITING_CALCULATION claim", async () => {
      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING })
      ).logs[0].args.claimIndex;

      await truffleAssert.reverts(
        claimingRegistryMock.rejectClaim(id, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claim is not awaiting"
      );
    });

    it("should reject the claim", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      const res = await claimingRegistryMock.rejectClaim(id, { from: CLAIM_VOTING });

      console.log("RejectClaim gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.REJECTED_CAN_APPEAL);

      assert.equal(res.logs.length, 1);
      assert.equal(res.logs[0].event, "ClaimRejected");
    });

    it("should reject the claim even if image uri is updated", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      await policyBookAdmin.updateImageUriOfClaim(id, "placeholder2");

      const res = await claimingRegistryMock.rejectClaim(id, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.REJECTED_CAN_APPEAL);
    });
  });

  describe("claimInfo()", async () => {
    it("should fail due to unexisting index", async () => {
      await truffleAssert.reverts(claimingRegistryMock.claimInfo(1), "ClaimingRegistry: This claim doesn't exist");
    });

    it("should return valid claim info", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", 0, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      const claim = await claimingRegistryMock.claimInfo(id);

      assert.equal(claim[0], USER1);
      assert.equal(claim[1], policyBook1.address);
      assert.equal(claim[2], "placeholder");
      assert.equal(claim[3], 1);
      assert.equal(claim[4], false);
      assert.equal(claim[5], 0);
      assert.equal(claim[6], ClaimStatus.AWAITING_CALCULATION);
      assert.equal(claim[7], 0);
    });

    it("shouldn't be public", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      assert.equal(await claimingRegistryMock.canClaimBeCalculatedByAnyone(id), false);
    });

    it("should be public", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", 0, false, { from: CLAIM_VOTING })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.anyoneCanCalculateClaimResultAfter(id)).plus(10));

      assert.equal(await claimingRegistryMock.canClaimBeCalculatedByAnyone(id), true);
    });

    it("should be able to update image uri from a claim", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", 0, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      let claim = await claimingRegistryMock.claimInfo(id);
      assert.equal(claim[2], "placeholder");

      let tx = await policyBookAdmin.updateImageUriOfClaim(id, "placeholder2");
      claim = await claimingRegistryMock.claimInfo(id);
      assert.equal(claim[2], "placeholder2");

      assert.equal(tx.logs.length, 1);
      assert.equal(tx.logs[0].event, "UpdatedImageURI");
      assert.equal(tx.logs[0].args[0].toString(), id.toString());
      assert.equal(tx.logs[0].args[1], "placeholder");
      assert.equal(tx.logs[0].args[2], "placeholder2");
    });

    it("should not be able to update image uri from a claim that doesn't exist", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", 0, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      let claim = await claimingRegistryMock.claimInfo(id);
      assert.equal(claim[2], "placeholder");

      await truffleAssert.reverts(
        policyBookAdmin.updateImageUriOfClaim(100, "placeholder2"),
        "ClaimingRegistry: This claim doesn't exist"
      );
    });

    it("should be able to update image uri from a claim to blank", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", 0, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      let claim = await claimingRegistryMock.claimInfo(id);
      assert.equal(claim[2], "placeholder");

      tx = await policyBookAdmin.updateImageUriOfClaim(id, "");
      claim = await claimingRegistryMock.claimInfo(id);
      assert.equal(claim[2], "");
    });

    it("should not be able to update image uri if is not the policy book admin owner", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", 0, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      let claim = await claimingRegistryMock.claimInfo(id);

      await truffleAssert.reverts(
        policyBookAdmin.updateImageUriOfClaim(id, "placeholder2", { from: USER2 }),
        "Ownable: caller is not the owner"
      );

      await truffleAssert.reverts(
        policyBookAdmin.updateImageUriOfClaim(id, "", { from: USER2 }),
        "Ownable: caller is not the owner"
      );
    });
  });
});
