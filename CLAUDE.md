# HyperEVM Precompile Demo

Workshop demo for ETH Denver showing how to read HyperCore state from HyperEVM smart contracts. Based on [chase-manning/hyperevm-precompile-ui](https://github.com/chase-manning/hyperevm-precompile-ui), adapted for **Hyperliquid testnet** using the **VHYPUR** spot market.

---

## What This Is

HyperEVM exposes **read precompiles** — fixed system addresses that let any smart contract query HyperCore L1 state (prices, balances, positions, etc.) via `staticcall`. This app demonstrates:

1. A Solidity contract that wraps precompile calls into typed view functions
2. A React frontend that calls those view functions via standard EVM RPC (`eth_call`)

The key insight: **you can read native L1 order book data from a smart contract**. No oracles, no bridges, no latency — the precompile returns the exact L1 state at block construction time.

---

## Architecture

```
┌─ Frontend (React + viem) ─────────────────────────────────┐
│  eth_call to wrapper contract                              │
└────────────────┬───────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────┐
│  PrecompileReader.sol (deployed on HyperEVM testnet)       │
│  - getSpotPx(spotIndex) → uint64                           │
│  - getTokenInfo(tokenIndex) → TokenInfo struct             │
│  - getBbo(asset) → Bbo struct (bid/ask)                    │
│  - ... (all 17 precompile wrappers)                        │
└────────────────┬───────────────────────────────────────────┘
                 │ staticcall
┌────────────────▼───────────────────────────────────────────┐
│  System Precompiles (0x800 - 0x810)                        │
│  Native HyperCore state, updated every L1 block            │
└────────────────────────────────────────────────────────────┘
```

---

## VHYPUR Market (Testnet)

This demo uses the VHYPUR/USDC spot pair — a fractionalized NFT token (Hypurr collection) with an active market maker on testnet.

| Parameter | Value |
|-----------|-------|
| **Token name** | VHYPUR |
| **Token index** | 1587 |
| **Token ID** | `0x84290290c3427e8a6c71c8f5bda0bf2c` |
| **Spot pair index** | **1460** (this is what `getSpotPx` takes!) |
| **szDecimals** | 5 |
| **weiDecimals** | 10 |
| **EVM wrapper contract** | `0x591107f6cc706d2abf10763def3bd85dddfe1d9b` |
| **Collection** | Hypurr (4600 NFTs) |

**Price decoding:** `getSpotPx(1460)` returns a `uint64`. To get USD price:
```
price_usd = raw_value / 10^(8 - szDecimals) = raw_value / 10^3 = raw_value / 1000
```

Example: raw `22595000` → $22,595.00 per VHYPUR

---

## System Precompile Addresses

These are the same on testnet and mainnet. Each accepts ABI-encoded args via `staticcall`.

| Address | Function | Input | Output |
|---------|----------|-------|--------|
| `0x800` | Position | `(address user, uint16 perp)` | Position struct |
| `0x801` | Spot Balance | `(address user, uint64 token)` | SpotBalance struct |
| `0x802` | Vault Equity | `(address user, address vault)` | UserVaultEquity struct |
| `0x803` | Withdrawable | `(address user)` | uint64 |
| `0x804` | Delegations | `(address user)` | Delegation[] |
| `0x805` | Delegator Summary | `(address user)` | DelegatorSummary struct |
| `0x806` | Mark Price | `(uint32 perpIndex)` | uint64 |
| `0x807` | Oracle Price | `(uint32 perpIndex)` | uint64 |
| `0x808` | Spot Price | `(uint64 spotIndex)` | uint64 |
| `0x809` | L1 Block Number | `()` | uint64 |
| `0x80a` | Perp Asset Info | `(uint32 perp)` | PerpAssetInfo struct |
| `0x80b` | Spot Info | `(uint64 spotIndex)` | SpotInfo struct |
| `0x80c` | Token Info | `(uint64 token)` | TokenInfo struct |
| `0x80d` | Token Supply | `(uint64 token)` | TokenSupply struct |
| `0x80e` | BBO (Best Bid/Offer) | `(uint64 asset)` | Bbo struct (bid, ask) |
| `0x80f` | Account Margin Summary | `(uint32 dexIndex, address user)` | AccountMarginSummary struct |
| `0x810` | Core User Exists | `(address user)` | bool |

---

## Setup: Clone and Adapt

### Step 1: Clone the upstream repo

```bash
git clone https://github.com/chase-manning/hyperevm-precompile-ui.git .
```

### Step 2: Install dependencies

```bash
corepack enable   # if yarn isn't available
yarn install
```

### Step 3: Adapt for testnet

Two files need changes:

**`src/config/client.ts`** — Change chain ID and RPC:
```ts
import { createPublicClient, http, defineChain } from "viem";

export const DEFAULT_RPC_URL = "https://rpc.hyperliquid-testnet.xyz/evm";

export const hyperEvmTestnet = defineChain({
  id: 998,
  name: "HyperEVM Testnet",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: {
    default: { http: [DEFAULT_RPC_URL] },
  },
});

export function makePublicClient(rpcUrl?: string) {
  return createPublicClient({
    chain: hyperEvmTestnet,
    transport: http(rpcUrl || DEFAULT_RPC_URL),
  });
}
```

**`src/config/contract.ts`** — Update the contract address after deploying (Step 4):
```ts
export const CONTRACT_ADDRESS = "0x_YOUR_DEPLOYED_ADDRESS_HERE" as const;
// ABI stays the same — same wrapper interface
```

### Step 4: Deploy the wrapper contract on testnet

The upstream project reads from a wrapper contract at `0x4e4726F2D4F652151Eb80254C2C8859d152382Ce` on **mainnet**. We need to deploy the same contract on testnet.

The wrapper source isn't in the upstream repo, but it's straightforward — it wraps each precompile `staticcall` into a typed Solidity view function. The official library is at [hyperliquid-dev/hyper-evm-lib](https://github.com/hyperliquid-dev/hyper-evm-lib).

**Option A: Deploy a minimal wrapper using hyper-evm-lib**

Create a Foundry project with the wrapper:

```bash
forge init contracts --no-commit
cd contracts
forge install hyperliquid-dev/hyper-evm-lib --no-commit
```

Write `src/PrecompileReader.sol`:
```solidity
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
```

Deploy on testnet:
```bash
# From contracts/ directory
forge create --broadcast --rpc-url https://rpc.hyperliquid-testnet.xyz/evm \
    --private-key $TESTNET_PRIVATE_KEY --legacy \
    src/PrecompileReader.sol:PrecompileReader
```

**IMPORTANT:** HyperEVM requires `--legacy` flag (no EIP-1559). Do NOT use `forge script` — it doesn't work on chain 998.

**Option B: Call precompiles directly from the frontend (no wrapper)**

You can skip the wrapper entirely and call the raw precompile addresses. In `contract.ts`, set `CONTRACT_ADDRESS` to the precompile addresses directly. However, since each precompile is at a different address and has raw ABI-encoded I/O (no function selectors), the wrapper contract approach is cleaner for the frontend.

### Step 5: Update contract address and run

After deploying, update `src/config/contract.ts` with the deployed address, then:

```bash
yarn dev
```

The app should now read VHYPUR data on testnet. Try:
- **Spot Price** → enter spot index `1460`
- **Token Info** → enter token index `1587`
- **BBO** → enter spot index `1460` to see bid/ask
- **L1 Block Number** → no input needed

### Step 6: Verify with cast (debugging)

```bash
# Raw precompile call for VHYPUR spot price (spot index 1460)
cast call 0x0000000000000000000000000000000000000808 \
    "$(cast abi-encode 'f(uint64)' 1460)" \
    --rpc-url https://rpc.hyperliquid-testnet.xyz/evm

# Via deployed wrapper
cast call $WRAPPER_ADDRESS "getSpotPx(uint64)(uint64)" 1460 \
    --rpc-url https://rpc.hyperliquid-testnet.xyz/evm
```

---

## Workshop Flow (ETH Denver)

Suggested workshop structure:

1. **Explain the concept** (5 min) — HyperEVM precompiles bridge L1 state into EVM contracts
2. **Show the raw precompile call** (5 min) — `cast call 0x808 ...` to read VHYPUR price
3. **Walk through the wrapper contract** (10 min) — PrecompileReader.sol, explain `staticcall`
4. **Deploy together** (10 min) — `forge create` on testnet, everyone deploys their own
5. **Run the frontend** (10 min) — Point at testnet, see live VHYPUR price updating
6. **Discuss use cases** (10 min) — DeFi composability, on-chain oracles, liquidation bots, etc.

**Key talking points:**
- Precompiles give you **zero-latency L1 data** in EVM — no oracle delay, no bridge
- The data is **guaranteed consistent** with L1 state at block construction time
- Any contract can read prices, positions, balances — enables novel DeFi composability
- VHYPUR is a real fractionalized NFT token with an active market maker

---

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Blockchain interaction:** viem (typed EVM client)
- **Styling:** shadcn/ui + Tailwind CSS v4
- **Contracts:** Foundry + hyper-evm-lib

## Network Config

| | Testnet | Mainnet (upstream) |
|---|---------|-------------------|
| Chain ID | 998 | 999 |
| RPC | `https://rpc.hyperliquid-testnet.xyz/evm` | `https://rpc.hyperliquid.xyz/evm` |
| Block explorer | N/A | `https://hyperevmscan.io` |
| API | `https://api.hyperliquid-testnet.xyz` | `https://api.hyperliquid.xyz` |

## Foundry Remappings

If using `hyper-evm-lib`, add to `contracts/foundry.toml`:
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
remappings = ["hyper-evm-lib/=lib/hyper-evm-lib/"]
```

## References

- [Hyperliquid docs: Interacting with HyperCore](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore)
- [hyper-evm-lib (official)](https://github.com/hyperliquid-dev/hyper-evm-lib)
- [chase-manning/hyperevm-precompile-ui (upstream)](https://github.com/chase-manning/hyperevm-precompile-ui)
- [QuickNode guide: Read Oracle Prices](https://www.quicknode.com/guides/hyperliquid/read-hypercore-oracle-prices-in-hyperevm)
