const InteractionSolidity = artifacts.require("InteractionSolidity");

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

const PolicyBook = artifacts.require("PolicyBook");
const PolicyBookFacade = artifacts.require("PolicyBookFacade");
const UserLeveragePool = artifacts.require("UserLeveragePool");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

const { assert } = require("chai");

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

function toBN(number) {
  return new BigNumber(number);
}

const { toWei } = web3.utils;
const wei = web3.utils.toWei;

contract("InteractionSolidity", async (accounts) => {
  const reverter = new Reverter(web3);

  let contractsRegistry;
  let stbl;
  let capitalPool;

  let userLeveragePool;
  let leveragePortfolioView;

  let policyRegistry, policyBookRegistry, policyBookAdmin;

  let interactionSolidity;
  let network;

  const insuranceContract1 = accounts[1];
  const insuranceContract2 = accounts[2];
  const insuranceContract3 = accounts[3];
  const insuranceContract4 = accounts[4];
  const insuranceContract5 = accounts[6];
  const DISTRIBUTOR = accounts[5];
  const user1 = accounts[7];
  const user2 = accounts[8];
  const fake = accounts[9];

  const TOKEN = "0x0000000000000000000000000000000000000000";

  const PRECISION = toBN(10).pow(25);

  let epochsNumber, initialDeposit, stblInitialDeposit, highAmount, coverTokensAmount, liquidityAmount, stblAmount;

  const convert = (amount) => {
    if (network == Networks.ETH) {
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

    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.PRICE_FEED_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), fake);

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
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());
    const claimingRegistry = await ClaimingRegistry.at(await contractsRegistry.getClaimingRegistryContract());
    const liquidityRegistry = await LiquidityRegistry.at(await contractsRegistry.getLiquidityRegistryContract());
    const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
    const bmiCoverStakingView = await BMICoverStakingView.at(await contractsRegistry.getBMICoverStakingViewContract());
    const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
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

    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_FABRIC_NAME());
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

    epochsNumber = 5;
    initialDeposit = toWei("1000");
    stblInitialDeposit = getStableAmount("1000");
    highAmount = getStableAmount("100000");
    coverTokensAmount = toWei("100");
    liquidityAmount = toWei("5000");
    stblAmount = getStableAmount("5000");

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

    await stbl.approve(policyBookFabric.address, stblInitialDeposit.times(6));

    // CREATION PB1
    let tx1 = await policyBookFabric.create(
      insuranceContract1,
      ContractType.CONTRACT,
      "test1 description",
      "TEST1",
      initialDeposit,
      TOKEN
    );
    const policyBookAddress1 = tx1.logs[0].args.at;
    policyBook1 = await PolicyBook.at(policyBookAddress1);
    const policyBookFacadeAddress1 = await policyBook1.policyBookFacade();
    policyBookFacade1 = await PolicyBookFacade.at(policyBookFacadeAddress1);
    await policyBookAdmin.whitelist(policyBookAddress1, true);
    await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacadeAddress1, true);

    // CREATION PB2
    let tx2 = await policyBookFabric.create(
      insuranceContract2,
      ContractType.CONTRACT,
      "test2 description",
      "TEST2",
      initialDeposit,
      TOKEN
    );
    const policyBookAddress2 = tx2.logs[0].args.at;
    policyBook2 = await PolicyBook.at(policyBookAddress2);
    const policyBookFacadeAddress2 = await policyBook2.policyBookFacade();
    policyBookFacade2 = await PolicyBookFacade.at(policyBookFacadeAddress2);
    await policyBookAdmin.whitelist(policyBookAddress2, true);
    await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacadeAddress2, true);

    // CREATION PB3
    let tx3 = await policyBookFabric.create(
      insuranceContract3,
      ContractType.CONTRACT,
      "test3 description",
      "TEST3",
      initialDeposit,
      TOKEN
    );
    const policyBookAddress3 = tx3.logs[0].args.at;
    policyBook3 = await PolicyBook.at(policyBookAddress3);
    const policyBookFacadeAddress3 = await policyBook3.policyBookFacade();
    policyBookFacade3 = await PolicyBookFacade.at(policyBookFacadeAddress3);
    await policyBookAdmin.whitelist(policyBookAddress3, true);
    await policyBookAdmin.setPolicyBookFacadeSafePricingModel(policyBookFacadeAddress3, true);

    // CREATION PB4 not whitelisted
    let tx4 = await policyBookFabric.create(
      insuranceContract4,
      ContractType.CONTRACT,
      "test4 description",
      "TEST4",
      initialDeposit,
      TOKEN
    );
    const policyBookAddress4 = tx4.logs[0].args.at;
    policyBook4 = await PolicyBook.at(policyBookAddress4);
    const policyBookFacadeAddress4 = await policyBook4.policyBookFacade();
    policyBookFacade4 = await PolicyBookFacade.at(policyBookFacadeAddress4);

    const tx = await policyBookFabric.createLeveragePools(
      insuranceContract5,
      ContractType.VARIOUS,
      "User Leverage Pool",
      "USDT"
    );
    const userLeveragePoolAddress = tx.logs[0].args.at;
    userLeveragePool = await UserLeveragePool.at(userLeveragePoolAddress);
    await policyBookAdmin.whitelist(userLeveragePoolAddress, true);

    interactionSolidity = await InteractionSolidity.new(contractsRegistry.address);
  });

  describe("creation checks", async () => {
    it("should have expected token name", async () => {
      assert.equal(await policyBook1.name(), "test1 description");
      assert.equal(await policyBook2.name(), "test2 description");
      assert.equal(await policyBook3.name(), "test3 description");
      assert.equal(await policyBook4.name(), "test4 description");
      assert.equal(await userLeveragePool.name(), "User Leverage Pool");
    });

    it("should have expected token symbol", async () => {
      assert.equal(await policyBook1.symbol(), "bmiV2TEST1Cover");
      assert.equal(await policyBook2.symbol(), "bmiV2TEST2Cover");
      assert.equal(await policyBook3.symbol(), "bmiV2TEST3Cover");
      assert.equal(await policyBook4.symbol(), "bmiV2TEST4Cover");
      assert.equal(await userLeveragePool.symbol(), "bmiV2USDTCover");
    });
  });

  describe("constructor", async function () {
    it(`sets contracts dependencies`, async function () {
      expect(await interactionSolidity.contractRegistry()).to.equal(contractsRegistry.address);
      expect(await interactionSolidity.policyRegistry()).to.equal(policyRegistry.address);
      expect(await interactionSolidity.policyBookRegistry()).to.equal(policyBookRegistry.address);
    });
  });
  describe("getWhiteListedPolicies", async function () {
    it(`returns the list of whitelisted policies`, async function () {
      const result = await interactionSolidity.getWhiteListedPolicies();
      expect(result[0].length).to.equal(4); // 3 + Leverage Pool
      expect(result[0][0]).to.equal(policyBook1.address);
      expect(result[0][1]).to.equal(policyBook2.address);
      expect(result[0][2]).to.equal(policyBook3.address);
      expect(result[1].length).to.equal(4);
      expect(result[1][0][0]).to.equal("bmiV2TEST1Cover");
      expect(result[1][1][0]).to.equal("bmiV2TEST2Cover");
      expect(result[1][2][0]).to.equal("bmiV2TEST3Cover");
    });
  });
  describe("getPurchasedPolicies", async function () {
    it(`returns the list of purchased contract for a given user`, async function () {
      await stbl.approve(policyBook1.address, 0);
      await stbl.approve(policyBook1.address, stblAmount);
      await policyBookFacade1.addLiquidity(liquidityAmount);
      await stbl.approve(policyBook2.address, 0);
      await stbl.approve(policyBook2.address, stblAmount);
      await policyBookFacade2.addLiquidity(liquidityAmount);

      await stbl.transfer(user1, highAmount);

      const price1 = (await policyBookFacade1.getPolicyPrice(epochsNumber, coverTokensAmount, user1))[1];
      await stbl.approve(policyBook1.address, 0, { from: user1 });
      await stbl.approve(policyBook1.address, price1, { from: user1 });
      await policyBookFacade1.buyPolicy(epochsNumber, coverTokensAmount, {
        from: user1,
      });

      const price2 = (await policyBookFacade2.getPolicyPrice(epochsNumber, coverTokensAmount, user1))[1];
      await stbl.approve(policyBook2.address, 0, { from: user1 });
      await stbl.approve(policyBook2.address, price2, { from: user1 });
      await policyBookFacade2.buyPolicy(epochsNumber, coverTokensAmount, {
        from: user1,
      });

      const result = await interactionSolidity.getPurchasedPolicies(true, { from: user1 });
      expect(result[0].toNumber()).to.equal(2);
      expect(result[1].length).to.equal(2);
      expect(result[2][0].coverAmount).to.equal(coverTokensAmount);
      expect(result[2][1].coverAmount).to.equal(coverTokensAmount);
      expect(result[3][0].toNumber()).to.equal(ClaimStatus.CAN_CLAIM);
      expect(result[3][1].toNumber()).to.equal(ClaimStatus.CAN_CLAIM);
    });
  });
  describe("purchasePolicy", async function () {
    beforeEach(async function () {
      await stbl.transfer(user2, highAmount);
      await policyBookAdmin.whitelistDistributor(DISTRIBUTOR, toBN(5).times(PRECISION));
    });
    it(`buys policy from distributor for the user on given policy book if distributor whitelisted`, async function () {
      await stbl.approve(policyBook2.address, 0);
      await stbl.approve(policyBook2.address, stblAmount);
      await policyBookFacade2.addLiquidity(liquidityAmount);

      const price = (await policyBookFacade2.getPolicyPrice(epochsNumber, coverTokensAmount, user2))[1];
      const priceStbl = convert(price);
      await stbl.approve(interactionSolidity.address, 0, { from: user2 });
      await stbl.approve(interactionSolidity.address, priceStbl, { from: user2 });

      await interactionSolidity.purchasePolicy(policyBook2.address, epochsNumber, coverTokensAmount, DISTRIBUTOR, {
        from: user2,
      });

      const result = await interactionSolidity.getPurchasedPolicies(true, { from: user2 });
      expect(result[0].toNumber()).to.equal(1);
      expect(result[1].length).to.equal(1);
      expect(result[2][0].coverAmount).to.equal(coverTokensAmount);
      expect(result[3][0].toNumber()).to.equal(ClaimStatus.CAN_CLAIM);
    });
  });
  describe("earnInterest", async function () {
    beforeEach(async function () {
      await stbl.transfer(user2, highAmount);
    });
    it(`adds liquidity for the user on given policy book`, async function () {
      await stbl.approve(interactionSolidity.address, 0, { from: user2 });
      await stbl.approve(interactionSolidity.address, stblAmount, { from: user2 });

      const balanceCPBefore = await stbl.balanceOf(capitalPool.address);
      const balanceUBefore = await stbl.balanceOf(user2);

      await interactionSolidity.earnInterest(policyBook3.address, liquidityAmount, { from: user2 });

      assert.equal(
        toBN(await policyBook3.totalLiquidity()).toString(),
        toBN(initialDeposit).plus(liquidityAmount).toString()
      );
      assert.equal(toBN(await policyBook3.balanceOf(user2)).toString(), toBN(liquidityAmount).toString());

      assert.equal(
        toBN(await stbl.balanceOf(capitalPool.address)).toString(),
        toBN(balanceCPBefore).plus(stblAmount).toString()
      );
      assert.equal(toBN(await stbl.balanceOf(user2)).toString(), toBN(balanceUBefore).minus(stblAmount).toString());
    });
  });
});
