const RewardsGeneratorMock = artifacts.require("RewardsGeneratorMock");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WrappedTokenMock");
const BMICoverStaking = artifacts.require("BMICoverStaking");
const BMICoverStakingView = artifacts.require("BMICoverStakingView");
const BMIStaking = artifacts.require("BMIStaking");
const PriceFeed = artifacts.require("PriceFeed");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");

const { assert } = require("chai");
const BigNumber = require("bignumber.js");
const { advanceBlockAtTime } = require("./helpers/ganacheTimeTraveler");
const Reverter = require("./helpers/reverter");
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

const wei = web3.utils.toWei;

contract("RewardsGenerator", async (accounts) => {
  const reverter = new Reverter(web3);

  const LEGACY_REWARDS_GENERATOR = accounts[2];
  const BMI_STAKING = accounts[3];
  const BMI_STBL_STAKING = accounts[4];
  const POLICY_BOOK1 = accounts[5];
  const POLICY_BOOK2 = accounts[6];
  const POLICY_BOOK3 = accounts[7];
  const POLICY_BOOK_FABRIC = accounts[8];
  const POLICY_BOOK_FACADE = accounts[9];

  const NOTHING = accounts[9];

  const REWARDS_PRECISION = toBN(10).pow(5);
  const APY_PRECISION = toBN(10).pow(5);
  const PRECISION = toBN(10).pow(25);
  const PERCENTAGE_100 = toBN(10).pow(27);

  let stblMock;
  let bmiMock;
  let rewardsGenerator;
  let bmiCoverStaking;
  let priceFeed;
  let bmiPriceInUSDT;

  let network;

  before("setup", async () => {
    network = await getNetwork();
    const mockInsuranceContractAddress1 = "0x0000000000000000000000000000000000000001";
    const mockInsuranceContractAddress2 = "0x0000000000000000000000000000000000000002";
    const mockInsuranceContractAddress3 = "0x0000000000000000000000000000000000000003";

    const contractsRegistry = await ContractsRegistry.new();
    const wethMock = await WETHMock.new("weth", "weth");
    bmiMock = await BMIMock.new(accounts[0]);
    if (network == Networks.ETH) {
      stblMock = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stblMock = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }
    const sushiswapRouterMock = await SushiswapRouterMock.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _rewardsGeneratorMock = await RewardsGeneratorMock.new();
    const _priceFeed = await PriceFeed.new();
    const _bmiCoverStaking = await BMICoverStaking.new();
    const _bmiCoverStakingView = await BMICoverStakingView.new();
    const _bmiStaking = await BMIStaking.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmiMock.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), BMI_STBL_STAKING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_ADMIN_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), wethMock.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblMock.address);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_FABRIC_NAME(), POLICY_BOOK_FABRIC);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), BMI_STAKING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), sushiswapRouterMock.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.BMI_COVER_STAKING_VIEW_NAME(),
      _bmiCoverStakingView.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), _priceFeed.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.REWARDS_GENERATOR_NAME(),
      _rewardsGeneratorMock.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(),
      _policyBookRegistry.address
    );

    const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
    rewardsGenerator = await RewardsGeneratorMock.at(await contractsRegistry.getRewardsGeneratorContract());
    priceFeed = await PriceFeed.at(await contractsRegistry.getPriceFeedContract());
    // we test it against EHT block per days as it doesn't matter the difference in blocks per day for other chain
    await rewardsGenerator.__RewardsGenerator_init(Networks.ETH);

    await contractsRegistry.injectDependencies(await contractsRegistry.PRICE_FEED_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REWARDS_GENERATOR_NAME());

    await policyBookRegistry.add(
      mockInsuranceContractAddress1,
      ContractType.CONTRACT,
      POLICY_BOOK1,
      POLICY_BOOK_FACADE,
      {
        from: POLICY_BOOK_FABRIC,
      }
    );

    await policyBookRegistry.add(
      mockInsuranceContractAddress2,
      ContractType.CONTRACT,
      POLICY_BOOK2,
      POLICY_BOOK_FACADE,
      {
        from: POLICY_BOOK_FABRIC,
      }
    );

    await policyBookRegistry.add(
      mockInsuranceContractAddress3,
      ContractType.STABLECOIN,
      POLICY_BOOK3,
      POLICY_BOOK_FACADE,
      {
        from: POLICY_BOOK_FABRIC,
      }
    );

    if (network == Networks.ETH || network == Networks.POL) {
      await sushiswapRouterMock.setReserve(stblMock.address, wei(toBN(10 ** 3).toString()));
    } else if (network == Networks.BSC) {
      await sushiswapRouterMock.setReserve(stblMock.address, wei(toBN(10 ** 15).toString()));
    }

    await sushiswapRouterMock.setReserve(wethMock.address, wei(toBN(10 ** 15).toString()));
    await sushiswapRouterMock.setReserve(bmiMock.address, wei(toBN(10 ** 15).toString()));

    await rewardsGenerator.setRewardPerBlock(wei("100"));
    await rewardsGenerator.setPolicyBookStableRatio(PRECISION.times(50)); // 50%
    bmiPriceInUSDT = (await priceFeed.howManyUSDTsInBMI(wei("1"))).toString();
    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("util functions", async () => {
    //disabled becuase of multichain integration
    it.skip("should send funds to BMIStaking", async () => {
      assert.equal(await bmiMock.balanceOf(BMI_STAKING), 0);

      await bmiMock.transfer(rewardsGenerator.address, wei("10000"));

      await rewardsGenerator.sendFundsToBMIStaking(wei("1000"));

      assert.equal(toBN(await bmiMock.balanceOf(BMI_STAKING)).toString(), toBN(wei("1000")).toString());
    });

    it("should send funds to BMICoverStaking", async () => {
      assert.equal(await bmiMock.balanceOf(BMI_STBL_STAKING), 0);

      await bmiMock.transfer(rewardsGenerator.address, wei("10000"));

      await rewardsGenerator.sendFundsToBMICoverStaking(wei("1000"));

      assert.equal(toBN(await bmiMock.balanceOf(BMI_STBL_STAKING)).toString(), toBN(wei("1000")).toString());
    });

    it("should set new reward", async () => {
      assert.equal(toBN(await rewardsGenerator.rewardPerBlock()).toString(), toBN(wei("100")).toString());

      await rewardsGenerator.setRewardPerBlock(wei("10"));

      assert.equal(toBN(await rewardsGenerator.rewardPerBlock()).toString(), toBN(wei("10")).toString());
    });

    it("should correctly update policybooks (rewardPerBlock)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardPerBlock(POLICY_BOOK1))
          .idiv(PRECISION)
          .toString(),
        toBN(wei("100")).toString()
      );

      await rewardsGenerator.setRewardPerBlock(wei("10"));

      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardPerBlock(POLICY_BOOK1))
          .idiv(PRECISION)
          .toString(),
        toBN(wei("10")).toString()
      );
    });

    it("should correctly update policybooks (rewardPerBlock) when one is STABLECOIN", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK3, true, { from: POLICY_BOOK3 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("2000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK3, 2, wei("1000"), { from: BMI_STBL_STAKING });

      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardPerBlock(POLICY_BOOK1))
          .idiv(PRECISION)
          .toString(),
        toBN(wei("80")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardPerBlock(POLICY_BOOK3))
          .idiv(PRECISION)
          .toString(),
        toBN(wei("20")).toString()
      );

      await rewardsGenerator.setRewardPerBlock(wei("10"));

      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardPerBlock(POLICY_BOOK1))
          .idiv(PRECISION)
          .toString(),
        toBN(wei("8")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardPerBlock(POLICY_BOOK3))
          .idiv(PRECISION)
          .toString(),
        toBN(wei("2")).toString()
      );
    });

    it("should set new factor", async () => {
      assert.equal(toBN(await rewardsGenerator.policyBookStableRatio()).toString(), PRECISION.times(50).toString());

      await rewardsGenerator.setPolicyBookStableRatio(PRECISION.times(25));

      assert.equal(toBN(await rewardsGenerator.policyBookStableRatio()).toString(), PRECISION.times(25).toString());
    });

    it("should correctly update policybooks (rewardMultiplier)", async () => {
      await rewardsGenerator.updatePolicyBookShare(4 * REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(4 * REWARDS_PRECISION, POLICY_BOOK3, true, { from: POLICY_BOOK3 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK3, 2, wei("1000"), { from: BMI_STBL_STAKING });

      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardMultiplier(POLICY_BOOK1, { from: POLICY_BOOK1 })).toString(),
        toBN(REWARDS_PRECISION).times(4).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardMultiplier(POLICY_BOOK3, { from: POLICY_BOOK3 })).toString(),
        toBN(REWARDS_PRECISION).times(2).toString()
      );

      await rewardsGenerator.setPolicyBookStableRatio(PRECISION.times(25));

      await rewardsGenerator.updatePolicyBookShare(4 * REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(4 * REWARDS_PRECISION, POLICY_BOOK3, true, { from: POLICY_BOOK3 });

      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardMultiplier(POLICY_BOOK1, { from: POLICY_BOOK1 })).toString(),
        toBN(REWARDS_PRECISION).times(4).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardMultiplier(POLICY_BOOK3, { from: POLICY_BOOK3 })).toString(),
        toBN(REWARDS_PRECISION).toString()
      );
    });
  });

  describe("stake & withdraw", async () => {
    it("should successfully calculate stake average (1)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      const info = await rewardsGenerator.getStake(1);

      assert.equal(info.lastCumulativeSum, 0);
      assert.equal(info.cumulativeReward, 0);
      assert.equal(toBN(info.stakeAmount).toString(), toBN(wei("1000")).toString());
    });

    it("should successfully calculate stake average (2)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      const info = await rewardsGenerator.getStake(2);

      assert.equal(toBN(info.lastCumulativeSum).div(PERCENTAGE_100).toString(), "1");
    });

    it("should successfully calculate stake average (3)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 3, wei("1000"), { from: BMI_STBL_STAKING });

      const info = await rewardsGenerator.getStake(3);

      assert.equal(toBN(info.lastCumulativeSum).div(PERCENTAGE_100).toString(), "1.5");
    });

    it("should successfully calculate correct withdrawal amount (1)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      const reward = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);

      assert.equal(toBN(reward).toString(), toBN(wei("1000")).toString());
    });

    it("should successfully calculate correct withdrawal amount (2)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      const stakeAmount = (await rewardsGenerator.getPolicyBookReward(POLICY_BOOK1)).stakeAmount;

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 3, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      const reward = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 2);

      assert.equal((await rewardsGenerator.getPolicyBookReward(POLICY_BOOK1)).stakeAmount, stakeAmount);

      assert.equal(
        toBN((await rewardsGenerator.getPolicyBookReward(POLICY_BOOK1)).cumulativeReward)
          .div(PERCENTAGE_100)
          .dp(5)
          .toString(),
        "1.5"
      );

      assert.closeTo(toBN(reward).toNumber(), toBN(wei("833.33333333")).toNumber(), toBN(wei("0.00001")).toNumber());
    });

    it("should successfully calculate correct withdrawal amount (3)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 3, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.withdrawFunds(POLICY_BOOK1, 2, { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      const reward = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);

      assert.closeTo(
        toBN(reward).toNumber(),
        toBN(wei("2333.3333333333")).toNumber(),
        toBN(wei("0.000001")).toNumber()
      );
    });

    it("should successfully calculate correct withdrawal amount (4)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      let reward = toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1));
      await rewardsGenerator.withdrawFunds(POLICY_BOOK1, 1, { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      reward = reward.plus(toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)));

      assert.equal(reward.toString(), toBN(wei("1900")).toString());
    });

    it("should successfully calculate correct withdrawal amount (5)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      const reward1 = toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1));
      const reward2 = toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 2));

      assert.equal(reward1.plus(reward2).toString(), toBN(wei("2000")).toString());
      assert.equal(reward1.toString(), toBN(wei("1500")).toString());

      await rewardsGenerator.withdrawFunds(POLICY_BOOK1, 1, { from: BMI_STBL_STAKING });
      await rewardsGenerator.withdrawFunds(POLICY_BOOK1, 2, { from: BMI_STBL_STAKING });
    });

    it("should successfully calculate correct withdrawal amount (6)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      let reward1 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);
      let reward2 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2);

      assert.equal(toBN(reward1).toString(), toBN(wei("500")).toString());
      assert.equal(toBN(reward2).toString(), toBN(wei("600")).toString());

      await rewardsGenerator.setRewardPerBlock(wei("1")); // still 100 BMI reward on this block

      await advanceBlocks(10);

      reward1 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);
      reward2 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2);

      assert.equal(toBN(reward1).toString(), toBN(wei("555")).toString());
      assert.equal(toBN(reward2).toString(), toBN(wei("655")).toString());
    });
  });

  describe("withdraw rewards", async () => {
    it("should withdraw rewards", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      let reward = toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1));

      await rewardsGenerator.withdrawReward(POLICY_BOOK1, 1, { from: BMI_STBL_STAKING });

      assert.equal(reward.toString(), toBN(wei("1000")).toString());

      const pbInfo = await rewardsGenerator.getPolicyBookReward(POLICY_BOOK1);

      assert.equal(toBN(await pbInfo.totalStaked).toString(), toBN(wei("1000")).toString());
    });

    it("should withdraw rewards twice", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      let reward = toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1));

      await rewardsGenerator.withdrawReward(POLICY_BOOK1, 1, { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      reward = reward.plus(toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)));

      await rewardsGenerator.withdrawReward(POLICY_BOOK1, 1, { from: BMI_STBL_STAKING });

      assert.closeTo(reward.toNumber(), toBN(wei("2000")).toNumber(), toBN(wei("0.000001")).toNumber());
    });

    it("should withdraw rewards and stake smoothly", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      await rewardsGenerator.withdrawReward(POLICY_BOOK1, 1, { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      const pbInfo = await rewardsGenerator.getPolicyBookReward(POLICY_BOOK1);

      assert.equal(toBN(await pbInfo.totalStaked).toString(), toBN(wei("2000")).toString());
    });
  });

  describe("policybook APY", async () => {
    it("should calculate correct APY (1)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("10"), { from: BMI_STBL_STAKING });
      console.log(bmiPriceInUSDT);

      const APY = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK1, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );

      assert.equal(APY.div(APY_PRECISION).toString(), "2140227272.72727");
    });

    it("should calculate correct APY (2)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("10"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("99990"), { from: BMI_STBL_STAKING });

      const APY = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK1, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );

      assert.equal(APY.div(APY_PRECISION).dp(4).toString(), "235422.6458");
    });

    it("should calculate correct APY (3)", async () => {
      await rewardsGenerator.setRewardPerBlock(wei("3"));

      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("99000"), { from: BMI_STBL_STAKING });

      const APY1 = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK1, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );
      const APY2 = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK2, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );

      assert.equal(APY1.div(APY_PRECISION).dp(4).toString(), "7062.6794");
      assert.equal(APY2.div(APY_PRECISION).dp(4).toString(), "7062.6794");
    });

    it("should calculate correct APY (4)", async () => {
      await rewardsGenerator.setRewardPerBlock(wei("3"));

      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("10"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });

      const APY1 = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK1, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );
      const APY2 = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK2, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );

      assert.equal(APY1.div(APY_PRECISION).dp(4).toString(), "698590.5045");
      assert.equal(APY2.div(APY_PRECISION).dp(4).toString(), "698590.5045");
    });

    it("should calculate correct APY (5)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      const APY = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK1, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );

      // empty PB, but what if I stake 1 token
      assert.equal(APY.div(APY_PRECISION).toString(), "23542500000");
    });

    it("should calculate correct APY (6)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("10"), { from: BMI_STBL_STAKING });

      await rewardsGenerator.setRewardPerBlock(0);

      const APY = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK1, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );

      assert.equal(APY.toString(), "0");
    });

    it("should calculate correct APY (7)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK3, true, { from: POLICY_BOOK3 });

      await rewardsGenerator.stake(POLICY_BOOK3, 1, wei("10"), { from: BMI_STBL_STAKING });

      assert.equal(
        toBN(await rewardsGenerator.getPolicyBookRewardMultiplier(POLICY_BOOK3, { from: POLICY_BOOK3 })).toString(),
        toBN(REWARDS_PRECISION).div(2).toString()
      );

      const APY = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK3, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );

      assert.equal(APY.div(APY_PRECISION).toString(), toBN("2140227272.72727").toString()); // 100% APY
    });

    it("should calculate correct APY (8)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK3, true, { from: POLICY_BOOK3 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("2000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK3, 2, wei("1000"), { from: BMI_STBL_STAKING });

      const APY1 = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK1, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );
      const APY3 = toBN(
        await rewardsGenerator.getPolicyBookAPY(POLICY_BOOK3, toBN(bmiPriceInUSDT), { from: BMI_STBL_STAKING })
      );

      const policyBookRewardMultiplier1 = (await rewardsGenerator.getPolicyBookReward(POLICY_BOOK1)).rewardMultiplier;
      const policyBookRewardMultiplier3 = (await rewardsGenerator.getPolicyBookReward(POLICY_BOOK3)).rewardMultiplier;

      const APY_TOKEN = toBN(10).pow(18);
      const totalStakedPolicyBook1 = (await rewardsGenerator.getPolicyBookReward(POLICY_BOOK1)).totalStaked;
      const totalStakedPolicyBook3 = (await rewardsGenerator.getPolicyBookReward(POLICY_BOOK3)).totalStaked;

      const rewardPerBlock = await rewardsGenerator.rewardPerBlock();
      const totalPoolStaked = await rewardsGenerator.totalPoolStaked();
      const rewardPerBlockPolicyBook1 = toBN(policyBookRewardMultiplier1)
        .times(totalStakedPolicyBook1)
        .times(rewardPerBlock)
        .div(toBN(totalPoolStaked).plus(toBN(policyBookRewardMultiplier1).times(APY_TOKEN)));
      const rewardPerBlockPolicyBook3 = toBN(policyBookRewardMultiplier3)
        .times(totalStakedPolicyBook3)
        .times(rewardPerBlock)
        .div(toBN(totalPoolStaked).plus(toBN(policyBookRewardMultiplier3).times(APY_TOKEN)));

      const inUSDT1 = await priceFeed.howManyUSDTsInBMI(rewardPerBlockPolicyBook1.dp(0).toString());
      const inUSDT3 = await priceFeed.howManyUSDTsInBMI(rewardPerBlockPolicyBook3.dp(0).toString());
      const rewardPerBlockPolicyBookSTBL1 = toBN(inUSDT1).times(10 ** 12);
      const rewardPerBlockPolicyBookSTBL3 = toBN(inUSDT3).times(10 ** 12);

      const APYcalc1 = toBN(rewardPerBlockPolicyBookSTBL1)
        .times(6450)
        .times(365)
        .times(100)
        .div(totalStakedPolicyBook1);
      const APYcalc3 = toBN(rewardPerBlockPolicyBookSTBL3)
        .times(6450)
        .times(365)
        .times(100)
        .div(totalStakedPolicyBook3);

      assert.equal(APY1.div(APY_PRECISION).dp(4).toString(), "9413234.7061");
      assert.equal(APY3.div(APY_PRECISION).dp(4).toString(), "4707558.4883");
    });
  });

  describe("policybook rewards multiplier", async () => {
    it("should just update a rewards multiplier", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      assert.equal(
        toBN((await rewardsGenerator.getPolicyBookReward(POLICY_BOOK1)).rewardMultiplier).toString(),
        REWARDS_PRECISION.toString()
      );

      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION.times(2), POLICY_BOOK1, false, {
        from: POLICY_BOOK1,
      });

      assert.equal(
        toBN((await rewardsGenerator.getPolicyBookReward(POLICY_BOOK1)).rewardMultiplier).toString(),
        REWARDS_PRECISION.times(2).toString()
      );
    });

    it("should calculate correct reward with new rewards multiplier (1)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      const reward1 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);
      const reward2 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2);

      assert.equal(toBN(reward1).toString(), toBN(wei("500")).toString());
      assert.equal(toBN(reward2).toString(), toBN(wei("600")).toString());
    });

    it("should calculate correct reward with new rewards multiplier (2)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION.times(2), POLICY_BOOK1, false, {
        from: POLICY_BOOK1,
      });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      const reward1 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);
      const reward2 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2);

      assert.closeTo(
        toBN(reward1).toNumber(),
        toBN(wei("666.66666666666")).toNumber(),
        toBN(wei("0.00001")).toNumber()
      );
      assert.closeTo(
        toBN(reward2).toNumber(),
        toBN(wei("433.33333333333")).toNumber(),
        toBN(wei("0.00001")).toNumber()
      );
    });

    it("should calculate correct reward with new rewards multiplier (3)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION.times(2), POLICY_BOOK1, false, {
        from: POLICY_BOOK1,
      });

      await advanceBlocks(10);

      const reward1 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);
      const reward2 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2);

      assert.closeTo(toBN(reward1).toNumber(), toBN(wei("1166.66666")).toNumber(), toBN(wei("0.00001")).toNumber());
      assert.closeTo(toBN(reward2).toNumber(), toBN(wei("933.33333")).toNumber(), toBN(wei("0.00001")).toNumber());
    });

    it("should calculate correct reward with new rewards multiplier (4)", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK3, true, { from: POLICY_BOOK3 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("2000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK3, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION.times(2), POLICY_BOOK3, true, {
        from: POLICY_BOOK3,
      });

      await advanceBlocks(10);

      const reward1 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);
      const reward2 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK3, 2);

      assert.closeTo(toBN(reward1).toNumber(), toBN(wei("1566.66666")).toNumber(), toBN(wei("0.00001")).toNumber());
      assert.closeTo(toBN(reward2).toNumber(), toBN(wei("533.33333")).toNumber(), toBN(wei("0.00001")).toNumber());
    });

    it("the reward should not change when PolicyBook gets blacklisted", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      let reward1 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);
      let reward2 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2);

      assert.equal(toBN(reward1).toString(), toBN(wei("500")).toString());
      assert.equal(toBN(reward2).toString(), toBN(wei("600")).toString());

      // same as blacklisting
      await rewardsGenerator.updatePolicyBookShare(0, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await advanceBlocks(10);

      reward1 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);
      reward2 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2);

      // 550 because one block has elapsed
      assert.closeTo(toBN(reward1).toNumber(), toBN(wei("550")).toNumber(), toBN(wei("0.00001")).toNumber());
      assert.closeTo(toBN(reward2).toNumber(), toBN(wei("1650")).toNumber(), toBN(wei("0.00001")).toNumber());
    });

    it("should correctly track rewards when PolicyBook gets blacklisted and whitelisted again", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });
      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      // same as blacklisting
      await rewardsGenerator.updatePolicyBookShare(0, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await advanceBlocks(10);

      // same as whitelisting
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await advanceBlocks(10);

      const reward1 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1);
      const reward2 = await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2);

      assert.closeTo(toBN(reward1).toNumber(), toBN(wei("1050")).toNumber(), toBN(wei("0.00001")).toNumber());
      assert.closeTo(toBN(reward2).toNumber(), toBN(wei("2250")).toNumber(), toBN(wei("0.00001")).toNumber());
    });
  });

  describe("aggregate", async () => {
    it("should successfully aggregate", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      const reward1 = toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1));
      const reward2 = toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 2));

      assert.equal(reward1.plus(reward2).toString(), toBN(wei("2000")).toString());

      await rewardsGenerator.aggregate(POLICY_BOOK1, [1, 2], 3, { from: BMI_STBL_STAKING });

      const reward3 = toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 3));

      assert.closeTo(reward3.toNumber(), toBN(wei("2099.999999999")).toNumber(), toBN(wei("0.0000001")).toNumber());

      assert.equal((await rewardsGenerator.getStake(1)).stakeAmount, 0);
      assert.equal((await rewardsGenerator.getStake(2)).stakeAmount, 0);
      assert.equal(toBN((await rewardsGenerator.getStake(3)).stakeAmount).toString(), toBN(wei("2000")).toString());
    });

    it("should successfully aggregate already aggregated", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(9);

      await rewardsGenerator.aggregate(POLICY_BOOK1, [1, 2], 3, { from: BMI_STBL_STAKING });

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 3)).toString(),
        toBN(wei("2000")).toString()
      );

      await advanceBlocks(9);

      await rewardsGenerator.stake(POLICY_BOOK1, 4, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(69);

      await rewardsGenerator.aggregate(POLICY_BOOK1, [3, 4], 5, { from: BMI_STBL_STAKING });

      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 5)).toNumber(),
        toBN(wei("9999.9999999999")).toNumber(),
        toBN(wei("0.0000001")).toNumber()
      );
    });
  });

  describe("rewards convergence tests", async () => {
    it("should sustain the rewards", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(50);

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(50);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("7600")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 2)).toString(),
        toBN(wei("2500")).toString()
      );

      await rewardsGenerator.setRewardPerBlock(0);

      await advanceBlocks(1000);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("7650")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 2)).toString(),
        toBN(wei("2550")).toString()
      );
    });

    it("the reward of an oldcomer should not decrease", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(1000);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("100000")).toString()
      );

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(1000);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("150100")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 2)).toString(),
        toBN(wei("50000")).toString()
      );

      await rewardsGenerator.stake(POLICY_BOOK1, 3, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(1000);

      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toNumber(),
        toBN(wei("183483.33333333")).toNumber(),
        toBN(wei("0.00001")).toNumber()
      );
      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 2)).toNumber(),
        toBN(wei("83383.33333333")).toNumber(),
        toBN(wei("0.00001")).toNumber()
      );
      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 3)).toNumber(),
        toBN(wei("33333.33333333")).toNumber(),
        toBN(wei("0.00001")).toNumber()
      );
    });

    it("reward withdrawal should not affect others reward gain speed", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(10);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("1000")).toString()
      );

      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(100);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("6100")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 2)).toString(),
        toBN(wei("5000")).toString()
      );

      await rewardsGenerator.withdrawReward(POLICY_BOOK1, 1, { from: BMI_STBL_STAKING });

      await advanceBlocks(1000);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("50000")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 2)).toString(),
        toBN(wei("55050")).toString()
      );
    });
  });

  describe("extreme tests", async () => {
    it("should calculate correct reward", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.stake(POLICY_BOOK1, 1, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(100);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("10000")).toString()
      );

      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(100);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("15200")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2)).toString(),
        toBN(wei("5000")).toString()
      );

      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION.idiv(2), POLICY_BOOK2, false, {
        from: POLICY_BOOK2,
      });

      await advanceBlocks(100);

      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toNumber(),
        toBN(wei("21916.6666666")).toNumber(),
        toBN(wei("0.0001")).toNumber()
      );
      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2)).toNumber(),
        toBN(wei("8383.33333333")).toNumber(),
        toBN(wei("0.0001")).toNumber()
      );

      await rewardsGenerator.stake(POLICY_BOOK1, 3, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(100);

      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toNumber(),
        toBN(wei("25983.33333333")).toNumber(),
        toBN(wei("0.0001")).toNumber()
      );
      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2)).toNumber(),
        toBN(wei("10416.66666666")).toNumber(),
        toBN(wei("0.0001")).toNumber()
      );
      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 3)).toNumber(),
        toBN(wei("4000")).toNumber(),
        toBN(wei("0.0001")).toNumber()
      );

      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION.times(2), POLICY_BOOK2, false, {
        from: POLICY_BOOK2,
      });

      await advanceBlocks(100);

      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toNumber(),
        toBN(wei("28523.33333333")).toNumber(),
        toBN(wei("0.0001")).toNumber()
      );
      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2)).toNumber(),
        toBN(wei("15436.66666666")).toNumber(),
        toBN(wei("0.0001")).toNumber()
      );
      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 3)).toNumber(),
        toBN(wei("6540")).toNumber(),
        toBN(wei("0.0001")).toNumber()
      );
    });
  });

  describe.skip("migrate", async () => {
    it("rewards should be identical if migrated with 0 rewards", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.migrationStake(POLICY_BOOK1, 1, wei("1000"), 0, { from: LEGACY_REWARDS_GENERATOR });
      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(100);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("5100")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2)).toString(),
        toBN(wei("5000")).toString()
      );
    });

    it("rewards should differ only by the given reward amount", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK2, false, { from: POLICY_BOOK2 });

      await rewardsGenerator.migrationStake(POLICY_BOOK1, 1, wei("1000"), wei("1500"), {
        from: LEGACY_REWARDS_GENERATOR,
      });
      await rewardsGenerator.stake(POLICY_BOOK2, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(100);

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 1)).toString(),
        toBN(wei("6600")).toString()
      );
      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK2, 2)).toString(),
        toBN(wei("5000")).toString()
      );
    });

    it("should aggregate migrated NFT correctly", async () => {
      await rewardsGenerator.updatePolicyBookShare(REWARDS_PRECISION, POLICY_BOOK1, false, { from: POLICY_BOOK1 });

      await rewardsGenerator.migrationStake(POLICY_BOOK1, 1, wei("1000"), wei("1500"), {
        from: LEGACY_REWARDS_GENERATOR,
      });
      await rewardsGenerator.stake(POLICY_BOOK1, 2, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(100);

      await rewardsGenerator.aggregate(POLICY_BOOK1, [1, 2], 3, { from: BMI_STBL_STAKING });

      assert.equal(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 3)).toString(),
        toBN(wei("11700")).toString()
      );

      await rewardsGenerator.stake(POLICY_BOOK1, 4, wei("1000"), { from: BMI_STBL_STAKING });

      await advanceBlocks(100);

      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 3)).toNumber(),
        toBN(wei("18466.66666666")).toNumber(),
        toBN(wei("0.000001")).toNumber()
      );
      assert.closeTo(
        toBN(await rewardsGenerator.getRewardNoCheck(POLICY_BOOK1, 4)).toNumber(),
        toBN(wei("3333.33333333")).toNumber(),
        toBN(wei("0.000001")).toNumber()
      );
    });
  });
});
