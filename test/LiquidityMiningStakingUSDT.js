const ContractsRegistry = artifacts.require("ContractsRegistry");
const LiquidityMiningStakingETH = artifacts.require("LiquidityMiningStakingETH");
const LiquidityMiningStakingUSDT = artifacts.require("LiquidityMiningStakingUSDT");
const BMIMock = artifacts.require("BMIMock");
const LpBmiUsdtMock = artifacts.require("LpBmiUsdtMock");
const BMIStaking = artifacts.require("BMIStaking");
const StkBMIToken = artifacts.require("STKBMIToken");
const LiquidityMiningMock = artifacts.require("LiquidityMiningMock");
const NFTStaking = artifacts.require("NFTStaking");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");

contract("LiquidityMiningStakingUSDT", async (accounts) => {
  const reverter = new Reverter(web3);

  const OWNER = accounts[0];
  const FIRST_ADDRESS = accounts[1];

  const LEGACY_STAKING = accounts[8];

  const NOTHING = accounts[9];

  let staking;
  let stakingToken;
  let rewardToken;
  let rewardStaking;
  let rewardStakingToken;
  let liquidityMiningMock;
  let contractsRegistry;

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    stakingToken = await LpBmiUsdtMock.new("", "");
    rewardToken = await BMIMock.new(NOTHING);
    const _rewardStaking = await BMIStaking.new();
    const _rewardStakingToken = await StkBMIToken.new();
    const _stakingETH = await LiquidityMiningStakingETH.new();
    const _stakingUSDT = await LiquidityMiningStakingUSDT.new();

    const _liquidityMiningMock = await LiquidityMiningMock.new();
    const _nftStaking = await NFTStaking.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.LEGACY_BMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.VBMI_NAME(), NOTHING);
    await contractsRegistry.addContract(
      await contractsRegistry.SUSHISWAP_BMI_TO_USDT_PAIR_NAME(),
      stakingToken.address
    );
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), rewardToken.address);
    await contractsRegistry.addContract(await contractsRegistry.SUSHI_SWAP_MASTER_CHEF_V2_NAME(), NOTHING);

    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_STAKING_NAME(), _rewardStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), _rewardStakingToken.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(),
      _stakingETH.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(),
      _stakingUSDT.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_NAME(),
      _liquidityMiningMock.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.NFT_STAKING_NAME(), _nftStaking.address);

    rewardStaking = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());
    rewardStakingToken = await StkBMIToken.at(await contractsRegistry.getSTKBMIContract());
    staking = await LiquidityMiningStakingUSDT.at(await contractsRegistry.getLiquidityMiningStakingUSDTContract());
    liquidityMiningMock = await LiquidityMiningMock.at(await contractsRegistry.getLiquidityMiningContract());

    await rewardStaking.__BMIStaking_init("0");
    await rewardStakingToken.__STKBMIToken_init();
    await staking.__LiquidityMiningStakingUSDT_init();
    await liquidityMiningMock.__LiquidityMining_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LIQUIDITY_MINING_NAME());
    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("__LiquidityMiningStakingUSDT_init", () => {
    it("should revert if already was invoked", async () => {
      await truffleAssert.reverts(
        staking.__LiquidityMiningStakingUSDT_init(),
        "Initializable: contract is already initialized"
      );
    });

    it("should init ownable", async () => {
      expect(await staking.owner()).to.be.eq(OWNER);
    });
  });

  describe("setDependencies", async () => {
    it("should revert if not injector", async () => {
      await truffleAssert.reverts(
        staking.setDependencies(contractsRegistry.address, { from: FIRST_ADDRESS }),
        "Dependant: Not an injector"
      );
    });

    describe("should set dependencies correctly", async () => {
      it("rewardsToken", async () => {
        expect(await staking.rewardsToken()).to.be.eq(await contractsRegistry.getBMIContract());
      });

      it("bmiStaking", async () => {
        expect(await staking.bmiStaking()).to.be.eq(await contractsRegistry.getBMIStakingContract());
      });

      it("stakingToken", async () => {
        expect(await staking.stakingToken()).to.be.eq(await contractsRegistry.getSushiswapBMIToUSDTPairContract());
      });

      it("liquidityMining", async () => {
        expect(await staking.liquidityMining()).to.be.eq(await contractsRegistry.getLiquidityMiningContract());
      });

      it("nftStakingAddress", async () => {
        expect(await staking.nftStakingAddress()).to.be.eq(await contractsRegistry.getNFTStakingContract());
      });

      it("sushiswapMasterChefV2Address", async () => {
        expect(await staking.sushiswapMasterChefV2Address()).to.be.eq(
          await contractsRegistry.getSushiSwapMasterChefV2Contract()
        );
      });
    });
  });
});
