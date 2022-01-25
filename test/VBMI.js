const ContractsRegistry = artifacts.require("ContractsRegistry");
const VBMI = artifacts.require("VBMI");
const STKBMIToken = artifacts.require("STKBMIToken");
const ReinsurancePool = artifacts.require("ReinsurancePool");
const ClaimVoting = artifacts.require("ClaimVoting");
const STBLMock = artifacts.require("STBLMock");

const { sign2612 } = require("./helpers/signatures");
const { MAX_UINT256 } = require("./helpers/constants");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const wei = web3.utils.toWei;

contract("VBMI", async (accounts) => {
  const reverter = new Reverter(web3);

  let contractsRegistry;
  let reinsurancePool;
  let vBMI;
  let stkBMI;

  const MAIN = accounts[0];
  const USER2 = accounts[1];
  const CLAIM_VOTING = accounts[2];
  const USER3 = accounts[3];
  const STAKING_CONTRACT = accounts[5];

  const NOTHING = accounts[9];

  const MAIN_PRIVATE_KEY = "ad5d3fd80dfc93fa3a5aa232d21cd73da7c6eac6f80d709a590e7245cb6fb9fb";

  before("setup", async () => {
    contractsRegistry = await ContractsRegistry.new();
    const stblMock = await STBLMock.new("mockSTBL", "MSTBL", 6);
    const _stkBMI = await STKBMIToken.new();
    const _reinsurancePool = await ReinsurancePool.new();
    const _vBMI = await VBMI.new();
    const _claimVoting = await ClaimVoting.new();

    await contractsRegistry.__ContractsRegistry_init();

    await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.PRICE_FEED_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CLAIMING_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_REGISTRY_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.REPUTATION_SYSTEM_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.CAPITAL_POOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), NOTHING);
    await contractsRegistry.addContract(await contractsRegistry.POLICY_BOOK_ADMIN_NAME(), NOTHING);

    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblMock.address);
    await contractsRegistry.addContract(await contractsRegistry.BMI_STAKING_NAME(), STAKING_CONTRACT);

    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), _stkBMI.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.VBMI_NAME(), _vBMI.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), _reinsurancePool.address);
    await contractsRegistry.addProxyContract(await contractsRegistry.CLAIM_VOTING_NAME(), _claimVoting.address);

    const claimVoting = await ClaimVoting.at(await contractsRegistry.getClaimVotingContract());
    stkBMI = await STKBMIToken.at(await contractsRegistry.getSTKBMIContract());
    vBMI = await VBMI.at(await contractsRegistry.getVBMIContract());
    reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());

    await stkBMI.__STKBMIToken_init();
    await vBMI.__VBMI_init();
    await reinsurancePool.__ReinsurancePool_init();
    await claimVoting.__ClaimVoting_init();

    await contractsRegistry.injectDependencies(await contractsRegistry.STKBMI_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.CLAIM_VOTING_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.REINSURANCE_POOL_NAME());
    await contractsRegistry.injectDependencies(await contractsRegistry.VBMI_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("vBMI details", async () => {
    it("should deploy with correct name", async () => {
      assert.equal(await vBMI.name(), "BMI V2 Voting Token");
    });

    it("should deploy with correct symbol", async () => {
      assert.equal(await vBMI.symbol(), "vBMIV2");
    });

    it("should deploy with correct decimals", async () => {
      assert.equal(await vBMI.decimals(), 18);
    });
  });

  describe("vBMI lock and unlock", async () => {
    it("should lockStkBMI and unlock", async () => {
      const VBMIAmount = wei("1000");

      await stkBMI.mint(USER2, VBMIAmount, { from: STAKING_CONTRACT });
      await stkBMI.approve(vBMI.address, VBMIAmount, { from: USER2 });
      await vBMI.lockStkBMI(VBMIAmount, { from: USER2 });

      assert.equal(await vBMI.balanceOf(USER2), VBMIAmount);
      assert.equal(await stkBMI.balanceOf(USER2), 0);

      await vBMI.unlockStkBMI(VBMIAmount, { from: USER2 });

      assert.equal(await vBMI.balanceOf(USER2), 0);
      assert.equal(await stkBMI.balanceOf(USER2), VBMIAmount);
    });
  });

  describe("check fail cases", async () => {
    it("should revert 0 stkBmi transaction", async () => {
      await truffleAssert.reverts(vBMI.lockStkBMI(0, { from: USER2 }), "VBMI: can't lock 0 tokens");
    });

    it("should revert transaction on empty balance", async () => {
      await truffleAssert.reverts(vBMI.lockStkBMI(wei("100"), { from: USER2 }));
    });

    it("should revert transfer transaction", async () => {
      const VBMIAmount = wei("1000");

      await stkBMI.mint(USER2, VBMIAmount, { from: STAKING_CONTRACT });
      await stkBMI.approve(vBMI.address, VBMIAmount, { from: USER2 });
      await vBMI.lockStkBMI(VBMIAmount, { from: USER2 });

      await truffleAssert.reverts(vBMI.transfer(CLAIM_VOTING, wei("100")), "VBMI: Currently transfer is blocked");
    });

    it("should revert transfer from transaction", async () => {
      await truffleAssert.reverts(
        vBMI.transferFrom(USER2, CLAIM_VOTING, wei("100")),
        "VBMI: Currently transfer is blocked"
      );
    });
  });

  describe("check slash tokens", async () => {
    beforeEach(async () => {
      const _vBMI = await VBMI.new();

      await contractsRegistry.addContract(await contractsRegistry.CLAIM_VOTING_NAME(), CLAIM_VOTING);

      await contractsRegistry.addProxyContract(await contractsRegistry.VBMI_NAME(), _vBMI.address);

      vBMI = await VBMI.at(await contractsRegistry.getVBMIContract());

      await vBMI.__VBMI_init();

      await contractsRegistry.injectDependencies(await contractsRegistry.VBMI_NAME());
    });

    it("should slash tokens", async () => {
      const VBMIAmount = wei("1000");

      await stkBMI.mint(USER2, VBMIAmount, { from: STAKING_CONTRACT });
      await stkBMI.approve(vBMI.address, VBMIAmount, { from: USER2 });
      await vBMI.lockStkBMI(VBMIAmount, { from: USER2 });
      await vBMI.slashUserTokens(USER2, VBMIAmount, { from: CLAIM_VOTING });

      assert.equal(await stkBMI.balanceOf(reinsurancePool.address), VBMIAmount);
    });

    it("should fail slash", async () => {
      const VBMIAmount = wei("1000");

      await stkBMI.mint(USER2, VBMIAmount, { from: STAKING_CONTRACT });
      await stkBMI.approve(vBMI.address, VBMIAmount, { from: USER2 });
      await vBMI.lockStkBMI(VBMIAmount, { from: USER2 });

      await truffleAssert.reverts(vBMI.slashUserTokens(USER2, VBMIAmount), "VBMI: Not a ClaimVoting contract");
    });

    it("should be able to use permit function", async () => {
      const VBMIAmount = 1000;

      const buffer = Buffer.from(MAIN_PRIVATE_KEY, "hex");
      const contractData = { name: await vBMI.name(), verifyingContract: vBMI.address };
      const transactionData = {
        owner: MAIN,
        spender: USER2,
        value: 1000,
      };

      const { v, r, s } = sign2612(contractData, transactionData, buffer);

      await vBMI.permit(MAIN, USER2, VBMIAmount, MAX_UINT256, v, r, s, { from: MAIN });

      assert.equal(await vBMI.allowance(MAIN, USER2), VBMIAmount);
    });

    it("should revert if user unlocks and has no tokens", async () => {
      const VBMIAmount = 1000;
      await stkBMI.mint(USER2, VBMIAmount, { from: STAKING_CONTRACT });
      await stkBMI.approve(vBMI.address, VBMIAmount, { from: USER2 });
      await vBMI.lockStkBMI(VBMIAmount, { from: USER2 });

      await truffleAssert.reverts(vBMI.lockStkBMI(VBMIAmount, { from: USER3 }));
      await truffleAssert.reverts(vBMI.unlockStkBMI(VBMIAmount, { from: USER3 }));
      await truffleAssert.reverts(vBMI.slashUserTokens(USER2, VBMIAmount, { from: USER2 }));
    });

    it("should fail if permit function has wrong parameters", async () => {
      const VBMIAmount = 1000;

      const buffer = Buffer.from(MAIN_PRIVATE_KEY, "hex");
      const contractData = { name: await vBMI.name(), verifyingContract: vBMI.address };
      const transactionData = {
        owner: MAIN,
        spender: USER2,
        value: 1000,
      };

      const { v, r, s } = sign2612(contractData, transactionData, buffer);

      // TODO: split into different tests
      // it should fail if amount is different from the data signed
      await truffleAssert.reverts(
        vBMI.permit(MAIN, USER2, 2000, MAX_UINT256, v, r, s, { from: MAIN }),
        "ERC20Permit: invalid signature",
        "Signature accepted: Amount is different from the data signed"
      );

      // it should fail if spender is different from the data signed
      await truffleAssert.reverts(
        vBMI.permit(MAIN, STAKING_CONTRACT, VBMIAmount, MAX_UINT256, v, r, s, { from: MAIN }),
        "ERC20Permit: invalid signature",
        "Signature accepted: Spender is different from the data signed"
      );

      // it should fail if owner is different
      await truffleAssert.reverts(
        vBMI.permit(STAKING_CONTRACT, USER2, VBMIAmount, MAX_UINT256, v, r, s, { from: MAIN }),
        "ERC20Permit: invalid signature",
        "Signature accepted: User is different"
      );

      // another user can send the tx
      await vBMI.permit(MAIN, USER2, VBMIAmount, MAX_UINT256, v, r, s, { from: STAKING_CONTRACT });

      // another user cannot reuse signature
      await truffleAssert.reverts(
        vBMI.permit(MAIN, USER2, VBMIAmount, MAX_UINT256, v, r, s, { from: USER2 }),
        "ERC20Permit: invalid signature",
        "Signature accepted: Another user cannot reuse signature"
      );

      // user cannot reuse signature
      await truffleAssert.reverts(
        vBMI.permit(MAIN, USER2, VBMIAmount, MAX_UINT256, v, r, s, { from: MAIN }),
        "ERC20Permit: invalid signature",
        "Signature accepted: User cannot reuse signature"
      );
    });
  });
});
