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
const ClaimVoting = artifacts.require("ClaimVotingMock");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const CapitalPool = artifacts.require("CapitalPoolMock");
const ReinsurancePool = artifacts.require("ReinsurancePoolMock");
const ShieldMining = artifacts.require("ShieldMining");
const PolicyQuote = artifacts.require("PolicyQuote");
const UserLeveragePool = artifacts.require("UserLeveragePoolMock");
const PriceFeed = artifacts.require("PriceFeed");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WrappedTokenMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const ReputationSystem = artifacts.require("ReputationSystemMock");
const STKBMITokenMock = artifacts.require("STKBMITokenMock");
const StkBMIStaking = artifacts.require("StkBMIStaking");
const YieldGenerator = artifacts.require("YieldGenerator");

const PolicyBook = artifacts.require("PolicyBookMock");
const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacadeMock");

const Reverter = require("./helpers/reverter");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");
//const { signClaimVoting } = require("./helpers/signatures");
const ethSigUtil = require("eth-sig-util");
const ethUtil = require("ethereumjs-util");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

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
  EXPIRED: 7,
};

const VoteStatus = {
  ANONYMOUS_PENDING: 0,
  AWAITING_EXPOSURE: 1,
  EXPIRED: 2,
  EXPOSED_PENDING: 3,
  AWAITING_RECEPTION: 4,
  MINORITY: 5,
  MAJORITY: 6,
  REJECTED: 7,
};

const ListOption = { ALL: 0, MINE: 1 };

function toBN(number) {
  return new BigNumber(number);
}

const signClaimVoting = (domain, message, privateKey) => {
  const data = msgParams(domain, message);

  const signature = ethSigUtil.signTypedMessage(privateKey, { data });
  return signature;
};

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

async function getBlockTimestamp() {
  const latest = toBN(await web3.eth.getBlockNumber());
  return (await web3.eth.getBlock(latest)).timestamp;
}

const wei = web3.utils.toWei;

