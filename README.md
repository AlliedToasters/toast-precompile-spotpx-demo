# HyperEVM Precompile Demo

Workshop demo showing how to read HyperCore L1 state from HyperEVM smart contracts, built for **Hyperliquid testnet**.

HyperEVM exposes **read precompiles** — fixed system addresses that let any smart contract query L1 order book data (prices, balances, positions, etc.) via `staticcall`. No oracles, no bridges — the precompile returns the exact L1 state at block construction time.

## Smart Contract

[`contracts/src/PrecompileReader.sol`](contracts/src/PrecompileReader.sol) — a Solidity wrapper that exposes all 17 HyperCore read precompiles as typed view functions. For example, reading the spot price of any token:

```solidity
function getSpotPx(uint64 spotIndex) external view returns (uint64) {
    return PrecompileLib.spotPx(spotIndex);
}
```

Under the hood, `PrecompileLib` does a `staticcall` to the system precompile at `0x808`. The full list of precompile addresses is in the [Hyperliquid docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore).

## Frontend

A React UI that calls the wrapper contract's view functions via `eth_call`, letting you query any precompile from the browser without writing code.

## Setup

```bash
corepack enable
yarn install
yarn dev
```

## Deploying the Contract

Requires [Foundry](https://book.getfoundry.sh/) and a funded testnet wallet:

```bash
cd contracts
forge build
forge create --broadcast --rpc-url https://rpc.hyperliquid-testnet.xyz/evm \
    --private-key $TESTNET_PRIVATE_KEY --legacy \
    src/PrecompileReader.sol:PrecompileReader
```

Then update `src/config/contract.ts` with the deployed address.

## Credits

Frontend adapted from [chase-manning/hyperevm-precompile-ui](https://github.com/chase-manning/hyperevm-precompile-ui). Smart contract uses [hyperliquid-dev/hyper-evm-lib](https://github.com/hyperliquid-dev/hyper-evm-lib).
