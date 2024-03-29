const BMICoverStaking = artifacts.require("BMICoverStakingMock");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const RewardsGenerator = artifacts.require("RewardsGeneratorMock");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WrappedTokenMock");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const BMIStaking = artifacts.require("BMIStaking");
const StkBMIToken = artifacts.require("STKBMIToken");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const PriceFeed = artifacts.require("PriceFeed");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");
const StkBMIStaking = artifacts.require("StkBMIStaking");
const NFTStaking = artifacts.require("NFTStaking");
const PolicyRegistry = artifacts.require("PolicyRegistry");
const PolicyQuote = artifacts.require("PolicyQuote");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const CapitalPool = artifacts.require("CapitalPool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const ShieldMining = artifacts.require("ShieldMining");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const YieldGenerator = artifacts.require("YieldGenerator");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");
const Attacker = artifacts.require("Attacker");

const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const UserLeveragePool = artifacts.require("UserLeveragePool");

const { assert } = require("chai");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const { setCurrentTime, advanceBlockAtTime } = require("./helpers/ganacheTimeTraveler");
const Reverter = require("./helpers/reverter");
const { sign2612 } = require("./helpers/signatures");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

const ContractType = {
  CONTRACT: 0,
  STABLECOIN: 1,
  SERVICE: 2,
  EXCHANGE: 3,
};

function toBN(number) {
  return new BigNumber(number);
}

async function advanceBlocks(amount) {
  for (let i = 0; i < amount; i++) {
    await advanceBlockAtTime(1);
  }
}

async function getCurrentBlockTimestamp() {
  return (await web3.eth.getBlock("latest")).timestamp;
}

const wei = web3.utils.toWei;