contract("ClaimVoting", async (accounts) => {
  const reverter = new Reverter(web3);
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const PRECISION = toBN(10).pow(25);
  const PROTOCOL_PERCENTAGE = 20 * PRECISION;
  const PERCENTAGE_100 = toBN(10).pow(27);

  const APPROVAL_PERCENTAGE = 66 * PRECISION;
  const PENALTY_THRESHOLD = 11 * PRECISION;
  const QUORUM = 10 * PRECISION;
  const CALCULATION_REWARD_PER_DAY = PRECISION;

  const WITHDRAWAL_PERIOD = 4 * 24 * 60 * 60; // 4days
  const READY_TO_WITHDRAW_PERIOD = 8 * 24 * 60 * 60; // 8days

  const initialDeposit = wei("1000");
  let stblInitialDeposit;
  let stblAmount;

  const amount = toBN(wei("1000"));
  const coverTokensAmount = toBN(wei("10000"));
  const liquidityAmount = toBN(wei("25000"));
  const virtualLiquidityAmount = toBN(wei("5000"));

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
  let stkBMIStaking;

  let capitalPool;
  let reputationSystem;

  let network;
  let timestamp;

  const USER1 = accounts[1];
  const USER2 = accounts[2];
  const USER3 = accounts[3];
  const USER4 = accounts[4];
  const USER5 = accounts[5];
  const USER6 = accounts[6];
  const USER7 = accounts[7];
  const USER8 = accounts[8];
  const insuranceContract1 = accounts[7];
  const insuranceContract2 = accounts[8];
  const insuranceContract3 = accounts[5];
  const bmiTreasury = accounts[9];

  const USER2_PRIVATE_KEY = "c4ce20adf2b728fe3005be128fb850397ec352d1ea876e3035e46d547343404f";
  const USER3_PRIVATE_KEY = "cddc8640db3142faef4ff7f91390237bc6615bb8a3908d891b927af6da3e3cf8";

  const VERIFYING_CONTRACT = "0x4b871567e49ec71bdb5b9b9567a456063390b43d"; // a random address
  const CONTRACT_DATA = { name: "ClaimVoting", verifyingContract: VERIFYING_CONTRACT };

  const NOTHING = accounts[9];

  const epochPeriod = toBN(604800); // 7 days
  const convert = (amount) => {
    if (network == Networks.ETH || network == Networks.POL) {
      const amountStbl = toBN(amount).div(toBN(10).pow(12));
      return amountStbl;
    } else if (network == Networks.BSC) {
      const amountStbl = toBN(amount);
      return amountStbl;
    }
  };

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
    const _stkBMIStaking = await StkBMIStaking.new();
    const _yieldGenerator = await YieldGenerator.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), bmiTreasury);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
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
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REPUTATION_SYSTEM_NAME(),
      _reputationSystem.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), _stkBMI.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_STAKING_NAME(), _stkBMIStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    reputationSystem = await ReputationSystem.at(await contractsRegistry.getReputationSystemContract());
    stkBMI = await STKBMITokenMock.at(await contractsRegistry.getSTKBMIContract());
    stkBMIStaking = await StkBMIStaking.at(await contractsRegistry.getStkBMIStakingContract());
    const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

    await yieldGenerator.__YieldGenerator_init(network);

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
    await reputationSystem.__ReputationSystem_init([]);
    await stkBMI.__STKBMIToken_init();
    await stkBMIStaking.__StkBMIStaking_init();

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
    await contractsRegistry.injectDependencies(await contractsRegistry.REPUTATION_SYSTEM_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_STAKING_NAME());
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

    await reverter.snapshot();
  });

  beforeEach("creation of PB", async () => {
    stblInitialDeposit = getStableAmount("1000");
    stblAmount = getStableAmount("100000");

    setCurrentTime(1);

    await stbl.approve(policyBookFabric.address, 0);
    await stbl.approve(policyBookFabric.address, stblInitialDeposit.times(2));

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

    const tx = await policyBookFabric.createLeveragePools(
      insuranceContract3,
      ContractType.VARIOUS,
      "User Leverage Pool",
      "USDT"
    );
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    await stbl.transfer(reinsurancePool.address, stblAmount);
  });
  afterEach("revert", reverter.revert);

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
    }

    const encryptedSuggestedAmount = aesjs.utils.hex.fromBytes(
      aesCtr.encrypt(aesjs.utils.hex.toBytes(suggestedAmountStr))
    );

    const hashedSignatureOfClaim = web3.utils.soliditySha3(signatureOfClaim);
    const finalHash = web3.utils.soliditySha3(hashedSignatureOfClaim, encryptedSuggestedAmount, suggestedAmount);

    return [finalHash, encryptedSuggestedAmount];
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
    stblAmount = getStableAmount("100000");
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
      await policyBookFacade1.buyPolicy(7, amount1, { from: USER1 });
      assert.equal(await policyRegistry.getPoliciesLength(USER1), 1);

      const toApproveOnePercent1 = await policyBookFacade1.getClaimApprovalAmount(USER1);
      await bmi.approve(claimVoting.address, 0, { from: USER1 });
      await bmi.approve(claimVoting.address, toApproveOnePercent1, { from: USER1 });
    }
    if (amount2 > 0) {
      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook2.address, 0, { from: USER2 });
      await stbl.approve(policyBook2.address, stblAmount, { from: USER2 });
      await policyBookFacade2.buyPolicy(7, amount2, { from: USER2 });
      assert.equal(await policyRegistry.getPoliciesLength(USER2), 1);

      await bmi.transfer(USER2, wei("1000000"), { from: USER1 });
      const toApproveOnePercent2 = await policyBookFacade2.getClaimApprovalAmount(USER2);
      await bmi.approve(claimVoting.address, 0, { from: USER2 });
      await bmi.approve(claimVoting.address, toApproveOnePercent2, { from: USER2 });
    }
  }

  async function initAppeal(claimIndex, policyBookFacade, user) {
    await setCurrentTime(
      toBN(await claimingRegistry.votingDuration(claimIndex))
        .plus(10)
        .toString()
    );

    await claimVoting.calculateResult(claimIndex, { from: user });

    const toApproveOnePercent = await policyBookFacade.getClaimApprovalAmount(user);
    await bmi.approve(claimVoting.address, 0, { from: user });
    await bmi.approve(claimVoting.address, toApproveOnePercent, { from: user });
  }

  async function mintAndStake(user, mintAmount, stakeAmount) {
    await stkBMI.mintArbitrary(user, mintAmount); // 1 mil
    await stkBMI.approve(stkBMIStaking.address, mintAmount, { from: user });
    if (stakeAmount > 0) {
      await stkBMIStaking.lockStkBMI(stakeAmount, { from: user });
    }
  }

  async function voteAndExpose(suggestedClaimAmount, userPrivateKey, user) {
    const claimIndex = 1;
    const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
      claimIndex,
      suggestedClaimAmount,
      userPrivateKey
    );

    await claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [encryptedSuggestedAmount], { from: user });

    await setCurrentTime(toBN(await claimingRegistry.anonymousVotingDuration(claimIndex)).plus(10));

    const votesCount = await claimVoting.countNotReceivedVotes(user);
    const myVotes = await claimVoting.myVotes(0, votesCount, { from: user });

    const encrypted = myVotes[0][1];

    const [hashedSigantureOfClaim, suggestedAmount] = await getAnonymousDecrypted(
      claimIndex,
      encrypted,
      userPrivateKey
    );

    const res = await claimVoting.exposeVoteBatch([claimIndex], [suggestedAmount], [hashedSigantureOfClaim], [true], {
      from: user,
    });

    console.log("ExposeVote gas used: " + res.receipt.gasUsed);
  }

  async function voteAndReject(suggestedClaimAmount, userPrivateKey, user) {
    const claimIndex = 1;
    const [finalHash, encryptedSuggestedAmount] = await getAnonymousEncrypted(
      claimIndex,
      suggestedClaimAmount,
      userPrivateKey
    );

    await claimVoting.anonymouslyVoteBatch([claimIndex], [finalHash], [encryptedSuggestedAmount], { from: user });

    await setCurrentTime(toBN(await claimingRegistry.anonymousVotingDuration(claimIndex)).plus(10));

    const votesCount = await claimVoting.countNotReceivedVotes(user);
    const myVotes = await claimVoting.myVotes(0, votesCount, { from: user });

    const encrypted = myVotes[0][1];

    const [hashedSigantureOfClaim, suggestedAmount] = await getAnonymousDecrypted(
      claimIndex,
      encrypted,
      userPrivateKey
    );

    const res = await claimVoting.exposeVoteBatch([claimIndex], [suggestedAmount], [hashedSigantureOfClaim], [false], {
      from: user,
    });

    console.log("ExposeVote gas used: " + res.receipt.gasUsed);
  }

  async function calculate(staked, suggestedAmounts, reputations) {
    for (let i = 0; i < staked.length; i++) {
      const VOTER = accounts[i + 2];

      await mintAndStake(VOTER, wei(toBN(10).pow(18).toString()), staked[i]);

      await reputationSystem.setNewReputationNoCheck(VOTER, reputations[i]);
      await claimVoting.voteBatch([1], [suggestedAmounts[i]], [true], { from: VOTER });
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

  async function fastVoteConfirmed(claimIndex, voter, stake, suggestedAmount, reputation, yes) {
    await mintAndStake(voter, wei("1000000"), stake);
    await reputationSystem.setNewReputationNoCheck(voter, reputation);

    if (yes) {
      await claimVoting.voteBatch([claimIndex], [suggestedAmount], [true], { from: voter });
    } else {
      await claimVoting.voteBatch([claimIndex], [0], [true], { from: voter });
    }
  }

  async function fastVoteRejected(claimIndex, voter, stake, suggestedAmount, reputation, yes) {
    await mintAndStake(voter, wei("1000000"), stake);
    await reputationSystem.setNewReputationNoCheck(voter, reputation);

    if (yes) {
      await claimVoting.voteBatch([claimIndex], [suggestedAmount], [false], { from: voter });
    } else {
      await claimVoting.voteBatch([claimIndex], [0], [false], { from: voter });
    }
  }

  async function calculateAverageStake(staked, reputations, from, to) {
    let allStake = toBN(0);

    for (let i = from; i < to; i++) {
      allStake = allStake.plus(toBN(staked[i]).times(toBN(reputations[i])));
    }

    return allStake;
  }

  describe("initializeVoting", async () => {
    beforeEach(async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await capitalPool.setliquidityCushionBalance(getStableAmount("1000000"));
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
      const claims = await claimVoting.listClaims(0, claimsCount, ListOption.ALL);

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
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      await initAppeal(1, policyBookFacade1, USER1);
      const res = await policyBook1.submitAppealAndInitializeVoting("", { from: USER1 });
      console.log("InitializeAppeal gas used: " + res.receipt.gasUsed);

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(await getBlockTimestamp()).plus(10));

      const coverage = toBN((await policyBook1.userStats(USER1))[0]);
      const userProtocol = BigNumber.min(
        toBN((await policyBook1.userStats(USER1))[3])
          .times(20)
          .idiv(100),
        coverage.idiv(100)
      );

      const claimsCount = await claimingRegistry.countClaims();
      assert.equal(claimsCount, 2);
      const claims = await claimVoting.listClaims(0, claimsCount, ListOption.ALL);

      assert.equal(claims[1][0][0], 2);
      assert.equal(claims[1][0][1], USER1);
      assert.equal(claims[1][0][2], policyBook1.address);
      assert.equal(claims[1][0][3], "");
      assert.equal(claims[1][0][4], true);
      assert.equal(toBN(claims[1][0][5]).toString(), coverage.toString());
      assert.equal(claims[1][0][6], timestamp);
      assert.equal(claims[1][1], ClaimStatus.PENDING);
      assert.equal(claims[1][2], 0);
      assert.equal(claims[1][3], 0);

      const claimResult = await claimVoting.getVotingResult(2);

      assert.equal(toBN(claimResult[0]).toString(), coverage.toString());
      assert.equal(toBN(claimResult[1]).toString(), coverage.idiv(100).toString());
      assert.equal(toBN(claimResult[2]).toString(), userProtocol.toString());
      assert.equal(claimResult[3], 0);
      assert.equal(claimResult[4], 0);
      assert.equal(claimResult[5], 0);
      assert.equal(claimResult[6], 0);
      assert.equal(claimResult[7], 0);
    });

    it("should initialize new claim after expired claim", async () => {
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      let timestamp1 = await getBlockTimestamp();

      await setCurrentTime(
        toBN(timestamp1)
          .plus(await claimingRegistry.validityDuration(1))
          .plus(10)
          .toString()
      );

      await claimVoting.calculateResult(1, { from: USER4 });

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);
      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.EXPIRED);

      const toApproveOnePercent1 = await policyBookFacade1.getClaimApprovalAmount(USER1);
      await bmi.approve(claimVoting.address, 0, { from: USER1 });
      await bmi.approve(claimVoting.address, toApproveOnePercent1, { from: USER1 });
      const res = await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      console.log("InitializeClaim gas used: " + res.receipt.gasUsed);

      let timestamp2 = await getBlockTimestamp();
      await setCurrentTime(toBN(await getBlockTimestamp()).plus(10));

      const coverage = toBN((await policyBook1.userStats(USER1))[0]);
      const userProtocol = BigNumber.min(
        toBN((await policyBook1.userStats(USER1))[3])
          .times(20)
          .idiv(100),
        coverage.idiv(100)
      );

      await claimingRegistry.withdrawLockedBMI(1, { from: USER1 });
      assert.equal(toBN(await bmi.balanceOf(claimVoting.address)).toString(), coverage.idiv(100).toString());

      const claimsCount = await claimingRegistry.countClaims();
      assert.equal(claimsCount, 2);
      const claims = await claimVoting.listClaims(0, claimsCount, ListOption.ALL);

      assert.equal(claims[0][0][0], 1);
      assert.equal(claims[0][0][1], USER1);
      assert.equal(claims[0][0][2], policyBook1.address);
      assert.equal(claims[0][0][3], "");
      assert.equal(claims[0][0][4], false);
      assert.equal(toBN(claims[0][0][5]).toString(), coverage.toString());
      assert.equal(claims[0][0][6], timestamp1);
      assert.equal(claims[0][1], ClaimStatus.EXPIRED);
      assert.equal(claims[0][2], 0);
      assert.equal(claims[0][3], 0);

      assert.equal(claims[1][0][0], 2);
      assert.equal(claims[1][0][1], USER1);
      assert.equal(claims[1][0][2], policyBook1.address);
      assert.equal(claims[1][0][3], "");
      assert.equal(claims[1][0][4], false);
      assert.equal(toBN(claims[1][0][5]).toString(), coverage.toString());
      assert.equal(claims[1][0][6], timestamp2);
      assert.equal(claims[1][1], ClaimStatus.PENDING);
      assert.equal(claims[1][2], 0);
      assert.equal(claims[1][3], 0);

      const claimResult = await claimVoting.getVotingResult(2);

      assert.equal(toBN(claimResult[0]).toString(), coverage.toString());
      assert.equal(toBN(claimResult[1]).toString(), coverage.idiv(100).toString());
      assert.equal(toBN(claimResult[2]).toString(), userProtocol.toString());
      assert.equal(claimResult[3], 0);
      assert.equal(claimResult[4], 0);
      assert.equal(claimResult[5], 0);
      assert.equal(claimResult[6], 0);
      assert.equal(claimResult[7], 0);
    });

    it("tests all getters after initializeVoting", async () => {
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(await getBlockTimestamp()).plus(10));

      const coverage = toBN((await policyBook1.userStats(USER1))[0]);

      const claimsCount = await claimingRegistry.countClaims();
      assert.equal(claimsCount, 1);

      // canWithdraw
      assert.equal(await claimVoting.canUnstake(USER1), true);
      assert.equal(await claimVoting.canUnstake(USER2), true);

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
      let allClaims = await claimVoting.listClaims(0, claimsCount, ListOption.ALL);
      assert.equal(allClaims[0][0][0], 1);
      assert.equal(allClaims[0][0][1], USER1);
      assert.equal(allClaims[0][1], ClaimStatus.PENDING);
      assert.equal(allClaims[0][2], 0);
      assert.equal(allClaims[0][3], 0);

      // myClaims
      let myClaimsCount = await claimingRegistry.countPolicyClaimerClaims(USER1);
      assert.equal(myClaimsCount, 1);
      let myClaims = await claimVoting.listClaims(0, myClaimsCount, ListOption.MINE, { from: USER1 });
      assert.equal(myClaims[0][0][0], 1);
      assert.equal(myClaims[0][0][1], USER1);
      assert.equal(myClaims[0][0][2], policyBook1.address);
      assert.equal(myClaims[0][0][3], "");
      assert.equal(myClaims[0][0][4], false);
      assert.equal(myClaims[0][1], ClaimStatus.PENDING);
      assert.equal(toBN(myClaims[0][2]).toString(), "0");
      assert.equal(myClaims[0][3], 0);

      myClaimsCount = await claimingRegistry.countPolicyClaimerClaims(USER2);
      assert.equal(myClaimsCount, 0);

      // myVotes
      let myVotesCount = await claimVoting.countVotes(USER1);
      assert.equal(myVotesCount, 0);
      myVotesCount = await claimVoting.countVotes(USER2);
      assert.equal(myVotesCount, 0);
    });
  });

  describe("encrypt vote", async () => {
    const coverTokensAmount = wei("10000");
    const liquidityAmount = wei("50000");
    const coverTokensAmount2 = wei("999");
    const liquidityAmount2 = wei("4765");

    it("should successfully confirm vote (1)", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await mintAndStake(USER2, liquidityAmount, liquidityAmount);
      await voteAndExpose(coverTokensAmount, USER2_PRIVATE_KEY, USER2);
    });
    it("should successfully confirm vote (2)", async () => {
      await initVoting(liquidityAmount2, coverTokensAmount2, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await mintAndStake(USER2, liquidityAmount, liquidityAmount);
      await voteAndExpose(coverTokensAmount2, USER2_PRIVATE_KEY, USER2);
    });
    it("should successfully confirm vote (3)", async () => {
      await initVoting(liquidityAmount2, coverTokensAmount2, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await mintAndStake(USER2, liquidityAmount, liquidityAmount);
      await voteAndExpose(0, USER2_PRIVATE_KEY, USER2);
    });
    it("should successfully confirm vote && set correct status after calculation", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await mintAndStake(USER2, liquidityAmount, liquidityAmount);
      await voteAndExpose(0, USER2_PRIVATE_KEY, USER2);

      const claimIndex = 1;

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(claimIndex)).plus(10));

      await claimVoting.calculateResult(1, { from: USER1 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER2 });

      assert.equal(await claimVoting.voteStatus(1), VoteStatus.MAJORITY);
    });
    it("should successfully reject vote (1)", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await mintAndStake(USER2, liquidityAmount, liquidityAmount);
      await voteAndReject(coverTokensAmount, USER2_PRIVATE_KEY, USER2);
    });
    it("should successfully reject vote (2)", async () => {
      await initVoting(liquidityAmount2, coverTokensAmount2, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await mintAndStake(USER2, liquidityAmount, liquidityAmount);
      await voteAndReject(coverTokensAmount2, USER2_PRIVATE_KEY, USER2);
    });
    it("should successfully reject vote (3)", async () => {
      await initVoting(liquidityAmount2, coverTokensAmount2, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await mintAndStake(USER2, liquidityAmount, liquidityAmount);
      await voteAndReject(0, USER2_PRIVATE_KEY, USER2);
    });
    it("should successfully reject vote && set correct status after calculation", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await mintAndStake(USER2, liquidityAmount, liquidityAmount);
      await voteAndReject(0, USER2_PRIVATE_KEY, USER2);

      const claimIndex = 1;

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(claimIndex)).plus(10));

      await claimVoting.calculateResult(1, { from: USER1 });

      assert.equal(await claimVoting.voteStatus(1), VoteStatus.REJECTED);
    });
    describe("anonymouslyVoteBatch()", async () => {
      let claimIndex, suggestedClaimAmount;
      let finalHashUser3, encryptedSuggestedAmountUser3;
      let finalHashUser2, encryptedSuggestedAmountUser2;

      beforeEach("setup", async () => {
        await initVoting(liquidityAmount, coverTokensAmount, coverTokensAmount);
        await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

        claimIndex = 1;
        suggestedClaimAmount = coverTokensAmount;

        // different users must have differents hashes
        [finalHashUser3, encryptedSuggestedAmountUser3] = await getAnonymousEncrypted(
          claimIndex,
          suggestedClaimAmount,
          USER3_PRIVATE_KEY
        );
        [finalHashUser2, encryptedSuggestedAmountUser2] = await getAnonymousEncrypted(
          claimIndex,
          suggestedClaimAmount,
          USER2_PRIVATE_KEY
        );

        assert.notEqual(finalHashUser3, finalHashUser2);
        assert.notEqual(encryptedSuggestedAmountUser3, encryptedSuggestedAmountUser2);

        assert.equal(await claimingRegistry.isClaimPending(1), true);
        assert.equal(await claimingRegistry.isClaimAnonymouslyVotable(1), true);
      });
      it.skip("should successfully sign a vote claim using EIP 712", async () => {
        const buffer = Buffer.from(USER3_PRIVATE_KEY, "hex");

        const claim = {
          claimIndex: 52,
        };

        // it should create same signature that was created using metamask
        // 0x30... was created using Metamask
        const signatureOfClaim = signClaimVoting(CONTRACT_DATA, claim, buffer);
        assert.equal(
          signatureOfClaim,
          "0xb73ff4f82a16cc3e51ca576aa6dcbb2d66be0119ec3a5c1cfc24a2b9cde47ed20e2b4260d95663e921238bd58fdd91b8048d747ffa8d5de03323c90b8443cade1c"
        );

        const params = JSON.stringify(msgParams(CONTRACT_DATA, claim));

        const recovered = ethSigUtil.recoverTypedSignature_v4({
          data: JSON.parse(params),
          sig: signatureOfClaim,
        });

        // address recovered from the signature must be equal to the signature that signed it.
        // if it is different, it has a problem.
        assert.equal(ethUtil.toChecksumAddress(recovered), ethUtil.toChecksumAddress(USER3));
      });
      it("should not successfully vote without previous staking", async () => {
        await mintAndStake(USER2, wei("1000000"), 0);

        const reason = "CV: 0 staked StkBMI";
        await truffleAssert.reverts(
          claimVoting.anonymouslyVoteBatch([claimIndex], [finalHashUser2], [encryptedSuggestedAmountUser2], {
            from: USER2,
          }),
          reason
        );
      });
      it("should successfully vote with previous staking", async () => {
        await mintAndStake(USER2, wei("1000000"), wei("1000"));
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
      it("should not successfully vote if voter has awaiting reception votes", async () => {
        await mintAndStake(USER3, wei("1000000"), wei("100"));

        await claimVoting.voteBatch([1], [suggestedClaimAmount], [true], {
          from: USER3,
        });

        await setCurrentTime(
          toBN(await claimingRegistry.votingDuration(1))
            .plus(10)
            .toString()
        );
        await claimVoting.calculateResult(1, { from: USER1 });

        await policyBook2.submitClaimAndInitializeVoting("", { from: USER2 });

        const reason = "CV: Awaiting votes";
        await truffleAssert.reverts(
          claimVoting.anonymouslyVoteBatch([claimIndex], [finalHashUser3], [encryptedSuggestedAmountUser3], {
            from: USER3,
          }),
          reason
        );
      });
      it("should not successfully vote length mismatch", async () => {
        await mintAndStake(USER2, wei("1000000"), wei("100"));

        const reason = "CV: Length mismatches";
        // empty claimindex array
        await truffleAssert.reverts(
          claimVoting.anonymouslyVoteBatch([], [finalHashUser2], [encryptedSuggestedAmountUser2], {
            from: USER2,
          }),
          reason
        );

        // empty finalHashes array
        await truffleAssert.reverts(
          claimVoting.anonymouslyVoteBatch([claimIndex], [], [encryptedSuggestedAmountUser2], {
            from: USER2,
          }),
          reason
        );

        // empty encryptedVotes array
        await truffleAssert.reverts(
          claimVoting.anonymouslyVoteBatch([claimIndex], [finalHashUser2], [], {
            from: USER2,
          }),
          reason
        );
      });
      it("should not successfully vote if voter is claimer", async () => {
        await policyBook2.submitClaimAndInitializeVoting("", { from: USER2 });
        await mintAndStake(USER2, wei("1000000"), wei("100"));

        const reason = "CV: Voter is the claimer";
        await truffleAssert.reverts(
          claimVoting.anonymouslyVoteBatch([2], [finalHashUser2], [encryptedSuggestedAmountUser2], {
            from: USER2,
          }),
          reason
        );
      });
      it("should not successfully vote if anonymous voting is over", async () => {
        const timestamp = await getBlockTimestamp();
        await setCurrentTime(toBN(timestamp).plus(10 * 24 * 60 * 60)); // 10 days

        await mintAndStake(USER2, wei("1000000"), wei("100"));

        await truffleAssert.reverts(
          claimVoting.anonymouslyVoteBatch([claimIndex], [finalHashUser2], [encryptedSuggestedAmountUser2], {
            from: USER2,
          }),
          "CV: Anonymous voting is over"
        );
      });
      it("should not successfully vote for appeal if voter is not trusted", async () => {
        await initAppeal(claimIndex, policyBookFacade1, USER1);
        await policyBook1.submitAppealAndInitializeVoting("", { from: USER1 });

        await mintAndStake(USER2, wei("1000000"), wei("100"));

        const reason = "CV: Not a trusted voter";
        await truffleAssert.reverts(
          claimVoting.anonymouslyVoteBatch([2], [finalHashUser2], [encryptedSuggestedAmountUser2], {
            from: USER2,
          }),
          reason
        );
      });
      it("should not successfully vote if voter already voted for the claim", async () => {
        await mintAndStake(USER2, wei("1000000"), wei("100"));
        await claimVoting.anonymouslyVoteBatch([claimIndex], [finalHashUser2], [encryptedSuggestedAmountUser2], {
          from: USER2,
        });

        const reason = "CV: Already voted for this claim";
        await truffleAssert.reverts(
          claimVoting.anonymouslyVoteBatch([claimIndex], [finalHashUser2], [encryptedSuggestedAmountUser2], {
            from: USER2,
          }),
          reason
        );
      });
    });
    describe("exposeVoteBatch()", async () => {
      let claimIndex, suggestedClaimAmount;
      let finalHashUser3, encryptedSuggestedAmountUser3;
      let finalHashUser2, encryptedSuggestedAmountUser2;
      let timestamp;

      beforeEach("setup", async () => {
        await initVoting(liquidityAmount, coverTokensAmount, coverTokensAmount);
        await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
        timestamp = await getBlockTimestamp();

        claimIndex = 1;
        suggestedClaimAmount = coverTokensAmount;

        // different users must have differents hashes
        [finalHashUser3, encryptedSuggestedAmountUser3] = await getAnonymousEncrypted(
          claimIndex,
          suggestedClaimAmount,
          USER3_PRIVATE_KEY
        );
        [finalHashUser2, encryptedSuggestedAmountUser2] = await getAnonymousEncrypted(
          claimIndex,
          suggestedClaimAmount,
          USER2_PRIVATE_KEY
        );

        assert.notEqual(finalHashUser3, finalHashUser2);
        assert.notEqual(encryptedSuggestedAmountUser3, encryptedSuggestedAmountUser2);

        assert.equal(await claimingRegistry.isClaimPending(1), true);
        assert.equal(await claimingRegistry.isClaimAnonymouslyVotable(1), true);

        await mintAndStake(USER2, wei("1000000"), wei("1000"));
        const res = await claimVoting.anonymouslyVoteBatch(
          [claimIndex],
          [finalHashUser2],
          [encryptedSuggestedAmountUser2],
          {
            from: USER2,
          }
        );

        setCurrentTime(
          toBN(timestamp)
            .plus(await claimingRegistry.anonymousVotingDuration(1))
            .plus(10)
        );

        assert.equal(await claimingRegistry.isClaimPending(1), true);
        assert.equal(await claimingRegistry.isClaimAnonymouslyVotable(1), false);
        assert.equal(await claimingRegistry.isClaimExposablyVotable(1), true);
      });
      it("should fail exposing unvoted vote", async () => {
        await mintAndStake(USER3, wei("10000"), wei("100"));

        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([claimIndex], [suggestedClaimAmount], ["0x"], [true], {
            from: USER3,
          }),
          "CV: Vote doesn't exist"
        );
        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([claimIndex], [suggestedClaimAmount], ["0x"], [false], {
            from: USER3,
          }),
          "CV: Vote doesn't exist"
        );
      });
      it("should fail due to different suggested claim amount", async () => {
        const votesCount = await claimVoting.countNotReceivedVotes(USER2);
        const myVotes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

        const encrypted = myVotes[0][1];
        const [hashedSignatureOfClaim] = await getAnonymousDecrypted(claimIndex, encrypted, USER2_PRIVATE_KEY);

        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch(
            [claimIndex],
            [toBN(coverTokensAmount).idiv(2)],
            [hashedSignatureOfClaim],
            [true],
            {
              from: USER2,
            }
          ),
          "CV: Data mismatches"
        );
        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch(
            [claimIndex],
            [toBN(coverTokensAmount).idiv(2)],
            [hashedSignatureOfClaim],
            [false],
            {
              from: USER2,
            }
          ),
          "CV: Data mismatches"
        );
      });
      it("should fail due to length mismatch", async () => {
        const votesCount = await claimVoting.countNotReceivedVotes(USER2);
        const myVotes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

        const encrypted = myVotes[0][1];
        const [hashedSignatureOfClaim] = await getAnonymousDecrypted(claimIndex, encrypted, USER2_PRIVATE_KEY);

        const reason = "CV: Length mismatches";

        // empty claim array
        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([], [coverTokensAmount], [hashedSignatureOfClaim], [true], {
            from: USER2,
          }),
          reason
        );
        // empty suggested amount array
        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([claimIndex], [], [hashedSignatureOfClaim], [true], {
            from: USER2,
          }),
          reason
        );
        // empty signature array
        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([claimIndex], [coverTokensAmount], [], [true], {
            from: USER2,
          }),
          reason
        );
        // empty confirmation array
        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([claimIndex], [coverTokensAmount], [hashedSignatureOfClaim], [], {
            from: USER2,
          }),
          reason
        );
      });
      it("should fail if amount exceeds coverage", async () => {
        await policyBook2.submitClaimAndInitializeVoting("", { from: USER2 });
        const timestamp = await getBlockTimestamp();

        await mintAndStake(USER3, coverTokensAmount, coverTokensAmount);
        const coverTokensAmountX2 = toBN(coverTokensAmount).times(2);
        [finalHashUser3, encryptedSuggestedAmountUser3] = await getAnonymousEncrypted(
          2,
          coverTokensAmountX2,
          USER3_PRIVATE_KEY
        );

        await claimVoting.anonymouslyVoteBatch([2], [finalHashUser3], [encryptedSuggestedAmountUser3], { from: USER3 });

        const votesCount = await claimVoting.countNotReceivedVotes(USER3);
        const myVotes = await claimVoting.myVotes(0, votesCount, { from: USER3 });

        const encrypted = myVotes[0][1];
        const [hashedSignatureOfClaim] = await getAnonymousDecrypted(2, encrypted, USER3_PRIVATE_KEY);

        setCurrentTime(
          toBN(timestamp)
            .plus(await claimingRegistry.anonymousVotingDuration(2))
            .plus(10)
        );

        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([2], [coverTokensAmountX2], [hashedSignatureOfClaim], [true], {
            from: USER3,
          }),
          "CV: Amount exceeds coverage"
        );
        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([2], [coverTokensAmountX2], [hashedSignatureOfClaim], [false], {
            from: USER3,
          }),
          "CV: Amount exceeds coverage"
        );
      });
      it("should fail due to vote not being 'awaiting exposure'", async () => {
        await policyBook2.submitClaimAndInitializeVoting("", { from: USER2 });
        await mintAndStake(USER3, coverTokensAmount, coverTokensAmount);
        await claimVoting.anonymouslyVoteBatch([2], [finalHashUser3], [encryptedSuggestedAmountUser3], { from: USER3 });

        const votesCount = await claimVoting.countNotReceivedVotes(USER3);
        const myVotes = await claimVoting.myVotes(0, votesCount, { from: USER3 });

        const encrypted = myVotes[0][1];
        const [hashedSigantureOfClaim] = await getAnonymousDecrypted(2, encrypted, USER3_PRIVATE_KEY);

        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([2], [coverTokensAmount], [hashedSigantureOfClaim], [true], { from: USER3 }),
          "CV: Vote is not awaiting"
        );
        await truffleAssert.reverts(
          claimVoting.exposeVoteBatch([2], [coverTokensAmount], [hashedSigantureOfClaim], [false], { from: USER3 }),
          "CV: Vote is not awaiting"
        );
      });
      it("should be expired", async () => {
        assert.equal(await claimingRegistry.isClaimVotable(1), true);

        await setCurrentTime(
          toBN(timestamp)
            .plus(await claimingRegistry.votingDuration(claimIndex))
            .plus(10)
        );

        assert.equal(await claimingRegistry.isClaimVotable(1), false);
        assert.equal(await claimingRegistry.isClaimPending(1), true);
        assert.equal(await claimingRegistry.isClaimAnonymouslyVotable(1), false);
        assert.equal(await claimingRegistry.isClaimExposablyVotable(1), false);

        const voteIndex = await claimVoting.voteIndex(1, USER2);

        assert.equal((await claimVoting.voteStatus(voteIndex)).toString(), VoteStatus.EXPIRED);
      });
      it("should expose vote succesfully (confirmed)", async () => {
        const votesCount = await claimVoting.countNotReceivedVotes(USER2);
        const myVotes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

        const encrypted = myVotes[0][1];
        const [hashedSignatureOfClaim] = await getAnonymousDecrypted(claimIndex, encrypted, USER2_PRIVATE_KEY);

        await claimVoting.exposeVoteBatch([claimIndex], [coverTokensAmount], [hashedSignatureOfClaim], [true], {
          from: USER2,
        });
        const voteIndex = await claimVoting.voteIndex(1, USER2);

        assert.equal((await claimVoting.voteStatus(voteIndex)).toString(), VoteStatus.EXPOSED_PENDING);
      });
      it("should expose vote succesfully (rejected)", async () => {
        const votesCount = await claimVoting.countNotReceivedVotes(USER2);
        const myVotes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

        const encrypted = myVotes[0][1];
        const [hashedSignatureOfClaim] = await getAnonymousDecrypted(claimIndex, encrypted, USER2_PRIVATE_KEY);

        await claimVoting.exposeVoteBatch([claimIndex], [coverTokensAmount], [hashedSignatureOfClaim], [false], {
          from: USER2,
        });
        const voteIndex = await claimVoting.voteIndex(1, USER2);

        assert.equal((await claimVoting.voteStatus(voteIndex)).toString(), VoteStatus.REJECTED);
      });
    });
  });

  describe("vote for or against", async () => {
    beforeEach("initializeVoting", async () => {
      await capitalPool.setliquidityCushionBalance(getStableAmount("1000000"));
    });
    it("tests all getters after voteBatch", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(await getBlockTimestamp()).plus(10));

      const coverage = toBN((await policyBook1.userStats(USER1))[0]);

      const claimsCount = await claimingRegistry.countClaims();
      assert.equal(claimsCount, 1);

      const claimIndex = 1;
      const suggestedClaimAmount = coverTokensAmount;

      await mintAndStake(USER2, wei("1000000"), wei("100"));

      await claimVoting.voteBatch([claimIndex], [suggestedClaimAmount], [true], {
        from: USER2,
      });

      // canWithdraw
      assert.equal(await claimVoting.canUnstake(USER1), true);
      assert.equal(await claimVoting.canUnstake(USER2), false);

      // canVote
      assert.equal(await claimVoting.canVote(USER1), true);
      assert.equal(await claimVoting.canVote(USER2), true);

      // voteStatus
      assert.equal(await claimVoting.voteStatus(1), VoteStatus.EXPOSED_PENDING);

      // whatCanIVoteFor
      let whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER2 });
      assert.equal(whatVoteFor[0], 0);

      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER1 });
      assert.equal(whatVoteFor[0], 0);

      // allClaims
      let allClaims = await claimVoting.listClaims(0, claimsCount, ListOption.ALL);
      assert.equal(allClaims[0][0][0], 1);
      assert.equal(allClaims[0][0][1], USER1);
      assert.equal(allClaims[0][1], ClaimStatus.PENDING);
      assert.equal(allClaims[0][2], 0);
      assert.equal(allClaims[0][3], 0);

      // myClaims
      let myClaimsCount = await claimingRegistry.countPolicyClaimerClaims(USER1);
      assert.equal(myClaimsCount, 1);
      let myClaims = await claimVoting.listClaims(0, myClaimsCount, ListOption.MINE, { from: USER1 });
      assert.equal(myClaims[0][0][0], 1);
      assert.equal(myClaims[0][0][1], USER1);
      assert.equal(myClaims[0][0][2], policyBook1.address);
      assert.equal(myClaims[0][0][3], "");
      assert.equal(myClaims[0][0][4], false);
      assert.equal(myClaims[0][1], ClaimStatus.PENDING);
      assert.equal(toBN(myClaims[0][2]).toString(), "0");
      assert.equal(myClaims[0][3], 0);

      myClaimsCount = await claimingRegistry.countPolicyClaimerClaims(USER2);
      assert.equal(myClaimsCount, 0);

      // myVotes
      let myVotesCount = await claimVoting.countNotReceivedVotes(USER1);
      assert.equal(myVotesCount, 0);
      myVotesCount = await claimVoting.countNotReceivedVotes(USER2);
      assert.equal(myVotesCount, 1);
      let myVotes = await claimVoting.myVotes(0, myVotesCount, { from: USER2 });
      assert.equal(myVotes[0][0][0][0], 1);
      assert.equal(myVotes[0][0][0][2], policyBook1.address);
      assert.equal(myVotes[0][0][1], ClaimStatus.PENDING);
      assert.equal(myVotes[0][3], VoteStatus.EXPOSED_PENDING);
      assert.equal(myVotes[0][4], 0);
    });
    describe("vote for", async () => {
      beforeEach("initializeVoting", async () => {
        await initVoting(liquidityAmount, coverTokensAmount, 0);
        await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
        timestamp = await getBlockTimestamp();
      });
      it("should successfully vote for", async () => {
        await mintAndStake(USER2, wei("1000000"), wei("100"));

        const coverage = toBN((await policyBook1.userStats(USER1))[0]);
        const userProtocol = BigNumber.min(
          toBN((await policyBook1.userStats(USER1))[3])
            .times(20)
            .idiv(100),
          coverage.idiv(100)
        );

        await claimVoting.voteBatch([1], [coverage], [true], { from: USER2 });

        const claimResult = await claimVoting.getVotingResult(1);

        assert.equal(toBN(claimResult[0]), coverage.toString());
        assert.equal(toBN(claimResult[1]).toString(), coverage.idiv(100).toString());
        assert.equal(toBN(claimResult[2]).toString(), userProtocol.toString());
        assert.equal(toBN(claimResult[3]).toString(), toBN(coverTokensAmount).toString()); // average withdraw
        assert.equal(toBN(claimResult[4]).toString(), toBN(PRECISION).times(wei("100")).toString()); // yes average stake
        assert.equal(claimResult[5], 0); // no average stake
        assert.equal(toBN(claimResult[6]).toString(), toBN(wei("100")).toString()); // all voted stake
        assert.equal(claimResult[7], 0); // voted yes percentage (after calculation)

        const votesCount = await claimVoting.countNotReceivedVotes(USER2);

        assert.equal(votesCount, 1);

        assert.equal(await claimVoting.voteStatus(1), VoteStatus.EXPOSED_PENDING);

        const votes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

        assert.equal(votes[0][0][0][0], 1);
        assert.equal(votes[0][0][0][1], USER1);
        assert.equal(votes[0][0][0][2], policyBook1.address);
        assert.equal(votes[0][0][0][3], "");
        assert.equal(votes[0][0][0][4], false);
        assert.equal(toBN(votes[0][0][0][5]).toString(), toBN(coverTokensAmount).toString());
        assert.equal(votes[0][0][0][6], timestamp.toString());
        assert.equal(votes[0][0][1], ClaimStatus.PENDING);
        assert.equal(votes[0][0][2], 0);
        assert.equal(votes[0][1], "");
        assert.equal(toBN(votes[0][2]).toString(), coverage.toString());
        assert.equal(votes[0][3], VoteStatus.EXPOSED_PENDING);
        assert.equal(votes[0][4], 0);

        await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

        await capitalPool.setliquidityCushionBalance(getStableAmount("1000000"));
        await claimVoting.calculateResult(1, { from: USER1 });

        let myVotes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

        assert.equal(myVotes[0][0][0][0][0].toString(), 1);
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
      it("should reject if no one voted for appeal", async () => {
        await initAppeal(1, policyBookFacade1, USER1);
        await policyBook1.submitAppealAndInitializeVoting("", { from: USER1 });
        timestamp = await getBlockTimestamp();

        await reputationSystem.setNewReputationNoCheck(USER1, toBN(PRECISION).times(2));

        await setCurrentTime(
          toBN(timestamp)
            .plus(await claimingRegistry.votingDuration(2))
            .plus(10)
            .toString()
        );
        await claimVoting.calculateResult(2, { from: USER1 });

        assert.equal(await claimingRegistry.claimStatus(2), ClaimStatus.REJECTED);
      });

      it("should vote for appeal if trusted voter", async () => {
        await initAppeal(1, policyBookFacade1, USER1);
        await policyBook1.submitAppealAndInitializeVoting("", { from: USER1 });
        timestamp = await getBlockTimestamp();

        await reputationSystem.setNewReputationNoCheck(USER2, toBN(PRECISION).times(2));

        await mintAndStake(USER2, wei("10000000"), wei("1000"));

        await claimVoting.voteBatch([2], [wei("100")], [true], { from: USER2 });

        const votesCount = await claimVoting.countNotReceivedVotes(USER2);
        const votes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

        assert.equal(votes[0][0][0][0], 2);
        assert.equal(votes[0][0][0][1], USER1);
        assert.equal(votes[0][0][0][2], policyBook1.address);
        assert.equal(votes[0][0][0][3], "");
        assert.equal(votes[0][0][0][4], true);
        assert.equal(toBN(votes[0][0][0][5]).toString(), toBN(coverTokensAmount).toString());
        assert.closeTo(toBN(votes[0][0][0][6]).toNumber(), toBN(timestamp).toNumber(), 1); // time bug
        assert.equal(votes[0][0][1], ClaimStatus.PENDING);
        assert.equal(votes[0][0][2], 0);
        assert.equal(votes[0][1], "");
        assert.equal(toBN(votes[0][2]).toString(), toBN(wei("100")).toString());
        assert.equal(votes[0][3].toString(), VoteStatus.EXPOSED_PENDING);
        assert.equal(votes[0][4], 0);
      });
    });
    describe("vote against", async () => {
      beforeEach("initializeVoting", async () => {
        await initVoting(liquidityAmount, coverTokensAmount, 0);
        await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
        timestamp = await getBlockTimestamp();
      });
      it("should successfully vote against", async () => {
        await mintAndStake(USER2, wei("1000000"), wei("100"));

        const coverage = toBN((await policyBook1.userStats(USER1))[0]);
        const userProtocol = BigNumber.min(
          toBN((await policyBook1.userStats(USER1))[3])
            .times(20)
            .idiv(100),
          coverage.idiv(100)
        );

        await claimVoting.voteBatch([1], [0], [true], { from: USER2 });

        const claimResult = await claimVoting.getVotingResult(1);

        assert.equal(toBN(claimResult[0]).toString(), coverage.toString());
        assert.equal(toBN(claimResult[1]).toString(), coverage.idiv(100).toString());
        assert.equal(toBN(claimResult[2]).toString(), userProtocol.toString());
        assert.equal(claimResult[3], 0); // average withdraw
        assert.equal(claimResult[4], 0); // yes average stake
        assert.equal(toBN(claimResult[5]).toString(), toBN(PRECISION).times(wei("100")).toString()); // no average stake
        assert.equal(toBN(claimResult[6]).toString(), toBN(wei("100")).toString()); // all voted stake
        assert.equal(claimResult[7], 0); // voted yes percentage (after calculation)

        const votesCount = await claimVoting.countNotReceivedVotes(USER2);

        assert.equal(votesCount, 1);

        assert.equal(await claimVoting.voteStatus(1), VoteStatus.EXPOSED_PENDING);

        const votes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

        assert.equal(votes[0][0][0][0], 1);
        assert.equal(votes[0][0][0][1], USER1);
        assert.equal(votes[0][0][0][2], policyBook1.address);
        assert.equal(votes[0][0][0][3], "");
        assert.equal(votes[0][0][0][4], false);
        assert.equal(toBN(votes[0][0][0][5]).toString(), toBN(coverTokensAmount).toString());
        assert.equal(votes[0][0][0][6], timestamp.toString());
        assert.equal(votes[0][0][1], ClaimStatus.PENDING);
        assert.equal(votes[0][0][2], 0);
        assert.equal(votes[0][1], "");
        assert.equal(votes[0][2], 0);
        assert.equal(votes[0][3], VoteStatus.EXPOSED_PENDING);
        assert.equal(votes[0][4], 0);

        await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

        await capitalPool.setliquidityCushionBalance(getStableAmount("1000000"));
        await claimVoting.calculateResult(1, { from: USER1 });

        let myVotes = await claimVoting.myVotes(0, votesCount, { from: USER2 });

        assert.equal(myVotes[0][0][0][0][0].toString(), 1);
      });
      it("should calculate correct averages (1)", async () => {
        const staked = [wei("100"), wei("200")];
        const suggestedAmounts = [0, 0];
        const reputations = [toBN(PRECISION).times(0.1), toBN(PRECISION).times(3)];

        const [allStake, averageWithdrawal] = await calculate(staked, suggestedAmounts, reputations);

        const claimResult = await claimVoting.getVotingResult(1);

        assert.equal(toBN(claimResult[3]).toString(), averageWithdrawal.toString()); // average withdraw
        assert.equal(toBN(claimResult[5]).toString(), allStake.toString()); // no average stake
      });

      it("should calculate correct averages (2)", async () => {
        const staked = [wei("3333"), wei("4444"), wei("5555")];
        const suggestedAmounts = [0, 0, 0];
        const reputations = [toBN(PRECISION).times(0.4), toBN(PRECISION).times(1.1), toBN(PRECISION).times(2.9)];

        const [allStake, averageWithdrawal] = await calculate(staked, suggestedAmounts, reputations);

        const claimResult = await claimVoting.getVotingResult(1);

        assert.equal(toBN(claimResult[3]).toString(), averageWithdrawal.toString()); // average withdraw
        assert.equal(toBN(claimResult[5]).toString(), allStake.toString()); // no average stake
      });

      it("should calculate correct averages (3)", async () => {
        const staked = [1, 128378, 812736, 923742];
        const suggestedAmounts = [0, 0, 0, 0];
        const reputations = [
          toBN(PRECISION).times(0.123),
          toBN(PRECISION).times(2.123),
          toBN(PRECISION).times(2.2),
          toBN(PRECISION).times(2.9),
        ];

        const [allStake, averageWithdrawal] = await calculate(staked, suggestedAmounts, reputations);

        const claimResult = await claimVoting.getVotingResult(1);

        assert.equal(toBN(claimResult[3]).toString(), averageWithdrawal.toString()); // average withdraw
        assert.equal(toBN(claimResult[5]).toString(), allStake.toString()); // no average stake
      });
    });
  });

  describe("calculateResult()", async () => {
    beforeEach("initializeVoting", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, coverTokensAmount);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      await policyBook2.submitClaimAndInitializeVoting("", { from: USER2 });
      timestamp = await getBlockTimestamp();
      await capitalPool.setliquidityCushionBalance(getStableAmount("1000000"));
    });

    it("should revert if calculator is not autorized", async () => {
      await fastVoteConfirmed(1, USER3, wei("1200"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteConfirmed(1, USER6, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      const reason = "CV: Not allowed to calculate";
      await truffleAssert.reverts(claimVoting.calculateResult(1, { from: USER2 }), reason);
    });
    it("should allow calculator to be different than claimer after 3 days", async () => {
      await fastVoteConfirmed(1, USER3, wei("1200"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteConfirmed(1, USER6, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(3 * 24 * 60 * 60) // 3 days
          .plus(10)
          .toString()
      );

      const res = await claimVoting.calculateResult(1, { from: USER2 });
      console.log("CalculateResult (ACCEPT) gas used: " + res.receipt.gasUsed);
    });
    it("should calculate voting result (1)", async () => {
      await fastVoteConfirmed(1, USER3, wei("120"), wei("500"), toBN(PRECISION).times(1.1), false);
      await fastVoteConfirmed(1, USER4, wei("100"), wei("750"), toBN(PRECISION).times(2.4), false);
      await fastVoteConfirmed(1, USER5, wei("1000"), wei("1000"), toBN(PRECISION).times(0.1), false);
      await fastVoteConfirmed(1, USER6, wei("5000"), wei("1"), toBN(PRECISION).times(3), true);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );

      const res = await claimVoting.calculateResult(1, { from: USER1 });
      console.log("CalculateResult (ACCEPT) gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);
    });
    it("should calculate voting result (2)", async () => {
      await fastVoteConfirmed(1, USER3, wei("1000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("2883"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("1000"), wei("0"), toBN(PRECISION), false);
      await fastVoteConfirmed(1, USER6, wei("1000"), wei("0"), toBN(PRECISION), false);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );

      await claimVoting.calculateResult(1, { from: USER1 });

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);
    });
    it("should calculate voting result (3)", async () => {
      await fastVoteConfirmed(1, USER3, wei("1000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("2882"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("1000"), 0, toBN(PRECISION), false);
      await fastVoteConfirmed(1, USER6, wei("1000"), 0, toBN(PRECISION), false);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      const res = await claimVoting.calculateResult(1, { from: USER1 });
      console.log("CalculateVotingResult (REJECT) gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);
    });
    it("should calculate voting result, quorum (4)", async () => {
      await fastVoteConfirmed(1, USER3, wei("1000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("8000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("4000"), 0, toBN(PRECISION), false);
      await fastVoteConfirmed(1, USER6, wei("3000"), 0, toBN(PRECISION), false);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      const res = await claimVoting.calculateResult(1, { from: USER1 });
      console.log("CalculateVotingResult (REJECT QUORUM) gas used: " + res.receipt.gasUsed);

      assert.equal((await claimingRegistry.claimStatus(1)).toString(), ClaimStatus.REJECTED_CAN_APPEAL);
    });
    it("should calculate voting result, quorum (5)", async () => {
      await fastVoteConfirmed(1, USER3, wei("1200"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteConfirmed(1, USER6, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);
    });
    it("should revert, public calculation (6)", async () => {
      await fastVoteConfirmed(1, USER3, wei("1200"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteConfirmed(1, USER6, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(toBN(await claimingRegistry.votingDuration(1)).plus(10));

      await truffleAssert.reverts(
        claimVoting.calculateResult(1, { from: accounts[3] }),
        "CV: Not allowed to calculate"
      );
    });
    it("should calculate reward, public calculation (7)", async () => {
      await fastVoteConfirmed(1, USER3, wei("1200"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteConfirmed(1, USER6, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      const elapsedTime = toBN(48 * 60 * 60);
      const currentTime = toBN(await claimingRegistry.anyoneCanCalculateClaimResultAfter(1))
        .plus(elapsedTime)
        .plus(2);

      const lockedBMIs = toBN((await claimVoting.getVotingResult(1))[1]);
      const accBalance = toBN(await bmi.balanceOf(USER4));

      await setCurrentTime(currentTime);

      await claimVoting.calculateResult(1, { from: USER4 });

      const reward = BigNumber.min(
        lockedBMIs,
        elapsedTime
          .times(
            toBN(CALCULATION_REWARD_PER_DAY)
              .idiv(60 * 60 * 24)
              .times(lockedBMIs)
          )
          .idiv(PERCENTAGE_100)
      );
      // huge slippage to fix time bug
      assert.closeTo(
        toBN(await bmi.balanceOf(USER4)).toNumber(),
        accBalance.plus(reward).toNumber(),
        toBN(wei("0.001")).toNumber()
      );
      assert.closeTo(
        toBN((await claimVoting.getVotingResult(1))[1]).toNumber(),
        lockedBMIs.minus(reward).toNumber(),
        toBN(wei("0.001")).toNumber()
      );
    });
    it("should expire the claim if time passed", async () => {
      await fastVoteConfirmed(1, USER3, wei("1200"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteConfirmed(1, USER6, wei("400"), 0, toBN(PRECISION), false);
      await fastVoteRejected(1, USER7, wei("10000"), wei("500"), toBN(PRECISION), true);
      await fastVoteRejected(1, USER8, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.validityDuration(1))
          .plus(10)
          .toString()
      );

      await claimVoting.calculateResult(1, { from: USER2 });

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.EXPIRED);
    });
    it("shouldn't be able to claim new policybook when policy has expired and old claim is pending", async () => {
      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      await setCurrentTime(toBN(10 * 7 * 24 * 60 * 60).plus(100));

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), false);

      const reason = "PB: Claim is pending";
      await truffleAssert.reverts(policyBookFacade1.buyPolicy(5, coverTokensAmount, { from: USER1 }), reason);
    });
    it("should be able to claim new policybook when policy has expired", async () => {
      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      await fastVoteConfirmed(1, USER3, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      await setCurrentTime(toBN(10 * 7 * 24 * 60 * 60).plus(100));

      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), false);
    });
    it("should display correct status when old policy is accepted and new one is bought", async () => {
      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      await fastVoteConfirmed(1, USER3, wei("10000"), wei("500"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      await setCurrentTime(toBN(10 * 7 * 24 * 60 * 60).plus(100));

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
      assert.equal(await policyRegistry.isPolicyActive(USER1, policyBook1.address), true);

      await fastVoteConfirmed(1, USER3, wei("10000"), wei("0"), toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

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

      const reason = "ClaimingRegistry: The claimer can't submit this claim";
      await truffleAssert.reverts(policyBook1.submitAppealAndInitializeVoting("", { from: USER1 }), reason);

      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
    });
  });

  describe("receiveVoteResultBatch()", async () => {
    beforeEach("initializeVoting", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, coverTokensAmount);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      timestamp = await getBlockTimestamp();
      await capitalPool.setliquidityCushionBalance(getStableAmount("1000000"));
    });
    it("should receive voter result (yes, majority, accepted) // withdraw reward ready", async () => {
      const staked = [wei("4000"), wei("3000"), wei("1000"), wei("1000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], 0, reputations[2], false);
      await fastVoteConfirmed(1, USER6, staked[3], 0, reputations[3], false);

      const observer = USER3;
      const observedStake = staked[0];
      const observedReputation = reputations[0];

      const allStake = await calculateAverageStake(staked, reputations, 0, 2);

      const paidToProtocol = toBN((await policyBook1.userStats(USER1))[3])
        .times(20)
        .idiv(100);
      const coverage = toBN((await policyBook1.userStats(USER1))[0]);
      const userProtocol = BigNumber.min(paidToProtocol, coverage.idiv(100));

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      const reputation = await reputationSystem.reputation(observer);
      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      const reinsuranceLiquidity = await reinsurancePool.totalLiquidity();
      const acc2STBL = await stbl.balanceOf(observer);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const voteIndex = await claimVoting.voteIndex(1, observer);
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.AWAITING_RECEPTION);

      const voterReward = toBN(observedStake)
        .times(toBN(observedReputation))
        .div(allStake)
        .times(userProtocol)
        .dp(0, BigNumber.ROUND_FLOOR);

      // canWithdraw
      assert.equal(await claimVoting.canUnstake(observer), false);
      assert.equal(await claimVoting.canUnstake(USER4), false);

      const res = await claimVoting.receiveVoteResultBatch([1], { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MAJORITY);

      timestamp = await getBlockTimestamp();
      console.log("ReceiveResult (yes, majority, accepted) gas used: " + res.receipt.gasUsed);

      assert.equal(toBN(await reputationSystem.reputation(observer)).gt(toBN(reputation)), true);

      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).rewardAmount.toString(),
        voterReward.toString()
      );
      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );

      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10).toString());

      await claimingRegistry.withdrawReward({ from: observer });
      assert.closeTo(
        toBN(await reinsurancePool.totalLiquidity()).toNumber(),
        toBN(reinsuranceLiquidity).minus(voterReward).toNumber(),
        toBN(wei("1")).div(getStableAmount("1")).toNumber()
      );
      assert.closeTo(
        toBN(await stbl.balanceOf(observer)).toNumber(),
        convert(acc2STBL).plus(convert(voterReward)).toNumber(),
        getStableAmount("0.000001").toNumber()
      );

      // canWithdraw
      assert.equal(await claimVoting.canUnstake(observer), true);
      assert.equal(await claimVoting.canUnstake(USER4), false);
    });
    it("should receive voter result (yes, majority, accepted) // miss withdraw reward, request with no new vote", async () => {
      const staked = [wei("4000"), wei("3000"), wei("1000"), wei("1000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], 0, reputations[2], false);
      await fastVoteConfirmed(1, USER6, staked[3], 0, reputations[3], false);

      const observer = USER3;
      const observedStake = staked[0];
      const observedReputation = reputations[0];

      const allStake = await calculateAverageStake(staked, reputations, 0, 2);

      const paidToProtocol = toBN((await policyBook1.userStats(USER1))[3])
        .times(20)
        .idiv(100);
      const coverage = toBN((await policyBook1.userStats(USER1))[0]);
      const userProtocol = BigNumber.min(paidToProtocol, coverage.idiv(100));

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      const reputation = await reputationSystem.reputation(observer);
      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      const reinsuranceLiquidity = await reinsurancePool.totalLiquidity();
      const acc2STBL = await stbl.balanceOf(observer);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const voteIndex = await claimVoting.voteIndex(1, observer);
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.AWAITING_RECEPTION);

      const voterReward = toBN(observedStake)
        .times(toBN(observedReputation))
        .div(allStake)
        .times(userProtocol)
        .dp(0, BigNumber.ROUND_FLOOR);

      await claimVoting.receiveVoteResultBatch([1], { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MAJORITY);
      timestamp = await getBlockTimestamp();

      assert.equal(toBN(await reputationSystem.reputation(observer)).gt(toBN(reputation)), true);

      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).rewardAmount.toString(),
        voterReward.toString()
      );
      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );

      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(READY_TO_WITHDRAW_PERIOD).plus(10).toString());

      await truffleAssert.reverts(
        claimingRegistry.withdrawReward({ from: observer }),
        "ClaimingRegistry: Withdrawal is not ready"
      );

      const bmiBefore = await bmi.balanceOf(USER1);

      await claimVoting.receiveVoteResultBatch([1], { from: observer });
      timestamp = await getBlockTimestamp();

      const bmiAfter = await bmi.balanceOf(USER1);
      assert.equal(bmiBefore.toString(), bmiAfter.toString());

      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).rewardAmount.toString(),
        voterReward.toString()
      );
      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );

      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10).toString());

      await claimingRegistry.withdrawReward({ from: observer });

      assert.closeTo(
        toBN(await reinsurancePool.totalLiquidity()).toNumber(),
        toBN(reinsuranceLiquidity).minus(voterReward).toNumber(),
        toBN(wei("1")).div(getStableAmount("1")).toNumber()
      );
      assert.closeTo(
        toBN(await stbl.balanceOf(observer)).toNumber(),
        convert(acc2STBL).plus(convert(voterReward)).toNumber(),
        getStableAmount("0.000001").toNumber()
      );
    });
    it("should receive voter result (yes, majority, accepted) // miss withdraw reward, request with new vote", async () => {
      let staked = [wei("4000"), wei("3000"), wei("1000"), wei("1000")];
      let reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], 0, reputations[2], false);
      await fastVoteConfirmed(1, USER6, staked[3], 0, reputations[3], false);

      const observer = USER3;
      const observedStake1 = staked[0];

      const observedReputation0 = reputations[0];
      let allStake = await calculateAverageStake(staked, reputations, 0, 2);

      const paidToProtocol1 = toBN((await policyBook1.userStats(USER1))[3])
        .times(20)
        .idiv(100);
      const coverage1 = toBN((await policyBook1.userStats(USER1))[0]);
      const userProtocol1 = BigNumber.min(paidToProtocol1, coverage1.idiv(100));

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      const observedReputation1 = await reputationSystem.reputation(observer);
      assert.equal(toBN(observedReputation1).toString(), toBN(observedReputation0).toString());

      const reinsuranceLiquidity = await reinsurancePool.totalLiquidity();
      const acc2STBL = await stbl.balanceOf(observer);

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const voteIndex1 = await claimVoting.voteIndex(1, observer);
      assert.equal(await claimVoting.voteStatus(voteIndex1), VoteStatus.AWAITING_RECEPTION);

      const voterReward1 = toBN(observedStake1)
        .times(toBN(observedReputation0))
        .div(allStake)
        .times(userProtocol1)
        .dp(0, BigNumber.ROUND_FLOOR);

      await claimVoting.receiveVoteResultBatch([1], { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex1), VoteStatus.MAJORITY);

      timestamp = await getBlockTimestamp();
      await claimVoting.receiveVoteResultBatch([1], { from: USER4 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER5 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER6 });

      const observedReputation2 = await reputationSystem.reputation(observer);
      assert.equal(toBN(observedReputation2).gt(toBN(observedReputation1)), true);

      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).rewardAmount.toString(),
        voterReward1.toString()
      );
      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );

      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(READY_TO_WITHDRAW_PERIOD).plus(10).toString());

      await truffleAssert.reverts(
        claimingRegistry.withdrawReward({ from: observer }),
        "ClaimingRegistry: Withdrawal is not ready"
      );

      await policyBook2.submitClaimAndInitializeVoting("", { from: USER2 });
      timestamp = await getBlockTimestamp();

      staked = [
        toBN(await stkBMIStaking.stakedStkBMI(USER3, { from: USER3 })),
        toBN(await stkBMIStaking.stakedStkBMI(USER4, { from: USER4 })),
        toBN(await stkBMIStaking.stakedStkBMI(USER5, { from: USER5 })),
        toBN(await stkBMIStaking.stakedStkBMI(USER6, { from: USER6 })),
      ];
      reputations = [
        toBN(await reputationSystem.reputation(USER3)),
        toBN(await reputationSystem.reputation(USER4)),
        toBN(await reputationSystem.reputation(USER5)),
        toBN(await reputationSystem.reputation(USER6)),
      ];

      await fastVoteConfirmed(2, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(2, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(2, USER5, staked[2], 0, reputations[2], false);
      await fastVoteConfirmed(2, USER6, staked[3], 0, reputations[3], false);

      allStake = await calculateAverageStake(staked, reputations, 0, 2);
      const observedStake2 = staked[0];

      const paidToProtocol2 = toBN((await policyBook2.userStats(USER2))[3])
        .times(20)
        .idiv(100);
      const coverage2 = toBN((await policyBook2.userStats(USER2))[0]);
      const userProtocol2 = BigNumber.min(paidToProtocol2, coverage2.idiv(100));

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(2))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(2, { from: USER2 });

      const observedReputation3 = await reputationSystem.reputation(observer);
      assert.equal(toBN(observedReputation3).toString(), toBN(observedReputation2).toString());

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const voteIndex2 = await claimVoting.voteIndex(2, observer);
      assert.equal(await claimVoting.voteStatus(voteIndex2), VoteStatus.AWAITING_RECEPTION);

      const voterReward2 = toBN(observedStake2)
        .times(toBN(observedReputation2))
        .div(allStake)
        .times(userProtocol2)
        .dp(0, BigNumber.ROUND_FLOOR);

      await claimVoting.receiveVoteResultBatch([2], { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex2), VoteStatus.MAJORITY);

      timestamp = await getBlockTimestamp();

      const observedReputation4 = await reputationSystem.reputation(observer);
      assert.equal(toBN(observedReputation4).gt(toBN(observedReputation3)), true);

      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).rewardAmount.toString(),
        toBN(voterReward1).plus(voterReward2).toString()
      );
      assert.equal(
        (await claimingRegistry.rewardWithdrawalInfo(observer)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );

      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10).toString());

      await claimingRegistry.withdrawReward({ from: observer });

      assert.closeTo(
        toBN(await reinsurancePool.totalLiquidity()).toNumber(),
        toBN(reinsuranceLiquidity).minus(voterReward1).minus(voterReward2).toNumber(),
        toBN(wei("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await stbl.balanceOf(observer)).toNumber(),
        convert(acc2STBL).plus(convert(voterReward1)).plus(convert(voterReward2)).toNumber(),
        getStableAmount("0.000001").toNumber()
      );
    });
    it("should receive voter result (yes, majority, rejected)", async () => {
      const staked = [wei("4000"), wei("3000"), wei("4000"), wei("2000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], 0, reputations[2], false);
      await fastVoteConfirmed(1, USER6, staked[3], 0, reputations[3], false);

      const observer = USER3;
      const observedStake = staked[0];
      const observedReputation = reputations[0];

      const allStake = await calculateAverageStake(staked, reputations, 0, 2);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      const reputation = await reputationSystem.reputation(observer);
      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);

      const voteIndex = await claimVoting.voteIndex(1, observer);
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.AWAITING_RECEPTION);

      const claimVotingBMI = await bmi.balanceOf(claimVoting.address);
      const accBMI = await bmi.balanceOf(observer);

      const lockedBMI = (await claimVoting.getVotingResult(1))[1];
      const voterReward = toBN(observedStake)
        .times(toBN(observedReputation))
        .div(allStake)
        .times(toBN(lockedBMI))
        .dp(0, BigNumber.ROUND_FLOOR);

      const res = await claimVoting.receiveVoteResultBatch([1], { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MAJORITY);

      console.log("ReceiveResult (yes, majority, rejected) gas used: " + res.receipt.gasUsed);

      assert.equal(toBN(await reputationSystem.reputation(observer)).gt(toBN(reputation)), true);
      assert.equal(toBN(await bmi.balanceOf(observer)).toString(), toBN(accBMI).plus(toBN(voterReward)).toString());
      assert.equal(
        toBN(await bmi.balanceOf(claimVoting.address)).toString(),
        toBN(claimVotingBMI).minus(toBN(voterReward)).toString()
      );
    });
    it("should receive voter result (no, majority, rejected)", async () => {
      const staked = [wei("4000"), wei("2000"), wei("4000"), wei("3000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], 0, reputations[2], false);
      await fastVoteConfirmed(1, USER6, staked[3], 0, reputations[3], false);

      const observer = USER6;
      const observedStake = staked[3];
      const observedReputation = reputations[3];

      const allStake = await calculateAverageStake(staked, reputations, 2, 4);
      const accBMI = toBN(await bmi.balanceOf(observer));

      let lockedBMIs = toBN((await claimVoting.getVotingResult(1))[1]);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      const claimVotingBMI = toBN(await bmi.balanceOf(claimVoting.address));

      const reputation = await reputationSystem.reputation(observer);
      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);

      const voteIndex = await claimVoting.voteIndex(1, observer);
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.AWAITING_RECEPTION);

      const res = await claimVoting.receiveVoteResultBatch([1], { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MAJORITY);

      console.log("ReceiveResult (no, majority, rejected) gas used: " + res.receipt.gasUsed);

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
        claimVotingBMI.minus(voterReward).toString()
      );
    });
    it("should receive voter result (yes or no, minority)", async () => {
      const staked = [wei("4000"), wei("2000"), wei("4000"), wei("3000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], 0, reputations[2], false);
      await fastVoteConfirmed(1, USER6, staked[3], 0, reputations[3], false);

      const observer = USER4;

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      const claimVotingBMI = await bmi.balanceOf(claimVoting.address);
      const accBMI = await bmi.balanceOf(observer);

      const reputation = await reputationSystem.reputation(observer);
      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);

      const voteIndex = await claimVoting.voteIndex(1, observer);
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.AWAITING_RECEPTION);

      const res = await claimVoting.receiveVoteResultBatch([1], { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MINORITY);

      console.log("ReceiveResult (yes or no, minority) gas used: " + res.receipt.gasUsed);

      assert.equal(toBN(await reputationSystem.reputation(observer)).lt(toBN(reputation)), true);

      assert.equal(toBN(await bmi.balanceOf(observer)).toString(), toBN(accBMI).toString());
      assert.equal(toBN(await bmi.balanceOf(claimVoting.address)).toString(), toBN(claimVotingBMI).toString());
    });
    it("should receive voter result (yes or no, extereme minority)", async () => {
      const staked = [wei("10"), wei("4000"), wei("2000"), wei("3000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], 0, reputations[0], false);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], wei("500"), reputations[2], true);
      await fastVoteConfirmed(1, USER6, staked[3], wei("500"), reputations[3], true);

      const observer = USER3;

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      const stakingStkBMI = await stkBMI.balanceOf(stkBMIStaking.address);
      const accStakedStkBMI = await stkBMIStaking.stakedStkBMI(observer, { from: observer });
      const treasuryStkBMI = await stkBMI.balanceOf(bmiTreasury);

      const reputation = await reputationSystem.reputation(observer);
      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const voteIndex = await claimVoting.voteIndex(1, observer);
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.AWAITING_RECEPTION);

      const res = await claimVoting.receiveVoteResultBatch([1], { from: observer });
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.MINORITY);

      console.log("ReceiveResult (yes or no, extreme minority) gas used: " + res.receipt.gasUsed);

      let votedExtremePercentage = (await claimVoting.getVotingResult(1))[7];
      votedExtremePercentage = BigNumber.min(
        toBN(votedExtremePercentage),
        PERCENTAGE_100.minus(toBN(votedExtremePercentage))
      );
      votedExtremePercentage = toBN(PENALTY_THRESHOLD).minus(votedExtremePercentage);

      const voterConf = toBN(accStakedStkBMI)
        .times(votedExtremePercentage)
        .div(PERCENTAGE_100)
        .dp(0, BigNumber.ROUND_FLOOR);

      assert.equal(toBN(await reputationSystem.reputation(observer)).lt(toBN(reputation)), true);

      assert.equal(
        toBN(await stkBMI.balanceOf(stkBMIStaking.address)).toString(),
        toBN(stakingStkBMI).minus(toBN(voterConf)).toString()
      );
      assert.equal(
        toBN(await stkBMIStaking.stakedStkBMI(observer, { from: observer })).toString(),
        toBN(accStakedStkBMI).minus(toBN(voterConf)).toString()
      );
      assert.equal(
        toBN(await stkBMI.balanceOf(bmiTreasury)).toString(),
        toBN(treasuryStkBMI).plus(toBN(voterConf)).toString()
      );
    });
    it("should receive correct voter reputation", async () => {
      await stbl.transfer(USER2, stblAmount);
      await stbl.approve(policyBook1.address, 0, { from: USER2 });
      await stbl.approve(policyBook1.address, stblAmount, { from: USER2 });
      await policyBookFacade1.buyPolicy(5, coverTokensAmount, { from: USER2 });
      assert.equal(await policyRegistry.getPoliciesLength(USER2), 2);

      await bmi.transfer(USER2, wei("1000000"), { from: USER1 });
      const toApproveOnePercent2 = await policyBookFacade1.getClaimApprovalAmount(USER2);
      await bmi.approve(claimVoting.address, 0, { from: USER2 });
      await bmi.approve(claimVoting.address, toApproveOnePercent2, { from: USER2 });
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER2 });

      const staked = [wei("100"), wei("5000"), wei("5000"), wei("300")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], 0, reputations[0], false);
      await fastVoteConfirmed(2, USER3, staked[0], 0, reputations[0], false);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(2, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], wei("500"), reputations[2], true);
      await fastVoteConfirmed(2, USER5, staked[2], wei("500"), reputations[2], true);
      await fastVoteConfirmed(1, USER6, staked[3], wei("500"), reputations[3], true);
      await fastVoteConfirmed(2, USER6, staked[3], wei("500"), reputations[3], true);

      const observer1 = USER4;
      const observer2 = USER5;

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(2, { from: USER2 });

      assert.equal(
        toBN(await reputationSystem.reputation(observer1)).toString(),
        toBN(await reputationSystem.reputation(observer2)).toString()
      );

      await claimVoting.receiveVoteResultBatch([2], { from: observer1 });
      await claimVoting.receiveVoteResultBatch([2], { from: observer2 });

      assert.equal(
        toBN(await reputationSystem.reputation(observer1)).toString(),
        toBN(await reputationSystem.reputation(observer2)).toString()
      );
    });
    it("should receive voter result (not exposed)", async () => {
      const staked = [wei("4000"), wei("3000"), wei("1000"), wei("1000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      let finalHashUser3, encryptedSuggestedAmountUser3;
      [finalHashUser3, encryptedSuggestedAmountUser3] = await getAnonymousEncrypted(1, wei("500"), USER3_PRIVATE_KEY);
      await mintAndStake(USER3, wei("1000000"), staked[0]);
      await reputationSystem.setNewReputationNoCheck(USER3, reputations[0]);

      await claimVoting.anonymouslyVoteBatch([1], [finalHashUser3], [encryptedSuggestedAmountUser3], {
        from: USER3,
      });
      //await fastVote(1, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], wei("500"), reputations[2], true);
      await fastVoteConfirmed(1, USER6, staked[3], wei("500"), reputations[3], true);

      const observer = USER3;
      const observedStake = staked[0];
      const observedReputation = reputations[0];

      const allStake = await calculateAverageStake(staked, reputations, 0, 2);

      const paidToProtocol = toBN((await policyBook1.userStats(USER1))[3])
        .times(20)
        .idiv(100);
      const coverage = toBN((await policyBook1.userStats(USER1))[0]);
      const userProtocol = BigNumber.min(paidToProtocol, coverage.idiv(100));

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      const stakingStkBMI = await stkBMI.balanceOf(stkBMIStaking.address);
      const accStakedStkBMI = await stkBMIStaking.stakedStkBMI(observer, { from: observer });
      const treasuryStkBMI = await stkBMI.balanceOf(bmiTreasury);

      const reputation = await reputationSystem.reputation(observer);
      assert.equal(toBN(reputation).toString(), PRECISION.toString());

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const voteIndex = await claimVoting.voteIndex(1, observer);
      assert.equal(await claimVoting.voteStatus(voteIndex), VoteStatus.EXPIRED);

      const res = await claimVoting.receiveVoteResultBatch([1], { from: observer });
      console.log("ReceiveResult (yes or no, extreme minority) gas used: " + res.receipt.gasUsed);

      assert.equal(toBN(reputation).toString(), toBN(observedReputation).toString());

      assert.equal(
        toBN(await stkBMI.balanceOf(stkBMIStaking.address)).toString(),
        toBN(stakingStkBMI).minus(toBN(observedStake)).toString()
      );
      assert.equal(
        toBN(await stkBMIStaking.stakedStkBMI(observer, { from: observer })).toString(),
        toBN(accStakedStkBMI).minus(toBN(observedStake)).toString()
      );
      assert.equal(
        toBN(await stkBMI.balanceOf(bmiTreasury)).toString(),
        toBN(treasuryStkBMI).plus(observedStake).toString()
      );
    });
  });

  describe("claimingRegistry.withdrawLockedBMI()", async () => {
    beforeEach("initializeVoting", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, coverTokensAmount);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      await policyBook2.submitClaimAndInitializeVoting("", { from: USER2 });
      timestamp = await getBlockTimestamp();
      await capitalPool.setliquidityCushionBalance(getStableAmount("1000000"));

      await fastVoteConfirmed(1, USER3, wei("1200"), coverTokensAmount, toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("10000"), coverTokensAmount, toBN(PRECISION), true);
    });
    it("should revert if claim is not expired", async () => {
      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );

      const reason = "ClaimingRegistry: Claim is not expired or can still be withdrawn";
      await truffleAssert.reverts(claimingRegistry.withdrawLockedBMI(1, { from: USER1 }), reason);
    });
    it("should revert if claim is accepted and can still be withdrawn", async () => {
      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const reason = "ClaimingRegistry: Claim is not expired or can still be withdrawn";
      await truffleAssert.reverts(claimingRegistry.withdrawLockedBMI(1, { from: USER1 }), reason);
    });
    it("should revert if not claimant", async () => {
      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.validityDuration(1))
          .plus(10)
          .toString()
      );

      const reason = "ClaimingRegistry: Not the claimer";
      await truffleAssert.reverts(claimingRegistry.withdrawLockedBMI(1, { from: USER3 }), reason);
    });
    it("should revert if already withdrawn", async () => {
      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.validityDuration(1))
          .plus(10)
          .toString()
      );

      const claimantBalanceBefore = await bmi.balanceOf(USER1);
      const lockedBMI = toBN((await claimVoting.getVotingResult(1))[1]);

      await claimVoting.calculateResult(1, { from: USER1 });
      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.EXPIRED);

      await claimingRegistry.withdrawLockedBMI(1, { from: USER1 });

      const claimantBalanceAfter = await bmi.balanceOf(USER1);
      assert.equal(toBN(claimantBalanceAfter).toString(), toBN(claimantBalanceBefore).plus(lockedBMI).toString());

      const reason = "CV: Already withdrawn";
      await truffleAssert.reverts(claimingRegistry.withdrawLockedBMI(1, { from: USER1 }), reason);
    });
    it("should unlock BMI successfully (accepted not withdrawn policy ended)", async () => {
      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      const claimantBalanceBefore = await bmi.balanceOf(USER1);
      const lockedBMI = toBN((await claimVoting.getVotingResult(1))[1]);

      timestamp = await getBlockTimestamp();
      await setCurrentTime(
        toBN(timestamp)
          .plus(7 * 7 * 24 * 60 * 60)
          .plus(10)
          .toString()
      ); // expire policy

      await claimingRegistry.withdrawLockedBMI(1, { from: USER1 });

      const claimantBalanceAfter = await bmi.balanceOf(USER1);
      assert.equal(toBN(claimantBalanceAfter).toString(), toBN(claimantBalanceBefore).plus(lockedBMI).toString());

      assert.equal((await policyBook1.totalCoverTokens()).toString(), 0);
      assert.equal((await policyRegistry.getUsersInfo([USER1], [policyBook1.address]))[0][3], 0);
      assert.equal(await policyRegistry.policyExists(USER1, policyBook1.address), false);
    });
    it("should unlock BMI successfully (expired)", async () => {
      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.validityDuration(1))
          .plus(10)
          .toString()
      );

      const claimantBalanceBefore = await bmi.balanceOf(USER1);
      const lockedBMI = toBN((await claimVoting.getVotingResult(1))[1]);

      await claimVoting.calculateResult(1, { from: USER1 });
      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.EXPIRED);

      await claimingRegistry.withdrawLockedBMI(1, { from: USER1 });

      const claimantBalanceAfter = await bmi.balanceOf(USER1);
      assert.equal(toBN(claimantBalanceAfter).toString(), toBN(claimantBalanceBefore).plus(lockedBMI).toString());
    });
  });

  describe("claimingRegistry.getRepartition()", async () => {
    beforeEach("initializeVoting", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, coverTokensAmount);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });
      await policyBook2.submitClaimAndInitializeVoting("", { from: USER2 });
      timestamp = await getBlockTimestamp();
      await capitalPool.setliquidityCushionBalance(getStableAmount("1000000"));
    });
    it("should get correct repartition (1)", async () => {
      const staked = [wei("1000"), wei("1000"), wei("1000"), wei("1000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], 0, reputations[2], false);
      await fastVoteConfirmed(1, USER6, staked[3], 0, reputations[3], false);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER3 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER4 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER5 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER6 });

      const repartition = await claimingRegistry.getRepartition(1);
      assert.equal(
        repartition[0].toString(),
        toBN(50)
          .times(10 ** 25)
          .toFixed()
          .toString()
      );
      assert.equal(
        repartition[1].toString(),
        toBN(50)
          .times(10 ** 25)
          .toFixed()
          .toString()
      );
    });
    it("should get correct repartition (2)", async () => {
      const staked = [wei("1000"), wei("1000"), wei("1000"), wei("1000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], wei("500"), reputations[0], true);
      await fastVoteConfirmed(1, USER4, staked[1], wei("500"), reputations[1], true);
      await fastVoteConfirmed(1, USER5, staked[2], wei("500"), reputations[2], true);
      await fastVoteConfirmed(1, USER6, staked[3], 0, reputations[3], false);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER3 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER4 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER5 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER6 });

      const repartition = await claimingRegistry.getRepartition(1);
      assert.equal(
        repartition[0].toString(),
        toBN(75)
          .times(10 ** 25)
          .toFixed()
          .toString()
      );
      assert.equal(
        repartition[1].toString(),
        toBN(25)
          .times(10 ** 25)
          .toFixed()
          .toString()
      );
    });
    it("should get correct repartition (3)", async () => {
      const staked = [wei("1000"), wei("1000"), wei("1000"), wei("1000")];
      const reputations = [toBN(PRECISION), toBN(PRECISION), toBN(PRECISION), toBN(PRECISION)];

      await fastVoteConfirmed(1, USER3, staked[0], 0, reputations[0], false);
      await fastVoteConfirmed(1, USER4, staked[1], 0, reputations[1], false);
      await fastVoteConfirmed(1, USER5, staked[2], 0, reputations[2], false);
      await fastVoteConfirmed(1, USER6, staked[3], 0, reputations[3], false);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
          .toString()
      );
      await claimVoting.calculateResult(1, { from: USER1 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER3 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER4 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER5 });
      await claimVoting.receiveVoteResultBatch([1], { from: USER6 });

      const repartition = await claimingRegistry.getRepartition(1);
      assert.equal(
        repartition[0].toString(),
        toBN(0)
          .times(10 ** 25)
          .toFixed()
          .toString()
      );
      assert.equal(
        repartition[1].toString(),
        toBN(100)
          .times(10 ** 25)
          .toFixed()
          .toString()
      );
    });
  });

  describe("payment of accepted claim", async () => {
    beforeEach("setup", async () => {
      await capitalPool.setliquidityCushionBalance(getStableAmount("1000000"));
      await capitalPool.setBalances(
        [],
        [],
        [userLeveragePool.address],
        [virtualLiquidityAmount],
        virtualLiquidityAmount
      );
      userLeveragePool.setVtotalLiquidity(virtualLiquidityAmount);
      reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount);
      await policyBookAdmin.setPolicyBookFacadeMPLs(
        policyBookFacade1.address,
        PRECISION.times(20),
        PRECISION.times(50)
      );

      assert.equal(toBN(await userLeveragePool.totalLiquidity()).toString(), virtualLiquidityAmount.toString());
      assert.equal(toBN(await reinsurancePool.totalLiquidity()).toString(), virtualLiquidityAmount.toString());

      await policyBookFacade1.deployLeverageFundsByLP(userLeveragePool.address);
      await policyBookFacade1.deployLeverageFundsByRP();
      timestamp = await getBlockTimestamp();
    });
    it("filter well whatCanIVoteFor()", async () => {
      let claimsCount = await claimingRegistry.countPendingClaims();
      let whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER1 });
      assert.equal(whatVoteFor[0], 0);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER2 });
      assert.equal(whatVoteFor[0], 0);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER3 });
      assert.equal(whatVoteFor[0], 0);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER4 });
      assert.equal(whatVoteFor[0], 0);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER5 });
      assert.equal(whatVoteFor[0], 0);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER6 });
      assert.equal(whatVoteFor[0], 0);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      claimsCount = await claimingRegistry.countPendingClaims();
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER1 });
      assert.equal(whatVoteFor[0], 0);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER2 });
      assert.equal(whatVoteFor[0], 1);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER3 });
      assert.equal(whatVoteFor[0], 1);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER4 });
      assert.equal(whatVoteFor[0], 1);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER5 });
      assert.equal(whatVoteFor[0], 1);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER6 });
      assert.equal(whatVoteFor[0], 1);

      await fastVoteConfirmed(1, USER3, wei("1200"), coverTokensAmount, toBN(PRECISION), true);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER3 });
      assert.equal(whatVoteFor[0], 0);
      await fastVoteConfirmed(1, USER4, wei("100"), coverTokensAmount, toBN(PRECISION), true);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER4 });
      assert.equal(whatVoteFor[0], 0);
      await fastVoteConfirmed(1, USER5, wei("1000"), coverTokensAmount, toBN(PRECISION), true);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER5 });
      assert.equal(whatVoteFor[0], 0);
      await fastVoteConfirmed(1, USER6, wei("5000"), coverTokensAmount, toBN(PRECISION), true);
      whatVoteFor = await claimVoting.whatCanIVoteFor(0, claimsCount, { from: USER6 });
      assert.equal(whatVoteFor[0], 0);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
      );

      const res = await claimVoting.calculateResult(1, { from: USER1 });
      console.log("CalculateVotingResult (ACCEPT) gas used: " + res.receipt.gasUsed);
    });
    it("pay claim with coverage, leverage and reinsurance liquidity", async () => {
      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await fastVoteConfirmed(1, USER3, wei("1200"), coverTokensAmount, toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("100"), coverTokensAmount, toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("1000"), coverTokensAmount, toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER6, wei("5000"), coverTokensAmount, toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
      );

      const res = await claimVoting.calculateResult(1, { from: USER1 });
      console.log("CalculateVotingResult (ACCEPT) gas used: " + res.receipt.gasUsed);

      const addon = toBN((await claimVoting.getVotingResult(1))[3]);
      assert.equal(addon.toString(), coverTokensAmount.toString());

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10));

      const uBalance = toBN(await stbl.balanceOf(USER1));
      const pBalance = toBN(await stbl.balanceOf(capitalPool.address));

      const totLiq = toBN(await policyBook1.totalLiquidity()).plus(await policyBookFacade1.totalLeveragedLiquidity());

      const liquidityPB = toBN((await policyBook1.getNewCoverAndLiquidity()).newTotalLiquidity);
      const contribPB = liquidityPB.div(totLiq).times(100);
      const lostPB = coverTokensAmount.times(contribPB).div(100);

      const liquidityULP = toBN(await userLeveragePool.totalLiquidity());
      const contribULP = toBN(await policyBookFacade1.LUuserLeveragePool(userLeveragePool.address))
        .div(totLiq)
        .times(100);
      const lostULP = coverTokensAmount.times(contribULP).div(100);

      const liquidityRP = toBN(await reinsurancePool.totalLiquidity());
      const contribRP = toBN(await policyBookFacade1.VUreinsurnacePool())
        .plus(await policyBookFacade1.LUreinsurnacePool())
        .div(totLiq)
        .times(100);
      const lostRP = coverTokensAmount.times(contribRP).div(100);

      const bmiCBefore = await bmi.balanceOf(claimVoting.address);
      const bmiUBefore = await bmi.balanceOf(USER1);
      let bmiAmountLocked = (await claimVoting.votingInfo(1)).lockedBMIAmount;

      await claimingRegistry.withdrawClaim(1, { from: USER1 });

      const bmiCAfter = await bmi.balanceOf(claimVoting.address);
      const bmiUAfter = await bmi.balanceOf(USER1);

      assert.equal(toBN(bmiCAfter).toString(), toBN(bmiCBefore).minus(bmiAmountLocked).toString());
      assert.equal(toBN(bmiUAfter).toString(), toBN(bmiUBefore).plus(bmiAmountLocked).toString());
      bmiAmountLocked = (await claimVoting.votingInfo(1)).lockedBMIAmount;
      assert.equal(bmiAmountLocked.toString(), "0");

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        pBalance.minus(convert(coverTokensAmount)).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), uBalance.plus(convert(coverTokensAmount)).toString());

      assert.closeTo(
        toBN(await policyBook1.totalLiquidity()).toNumber(),
        toBN(liquidityPB).minus(lostPB).toNumber(),
        4 * 10 ** 18
      );
      const diffPB = liquidityPB.minus(await policyBook1.totalLiquidity()).toString();
      assert.closeTo(
        toBN(await userLeveragePool.totalLiquidity()).toNumber(),
        toBN(liquidityULP).minus(lostULP).toNumber(),
        10 ** 18 // leveraged after updating liquidity
      );
      const diffULP = liquidityULP.minus(await userLeveragePool.totalLiquidity()).toString();
      assert.closeTo(
        toBN(await reinsurancePool.totalLiquidity()).toNumber(),
        toBN(liquidityRP).minus(lostRP).toNumber(),
        10 ** 18 // leveraged after updating liquidity
      );
      const diffRP = liquidityRP.minus(await reinsurancePool.totalLiquidity()).toString();
      assert.closeTo(toBN(diffPB).plus(diffULP).plus(diffRP).toNumber(), coverTokensAmount.toNumber(), 0.1);
    });
    it("pay claim with coverage, leverage and reinsurance liquidity", async () => {
      const claimAmount = toBN(coverTokensAmount).div(2);

      await initVoting(liquidityAmount, coverTokensAmount, 0);
      await policyBook1.submitClaimAndInitializeVoting("", { from: USER1 });

      await fastVoteConfirmed(1, USER3, wei("1200"), claimAmount, toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER4, wei("100"), claimAmount, toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER5, wei("1000"), claimAmount, toBN(PRECISION), true);
      await fastVoteConfirmed(1, USER6, wei("5000"), claimAmount, toBN(PRECISION), true);

      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistry.votingDuration(1))
          .plus(10)
      );

      const res = await claimVoting.calculateResult(1, { from: USER1 });
      console.log("CalculateVotingResult (ACCEPT) gas used: " + res.receipt.gasUsed);

      const addon = toBN((await claimVoting.getVotingResult(1))[3]);
      assert.equal(addon.toString(), claimAmount.toString());

      assert.equal(await claimingRegistry.claimStatus(1), ClaimStatus.ACCEPTED);

      timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10));

      const uBalance = toBN(await stbl.balanceOf(USER1));
      const pBalance = toBN(await stbl.balanceOf(capitalPool.address));

      const totLiq = toBN(await policyBook1.totalLiquidity()).plus(await policyBookFacade1.totalLeveragedLiquidity());
      assert.equal(toBN(await policyBook1.totalCoverTokens()).toString(), toBN(coverTokensAmount).toString());

      const liquidityPB = toBN((await policyBook1.getNewCoverAndLiquidity()).newTotalLiquidity);
      const contribPB = liquidityPB.div(totLiq).times(100);
      const lostPB = claimAmount.times(contribPB).div(100);

      const liquidityULP = toBN(await userLeveragePool.totalLiquidity());
      const contribULP = toBN(await policyBookFacade1.LUuserLeveragePool(userLeveragePool.address))
        .div(totLiq)
        .times(100);
      const lostULP = claimAmount.times(contribULP).div(100);

      const liquidityRP = toBN(await reinsurancePool.totalLiquidity());
      const contriBRP = toBN(await policyBookFacade1.VUreinsurnacePool())
        .plus(await policyBookFacade1.LUreinsurnacePool())
        .div(totLiq)
        .times(100);
      const lostRP = claimAmount.times(contriBRP).div(100);

      const bmiCBefore = await bmi.balanceOf(claimVoting.address);
      const bmiUBefore = await bmi.balanceOf(USER1);
      let bmiAmountLocked = (await claimVoting.votingInfo(1)).lockedBMIAmount;

      await claimingRegistry.withdrawClaim(1, { from: USER1 });

      const bmiCAfter = await bmi.balanceOf(claimVoting.address);
      const bmiUAfter = await bmi.balanceOf(USER1);

      assert.equal(toBN(bmiCAfter).toString(), toBN(bmiCBefore).minus(bmiAmountLocked).toString());
      assert.equal(toBN(bmiUAfter).toString(), toBN(bmiUBefore).plus(bmiAmountLocked).toString());
      bmiAmountLocked = (await claimVoting.votingInfo(1)).lockedBMIAmount;
      assert.equal(bmiAmountLocked.toString(), "0");

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        pBalance.minus(convert(claimAmount)).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(USER1)).toString(), uBalance.plus(convert(claimAmount)).toString());

      assert.closeTo(
        toBN(await policyBook1.totalLiquidity()).toNumber(),
        toBN(liquidityPB).minus(lostPB).toNumber(),
        4 * 10 ** 18
      );
      const diffPB = liquidityPB.minus(await policyBook1.totalLiquidity()).toString();
      assert.closeTo(
        toBN(await userLeveragePool.totalLiquidity()).toNumber(),
        toBN(liquidityULP).minus(lostULP).toNumber(),
        10 ** 18
      );
      const diffULP = liquidityULP.minus(await userLeveragePool.totalLiquidity()).toString();
      assert.closeTo(
        toBN(await reinsurancePool.totalLiquidity()).toNumber(),
        toBN(liquidityRP).minus(lostRP).toNumber(),
        10 ** 18
      );
      const diffRP = liquidityRP.minus(await reinsurancePool.totalLiquidity()).toString();
      assert.closeTo(toBN(diffPB).plus(diffULP).plus(diffRP).toNumber(), claimAmount.toNumber(), 0.1);
      assert.equal((await policyBook1.totalCoverTokens()).toString(), 0);
    });
  });
});
