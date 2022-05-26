//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/DecimalsConverter.sol";

import "../interfaces/IContractsRegistry.sol";

import "../interfaces/IPolicyRegistry.sol";
import "../interfaces/IPolicyBookRegistry.sol";

import "../interfaces/IClaimingRegistry.sol";

import "../interfaces/IPolicyBook.sol";
import "../interfaces/IPolicyBookFacade.sol";

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract InteractionSolidity {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;

    IContractsRegistry public contractRegistry;
    IPolicyRegistry public policyRegistry;
    IPolicyBookRegistry public policyBookRegistry;
    ERC20 public stablecoin;

    uint256 public stblDecimals;

    constructor(address contractRegistryAddress) {
        contractRegistry = IContractsRegistry(contractRegistryAddress);
        policyRegistry = IPolicyRegistry(contractRegistry.getPolicyRegistryContract());
        policyBookRegistry = IPolicyBookRegistry(contractRegistry.getPolicyBookRegistryContract());
        stablecoin = ERC20(contractRegistry.getUSDTContract());
        stblDecimals = stablecoin.decimals();
    }

    function getWhiteListedPolicies()
        public
        view
        returns (
            address[] memory _policyBooksArr,
            IPolicyBookRegistry.PolicyBookStats[] memory _stats
        )
    {
        // SET UP
        /*
        address contractRegistryAddress = "0x8050c5a46FC224E3BCfa5D7B7cBacB1e4010118d";
        IContractRegistry contractRegistry = IContractsRegistry(contractRegistryAddress);
        IPolicyBookRegistry policyBookRegistry = IPolicyBookRegistry(contractRegistry.getPolicyBookRegistryContract());
        */

        // FUNCTION CALL
        uint256 countWhiteListed = policyBookRegistry.countWhitelisted();
        return policyBookRegistry.listWithStatsWhitelisted(0, countWhiteListed);
    }

    function getPurchasedPolicies(bool _isActive)
        public
        view
        returns (
            uint256 _policiesCount,
            address[] memory _policyBooksArr,
            IPolicyRegistry.PolicyInfo[] memory _policies,
            IClaimingRegistry.ClaimStatus[] memory _policyStatuses
        )
    {
        // SET UP
        /*
        address contractRegistryAddress = "0x8050c5a46FC224E3BCfa5D7B7cBacB1e4010118d";
        IContractRegistry contractRegistry = IContractsRegistry(contractRegistryAddress);
        IPolicyRegistry policyRegistry = IPolicyRegistry(
            contractRegistry.getPolicyRegistryContract()
        );
        */

        // FUNCTION CALL
        uint256 count = policyRegistry.getPoliciesLength(msg.sender);
        return policyRegistry.getPoliciesInfo(msg.sender, _isActive, 0, count);
    }

    function purchasePolicy(
        address policyBookAddress,
        uint256 _epochsNumber,
        uint256 _coverTokens,
        address _distributor
    ) public {
        // SET UP
        IPolicyBook policyBook = IPolicyBook(policyBookAddress);
        IPolicyBookFacade policyBookFacade = policyBook.policyBookFacade();

        // FUNCTION CALL
        (, uint256 totalPrice, ) =
            policyBookFacade.getPolicyPrice(_epochsNumber, _coverTokens, msg.sender);
        uint256 stblPrice = DecimalsConverter.convertFrom18(totalPrice, stblDecimals);
        stablecoin.safeTransferFrom(msg.sender, address(this), stblPrice);

        uint256 _currentApproval = stablecoin.allowance(address(this), address(policyBook));
        uint256 _newApproval = _currentApproval.add(stblPrice);
        _setOrIncreaseTetherAllowance(address(policyBook), _newApproval);

        policyBookFacade.buyPolicyFromDistributorFor(
            msg.sender,
            _epochsNumber,
            _coverTokens,
            _distributor
        );
    }

    function earnInterest(address policyBookAddress, uint256 _liquidityAmount) public {
        // SET UP
        IPolicyBook policyBook = IPolicyBook(policyBookAddress);
        IPolicyBookFacade policyBookFacade = policyBook.policyBookFacade();

        // FUNCTION CALL
        uint256 stblAmount = DecimalsConverter.convertFrom18(_liquidityAmount, stblDecimals);
        stablecoin.safeTransferFrom(msg.sender, address(this), stblAmount);

        uint256 _currentApproval = stablecoin.allowance(address(this), address(policyBook));
        uint256 _newApproval = _currentApproval.add(stblAmount);
        _setOrIncreaseTetherAllowance(address(policyBook), _newApproval);

        policyBookFacade.addLiquidityFromDistributorFor(msg.sender, _liquidityAmount);
    }

    /// @notice sets the tether allowance between another contract
    /// @dev stblToken requires allowance to be set to zero before modifying its value
    /// @param _contractAddress, address to modify the allowance
    /// @param _stbAmount, uint256 amount of tokens to allow
    function _setOrIncreaseTetherAllowance(address _contractAddress, uint256 _stbAmount) internal {
        uint256 _contractAllowance = stablecoin.allowance(address(this), _contractAddress);

        bool exceedsAllowance = (_stbAmount > _contractAllowance);
        bool allowanceIsZero = (_contractAllowance == 0);

        if (exceedsAllowance) {
            if (!allowanceIsZero) {
                stablecoin.safeDecreaseAllowance(_contractAddress, 0);
            }
            stablecoin.safeIncreaseAllowance(_contractAddress, _stbAmount);
        }
    }
}