contract("BMICoverStaking", async (accounts) => {
  const reverter = new Reverter(web3);
  const MAIN = accounts[0];
  const HELP = accounts[1];
  const LEGACY_REWARDS_GENERATOR = accounts[2];
  const NOTHING = accounts[9];

  const TOKEN = "0x0000000000000000000000000000000000000000";

  const MAIN_PRIVATE_KEY = "ad5d3fd80dfc93fa3a5aa232d21cd73da7c6eac6f80d709a590e7245cb6fb9fb";

  const ZERO = "0x0000000000000000000000000000000000000000";

  const APY_PRECISION = toBN(10).pow(5);
  const PRECISION = toBN(10).pow(25);

  let stblMock;
  let bmiMock;
  let policyBook, policyBookFacade;
  let policyBook2, policyBookFacade2;
  let bmiCoverStaking, bmiCoverStakingView;
  let rewardsGenerator;
  let bmiStaking;
  let policyBookAdmin;
  let network;
  let priceFeed;
  let bmiPriceInUSDT;

  before("setup", async () => {
    network = await getNetwork();
    const mockInsuranceContractAddress1 = "0x0000000000000000000000000000000000000001";
    const mockInsuranceContractAddress2 = "0x0000000000000000000000000000000000000002";

    const contractsRegistry = await ContractsRegistry.new();

    if (network == Networks.ETH) {
      stblMock = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stblMock = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }
    bmiMock = await BMIMock.new(NOTHING);
    const wethMock = await WETHMock.new("weth", "weth");

    const sushiswapRouterMock = await SushiswapRouterMock.new();
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _policyBookFabric = await PolicyBookFabric.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _rewardsGenerator = await RewardsGenerator.new();
    const _bmiStaking = await BMIStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _stkBMIToken = await StkBMIToken.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _priceFeed = await PriceFeed.new();
    const _stkBMIStaking = await StkBMIStaking.new();
    const _nftStaking = await NFTStaking.new();
    const _policyRegistry = await PolicyRegistry.new();
    const _policyQuote = await PolicyQuote.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _shieldMining = await ShieldMining.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _yieldGenerator = await YieldGenerator.new();

    const _policyBookImpl = await PolicyBookMock.new();
    const _policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePool = await UserLeveragePool.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REINSURANCE_POOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), wethMock.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblMock.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmiMock.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), sushiswapRouterMock.address);

    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_NAME(),
      _bmiCoverStaking.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), _stkBMIToken.address);
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
      await contractsRegistry.LIQUIDITY_REGISTRY_NAME(),
      _liquidityRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_STAKING_NAME(), _bmiStaking.address);

    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_STAKING_NAME(), _stkBMIStaking.address);

    await contractsRegistry.addProxyContract(await contractsRegistry.NFT_STAKING_NAME(), _nftStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_REGISTRY_NAME(), _policyRegistry.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      _claimingRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), _shieldMining.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const stkBMIToken = await StkBMIToken.at(await contractsRegistry.getSTKBMIContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    bmiStaking = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());
    const stkBMIStaking = await StkBMIStaking.at(await contractsRegistry.getStkBMIStakingContract());

    const policyRegistry = await PolicyRegistry.at(await contractsRegistry.getPolicyRegistryContract());
    const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
    const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());
    priceFeed = await PriceFeed.at(await contractsRegistry.getPriceFeedContract());

    await stkBMIToken.__STKBMIToken_init();
    await bmiCoverStaking.__BMICoverStaking_init();
    await rewardsGenerator.__RewardsGenerator_init(network);
    await bmiStaking.__BMIStaking_init(0);
    await stkBMIStaking.__StkBMIStaking_init();

    await policyBookAdmin.__PolicyBookAdmin_init(
      _policyBookImpl.address,
      _policyBookFacadeImpl.address,
      _userLeveragePool.address
    );
    await policyBookFabric.__PolicyBookFabric_init();
    await claimingRegistry.__ClaimingRegistry_init();
    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await nftStaking.__NFTStaking_init();
    await yieldGenerator.__YieldGenerator_init(network);

    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_STAKING_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIMING_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.SHIELD_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

    if (network == Networks.ETH || network == Networks.POL) {
      await sushiswapRouterMock.setReserve(stblMock.address, wei(toBN(10 ** 3).toString()));
    } else if (network == Networks.BSC) {
      await sushiswapRouterMock.setReserve(stblMock.address, wei(toBN(10 ** 15).toString()));
    }
    await sushiswapRouterMock.setReserve(wethMock.address, wei(toBN(10 ** 15).toString()));
    await sushiswapRouterMock.setReserve(bmiMock.address, wei(toBN(10 ** 15).toString()));

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

    const initialDeposit = toBN(wei("1000"));

    await stblMock.approve(policyBookFabric.address, getStableAmount("1000"));

    await setCurrentTime(1);

    const policyBookAddress = (
      await policyBookFabric.create(
        mockInsuranceContractAddress1,
        ContractType.CONTRACT,
        "mock1",
        "1",
        initialDeposit,
        TOKEN
      )
    ).logs[0].args.at;

    policyBook = await PolicyBookMock.at(policyBookAddress);
    const policyBookFacadeAddress = await policyBook.policyBookFacade();
    policyBookFacade = await PolicyBookFacade.at(policyBookFacadeAddress);

    await policyBookAdmin.whitelist(policyBookAddress, true);

    const liquidity = toBN(wei("1000000"));
    const stblLiquidity = getStableAmount("1000000");

    await stblMock.approve(policyBookAddress, stblLiquidity);
    await policyBookFacade.addLiquidity(liquidity);

    await stblMock.mintArbitrary(HELP, stblLiquidity);

    await stblMock.approve(policyBookAddress, 0, { from: HELP });
    await stblMock.approve(policyBookAddress, stblLiquidity, { from: HELP });
    await policyBookFacade.addLiquidity(liquidity, { from: HELP });

    await stblMock.approve(policyBookFabric.address, 0, { from: HELP });
    await stblMock.approve(policyBookFabric.address, 0);
    await stblMock.approve(policyBookFabric.address, getStableAmount("1000"));

    // await setCurrentTime(1);

    const policyBook2Address = (
      await policyBookFabric.create(
        mockInsuranceContractAddress2,
        ContractType.CONTRACT,
        "mock2",
        "2",
        initialDeposit,
        TOKEN
      )
    ).logs[0].args.at;

    policyBook2 = await PolicyBookMock.at(policyBook2Address);
    const policyBookFacadeAddress2 = await policyBook2.policyBookFacade();
    policyBookFacade2 = await PolicyBookFacade.at(policyBookFacadeAddress2);

    await policyBookAdmin.whitelist(policyBook2Address, true);
    await stblMock.mintArbitrary(HELP, stblLiquidity);
    await stblMock.approve(policyBook2Address, stblLiquidity);
    await policyBookFacade2.addLiquidity(liquidity);

    await stblMock.approve(policyBook2Address, stblLiquidity, { from: HELP });
    await policyBookFacade2.addLiquidity(liquidity, { from: HELP });

    // await setCurrentTime(1);

    await rewardsGenerator.setRewardPerBlock(wei("100"));
    bmiPriceInUSDT = (await priceFeed.howManyUSDTsInBMI(wei("1"))).toString();

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("util functions", async () => {
    it("should set URI", async () => {
      assert.equal(await bmiCoverStaking.uri(0), "0");

      await bmiCoverStaking.setBaseURI("https://token-cdn-domain/");

      assert.equal(await bmiCoverStaking.uri(0), "https://token-cdn-domain/0");
      assert.equal(await bmiCoverStaking.uri(1337), "https://token-cdn-domain/1337");
    });
  });

  describe("stakeBMIX", async () => {
    it("should fail due to insufficient balance", async () => {
      await truffleAssert.reverts(
        bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address, { from: NOTHING }),
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("should fail due to insufficient allowance", async () => {
      await truffleAssert.reverts(
        bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address),
        "ERC20: transfer amount exceeds allowance"
      );
    });

    it("should fail because PolicyBook is not whitelisted", async () => {
      await policyBookAdmin.whitelist(policyBook.address, false);

      await truffleAssert.reverts(
        bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address),
        "BDS: PB is not whitelisted"
      );
    });

    it("should fail if stake 0", async () => {
      await truffleAssert.reverts(
        bmiCoverStaking.stakeBMIX(0, policyBook.address, { from: NOTHING }),
        "BDS: Zero tokens"
      );
    });

    it("should mint new NFT", async () => {
      await bmiCoverStaking.setBaseURI("https://token-cdn-domain/");

      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      const result = await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      assert.equal((await bmiCoverStakingView.stakingInfoByToken(1)).stakedBMIXAmount, wei("1000"));
      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 1);
      assert.equal(await bmiCoverStaking.ownerOf(1), MAIN);

      await policyBook.approve(bmiCoverStaking.address, wei("1000")); // just for a new block

      const info = await bmiCoverStakingView.stakingInfoByStaker(
        MAIN,
        [policyBook.address],
        toBN(bmiPriceInUSDT),
        0,
        1
      );

      assert.equal(info.policyBooksInfo.length, 1);
      assert.equal(toBN(info.policyBooksInfo[0].totalStakedSTBL).toString(), toBN(wei("1000")).toString());
      assert.equal(
        toBN(info.policyBooksInfo[0].rewardPerBlock).toString(),
        toBN(wei("100")).times(PRECISION).toString()
      );
      assert.equal(
        toBN(info.policyBooksInfo[0].stakingAPY).toString(),
        toBN(await bmiCoverStakingView.getPolicyBookAPY(policyBook.address, toBN(bmiPriceInUSDT))).toString()
      );
      assert.equal(toBN(info.policyBooksInfo[0].liquidityAPY).toString(), toBN(await policyBook.getAPY()).toString());

      assert.equal(info.usersInfo.length, 1);
      assert.equal(toBN(info.usersInfo[0].totalStakedBMIX).toString(), toBN(wei("1000")).toString());
      assert.equal(toBN(info.usersInfo[0].totalStakedSTBL).toString(), toBN(wei("1000")).toString());
      assert.closeTo(
        toBN(info.usersInfo[0].totalBmiReward).toNumber(),
        toBN(wei("100")).toNumber(),
        toBN(wei("0.00001")).toNumber()
      );

      assert.equal(info.nftsCount.length, 1);
      assert.equal(info.nftsCount[0], 1);

      assert.equal(info.nftsInfo.length, 1);
      assert.equal(info.nftsInfo[0].length, 1);
      assert.equal(info.nftsInfo[0][0].nftIndex, 1);
      assert.equal(info.nftsInfo[0][0].uri, "https://token-cdn-domain/1");
      assert.equal(toBN(info.nftsInfo[0][0].stakedBMIXAmount).toString(), toBN(wei("1000")).toString());
      assert.equal(toBN(info.nftsInfo[0][0].stakedSTBLAmount).toString(), toBN(wei("1000")).toString());
      assert.closeTo(
        toBN(info.nftsInfo[0][0].reward).toNumber(),
        toBN(wei("100")).toNumber(),
        toBN(wei("0.00001")).toNumber()
      );

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, "StakingNFTMinted");
      assert.equal(result.logs[1].args.id, 1);
      assert.equal(result.logs[1].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[1].args.to, MAIN);
    });

    it("should mint new NFTs", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("999"));
      await bmiCoverStaking.stakeBMIX(wei("999"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("998"));
      await bmiCoverStaking.stakeBMIX(wei("998"), policyBook.address);

      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 3);
      assert.equal((await bmiCoverStakingView.stakingInfoByToken(1)).stakedBMIXAmount, wei("1000"));
      assert.equal((await bmiCoverStakingView.stakingInfoByToken(2)).stakedBMIXAmount, wei("999"));
      assert.equal((await bmiCoverStakingView.stakingInfoByToken(3)).stakedBMIXAmount, wei("998"));
      assert.equal(await bmiCoverStaking.ownerOf(1), MAIN);
      assert.equal(await bmiCoverStaking.ownerOf(2), MAIN);
      assert.equal(await bmiCoverStaking.ownerOf(3), MAIN);
    });

    it("should mint new NFTs and then aggregate into a single one", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("999"));
      await bmiCoverStaking.stakeBMIX(wei("999"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("998"));
      await bmiCoverStaking.stakeBMIX(wei("998"), policyBook.address);

      await bmiCoverStaking.aggregateNFTs(policyBook.address, [1, 2, 3]);

      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 1);
      assert.equal((await bmiCoverStakingView.stakingInfoByToken(4)).stakedBMIXAmount, wei("2997"));
      assert.equal(await bmiCoverStaking.ownerOf(4), MAIN);
    });

    it("should transfer BMIX tokens to Staking", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      assert.equal(await policyBook.balanceOf(bmiCoverStaking.address), 0);
      assert.equal(toBN(await policyBook.balanceOf(MAIN)).toString(), toBN(wei("1001000")).toString());

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      assert.equal(await policyBook.balanceOf(bmiCoverStaking.address), wei("1000"));
      assert.equal(toBN(await policyBook.balanceOf(MAIN)).toString(), toBN(wei("1000000")).toString());
    });

    it("should be able to withdraw", async () => {
      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("2000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await bmiCoverStaking.aggregateNFTs(policyBook.address, [1, 2]);

      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 1); // after aggregate, user can only have 1 nft
      assert.equal(await bmiCoverStaking.ownerOf(3), MAIN);

      await bmiCoverStaking.withdrawFundsWithProfit(3);
    });

    it("should correctly calculate slashing percentage", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("999"));
      await bmiCoverStaking.stakeBMIX(wei("999"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("998"));
      await bmiCoverStaking.stakeBMIX(wei("998"), policyBook.address);

      await setCurrentTime(50 * 24 * 60 * 60);

      const slashingPercentage = await bmiCoverStaking.getSlashingPercentage();

      // data needed to get slashing percentage

      const MAX_EXIT_FEE = toBN(90).times(PRECISION);
      const MIN_EXIT_FEE = toBN(20).times(PRECISION);
      const EXIT_FEE_DURATION = 100 * 24 * 60 * 60; // 100 days in seconds

      assert.equal(slashingPercentage.toString(10), MIN_EXIT_FEE.toString(10));
    });

    it("should not be possible to aggregate NFT from different Policies", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("999"));
      await bmiCoverStaking.stakeBMIX(wei("999"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("998"));
      await bmiCoverStaking.stakeBMIX(wei("998"), policyBook.address);

      // PolicyBook 2
      await policyBook2.approve(bmiCoverStaking.address, wei("1000"));
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook2.address);

      await policyBook2.approve(bmiCoverStaking.address, wei("999"));
      await bmiCoverStaking.stakeBMIX(wei("999"), policyBook2.address);

      await policyBook2.approve(bmiCoverStaking.address, wei("998"));
      await bmiCoverStaking.stakeBMIX(wei("998"), policyBook2.address);

      const infoToken1 = await bmiCoverStakingView.stakingInfoByToken(1);
      assert.equal(infoToken1.policyBookAddress, policyBook.address);

      const infoToken4 = await bmiCoverStakingView.stakingInfoByToken(4);
      assert.equal(infoToken4.policyBookAddress, policyBook2.address);

      const nftPolicyBook = await bmiCoverStakingView.policyBookByNFT(4);
      assert.equal(nftPolicyBook, policyBook2.address);

      // only aggregate nfts from the same policy
      await truffleAssert.reverts(
        bmiCoverStaking.aggregateNFTs(policyBook.address, [4, 5, 6]),
        "BDS: NFTs from distinct origins"
      );

      await truffleAssert.reverts(
        bmiCoverStaking.aggregateNFTs(policyBook.address, [1, 2, 6]),
        "BDS: NFTs from distinct origins"
      );

      await truffleAssert.reverts(
        bmiCoverStaking.aggregateNFTs(policyBook.address, [5, 1, 2]),
        "BDS: NFTs from distinct origins"
      );

      await truffleAssert.reverts(
        bmiCoverStaking.aggregateNFTs(policyBook.address, [1, 4, 3]),
        "BDS: NFTs from distinct origins"
      );

      await bmiCoverStaking.aggregateNFTs(policyBook2.address, [4, 5]);

      //after aggregate, number of nfts should decrease
      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 5);
      await truffleAssert.reverts(bmiCoverStakingView.stakingInfoByToken(4), "BDS: Token doesn't exist");
      await truffleAssert.reverts(bmiCoverStakingView.stakingInfoByToken(5), "BDS: Token doesn't exist");

      await bmiCoverStaking.aggregateNFTs(policyBook2.address, [6, 7]);

      // after aggregating, nft token id should be deleted
      await truffleAssert.reverts(bmiCoverStakingView.stakingInfoByToken(7), "BDS: Token doesn't exist");

      const infoToken8 = await bmiCoverStakingView.stakingInfoByToken(8);
      assert.equal(infoToken8.policyBookAddress, policyBook2.address);
    });

    it("don't mints 2 NFTs with the same ID under attack", async () => {
      const attacker = await Attacker.new(bmiCoverStaking.address);

      let nftID = await bmiCoverStaking.nftMintId();
      assert.equal(nftID, 1);

      let balance = await bmiCoverStaking.balanceOf(attacker.address, 1);
      assert.equal(balance, 0);

      await policyBook.transfer(attacker.address, wei("50"), { from: HELP });
      await truffleAssert.reverts(attacker.attack(wei("10"), policyBook.address), "ReentrancyGuard: reentrant call");

      // // id incremented twice
      // nftID = await bmiCoverStaking.nftMintId();
      // assert.equal(nftID, 3);

      // // balance on first incrementation of 2
      // balance = await bmiCoverStaking.balanceOf(attacker.address, 1);
      // assert.equal(balance, 2);

      // balance = await bmiCoverStaking.balanceOf(attacker.address, 2);
      // assert.equal(balance, 0);

      // tokenOfOwnerByIndex = await bmiCoverStaking.tokenOfOwnerByIndex(attacker.address, 0);
      // assert.equal(tokenOfOwnerByIndex, 1);
    });
  });

  describe("extreme cases tests", async () => {
    it("everything should be ok if a user transfered NFT to zero address", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("2000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await truffleAssert.reverts(bmiCoverStaking.safeTransferFrom(MAIN, ZERO, 1, 1, []), "ERC1155: zero address");
    });

    it("everything should be ok if a user transfered NFT to a different user", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("2000"));
      await policyBook.approve(bmiCoverStaking.address, wei("2000"), { from: HELP });

      assert.equal(await bmiCoverStaking.totalStaked(MAIN), 0);

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);
      await bmiCoverStaking.stakeBMIX(wei("999"), policyBook.address);

      assert.equal(await bmiCoverStaking.totalStaked(MAIN), wei("1999"));

      await bmiCoverStaking.stakeBMIX(wei("500"), policyBook.address, { from: HELP });
      await bmiCoverStaking.stakeBMIX(wei("499"), policyBook.address, { from: HELP });

      assert.equal(await bmiCoverStaking.totalStaked(HELP), wei("999"));

      await bmiCoverStaking.safeTransferFrom(MAIN, HELP, 1, 1, []);

      assert.equal(await bmiCoverStaking.totalStaked(MAIN), wei("999"));
      assert.equal(await bmiCoverStaking.totalStaked(HELP), wei("1999"));
    });

    it("should aggregate NFTs correctly", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("2000"));
      await policyBook.approve(bmiCoverStaking.address, wei("2000"), { from: HELP });

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);
      await bmiCoverStaking.stakeBMIX(wei("999"), policyBook.address);

      await bmiCoverStaking.stakeBMIX(wei("500"), policyBook.address, { from: HELP });
      await bmiCoverStaking.stakeBMIX(wei("499"), policyBook.address, { from: HELP });

      await bmiCoverStaking.safeTransferFrom(MAIN, HELP, 1, 1, []);

      await bmiCoverStaking.aggregateNFTs(policyBook.address, [1, 3, 4], { from: HELP });

      assert.equal((await bmiCoverStakingView.stakingInfoByToken(5)).stakedBMIXAmount, wei("1999"));
      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 1);
      assert.equal(await bmiCoverStaking.balanceOf(HELP), 1);
    });
  });

  describe("restakeBMIProfit", async () => {
    it("should restake BMIs", async () => {
      // await setCurrentTime(1);

      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await advanceBlocks(9);

      const staked = await bmiStaking.getStakedBMI(MAIN);
      assert.equal(toBN(staked).toString(), "0");

      await bmiCoverStaking.restakeBMIProfit(1);

      assert.closeTo(
        toBN(await bmiStaking.getStakedBMI(MAIN)).toNumber(),
        toBN(wei("1000")).toNumber(),
        toBN(wei("0.00001")).toNumber()
      );

      await truffleAssert.reverts(bmiCoverStaking.restakeBMIProfit(2), "BDS: Token doesn't exist");
    });

    it("should restake all BMIs", async () => {
      // await setCurrentTime(1);

      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await advanceBlocks(9);

      const staked = await bmiStaking.getStakedBMI(MAIN);
      assert.equal(staked, 0);

      await bmiCoverStaking.restakeStakerBMIProfit(policyBook.address);

      assert.closeTo(
        toBN(await bmiStaking.getStakedBMI(MAIN)).toNumber(),
        toBN(wei("1000")).toNumber(),
        toBN(wei("0.00001")).toNumber()
      );
    });

    it("should can't restake BMIs in other chains", async () => {
      // await setCurrentTime(1);
      await bmiCoverStaking.setAllowStakeProfit(false);

      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await advanceBlocks(9);

      const staked = await bmiStaking.getStakedBMI(MAIN);
      assert.equal(toBN(staked).toString(), "0");

      await truffleAssert.reverts(bmiCoverStaking.restakeBMIProfit(1), "BDS: restake not avaiable");
    });
  });

  describe("APY", async () => {
    it("should calculate correct APY", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));
      await bmiCoverStaking.stakeBMIX(wei("10"), policyBook.address);

      let APY = toBN(await bmiCoverStakingView.getPolicyBookAPY(policyBook.address, toBN(bmiPriceInUSDT)));

      assert.equal(APY.div(APY_PRECISION).toString(), "2140227272.72727");

      await policyBookAdmin.whitelist(policyBook.address, false);

      APY = toBN(await bmiCoverStakingView.getPolicyBookAPY(policyBook.address, toBN(bmiPriceInUSDT)));

      assert.equal(APY, 0);
    });
  });

  describe("withdrawBMIProfit", async () => {
    it("should revert due to nonexistent token", async () => {
      await truffleAssert.reverts(bmiCoverStaking.withdrawBMIProfit(1), "BDS: Token doesn't exist");
    });

    it("should revert due to different token ownership", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await truffleAssert.reverts(bmiCoverStaking.withdrawBMIProfit(1, { from: HELP }), "BDS: Not a token owner");
    });

    it("should fail if stake to a non existing policy book", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      await truffleAssert.reverts(bmiCoverStaking.stakeBMIX(wei("1000"), HELP), "BDS: Not a PB");
    });

    it("should withdraw 100 BMI with slashing", async () => {
      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);
      const result = await bmiCoverStaking.withdrawBMIProfit(1);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[0].args.id, 1);
      assert.equal(result.logs[0].args.policyBookAddress, policyBook.address);
      assert.closeTo(
        toBN(result.logs[0].args.amount).toNumber(),
        toBN(wei("80")).toNumber(),
        toBN(wei("0.0004")).toNumber() // rewards are bigger when all test run
      );
      assert.equal(result.logs[0].args.to, MAIN);
    });

    it("should withdraw 100 BMI without slashing", async () => {
      await bmiCoverStaking.setAllowStakeProfit(false);
      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);
      const result = await bmiCoverStaking.withdrawBMIProfit(1);

      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[0].args.id, 1);
      assert.equal(result.logs[0].args.policyBookAddress, policyBook.address);
      assert.equal(toBN(result.logs[0].args.amount).toNumber(), toBN(wei("100")).toNumber());
      assert.equal(result.logs[0].args.to, MAIN);
    });

    it("should withdraw all 100 BMI with slashing", async () => {
      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("2000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);
      const result = await bmiCoverStaking.withdrawStakerBMIProfit(policyBook.address);

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[1].args.id, 1);
      assert.equal(result.logs[1].args.policyBookAddress, policyBook.address);
      assert.closeTo(
        toBN(result.logs[1].args.amount).toNumber(),
        toBN(wei("120")).toNumber(),
        toBN(wei("0.0006")).toNumber() // higher rewards when all test running
      );
      assert.equal(result.logs[1].args.to, MAIN);

      assert.equal(result.logs[0].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[0].args.id, 2);
      assert.equal(result.logs[0].args.policyBookAddress, policyBook.address);
      assert.closeTo(
        toBN(result.logs[0].args.amount).toNumber(),
        toBN(wei("40")).toNumber(),
        toBN(wei("0.0003")).toNumber() // higher rewards when all test running
      );
      assert.equal(result.logs[0].args.to, MAIN);
    });

    it("should withdraw all 100 BMI without slashing", async () => {
      await bmiCoverStaking.setAllowStakeProfit(false);
      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("2000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);
      const result = await bmiCoverStaking.withdrawStakerBMIProfit(policyBook.address);

      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[1].args.id, 1);
      assert.equal(result.logs[1].args.policyBookAddress, policyBook.address);
      assert.equal(toBN(result.logs[1].args.amount).toNumber(), toBN(wei("150")).toNumber());
      assert.equal(result.logs[1].args.to, MAIN);

      assert.equal(result.logs[0].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[0].args.id, 2);
      assert.equal(result.logs[0].args.policyBookAddress, policyBook.address);
      assert.equal(toBN(result.logs[0].args.amount).toNumber(), toBN(wei("50")).toNumber());
      assert.equal(result.logs[0].args.to, MAIN);
    });
  });

  describe("withdrawFundsWithProfit", async () => {
    it("should revert due to nonexistent token", async () => {
      await truffleAssert.reverts(bmiCoverStaking.withdrawFundsWithProfit(1), "BDS: Token doesn't exist");
    });

    it("should not fail", async () => {
      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("100"));

      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await bmiCoverStaking.withdrawFundsWithProfit(1);
    });

    it("should revert due to different token owner", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await truffleAssert.reverts(bmiCoverStaking.withdrawBMIProfit(1, { from: HELP }), "BDS: Not a token owner");
    });

    it("should withdraw funds, profit and burn NFT with slashing", async () => {
      // await setCurrentTime(1);

      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      assert.equal(await policyBook.balanceOf(bmiCoverStaking.address), 0);
      assert.equal(toBN(await policyBook.balanceOf(MAIN)).toString(), toBN(wei("1001000")).toString());

      assert.equal(await stblMock.balanceOf(rewardsGenerator.address), 0);
      assert.equal(toBN(await policyBook.totalLiquidity()).toString(), toBN(wei("2001000")).toString());
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      assert.equal(toBN(await policyBook.balanceOf(bmiCoverStaking.address)).toString(), toBN(wei("1000")).toString());
      /*
      assert.equal(
        toBN(await stblMock.balanceOf(policyBook.address)).toString(),
        toBN(wei("2001000", "mwei")).toString()
      );
      */

      assert.equal((await bmiCoverStakingView.stakingInfoByToken(1)).stakedBMIXAmount, wei("1000"));
      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 1);
      assert.equal(await bmiCoverStaking.ownerOf(1), MAIN);

      await setCurrentTime(50 * 24 * 60 * 60);

      const result = await bmiCoverStaking.withdrawFundsWithProfit(1);

      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 0);

      assert.equal(await policyBook.balanceOf(bmiCoverStaking.address), 0);
      assert.equal(toBN(await policyBook.balanceOf(MAIN)).toString(), toBN(wei("1001000")).toString());

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[0].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[0].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[0].args.id, 1);
      assert.equal(result.logs[0].args.to, MAIN);
      assert.closeTo(
        toBN(result.logs[0].args.amount).toNumber(),
        toBN(wei("160")).toNumber(),
        toBN(wei("0.001")).toNumber()
      ); // slashed 20%

      assert.equal(result.logs[1].event, "StakingFundsWithdrawn");
      assert.equal(result.logs[1].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[1].args.id, 1);
      assert.equal(result.logs[1].args.to, MAIN);

      assert.equal(result.logs[3].event, "StakingNFTBurned");
      assert.equal(result.logs[3].args.id, 1);
      assert.equal(result.logs[3].args.policyBookAddress, policyBook.address);
    });

    it("should withdraw funds, profit and burn NFT without slashing", async () => {
      // await setCurrentTime(1);
      await bmiCoverStaking.setAllowStakeProfit(false);
      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));

      assert.equal(await policyBook.balanceOf(bmiCoverStaking.address), 0);
      assert.equal(toBN(await policyBook.balanceOf(MAIN)).toString(), toBN(wei("1001000")).toString());

      assert.equal(await stblMock.balanceOf(rewardsGenerator.address), 0);
      assert.equal(toBN(await policyBook.totalLiquidity()).toString(), toBN(wei("2001000")).toString());
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      assert.equal(toBN(await policyBook.balanceOf(bmiCoverStaking.address)).toString(), toBN(wei("1000")).toString());
      /*
      assert.equal(
        toBN(await stblMock.balanceOf(policyBook.address)).toString(),
        toBN(wei("2001000", "mwei")).toString()
      );
      */

      assert.equal((await bmiCoverStakingView.stakingInfoByToken(1)).stakedBMIXAmount, wei("1000"));
      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 1);
      assert.equal(await bmiCoverStaking.ownerOf(1), MAIN);

      await setCurrentTime(50 * 24 * 60 * 60);

      const result = await bmiCoverStaking.withdrawFundsWithProfit(1);

      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 0);

      assert.equal(await policyBook.balanceOf(bmiCoverStaking.address), 0);
      assert.equal(toBN(await policyBook.balanceOf(MAIN)).toString(), toBN(wei("1001000")).toString());

      assert.equal(result.logs.length, 4);
      assert.equal(result.logs[0].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[0].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[0].args.id, 1);
      assert.equal(result.logs[0].args.to, MAIN);
      assert.equal(toBN(result.logs[0].args.amount).toNumber(), toBN(wei("200")).toNumber()); // slashed 20%

      assert.equal(result.logs[1].event, "StakingFundsWithdrawn");
      assert.equal(result.logs[1].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[1].args.id, 1);
      assert.equal(result.logs[1].args.to, MAIN);

      assert.equal(result.logs[3].event, "StakingNFTBurned");
      assert.equal(result.logs[3].args.id, 1);
      assert.equal(result.logs[3].args.policyBookAddress, policyBook.address);
    });

    it("should withdraw all funds, all profit and burn NFT with slashing", async () => {
      // await setCurrentTime(1);

      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("2000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      const result = await bmiCoverStaking.withdrawStakerFundsWithProfit(policyBook.address);

      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 0);

      assert.equal(await policyBook.balanceOf(bmiCoverStaking.address), 0);
      assert.equal(toBN(await policyBook.balanceOf(MAIN)).toString(), toBN(wei("1001000")).toString());

      assert.equal(result.logs.length, 8);
      assert.equal(result.logs[0].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[0].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[0].args.id, 2);
      assert.equal(result.logs[0].args.to, MAIN);
      assert.closeTo(
        toBN(result.logs[0].args.amount).toNumber(),
        toBN(wei("40")).toNumber(),
        toBN(wei("0.0003")).toNumber()
      ); // slashed 20% (shared 1 block with 2)

      assert.equal(result.logs[1].event, "StakingFundsWithdrawn");
      assert.equal(result.logs[1].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[1].args.id, 2);
      assert.equal(result.logs[1].args.to, MAIN);

      assert.equal(result.logs[3].event, "StakingNFTBurned");
      assert.equal(result.logs[3].args.id, 2);
      assert.equal(result.logs[3].args.policyBookAddress, policyBook.address);

      assert.equal(result.logs[4].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[4].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[4].args.id, 1);
      assert.equal(result.logs[4].args.to, MAIN);
      assert.closeTo(
        toBN(result.logs[4].args.amount).toNumber(),
        toBN(wei("120")).toNumber(),
        toBN(wei("0.0013")).toNumber()
      ); // slashed 20% (shared 1 block with 2)

      assert.equal(result.logs[5].event, "StakingFundsWithdrawn");
      assert.equal(result.logs[5].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[5].args.id, 1);
      assert.equal(result.logs[5].args.to, MAIN);

      assert.equal(result.logs[7].event, "StakingNFTBurned");
      assert.equal(result.logs[7].args.id, 1);
      assert.equal(result.logs[7].args.policyBookAddress, policyBook.address);
    });

    it("should withdraw all funds, all profit and burn NFT without slashing", async () => {
      // await setCurrentTime(1);
      await bmiCoverStaking.setAllowStakeProfit(false);
      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("2000"));

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      const result = await bmiCoverStaking.withdrawStakerFundsWithProfit(policyBook.address);

      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 0);

      assert.equal(await policyBook.balanceOf(bmiCoverStaking.address), 0);
      assert.equal(toBN(await policyBook.balanceOf(MAIN)).toString(), toBN(wei("1001000")).toString());

      assert.equal(result.logs.length, 8);
      assert.equal(result.logs[0].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[0].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[0].args.id, 2);
      assert.equal(result.logs[0].args.to, MAIN);
      assert.equal(toBN(result.logs[0].args.amount).toNumber(), toBN(wei("50")).toNumber()); // slashed 20% (shared 1 block with 2)

      assert.equal(result.logs[1].event, "StakingFundsWithdrawn");
      assert.equal(result.logs[1].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[1].args.id, 2);
      assert.equal(result.logs[1].args.to, MAIN);

      assert.equal(result.logs[3].event, "StakingNFTBurned");
      assert.equal(result.logs[3].args.id, 2);
      assert.equal(result.logs[3].args.policyBookAddress, policyBook.address);

      assert.equal(result.logs[4].event, "StakingBMIProfitWithdrawn");
      assert.equal(result.logs[4].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[4].args.id, 1);
      assert.equal(result.logs[4].args.to, MAIN);
      assert.equal(toBN(result.logs[4].args.amount).toNumber(), toBN(wei("150")).toNumber()); // slashed 20% (shared 1 block with 2)

      assert.equal(result.logs[5].event, "StakingFundsWithdrawn");
      assert.equal(result.logs[5].args.policyBookAddress, policyBook.address);
      assert.equal(result.logs[5].args.id, 1);
      assert.equal(result.logs[5].args.to, MAIN);

      assert.equal(result.logs[7].event, "StakingNFTBurned");
      assert.equal(result.logs[7].args.id, 1);
      assert.equal(result.logs[7].args.policyBookAddress, policyBook.address);
    });
  });

  describe("slashing", async () => {
    beforeEach(async () => {
      await bmiMock.mintArbitrary(bmiCoverStaking.address, wei("10000"));
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);
    });

    it("should be 20%", async () => {
      await setCurrentTime((await getCurrentBlockTimestamp()) + 86400 * 100 + 200);

      const reward = toBN(await bmiCoverStaking.getSlashedBMIProfit(1));

      assert.equal(reward.toString(), wei("80"));
    });
  });

  describe("stakeWithPermit", async () => {
    let buffer, contractData;
    beforeEach(async () => {
      buffer = Buffer.from(MAIN_PRIVATE_KEY, "hex");
      contractData = { name: await policyBook.symbol(), verifyingContract: policyBook.address };
    });

    it.skip("should stake with permit", async () => {
      const transactionData = {
        owner: MAIN,
        spender: bmiCoverStaking.address,
        value: wei("1000"),
      };

      const { v, r, s } = sign2612(contractData, transactionData, buffer);

      const balance = toBN(await policyBook.balanceOf(MAIN));
      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 0);

      await bmiCoverStaking.stakeBMIXWithPermit(wei("1000"), policyBook.address, v, r, s);

      assert.equal(balance.minus(wei("1000")).toString(), toBN(await policyBook.balanceOf(MAIN)).toString());
      assert.equal(await bmiCoverStaking.balanceOf(MAIN), 1);
    });

    it.skip("should fail if stake with permit 0 tokens", async () => {
      const buffer = Buffer.from(MAIN_PRIVATE_KEY, "hex");
      const contractData = { name: await policyBook.symbol(), verifyingContract: policyBook.address };

      const transactionData = {
        owner: MAIN,
        spender: bmiCoverStaking.address,
        value: wei("0"),
      };

      const { v, r, s } = sign2612(contractData, transactionData, buffer);

      await truffleAssert.reverts(
        bmiCoverStaking.stakeBMIXWithPermit(wei("0"), policyBook.address, v, r, s),
        "BDS: Zero tokens"
      );
    });
  });

  describe("Fail tests", async () => {
    it("should fail when aggregate NFT using wrong conditions", async () => {
      await policyBook.approve(bmiCoverStaking.address, wei("1000"));
      await bmiCoverStaking.stakeBMIX(wei("1000"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("999"));
      await bmiCoverStaking.stakeBMIX(wei("999"), policyBook.address);

      await policyBook.approve(bmiCoverStaking.address, wei("998"));
      await bmiCoverStaking.stakeBMIX(wei("998"), policyBook.address);

      // only owner can aggregate nfts
      await truffleAssert.reverts(
        bmiCoverStaking.aggregateNFTs(policyBook.address, [1, 2], { from: NOTHING }),
        "BDS: Not a token owner"
      );

      // should revert if it isn't a policy book
      await truffleAssert.reverts(bmiCoverStaking.aggregateNFTs(HELP, [2, 3]), "BDS: Not a PB");

      await truffleAssert.reverts(bmiCoverStaking.aggregateNFTs(policyBook.address, [4]), "BDS: Can't aggregate");

      await truffleAssert.reverts(bmiCoverStaking.aggregateNFTs(policyBook.address, []), "BDS: Can't aggregate");

      await truffleAssert.reverts(
        bmiCoverStaking.aggregateNFTs(policyBook.address, [1, 2, 3, 4]),
        "EnumerableMap: nonexistent key"
      );

      await truffleAssert.reverts(bmiCoverStakingView.stakingInfoByToken(10), "BDS: Token doesn't exist");

      await truffleAssert.reverts(bmiCoverStakingView.stakingInfoByToken(0), "BDS: Token doesn't exist");

      const nonExistingPolicyBook = await bmiCoverStakingView.policyBookByNFT(10);
      assert.equal(nonExistingPolicyBook, ZERO);
    });
  });
});
