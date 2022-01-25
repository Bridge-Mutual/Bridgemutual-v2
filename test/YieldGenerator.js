const ContractsRegistry = artifacts.require("ContractsRegistry");
const CapitalPool = artifacts.require("CapitalPoolMock");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const YieldGenerator = artifacts.require("YieldGeneratorMock");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");

const STBLMock = artifacts.require("STBLMock");
const DefiProtocolMock = artifacts.require("DefiProtocolMock");

const Reverter = require("./helpers/reverter");

const BigNumber = require("bignumber.js");

const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

const { ethers } = require("ethers");
const yieldGeneratorContract = require("../build/contracts/YieldGenerator.json");

function toBN(number) {
  return new BigNumber(number);
}

const PRECISION = toBN(10).pow(25);

const wei = web3.utils.toWei;

const stblAmount = wei("10000", "mwei");

contract("YieldGenerator", async (accounts) => {
  const reverter = new Reverter(web3);

  const fake = accounts[0];

  let contractsRegistry;
  let capitalPool;
  let userLeveragePool;
  let reinsurancePool;
  let stblMock;
  let yieldGenerator;

  let aaveProtocolMock;
  let compoundProtocolMock;
  let yearnProtocolMock;

  const defiProtocols = {
    AAVE: 0,
    COMPOUND: 1,
    YEARN: 2,
  };

  // check current allocation, rebalance weight and deposited amount for defi protocols
  const assertDefiProtcolsInfo = async (
    protcolIndex,
    targetAllocation,
    currentAllocation,
    rebalanceWeight,
    depositedAmount,
    whitelisted,
    threshold
  ) => {
    const defiProtocol = await yieldGenerator.defiProtocol(protcolIndex);
    if (targetAllocation) assert.equal(defiProtocol[0], targetAllocation > 0 ? targetAllocation.toNumber() : 0);
    if (currentAllocation) assert.equal(defiProtocol[1], currentAllocation > 0 ? currentAllocation.toNumber() : 0);
    if (rebalanceWeight) assert.equal(defiProtocol[2], rebalanceWeight);
    if (depositedAmount) assert.equal(defiProtocol[3], depositedAmount);
    if (whitelisted) assert.equal(defiProtocol[4], whitelisted);
    if (threshold) assert.equal(defiProtocol[5], threshold);
  };

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    stblMock = await STBLMock.new("mockSTBL", "MSTBL", 6);

    const _capitalPool = await CapitalPool.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _yieldGenerator = await YieldGenerator.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblMock.address);

    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.REWARDS_GENERATOR_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.CLAIMING_REGISTRY_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_REGISTRY_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_ADMIN_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.SHIELD_MINING_NAME(), fake);

    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    aaveProtocolMock = await DefiProtocolMock.new(
      await contractsRegistry.getYieldGeneratorContract(),
      stblMock.address
    );
    compoundProtocolMock = await DefiProtocolMock.new(
      await contractsRegistry.getYieldGeneratorContract(),
      stblMock.address
    );
    yearnProtocolMock = await DefiProtocolMock.new(
      await contractsRegistry.getYieldGeneratorContract(),
      stblMock.address
    );

    await contractsRegistry.addContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), aaveProtocolMock.address);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_PROTOCOL_NAME(), compoundProtocolMock.address);
    await contractsRegistry.addContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), yearnProtocolMock.address);

    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await yieldGenerator.__YieldGenerator_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.YIELD_GENERATOR_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  const eventFilter = async (contractAddress, eventName) => {
    const iface = new ethers.utils.Interface(yieldGeneratorContract.abi);
    let _provider = new ethers.providers.JsonRpcProvider(web3.currentProvider.host);
    const logs = await _provider.getLogs({
      address: contractAddress,
    });

    const decodedEvents = logs.map((log) => {
      if (web3.utils.sha3(eventName) == log.topics[0]) return iface.decodeEventLog(eventName, log.data, log.topics);
    });

    return decodedEvents;
  };

  async function setProtocolSettings(arr1, arr2, arr3) {
    const nb1 = toBN(arr2[0]).times(PRECISION);
    const nb2 = toBN(arr2[1]).times(PRECISION);
    const nb3 = toBN(arr2[2]).times(PRECISION);
    await yieldGenerator.setProtocolSettings(arr1, [nb1, nb2, nb3], arr3);
  }

  describe("deposit into one protocol", async () => {
    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount);
    });

    it("deposit small amount - check protocols info", async () => {
      await setProtocolSettings([true, true, true], [40, 40, 20], [true, true, true]);
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      await assertDefiProtcolsInfo(
        defiProtocols.AAVE,
        null,
        toBN(10).times(PRECISION),
        wei("4000", "mwei"),
        depositAmount,
        null,
        null
      );
      await assertDefiProtcolsInfo(defiProtocols.COMPOUND, null, 0, wei("4000", "mwei"), 0, null, null);
      await assertDefiProtcolsInfo(defiProtocols.YEARN, null, 0, wei("2000", "mwei"), 0), null, null;
    });

    it("deposit small amount - largest positive weight & threshold is met", async () => {
      await setProtocolSettings([true, true, true], [40, 40, 20], [true, true, true]);
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), depositAmount);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), depositAmount);
    });

    it("deposit small amount - largest positive weight & threshold is met & test another protocol", async () => {
      await setProtocolSettings([true, true, true], [20, 30, 50], [true, true, true]);
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), depositAmount);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), depositAmount);
    });

    it("deposit small amount - largest positive weight & threshold is met & whitelisted check", async () => {
      await setProtocolSettings([true, true, false], [20, 30, 50], [true, true, true]);
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), depositAmount);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), depositAmount);
    });

    it("deposit small amount - largest positive weight & check threshold priority than weight", async () => {
      await setProtocolSettings([true, true, true], [40, 40, 20], [false, false, true]);
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), depositAmount);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), depositAmount);
    });

    it("can't deposit small amount - largest positive weight & threshold isn't met", async () => {
      await setProtocolSettings([true, true, true], [40, 40, 20], [false, false, false]);
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), 0);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), 0);
    });

    it("can't deposit small amount - largest positive weight & whitelisted checked", async () => {
      await setProtocolSettings([false, false, false], [40, 40, 20], [true, true, true]);
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), 0);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), 0);
    });

    it("deposit small amount twice- largest positive weight & threshold is met", async () => {
      await setProtocolSettings([true, true, true], [40, 40, 20], [true, true, true]);
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), depositAmount);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), depositAmount);

      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), depositAmount);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), 2 * depositAmount);
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), depositAmount);
    });

    it("should emit valid event", async () => {
      await setProtocolSettings([true, true, true], [40, 40, 20], [true, true, true]);
      const depositAmount = wei("1000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      const tx = await capitalPool.deposit(depositAmount);

      const decodedEvents = await eventFilter(yieldGenerator.address, "DefiDeposited(uint256,uint256,uint256)");
      assert.equal(decodedEvents[0].protocolIndex, defiProtocols.AAVE);
      assert.equal(decodedEvents[0].amount.toString(), depositAmount);
      assert.equal(decodedEvents[0].depositedPercentage.toString(), toBN(100).times(PRECISION).toNumber());
    });
  });

  describe("deposit into multiple protocol", async () => {
    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount);
    });

    it("deposit large amount - check protocols info", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      await assertDefiProtcolsInfo(
        defiProtocols.AAVE,
        null,
        toBN(31.25).times(PRECISION),
        wei("5000", "mwei"),
        wei("3125", "mwei"),
        null,
        null
      );
      await assertDefiProtcolsInfo(
        defiProtocols.COMPOUND,
        null,
        toBN(18.75).times(PRECISION),
        wei("3000", "mwei"),
        wei("1875", "mwei"),
        null,
        null
      );
      await assertDefiProtcolsInfo(defiProtocols.YEARN, null, 0, wei("2000", "mwei"), 0, null, null);
    });

    it("deposit large amount - largest positive weight & threshold is met", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("3125", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("1875", "mwei"));
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), 0);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("3125", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("1875", "mwei"));
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), 0);
    });

    it("deposit large amount - largest positive weight & threshold is met & test different protocols", async () => {
      await setProtocolSettings([true, true, true], [20, 30, 50], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("3125", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("1875", "mwei"));
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), 0);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("3125", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("1875", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), 0);
    });

    it("deposit large amount - largest positive weight & threshold is met & whitelisted check", async () => {
      await setProtocolSettings([true, false, true], [20, 30, 50], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("5000", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), 0);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("5000", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), 0);
    });

    it("deposit large amount - largest positive weight & check threshold priority than weight", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [false, false, true]);
      const depositAmount = wei("5000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("5000", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), 0);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("5000", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), 0);
    });

    it("can't deposit large amount - largest positive weight & threshold isn't met", async () => {
      await setProtocolSettings([true, true, true], [40, 40, 20], [false, false, false]);
      const depositAmount = wei("5000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), 0);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), 0);
    });

    it("can't deposit large amount - largest positive weight & whitelisted check", async () => {
      await setProtocolSettings([false, false, false], [40, 40, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), 0);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), 0);
    });

    it("deposit large amount twice- largest positive weight & threshold is met", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("3125", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("1875", "mwei"));
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), 0);

      await assertDefiProtcolsInfo(
        defiProtocols.AAVE,
        null,
        toBN(31.25).times(PRECISION),
        wei("5000", "mwei"),
        wei("3125", "mwei"),
        null,
        null
      );
      await assertDefiProtcolsInfo(
        defiProtocols.COMPOUND,
        null,
        toBN(18.75).times(PRECISION),
        wei("3000", "mwei"),
        wei("1875", "mwei"),
        null,
        null
      );
      await assertDefiProtcolsInfo(defiProtocols.YEARN, null, 0, wei("2000", "mwei"), 0, null, null);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("3125", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("1875", "mwei"));
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), 0);

      await capitalPool.deposit(depositAmount);

      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("5544.354838", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("1875.000000", "mwei"));
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("2580.645161", "mwei"));

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("5544.354838", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("1875.000000", "mwei"));
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("2580.645161", "mwei"));
    });

    it("deposit large amount into all protocols - largest positive weight & threshold is met", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [true, true, true]);
      const depositAmount = wei("10000", "mwei");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("5000", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("3000", "mwei"));
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("2000", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), depositAmount);
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("5000", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("3000", "mwei"));
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("2000", "mwei"));
    });
  });

  describe("withdraw from one protocol", async () => {
    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount);
    });

    it("withdraw small amount - check protocols info", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      await assertDefiProtcolsInfo(
        defiProtocols.AAVE,
        null,
        toBN(55.44354838).times(PRECISION),
        wei("544.354838", "mwei"),
        wei("5544.354838", "mwei"),
        null,
        null
      );
    });

    it("withdraw small amount - smallest negative weight", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("5544.354838", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("8999.999999", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("5544.354838", "mwei"));
    });

    it("can withdraw small amount - is not whitelisted", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);

      await setProtocolSettings([false, true, true], [50, 30, 20], [true, true, true]);

      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("5544.354838", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("8999.999999", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("5544.354838", "mwei"));
    });

    it("withdraw small amount - smallest negative weight & test another protocol", async () => {
      await setProtocolSettings([true, true, true], [30, 50, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("5544.354838", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("8999.999999", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("5544.354838", "mwei"));
    });

    it("withdraw small amount twice- smallest positive weight", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("5544.354838", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("8999.999999", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("5544.354838", "mwei"));

      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("1875.000000", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("7999.999999", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("1875.000000", "mwei"));
    });

    it("should emit valid event", async () => {
      await setProtocolSettings([true, true, true], [60, 20, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);

      const tx = await capitalPool.withdraw(withdrawAmount);

      const decodedEvents = await eventFilter(yieldGenerator.address, "DefiWithdrawn(uint256,uint256,uint256)");
      assert.equal(decodedEvents[0].protocolIndex, defiProtocols.AAVE);
      assert.equal(decodedEvents[0].amount.toString(), withdrawAmount);
      assert.equal(decodedEvents[0].withdrawPercentage.toString(), toBN(100).times(PRECISION).toNumber());
    });
  });

  describe("withdraw from multiple protocols", async () => {
    beforeEach("setup", async () => {
      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount);
    });

    it("withdraw large amount - check protocols info", async () => {
      await setProtocolSettings([true, true, true], [60, 20, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("5000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      await assertDefiProtcolsInfo(
        defiProtocols.AAVE,
        null,
        toBN(37.5).times(PRECISION),
        wei("397.058823", "mwei"),
        wei("3750", "mwei"),
        null,
        null
      );

      await assertDefiProtcolsInfo(defiProtocols.COMPOUND, null, 0, wei("352.941176", "mwei"), 0, null, null);

      await assertDefiProtcolsInfo(defiProtocols.YEARN, null, 0, 0, 0, null, null);
    });

    it("withdraw large amount - smallest negative weight", async () => {
      await setProtocolSettings([true, true, true], [60, 20, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("5000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("3750.000000", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("1250.000000", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("5000", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("3750.000000", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("1250.000000", "mwei"));
    });

    it("withdraw small amount - smallest negative weight - test min weight1", async () => {
      await setProtocolSettings([true, true, true], [60, 20, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);

      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("3750.000000", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("250.000000", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("4000", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("3750.000000", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("250.000000", "mwei"));
    });

    it("withdraw large amount - smallest negative weight - test min weight2", async () => {
      await setProtocolSettings([true, true, true], [60, 20, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("1000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);
      await capitalPool.withdraw(withdrawAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("4397.058823", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("1352.941176", "mwei"));
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("1250.000000", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("6999.999999", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("4397.058823", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("1352.941176", "mwei"));
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("1250.000000", "mwei"));
    });

    it("withdraw large amount - smallest negative weight & test another protocols", async () => {
      await setProtocolSettings([true, true, true], [20, 60, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("5000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("3750", "mwei"));
      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("1250", "mwei"));
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), 0);

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("5000", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("3750", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("1250", "mwei"));
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), 0);
    });

    it("can withdraw large amount - smallest negative weight - is not whitelisted", async () => {
      await setProtocolSettings([true, true, true], [60, 20, 20], [true, true, true]);
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("5000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);

      await setProtocolSettings([true, true, true], [60, 20, 20], [true, true, true]);

      await capitalPool.withdraw(withdrawAmount);

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("3750", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("1250.000000", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("5000", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("3750", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), 0);
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("1250.000000", "mwei"));
    });

    it("withdraw large amount twice- smallest positive weight", async () => {
      await setProtocolSettings([true, true, true], [50, 30, 20], [true, true, true]);
      //await yieldGenerator.setvStblVolume(wei("20000", "mwei"));
      const depositAmount = wei("5000", "mwei");
      const withdrawAmount = wei("5000", "mwei");

      await stblMock.mintArbitrary(capitalPool.address, 2 * depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(wei("2500", "mwei"));

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("5544.354838", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("1875.000000", "mwei"));
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("80.645161", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("7499.999999", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("5544.354838", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("1875.000000", "mwei"));
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("80.645161", "mwei"));

      await capitalPool.withdraw(wei("1000", "mwei"));

      assert.equal((await stblMock.balanceOf(aaveProtocolMock.address)).toString(), wei("4544.354838", "mwei"));
      assert.equal((await stblMock.balanceOf(compoundProtocolMock.address)).toString(), wei("1875.000000", "mwei"));
      assert.equal((await stblMock.balanceOf(yearnProtocolMock.address)).toString(), wei("80.645161", "mwei"));

      assert.equal(toBN(await yieldGenerator.totalDeposit()).toString(), wei("6499.999999", "mwei"));
      assert.equal(toBN(await aaveProtocolMock.totalDeposit()).toString(), wei("4544.354838", "mwei"));
      assert.equal(toBN(await compoundProtocolMock.totalDeposit()).toString(), wei("1875.000000", "mwei"));
      assert.equal(toBN(await yearnProtocolMock.totalDeposit()).toString(), wei("80.645161", "mwei"));
    });
  });

  describe("setProtocolSettings", async () => {
    it("check updated protocols info", async () => {
      await setProtocolSettings([true, false, false], [60, 20, 20], [false, false, true]);
      await assertDefiProtcolsInfo(defiProtocols.AAVE, toBN(60).times(PRECISION), null, null, null, true, false);
      await assertDefiProtcolsInfo(defiProtocols.COMPOUND, toBN(20).times(PRECISION), null, null, null, false, false);
      await assertDefiProtcolsInfo(defiProtocols.YEARN, toBN(20).times(PRECISION), null, null, null, false, true);
    });

    it("check input length", async () => {
      await truffleAssert.reverts(
        yieldGenerator.setProtocolSettings(
          [true, false, true, true],
          [40, 20, 20],
          [false, false, true, true, true, true]
        ),
        "YG: Invlaid arr length"
      );
    });
  });
});
