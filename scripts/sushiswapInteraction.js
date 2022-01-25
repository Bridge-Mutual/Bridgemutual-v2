// this script run the some of uint tests of AbstractLiquidityMiningStaking but there are two differents
// first is the script should run in forked mainnet with unloced addresses, add this to ganache-cli
// --unlock 0x19B3Eb3Af5D93b77a5619b047De0EED7115A19e7 0xd7e871D14d4f525025056Fe0e3252AF52574Dc89

// first address of the owner of MCV2 in order to update an existed pool with our deployed address as a reward contract
// second address is a user has amount of lp token (which I used it on this test) deposited in that pool
// in order to deposit and withdraw on behave of this user, so may be the test will fail of that user doesn;t
// have that amunt and in that case we should find another user has an amount of lp token which has
// a pool created in MCV2

// second is instead of use a mockup contract of sushi which is a simulate of Master Cheif v2 contract,
// the script point to the deployed sushi MCV2 contract to simulate the actaul functions of sushi
// (deposit, withdaw,harvest, withdrawAndHarvest, emergencyWithdraw) which will call our contract function onSushiReward
// in order to track the staking and distribute our rewards in top of sushi token reward

// the script should run separately from other uint tests

const ContractsRegistry = artifacts.require("ContractsRegistry");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const BMIMock = artifacts.require("BMIMock");
const LpBmiEthMock = artifacts.require("LpBmiEthMock");
const BMIStaking = artifacts.require("BMIStaking");
const StkBMIToken = artifacts.require("STKBMIToken");
const LiquidityMiningMock = artifacts.require("LiquidityMiningMock");
const IMiniChefV2 = artifacts.require("IMiniChefV2");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const IERC20 = artifacts.require("IERC20");

const Reverter = require("../test/helpers/reverter");
const BigNumber = require("bignumber.js");

const setCurrentTime = require("../test/helpers/ganacheTimeTraveler");
const { assert } = require("chai");

const BN = web3.utils.BN;
const wei = web3.utils.toWei;

function toBN(number) {
  return new BigNumber(number);
}

function toWeiBN(value) {
  if (typeof value === "number") value = value.toString();
  return new BN(wei(value));
}

