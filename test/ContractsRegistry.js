const RewardsGenerator = artifacts.require("RewardsGenerator");
const RewardsGeneratorMock = artifacts.require("RewardsGeneratorMock");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const Proxy = artifacts.require("TransparentUpgradeableProxy");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const { assert } = require("chai");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const Reverter = require("./helpers/reverter");
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

function toBN(number) {
  return new BigNumber(number);
}

contract("ContractsRegistry", async (accounts) => {
  const reverter = new Reverter(web3);

  const PROXY_ADMIN = accounts[1];
  const NOTHING = accounts[9];

  let rewardsGenerator;

  let contractsRegistry;

  let network;

  before("setup", async () => {
    network = await getNetwork();
    const contractsRegistryImpl = await ContractsRegistry.new();
    const proxy = await Proxy.new(contractsRegistryImpl.address, PROXY_ADMIN, []);
    if (network == Networks.ETH) {
      stbl = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stbl = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }
    const _rewardsGenerator = await RewardsGenerator.new();

    contractsRegistry = await ContractsRegistry.at(proxy.address);

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.PRICE_FEED_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stbl.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGenerator.address
    );

    rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());

    await rewardsGenerator.__RewardsGenerator_init(network);
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("upgrade", async () => {
    it("should upgrade correctly", async () => {
      const rewardsGeneratorMock = await RewardsGeneratorMock.new();

      await contractsRegistry.upgradeContract(
        await contractsRegistry.REWARDS_GENERATOR_NAME(),
        rewardsGeneratorMock.address
      );

      rewardsGenerator = await RewardsGeneratorMock.at(await contractsRegistry.getRewardsGeneratorContract());

      await rewardsGenerator.getStake(0);

      assert.equal(
        await contractsRegistry.getImplementation.call(await contractsRegistry.REWARDS_GENERATOR_NAME()),
        rewardsGeneratorMock.address
      );
    });

    it("should upgrade and call correctly", async () => {
      const rewardsGeneratorMock = await RewardsGeneratorMock.new();

      await contractsRegistry.upgradeContractAndCall(
        await contractsRegistry.REWARDS_GENERATOR_NAME(),
        rewardsGeneratorMock.address,
        "callOnUpgrade()"
      );

      rewardsGenerator = await RewardsGeneratorMock.at(await contractsRegistry.getRewardsGeneratorContract());

      assert.equal(toBN(await rewardsGenerator.dummy()).toString(), "1337");
    });
  });

  describe("injectDependencies", async () => {
    const BMI_STBL_STAKING = accounts[6];
    const RANDOM = accounts[7];

    it("should inject dependencies correctly", async () => {
      await truffleAssert.reverts(
        rewardsGenerator.stake(RANDOM, 0, 1, { from: BMI_STBL_STAKING }),
        "RewardsGenerator: Caller is not a BMICoverStaking contract"
      );

      await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), BMI_STBL_STAKING);

      await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());

      await rewardsGenerator.stake(RANDOM, 0, 1, { from: BMI_STBL_STAKING });
    });
  });
});
