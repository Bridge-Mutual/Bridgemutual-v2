const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const ContractsRegistry = artifacts.require("ContractsRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const ClaimingRegistryMock = artifacts.require("ClaimingRegistryMock");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyRegistryMock = artifacts.require("PolicyRegistryMock");
const PolicyBook = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyQuote = artifacts.require("PolicyQuote");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const CapitalPool = artifacts.require("CapitalPoolMock");
const ReinsurancePool = artifacts.require("ReinsurancePoolMock");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const ShieldMining = artifacts.require("ShieldMining");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const PriceFeed = artifacts.require("PriceFeed");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WrappedTokenMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const ReputationSystem = artifacts.require("ReputationSystemMock");
const STKBMITokenMock = artifacts.require("STKBMITokenMock");
const StkBMIStaking = artifacts.require("StkBMIStaking");
const YieldGenerator = artifacts.require("YieldGenerator");

const Reverter = require("../test/helpers/reverter");
const BigNumber = require("bignumber.js");
const { assert } = require("chai");
const { setCurrentTime } = require("./helpers/ganacheTimeTraveler");
const truffleAssert = require("truffle-assertions");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

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

const ContractType = {
  CONTRACT: 0,
  STABLECOIN: 1,
  SERVICE: 2,
  EXCHANGE: 3,
  VARIOUS: 4,
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

async function getBlockTimestamp() {
  const latest = toBN(await web3.eth.getBlockNumber());
  return (await web3.eth.getBlock(latest)).timestamp;
}

const wei = web3.utils.toWei;

contract("ClaimingRegistry", async (accounts) => {
  const reverter = new Reverter(web3);

  let stblMock;
  let claimingRegistryMock;
  let policyRegistryMock;
  let policyBookAdmin;
  let nftStaking;

  const PRECISION = toBN(10).pow(25);

  const WITHDRAWAL_PERIOD = 4 * 24 * 60 * 60; // 4days
  const READY_TO_WITHDRAW_PERIOD = 8 * 24 * 60 * 60; // 8days

  const USER1 = accounts[0];
  const USER2 = accounts[1];
  const INSURED1 = accounts[2];
  const INSURED2 = accounts[3];
  const INSURED3 = accounts[4];
  const TOKEN1 = "0x0000000000000000000000000000000000000000";
  const TOKEN2 = "0x0000000000000000000000000000000000000000";
  const CLAIM_VOTING = accounts[6];
  const NOTHING = accounts[9];

  let policyBook1;
  let policyBook2;
  let network;

  let capitalPool;
  let reinsurancePool;
  let timestamp;

  const convert = (amount) => {
    if (network == Networks.ETH || network == Networks.POL) {
      const amountStbl = toBN(amount).div(toBN(10).pow(12));
      return amountStbl;
    } else if (network == Networks.BSC) {
      const amountStbl = toBN(amount);
      return amountStbl;
    }
  };

  beforeEach("setup", async () => {
    network = await getNetwork();
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
    if (network == Networks.ETH) {
      stblMock = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stblMock = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }

    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _yieldGenerator = await YieldGenerator.new();

    const bmi = await BMIMock.new(USER1);
    const weth = await WETHMock.new("weth", "weth");
    const sushiswapRouterMock = await SushiswapRouterMock.new();
    const _priceFeed = await PriceFeed.new();
    const _reputationSystem = await ReputationSystem.new();
    const _stkBMI = await STKBMITokenMock.new();
    const _stkBMIStaking = await StkBMIStaking.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), CLAIM_VOTING);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblMock.address);
    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), weth.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), sushiswapRouterMock.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmi.address);

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
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REPUTATION_SYSTEM_NAME(),
      _reputationSystem.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), _stkBMI.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_STAKING_NAME(), _stkBMIStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    policyRegistryMock = await PolicyRegistryMock.at(await contractsRegistry.getPolicyRegistryContract());
    claimingRegistryMock = await ClaimingRegistryMock.at(await contractsRegistry.getClaimingRegistryContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const reputationSystem = await ReputationSystem.at(await contractsRegistry.getReputationSystemContract());
    const stkBMI = await STKBMITokenMock.at(await contractsRegistry.getSTKBMIContract());
    const stkBMIStaking = await StkBMIStaking.at(await contractsRegistry.getStkBMIStakingContract());
    const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

    await rewardsGenerator.__RewardsGenerator_init();
    await claimingRegistryMock.__ClaimingRegistry_init();
    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await nftStaking.__NFTStaking_init();
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await policyBookFabric.__PolicyBookFabric_init();
    await reputationSystem.__ReputationSystem_init([]);
    await stkBMI.__STKBMIToken_init();
    await stkBMIStaking.__StkBMIStaking_init();
    await yieldGenerator.__YieldGenerator_init(network);

    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REPUTATION_SYSTEM_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

    if (network == Networks.ETH || network == Networks.POL) {
      await sushiswapRouterMock.setReserve(stblMock.address, wei(toBN(10 ** 3).toString()));
    } else if (network == Networks.BSC) {
      await sushiswapRouterMock.setReserve(stblMock.address, wei(toBN(10 ** 15).toString()));
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

    const initialDeposit = wei("1000");

    await stblMock.approve(policyBookFabric.address, getStableAmount("2000"));

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

    const tx = await policyBookFabric.createLeveragePools(INSURED3, ContractType.VARIOUS, "User Leverage Pool", "USDT");
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    timestamp = (await getBlockTimestamp()).toString();

    await policyRegistryMock.setPolicyTime(
      USER1,
      policyBook1.address,
      timestamp,
      toBN(365).times(24).times(60).times(60)
    );
    await policyRegistryMock.setPolicyTime(
      USER1,
      policyBook2.address,
      timestamp,
      toBN(365).times(24).times(60).times(60)
    );
    await policyRegistryMock.setPolicyTime(
      USER2,
      policyBook1.address,
      timestamp,
      toBN(365).times(24).times(60).times(60)
    );
    await policyRegistryMock.setPolicyTime(
      USER2,
      policyBook2.address,
      timestamp,
      toBN(365).times(24).times(60).times(60)
    );

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("submitClaim()", async () => {
    const coverTokensAmount = wei("1000");

    beforeEach("setup", async () => {
      await capitalPool.setliquidityCushionBalance(wei("1000"));
      await capitalPool.addVirtualUsdtAccumulatedBalance(wei("1000"));
    });

    it("should submit new claim", async () => {
      let claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 0);

      await setCurrentTime(1);

      const res = await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      const id = res.logs[0].args.claimIndex;

      console.log("SubmitClaim gas used: " + res.receipt.gasUsed);

      assert.equal(id, 1);

      claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 1);

      assert.equal(await claimingRegistryMock.claimExists(id), true);
      assert.equal(await claimingRegistryMock.hasClaim(USER1, policyBook1.address), true);
      assert.equal(await claimingRegistryMock.isClaimVotable(id), true);
      assert.equal(await claimingRegistryMock.isClaimPending(id), true);
      assert.equal(await claimingRegistryMock.countPendingClaims(), 1);
      assert.equal(await claimingRegistryMock.countClaims(), 1);
      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.PENDING);

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      assert.equal(await claimingRegistryMock.isClaimVotable(id), false);
    });

    it("shouldn't submit second identical claim", async () => {
      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );

      await policyBookAdmin.updateImageUriOfClaim(id, "placeholder2");

      claim = await claimingRegistryMock.claimInfo(id);
      assert.equal(claim[2], "placeholder2");

      //should fail even after changing evidenceUri
      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("should submit two claims", async () => {
      let claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 0);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.submitClaim(USER1, policyBook2.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });

      claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 2);
    });

    it("should submit claims for different users", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.submitClaim(USER2, policyBook2.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });

      let claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER1);

      assert.equal(claimsCount, 1);

      claimsCount = await claimingRegistryMock.countPolicyClaimerClaims(USER2);

      assert.equal(claimsCount, 1);
    });

    it("should make claim AWAITING_CALCULATION", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;
      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.PENDING);

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.AWAITING_CALCULATION);
    });

    it("shouldn't submit appeal at first", async () => {
      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't submit appeal on PENDING claim", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't submit appeal on ACCEPTED claim", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.ACCEPTED);

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't submit appeal on AWAITING_CALCULATION claim", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.AWAITING_CALCULATION);

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't submit appeal on EXPIRED claim", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.EXPIRED);

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("should submit appeal on REJECTED_CAN_APPEAL claim", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      assert.equal(await claimingRegistryMock.claimStatus(1), ClaimStatus.REJECTED_CAN_APPEAL);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
        from: CLAIM_VOTING,
      });

      assert.equal(await claimingRegistryMock.claimStatus(2), ClaimStatus.PENDING);
      assert.equal(await claimingRegistryMock.isClaimAppeal(2), true);

      assert.equal(await claimingRegistryMock.claimStatus(1), ClaimStatus.REJECTED);
    });

    it("shouldn't submit appeal on appeal", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
        from: CLAIM_VOTING,
      });

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't submit claim on PENDING appeal", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
        from: CLAIM_VOTING,
      });

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("should be able to submit claim on REJECTED appeal", async () => {
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED);

      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });

      assert.equal(await claimingRegistryMock.claimStatus(3), ClaimStatus.PENDING);
      assert.equal(await claimingRegistryMock.isClaimAppeal(3), false);
    });

    it("shouldn't be able to submit claim on ACCEPTED appeal", async () => {
      setCurrentTime(toBN(timestamp).plus(10));
      await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
        from: CLAIM_VOTING,
      });
      await claimingRegistryMock.updateStatus(USER1, policyBook1.address, ClaimStatus.REJECTED_CAN_APPEAL);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, true, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      timestamp = await getBlockTimestamp();
      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistryMock.votingDuration(id))
          .plus(10)
      );

      await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });
      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      assert.equal(await policyRegistryMock.isPolicyActive(USER1, policyBook1.address), true);
      assert.equal((await claimingRegistryMock.getClaimWithdrawalStatus(id)).toString(), WithdrawalStatus.PENDING);
      //console.log((await policyRegistryMock.policyStartTime(USER1, policyBook1.address)).toString());
      //console.log((await claimingRegistryMock.claimSubmittedTime(id)).toString());

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't be able to submit claim on ACCEPTED claim not withdrawn", async () => {
      setCurrentTime(toBN(timestamp).plus(10));
      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      timestamp = await getBlockTimestamp();
      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistryMock.votingDuration(id))
          .plus(10)
      );

      await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });
      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      assert.equal(await policyRegistryMock.isPolicyActive(USER1, policyBook1.address), true);
      assert.equal((await claimingRegistryMock.getClaimWithdrawalStatus(id)).toString(), WithdrawalStatus.PENDING);
      //console.log((await policyRegistryMock.policyStartTime(USER1, policyBook1.address)).toString());
      //console.log((await claimingRegistryMock.claimSubmittedTime(id)).toString());

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });

    it("shouldn't be able to submit claim on ACCEPTED claim withdrawn (policy have been removed)", async () => {
      setCurrentTime(toBN(timestamp).plus(10));
      await capitalPool.setliquidityCushionBalance(wei("1000"));
      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      timestamp = await getBlockTimestamp();
      await setCurrentTime(
        toBN(timestamp)
          .plus(await claimingRegistryMock.votingDuration(id))
          .plus(10)
      );

      await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });
      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      assert.equal(await policyRegistryMock.isPolicyActive(USER1, policyBook1.address), true);
      assert.equal((await claimingRegistryMock.getClaimWithdrawalStatus(id)).toString(), WithdrawalStatus.PENDING);
      //console.log((await policyRegistryMock.policyStartTime(USER1, policyBook1.address)).toString());
      //console.log((await claimingRegistryMock.claimSubmittedTime(id)).toString());

      timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10));

      await claimingRegistryMock.withdrawClaim(id, { from: USER1 });

      await truffleAssert.reverts(
        claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        }),
        "ClaimingRegistry: The claimer can't submit this claim"
      );
    });
  });

  describe("acceptClaim()", async () => {
    const epochsNumber = toBN(5);
    const coverTokensAmount = wei("1000");
    let stblAmount;
    const liquidityAmount = wei("5000");

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("10000");
    });

    it("should not accept not AWAITING_CALCULATION claim", async () => {
      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await truffleAssert.reverts(
        claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING }),
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

      const res = await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      console.log("AcceptClaim gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      assert.equal(res.logs.length, 2);
      assert.equal(res.logs[0].event, "WithdrawalRequested");
      assert.equal(res.logs[1].event, "ClaimAccepted");
    });
  });

  describe("rejectClaim()", async () => {
    const coverTokensAmount = wei("1000");

    it("should not reject not AWAITING_CALCULATION claim", async () => {
      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await truffleAssert.reverts(
        claimingRegistryMock.rejectClaim(id, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claim is not awaiting"
      );
    });

    it("should reject the claim", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
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
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      await policyBookAdmin.updateImageUriOfClaim(id, "placeholder2");

      const res = await claimingRegistryMock.rejectClaim(id, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.REJECTED_CAN_APPEAL);
    });
  });

  describe("expireClaim()", async () => {
    const epochsNumber = toBN(5);
    const coverTokensAmount = wei("1000");
    let stblAmount;
    const liquidityAmount = wei("5000");

    beforeEach("setup", async () => {
      stblAmount = getStableAmount("10000");
    });

    it("should not expire not EXPIRED claim", async () => {
      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await truffleAssert.reverts(
        claimingRegistryMock.expireClaim(id, { from: CLAIM_VOTING }),
        "ClaimingRegistry: The claim is not expired"
      );
    });

    it("should expire the claim", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.validityDuration(id)).plus(10));

      const res = await claimingRegistryMock.expireClaim(id, { from: CLAIM_VOTING });

      console.log("ExpireClaim gas used: " + res.receipt.gasUsed);

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.EXPIRED);

      assert.equal(res.logs.length, 1);
      assert.equal(res.logs[0].event, "ClaimExpired");
    });
  });

  describe("hasProcedureOngoing()", async () => {
    const coverTokensAmount = wei("1000");
    const virtualLiquidityAmount = toBN(wei("5000"));

    beforeEach("initializeVoting", async () => {
      await capitalPool.setliquidityCushionBalance(getStableAmount("1000"));
      //await capitalPool.addVirtualUsdtAccumulatedBalance(getStableAmount("1000"));
      await capitalPool.sethardUsdtAccumulatedBalance(0);

      await capitalPool.setBalances([policyBook1.address], [virtualLiquidityAmount], [], [], 0);
    });

    it("return true inside (14 days of Initial voting + 10 days to View Verdict)", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(
        toBN(await claimingRegistryMock.votingDuration(id))
          .plus(8 * 24 * 60 * 60)
          .plus(10)
      );

      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), true);
    });
    it("return true inside (the Claim is Denied + 7 days for Appeal)", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      await claimingRegistryMock.rejectClaim(id, { from: CLAIM_VOTING });

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(
        toBN(timestamp)
          .plus(5 * 24 * 60 * 60)
          .plus(10)
      );
      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), true);
    });
    it("return true inside (the Claim is Approved + 8 days to receive the payout)", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      let timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10));
      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), true);

      timestamp = await getBlockTimestamp();
      await setCurrentTime(
        toBN(timestamp)
          .plus(7 * 24 * 60 * 60)
          .plus(10)
      );
      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), true);
    });
    it("return true inside (Claim is Approved, Claimant missed the payout window, but Policy has not yet Ended + days until the End of the policy (Ended status) + 8 days to receive the payout)", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      let timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10));
      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), true);

      await setCurrentTime(toBN(371).times(24).times(60).times(60).plus(10).toString()); // 1 day before end policy
      assert.equal(await policyRegistryMock.isPolicyActive(USER1, policyBook1.address), true);

      await claimingRegistryMock.requestClaimWithdrawal(1, { from: USER1 });

      timestamp = await getBlockTimestamp();
      await setCurrentTime(
        toBN(timestamp)
          .plus(WITHDRAWAL_PERIOD)
          .plus(7 * 24 * 60 * 60)
          .plus(10)
      ); // (end policy + WITHDRAWAL_PERIOD + 8) - 1
      assert.equal(await policyRegistryMock.isPolicyActive(USER1, policyBook1.address), false);

      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), true);
    });
    it("return false after (14 days of Initial voting + 10 days to View Verdict)", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(
        toBN(await claimingRegistryMock.votingDuration(id))
          .plus(10 * 24 * 60 * 60)
          .plus(10)
      );

      //await claimingRegistryMock.expireClaim(id, { from: CLAIM_VOTING });
      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), false);
    });
    it("return false after (the Claim is Denied + 7 days for Appeal)", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      await claimingRegistryMock.rejectClaim(id, { from: CLAIM_VOTING });

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(
        toBN(timestamp)
          .plus(7 * 24 * 60 * 60)
          .plus(10)
      );
      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), false);
    });
    it("return false after (the Claim is Approved + 8 days to receive the payout)", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      let timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10));
      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), true);

      await claimingRegistryMock.withdrawClaim(1, { from: USER1 });
      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), false);
    });
    it("return false after (Claim is Approved, Claimant missed the payout window, but Policy has not yet Ended + days until the End of the policy (Ended status) + 8 days to receive the payout)", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      let timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10));
      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), true);

      await setCurrentTime(toBN(371).times(24).times(60).times(60).plus(10).toString()); // 1 day before end policy
      assert.equal(await policyRegistryMock.isPolicyActive(USER1, policyBook1.address), true);

      await claimingRegistryMock.requestClaimWithdrawal(1, { from: USER1 });

      timestamp = await getBlockTimestamp();
      await setCurrentTime(
        toBN(timestamp)
          .plus(WITHDRAWAL_PERIOD)
          .plus(8 * 24 * 60 * 60)
          .plus(10)
      ); // (end policy + WITHDRAWAL_PERIOD + 8)
      assert.equal(await policyRegistryMock.isPolicyActive(USER1, policyBook1.address), false);

      assert.equal(await policyBook1.hasProcedureOngoing(policyBook1.address), false);
    });
  });

  describe("requestClaimWithdrawal()", async () => {
    const epochsNumber = toBN(5);
    const coverTokensAmount = wei("1000");
    let stblAmount;
    const liquidityAmount = wei("5000");
    let id;

    beforeEach("initializeVoting", async () => {
      stblAmount = getStableAmount("10000");
      await capitalPool.setliquidityCushionBalance(wei("1000"));

      id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));
    });

    it("should not request withdraw if not claimant", async () => {
      const res = await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      const reason = "ClaimingRegistry: Not allowed to request";
      await truffleAssert.reverts(claimingRegistryMock.requestClaimWithdrawal(1, { from: USER2 }), reason);
    });

    it("should not request withdraw if claim is not accepted", async () => {
      const res = await claimingRegistryMock.rejectClaim(id, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.REJECTED_CAN_APPEAL);

      const reason = "ClaimingRegistry: Claim is not accepted";
      await truffleAssert.reverts(claimingRegistryMock.requestClaimWithdrawal(1, { from: USER1 }), reason);
    });

    it("should not request withdraw if claim is already requested", async () => {
      const res = await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      const reason = "ClaimingRegistry: The claim is already requested";
      await truffleAssert.reverts(claimingRegistryMock.requestClaimWithdrawal(1, { from: USER1 }), reason);
    });

    it("should not request withdraw if policy expired", async () => {
      const res = await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      const timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(toBN(365).times(24).times(60).times(60)).plus(10).toString());

      assert.equal(await policyRegistryMock.isPolicyActive(USER1, policyBook1.address), false);
      const reason = "ClaimingRegistry: The policy is expired";
      await truffleAssert.reverts(claimingRegistryMock.requestClaimWithdrawal(1, { from: USER1 }), reason);
    });

    it("should not request withdraw if claim already withdrawn (policy ended)", async () => {
      const res = await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10));
      await claimingRegistryMock.withdrawClaim(id, { from: USER1 });

      const reason = "ClaimingRegistry: The policy is expired";
      await truffleAssert.reverts(claimingRegistryMock.requestClaimWithdrawal(1, { from: USER1 }), reason);
    });

    it("should resquest withdraw successfully", async () => {
      const res = await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      let timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(READY_TO_WITHDRAW_PERIOD).plus(10));

      await claimingRegistryMock.requestClaimWithdrawal(id, { from: USER1 });
      timestamp = await getBlockTimestamp();

      assert.equal(
        (await claimingRegistryMock.claimWithdrawalInfo(1)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );
      assert.equal((await claimingRegistryMock.claimWithdrawalInfo(1)).committed.toString(), "false");
    });

    it("should resquest withdraw successfully after expiration of previous one", async () => {
      const res = await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });
      let timestamp = await getBlockTimestamp();

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      assert.equal(
        (await claimingRegistryMock.claimWithdrawalInfo(1)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );

      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(READY_TO_WITHDRAW_PERIOD).plus(10));

      await claimingRegistryMock.requestClaimWithdrawal(id, { from: USER1 });
      timestamp = await getBlockTimestamp();

      assert.equal(
        (await claimingRegistryMock.claimWithdrawalInfo(1)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );
    });
  });

  describe("withdrawClaim()", async () => {
    const epochsNumber = toBN(5);
    const coverTokensAmount = wei("1000");
    let stblAmount;
    const virtualLiquidityAmount = toBN(wei("5000"));
    let uBalance;
    let pBalance;
    let liquidity;

    beforeEach("initializeVoting", async () => {
      stblAmount = getStableAmount("10000");

      await capitalPool.setliquidityCushionBalance(getStableAmount("1000"));
      //await capitalPool.addVirtualUsdtAccumulatedBalance(getStableAmount("1000"));
      await capitalPool.sethardUsdtAccumulatedBalance(0);

      await capitalPool.setBalances([policyBook1.address], [virtualLiquidityAmount], [], [], 0);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      const res = await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });
      const timestamp = await getBlockTimestamp();

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      assert.equal(
        (await claimingRegistryMock.claimWithdrawalInfo(1)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );
      assert.equal((await claimingRegistryMock.claimWithdrawalInfo(1)).committed.toString(), "false");

      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10));

      uBalance = toBN(await stblMock.balanceOf(USER1));
      pBalance = toBN(await stblMock.balanceOf(capitalPool.address));

      liquidity = toBN((await policyBook1.getNewCoverAndLiquidity()).newTotalLiquidity);
    });

    it("should not withdraw if not claimant", async () => {
      const reason = "ClaimingRegistry: Not the claimer";
      await truffleAssert.reverts(claimingRegistryMock.withdrawClaim(1, { from: USER2 }), reason);
    });

    it("should not withdraw claim is not requested or expired", async () => {
      timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(READY_TO_WITHDRAW_PERIOD).plus(10).toString());

      const reason = "ClaimingRegistry: Withdrawal is not ready";
      await truffleAssert.reverts(claimingRegistryMock.withdrawClaim(1, { from: USER1 }), reason);
    });

    it("should withdraw claim successfully", async () => {
      await claimingRegistryMock.withdrawClaim(1, { from: USER1 });

      assert.equal(
        toBN(await stblMock.balanceOf(capitalPool.address)).toString(),
        pBalance.minus(convert(coverTokensAmount)).toString()
      );
      assert.equal(
        toBN(await stblMock.balanceOf(USER1)).toString(),
        uBalance.plus(convert(coverTokensAmount)).toString()
      );

      assert.equal(toBN(await policyBook1.totalLiquidity()).toString(), liquidity.minus(coverTokensAmount).toString());
    });
    it("should withdraw part of the requested amount - multiple times", async () => {
      const actualAmount = toBN(coverTokensAmount).minus(wei("10"));
      await capitalPool.setliquidityCushionBalance(convert(actualAmount));
      assert.equal((await capitalPool.liquidityCushionBalance()).toString(), convert(actualAmount).toString());

      await claimingRegistryMock.withdrawClaim(1, { from: USER1 });

      assert.equal(
        toBN(await stblMock.balanceOf(capitalPool.address)).toString(),
        pBalance.minus(convert(actualAmount)).toString()
      );
      assert.equal(toBN(await stblMock.balanceOf(USER1)).toString(), uBalance.plus(convert(actualAmount)).toString());

      assert.equal(toBN(await policyBook1.totalLiquidity()).toString(), liquidity.minus(actualAmount).toString());

      timestamp = await getBlockTimestamp();
      assert.equal(
        (await claimingRegistryMock.claimWithdrawalInfo(1)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );
      assert.equal((await claimingRegistryMock.claimWithdrawalInfo(1)).committed.toString(), "true");
      timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10).toString());

      await capitalPool.setliquidityCushionBalance(convert(wei("10")));
      await claimingRegistryMock.withdrawClaim(1, { from: USER1 });

      assert.equal(
        toBN(await stblMock.balanceOf(capitalPool.address)).toString(),
        pBalance.minus(convert(coverTokensAmount)).toString()
      );
      assert.equal(
        toBN(await stblMock.balanceOf(USER1)).toString(),
        uBalance.plus(convert(coverTokensAmount)).toString()
      );

      assert.equal(toBN(await policyBook1.totalLiquidity()).toString(), liquidity.minus(coverTokensAmount).toString());
    });
  });

  describe("requestRewardWithdrawal()", async () => {
    const epochsNumber = toBN(5);
    const coverTokensAmount = wei("1000");
    let stblAmount;
    const liquidityAmount = wei("5000");
    let id;
    const rewardAmount = wei("100");

    beforeEach("initializeVoting", async () => {
      stblAmount = getStableAmount("10000");
      await capitalPool.setliquidityCushionBalance(wei("1000"));

      id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));
      await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });
      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);
    });

    it("should not request withdraw if not claim voting contract", async () => {
      const reason = "ClaimingRegistry: Caller is not a ClaimVoting contract";
      await truffleAssert.reverts(
        claimingRegistryMock.requestRewardWithdrawal(USER1, rewardAmount, { from: USER2 }),
        reason
      );
    });

    it("should not request withdraw if reward is already requested", async () => {
      await claimingRegistryMock.requestRewardWithdrawal(USER1, rewardAmount, { from: CLAIM_VOTING });

      const reason = "ClaimingRegistry: The reward is already requested";
      await truffleAssert.reverts(
        claimingRegistryMock.requestRewardWithdrawal(USER1, rewardAmount, { from: CLAIM_VOTING }),
        reason
      );
    });

    it("should resquest withdraw successfully", async () => {
      await claimingRegistryMock.requestRewardWithdrawal(USER1, rewardAmount, { from: CLAIM_VOTING });

      let timestamp = await getBlockTimestamp();
      assert.equal(
        (await claimingRegistryMock.rewardWithdrawalInfo(USER1)).rewardAmount.toString(),
        rewardAmount.toString()
      );
      assert.equal(
        (await claimingRegistryMock.rewardWithdrawalInfo(USER1)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );
    });

    it("should resquest withdraw successfully after expiration of previous one", async () => {
      await claimingRegistryMock.requestRewardWithdrawal(USER1, id, { from: CLAIM_VOTING });

      let timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(READY_TO_WITHDRAW_PERIOD).plus(10));

      await claimingRegistryMock.requestRewardWithdrawal(USER1, id, { from: CLAIM_VOTING });
      timestamp = await getBlockTimestamp();

      assert.equal(
        (await claimingRegistryMock.rewardWithdrawalInfo(USER1)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );
    });
  });

  describe("withdrawReward()", async () => {
    const coverTokensAmount = wei("1000");
    let stblAmount;
    const rewardAmount = wei("100");
    const virtualLiquidityAmount = toBN(wei("5000"));
    let uBalance;
    let pBalance;
    let liquidity;

    beforeEach("initializeVoting", async () => {
      stblAmount = getStableAmount("10000");

      await capitalPool.setliquidityCushionBalance(getStableAmount("1000"));
      //await capitalPool.addVirtualUsdtAccumulatedBalance(getStableAmount("1000"));
      await capitalPool.sethardUsdtAccumulatedBalance(0);

      await capitalPool.setBalances([], [], [], [], virtualLiquidityAmount);
      reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount);
      assert.equal(toBN(await reinsurancePool.totalLiquidity()).toString(), virtualLiquidityAmount.toString());

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      const res = await claimingRegistryMock.acceptClaim(id, coverTokensAmount, { from: CLAIM_VOTING });
      let timestamp = await getBlockTimestamp();

      assert.equal(await claimingRegistryMock.countPendingClaims(), 0);
      assert.equal(await claimingRegistryMock.isClaimPending(id), false);

      assert.equal(await claimingRegistryMock.claimStatus(id), ClaimStatus.ACCEPTED);

      uBalance = toBN(await stblMock.balanceOf(USER1));
      pBalance = toBN(await stblMock.balanceOf(capitalPool.address));

      liquidity = toBN(await reinsurancePool.totalLiquidity());

      await claimingRegistryMock.requestRewardWithdrawal(USER1, rewardAmount, { from: CLAIM_VOTING });
      timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10).toString());
    });

    it("should not withdraw reward is not requested or expired", async () => {
      timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(READY_TO_WITHDRAW_PERIOD).plus(10).toString());

      const reason = "ClaimingRegistry: Withdrawal is not ready";
      await truffleAssert.reverts(claimingRegistryMock.withdrawReward({ from: USER1 }), reason);
    });

    it("should withdraw reward successfully", async () => {
      await claimingRegistryMock.withdrawReward({ from: USER1 });

      assert.equal(
        toBN(await stblMock.balanceOf(capitalPool.address)).toString(),
        pBalance.minus(convert(rewardAmount)).toString()
      );
      assert.equal(toBN(await stblMock.balanceOf(USER1)).toString(), uBalance.plus(convert(rewardAmount)).toString());

      assert.equal(toBN(await reinsurancePool.totalLiquidity()).toString(), liquidity.minus(rewardAmount).toString());
    });
    it("should withdraw part of the requested amount - multiple times", async () => {
      const actualAmount = toBN(rewardAmount).minus(wei("10"));
      await capitalPool.setliquidityCushionBalance(convert(actualAmount));
      assert.equal((await capitalPool.liquidityCushionBalance()).toString(), convert(actualAmount).toString());

      await claimingRegistryMock.withdrawReward({ from: USER1 });

      assert.equal(
        toBN(await stblMock.balanceOf(capitalPool.address)).toString(),
        pBalance.minus(convert(actualAmount)).toString()
      );
      assert.equal(toBN(await stblMock.balanceOf(USER1)).toString(), uBalance.plus(convert(actualAmount)).toString());

      assert.equal(toBN(await reinsurancePool.totalLiquidity()).toString(), liquidity.minus(actualAmount).toString());

      timestamp = await getBlockTimestamp();
      assert.equal(
        (await claimingRegistryMock.rewardWithdrawalInfo(USER1)).readyToWithdrawDate.toString(),
        toBN(timestamp).plus(WITHDRAWAL_PERIOD).toString()
      );
      assert.equal((await claimingRegistryMock.rewardWithdrawalInfo(USER1))[0].toString(), wei("10").toString());

      timestamp = await getBlockTimestamp();
      await setCurrentTime(toBN(timestamp).plus(WITHDRAWAL_PERIOD).plus(10).toString());

      await capitalPool.setliquidityCushionBalance(convert(wei("10")));
      await claimingRegistryMock.withdrawReward({ from: USER1 });

      assert.equal(
        toBN(await stblMock.balanceOf(capitalPool.address)).toString(),
        pBalance.minus(convert(rewardAmount)).toString()
      );
      assert.equal(toBN(await stblMock.balanceOf(USER1)).toString(), uBalance.plus(convert(rewardAmount)).toString());

      assert.equal(toBN(await reinsurancePool.totalLiquidity()).toString(), liquidity.minus(rewardAmount).toString());
    });
  });

  describe("claimInfo()", async () => {
    const coverTokensAmount = wei("1000");

    it("should fail due to unexisting index", async () => {
      await truffleAssert.reverts(claimingRegistryMock.claimInfo(1), "ClaimingRegistry: This claim doesn't exist");
    });

    it("should return valid claim info", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      const claim = await claimingRegistryMock.claimInfo(id);

      assert.equal(claim[0], USER1);
      assert.equal(claim[1], policyBook1.address);
      assert.equal(claim[2], "placeholder");
      assert.closeTo(toBN(claim[3]).toNumber(), 1, 1);
      assert.equal(claim[4], false);
      assert.equal(claim[5], 0);
      assert.equal(claim[6], ClaimStatus.AWAITING_CALCULATION);
      assert.equal(claim[7], coverTokensAmount);
    });

    it("shouldn't be public", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.votingDuration(id)).plus(10));

      assert.equal(await claimingRegistryMock.canClaimBeCalculatedByAnyone(id), false);
    });

    it("should be public", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "", coverTokensAmount, false, {
          from: CLAIM_VOTING,
        })
      ).logs[0].args.claimIndex;

      await setCurrentTime(toBN(await claimingRegistryMock.anyoneCanCalculateClaimResultAfter(id)).plus(10));

      assert.equal(await claimingRegistryMock.canClaimBeCalculatedByAnyone(id), true);
    });

    it("should be able to update image uri from a claim", async () => {
      await setCurrentTime(1);

      const id = (
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", coverTokensAmount, false, {
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
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", coverTokensAmount, false, {
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
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", coverTokensAmount, false, {
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
        await claimingRegistryMock.submitClaim(USER1, policyBook1.address, "placeholder", coverTokensAmount, false, {
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
