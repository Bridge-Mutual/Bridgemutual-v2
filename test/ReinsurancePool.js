const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");
const { assert } = require("chai");
const Reverter = require("./helpers/reverter");

const ReinsurancePool = artifacts.require("ReinsurancePoolMock");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const BMIMock = artifacts.require("BMIMock");
const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");

const STKBMIToken = artifacts.require("STKBMIToken");
const BMIStaking = artifacts.require("BMIStaking");
const CapitalPool = artifacts.require("CapitalPoolMock");
const AaveProtocol = artifacts.require("AaveProtocol");
const YearnProtocol = artifacts.require("YearnProtocol");
const CompoundProtocol = artifacts.require("CompoundProtocol");
const UserLeveragePool = artifacts.require("UserLeveragePoolMock");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const ClaimingRegistry = artifacts.require("ClaimingRegistry");
const YieldGeneratorMock = artifacts.require("YieldGeneratorMock");
const LiquidityRegistry = artifacts.require("LiquidityRegistry");
const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyBookMock = artifacts.require("PolicyBookMock");
const PolicyBookFacade = artifacts.require("PolicyBookFacadeMock");
const PolicyQuote = artifacts.require("PolicyQuote");

function toBN(number) {
  return new BigNumber(number);
}
const { getStableAmount, getNetwork, Networks } = require("./helpers/utils");

