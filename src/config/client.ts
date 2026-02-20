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
