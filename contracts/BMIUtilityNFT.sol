// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/utils/Strings.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./abstract/AbstractDependant.sol";

import "./tokens/ERC1155Upgradeable.sol";

contract BMIUtilityNFT is OwnableUpgradeable, ERC1155Upgradeable, AbstractDependant {
    uint256 private constant NFT_TYPES_COUNT = 4;
    uint256 private constant LEADERBOARD_SIZE = 10;

    address public liquidityMiningAddress;

    bool public nftsMinted;

    function __BMIUtilityNFT_init() external initializer {
        __Ownable_init();
        __ERC1155_init("");
    }

    function setDependencies(IContractsRegistry _contractsRegistry)
        external
        override
        onlyInjectorOrZero
    {}

    /// @dev the output URI will be: "https://token-cdn-domain/<tokenId>"
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(super.uri(0), Strings.toString(tokenId)));
    }

    /// @dev this is a correct URI: "https://token-cdn-domain/"
    function setBaseURI(string calldata newURI) external onlyOwner {
        _setURI(newURI);
    }

    function mintNFTs(
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _amounts
    ) external onlyOwner {
        _mintBatch(_to, _ids, _amounts, "");
    }
}
