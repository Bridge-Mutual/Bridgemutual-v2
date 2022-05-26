const ContractsRegistry = artifacts.require("ContractsRegistry");
const LiquidityMiningStakingMock = artifacts.require("LiquidityMiningStakingMock");
const BMIMock = artifacts.require("BMIMock");
const LpBmiEthMock = artifacts.require("LpBmiEthMock");
const BMIStaking = artifacts.require("BMIStaking");
const StkBMIToken = artifacts.require("STKBMIToken");
const SushiswapMock = artifacts.require("SushiswapMock");
const NFTStaking = artifacts.require("NFTStaking");
const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");

const { setCurrentTime, advanceBlockAtTime } = require("./helpers/ganacheTimeTraveler");
const { ethers } = require("ethers");
const stakingContract = require("../build/contracts/AbstractLiquidityMiningStaking.json");

function toBN(number) {
  return new BigNumber(number);
}

contract("AbstractLiquidityMiningStaking", async (accounts) => {
  const reverter = new Reverter(web3);

  const OWNER = accounts[0];
  const FIRST_ADDRESS = accounts[1];
  const SECOND_ADDRESS = accounts[2];
  const THIRD_ADDRESS = accounts[3];

  const NOTHING = accounts[9];

  const APY_PRECISION = toBN(10 ** 5);

  const SLIVER_NFT_ID = 3;
  const BRONZ_NFT_ID = 4;
  const NFTRewards = [SLIVER_NFT_ID, BRONZ_NFT_ID];

  let staking;
  let stakingUSDT;
  let stakingToken;
  let rewardToken;
  let rewardStaking;
  let rewardStakingToken;
  let nftStaking;
  let bmiUtilityNFT;
  let sushiswapMock;

  const mintAndApproveStaked = async (address, amount) => {
    await stakingToken.mintArbitrary(address, amount);
    await stakingToken.approve(staking.address, amount, { from: address });
  };

  const assertEarnedRoundedDownEqual = async (address, expected) => {
    const earnedTokens = web3.utils.fromWei(await staking.earned(address));
    assert.equal(Math.floor(earnedTokens.toString()), expected);
  };

  const eventFilter = async (contractAddress, eventName) => {
    const iface = new ethers.utils.Interface(stakingContract.abi);
    let _provider = new ethers.providers.JsonRpcProvider(web3.currentProvider.host);
    const logs = await _provider.getLogs({
      address: contractAddress,
    });

    const decodedEvents = logs.map((log) => {
      if (web3.utils.sha3(eventName) == log.topics[0]) return iface.decodeEventLog(eventName, log.data, log.topics);
    });

    return decodedEvents;
  };

  before("setup", async () => {
    const contractsRegistry = await ContractsRegistry.new();
    stakingToken = await LpBmiEthMock.new("Sushiswap V2", "Sushiswap V2");
    rewardToken = await BMIMock.new(NOTHING);
    const _rewardStaking = await BMIStaking.new();
    const _rewardStakingToken = await StkBMIToken.new();
    const _stakingMock = await LiquidityMiningStakingMock.new();
    const _nftStaking = await NFTStaking.new();
    const _bmiUtilityNFT = await BMIUtilityNFT.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.STKBMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.AMM_BMI_TO_ETH_PAIR_NAME(), stakingToken.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), rewardToken.address);

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
    await contractsRegistry.addProxyContract(await contractsRegistry.NFT_STAKING_NAME(), _nftStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), _bmiUtilityNFT.address);

    sushiswapMock = await SushiswapMock.new(await contractsRegistry.getLiquidityMiningStakingETHContract());
    await contractsRegistry.addContract(
      await contractsRegistry.SUSHI_SWAP_MASTER_CHEF_V2_NAME(),
      sushiswapMock.address
    );

    rewardStaking = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());
    rewardStakingToken = await StkBMIToken.at(await contractsRegistry.getSTKBMIContract());
    staking = await LiquidityMiningStakingMock.at(await contractsRegistry.getLiquidityMiningStakingETHContract());
    stakingUSDT = await LiquidityMiningStakingMock.at(await contractsRegistry.getLiquidityMiningStakingUSDTContract());
    nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());
    bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());

    await rewardStaking.__BMIStaking_init("0");
    await rewardStakingToken.__STKBMIToken_init();
    await staking.__LiquidityMiningStakingETH_init();
    await stakingUSDT.__LiquidityMiningStakingETH_init();
    await nftStaking.__NFTStaking_init();
    await bmiUtilityNFT.__BMIUtilityNFT_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.NFT_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_UTILITY_NFT_NAME());

    const stakingTokensAmount = web3.utils.toWei("100");

    await setCurrentTime(200 * 24 * 60 * 60);

    await rewardToken.mintArbitrary(staking.address, web3.utils.toWei("10000"));
    await mintAndApproveStaked(FIRST_ADDRESS, stakingTokensAmount);
    await mintAndApproveStaked(SECOND_ADDRESS, stakingTokensAmount);
    await mintAndApproveStaked(THIRD_ADDRESS, stakingTokensAmount);

    await bmiUtilityNFT.mintNFTs(FIRST_ADDRESS, NFTRewards, [10, 10]);
    await bmiUtilityNFT.setApprovalForAll(nftStaking.address, true, { from: FIRST_ADDRESS });

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  const getTransactionBlock = (tx) => tx.receipt.blockNumber;
  const getCurrentBlock = async () => (await web3.eth.getBlock("latest")).number;
  const advanceBlocks = async (amount) => {
    for (let i = 0; i < amount; i++) {
      await advanceBlockAtTime(1);
    }
  };

  describe("setRewards", async () => {
    it("should revert if not owner", async () => {
      await truffleAssert.reverts(
        staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100, { from: FIRST_ADDRESS }),
        "Ownable: caller is not the owner."
      );
    });

    it("should not allow to set more tokens than contract have", async () => {
      const fromBlock = (await getCurrentBlock()) + 2;
      await truffleAssert.reverts(
        staking.setRewards(web3.utils.toWei("101"), fromBlock, 100),
        "LMS: Not enough tokens for the rewards"
      );
    });

    it("should update reward per token before", async () => {
      await staking.setRewards(web3.utils.toWei("10"), await getCurrentBlock(), 100);
      await sushiswapMock.deposit(web3.utils.toWei("100"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      const tx = await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);

      assert.equal((await staking.rewardPerTokenStored()).toString(), web3.utils.toWei("0.1"));
      assert.equal(await staking.lastUpdateBlock(), getTransactionBlock(tx));
    });

    it("should validly calculate tokens locked in a case of a change in the middle", async () => {
      const fromBlock = await getCurrentBlock();
      await staking.setRewards(web3.utils.toWei("100"), fromBlock, 100);
      assert.equal((await staking.rewardTokensLocked()).toString(), web3.utils.toWei("9800"));

      await advanceBlocks(5);
      await staking.setRewards(web3.utils.toWei("50"), fromBlock, 100);
      assert.equal((await staking.rewardTokensLocked()).toString(), web3.utils.toWei("5200"));
    });

    it("should validly calculate tokens locked with change from before to after", async () => {
      const fromBlock = (await getCurrentBlock()) + 2;
      await staking.setRewards(web3.utils.toWei("100"), fromBlock + 20, 100);
      assert.equal((await staking.rewardTokensLocked()).toString(), web3.utils.toWei("10000"));

      await advanceBlocks(5);
      await staking.setRewards(web3.utils.toWei("50"), fromBlock - 5, 3);
      assert.equal((await staking.rewardTokensLocked()).toString(), web3.utils.toWei("0"));
    });

    it("should validly calculate tokens locked with change from after to before", async () => {
      await advanceBlocks(5);
      const fromBlock = (await getCurrentBlock()) + 2;
      await staking.setRewards(web3.utils.toWei("100"), fromBlock - 5, 3);
      assert.equal((await staking.rewardTokensLocked()).toString(), web3.utils.toWei("0"));

      await advanceBlocks(5);
      await staking.setRewards(web3.utils.toWei("50"), fromBlock + 20, 100);
      assert.equal((await staking.rewardTokensLocked()).toString(), web3.utils.toWei("5000"));
    });

    it("should change the underlying fields as expected", async () => {
      const fromBlock = await getCurrentBlock();
      await staking.setRewards(web3.utils.toWei("100"), fromBlock, 100);

      assert.equal((await staking.rewardPerBlock()).toString(), web3.utils.toWei("100").toString());
      assert.equal((await staking.firstBlockWithReward()).toString(), fromBlock);
      assert.equal((await staking.lastBlockWithReward()).toString(), fromBlock + 99);
    });

    it("should emit expected event", async () => {
      const fromBlock = await getCurrentBlock();
      const tx = await staking.setRewards(web3.utils.toWei("100"), fromBlock, 100);

      const event = tx.logs.find((x) => x.event == "RewardsSet").args;
      assert.equal(event.rewardPerBlock.toString(), web3.utils.toWei("100").toString());
      assert.equal(event.firstBlockWithReward.toString(), fromBlock);
      assert.equal(event.lastBlockWithReward.toString(), fromBlock + 99);
    });
  });

  describe("stakeInSushiswap", async () => {
    beforeEach("setup", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
    });

    it("should update user rewards before", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      const tx = await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      const currentBlock = getTransactionBlock(tx);
      assert.equal((await staking.rewards(FIRST_ADDRESS)).toString(), web3.utils.toWei("80"));
      assert.equal((await staking.userRewardPerTokenPaid(FIRST_ADDRESS)).toString(), web3.utils.toWei("2"));
      assert.equal((await staking.rewardPerTokenStored()).toString(), web3.utils.toWei("2"));
      assert.equal(await staking.lastUpdateBlock(), currentBlock);
    });

    it("should accurately change contract state", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("70"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("30"), SECOND_ADDRESS, { from: SECOND_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("100"));
      assert.equal((await staking.staked(FIRST_ADDRESS)).toString(), web3.utils.toWei("70"));
      assert.equal((await staking.staked(SECOND_ADDRESS)).toString(), web3.utils.toWei("30"));
    });

    it("should emit valid event", async () => {
      const tx = await sushiswapMock.deposit(web3.utils.toWei("70"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      const decodedEvents = await eventFilter(staking.address, "Staked(address,uint256)");
      const user = decodedEvents[0].user;
      const amount = decodedEvents[0].amount.toString();
      assert.equal(user, FIRST_ADDRESS);
      assert.equal(amount, web3.utils.toWei("70"));
    });

    it("should increase total staked amount 20% if has locked silver NFT", async () => {
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("100"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("170"));
    });

    it("should increase total staked amount 20% if stake then lock silver NFT", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("100"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("170"));
    });

    it("should increase total staked amount if has locked bronze NFT", async () => {
      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("100"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("160"));
    });

    it("should increase total staked amount 10% if stake then lock bronze NFT", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("100"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: FIRST_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("160"));
    });

    it("only master chef v2 contract", async () => {
      await truffleAssert.reverts(
        staking.onSushiReward(0, FIRST_ADDRESS, FIRST_ADDRESS, 0, web3.utils.toWei("10"), { from: FIRST_ADDRESS }),
        "LMS: Not a MCV2 contract"
      );
    });
  });

  describe("widthdrawFromSushiswap", async () => {
    beforeEach("setup", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
    });

    it("should update rewards before", async () => {
      const tx = await sushiswapMock.withdraw(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });

      const currentBlock = getTransactionBlock(tx);
      assert.equal((await staking.rewards(SECOND_ADDRESS)).toString(), web3.utils.toWei("40"));
      assert.equal((await staking.userRewardPerTokenPaid(SECOND_ADDRESS)).toString(), web3.utils.toWei("3"));
      assert.equal((await staking.rewardPerTokenStored()).toString(), web3.utils.toWei("3"));
      assert.equal(await staking.lastUpdateBlock(), currentBlock);
    });

    it("should accurately change contract state", async () => {
      await sushiswapMock.withdraw(web3.utils.toWei("20"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("80"));
      assert.equal((await staking.staked(FIRST_ADDRESS)).toString(), web3.utils.toWei("30"));
    });

    it("should emit valid event", async () => {
      const tx = await sushiswapMock.withdraw(web3.utils.toWei("20"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      const decodedEvents = await eventFilter(staking.address, "Withdrawn(address,uint256)");
      const user = decodedEvents[0].user;
      const amount = decodedEvents[0].amount.toString();

      assert.equal(user, FIRST_ADDRESS);
      assert.equal(amount, web3.utils.toWei("20"));
    });

    it("should withdraw and decrease 20% of the total staked if has locked silver NFT", async () => {
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });
      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("110"));
      await sushiswapMock.withdraw(web3.utils.toWei("20"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("86"));
    });

    it("should withdraw and decrease 10% of the total staked if has locked bronze NFT", async () => {
      await nftStaking.lockNFT(BRONZ_NFT_ID, { from: FIRST_ADDRESS });
      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("105"));
      await sushiswapMock.withdraw(web3.utils.toWei("20"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("83"));
    });
  });

  describe("emergencyWidthdrawFromSushiswap", async () => {
    beforeEach("setup", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
    });

    it("should update rewards before", async () => {
      const tx = await sushiswapMock.emergencyWithdraw(SECOND_ADDRESS, { from: SECOND_ADDRESS });

      const currentBlock = getTransactionBlock(tx);
      assert.equal((await staking.rewards(SECOND_ADDRESS)).toString(), web3.utils.toWei("40"));
      assert.equal((await staking.userRewardPerTokenPaid(SECOND_ADDRESS)).toString(), web3.utils.toWei("3"));
      assert.equal((await staking.rewardPerTokenStored()).toString(), web3.utils.toWei("3"));
      assert.equal(await staking.lastUpdateBlock(), currentBlock);
    });

    it("should accurately change contract state", async () => {
      await sushiswapMock.emergencyWithdraw(FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("50"));
      assert.equal((await staking.staked(FIRST_ADDRESS)).toString(), 0);
    });
  });

  describe("harvestInSushiswap", async () => {
    beforeEach("setup", async () => {
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) + 2, 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
    });

    it("should update rewards before", async () => {
      const tx = await sushiswapMock.harvest(FIRST_ADDRESS, { from: FIRST_ADDRESS });

      const currentBlock = getTransactionBlock(tx);
      assert.equal((await staking.userRewardPerTokenPaid(FIRST_ADDRESS)).toString(), web3.utils.toWei("2"));
      assert.equal((await staking.rewardPerTokenStored()).toString(), web3.utils.toWei("2"));
      assert.equal(await staking.lastUpdateBlock(), currentBlock);
    });

    it("should clear saved reward", async () => {
      await sushiswapMock.harvest(FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.rewards(FIRST_ADDRESS)).toString(), 0);
    });

    it("should transfer tokens and lower tokens locked", async () => {
      await sushiswapMock.harvest(FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await rewardToken.balanceOf(FIRST_ADDRESS)).toString(), web3.utils.toWei("80"));
      assert.equal((await rewardToken.balanceOf(staking.address)).toString(), web3.utils.toWei("9900"));
      assert.equal((await staking.rewardTokensLocked()).toString(), web3.utils.toWei("9900"));
    });

    it("should emit event", async () => {
      await sushiswapMock.harvest(FIRST_ADDRESS, { from: FIRST_ADDRESS });

      const decodedEvents = await eventFilter(staking.address, "RewardPaid(address,address,uint256)");
      const user = decodedEvents[0].user;
      const recipient = decodedEvents[0].recipient;
      const amount = decodedEvents[0].reward.toString();

      assert.equal(user, FIRST_ADDRESS);
      assert.equal(recipient, FIRST_ADDRESS);
      assert.equal(amount, web3.utils.toWei("80"));
    });
  });

  describe("harvestInSushiswap If Locked NFT", async () => {
    beforeEach("setup", async () => {
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) + 4, 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });
    });

    it("should update rewards before", async () => {
      const tx = await sushiswapMock.harvest(FIRST_ADDRESS, { from: FIRST_ADDRESS });

      const currentBlock = getTransactionBlock(tx);

      assert.equal(
        (await staking.userRewardPerTokenPaid(FIRST_ADDRESS)).toString(),
        web3.utils.toWei("0.909090909090909090")
      );
      assert.equal((await staking.rewardPerTokenStored()).toString(), web3.utils.toWei("0.909090909090909090"));
      assert.equal(await staking.lastUpdateBlock(), currentBlock);
    });

    it("should clear saved reward", async () => {
      await sushiswapMock.harvest(FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.rewards(FIRST_ADDRESS)).toString(), 0);
    });

    it("should transfer tokens and lower tokens locked for user locked silver NFT", async () => {
      await sushiswapMock.harvest(FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.closeTo(
        toBN(await rewardToken.balanceOf(FIRST_ADDRESS)).toNumber(),
        toBN(web3.utils.toWei("43.63636363636363632")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );

      assert.closeTo(
        toBN(await rewardToken.balanceOf(staking.address)).toNumber(),
        toBN(web3.utils.toWei("9945.4545454545454546")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
      assert.closeTo(
        toBN(await staking.rewardTokensLocked()).toNumber(),
        toBN(web3.utils.toWei("9945.4545454545454546")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
    });

    it("should transfer tokens and lower tokens locked for user didn't lock NFT", async () => {
      await sushiswapMock.harvest(SECOND_ADDRESS, { from: SECOND_ADDRESS });

      assert.closeTo(
        toBN(await rewardToken.balanceOf(SECOND_ADDRESS)).toNumber(),
        toBN(web3.utils.toWei("36.3636363636363636")).toNumber(),
        toBN(web3.utils.toWei("0.00001")).toNumber()
      );

      assert.closeTo(
        toBN(await rewardToken.balanceOf(staking.address)).toNumber(),
        toBN(web3.utils.toWei("9954.5454545454545455")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
      assert.closeTo(
        toBN(await staking.rewardTokensLocked()).toNumber(),
        toBN(web3.utils.toWei("9954.5454545454545455")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
    });

    it("should emit event", async () => {
      await sushiswapMock.harvest(FIRST_ADDRESS, { from: FIRST_ADDRESS });

      let decodedEvents = await eventFilter(staking.address, "RewardPaid(address,address,uint256)");
      const user = decodedEvents[0].user;
      const recipient = decodedEvents[0].recipient;
      const amount = decodedEvents[0].reward.toString();

      assert.equal(user, FIRST_ADDRESS);
      assert.equal(recipient, FIRST_ADDRESS);

      assert.closeTo(
        toBN(amount).toNumber(),
        toBN(web3.utils.toWei("43.63636363636363632")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
    });
  });

  describe("withdrawAndHarvestInSushiswap", async () => {
    beforeEach("setup", async () => {
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) + 2, 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
    });

    it("should update rewards before", async () => {
      const tx = await sushiswapMock.withdrawAndHarvest(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      const currentBlock = getTransactionBlock(tx);
      assert.equal((await staking.userRewardPerTokenPaid(FIRST_ADDRESS)).toString(), web3.utils.toWei("2"));
      assert.equal((await staking.rewardPerTokenStored()).toString(), web3.utils.toWei("2"));
      assert.equal(await staking.lastUpdateBlock(), currentBlock);
    });

    it("should clear saved reward", async () => {
      await sushiswapMock.withdrawAndHarvest(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.rewards(FIRST_ADDRESS)).toString(), 0);
    });

    it("should transfer tokens and lower tokens locked", async () => {
      await sushiswapMock.withdrawAndHarvest(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await rewardToken.balanceOf(FIRST_ADDRESS)).toString(), web3.utils.toWei("80"));
      assert.equal((await rewardToken.balanceOf(staking.address)).toString(), web3.utils.toWei("9900"));
      assert.equal((await staking.rewardTokensLocked()).toString(), web3.utils.toWei("9900"));
    });

    it("should accurately change contract state", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.withdrawAndHarvest(web3.utils.toWei("20"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("80"));
      assert.equal((await staking.staked(FIRST_ADDRESS)).toString(), web3.utils.toWei("80"));
    });

    it("should emit event", async () => {
      await sushiswapMock.withdrawAndHarvest(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      let decodedEvents = await eventFilter(staking.address, "RewardPaid(address,address,uint256)");
      let user = decodedEvents[0].user;
      let recipient = decodedEvents[0].recipient;
      let amount = decodedEvents[0].reward;

      assert.equal(user, FIRST_ADDRESS);
      assert.equal(recipient, FIRST_ADDRESS);
      assert.equal(amount, web3.utils.toWei("80"));

      decodedEvents = await eventFilter(staking.address, "Withdrawn(address,uint256)");
      user = decodedEvents[1].user;
      amount = decodedEvents[1].amount;

      assert.equal(user, FIRST_ADDRESS);
      assert.equal(amount, web3.utils.toWei("50"));
    });
  });

  describe("harvestByRecipient", async () => {
    beforeEach("setup", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
    });

    it("withdrawAndHarvest and should rewards earned by the recipient", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      await sushiswapMock.withdrawAndHarvest(web3.utils.toWei("30"), SECOND_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.rewards(FIRST_ADDRESS)).toString(), 0);

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("20"));
      assert.equal((await staking.staked(FIRST_ADDRESS)).toString(), web3.utils.toWei("20"));

      assert.equal((await staking.staked(SECOND_ADDRESS)).toString(), 0);
      assert.equal((await rewardToken.balanceOf(SECOND_ADDRESS)).toString(), web3.utils.toWei("80"));
    });

    it("withdrawAndHarvest and should lp staked and rewards earned by the recipient", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("50"), SECOND_ADDRESS, { from: FIRST_ADDRESS });

      await sushiswapMock.withdrawAndHarvest(web3.utils.toWei("30"), SECOND_ADDRESS, { from: SECOND_ADDRESS });

      assert.equal((await staking.rewards(SECOND_ADDRESS)).toString(), 0);

      assert.equal((await staking.totalStaked()).toString(), web3.utils.toWei("20"));
      assert.equal((await staking.staked(FIRST_ADDRESS)).toString(), 0);
      assert.equal((await staking.staked(SECOND_ADDRESS)).toString(), web3.utils.toWei("20"));
      assert.equal((await rewardToken.balanceOf(SECOND_ADDRESS)).toString(), web3.utils.toWei("80"));
    });

    it("harvest and should rewards earned by the recipient", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      await sushiswapMock.harvest(SECOND_ADDRESS, { from: FIRST_ADDRESS });

      assert.equal((await staking.rewards(FIRST_ADDRESS)).toString(), 0);

      assert.equal((await rewardToken.balanceOf(SECOND_ADDRESS)).toString(), web3.utils.toWei("80"));
    });

    it("harvest and should lp staked and rewards earned by the recipient", async () => {
      await sushiswapMock.deposit(web3.utils.toWei("50"), SECOND_ADDRESS, { from: FIRST_ADDRESS });

      await sushiswapMock.harvest(SECOND_ADDRESS, { from: SECOND_ADDRESS });

      assert.equal((await staking.rewards(SECOND_ADDRESS)).toString(), 0);
      assert.equal((await rewardToken.balanceOf(SECOND_ADDRESS)).toString(), web3.utils.toWei("80"));
    });
  });

  describe("recoverNonLockedRewardTokens", async () => {
    beforeEach("setup", async () => {
      await staking.setRewards(web3.utils.toWei("50"), await getCurrentBlock(), 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
    });

    it("should recover reward tokens", async () => {
      const lockedAmount = await staking.rewardTokensLocked();
      const expectedRecover = (await rewardToken.balanceOf(staking.address)).sub(lockedAmount);
      const balanceBefore = await rewardToken.balanceOf(OWNER);
      await staking.recoverNonLockedRewardTokens();

      assert.equal((await rewardToken.balanceOf(OWNER)).toString(), balanceBefore.add(expectedRecover));
      assert.equal((await rewardToken.balanceOf(staking.address)).toString(), lockedAmount);
    });

    it("should emit valid event", async () => {
      const lockedAmount = await staking.rewardTokensLocked();
      const expectedRecover = (await rewardToken.balanceOf(staking.address)).sub(lockedAmount);
      const tx = await staking.recoverNonLockedRewardTokens();

      const event = tx.logs.find((x) => x.event == "RewardTokensRecovered").args;
      assert.equal(event.amount.toString(), expectedRecover);
    });
  });

  describe("earned calculation", async () => {
    it("before start block is zero", async () => {
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) + 50, 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(5);

      assert.equal((await staking.earned(FIRST_ADDRESS)).toString(), 0);
    });

    it("start in the middle of calculation", async () => {
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) + 5, 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(4);
      await setCurrentTime(1);

      assert.equal((await staking.earned(FIRST_ADDRESS)).toString(), web3.utils.toWei("200"));
      assert.equal((await staking.earnedSlashed(FIRST_ADDRESS)).toString(), web3.utils.toWei("160")); // 200 - 20%
    });

    it("end in the middle of calculation", async () => {
      await advanceBlocks(5);
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) - 5, 10);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(4);
      await setCurrentTime(100 * 24 * 60 * 60 + 10);

      assert.equal((await staking.earned(FIRST_ADDRESS)).toString(), web3.utils.toWei("200"));
      assert.equal((await staking.earnedSlashed(FIRST_ADDRESS)).toString(), web3.utils.toWei("160"));
    });

    it("after end block is zero", async () => {
      await advanceBlocks(11);
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) - 11, 10);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(5);

      assert.equal((await staking.earned(FIRST_ADDRESS)).toString(), 0);
    });

    it("with small stakes", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
      await sushiswapMock.deposit(1, FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(2, SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await sushiswapMock.deposit(7, THIRD_ADDRESS, { from: THIRD_ADDRESS });
      await advanceBlocks(5);

      assert.equal((await staking.earned(THIRD_ADDRESS)).toString(), web3.utils.toWei("350"));
    });

    it("with large stakes", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);

      await sushiswapMock.deposit(web3.utils.toWei("1000"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("2000"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("7000"), THIRD_ADDRESS, { from: THIRD_ADDRESS });
      await advanceBlocks(5);

      assert.equal((await staking.earned(THIRD_ADDRESS)).toString(), web3.utils.toWei("350"));
    });
  });

  describe("earned calculation with locked NFT", async () => {
    it("before start block is zero", async () => {
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) + 50, 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(5);
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });

      assert.equal((await staking.earned(FIRST_ADDRESS)).toString(), 0);
    });

    it("start in the middle of calculation", async () => {
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) + 5, 100);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });
      await advanceBlocks(3);
      await setCurrentTime(1);

      assert.closeTo(
        toBN(await staking.earned(FIRST_ADDRESS)).toNumber(),
        toBN(web3.utils.toWei("199.99999999999999992")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
      assert.closeTo(
        toBN(await staking.earnedSlashed(FIRST_ADDRESS)).toNumber(),
        toBN(web3.utils.toWei("160")).toNumber(), // 200 - 20%
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
    });

    it("end in the middle of calculation", async () => {
      await advanceBlocks(5);

      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) - 5, 10);

      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });

      await advanceBlocks(3);

      await setCurrentTime(100 * 24 * 60 * 60 + 10);

      assert.closeTo(
        toBN(await staking.earned(FIRST_ADDRESS)).toNumber(),
        toBN(web3.utils.toWei("199.99999999999999992")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
      assert.closeTo(
        toBN(await staking.earnedSlashed(FIRST_ADDRESS)).toNumber(),
        toBN(web3.utils.toWei("159.999999999999999936")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
    });

    it("after end block is zero", async () => {
      await advanceBlocks(11);
      await staking.setRewards(web3.utils.toWei("100"), (await getCurrentBlock()) - 11, 10);
      await sushiswapMock.deposit(web3.utils.toWei("50"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });
      await advanceBlocks(4);

      assert.equal((await staking.earned(FIRST_ADDRESS)).toString(), 0);
    });

    it("with small stakes", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);

      let tx = await sushiswapMock.deposit(web3.utils.toWei("1"), THIRD_ADDRESS, { from: THIRD_ADDRESS });

      tx = await sushiswapMock.deposit(web3.utils.toWei("2"), SECOND_ADDRESS, { from: SECOND_ADDRESS });

      tx = await sushiswapMock.deposit(web3.utils.toWei("7"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      tx = await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });

      await advanceBlocks(4);

      assert.closeTo(
        toBN(await staking.earned(FIRST_ADDRESS)).toNumber(),
        toBN(web3.utils.toWei("364.7368421052631408")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
    });

    it("with large stakes", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);

      await sushiswapMock.deposit(web3.utils.toWei("1000"), THIRD_ADDRESS, { from: THIRD_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("2000"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("7000"), FIRST_ADDRESS, { from: FIRST_ADDRESS });

      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });

      await advanceBlocks(4);

      assert.closeTo(
        toBN(await staking.earned(FIRST_ADDRESS)).toNumber(),
        toBN(web3.utils.toWei("364.7368421052631408")).toNumber(),
        toBN(web3.utils.toWei("0.0000000001")).toNumber()
      );
    });
  });

  describe("reward complex calculation cases", async () => {
    // Case taken from a document
    it("should accurately accrue rewards in a long run", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
      await sushiswapMock.deposit(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(1);
      await sushiswapMock.deposit(web3.utils.toWei("20"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(4);
      await sushiswapMock.deposit(web3.utils.toWei("10"), THIRD_ADDRESS, { from: THIRD_ADDRESS });
      await advanceBlocks(3);
      await sushiswapMock.deposit(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("30"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(3);
      await sushiswapMock.withdraw(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(2);
      await sushiswapMock.withdraw(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(2);
      await sushiswapMock.withdraw(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(2);

      await assertEarnedRoundedDownEqual(FIRST_ADDRESS, "799");
      await assertEarnedRoundedDownEqual(SECOND_ADDRESS, "1037");
      await assertEarnedRoundedDownEqual(THIRD_ADDRESS, "562");
    });

    it("should accurately accrue rewards in a case of rewards reset", async () => {
      await rewardToken.mintArbitrary(staking.address, web3.utils.toWei("20000"));

      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
      await sushiswapMock.deposit(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(1);
      await sushiswapMock.deposit(web3.utils.toWei("20"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(4);
      await sushiswapMock.deposit(web3.utils.toWei("10"), THIRD_ADDRESS, { from: THIRD_ADDRESS });
      await advanceBlocks(2);
      await staking.setRewards(web3.utils.toWei("200"), await getCurrentBlock(), 100);
      await advanceBlocks(2);
      await sushiswapMock.withdraw(web3.utils.toWei("20"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(2);

      await assertEarnedRoundedDownEqual(FIRST_ADDRESS, "791");
      await assertEarnedRoundedDownEqual(SECOND_ADDRESS, "783");
      await assertEarnedRoundedDownEqual(THIRD_ADDRESS, "425");
    });
  });

  describe("reward complex calculation cases with locked NFT", async () => {
    // Case taken from a document
    it("should accurately accrue rewards in a long run when stake then lock NFT", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
      await sushiswapMock.deposit(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("20"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(4);
      await sushiswapMock.deposit(web3.utils.toWei("10"), THIRD_ADDRESS, { from: THIRD_ADDRESS });
      await advanceBlocks(3);
      await sushiswapMock.deposit(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("30"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(3);
      await sushiswapMock.withdraw(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(2);
      await sushiswapMock.withdraw(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(2);
      await sushiswapMock.withdraw(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(2);

      await assertEarnedRoundedDownEqual(FIRST_ADDRESS, "874");
      await assertEarnedRoundedDownEqual(SECOND_ADDRESS, "986");
      await assertEarnedRoundedDownEqual(THIRD_ADDRESS, "539");
    });

    it("should accurately accrue rewards in a long run when locke NFT then stake", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("20"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(4);
      await sushiswapMock.deposit(web3.utils.toWei("10"), THIRD_ADDRESS, { from: THIRD_ADDRESS });
      await advanceBlocks(3);
      await sushiswapMock.deposit(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("30"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(3);
      await sushiswapMock.withdraw(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(2);
      await sushiswapMock.withdraw(web3.utils.toWei("50"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(2);
      await sushiswapMock.withdraw(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await advanceBlocks(2);

      await assertEarnedRoundedDownEqual(FIRST_ADDRESS, "774");
      await assertEarnedRoundedDownEqual(SECOND_ADDRESS, "986");
      await assertEarnedRoundedDownEqual(THIRD_ADDRESS, "539");
    });

    it("should accurately accrue rewards in a case of rewards reset", async () => {
      await rewardToken.mintArbitrary(staking.address, web3.utils.toWei("20000"));

      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);
      await sushiswapMock.deposit(web3.utils.toWei("10"), FIRST_ADDRESS, { from: FIRST_ADDRESS });
      await nftStaking.lockNFT(SLIVER_NFT_ID, { from: FIRST_ADDRESS });
      await sushiswapMock.deposit(web3.utils.toWei("20"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(4);
      await sushiswapMock.deposit(web3.utils.toWei("10"), THIRD_ADDRESS, { from: THIRD_ADDRESS });
      await advanceBlocks(2);
      await staking.setRewards(web3.utils.toWei("200"), await getCurrentBlock(), 100);
      await advanceBlocks(2);
      await sushiswapMock.withdraw(web3.utils.toWei("20"), SECOND_ADDRESS, { from: SECOND_ADDRESS });
      await advanceBlocks(2);

      await assertEarnedRoundedDownEqual(FIRST_ADDRESS, "862");
      await assertEarnedRoundedDownEqual(SECOND_ADDRESS, "741");
      await assertEarnedRoundedDownEqual(THIRD_ADDRESS, "396");
    });
  });

  describe("APY", async () => {
    it("should calculate correct APY", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);

      await stakingToken.setReserves(web3.utils.toWei("500000"), web3.utils.toWei("250000"));

      assert.equal(
        toBN(await staking.getAPY())
          .idiv(APY_PRECISION)
          .toString(),
        "23549562750"
      );
    });

    it("should calculate correct APY without reserve", async () => {
      await staking.setRewards(web3.utils.toWei("100"), await getCurrentBlock(), 100);

      assert.equal(toBN(await staking.getAPY()).toString(), "0");
    });

    it("should calculate correct APY without rewards", async () => {
      assert.equal(toBN(await staking.getAPY()).toString(), "0");
    });
  });
});
