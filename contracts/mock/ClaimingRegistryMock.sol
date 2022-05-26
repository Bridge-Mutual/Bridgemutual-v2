// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../ClaimingRegistry.sol";

contract ClaimingRegistryMock is ClaimingRegistry {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.UintSet;

    function updateStatus(
        address user,
        address policyBook,
        ClaimStatus status
    ) external {
        uint256 index = _allClaimsToIndex[policyBook][user];
        _allClaimsByIndexInfo[index].status = status;

        if (status == ClaimStatus.REJECTED && _allClaimsByIndexInfo[index].appeal) {
            delete _allClaimsToIndex[policyBook][user];
        }
    }

    function hasClaim(address claimer, address policyBookAddress) external view returns (bool) {
        return _myClaims[claimer].contains(_allClaimsToIndex[policyBookAddress][claimer]);
    }

    // test purpose :
    // same function than original contract, but not execute BMI transfer through ClaimVoting
    function withdrawClaim(uint256 index) public override {
        address claimer = _allClaimsByIndexInfo[index].claimer;
        require(claimer == msg.sender, "ClaimingRegistry: Not the claimer");
        require(
            getClaimWithdrawalStatus(index) == WithdrawalStatus.READY,
            "ClaimingRegistry: Withdrawal is not ready"
        );

        address policyBookAddress = _allClaimsByIndexInfo[index].policyBookAddress;

        uint256 claimRefundConverted =
            DecimalsConverter.convertFrom18(
                _allClaimsByIndexInfo[index].claimRefund,
                stblDecimals
            );

        uint256 _actualAmount =
            capitalPool.fundClaim(claimer, claimRefundConverted, policyBookAddress);

        claimRefundConverted = claimRefundConverted.sub(_actualAmount);

        if (!claimWithdrawalInfo[index].committed) {
            IPolicyBook(policyBookAddress).commitWithdrawnClaim(msg.sender);
            claimWithdrawalInfo[index].committed = true;
        }

        if (claimRefundConverted == 0) {
            _allClaimsByIndexInfo[index].claimRefund = 0;
            _withdrawClaimRequestIndexList.remove(index);
            delete claimWithdrawalInfo[index];
        } else {
            _allClaimsByIndexInfo[index].claimRefund = DecimalsConverter.convertTo18(
                claimRefundConverted,
                stblDecimals
            );
            _requestClaimWithdrawal(claimer, index);
        }

        //claimVoting.transferLockedBMI(index, claimer);

        emit ClaimWithdrawn(
            msg.sender,
            DecimalsConverter.convertTo18(_actualAmount, stblDecimals)
        );
    }

    // test purpose :
    // same function than original contract, but not execute BMI transfer through ClaimVoting
    function withdrawLockedBMI(uint256 index) public override {
        address claimer = _allClaimsByIndexInfo[index].claimer;
        require(claimer == msg.sender, "ClaimingRegistry: Not the claimer");

        require(
            canWithdrawLockedBMI(index),
            "ClaimingRegistry: Claim is not expired or can still be withdrawn"
        );

        address policyBookAddress = _allClaimsByIndexInfo[index].policyBookAddress;
        if (claimStatus(index) == ClaimStatus.ACCEPTED) {
            IPolicyBook(policyBookAddress).commitWithdrawnClaim(claimer);
            _withdrawClaimRequestIndexList.remove(index);
            delete claimWithdrawalInfo[index];
        }

        //claimVoting.transferLockedBMI(index, claimer);
    }
}