contract("AbstractLiquidityMiningStaking", async (accounts) => {
  const reverter = new Reverter(web3);

  const FIRST_ADDRESS = accounts[1];

  const NOTHING = accounts[9];

  const MCV2_OWNER_ADDRESS = "0x19B3Eb3Af5D93b77a5619b047De0EED7115A19e7";
  const LP_OWNER_ADDRESS = "0xd7e871D14d4f525025056Fe0e3252AF52574Dc89";
  const LP_TOKEN_ADDRESS = "0x15e86e6f65ef7ea1dbb72a5e51a07926fb1c82e3";
  const MASTER_CHEF_V2_ADDRESS = "0xef0881ec094552b2e128cf945ef17a6752b4ec5d";
  const SUSHI_TOKEN_ADDRESS = "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2";

  const SUSHISWAP_POOL_ID = 11;

  let staking;
  let stakingUSDT;
  let stakingToken;
  let rewardToken;
  let rewardStaking;
  let rewardStakingToken;
  let liquidityMiningMock;
  let nftStaking;
  let sushiswapMock;
  let sushiToken;

  before("setup", async () => {
    const contractsRegistry = await ContractsRegistry.new();
    rewardToken = await BMIMock.new(NOTHING);
    const _rewardStaking = await BMIStaking.new();
    const _rewardStakingToken = await StkBMIToken.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _liquidityMiningMock = await LiquidityMiningMock.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();

    stakingToken = await LpBmiEthMock.at(LP_TOKEN_ADDRESS);
    sushiswapMock = await IMiniChefV2.at(MASTER_CHEF_V2_ADDRESS);
    sushiToken = await IERC20.at(SUSHI_TOKEN_ADDRESS);

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.LEGACY_BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.VBMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.SUSHISWAP_BMI_TO_ETH_PAIR_NAME(), stakingToken.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), rewardToken.address);
    await contractsRegistry.addContract(
      await contractsRegistry.SUSHI_SWAP_MASTER_CHEF_V2_NAME(),
      sushiswapMock.address
    );

    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_STAKING_NAME(), _rewardStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), _rewardStakingToken.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(),
      _stakingMock.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(),
      _stakingMock.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_NAME(),
      _liquidityMiningMock.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.NFT_STAKING_NAME(), _nftStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), _bmiUtilityNFT.address);

    rewardStaking = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());
    rewardStakingToken = await StkBMIToken.at(await contractsRegistry.getSTKBMIContract());
    staking = await LiquidityMiningStakingMock.at(await contractsRegistry.getLiquidityMiningStakingETHContract());
    stakingUSDT = await LiquidityMiningStakingMock.at(await contractsRegistry.getLiquidityMiningStakingUSDTContract());
    liquidityMiningMock = await LiquidityMiningMock.at(await contractsRegistry.getLiquidityMiningContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());

    await rewardStaking.__BMIStaking_init("0");
    await rewardStakingToken.__STKBMIToken_init();
    await staking.__LiquidityMiningStakingETH_init();
    await stakingUSDT.__LiquidityMiningStakingETH_init();
    await liquidityMiningMock.__LiquidityMining_init();
    await nftStaking.__NFTStaking_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_UTILITY_NFT_NAME());

    await liquidityMiningMock.setStartTime(1);

    await setCurrentTime(200 * 24 * 60 * 60);

    await rewardToken.mintArbitrary(staking.address, wei("10000"));

    await sushiswapMock.set(
      SUSHISWAP_POOL_ID,
      50,
      await contractsRegistry.getLiquidityMiningStakingETHContract(),
      true,
      {
        from: MCV2_OWNER_ADDRESS,
      }
    );

    await stakingToken.approve(sushiswapMock.address, wei("1000"), { from: LP_OWNER_ADDRESS });

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  const getCurrentBlock = async () => (await web3.eth.getBlock("latest")).number;

  const lpTokenBalance = async (address) => {
    return await stakingToken.balanceOf(address);
  };

  const sushipTokenBalance = async (address) => {
    return await sushiToken.balanceOf(address);
  };

  describe("stakeInSushiswap", async () => {
    beforeEach("setup", async () => {
      await sushiswapMock.emergencyWithdraw(SUSHISWAP_POOL_ID, LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await staking.setRewards(wei("100"), await getCurrentBlock(), 100);
    });

    it("should trasfer staked tokens", async () => {
      const userBalanceBefore = await lpTokenBalance(LP_OWNER_ADDRESS);
      const sushiswapMockBalanceBefore = await lpTokenBalance(sushiswapMock.address);

      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("50"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("50"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });

      assert.equal((await staking.rewards(LP_OWNER_ADDRESS)).toString(), wei("80"));
      assert.equal((await staking.totalStaked()).toString(), wei("100"));
      assert.equal((await staking.staked(LP_OWNER_ADDRESS)).toString(), wei("100"));

      assert.equal((await lpTokenBalance(LP_OWNER_ADDRESS)).toString(), userBalanceBefore.sub(toWeiBN(100)).toString());
      assert.equal(
        (await lpTokenBalance(sushiswapMock.address)).toString(),
        sushiswapMockBalanceBefore.add(toWeiBN(100)).toString()
      );
    });

    it("check user info at sushiswap", async () => {
      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("50"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      const userInfo = await sushiswapMock.userInfo(SUSHISWAP_POOL_ID, LP_OWNER_ADDRESS);

      assert.equal(userInfo[0].toString(), wei("50"));
    });
  });

  describe("widthdrawFromSushiswap", async () => {
    beforeEach("setup", async () => {
      await sushiswapMock.emergencyWithdraw(SUSHISWAP_POOL_ID, LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await staking.setRewards(wei("100"), await getCurrentBlock(), 100);
    });

    it("should trasfer staked tokens", async () => {
      const userBalanceBefore = await lpTokenBalance(LP_OWNER_ADDRESS);
      const sushiswapMockBalanceBefore = await lpTokenBalance(sushiswapMock.address);

      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("100"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await sushiswapMock.withdraw(SUSHISWAP_POOL_ID, wei("30"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), wei("70"));
      assert.equal((await staking.staked(LP_OWNER_ADDRESS)).toString(), wei("70"));

      assert.equal((await lpTokenBalance(LP_OWNER_ADDRESS)).toString(), userBalanceBefore.sub(toWeiBN(70)).toString());
      assert.equal(
        (await lpTokenBalance(sushiswapMock.address)).toString(),
        sushiswapMockBalanceBefore.add(toWeiBN(70)).toString()
      );
    });
  });

  describe("emergencyWidthdrawFromSushiswap", async () => {
    beforeEach("setup", async () => {
      await sushiswapMock.emergencyWithdraw(SUSHISWAP_POOL_ID, LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await staking.setRewards(wei("100"), await getCurrentBlock(), 100);
    });

    it("should trasfer staked tokens", async () => {
      const userBalanceBefore = await lpTokenBalance(LP_OWNER_ADDRESS);
      const sushiswapMockBalanceBefore = await lpTokenBalance(sushiswapMock.address);

      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("100"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await sushiswapMock.emergencyWithdraw(SUSHISWAP_POOL_ID, LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), 0);
      assert.equal((await staking.staked(LP_OWNER_ADDRESS)).toString(), 0);

      assert.equal((await lpTokenBalance(LP_OWNER_ADDRESS)).toString(), userBalanceBefore.toString());
      assert.equal((await lpTokenBalance(sushiswapMock.address)).toString(), sushiswapMockBalanceBefore.toString());
    });
  });

  describe("harvestInSushiswap", async () => {
    beforeEach("setup", async () => {
      await sushiswapMock.emergencyWithdraw(SUSHISWAP_POOL_ID, LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await staking.setRewards(wei("100"), (await getCurrentBlock()) + 2, 100);
      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("100"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
    });

    it("should transfer reward tokens with sushi token", async () => {
      const userSushiBalanceBefore = await sushipTokenBalance(LP_OWNER_ADDRESS);

      await sushiswapMock.harvest(SUSHISWAP_POOL_ID, LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });

      assert((await sushiToken.balanceOf(LP_OWNER_ADDRESS)).toString() > userSushiBalanceBefore.toString());

      assert.equal((await rewardToken.balanceOf(LP_OWNER_ADDRESS)).toString(), wei("80"));
      assert.equal((await rewardToken.balanceOf(staking.address)).toString(), wei("9900"));
      assert.equal((await staking.rewardTokensLocked()).toString(), wei("9900"));
    });
  });

  describe("withdrawAndHarvestInSushiswap", async () => {
    beforeEach("setup", async () => {
      await sushiswapMock.emergencyWithdraw(SUSHISWAP_POOL_ID, LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await staking.setRewards(wei("100"), (await getCurrentBlock()) + 2, 100);
    });

    it("should transfer tokens and reward tokens with sushi tokens", async () => {
      const userBalanceBefore = await lpTokenBalance(LP_OWNER_ADDRESS);
      const sushiswapMockBalanceBefore = await lpTokenBalance(sushiswapMock.address);
      const userSushiBalanceBefore = await sushipTokenBalance(LP_OWNER_ADDRESS);

      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("100"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await sushiswapMock.withdrawAndHarvest(SUSHISWAP_POOL_ID, wei("30"), LP_OWNER_ADDRESS, {
        from: LP_OWNER_ADDRESS,
      });

      assert((await sushiToken.balanceOf(LP_OWNER_ADDRESS)).toString() > userSushiBalanceBefore.toString());

      assert.equal((await lpTokenBalance(LP_OWNER_ADDRESS)).toString(), userBalanceBefore.sub(toWeiBN(70)).toString());
      assert.equal(
        (await lpTokenBalance(sushiswapMock.address)).toString(),
        sushiswapMockBalanceBefore.add(toWeiBN(70)).toString()
      );

      assert.equal((await rewardToken.balanceOf(LP_OWNER_ADDRESS)).toString(), wei("80"));
      assert.equal((await rewardToken.balanceOf(staking.address)).toString(), wei("9900"));
      assert.equal((await staking.rewardTokensLocked()).toString(), wei("9900"));
    });
  });

  describe("harvestByRecipient", async () => {
    beforeEach("setup", async () => {
      await sushiswapMock.emergencyWithdraw(SUSHISWAP_POOL_ID, LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });
      await staking.setRewards(wei("100"), await getCurrentBlock(), 100);
    });

    it("withdrawAndHarvest and should rewards earned by the recipient", async () => {
      const userSushiBalanceBefore = await sushipTokenBalance(FIRST_ADDRESS);
      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("100"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });

      await sushiswapMock.withdrawAndHarvest(SUSHISWAP_POOL_ID, wei("30"), FIRST_ADDRESS, { from: LP_OWNER_ADDRESS });

      assert.equal((await staking.rewards(LP_OWNER_ADDRESS)).toString(), 0);

      assert.equal((await staking.totalStaked()).toString(), wei("70"));
      assert.equal((await staking.staked(LP_OWNER_ADDRESS)).toString(), wei("70"));

      assert.equal((await staking.staked(FIRST_ADDRESS)).toString(), 0);
      assert.equal((await rewardToken.balanceOf(FIRST_ADDRESS)).toString(), wei("80"));
      assert((await sushiToken.balanceOf(FIRST_ADDRESS)).toString() > userSushiBalanceBefore.toString());
    });

    it("withdrawAndHarvest and should lp staked and rewards earned by the recipient", async () => {
      const userSushiBalanceBefore = await sushipTokenBalance(FIRST_ADDRESS);
      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("100"), FIRST_ADDRESS, { from: LP_OWNER_ADDRESS });

      await sushiswapMock.withdrawAndHarvest(SUSHISWAP_POOL_ID, wei("30"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.rewards(FIRST_ADDRESS)).toString(), 0);

      assert.equal((await staking.totalStaked()).toString(), wei("70"));
      assert.equal((await staking.staked(LP_OWNER_ADDRESS)).toString(), 0);
      assert.equal((await staking.staked(FIRST_ADDRESS)).toString(), wei("70"));
      assert.equal((await rewardToken.balanceOf(FIRST_ADDRESS)).toString(), wei("80"));
      assert((await sushiToken.balanceOf(FIRST_ADDRESS)).toString() > userSushiBalanceBefore.toString());
    });

    it("harvest and should rewards earned by the recipient", async () => {
      const userSushiBalanceBefore = await sushipTokenBalance(FIRST_ADDRESS);
      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("100"), LP_OWNER_ADDRESS, { from: LP_OWNER_ADDRESS });

      await sushiswapMock.harvest(SUSHISWAP_POOL_ID, FIRST_ADDRESS, { from: LP_OWNER_ADDRESS });

      assert.equal((await staking.rewards(LP_OWNER_ADDRESS)).toString(), 0);

      assert.equal((await rewardToken.balanceOf(FIRST_ADDRESS)).toString(), wei("80"));
      assert((await sushiToken.balanceOf(FIRST_ADDRESS)).toString() > userSushiBalanceBefore.toString());
    });

    it("harvest and should lp staked and rewards earned by the recipient", async () => {
      const userSushiBalanceBefore = await sushipTokenBalance(FIRST_ADDRESS);
      await sushiswapMock.deposit(SUSHISWAP_POOL_ID, wei("100"), FIRST_ADDRESS, { from: LP_OWNER_ADDRESS });

      await sushiswapMock.harvest(SUSHISWAP_POOL_ID, FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.rewards(FIRST_ADDRESS)).toString(), 0);
      assert.equal((await rewardToken.balanceOf(FIRST_ADDRESS)).toString(), wei("80"));
      assert((await sushiToken.balanceOf(FIRST_ADDRESS)).toString() > userSushiBalanceBefore.toString());
    });
  });
});
