// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../ClaimVoting.sol";

contract ClaimVotingMock is ClaimVoting {
    function getVotingResult(uint256 claimIndex)
        external
        view
        returns (
            uint256 withdrawalAmount,
            uint256 lockedBMIAmount,
            uint256 reinsuranceTokensAmount,
            uint256 votedAverageWithdrawalAmount,
            uint256 votedYesStakedStkBMIAmountWithReputation,
            uint256 votedNoStakedStkBMIAmountWithReputation,
            uint256 allVotedStakedStkBMIAmount,
            uint256 votedYesPercentage
        )
    {
        VotingResult storage votingResult = _votings[claimIndex];
        return (
            votingResult.withdrawalAmount,
            votingResult.lockedBMIAmount,
            votingResult.reinsuranceTokensAmount,
            votingResult.votedAverageWithdrawalAmount,
            votingResult.votedYesStakedStkBMIAmountWithReputation,
            votingResult.votedNoStakedStkBMIAmountWithReputation,
            votingResult.allVotedStakedStkBMIAmount,
            votingResult.votedYesPercentage
        );
    }

    function voteBatch(
        uint256[] calldata claimIndexes,
        uint256[] calldata suggestedClaimAmounts,
        bool[] calldata isConfirmed
    ) external {
        uint256 stakedStkBMI = stkBMIStaking.stakedStkBMI(msg.sender);

        for (uint256 i = 0; i < claimIndexes.length; i++) {
            uint256 claimIndex = claimIndexes[i];
            uint256 suggestedClaimAmount = suggestedClaimAmounts[i];
            bool voteFor = (suggestedClaimAmount > 0);

            _addAnonymousVote(msg.sender, claimIndex, 0, "", stakedStkBMI);

            if (isConfirmed[i]) {
                _calculateAverages(
                    claimIndex,
                    stakedStkBMI,
                    suggestedClaimAmount,
                    reputationSystem.reputation(msg.sender),
                    voteFor
                );
            }

            _modifyExposedVote(
                msg.sender,
                claimIndex,
                suggestedClaimAmount,
                voteFor,
                isConfirmed[i]
            );
        }
    }
}
