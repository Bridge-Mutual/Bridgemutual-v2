const ContractsRegistry = artifacts.require("ContractsRegistry");
const CapitalPool = artifacts.require("CapitalPoolMock");
const UserLeveragePool = artifacts.require("UserLeveragePool");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const YieldGenerator = artifacts.require("YieldGeneratorMock");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");

const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");
const DefiProtocolMock = artifacts.require("DefiProtocolMock");

const Reverter = require("./helpers/reverter");

const BigNumber = require("bignumber.js");

const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

const { ethers } = require("ethers");
const yieldGeneratorContract = require("../build/contracts/YieldGenerator.json");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

function toBN(number) {
  return new BigNumber(number);
}

const PRECISION = toBN(10).pow(25);

const wei = web3.utils.toWei;

let stblAmount;
let depositAmount;
let withdrawAmount;
contract("YieldGenerator", async (accounts) => {
  const reverter = new Reverter(web3);

  const fake = accounts[0];

  let contractsRegistry;
  let capitalPool;
  let userLeveragePool;
  let reinsurancePool;
  let stblMock;
  let yieldGenerator;

  let defiProtocolMock1;
  let defiProtocolMock2;
  let defiProtocolMock3;

  let network;

  const defiProtocols = {
    DEFI1: 0,
    DEFI2: 1,
    DEFI3: 2,
  };

  // check current allocation, rebalance weight and deposited amount for defi protocols
  const assertDefiProtcolsInfo = async (
    protcolIndex,
    targetAllocation,
    currentAllocation,
    rebalanceWeight,
    depositedAmount,
    whitelisted,
    threshold,
    depositCost
  ) => {
    const defiProtocol = await yieldGenerator.defiProtocol(protcolIndex);
    if (targetAllocation)
      assert.equal(defiProtocol._targetAllocation, targetAllocation > 0 ? targetAllocation.toNumber() : 0);
    if (currentAllocation)
      assert.closeTo(
        toBN(defiProtocol._currentAllocation).toNumber(),
        currentAllocation > 0 ? currentAllocation.toNumber() : 0,
        toBN(0.000001)
          .times(10 ** 25)
          .toNumber()
      );
    if (rebalanceWeight)
      assert.closeTo(
        toBN(defiProtocol._rebalanceWeight).toNumber(),
        rebalanceWeight.toNumber(),
        toBN(0.000001)
          .times(10 ** 25)
          .toNumber()
      );
    if (depositedAmount)
      assert.closeTo(
        toBN(defiProtocol._depositedAmount).toNumber(),
        depositedAmount.toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
    if (whitelisted != null) assert.equal(defiProtocol._whiteListed, whitelisted);
    if (threshold != null) assert.equal(defiProtocol._threshold, threshold);
    if (depositCost) assert.equal(defiProtocol._depositCost, depositCost.toString());
  };

  before("setup", async () => {
    network = await getNetwork();

    contractsRegistry = await ContractsRegistry.new();
    if (network == Networks.ETH) {
      stblMock = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stblMock = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }

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

    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_ADMIN_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.SHIELD_MINING_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), fake);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), fake);
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);

    defiProtocolMock1 = await DefiProtocolMock.new(
      await contractsRegistry.getYieldGeneratorContract(),
      await contractsRegistry.getCapitalPoolContract(),
      stblMock.address,
      true
    );
    defiProtocolMock2 = await DefiProtocolMock.new(
      await contractsRegistry.getYieldGeneratorContract(),
      await contractsRegistry.getCapitalPoolContract(),
      stblMock.address,
      true
    );
    defiProtocolMock3 = await DefiProtocolMock.new(
      await contractsRegistry.getYieldGeneratorContract(),
      await contractsRegistry.getCapitalPoolContract(),
      stblMock.address,
      true
    );

    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), defiProtocolMock1.address);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), defiProtocolMock2.address);
    await contractsRegistry.addContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), defiProtocolMock3.address);

    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

    await capitalPool.__CapitalPool_init();
    await reinsurancePool.__ReinsurancePool_init();
    await yieldGenerator.__YieldGenerator_init(network);
    if (network == Networks.BSC || network == Networks.POL) {
      await yieldGenerator.updateProtocolNumbers(3);
    }
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
      stblAmount = getStableAmount("10000");

      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount.toFixed().toString());
    });

    it("deposit small amount - check protocols info", async () => {
      await setProtocolSettings(
        [true, true, true],
        [40, 40, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      await assertDefiProtcolsInfo(
        defiProtocols.DEFI1,
        null,
        toBN(10).times(PRECISION),
        getStableAmount("4000"),
        depositAmount,
        null,
        null,
        getStableAmount("0.001")
      );
      await assertDefiProtcolsInfo(
        defiProtocols.DEFI2,
        null,
        0,
        getStableAmount("4000"),
        0,
        null,
        null,
        getStableAmount("0.001")
      );
      await assertDefiProtcolsInfo(
        defiProtocols.DEFI3,
        null,
        0,
        getStableAmount("2000"),
        0,
        null,
        null,
        getStableAmount("0.001")
      );
    });

    it("deposit small amount - largest positive weight & threshold is met", async () => {
      await setProtocolSettings(
        [true, true, true],
        [40, 40, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock1.address)).toString(),
        depositAmount.toFixed().toString()
      );

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), depositAmount.toFixed().toString());
    });

    it("deposit small amount - largest positive weight & threshold is met & test another protocol", async () => {
      await setProtocolSettings(
        [true, true, true],
        [20, 30, 50],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        depositAmount.toFixed().toString()
      );

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), depositAmount.toFixed().toString());
    });

    it("deposit small amount - largest positive weight & threshold is met & whitelisted check", async () => {
      await setProtocolSettings(
        [true, true, false],
        [20, 30, 50],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        depositAmount.toFixed().toString()
      );

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), depositAmount.toFixed().toString());
    });

    it("deposit small amount - largest positive weight & check threshold priority than weight", async () => {
      await setProtocolSettings(
        [true, true, true],
        [40, 40, 20],
        [getStableAmount("1"), getStableAmount("1"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        depositAmount.toFixed().toString()
      );

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), depositAmount.toFixed().toString());
    });

    it("can't deposit small amount - largest positive weight & threshold isn't met", async () => {
      await setProtocolSettings(
        [true, true, true],
        [40, 40, 20],
        [getStableAmount("1"), getStableAmount("1"), getStableAmount("1")]
      );
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount.toFixed().toString());
      assert.equal((await stblMock.balanceOf(defiProtocolMock1.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock2.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock3.address)).toString(), 0);

      assert.equal((await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), 0);
    });

    it("can't deposit small amount - largest positive weight & whitelisted checked", async () => {
      await setProtocolSettings(
        [false, false, false],
        [40, 40, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount.toFixed().toString());
      assert.equal((await stblMock.balanceOf(defiProtocolMock1.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock2.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock3.address)).toString(), 0);

      assert.equal((await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), 0);
    });

    it("deposit small amount twice- largest positive weight & threshold is met", async () => {
      await setProtocolSettings(
        [true, true, true],
        [40, 40, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount.toFixed().toString());
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock1.address)).toString(),
        depositAmount.toFixed().toString()
      );

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), depositAmount.toFixed().toString());

      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        depositAmount.toFixed().toString()
      );

      assert.equal((await yieldGenerator.totalDeposit()).toString(), toBN(depositAmount).times(2).toFixed().toString());
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), depositAmount.toFixed().toString());
    });

    it("should emit valid event", async () => {
      await setProtocolSettings(
        [true, true, true],
        [40, 40, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("1000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      const tx = await capitalPool.deposit(depositAmount);

      const decodedEvents = await eventFilter(yieldGenerator.address, "DefiDeposited(uint256,uint256,uint256)");
      assert.equal(decodedEvents[0].protocolIndex, defiProtocols.DEFI1);
      assert.equal(decodedEvents[0].amount.toString(), depositAmount.toFixed().toString());
      assert.equal(decodedEvents[0].depositedPercentage.toString(), toBN(100).times(PRECISION).toNumber());
    });
  });

  describe("deposit into multiple protocol", async () => {
    beforeEach("setup", async () => {
      stblAmount = getStableAmount("10000");

      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount.toFixed().toString());
    });

    it("deposit large amount - check protocols info", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      await assertDefiProtcolsInfo(
        defiProtocols.DEFI1,
        null,
        toBN(31.25).times(PRECISION),
        getStableAmount("5000"),
        getStableAmount("3125"),
        null,
        null,
        getStableAmount("0.001")
      );
      await assertDefiProtcolsInfo(
        defiProtocols.DEFI2,
        null,
        toBN(18.75).times(PRECISION),
        getStableAmount("3000"),
        getStableAmount("1875"),
        null,
        null,
        getStableAmount("0.001")
      );
      await assertDefiProtcolsInfo(
        defiProtocols.DEFI3,
        null,
        0,
        getStableAmount("2000"),
        0,
        null,
        null,
        getStableAmount("0.001")
      );
    });

    it("deposit large amount - largest positive weight & threshold is met", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock1.address)).toString(),
        getStableAmount("3125").toFixed().toString()
      );
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        getStableAmount("1875").toFixed().toString()
      );
      assert.equal((await stblMock.balanceOf(defiProtocolMock3.address)).toString(), 0);

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), getStableAmount("3125").toFixed().toString());
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), getStableAmount("1875").toFixed().toString());
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), 0);
    });

    it("deposit large amount - largest positive weight & threshold is met & test different protocols", async () => {
      await setProtocolSettings(
        [true, true, true],
        [20, 30, 50],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        getStableAmount("3125").toFixed().toString()
      );
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        getStableAmount("1875").toFixed().toString()
      );
      assert.equal((await stblMock.balanceOf(defiProtocolMock1.address)).toString(), 0);

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), getStableAmount("3125").toFixed().toString());
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), getStableAmount("1875").toFixed().toString());
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), 0);
    });

    it("deposit large amount - largest positive weight & threshold is met & whitelisted check", async () => {
      await setProtocolSettings(
        [true, false, true],
        [20, 30, 50],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        getStableAmount("5000").toFixed().toString()
      );
      assert.equal((await stblMock.balanceOf(defiProtocolMock2.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock1.address)).toString(), 0);

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), getStableAmount("5000").toFixed().toString());
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), 0);
    });

    it("deposit large amount - largest positive weight & check threshold priority than weight", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("1"), getStableAmount("1"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        getStableAmount("5000").toFixed().toString()
      );
      assert.equal((await stblMock.balanceOf(defiProtocolMock2.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock1.address)).toString(), 0);

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), getStableAmount("5000").toFixed().toString());
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), 0);
    });

    it("can't deposit large amount - largest positive weight & threshold isn't met", async () => {
      await setProtocolSettings(
        [true, true, true],
        [40, 40, 20],
        [getStableAmount("1"), getStableAmount("1"), getStableAmount("1")]
      );
      depositAmount = getStableAmount("5000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount.toFixed().toString());
      assert.equal((await stblMock.balanceOf(defiProtocolMock1.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock2.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock3.address)).toString(), 0);

      assert.equal((await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), 0);
    });

    it("can't deposit large amount - largest positive weight & whitelisted check", async () => {
      await setProtocolSettings(
        [false, false, false],
        [40, 40, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount.toFixed().toString());
      assert.equal((await stblMock.balanceOf(defiProtocolMock1.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock2.address)).toString(), 0);
      assert.equal((await stblMock.balanceOf(defiProtocolMock3.address)).toString(), 0);

      assert.equal((await yieldGenerator.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), 0);
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), 0);
    });

    it("deposit large amount twice- largest positive weight & threshold is met", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), depositAmount.toFixed().toString());
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock1.address)).toString(),
        getStableAmount("3125").toFixed().toString()
      );
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        getStableAmount("1875").toFixed().toString()
      );
      assert.equal((await stblMock.balanceOf(defiProtocolMock3.address)).toString(), 0);

      await assertDefiProtcolsInfo(
        defiProtocols.DEFI1,
        null,
        toBN(31.25).times(PRECISION),
        getStableAmount("5000"),
        getStableAmount("3125"),
        null,
        null,
        getStableAmount("0.001")
      );
      await assertDefiProtcolsInfo(
        defiProtocols.DEFI2,
        null,
        toBN(18.75).times(PRECISION),
        getStableAmount("3000"),
        getStableAmount("1875"),
        null,
        null,
        getStableAmount("0.001")
      );
      await assertDefiProtcolsInfo(
        defiProtocols.DEFI3,
        null,
        0,
        getStableAmount("2000"),
        0,
        null,
        null,
        getStableAmount("0.001")
      );

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), getStableAmount("3125").toFixed().toString());
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), getStableAmount("1875").toFixed().toString());
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), 0);

      await capitalPool.deposit(depositAmount);

      assert.closeTo(
        toBN(await defiProtocolMock1.totalDeposit()).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal(
        (await defiProtocolMock2.totalDeposit()).toString(),
        getStableAmount("1875.000000").toFixed().toString()
      );
      assert.closeTo(
        toBN(await defiProtocolMock3.totalDeposit()).toNumber(),
        toBN(getStableAmount("2580.645161")).toNumber(),
        toBN(getStableAmount("0.000002")).toNumber()
      );

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        getStableAmount("1875.000000").toFixed().toString()
      );
      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock3.address)).toNumber(),
        toBN(getStableAmount("2580.645161")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
    });

    it("deposit large amount into all protocols - largest positive weight & threshold is met", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("10000");
      await stblMock.mintArbitrary(capitalPool.address, depositAmount);
      await capitalPool.deposit(depositAmount);

      assert.equal((await stblMock.balanceOf(capitalPool.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock1.address)).toString(),
        getStableAmount("5000").toFixed().toString()
      );
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        getStableAmount("3000").toFixed().toString()
      );
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        getStableAmount("2000").toFixed().toString()
      );

      assert.equal((await yieldGenerator.totalDeposit()).toString(), depositAmount.toFixed().toString());
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), getStableAmount("5000").toFixed().toString());
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), getStableAmount("3000").toFixed().toString());
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), getStableAmount("2000").toFixed().toString());
    });
  });

  describe("withdraw from one protocol", async () => {
    beforeEach("setup", async () => {
      stblAmount = getStableAmount("10000");

      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount.toFixed().toString());
    });

    it("withdraw small amount - check protocols info", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      await assertDefiProtcolsInfo(
        defiProtocols.DEFI1,
        null,
        toBN(55.44354838).times(PRECISION),
        getStableAmount("544.354838"),
        getStableAmount("5544.354838"),
        null,
        null,
        getStableAmount("0.001")
      );
    });

    it("withdraw small amount - smallest negative weight", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        toBN(getStableAmount("8999.999999")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock1.totalDeposit()).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
    });

    it("can withdraw small amount - is not whitelisted", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);

      await setProtocolSettings(
        [false, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );

      await capitalPool.withdraw(withdrawAmount);

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        toBN(getStableAmount("8999.999999")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock1.totalDeposit()).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
    });

    it("withdraw small amount - smallest negative weight & test another protocol", async () => {
      await setProtocolSettings(
        [true, true, true],
        [30, 50, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock2.address)).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        toBN(getStableAmount("8999.999999")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock2.totalDeposit()).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
    });

    it("withdraw small amount twice- smallest positive weight", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.00001")).toNumber()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        toBN(getStableAmount("8999.999999")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock1.totalDeposit()).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      await capitalPool.withdraw(withdrawAmount);

      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        getStableAmount("1875.000000").toFixed().toString()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        toBN(getStableAmount("7999.999999")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal(
        (await defiProtocolMock2.totalDeposit()).toString(),
        getStableAmount("1875.000000").toFixed().toString()
      );
    });

    it("should emit valid event", async () => {
      await setProtocolSettings(
        [true, true, true],
        [60, 20, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);

      const tx = await capitalPool.withdraw(withdrawAmount);

      const decodedEvents = await eventFilter(yieldGenerator.address, "DefiWithdrawn(uint256,uint256,uint256)");
      assert.equal(decodedEvents[0].protocolIndex, defiProtocols.DEFI1);
      assert.equal(decodedEvents[0].amount.toString(), withdrawAmount.toFixed().toString());
      assert.equal(decodedEvents[0].withdrawPercentage.toString(), toBN(100).times(PRECISION).toNumber());
    });
  });

  describe("withdraw from multiple protocols", async () => {
    beforeEach("setup", async () => {
      stblAmount = getStableAmount("10000");

      await capitalPool.addVirtualUsdtAccumulatedBalance(stblAmount);
      assert.equal((await capitalPool.virtualUsdtAccumulatedBalance()).toString(), stblAmount.toFixed().toString());
    });

    it("withdraw large amount - check protocols info", async () => {
      await setProtocolSettings(
        [true, true, true],
        [60, 20, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("5000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);

      await assertDefiProtcolsInfo(
        defiProtocols.DEFI1,
        null,
        toBN(37.5).times(PRECISION),
        getStableAmount("397.058823"),
        getStableAmount("3750"),
        null,
        null,
        getStableAmount("0.001")
      );

      await assertDefiProtcolsInfo(
        defiProtocols.DEFI2,
        null,
        0,
        getStableAmount("352.941176"),
        0,
        null,
        null,
        getStableAmount("0.001")
      );

      await assertDefiProtcolsInfo(defiProtocols.DEFI3, null, 0, 0, 0, null, null, getStableAmount("0.001"));
    });

    it("withdraw large amount - smallest negative weight", async () => {
      await setProtocolSettings(
        [true, true, true],
        [60, 20, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("5000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);
      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        toBN(getStableAmount("3750.000000")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        getStableAmount("3750.000000").toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal((await stblMock.balanceOf(defiProtocolMock2.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        getStableAmount("1250.000000").toFixed().toString()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        getStableAmount("5000").toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock1.totalDeposit()).toNumber(),
        getStableAmount("3750.000000").toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), 0);
      assert.equal(
        (await defiProtocolMock3.totalDeposit()).toString(),
        getStableAmount("1250.000000").toFixed().toString()
      );
    });

    it("withdraw small amount - smallest negative weight - test min weight1", async () => {
      await setProtocolSettings(
        [true, true, true],
        [60, 20, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);

      await capitalPool.withdraw(withdrawAmount);

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        toBN(getStableAmount("3750.000000")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal((await stblMock.balanceOf(defiProtocolMock2.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        getStableAmount("250.000000").toFixed().toString()
      );

      assert.equal((await yieldGenerator.totalDeposit()).toString(), getStableAmount("4000").toFixed().toString());
      assert.equal(
        (await defiProtocolMock1.totalDeposit()).toString(),
        getStableAmount("3750.000000").toFixed().toString()
      );
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), 0);
      assert.equal(
        (await defiProtocolMock3.totalDeposit()).toString(),
        getStableAmount("250.000000").toFixed().toString()
      );
    });

    it("withdraw large amount - smallest negative weight - test min weight2", async () => {
      await setProtocolSettings(
        [true, true, true],
        [60, 20, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("1000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);
      await capitalPool.withdraw(withdrawAmount);
      await capitalPool.withdraw(withdrawAmount);

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        toBN(getStableAmount("4397.058823")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock2.address)).toNumber(),
        toBN(getStableAmount("1352.941176")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        getStableAmount("1250.000000").toFixed().toString()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        toBN(getStableAmount("6999.999999")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock1.totalDeposit()).toNumber(),
        toBN(getStableAmount("4397.058823")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock2.totalDeposit()).toNumber(),
        toBN(getStableAmount("1352.941176")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal(
        (await defiProtocolMock3.totalDeposit()).toString(),
        getStableAmount("1250.000000").toFixed().toString()
      );
    });

    it("withdraw large amount - smallest negative weight & test another protocols", async () => {
      await setProtocolSettings(
        [true, true, true],
        [20, 60, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("5000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(withdrawAmount);
      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock2.address)).toNumber(),
        toBN(getStableAmount("3750.000000")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock1.address)).toString(),
        getStableAmount("1250").toFixed().toString()
      );
      assert.equal((await stblMock.balanceOf(defiProtocolMock3.address)).toString(), 0);

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        getStableAmount("5000").toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      assert.closeTo(
        toBN(await defiProtocolMock2.totalDeposit()).toNumber(),
        toBN(getStableAmount("3750.000000")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal((await defiProtocolMock1.totalDeposit()).toString(), getStableAmount("1250").toFixed().toString());
      assert.equal((await defiProtocolMock3.totalDeposit()).toString(), 0);
    });

    it("can withdraw large amount - smallest negative weight - is not whitelisted", async () => {
      await setProtocolSettings(
        [true, true, true],
        [60, 20, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("5000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);

      await setProtocolSettings(
        [true, true, true],
        [60, 20, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );

      await capitalPool.withdraw(withdrawAmount);

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        getStableAmount("3750").toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal((await stblMock.balanceOf(defiProtocolMock2.address)).toString(), 0);
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock3.address)).toString(),
        getStableAmount("1250.000000").toFixed().toString()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        getStableAmount("5000").toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock1.totalDeposit()).toNumber(),
        getStableAmount("3750").toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal((await defiProtocolMock2.totalDeposit()).toString(), 0);
      assert.equal(
        (await defiProtocolMock3.totalDeposit()).toString(),
        getStableAmount("1250.000000").toFixed().toString()
      );
    });

    it("withdraw large amount twice- smallest positive weight", async () => {
      await setProtocolSettings(
        [true, true, true],
        [50, 30, 20],
        [getStableAmount("0.001"), getStableAmount("0.001"), getStableAmount("0.001")]
      );
      //await yieldGenerator.setvStblVolume(getStableAmount("20000"));
      depositAmount = getStableAmount("5000");
      withdrawAmount = getStableAmount("5000");

      await stblMock.mintArbitrary(capitalPool.address, toBN(depositAmount).times(2).toFixed());
      await capitalPool.deposit(depositAmount);
      await capitalPool.deposit(depositAmount);
      await capitalPool.withdraw(getStableAmount("2500"));

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        getStableAmount("1875.000000").toFixed().toString()
      );
      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock3.address)).toNumber(),
        toBN(getStableAmount("80.645161")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        toBN(getStableAmount("7499.999999")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock1.totalDeposit()).toNumber(),
        toBN(getStableAmount("5544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal(
        (await defiProtocolMock2.totalDeposit()).toString(),
        getStableAmount("1875.000000").toFixed().toString()
      );
      assert.closeTo(
        toBN(await defiProtocolMock3.totalDeposit()).toNumber(),
        toBN(getStableAmount("80.645161")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      await capitalPool.withdraw(getStableAmount("1000"));

      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock1.address)).toNumber(),
        toBN(getStableAmount("4544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal(
        (await stblMock.balanceOf(defiProtocolMock2.address)).toString(),
        getStableAmount("1875.000000").toFixed().toString()
      );
      assert.closeTo(
        toBN(await stblMock.balanceOf(defiProtocolMock3.address)).toNumber(),
        toBN(getStableAmount("80.645161")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );

      assert.closeTo(
        toBN(await yieldGenerator.totalDeposit()).toNumber(),
        toBN(getStableAmount("6499.999999")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await defiProtocolMock1.totalDeposit()).toNumber(),
        toBN(getStableAmount("4544.354838")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
      assert.equal(
        (await defiProtocolMock2.totalDeposit()).toString(),
        getStableAmount("1875.000000").toFixed().toString()
      );
      assert.closeTo(
        toBN(await defiProtocolMock3.totalDeposit()).toNumber(),
        toBN(getStableAmount("80.645161")).toNumber(),
        toBN(getStableAmount("0.000001")).toNumber()
      );
    });
  });

  describe("setProtocolSettings", async () => {
    it("check updated protocols info", async () => {
      await setProtocolSettings(
        [true, false, false],
        [60, 20, 20],
        [getStableAmount("1"), getStableAmount("1"), getStableAmount("0.001")]
      );
      await assertDefiProtcolsInfo(
        defiProtocols.DEFI1,
        toBN(60).times(PRECISION),
        null,
        null,
        null,
        true,
        false,
        getStableAmount("1")
      );
      await assertDefiProtcolsInfo(
        defiProtocols.DEFI2,
        toBN(20).times(PRECISION),
        null,
        null,
        null,
        false,
        false,
        getStableAmount("1")
      );
      await assertDefiProtcolsInfo(
        defiProtocols.DEFI3,
        toBN(20).times(PRECISION),
        null,
        null,
        null,
        false,
        false,
        getStableAmount("0.001")
      );
    });

    it("check input length", async () => {
      await truffleAssert.reverts(
        yieldGenerator.setProtocolSettings(
          [true, false, true, true],
          [40, 20, 20],
          [
            getStableAmount("1"),
            getStableAmount("1"),
            getStableAmount("0.001"),
            getStableAmount("0.001"),
            getStableAmount("0.001"),
            getStableAmount("0.001"),
          ]
        ),
        "YG: Invlaid arr length"
      );
    });
  });
});
