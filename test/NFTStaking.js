const ContractsRegistry = artifacts.require("ContractsRegistry");
const NFTStaking = artifacts.require("NFTStaking");
const BMIMock = artifacts.require("BMIMock");
const BMIStaking = artifacts.require("BMIStaking");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");
const LiquidityMiningStakingETH = artifacts.require("LiquidityMiningStakingETH");
const LiquidityMiningStakingUSDT = artifacts.require("LiquidityMiningStakingUSDT");
const LpBmiEthMock = artifacts.require("LpBmiEthMock");
const LpBmiUsdtMock = artifacts.require("LpBmiUsdtMock");
const SushiswapMock = artifacts.require("SushiswapMock");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");

const { assert } = require("chai");

function toBN(number) {
  return new BigNumber(number);
}

const PRECISION = toBN(10).pow(25);

const PLATINUM_NFT_ID = 1;
const GOLD_NFT_ID = 2;
const SLIVER_NFT_ID = 3;
const BRONZ_NFT_ID = 4;

const SILVER_NFT_BOOST = toBN(20).times(PRECISION);
const BRONZE_NFT_BOOST = toBN(10).times(PRECISION);
const NFTRewards = [PLATINUM_NFT_ID, PLATINUM_NFT_ID, GOLD_NFT_ID, SLIVER_NFT_ID, BRONZ_NFT_ID];

