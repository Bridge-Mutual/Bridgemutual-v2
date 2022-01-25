const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const STBLMock = artifacts.require("STBLMock");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const LiquidityMining = artifacts.require("LiquidityMining");
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
const WETHMock = artifacts.require("WETHMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const ReputationSystem = artifacts.require("ReputationSystemMock");
const STKBMITokenMock = artifacts.require("STKBMITokenMock");
const VBMI = artifacts.require("VBMI");

const PolicyBook = artifacts.require("PolicyBook");
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
  ANONYMOUS_PENDING: 0,
  AWAITING_EXPOSURE: 1,
  EXPIRED: 2,
  EXPOSED_PENDING: 3,
  AWAITING_CALCULATION: 4,
  MINORITY: 5,
  MAJORITY: 6,
};

function toBN(number) {
  return new BigNumber(number);
}

async function getBlockTimestamp() {
  const latest = toBN(await web3.eth.getBlockNumber());
  return (await web3.eth.getBlock(latest)).timestamp;
}

const wei = web3.utils.toWei;

contract("ClaimVoting", async (accounts) => {
  const reverter = new Reverter(web3);
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const PRECISION = 10 ** 25;
  const PROTOCOL_PERCENTAGE = 20 * PRECISION;
  const PERCENTAGE_100 = toBN(10).pow(27);

  const initialDeposit = wei("1000");
  const stblAmount = toBN(wei("100000", "mwei"));
  const amount = toBN(wei("1000"));
  const coverTokensAmount = toBN(wei("1000"));
  const liquidityAmount = toBN(wei("1000"));

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
  let vBMI;

  let capitalPool;
  let reputationSystem;

  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const insuranceContract1 = accounts[3];
  const insuranceContract2 = accounts[4];
  const NOTHING = accounts[9];

  let VERIFYING_CONTRACT;
  let CONTRACT_DATA;

  const USER1_PRIVATE_KEY = "c4ce20adf2b728fe3005be128fb850397ec352d1ea876e3035e46d547343404f";
  const USER2_PRIVATE_KEY = "cddc8640db3142faef4ff7f91390237bc6615bb8a3908d891b927af6da3e3cf8";

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    stbl = await STBLMock.new("stbl", "stbl", 6);
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
    const _liquidityMining = await LiquidityMining.new();
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
    const _vBMI = await VBMI.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LEGACY_REWARDS_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.YIELD_GENERATOR_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.WETH_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.SUSHISWAP_ROUTER_NAME(), sushiswapRouterMock.address);

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
    await contractsRegistry.addProxyContract(await contractsRegistry.VBMI_NAME(), _vBMI.address);

    policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const liquidityMining = await LiquidityMining.at(await contractsRegistry.getLiquidityMiningContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    reputationSystem = await ReputationSystem.at(await contractsRegistry.getReputationSystemContract());
    stkBMI = await STKBMITokenMock.at(await contractsRegistry.getSTKBMIContract());
    vBMI = await VBMI.at(await contractsRegistry.getVBMIContract());

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await claimVoting.__ClaimVoting_init();
    await liquidityMining.__LiquidityMining_init();
    await rewardsGenerator.__RewardsGenerator_init();
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await nftStaking.__NFTStaking_init();
    await reputationSystem.__ReputationSystem_init([]);
    await stkBMI.__STKBMIToken_init();
    await vBMI.__VBMI_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REPUTATION_SYSTEM_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.VBMI_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());

    await sushiswapRouterMock.setReserve(stbl.address, wei(toBN(10 ** 3).toString()));
    await sushiswapRouterMock.setReserve(weth.address, wei(toBN(10 ** 15).toString()));
    await sushiswapRouterMock.setReserve(bmi.address, wei(toBN(10 ** 15).toString()));

    VERIFYING_CONTRACT = claimVoting.address;
    CONTRACT_DATA = { name: "ClaimVoting", verifyingContract: VERIFYING_CONTRACT };

    await reverter.snapshot();
  });

  beforeEach("creation of PB", async () => {
    setCurrentTime(1);
    await stbl.approve(policyBookFabric.address, 0);
    await stbl.approve(policyBookFabric.address, toBN(initialDeposit).times(2));

    const tx1 = await policyBookFabric.create(
      insuranceContract1,
      ContractType.CONTRACT,
      `test1 description`,
      `TEST1`,
      initialDeposit,
      zeroAddress
    );
    const policyBookAddress1 = tx1.logs[0].args.at;
    policyBook1 = await PolicyBook.at(policyBookAddress1);
    const policyBookFacadeAddress1 = await policyBook1.policyBookFacade();
    policyBookFacade1 = await PolicyBookFacade.at(policyBookFacadeAddress1);

    await policyBookAdmin.whitelist(policyBook1.address, true);
    await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade1.address, true);

    const tx2 = await policyBookFabric.create(
      insuranceContract2,
      ContractType.CONTRACT,
      `test2 description`,
      `TEST2`,
      initialDeposit,
      zeroAddress
    );
    const policyBookAddress2 = tx2.logs[0].args.at;
    policyBook2 = await PolicyBook.at(policyBookAddress2);
    const policyBookFacadeAddress2 = await policyBook2.policyBookFacade();
    policyBookFacade2 = await PolicyBookFacade.at(policyBookFacadeAddress2);

    await policyBookAdmin.whitelist(policyBook2.address, true);
    await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacade2.address, true);

    const tx = await policyBookFabric.createLeveragePools(ContractType.VARIOUS, "User Leverage Pool", "USDT");
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);
  });
  afterEach("revert", reverter.revert);

  const msgParams = (domain, message) => {
    const { name, version = "1", chainId = 1337, verifyingContract } = domain;
    const { claimIndex } = message;

    const EIP712Domain = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ];

    const Claim = [{ name: "UniqueClaimIndex", type: "uint256" }];

    const data = {
      primaryType: "Claim",
      types: { EIP712Domain, Claim },
      domain: { name, version, chainId, verifyingContract },
      message: { UniqueClaimIndex: claimIndex },
    };

    return data;
  };

  async function getAnonymousEncrypted(claimIndex, suggestedAmount, userPrivateKey) {
    const buffer = Buffer.from(userPrivateKey, "hex");
    const claim = {
      claimIndex: claimIndex,
    };

    const signatureOfClaim = signClaimVoting(CONTRACT_DATA, claim, buffer);

    const generatedPrivateKey = new Uint8Array(
      aesjs.utils.hex.toBytes(web3.utils.soliditySha3(signatureOfClaim).replace("0x", ""))
    );

    const aesCtr = new aesjs.ModeOfOperation.ctr(generatedPrivateKey);

    const BYTES = 32;
    let suggestedAmountStr = suggestedAmount.toString();

    while (suggestedAmountStr.length < BYTES) {
      suggestedAmountStr += String.fromCharCode("a".charCodeAt(0) + Math.round(Math.random() * 5));

      const encryptedSuggestedAmount = aesjs.utils.hex.fromBytes(
        aesCtr.encrypt(aesjs.utils.hex.toBytes(suggestedAmountStr))
      );

      const hashedSignatureOfClaim = web3.utils.soliditySha3(signatureOfClaim);
      const finalHash = web3.utils.soliditySha3(hashedSignatureOfClaim, encryptedSuggestedAmount, suggestedAmount);

      return [finalHash, encryptedSuggestedAmount];
    }
  }

  async function getAnonymousDecrypted(claimIndex, encryptedSuggestedAmount, userPrivateKey) {
    const buffer = Buffer.from(userPrivateKey, "hex");
    const claim = {
      claimIndex: claimIndex,
    };

    const signatureOfClaim = signClaimVoting(CONTRACT_DATA, claim, buffer);

    const generatedPrivateKey = new Uint8Array(
      aesjs.utils.hex.toBytes(web3.utils.soliditySha3(signatureOfClaim).replace("0x", ""))
    );

    const aesCtr = new aesjs.ModeOfOperation.ctr(generatedPrivateKey);
    const suggestedAmountStr = aesjs.utils.hex.fromBytes(
      aesCtr.decrypt(aesjs.utils.hex.toBytes(encryptedSuggestedAmount))
    );

    const hashedSignatureOfClaim = web3.utils.soliditySha3(signatureOfClaim);

    let suggestedAmount = "";
    let i = 0;

    while (suggestedAmountStr[i] >= "0" && suggestedAmountStr[i] <= "9") {
      suggestedAmount += suggestedAmountStr[i++];
    }

    return [hashedSignatureOfClaim, suggestedAmount];
  }

  async function initVoting(liquidityAmount, amount1, amount2) {
    await stbl.approve(policyBook1.address, 0);
    await stbl.approve(policyBook1.address, stblAmount);
    await policyBookFacade1.addLiquidity(liquidityAmount);
    assert.equal(
      (await policyBook1.totalLiquidity()).toString(),
      toBN(initialDeposit).plus(liquidityAmount).toFixed().toString()
    );

    await stbl.approve(policyBook2.address, 0);
    await stbl.approve(policyBook2.address, stblAmount);
    await policyBookFacade2.addLiquidity(liquidityAmount);
    assert.equal(
      (await policyBook2.totalLiquidity()).toString(),
      toBN(initialDeposit).plus(liquidityAmount).toFixed().toString()
    );

    if (amount1 > 0) {
      await stbl.transfer(USER1, stblAmount);
      await stbl.approve(policyBook1.address, 0, { from: USER1 });
      await stbl.approve(policyBook1.address, stblAmount, { from: USER1 });
      await policyBookFacade1.buyPolicy(5, amount1, { from: USER1 });
      assert.equal(await policyRegistry.getPoliciesLength(USER1), 1);

      const toApproveOnePercent1 = await policyBookFacade1.getClaimApprovalAmount(USER1);
      await bmi.approve(claimVoting.address, 0, { from: USER1 });
      await bmi.approve(claimVoting.address, toApproveOnePercent1, { from: USER1 });
    }
    if (amount2 > 0) {
      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook2.address, 0, { from: USER2 });
      await stbl.approve(policyBook2.address, stblAmount, { from: USER2 });
      await policyBookFacade2.buyPolicy(5, amount2, { from: USER2 });
      assert.equal(await policyRegistry.getPoliciesLength(USER2), 1);

      await bmi.transfer(USER2, wei("1000000"), { from: USER1 });
      const toApproveOnePercent2 = await policyBookFacade2.getClaimApprovalAmount(USER2);
      await bmi.approve(claimVoting.address, 0, { from: USER2 });
      await bmi.approve(claimVoting.address, toApproveOnePercent2, { from: USER2 });
    }
  }

  async function initAppeal(policyBook, policyBookFacade, user) {
    const toApproveOnePercent = await policyBookFacade.getClaimApprovalAmount(user);

    await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(5));

    await claimVoting.calculateVotingResultBatch([1], { from: user });
    await bmi.approve(claimVoting.address, 0, { from: user });
    await bmi.approve(claimVoting.address, toApproveOnePercent, { from: user });

    await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

    await policyBook.submitAppealAndInitializeVoting("", { from: user });

    await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(100));
  }

  async function voteAndExpose(suggestedClaimAmount, userPrivateKey, user) {
    const claimIndex = 1;
    const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
      claimIndex,
      suggestedClaimAmount,
      userPrivateKey
    );

    await claimVoting.anonymouslyVoteBatch([toBN(claimIndex).toString()], [finalHash], [encryptedSuggestedAmount], {
      from: user,
    });

    await setCurrentTime(toBN(await claimingRegistry.anonymousVotingDuration(toBN(claimIndex))).plus(10));

    const votesCount = await claimVoting.countVotes(user);
    const myVotes = await claimVoting.myVotes(0, votesCount, { from: user });

    const encrypted = myVotes[0][2];

    await stkBMI.mintArbitrary(user, wei("1000000")); // 1 mil
    await stkBMI.approve(vBMI.address, wei("1000000"), { from: user });
    await vBMI.lockStkBMI(wei("1000000"), { from: user });

    const [hashedSignatureOfClaim, suggestedAmount] = await getAnonymousDecrypted(
      claimIndex,
      encrypted,
      userPrivateKey
    );

    const res = await claimVoting.exposeVoteBatch(
      [toBN(claimIndex).toString()],
      [toBN(suggestedAmount).toString()],
      [hashedSignatureOfClaim],
      {
        from: user,
      }
    );

    console.log("ExposeVote gas used: " + res.receipt.gasUsed);
  }

  describe("initializeVoting", async () => {
    beforeEach(async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
    });

    it("reverts if not called by PolicyBook", async () => {
      const reason = "CV: Not a PolicyBook";

      await truffleAssert.reverts(
        claimVoting.initializeVoting(USER1, "", coverTokensAmount, false, {
          from: USER1,
        }),
        reason
      );
    });

    it("reverts if claimer has no coverage", async () => {
      const reason = "CV: Claimer has no coverage";

      const toApproveOnePercent2 = await policyBookFacade2.getClaimApprovalAmount(USER2);

      await bmi.approve(claimVoting.address, 0, { from: USER2 });
      await bmi.approve(claimVoting.address, toApproveOnePercent2, { from: USER2 });

      await truffleAssert.reverts(
        policyBook2.submitClaimAndInitializeVoting("", {
          from: USER2,
        }),
        reason
      );
    });

    it("should initialize new claim", async () => {
      const res = await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      console.log("InitializeClaim gas used: " + res.receipt.gasUsed);

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(await getBlockTimestamp()).plus(10));

      const coverage = toBN((await policyBook1.userStats(USER1))[0]);
      const userProtocol = BigNumber.min(
        toBN((await policyBook1.userStats(USER1))[3])
          .times(20)
          .idiv(100),
        coverage.idiv(100)
      );

      assert.equal(toBN(await bmi.balanceOf(claimVoting.address)).toString(), coverage.idiv(100).toString());

      const claimsCount = await claimingRegistry.countClaims();
      assert.equal(claimsCount, 1);
      const claims = await claimVoting.allClaims(0, claimsCount);

      assert.equal(claims[0][0][0], 1);
      assert.equal(claims[0][0][1], USER1);
      assert.equal(claims[0][0][2], policyBook1.address);
      assert.equal(claims[0][0][3], "");
      assert.equal(claims[0][0][4], false);
      assert.equal(toBN(claims[0][0][5]).toString(), coverage.toString());
      assert.equal(claims[0][0][6], timestamp);
      assert.equal(claims[0][1], ClaimStatus.PENDING);
      assert.equal(claims[0][2], 0);
      assert.equal(claims[0][3], 0);

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[0]).toString(), coverage.toString());
      assert.equal(toBN(claimResult[1]).toString(), coverage.idiv(100).toString());
      assert.equal(toBN(claimResult[2]).toString(), userProtocol.toString());
      assert.equal(claimResult[3], 0);
      assert.equal(claimResult[4], 0);
      assert.equal(claimResult[5], 0);
      assert.equal(claimResult[6], 0);
      assert.equal(claimResult[7], 0);
    });

    it("should initialize new apppeal", async () => {
      // TODO
    });

    it("tests all getters", async () => {
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(await getBlockTimestamp()).plus(10));

      const coverage = toBN((await policyBook1.userStats(USER1))[0]);

      const claimsCount = await claimingRegistry.countClaims();
      assert.equal(claimsCount, 1);

      // canWithdraw
      assert.equal(await claimVoting.canWithdraw(USER1), true);
      assert.equal(await claimVoting.canWithdraw(USER2), true);

      // canVote
      assert.equal(await claimVoting.canVote(USER1), true);
      assert.equal(await claimVoting.canVote(USER2), true);

      // voteStatus
      const reason = "CV: Vote doesn't exist";
      await truffleAssert.reverts(claimVoting.voteStatus(0), reason);

      // whatCanIVoteFor
      let whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER2 });
      assert.equal(whatVoteFor[0], 1);
      assert.equal(whatVoteFor[1][0][0], 1);
      assert.equal(whatVoteFor[1][0][1], USER1);
      assert.equal(whatVoteFor[1][0][2], policyBook1.address);
      assert.equal(whatVoteFor[1][0][3], "");
      assert.equal(whatVoteFor[1][0][4], false);
      assert.equal(toBN(whatVoteFor[1][0][5]).toString(), coverage.toString());
      assert.equal(
        toBN(whatVoteFor[1][0][6]).toString(),
        toBN(await claimingRegistry.anonymousVotingDuration(1))
          .minus(10)
          .toString()
      );
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER1 });
      assert.equal(whatVoteFor[0], 0);

      // allClaims
      let allClaims = await claimVoting.allClaims(0, claimsCount);
      assert.equal(allClaims[0][0][0], 1);
      assert.equal(allClaims[0][0][1], USER1);
      assert.equal(allClaims[0][1], ClaimStatus.PENDING);
      assert.equal(allClaims[0][2], 0);
      assert.equal(allClaims[0][3], 0);

      // myClaims
      let myClaimsCount = await claimingRegistry.countPolicyClaimerClaims(USER1);
      assert.equal(myClaimsCount, 1);
      let myClaims = await claimVoting.myClaims(0, myClaimsCount, { from: USER1 });
      assert.equal(myClaims[0][0], 1);
      assert.equal(myClaims[0][1], policyBook1.address);
      assert.equal(myClaims[0][2], "");
      assert.equal(myClaims[0][3], false);
      assert.equal(toBN(myClaims[0][4]).toString(), coverage.toString());
      assert.equal(myClaims[0][5], ClaimStatus.PENDING);
      assert.equal(myClaims[0][6], 0);
      assert.equal(myClaims[0][7], 0);

      myClaimsCount = await claimingRegistry.countPolicyClaimerClaims(USER2);
      assert.equal(myClaimsCount, 0);

      // myVotes
      let myVotesCount = await claimVoting.countVotes(USER1);
      assert.equal(myVotesCount, 0);
      myVotesCount = await claimVoting.countVotes(USER2);
      assert.equal(myVotesCount, 0);
    });
  });

  describe("anonymouslyVoteBatch", async () => {
    it("should successfully vote", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      // different users must have differents hashes
      const [finalHashUser1, encryptedSuggestedAmountUser1] = await getAnonymousEncrypted(
        claimIndex,
        suggestedClaimAmount,
        USER1_PRIVATE_KEY
      );
      const [finalHashUser2, encryptedSuggestedAmountUser2] = await getAnonymousEncrypted(
        claimIndex,
        suggestedClaimAmount,
        USER2_PRIVATE_KEY
      );

      assert.notEqual(finalHashUser1, finalHashUser2);
      assert.notEqual(encryptedSuggestedAmountUser1, encryptedSuggestedAmountUser2);

      const res = await claimVoting.anonymouslyVoteBatch(
        [claimIndex],
        [finalHashUser2],
        [encryptedSuggestedAmountUser2],
        {
          from: USER2,
        }
      );

      console.log("AnonymousVote gas used: " + res.receipt.gasUsed);
    });

    it("should successfully sign a vote claim using EIP 712", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const buffer = Buffer.from(USER2_PRIVATE_KEY, "hex");

      const claim = {
        claimIndex: 52,
      };

      // it should create same signature that was created using metamask
      // 0x30... was created using Metamask
      const signatureOfClaim = signClaimVoting(CONTRACT_DATA, claim, buffer);
      /*assert.equal(
        signatureOfClaim,
        "0xd65a677444eaddbafece07616dce072f0712b9dbe67b68298d8a0817ce16e6604d2f53ad4087db4acfcb90700a3a7392e6b76cb4ecff08a3f002534045c12a581c"
      );*/

      const params = JSON.stringify(msgParams(CONTRACT_DATA, claim));

      const recovered = ethSigUtil.recoverTypedSignature_v4({
        data: JSON.parse(params),
        sig: signatureOfClaim,
      });

      // address recovered from the signature must be equal to the signature that signed it.
      // if it is different, it has a problem.
      assert.equal(ethUtil.toChecksumAddress(recovered), ethUtil.toChecksumAddress(USER2));
    });

    it("should successfully expose vote (1)", async () => {
      await initVoting(liquidityAmount, 0, coverTokensAmount);
      await policyBook2.submitClaimAndInitializeVoting("", { from: USER2 });

      await voteAndExpose(coverTokensAmount, USER2_PRIVATE_KEY, USER1);
    });

    it("should successfully expose vote (2)", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await voteAndExpose(coverTokensAmount, USER1_PRIVATE_KEY, USER2);
    });

    it("should successfully expose vote (3)", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await voteAndExpose(0, USER1_PRIVATE_KEY, USER2);
    });

    it("should successfully expose vote && set correct status after calculation", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await voteAndExpose(0, USER1_PRIVATE_KEY, USER2);

      const claimIndex = 1;

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(claimIndex)).plus(10));

      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });

      assert.equal(await claimVoting.voteStatus(1), VoteStatus.AWAITING_CALCULATION);
    });

    it("should fail voting second time on the same claim", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
        claimIndex,
        suggestedClaimAmount,
        USER1_PRIVATE_KEY
      );
      await claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [encryptedSuggestedAmount], { from: USER2 });

      await truffleAssert.reverts(
        claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [encryptedSuggestedAmount], { from: USER2 }),
        "CV: Already voted for this claim"
      );
    });

    it("should fail voting if voter is the claimer", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
        claimIndex,
        suggestedClaimAmount,
        USER1_PRIVATE_KEY
      );

      await truffleAssert.reverts(
        claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [encryptedSuggestedAmount], { from: USER1 }),
        "CV: Voter is the claimer"
      );
    });

    it("should fail voting if fail array length", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
        claimIndex,
        suggestedClaimAmount,
        USER1_PRIVATE_KEY
      );

      // empty claimindex array
      await truffleAssert.reverts(
        claimVoting.anonymouslyVoteBatch([], [finalHash], [encryptedSuggestedAmount], { from: USER1 }),
        "CV: Length mismatches"
      );

      // empty final hash
      await truffleAssert.reverts(
        claimVoting.anonymouslyVoteBatch([claimIndex], [], [encryptedSuggestedAmount], { from: USER1 }),
        "CV: Length mismatches"
      );

      // empty encryptedSuggestedAmount
      await truffleAssert.reverts(
        claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [], { from: USER1 }),
        "CV: Length mismatches"
      );
    });

    it("should fail voting if anonymous voting is over", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
        claimIndex,
        suggestedClaimAmount,
        USER1_PRIVATE_KEY
      );

      await setCurrentTime(10 * 24 * 60 * 60); // 10 days

      await truffleAssert.reverts(
        claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [encryptedSuggestedAmount], { from: USER2 }),
        "CV: Anonymous voting is over"
      );
    });

    it("should fail exposing unvoted vote", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      await stkBMI.mintArbitrary(USER2, wei("100")); // 100
      await stkBMI.approve(vBMI.address, wei("100"), { from: USER2 });
      await vBMI.lockStkBMI(wei("100"), { from: USER2 });

      await setCurrentTime(toBN(await claimingRegistry.anonymousVotingDuration(claimIndex)).plus(10));

      await truffleAssert.reverts(
        claimVoting.exposeVoteBatch([claimIndex], [suggestedClaimAmount], ["0x"], {
          from: USER2,
        }),
        "CV: Vote doesn't exist"
      );
    });

    it("should fail due to different suggested claim amount", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
        claimIndex,
        suggestedClaimAmount,
        USER1_PRIVATE_KEY
      );

      await claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [encryptedSuggestedAmount], { from: USER2 });

      await setCurrentTime(toBN(await claimingRegistry.anonymousVotingDuration(claimIndex)).plus(10));

      const votesCount = await claimVoting.countVotes(USER2);
      const myVotes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

      const encrypted = myVotes[0][1];

      await stkBMI.mintArbitrary(USER2, wei("1000000")); // 1 mil
      await stkBMI.approve(vBMI.address, coverTokensAmount, { from: USER2 });
      await vBMI.lockStkBMI(coverTokensAmount, { from: USER2 });

      const [hashedSignatureOfClaim] = await getAnonymousDecrypted(claimIndex, encrypted, USER1_PRIVATE_KEY);

      await truffleAssert.reverts(
        claimVoting.exposeVoteBatch([claimIndex], [toBN(coverTokensAmount).idiv(2)], [hashedSignatureOfClaim], {
          from: USER2,
        }),
        "CV: Data mismatches"
      );
    });

    it("should fail due to vote not being 'awaiting exposure'", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
        claimIndex,
        suggestedClaimAmount,
        USER1_PRIVATE_KEY
      );

      await claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [encryptedSuggestedAmount], { from: USER2 });

      const votesCount = await claimVoting.countVotes(USER2);
      const myVotes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

      const encrypted = myVotes[0][1];

      await stkBMI.mintArbitrary(USER2, wei("1000000")); // 1 mil
      await stkBMI.approve(vBMI.address, coverTokensAmount, { from: USER2 });
      await vBMI.lockStkBMI(coverTokensAmount, { from: USER2 });

      const [hashedSigantureOfClaim] = await getAnonymousDecrypted(claimIndex, encrypted, USER1_PRIVATE_KEY);

      await truffleAssert.reverts(
        claimVoting.exposeVoteBatch([claimIndex], [coverTokensAmount], [hashedSigantureOfClaim], { from: USER2 }),
        "CV: Vote is not awaiting"
      );
    });

    it("should be expired", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
        claimIndex,
        suggestedClaimAmount,
        USER1_PRIVATE_KEY
      );

      await claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [encryptedSuggestedAmount], { from: USER2 });

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(claimIndex)).plus(10));

      assert.equal(await claimVoting.voteStatus(1), VoteStatus.EXPIRED);
    });
  });

  describe("voteFor()", async () => {
    let timestamp;

    async function calculate(staked, suggestedAmounts, reputations) {
      for (let i = 0; i < staked.length; i++) {
        const VOTER = accounts[i + 2];

        await stkBMI.mintArbitrary(VOTER, wei(toBN(10).pow(18).toString())); // 10**18
        await stkBMI.approve(vBMI.address, staked[i], { from: VOTER });
        await vBMI.lockStkBMI(staked[i], { from: VOTER });

        await reputationSystem.setNewReputationNoCheck(VOTER, reputations[i]);
        await claimVoting.vote(1, suggestedAmounts[i], { from: VOTER });
      }

      let averageWithdrawal = toBN(0);
      let allStake = toBN(0);

      for (let i = 0; i < staked.length; i++) {
        allStake = allStake.plus(toBN(staked[i]).times(toBN(reputations[i])));
      }

      for (let i = 0; i < staked.length; i++) {
        averageWithdrawal = averageWithdrawal.plus(
          toBN(reputations[i]).times(toBN(staked[i])).times(toBN(suggestedAmounts[i])).idiv(allStake)
        );
      }

      return [allStake, averageWithdrawal];
    }
    beforeEach("initializeVoting", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      timestamp = await getBlockTimestamp();
    });

    it("should successfully vote for", async () => {
      await stkBMI.mintArbitrary(USER2, wei("1000000")); // 1 mil
      await stkBMI.approve(vBMI.address, coverTokensAmount, { from: USER2 });
      await vBMI.lockStkBMI(coverTokensAmount, { from: USER2 });

      const coverage = toBN((await policyBook1.userStats(USER1))[0]);
      const userProtocol = BigNumber.min(
        toBN((await policyBook1.userStats(USER1))[3])
          .times(20)
          .idiv(100),
        coverage.idiv(100)
      );

      await claimVoting.vote(1, coverage, { from: USER2 });

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[0]), coverage.toString());
      assert.equal(toBN(claimResult[1]).toString(), coverage.idiv(100).toString());
      assert.equal(toBN(claimResult[2]).toString(), userProtocol.toString());
      assert.equal(toBN(claimResult[3]).toString(), toBN(coverTokensAmount).toString()); // average withdraw
      assert.equal(toBN(claimResult[4]).toString(), toBN(PRECISION).times(wei("1000")).toString()); // yes average stake
      assert.equal(claimResult[5], 0); // no average stake
      assert.equal(toBN(claimResult[6]).toString(), toBN(wei("1000")).toString()); // all voted stake
      assert.equal(claimResult[7], 0); // voted yes percentage (after calculation)

      const votesCount = await claimVoting.countVotes(USER2);

      assert.equal(votesCount, 1);

      assert.equal(await claimVoting.voteStatus(1), VoteStatus.EXPOSED_PENDING);

      const votes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

      assert.equal(votes[0][0][0][0], 1);
      assert.equal(votes[0][0][0][1], USER1);
      assert.equal(votes[0][0][0][2], policyBook1.address);
      assert.equal(votes[0][0][0][3], "");
      assert.equal(votes[0][0][0][4], false);
      assert.equal(toBN(votes[0][0][0][5]).toString(), toBN(coverTokensAmount).toString());
      assert.equal(votes[0][0][0][6], timestamp.toString()); // can equal 3 (time bug)
      assert.equal(votes[0][0][1], ClaimStatus.PENDING);
      assert.equal(votes[0][0][2], 0);
      assert.equal(votes[0][1], "");
      assert.equal(toBN(votes[0][2]).toString(), coverage.toString());
      assert.equal(votes[0][3], VoteStatus.EXPOSED_PENDING);
      assert.equal(votes[0][4], 0);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      await capitalPool.setliquidityCushionBalance(wei("1000"));
      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });

      let votesUpdates = await claimVoting.myVotesUpdates(0, votesCount, { from: USER2 });

      assert.equal(votesUpdates[0], 1);
      assert.equal(votesUpdates[1][0], 1);

      await bmi.transfer(USER2, wei("1000000"), { from: USER1 });
      await bmi.approve(claimVoting.address, coverTokensAmount, { from: USER2 });
      await stbl.transfer(reinsurancePool.address, stblAmount);
      await claimVoting.calculateVoterResultBatch(votesUpdates[1], { from: USER2 });

      votesUpdates = await claimVoting.myVotesUpdates(0, votesCount, { from: USER2 });

      assert.equal(votesUpdates[0], 0);
    });

    it("should reject if no one voted for appeal", async () => {
      await initAppeal(policyBook1, policyBookFacade1, USER1);

      await reputationSystem.setNewReputationNoCheck(USER1, toBN(PRECISION).times(2));

      await setCurrentTime(
        toBN(await claimingRegistry.votingDuration(2))
          .times(2)
          .plus(100)
      );

      await claimVoting.calculateVotingResultBatch([2], { from: USER1 });

      assert.equal(await claimingRegistry.claimStatus(2), ClaimStatus.REJECTED);
    });

    it("should vote for appeal if trusted voter", async () => {
      await initAppeal(policyBook1, policyBookFacade1, USER1);

      await reputationSystem.setNewReputationNoCheck(USER2, toBN(PRECISION).times(2));

      await stkBMI.mintArbitrary(USER2, wei(toBN(10).pow(18).toString())); // 10**18
      await stkBMI.approve(vBMI.address, wei("1000"), { from: USER2 });
      await vBMI.lockStkBMI(wei("1000"), { from: USER2 });

      await claimVoting.vote(2, wei("100"), { from: USER2 });

      const votesCount = await claimVoting.countVotes(USER2);
      const votes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

      assert.equal(votes[0][0][0][0], 2);
      assert.equal(votes[0][0][0][1], USER1);
      assert.equal(votes[0][0][0][2], policyBook1.address);
      assert.equal(votes[0][0][0][3], "");
      assert.equal(votes[0][0][0][4], true);
      assert.equal(toBN(votes[0][0][0][5]).toString(), toBN(coverTokensAmount).toString());
      assert.closeTo(
        toBN(votes[0][0][0][6]).toNumber(),
        toBN(await claimingRegistry.votingDuration(2))
          .plus(10)
          .toNumber(),
        1
      ); // time bug
      assert.equal(votes[0][0][1], ClaimStatus.PENDING);
      assert.equal(votes[0][0][2], 0);
      assert.equal(votes[0][1], "");
      assert.equal(toBN(votes[0][2]).toString(), toBN(wei("100")).toString());
      assert.equal(votes[0][3], VoteStatus.EXPOSED_PENDING);
      assert.equal(votes[0][4], 0);
    });

    it("should calculate correct averages (1)", async () => {
      const staked = [wei("2000"), wei("1000")];
      const suggestedAmounts = [coverTokensAmount, wei("500")];
      const reputations = [toBN(PRECISION).times(1.5), toBN(PRECISION).times(2)];

      await setCurrentTime(2);

      const [allStake, averageWithdrawal] = await calculate(staked, suggestedAmounts, reputations);

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[3]).toString(), averageWithdrawal.toString()); // average withdraw
      assert.equal(toBN(claimResult[4]).toString(), allStake.toString()); // yes average stake
    });

    it("should calculate correct averages (2)", async () => {
      const staked = [700, 1500, 7521];
      const suggestedAmounts = [coverTokensAmount, wei("500"), wei("120")];
      const reputations = [toBN(PRECISION).times(0.8), toBN(PRECISION).times(2), toBN(PRECISION).times(2.5)];

      const [allStake, averageWithdrawal] = await calculate(staked, suggestedAmounts, reputations);

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[3]).toString(), averageWithdrawal.plus(1).toString()); // average withdraw
      assert.equal(toBN(claimResult[4]).toString(), allStake.toString()); // yes average stake
    });

    it("should calculate correct averages (3)", async () => {
      const staked = [wei("10"), wei("1337"), wei("128376"), wei("123133")];
      const suggestedAmounts = [coverTokensAmount, wei("790"), wei("120"), wei("10")];
      const reputations = [
        toBN(PRECISION).times(0.8),
        toBN(PRECISION).times(2),
        toBN(PRECISION).times(2.5),
        toBN(PRECISION).times(1.68),
      ];

      const [allStake, averageWithdrawal] = await calculate(staked, suggestedAmounts, reputations);

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[3]).toString(), averageWithdrawal.plus(2).toString()); // average withdraw
      assert.equal(toBN(claimResult[4]).toString(), allStake.toString()); // yes average stake
    });

    it("should calculate correct averages (4)", async () => {
      const staked = [wei("100"), wei("827341237"), wei("1"), wei("9837459837")];
      const suggestedAmounts = [coverTokensAmount, coverTokensAmount, wei("1"), wei("646")];
      const reputations = [
        toBN(PRECISION).times(0.1),
        toBN(PRECISION),
        toBN(PRECISION).times(3),
        toBN(PRECISION).times(1.11),
      ];

      const [allStake, averageWithdrawal] = await calculate(staked, suggestedAmounts, reputations);

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[3]).toString(), averageWithdrawal.plus(1).toString()); // average withdraw
      assert.equal(toBN(claimResult[4]).toString(), allStake.toString()); // yes average stake
    });
  });

  describe("voteAgainst()", async () => {
    let timestamp;

    async function calculate(staked, reputations) {
      for (let i = 0; i < staked.length; i++) {
        const VOTER = accounts[i + 2];

        await stkBMI.mintArbitrary(VOTER, wei(toBN(10).pow(18).toString())); // 10**18
        await stkBMI.approve(vBMI.address, staked[i], { from: VOTER });
        await vBMI.lockStkBMI(staked[i], { from: VOTER });

        await reputationSystem.setNewReputationNoCheck(VOTER, reputations[i]);
        await claimVoting.vote(1, 0, { from: VOTER });
      }

      let allStake = toBN(0);

      for (let i = 0; i < staked.length; i++) {
        allStake = allStake.plus(toBN(staked[i]).times(toBN(reputations[i])));
      }

      return allStake;
    }

    beforeEach("initializeVoting", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      timestamp = await getBlockTimestamp();
    });

    it("should successfully vote against", async () => {
      await stkBMI.mintArbitrary(USER2, wei("1000000")); // 1 mil
      await stkBMI.approve(vBMI.address, coverTokensAmount, { from: USER2 });
      await vBMI.lockStkBMI(coverTokensAmount, { from: USER2 });

      const coverage = toBN((await policyBook1.userStats(USER1))[0]);
      const userProtocol = BigNumber.min(
        toBN((await policyBook1.userStats(USER1))[3])
          .times(20)
          .idiv(100),
        coverage.idiv(100)
      );

      await claimVoting.vote(1, 0, { from: USER2 });

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[0]).toString(), coverage.toString());
      assert.equal(toBN(claimResult[1]).toString(), coverage.idiv(100).toString());
      assert.equal(toBN(claimResult[2]).toString(), userProtocol.toString());

      assert.equal(claimResult[3], 0); // average withdraw
      assert.equal(claimResult[4], 0); // yes average stake
      assert.equal(toBN(claimResult[5]).toString(), toBN(PRECISION).times(wei("1000")).toString()); // no average stake
      assert.equal(toBN(claimResult[6]).toString(), toBN(coverTokensAmount).toString()); // all voted stake
      assert.equal(claimResult[7], 0); // voted yes percentage (after calculation)

      const votesCount = await claimVoting.countVotes(USER2);

      assert.equal(votesCount, 1);

      assert.equal(await claimVoting.voteStatus(1), VoteStatus.EXPOSED_PENDING);

      const votes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

      assert.equal(votes[0][0][0][0], 1);
      assert.equal(votes[0][0][0][1], USER1);
      assert.equal(votes[0][0][0][2], policyBook1.address);
      assert.equal(votes[0][0][0][3], "");
      assert.equal(votes[0][0][0][4], false);
      assert.equal(toBN(votes[0][0][0][5]).toString(), toBN(coverTokensAmount).toString());
      assert.closeTo(toBN(votes[0][0][0][6]).toNumber(), 3, 1); // may be 3 (time bug)
      assert.equal(votes[0][0][1], ClaimStatus.PENDING);
      assert.equal(votes[0][0][2], 0);
      assert.equal(votes[0][1], "");
      assert.equal(votes[0][2], 0);
      assert.equal(votes[0][3], VoteStatus.EXPOSED_PENDING);
      assert.equal(votes[0][4], 0);
    });

    it("should calculate correct averages (1)", async () => {
      const staked = [wei("100"), wei("200")];
      const reputations = [toBN(PRECISION).times(0.1), toBN(PRECISION).times(3)];

      const allStake = await calculate(staked, reputations);

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[5]).toString(), allStake.toString()); // no average stake
    });

    it("should calculate correct averages (2)", async () => {
      const staked = [wei("3333"), wei("4444"), wei("5555")];
      const reputations = [toBN(PRECISION).times(0.4), toBN(PRECISION).times(1.1), toBN(PRECISION).times(2.9)];

      const allStake = await calculate(staked, reputations);

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[5]).toString(), allStake.toString()); // no average stake
    });

    it("should calculate correct averages (3)", async () => {
      const staked = [1, 128378, 812736, 923742];
      const reputations = [
        toBN(PRECISION).times(0.123),
        toBN(PRECISION).times(2.123),
        toBN(PRECISION).times(2.2),
        toBN(PRECISION).times(2.9),
      ];

      const allStake = await calculate(staked, reputations);

      const claimResult = await claimVoting.getVotingResult(1);

      assert.equal(toBN(claimResult[5]).toString(), allStake.toString()); // no average stake
    });
  });

  describe("calculateVotingResult()", async () => {
    async function fastVote(VOTER, stake, suggestedAmount, reputation, yes) {
      await stkBMI.mintArbitrary(VOTER, wei(toBN(10).pow(18).toString())); // 10**18
      await stkBMI.approve(vBMI.address, stake, { from: VOTER });
      await vBMI.lockStkBMI(stake, { from: VOTER });

      await reputationSystem.setNewReputationNoCheck(VOTER, reputation);

      if (yes) {
        await claimVoting.vote(1, suggestedAmount, { from: VOTER });
      } else {
        await claimVoting.vote(1, 0, { from: VOTER });
      }
    }

    beforeEach(async function () {
      await capitalPool.setliquidityCushionBalance(wei("1000"));
    });

    it("should calculate voting result (1)", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await fastVote(accounts[2], wei("120"), wei("500"), toBN(PRECISION).times(1.1), false);
      await fastVote(accounts[3], wei("100"), wei("750"), toBN(PRECISION).times(2.4), false);
      await fastVote(accounts[4], wei("1000"), wei("1000"), toBN(PRECISION).times(0.1), false);
      await fastVote(accounts[5], wei("5000"), wei("1"), toBN(PRECISION).times(3), true);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      const uBalance = toBN(await stbl.balanceOf(USER1));
      const pBalance = toBN(await stbl.balanceOf(capitalPool.address));

      const liquidity = toBN((await policyBook1.getNewCoverAndLiquidity()).newTotalLiquidity);

      const res = await claimVoting.calculateVotingResultBatch([1], { from: USER1 });
      console.log("CalculateVotingResult (ACCEPT) gas used: " + res.receipt.gasUsed);

      const addon = toBN((await claimVoting.getVotingResult(1))[3]);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        pBalance.minus(addon.idiv(10 ** 12)).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), uBalance.plus(addon.idiv(10 ** 12)).toString());

      assert.equal(toBN(await policyBook1.totalLiquidity()).toString(), liquidity.minus(addon).toString());
    });

    it("should calculate voting result (2)", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await fastVote(accounts[2], 1000, 500, toBN(PRECISION), true);
      await fastVote(accounts[3], 2883, 500, toBN(PRECISION), true);
      await fastVote(accounts[4], 1000, 0, toBN(PRECISION), false);
      await fastVote(accounts[5], 1000, 0, toBN(PRECISION), false);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      const uBalance = toBN(await stbl.balanceOf(USER1));
      const pBalance = toBN(await stbl.balanceOf(policyBook1.address));

      const liquidity = toBN((await policyBook1.getNewCoverAndLiquidity()).newTotalLiquidity);

      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });

      const addon = toBN((await claimVoting.getVotingResult(1))[3]);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      assert.equal(
        toBN(await stbl.balanceOf(policyBook1.address)).toString(),
        pBalance.minus(addon.idiv(10 ** 12)).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), uBalance.plus(addon.idiv(10 ** 12)).toString());

      assert.equal(toBN(await policyBook1.totalLiquidity()).toString(), liquidity.minus(addon).toString());
    });

    it("should calculate voting result (3)", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await fastVote(accounts[2], wei("1000"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[3], wei("2882"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[4], wei("1000"), 0, toBN(PRECISION), false);
      await fastVote(accounts[5], wei("1000"), 0, toBN(PRECISION), false);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      const res = await claimVoting.calculateVotingResultBatch([1], { from: USER1 });
      console.log("CalculateVotingResult (REJECT) gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);
    });

    it("should calculate voting result, quorum (4)", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await fastVote(accounts[2], wei("1000"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[3], wei("8000"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[4], wei("4000"), 0, toBN(PRECISION), false);
      await fastVote(accounts[5], wei("3000"), 0, toBN(PRECISION), false);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      const res = await claimVoting.calculateVotingResultBatch([1], { from: USER1 });
      console.log("CalculateVotingResult (REJECT QUORUM) gas used: " + res.receipt.gasUsed);

      assert.equal((await claimingRegistry.claimStatus(1)).toString(), ClaimStatus.REJECTED_CAN_APPEAL);
    });

    it("should calculate voting result, quorum (5)", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await fastVote(accounts[2], wei("1200"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[3], wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[4], wei("400"), 0, toBN(PRECISION), false);
      await fastVote(accounts[5], wei("400"), 0, toBN(PRECISION), false);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);
    });

    it("should revert, public calculation (6)", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await fastVote(accounts[2], wei("1200"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[3], wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[4], wei("400"), 0, toBN(PRECISION), false);
      await fastVote(accounts[5], wei("400"), 0, toBN(PRECISION), false);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      await truffleAssert.reverts(
        claimVoting.calculateVotingResultBatch([1], { from: USER2 }),
        "CV: Not allowed to calculate"
      );
    });

    it("should calculate reward, public calculation (7)", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await fastVote(accounts[2], wei("1200"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[3], wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVote(accounts[4], wei("400"), 0, toBN(PRECISION), false);
      await fastVote(accounts[5], wei("400"), 0, toBN(PRECISION), false);

      const elapsedTime = toBN(48 * 60 * 60);
      const currentTime = toBN(await claimingRegistry.anyoneCanCalculateClaimResultAfter(1))
        .plus(elapsedTime)
        .plus(2);

      const spectator = accounts[3];

      const lockedBMIs = toBN((await claimVoting.getVotingResult(1))[1]);
      const accBalance = toBN(await bmi.balanceOf(spectator));

      await setCurrentTime(currentTime);

      await claimVoting.calculateVotingResultBatch([1], { from: spectator });

      const reward = BigNumber.min(
        lockedBMIs,
        elapsedTime
          .times(
            toBN(await claimVoting.CALCULATION_REWARD_PER_DAY())
              .idiv(60 * 60 * 24)
              .times(lockedBMIs)
          )
          .idiv(PERCENTAGE_100)
      );

      // huge slippage to fix time bug
      assert.closeTo(
        toBN(await bmi.balanceOf(spectator)).toNumber(),
        accBalance.plus(reward).toNumber(),
        toBN(wei("0.001")).toNumber()
      );
      assert.closeTo(
        toBN((await claimVoting.getVotingResult(1))[1]).toNumber(),
        lockedBMIs.minus(reward).toNumber(),
        toBN(wei("0.001")).toNumber()
      );
    });

    it.skip("shouldn't be able to claim new policybook when policy has expired and old claim is pending", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      await setCurrentTime(toBN(5).plus(1).times(7).times(24).times(60).times(60).plus(100));

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), false);

      await truffleAssert.reverts(policyBookFacade1.buyPolicy(5, coverTokensAmount), "PB: Claim is pending");
    });

    it("should be able to claim new policybook when policy has expired", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      await fastVote(accounts[2], wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });
      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      await setCurrentTime(toBN(5).plus(1).times(7).times(24).times(60).times(60).plus(100));

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), false);
    });

    it("should display correct status when old policy is accepted and new one is bought", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      await fastVote(accounts[2], wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });
      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      await setCurrentTime(toBN(5).plus(1).times(7).times(24).times(60).times(60).plus(100));

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), false);

      await stbl.approve(policyBook1.address, 0, { from: USER1 });
      await stbl.approve(policyBook1.address, stblAmount, { from: USER1 });
      await policyBookFacade1.addLiquidity(liquidityAmount, { from: USER1 });
      await policyBookFacade1.buyPolicy(5, coverTokensAmount, { from: USER1 });

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      const info = await policyRegistry.getPoliciesInfo(USER1, true, 0, 1);

      assert.equal(info._policiesCount, 1);
      assert.equal(info._policyStatuses[0], ClaimStatus.CAN_CLAIM);
    });

    it("should only claim same policy after appeal expires", async () => {
      await setCurrentTime(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      await fastVote(accounts[2], wei("10000"), wei("0"), toBN(PRECISION), true);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });
      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);

      await setCurrentTime(
        toBN(await claimingRegistry.claimEndTime(1))
          .plus(await policyRegistry.STILL_CLAIMABLE_FOR())
          .plus(100)
      );

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED);

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      const toApproveOnePercent = await policyBookFacade1.getClaimApprovalAmount(USER1);
      await bmi.approve(claimVoting.address, 0, { from: USER1 });

      await bmi.approve(claimVoting.address, toApproveOnePercent, { from: USER1 });

      await truffleAssert.reverts(
        policyBook1.submitAppealAndInitializeVoting("", { from: USER1 }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );

      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
    });
  });

  describe("calculateVoterResult()", async () => {
    async function fastVote(voter, claimIndexes, stake, suggestedAmount, reputation, yes) {
      await stkBMI.mintArbitrary(voter, wei(toBN(10).pow(18).toString())); // 10**18
      await stkBMI.approve(vBMI.address, stake, { from: voter });
      await vBMI.lockStkBMI(stake, { from: voter });

      for (let i = 0; i < claimIndexes.length; i++) {
        await reputationSystem.setNewReputationNoCheck(voter, reputation);

        if (yes) {
          await claimVoting.vote(claimIndexes[i], suggestedAmount, { from: voter });
        } else {
          await claimVoting.vote(claimIndexes[i], 0, { from: voter });
        }
      }
    }

    async function calculateAverageStake(staked, reputations, from, to) {
      let allStake = toBN(0);

      for (let i = from; i < to; i++) {
        allStake = allStake.plus(toBN(staked[i]).times(toBN(reputations[i])));
      }

      return allStake;
    }

    beforeEach(async function () {
      await capitalPool.setliquidityCushionBalance(wei("1000"));
    });

    it("should calculate voter result (yes, majority, accepted)", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      const staked = [wei("4000"), wei("3000"), wei("1000"), wei("1000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVote(accounts[2], [1], staked[0], wei("500"), reputations[0], true);
      await fastVote(accounts[3], [1], staked[1], wei("500"), reputations[1], true);
      await fastVote(accounts[4], [1], staked[2], 0, reputations[2], false);
      await fastVote(accounts[5], [1], staked[3], 0, reputations[3], false);

      const observer = accounts[2];
      const observedStake = staked[0];
      const observedReputation = reputations[0];

      const allStake = await calculateAverageStake(staked, reputations, 0, 2);

      const paidToProtocol = toBN((await policyBook1.userStats(USER1))[3])
        .times(20)
        .idiv(100);
      const coverage = toBN((await policyBook1.userStats(USER1))[0]);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));
      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });

      const reinsuranceSTBL = await stbl.balanceOf(reinsurancePool.address);
      const acc2STBL = await stbl.balanceOf(observer);
      const reputation = await reputationSystem.reputation(observer);

      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      await bmi.transfer(observer, wei("1000000"), { from: USER1 });
      const toApproveOnePercent = await policyBookFacade1.getClaimApprovalAmount(observer);
      await bmi.approve(claimVoting.address, 0, { from: observer });
      await bmi.approve(claimVoting.address, toApproveOnePercent, { from: observer });
      const res = await claimVoting.calculateVoterResultBatch([1], { from: observer });
      console.log("CalculateVoterResult (yes, majority, accepted) gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const voteIndex = await claimVoting.voteIndex(1, { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MAJORITY);

      assert.equal(toBN(await reputationSystem.reputation(observer)).gt(toBN(reputation)), true);

      const userProtocol = BigNumber.min(paidToProtocol, coverage.idiv(100));

      const voterReward = toBN(observedStake)
        .times(toBN(observedReputation))
        .div(allStake)
        .times(userProtocol)
        .dp(0, BigNumber.ROUND_FLOOR);

      assert.equal(
        toBN(await stbl.balanceOf(observer)).toString(),
        toBN(acc2STBL)
          .plus(toBN(voterReward))
          .idiv(10 ** 12)
          .toString()
      );
      assert.equal(
        toBN(await stbl.balanceOf(reinsurancePool.address)).toString(),
        toBN(reinsuranceSTBL)
          .minus(toBN(voterReward).idiv(10 ** 12))
          .toString()
      );
    });

    it("should calculate voter result (yes, majority, rejected)", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      const staked = [wei("4000"), wei("3000"), wei("4000"), wei("2000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVote(accounts[2], [1], staked[0], wei("500"), reputations[0], true);
      await fastVote(accounts[3], [1], staked[1], wei("500"), reputations[1], true);
      await fastVote(accounts[4], [1], staked[2], 0, reputations[2], false);
      await fastVote(accounts[5], [1], staked[3], 0, reputations[3], false);

      const observer = accounts[2];
      const observedStake = staked[0];
      const observedReputation = reputations[0];

      const allStake = await calculateAverageStake(staked, reputations, 0, 2);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));
      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });

      const claimVotingBMI = await bmi.balanceOf(claimVoting.address);
      const accBMI = await bmi.balanceOf(observer);
      const reputation = await reputationSystem.reputation(observer);

      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      const res = await claimVoting.calculateVoterResultBatch([1], { from: observer });
      console.log("CalculateVoterResult (yes, majority, rejected) gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);

      const voteIndex = await claimVoting.voteIndex(1, { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MAJORITY);

      assert.equal(toBN(await reputationSystem.reputation(observer)).gt(toBN(reputation)), true);

      const lockedBMI = (await claimVoting.getVotingResult(1))[1];

      const voterReward = toBN(observedStake)
        .times(toBN(observedReputation))
        .div(allStake)
        .times(toBN(lockedBMI))
        .dp(0, BigNumber.ROUND_FLOOR);

      assert.equal(toBN(await bmi.balanceOf(observer)).toString(), toBN(accBMI).plus(toBN(voterReward)).toString());
      assert.equal(
        toBN(await bmi.balanceOf(claimVoting.address)).toString(),
        toBN(claimVotingBMI).minus(toBN(voterReward)).toString()
      );
    });

    it("should calculate voter result (no, majority, rejected)", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      const staked = [wei("4000"), wei("2000"), wei("4000"), wei("3000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVote(accounts[2], [1], staked[0], wei("500"), reputations[0], true);
      await fastVote(accounts[3], [1], staked[1], wei("500"), reputations[1], true);
      await fastVote(accounts[4], [1], staked[2], 0, reputations[2], false);
      await fastVote(accounts[5], [1], staked[3], 0, reputations[3], false);

      const observer = accounts[5];
      const observedStake = staked[3];
      const observedReputation = reputations[3];

      const allStake = await calculateAverageStake(staked, reputations, 2, 4);

      const elapsedTimeReversed = toBN(await claimingRegistry.anyoneCanCalculateClaimResultAfter(1))
        .minus(toBN(await claimingRegistry.votingDuration(1)))
        .minus(toBN(8));

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      const claimVotingBMI = toBN(await bmi.balanceOf(claimVoting.address));
      const claimerBMI = toBN(await bmi.balanceOf(USER1));
      let lockedBMIs = toBN((await claimVoting.getVotingResult(1))[1]);

      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });

      /*const myReward = BigNumber.min(
        lockedBMIs,
        elapsedTimeReversed
          .times(
            toBN(await claimVoting.CALCULATION_REWARD_PER_DAY())
              .idiv(60 * 60 * 24)
              .times(lockedBMIs)
          )
          .idiv(PERCENTAGE_100)
      );*/
      const myReward = toBN(observedStake)
        .times(toBN(observedReputation))
        .div(allStake)
        .times(toBN(lockedBMIs))
        .dp(0, BigNumber.ROUND_FLOOR);

      assert.equal(toBN(await bmi.balanceOf(USER1)).toString(), claimerBMI.plus(myReward).toString());
      assert.equal(
        toBN(await bmi.balanceOf(claimVoting.address)).toString(),
        claimVotingBMI.minus(myReward).toString()
      );
      assert.equal(toBN((await claimVoting.getVotingResult(1))[1]).toString(), lockedBMIs.minus(myReward).toString());

      const accBMI = await bmi.balanceOf(observer);
      const reputation = await reputationSystem.reputation(observer);

      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      const res = await claimVoting.calculateVoterResultBatch([1], { from: observer });
      console.log("CalculateVoterResult (no, majority, rejected) gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);

      const voteIndex = await claimVoting.voteIndex(1, { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MAJORITY);

      assert.equal(toBN(await reputationSystem.reputation(observer)).gt(toBN(reputation)), true);

      lockedBMIs = (await claimVoting.getVotingResult(1))[1];

      const voterReward = toBN(observedStake)
        .times(toBN(observedReputation))
        .div(allStake)
        .times(toBN(lockedBMIs))
        .dp(0, BigNumber.ROUND_FLOOR);

      assert.equal(toBN(await bmi.balanceOf(observer)).toString(), toBN(accBMI).plus(voterReward).toString());
      assert.equal(
        toBN(await bmi.balanceOf(claimVoting.address)).toString(),
        claimVotingBMI.minus(voterReward).minus(myReward).toString()
      );
    });

    it("should calculate voter result (yes or no, minority)", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      const staked = [wei("4000"), wei("2000"), wei("4000"), wei("3000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVote(accounts[2], [1], staked[0], wei("500"), reputations[0], true);
      await fastVote(accounts[3], [1], staked[1], wei("500"), reputations[1], true);
      await fastVote(accounts[4], [1], staked[2], 0, reputations[2], false);
      await fastVote(accounts[5], [1], staked[3], 0, reputations[3], false);

      const observer = accounts[3];

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));
      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });

      const claimVotingBMI = await bmi.balanceOf(claimVoting.address);
      const accBMI = await bmi.balanceOf(observer);
      const reputation = await reputationSystem.reputation(observer);

      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      const res = await claimVoting.calculateVoterResultBatch([1], { from: observer });
      console.log("CalculateVoterResult (yes or no, minority) gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);

      const voteIndex = await claimVoting.voteIndex(1, { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MINORITY);

      assert.equal(toBN(await reputationSystem.reputation(observer)).lt(toBN(reputation)), true);

      assert.equal(toBN(await bmi.balanceOf(observer)).toString(), toBN(accBMI).toString());
      assert.equal(toBN(await bmi.balanceOf(claimVoting.address)).toString(), toBN(claimVotingBMI).toString());
    });

    it("should calculate voter result (yes or no, extereme minority)", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      const staked = [wei("10"), wei("4000"), wei("2000"), wei("3000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVote(accounts[2], [1], staked[0], 0, reputations[0], false);
      await fastVote(accounts[3], [1], staked[1], wei("500"), reputations[1], true);
      await fastVote(accounts[4], [1], staked[2], wei("500"), reputations[2], true);
      await fastVote(accounts[5], [1], staked[3], wei("500"), reputations[3], true);

      const observer = accounts[2];

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));
      await claimVoting.calculateVotingResultBatch([1], { from: USER1 });

      const stakingStkBMI = await stkBMI.balanceOf(vBMI.address);
      const accStakedStkBMI = await vBMI.balanceOf(observer);
      const reinsuranceStkBMI = await stkBMI.balanceOf(reinsurancePool.address);
      const reputation = await reputationSystem.reputation(observer);

      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      const res = await claimVoting.calculateVoterResultBatch([1], { from: observer });
      console.log("CalculateVoterResult (yes or no, extreme minority) gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const voteIndex = await claimVoting.voteIndex(1, { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MINORITY);

      let votedExtremePercentage = (await claimVoting.getVotingResult(1))[7];
      votedExtremePercentage = BigNumber.min(
        toBN(votedExtremePercentage),
        PERCENTAGE_100.minus(toBN(votedExtremePercentage))
      );
      votedExtremePercentage = toBN(await claimVoting.PENALTY_THRESHOLD()).minus(votedExtremePercentage);

      const voterConf = toBN(accStakedStkBMI)
        .times(votedExtremePercentage)
        .div(PERCENTAGE_100)
        .dp(0, BigNumber.ROUND_FLOOR);

      assert.equal(toBN(await reputationSystem.reputation(observer)).lt(toBN(reputation)), true);

      assert.equal(
        toBN(await stkBMI.balanceOf(vBMI.address)).toString(),
        toBN(stakingStkBMI).minus(toBN(voterConf)).toString()
      );
      assert.equal(
        toBN(await vBMI.balanceOf(observer)).toString(),
        toBN(accStakedStkBMI).minus(toBN(voterConf)).toString()
      );
      assert.equal(
        toBN(await stkBMI.balanceOf(reinsurancePool.address)).toString(),
        toBN(reinsuranceStkBMI).plus(toBN(voterConf)).toString()
      );
    });

    it("should calculate correct voter reputation", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook1.address, 0, { from: USER2 });
      await stbl.approve(policyBook1.address, stblAmount, { from: USER2 });
      await policyBookFacade1.buyPolicy(5, coverTokensAmount, { from: USER2 });
      assert.equal(await policyRegistry.getPoliciesLength(USER2), 1);

      await bmi.transfer(USER2, wei("1000000"), { from: USER1 });
      const toApproveOnePercent2 = await policyBookFacade1.getClaimApprovalAmount(USER2);
      await bmi.approve(claimVoting.address, 0, { from: USER2 });
      await bmi.approve(claimVoting.address, toApproveOnePercent2, { from: USER2 });

      await policyBook1.submitClaimAndInitializeVoting("", { from: USER2 });

      const staked = [wei("100"), wei("5000"), wei("5000"), wei("300")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVote(accounts[2], [1, 2], staked[0], 0, reputations[0], false);
      await fastVote(accounts[3], [1, 2], staked[1], wei("500"), reputations[1], true);
      await fastVote(accounts[4], [1, 2], staked[2], wei("500"), reputations[2], true);
      await fastVote(accounts[5], [1, 2], staked[3], 0, reputations[3], false);

      const observer = accounts[3];
      const observer2 = accounts[4];

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(2)).plus(100));
      await claimVoting.calculateVotingResultBatch([2], { from: USER2 });

      //await claimVoting.calculateVoterResultBatch([2], { from: observer2 });

      assert.equal(
        toBN(await reputationSystem.reputation(observer)).toString(),
        toBN(await reputationSystem.reputation(observer2)).toString()
      );
    });
  });
});