contract("ReinsurancePool", async (accounts) => {
  const reverter = new Reverter(web3);

  let reinsurancePool;
  let bmiToken;
  let stkBmiToken;
  let stblToken;
  let bmiStaking;
  let capitalPool;
  let policyBookAdmin;
  let policyQuote;

  let network;

  const OWNER_USER = accounts[0];
  const OTHER_USER = accounts[1];
  const CLAIM_VOTING_ADDRESS = accounts[2];

  const NOTHING = accounts[9];

  const { toWei } = web3.utils;
  const PRECISION = toBN(10).pow(25);

  before("setup", async () => {
    network = await getNetwork();
    const contractsRegistry = await ContractsRegistry.new();
    bmiToken = await BMIMock.new(OWNER_USER);
    if (network == Networks.ETH) {
      stblToken = await STBLMock.new("stbl", "stbl", 6);
    } else if (network == Networks.BSC) {
      stblToken = await BSCSTBLMock.new();
    } else if (network == Networks.POL) {
      stbl = await MATICSTBLMock.new();
      await stbl.initialize("stbl", "stbl", 6, accounts[0]);
    }
    const policyBookImpl = await PolicyBookMock.new();
    const policyBookFacadeImpl = await PolicyBookFacade.new();
    const _userLeveragePoolImpl = await UserLeveragePool.new();
    const _stkBmiToken = await STKBMIToken.new();
    const _bmiStaking = await BMIStaking.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _liquidityRegistry = await LiquidityRegistry.new();
    const _aaveProtocol = await AaveProtocol.new();
    const _compoundProtocol = await CompoundProtocol.new();
    const _yearnProtocol = await YearnProtocol.new();
    const _leveragePortfolioView = await LeveragePortfolioView.new();
    const _policyBookRegistry = await PolicyBookRegistry.new();
    const _claimingRegistry = await ClaimingRegistry.new();
    const _yieldGenerator = await YieldGeneratorMock.new();
    const _policyBookAdmin = await PolicyBookAdmin.new();
    const _policyQuote = await PolicyQuote.new();
    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_COVER_STAKING_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.STKBMI_STAKING_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LIQUIDITY_BRIDGE_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.BMI_TREASURY_NAME(), NOTHING);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      _leveragePortfolioView.address
    );
    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmiToken.address);
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblToken.address);
    await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), CLAIM_VOTING_ADDRESS);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_ADMIN_NAME(),
      _policyBookAdmin.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), _stkBmiToken.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_STAKING_NAME(), _bmiStaking.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());
    const _capitalPool = await CapitalPool.new();

    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_REGISTRY_NAME(),
      _liquidityRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), _capitalPool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), _aaveProtocol.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), _compoundProtocol.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), _yearnProtocol.address);
    await contractsRegistry.addProxyContract(
      await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(),
      _policyBookRegistry.address
    );
    await contractsRegistry.addProxyContract(
      await contractsRegistry.CLAIMING_REGISTRY_NAME(),
      _claimingRegistry.address
    );
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), _yieldGenerator.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.POLICY_QUOTE_NAME(), _policyQuote.address);

    stkBmiToken = await STKBMIToken.at(await contractsRegistry.getSTKBMIContract());
    bmiStaking = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());
    policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());
    capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());
    const policyQuote = await PolicyQuote.at(await contractsRegistry.getPolicyQuoteContract());

    await bmiStaking.__BMIStaking_init("0");
    await stkBmiToken.__STKBMIToken_init();
    await reinsurancePool.__ReinsurancePool_init();
    await capitalPool.__CapitalPool_init();
    await policyBookAdmin.__PolicyBookAdmin_init(
      policyBookImpl.address,
      policyBookFacadeImpl.address,
      _userLeveragePoolImpl.address
    );
    await contractsRegistry.injectDependencies(await contractsRegistry.BMI_STAKING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CAPITAL_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_BOOK_ADMIN_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.POLICY_QUOTE_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("withdrawBMITo", async () => {
    it("not claim voting address could not call", async () => {
      await truffleAssert.reverts(
        reinsurancePool.withdrawBMITo(OTHER_USER, "1"),
        "RP: Caller is not a ClaimVoting contract"
      );
    });

    it("should actually transfer tokens", async () => {
      await bmiToken.transfer(reinsurancePool.address, web3.utils.toWei("100"));

      await reinsurancePool.withdrawBMITo(OTHER_USER, web3.utils.toWei("50"), { from: CLAIM_VOTING_ADDRESS });
      assert.equal(await bmiToken.balanceOf(reinsurancePool.address), web3.utils.toWei("50"));
      assert.equal(await bmiToken.balanceOf(OTHER_USER), web3.utils.toWei("50"));
    });
  });

  describe("withdrawSTBLTo", async () => {
    it("not claim voting address could not call", async () => {
      await truffleAssert.reverts(
        reinsurancePool.withdrawSTBLTo(OTHER_USER, "1"),
        "RP: Caller is not a ClaimVoting contract"
      );
    });

    it("should actually transfer tokens", async () => {
      await stblToken.transfer(reinsurancePool.address, getStableAmount("100"));

      await reinsurancePool.withdrawSTBLTo(OTHER_USER, web3.utils.toWei("50"), { from: CLAIM_VOTING_ADDRESS });

      assert.equal(
        toBN(await stblToken.balanceOf(reinsurancePool.address)).toString(),
        getStableAmount("50").toString()
      );
      assert.equal(toBN(await stblToken.balanceOf(OTHER_USER)).toString(), getStableAmount("50").toString());
    });
  });

  describe("recoverERC20", async () => {
    beforeEach("setup", async () => {
      const balance = await bmiToken.balanceOf(OWNER_USER);
      await bmiToken.transfer(reinsurancePool.address, balance);
    });

    it("not owner could not call", async () => {
      await truffleAssert.reverts(
        reinsurancePool.recoverERC20(bmiToken.address, "1", { from: OTHER_USER }),
        "Ownable: caller is not the owner"
      );
    });

    it("should actually recover tokens", async () => {
      await reinsurancePool.recoverERC20(bmiToken.address, web3.utils.toWei("100"));

      assert.equal(await bmiToken.balanceOf(OWNER_USER), web3.utils.toWei("100"));
    });

    it("should emit event", async () => {
      const tx = await reinsurancePool.recoverERC20(bmiToken.address, web3.utils.toWei("100"));

      const event = tx.logs.find((x) => x.event == "Recovered").args;
      assert.equal(event.tokenAddress, bmiToken.address);
      assert.equal(event.tokenAmount, web3.utils.toWei("100"));
    });
  });

  describe("increasevStableBalance", async () => {
    const premiumAmount = toBN(toWei("1000"));
    const virtualLiquidityAmount = toBN(toWei("5000000"));
    beforeEach("setup", async () => {
      // setup fot reinsurance pool - 5 MM
      await reinsurancePool.setVtotalLiquidity(virtualLiquidityAmount);

      assert.equal(toBN(await reinsurancePool.totalLiquidity()).toString(), virtualLiquidityAmount.toString());
    });

    it("increase vStable Balance by premium, below reevaluate threshold", async () => {
      await policyBookAdmin.setLeveragePortfolioRebalancingThreshold(reinsurancePool.address, PRECISION);
      assert.equal((await reinsurancePool.rebalancingThreshold()).toString(), PRECISION.toFixed());

      await capitalPool.addPremium(premiumAmount);

      assert.equal(
        toBN(await reinsurancePool.totalLiquidity()).toString(),
        virtualLiquidityAmount.plus(premiumAmount).toString()
      );
    });
  });
});
