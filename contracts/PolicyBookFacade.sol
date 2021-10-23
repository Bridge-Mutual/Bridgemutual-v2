// SPDX-Licene-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IContractsRegistry.sol";
import "./interfaces/IPolicyBook.sol";
import "./interfaces/IPolicyBookAdmin.sol";

import "./shield_mining/ShieldMiningOperator.sol";

import "./Globals.sol";

contract PolicyBookFacade is ShieldMiningOperator, OwnableUpgradeable {
    TransparentUpgradeableProxy public pbProxy;
    IPolicyBookAdmin public policyBookAdmin;

    address public contractsRegristyAddress;
    address public capitalPoolAddress;
    uint256 public VUreinsurnacePool;
    uint256 public LUreinsurnacePool;
    uint256 public LUleveragePool;
    uint256 public userleveragedMPL;
    uint256 public reinsurancePoolMPL;

    constructor(IContractsRegistry _contractsRegistry, TransparentUpgradeableProxy _pbProxy) {
        pbProxy = _pbProxy;
        policyBookAdmin = IPolicyBookAdmin(_contractsRegistry.getPolicyBookAdminContract());
        contractsRegristyAddress = address(_contractsRegistry);
        capitalPoolAddress = IContractsRegistry(_contractsRegistry).getCapitalPoolContract();

        setShieldMiningViewAndController(_contractsRegistry);
    }

    modifier onlyPolicyBookAdmin() {
        require(msg.sender == address(policyBookAdmin), "PB: Not a PBA");
        _;
    }

    function buyPolicy(uint256 _epochsNumber, uint256 _coverTokens) external {
        IPolicyBook(address(pbProxy)).buyPolicy(
            msg.sender,
            _epochsNumber,
            _coverTokens,
            0,
            address(0)
        );
    }

    function buyPolicyFor(
        address _buyer,
        uint256 _epochsNumber,
        uint256 _coverTokens
    ) external {
        IPolicyBook(address(pbProxy)).buyPolicy(
            _buyer,
            _epochsNumber,
            _coverTokens,
            0,
            address(0)
        );
        capitalPoolAddress = IContractsRegistry(contractsRegristyAddress).getCapitalPoolContract();
    }

    function buyPolicyFromDistributor(
        uint256 _epochsNumber,
        uint256 _coverTokens,
        address _distributor
    ) external {
        uint256 _distributorFee = policyBookAdmin.distributorFees(_distributor);
        require(_distributorFee > 0, "PB: distributor not whitelisted");
        IPolicyBook(address(pbProxy)).buyPolicy(
            msg.sender,
            _epochsNumber,
            _coverTokens,
            _distributorFee,
            _distributor
        );
    }

    function buyPolicyFromDistributorFor(
        address _buyer,
        uint256 _epochsNumber,
        uint256 _coverTokens,
        address _distributor
    ) external {
        uint256 _distributorFee = policyBookAdmin.distributorFees(_distributor);
        require(_distributorFee > 0, "PB: distributor not whitelisted");
        IPolicyBook(address(pbProxy)).buyPolicy(
            _buyer,
            _epochsNumber,
            _coverTokens,
            _distributorFee,
            _distributor
        );
    }

    /// @notice Let user to add liquidity by supplying stable coin, access: ANY
    /// @param _liquidityAmount is amount of stable coin tokens to secure
    function addLiquidity(uint256 _liquidityAmount) external {
        IPolicyBook liquidityPolicyBook = IPolicyBook(address(pbProxy));
        liquidityPolicyBook.addLiquidity(msg.sender, _liquidityAmount);
    }

    /// @notice Let eligible contracts add liqiudity for another user by supplying stable coin
    /// @param _liquidityHolderAddr is address of address to assign cover
    /// @param _liquidityAmount is amount of stable coin tokens to secure
    function addLiquidityFor(address _liquidityHolderAddr, uint256 _liquidityAmount) external {
        IPolicyBook liquidityPolicyBook = IPolicyBook(address(pbProxy));
        liquidityPolicyBook.addLiquidityFor(_liquidityHolderAddr, _liquidityAmount);
    }

    /// @notice Let user to add liquidity by supplying stable coin and stake it,
    /// @dev access: ANY
    function addLiquidityAndStake(uint256 _liquidityAmount, uint256 _stakeSTBLAmount) external {
        IPolicyBook liquidityPolicyBook = IPolicyBook(address(pbProxy));
        liquidityPolicyBook.addLiquidityAndStake(_liquidityAmount, _stakeSTBLAmount, msg.sender);
    }

    /// @notice Let user to withdraw deposited liqiudity, access: ANY
    function withdrawLiquidity() external {
        IPolicyBook withdrawalPolicyBook = IPolicyBook(address(pbProxy));
        withdrawalPolicyBook.withdrawLiquidity();
    }

    /// @notice fetches all the pools data
    /// @return uint256 VUreinsurnacePool
    /// @return uint256 LUreinsurnacePool
    /// @return uint256 LUleveragePool
    function getPoolsData()
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        return (VUreinsurnacePool, LUreinsurnacePool, LUleveragePool);
    }

    /// @notice updates the pools data
    /// @dev only accessible via capitalpool
    /// @param _vUreinsurnacePool uint256 virtual stbl reinsurance pool
    /// @param _lUreinsurnacePool uint256 leverage stbl reinsurance pool
    /// @param _lUleveragePool uint256 leverage stb pool
    function updatePoolsData(
        uint256 _vUreinsurnacePool,
        uint256 _lUreinsurnacePool,
        uint256 _lUleveragePool
    ) external {
        require(msg.sender == capitalPoolAddress, "PBF: only CapitalPol");

        VUreinsurnacePool = _vUreinsurnacePool;
        LUreinsurnacePool = _lUreinsurnacePool;
        LUleveragePool = _lUleveragePool;
    }

    function setMPLs(uint256 _userLeverageMPL, uint256 _reinsuranceLeverageMPL)
        external
        onlyOwner
    {
        userleveragedMPL = _userLeverageMPL;
        reinsurancePoolMPL = _reinsuranceLeverageMPL;
    }
}