contract("NFTStaking", async (accounts) => {
  const reverter = new Reverter(web3);

  let contractsRegistry;
  let nftStaking;
  let staking;
  let stakingUSDT;
  let bmiUtilityNFT;
  let stakingToken;
  let sushiswapMock;

  const OWNER = accounts[0];
  const USER1 = accounts[1];
  const USER2 = accounts[2];

  const NOTHING = accounts[9];

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();

    const _bmi = await BMIMock.new(USER1);
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();
    const _liquidityMiningStakingETH = await LiquidityMiningStakingETH.new();
    const _liquidityMiningStakingUSDT = await LiquidityMiningStakingUSDT.new();
    const _rewardStaking = await BMIStaking.new();
    stakingToken = await LpBmiEthMock.new("", "");
    stakingTokenUSDT = await LpBmiUsdtMock.new("", "");

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), _bmi.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_BMI_TO_ETH_PAIR_NAME(), stakingToken.address);
    await contractsRegistry.addContract(await contractsRegistry.AMM_BMI_TO_USDT_PAIR_NAME(), stakingTokenUSDT.address);

    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(),
      _policyBookRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.NFT_STAKING_NAME(), _nftStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), _bmiUtilityNFT.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(),
      _liquidityMiningStakingETH.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(),
      _liquidityMiningStakingUSDT.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_STAKING_NAME(), _rewardStaking.address);

    sushiswapMock = await SushiswapMock.new(await contractsRegistry.getLiquidityMiningStakingETHContract());
    await contractsRegistry.addContract(
      await contractsRegistry.SUSHI_SWAP_MASTER_CHEF_V2_NAME(),
      sushiswapMock.address
    );

    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    staking = await LiquidityMiningStakingETH.at(await contractsRegistry.getLiquidityMiningStakingETHContract());
    stakingUSDT = await LiquidityMiningStakingUSDT.at(await contractsRegistry.getLiquidityMiningStakingUSDTContract());
    bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());

    await nftStaking.__NFTStaking_init();
    await staking.__LiquidityMiningStakingETH_init();
    await stakingUSDT.__LiquidityMiningStakingUSDT_init();
    await bmiUtilityNFT.__BMIUtilityNFT_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_UTILITY_NFT_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("lockNFT", async () => {
    beforeEach("setup", async () => {
      await bmiUtilityNFT.mintNFTs(USER1, NFTRewards, [1, 1, 1, 1, 1]);
      await bmiUtilityNFT.setApprovalForAll(nftStaking.address, true, { from: USER1 });
      result = await bmiUtilityNFT.balanceOfBatch([USER1, USER1, USER1, USER1, USER1], NFTRewards);
      assert.deepEqual(
        result.map((balance) => balance.toString()),
        ["2", "2", "1", "1", "1"]
      );
    });

    it("should lock NFT", async () => {
      await nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 });

      assert.equal(toBN(await bmiUtilityNFT.balanceOf(USER1, PLATINUM_NFT_ID)).toString(), 1);
      assert.equal(toBN(await bmiUtilityNFT.balanceOf(nftStaking.address, PLATINUM_NFT_ID)).toString(), 1);
    });

    it("shouldn't lock the same NFT", async () => {
      await nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 });

      assert.equal(toBN(await bmiUtilityNFT.balanceOf(USER1, PLATINUM_NFT_ID)).toString(), 1);
      assert.equal(toBN(await bmiUtilityNFT.balanceOf(nftStaking.address, PLATINUM_NFT_ID)).toString(), 1);

      await truffleAssert.reverts(nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 }), "NFTS: Same NFT");
    });

    it("should lock different NFTs", async () => {
      await nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 });

      assert.equal(toBN(await bmiUtilityNFT.balanceOf(USER1, PLATINUM_NFT_ID)).toString(), 1);
      assert.equal(toBN(await bmiUtilityNFT.balanceOf(nftStaking.address, PLATINUM_NFT_ID)).toString(), 1);

      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: USER1 });

      assert.equal(toBN(await bmiUtilityNFT.balanceOf(USER1, BRONZ_NFT_ID)).toString(), 0);
      assert.equal(toBN(await bmiUtilityNFT.balanceOf(nftStaking.address, BRONZ_NFT_ID)).toString(), 1);
    });

    it("should set LMStaking reward multiplier even if didn't stake lptoken", async () => {
      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), BRONZE_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("0"));

      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: USER1 });
      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), SILVER_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("0"));
    });

    it("should set LMStaking reward multiplier 20% in both LMS ETH and USDT if lock sliver NFT", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("100"), USER1, { from: USER1 });

      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), SILVER_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("120"));

      assert.equal(toBN(await stakingUSDT.stakerRewardMultiplier(USER1)).toString(), SILVER_NFT_BOOST.toString());
      assert.equal(toBN(await stakingUSDT.totalStaked()).toString(), web3.utils.toWei("0"));
    });

    it("should set LMStaking reward multiplier eqaul 10% in both LMS ETH and USDT if lock bronze NFT", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("100"), USER1, { from: USER1 });

      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), BRONZE_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("110"));

      assert.equal(toBN(await stakingUSDT.stakerRewardMultiplier(USER1)).toString(), BRONZE_NFT_BOOST.toString());
      assert.equal(toBN(await stakingUSDT.totalStaked()).toString(), web3.utils.toWei("0"));
    });

    it("shouldn't set LMStaking reward multiplier if lock platinum or gold NFT", async () => {
      await nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 });
      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), 0);

      await nftStaking.lockNFT(GOLD_NFT_ID, { from: USER1 });
      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), 0);
    });

    it("should update LMStaking reward multiplier 20% if lock bronze NFT then silver", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("100"), USER1, { from: USER1 });

      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), BRONZE_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("110"));

      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), SILVER_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("120"));
    });

    it("should keep LMStaking reward multiplier 20% if lock silver NFT then bronze", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("100"), USER1, { from: USER1 });

      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), SILVER_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("120"));

      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), SILVER_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("120"));
    });
  });

  describe("unlockNFT", async () => {
    beforeEach("setup", async () => {
      // setup user1
      await bmiUtilityNFT.mintNFTs(USER1, NFTRewards, [1, 1, 1, 1, 1]);
      await bmiUtilityNFT.setApprovalForAll(nftStaking.address, true, { from: USER1 });
      await nftStaking.enableLockingNFTs(false, { from: OWNER });
    });

    it("should unlock NFT if enabledlockingNFTs disabled", async () => {
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: USER1 });

      assert.equal(await nftStaking.enabledlockingNFTs(), false);

      await nftStaking.unlockNFT(SLIVER_NFT_ID, { from: USER1 });

      assert.equal(toBN(await bmiUtilityNFT.balanceOf(USER1, SLIVER_NFT_ID)).toString(), 1);
      assert.equal(toBN(await bmiUtilityNFT.balanceOf(nftStaking.address, SLIVER_NFT_ID)).toString(), 0);
    });

    it("shouldn't unlock NFT if didn't lock", async () => {
      await truffleAssert.reverts(nftStaking.unlockNFT(PLATINUM_NFT_ID, { from: USER2 }), "NFTS: No NFT locked");
    });

    it("shouldn't unlock NFT if enabledlockingNFTs enabled", async () => {
      await nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 });

      await nftStaking.enableLockingNFTs(true, { from: OWNER });
      assert.equal(await nftStaking.enabledlockingNFTs(), true);

      await truffleAssert.reverts(nftStaking.unlockNFT(PLATINUM_NFT_ID, { from: USER1 }), "NFTS: Not allowed");
    });

    it("should update LMStaking reward multiplier to 0 if unlock NFT", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("100"), USER1, { from: USER1 });
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: USER1 });
      await nftStaking.unlockNFT(SLIVER_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), 0);
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("100"));

      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: USER1 });
      await nftStaking.unlockNFT(BRONZ_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), 0);
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("100"));
    });

    it("shouldn't update LMStaking reward multiplier if unlock platinum or gold NFT", async () => {
      await nftStaking.lockNFT(PLATINUM_NFT_ID, { from: USER1 });
      await nftStaking.unlockNFT(PLATINUM_NFT_ID, { from: USER1 });
      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), 0);

      await nftStaking.lockNFT(GOLD_NFT_ID, { from: USER1 });
      await nftStaking.unlockNFT(GOLD_NFT_ID, { from: USER1 });
      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), 0);
    });

    it("should update LMStaking reward multiplier 10% if unlock silver NFT and has bronze", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("100"), USER1, { from: USER1 });
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: USER1 });
      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: USER1 });
      await nftStaking.unlockNFT(SLIVER_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), BRONZE_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("110"));
    });

    it("should keep LMStaking reward multiplier 20% if unlock bronze NFT and has silver", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("100"), USER1, { from: USER1 });
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: USER1 });
      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: USER1 });
      await nftStaking.unlockNFT(BRONZ_NFT_ID, { from: USER1 });

      assert.equal(toBN(await staking.stakerRewardMultiplier(USER1)).toString(), SILVER_NFT_BOOST.toString());
      assert.equal(toBN(await staking.totalStaked()).toString(), web3.utils.toWei("120"));
    });
  });

  describe("enableLockingNFTs", async () => {
    it("should change enabledlockingNFTs state", async () => {
      await nftStaking.enableLockingNFTs(false, { from: OWNER });
      assert.equal(await nftStaking.enabledlockingNFTs(), false);
    });

    it("shouldn't change enabledlockingNFTs state sender not owner", async () => {
      await truffleAssert.reverts(
        nftStaking.enableLockingNFTs(false, { from: USER1 }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("getUserReductionMultiplier", async () => {
    it("shouldn't get reduction multiplier if sender not policy book", async () => {
      await truffleAssert.reverts(nftStaking.getUserReductionMultiplier(USER1, { from: USER1 }), "NFTS: No access");
    });
  });
});
