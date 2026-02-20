# HyperEVM Precompile Demo

Workshop demo showing how to read a spot price from HyperCore L1 via a HyperEVM smart contract, built for **Hyperliquid testnet**.

HyperEVM exposes **read precompiles** -- fixed system addresses that let any smart contract query L1 order book data (prices, balances, positions) via `staticcall`. No oracles, no bridges -- the precompile returns the exact L1 state at block construction time.

## Smart Contract

[`contracts/src/PrecompileReader.sol`](contracts/src/PrecompileReader.sol) wraps HyperCore read precompiles as typed view functions. The frontend uses `getSpotPx`:

```solidity
function getSpotPx(uint64 spotIndex) external view returns (uint64) {
    return PrecompileLib.spotPx(spotIndex);
}
```

Under the hood, `PrecompileLib` does a `staticcall` to the system precompile at `0x808`. The full list of precompile addresses is in the [Hyperliquid docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore).

## Frontend

A single-page React app that calls `getSpotPx` via `eth_call` and displays the raw uint64 value alongside the computed USD price.

## Setup

```bash
corepack enable
yarn install
yarn dev
```

Enter spot index `1460` to query the VHYPUR/USDC price on testnet.

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
