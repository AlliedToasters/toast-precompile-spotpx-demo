// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {PrecompileLib} from "hyper-evm-lib/src/PrecompileLib.sol";

/// @title PrecompileReader
/// @notice Wrapper exposing HyperCore read precompiles as public view functions.
/// @dev Matches the ABI of chase-manning's mainnet deployment so the frontend works as-is.
contract PrecompileReader {
    // --- System ---
    function getL1BlockNumber() external view returns (uint64) {
        return PrecompileLib.l1BlockNumber();
    }

    // --- User ---
    function getCoreUserExists(address user) external view returns (bool) {
        return PrecompileLib.coreUserExists(user);
    }

    function getWithdrawable(address user) external view returns (uint64) {
        return PrecompileLib.withdrawable(user);
    }

    // --- Perps ---
    function getOraclePx(uint32 perpIndex) external view returns (uint64) {
        return PrecompileLib.oraclePx(perpIndex);
    }

    function getMarkPx(uint32 perpIndex) external view returns (uint64) {
        return PrecompileLib.markPx(perpIndex);
    }

    function getBbo(uint64 asset) external view returns (PrecompileLib.Bbo memory) {
        return PrecompileLib.bbo(asset);
    }

    function getPerpAssetInfo(uint32 perp) external view returns (PrecompileLib.PerpAssetInfo memory) {
        return PrecompileLib.perpAssetInfo(perp);
    }

    function getPosition(address user, uint16 perp) external view returns (PrecompileLib.Position memory) {
        return PrecompileLib.position(user, perp);
    }

    function getAccountMarginSummary(uint32 perpDexIndex, address user)
        external view returns (PrecompileLib.AccountMarginSummary memory)
    {
        return PrecompileLib.accountMarginSummary(perpDexIndex, user);
    }

    // --- Spot ---
    function getSpotBalance(address user, uint64 token)
        external view returns (PrecompileLib.SpotBalance memory)
    {
        return PrecompileLib.spotBalance(user, token);
    }

    function getSpotInfo(uint64 spotIndex) external view returns (PrecompileLib.SpotInfo memory) {
        return PrecompileLib.spotInfo(spotIndex);
    }

    function getSpotPx(uint64 spotIndex) external view returns (uint64) {
        return PrecompileLib.spotPx(spotIndex);
    }

    function getTokenInfo(uint64 token) external view returns (PrecompileLib.TokenInfo memory) {
        return PrecompileLib.tokenInfo(token);
    }

    function getTokenSupply(uint64 token) external view returns (PrecompileLib.TokenSupply memory) {
        return PrecompileLib.tokenSupply(token);
    }

    // --- Vaults ---
    function getUserVaultEquity(address user, address vault)
        external view returns (PrecompileLib.UserVaultEquity memory)
    {
        return PrecompileLib.userVaultEquity(user, vault);
    }

    // --- Staking ---
    function getDelegations(address user) external view returns (PrecompileLib.Delegation[] memory) {
        return PrecompileLib.delegations(user);
    }

    function getDelegatorSummary(address user) external view returns (PrecompileLib.DelegatorSummary memory) {
        return PrecompileLib.delegatorSummary(user);
    }
}
