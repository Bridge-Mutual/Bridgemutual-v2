// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./libraries/DecimalsConverter.sol";

import "./interfaces/IPolicyBook.sol";
import "./interfaces/IPolicyBookFacade.sol";
import "./interfaces/IPolicyBookAdmin.sol";
import "./interfaces/IPolicyBookFabric.sol";
import "./interfaces/IPolicyBookRegistry.sol";
import "./interfaces/IContractsRegistry.sol";
import "./interfaces/ILiquidityMining.sol";

import "./abstract/AbstractDependant.sol";

import "./PolicyBookFacade.sol";

import "./Globals.sol";

contract PolicyBookFabric is IPolicyBookFabric, OwnableUpgradeable, AbstractDependant {
    using SafeERC20 for ERC20;

    uint256 public constant MINIMAL_INITIAL_DEPOSIT = 1000 * DECIMALS18; // 1000 STBL

    IContractsRegistry public contractsRegistry;
    IPolicyBookRegistry public policyBookRegistry;
    IPolicyBookAdmin public policyBookAdmin;
    ILiquidityMining public liquidityMining;
    ERC20 public stblToken;

    uint256 public stblDecimals;

    event Created(address insured, ContractType contractType, address at, address facade);

    function __PolicyBookFabric_init() external initializer {
        __Ownable_init();
    }

    function setDependencies(IContractsRegistry _contractsRegistry)
        external
        override
        onlyInjectorOrZero
    {
        contractsRegistry = _contractsRegistry;

        policyBookRegistry = IPolicyBookRegistry(
            _contractsRegistry.getPolicyBookRegistryContract()
        );
        policyBookAdmin = IPolicyBookAdmin(_contractsRegistry.getPolicyBookAdminContract());
        liquidityMining = ILiquidityMining(_contractsRegistry.getLiquidityMiningContract());
        stblToken = ERC20(_contractsRegistry.getUSDTContract());

        stblDecimals = stblToken.decimals();
    }

    function create(
        address _insuranceContract,
        ContractType _contractType,
        string calldata _description,
        string calldata _projectSymbol,
        uint256 _initialDeposit
    ) external override returns (address) {
        require(_insuranceContract != address(0), "PBF: Null address");
        require(bytes(_description).length <= 200, "PBF: Project description is too long");
        require(
            bytes(_projectSymbol).length != 0 && bytes(_projectSymbol).length <= 30,
            "PBF: Project symbol is too long/short"
        );
        require(!liquidityMining.isLMLasting(), "PBF: Creation is blocked during LME");
        require(
            !liquidityMining.isLMEnded() || _initialDeposit >= MINIMAL_INITIAL_DEPOSIT,
            "PBF: Too small deposit"
        );

        TransparentUpgradeableProxy _policyBookProxy =
            new TransparentUpgradeableProxy(
                policyBookAdmin.getCurrentPolicyBooksImplementation(),
                policyBookAdmin.getUpgrader(),
                ""
            );

        IPolicyBook(address(_policyBookProxy)).__PolicyBook_init(
            _insuranceContract,
            _contractType,
            _description,
            _projectSymbol
        );

        TransparentUpgradeableProxy _policyBookFacadeProxy =
            new TransparentUpgradeableProxy(
                policyBookAdmin.getCurrentPolicyBooksFacadeImplementation(),
                policyBookAdmin.getUpgrader(),
                ""
            );

        IPolicyBookFacade(address(_policyBookFacadeProxy)).__PolicyBookFacade_init(
            address(_policyBookProxy)
        );

        AbstractDependant(address(_policyBookProxy)).setDependencies(contractsRegistry);
        AbstractDependant(address(_policyBookProxy)).setInjector(address(policyBookAdmin));

        AbstractDependant(address(_policyBookFacadeProxy)).setDependencies(contractsRegistry);
        AbstractDependant(address(_policyBookFacadeProxy)).setInjector(address(policyBookAdmin));

        IPolicyBook(address(_policyBookProxy)).setPolicyBookFacade(
            address(_policyBookFacadeProxy)
        );

        policyBookRegistry.add(
            _insuranceContract,
            _contractType,
            address(_policyBookProxy),
            address(_policyBookFacadeProxy)
        );

        emit Created(
            _insuranceContract,
            _contractType,
            address(_policyBookProxy),
            address(_policyBookFacadeProxy)
        );

        /// @dev make creation of pool free before LME (mind that creation is blocked during LME)

        stblToken.safeTransferFrom(
            msg.sender,
            address(_policyBookProxy),
            DecimalsConverter.convertFrom18(_initialDeposit, stblDecimals)
        );

        IPolicyBook(address(_policyBookProxy)).addLiquidityFor(msg.sender, _initialDeposit);

        return address(_policyBookProxy);
    }

    /// @notice add user leverage pool to policy book registry : access owner
    /// @param userLeverageAddress address user leverage pool proxy address
    /// @param contractType ContractType type of contract that leverage pool will cover
    function addUserLeveragePoolToRegistry(address userLeverageAddress, ContractType contractType)
        external
        override
        onlyOwner
    {
        policyBookRegistry.add(address(0), contractType, userLeverageAddress, address(0));
    }
}
