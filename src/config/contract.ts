export const CONTRACT_ADDRESS =
  "0x5d8A6DA426C446FfC8aAE5d14FA4305c11fe126F" as const;

export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "PrecompileLib__SpotPxPrecompileFailed",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint64", name: "spotIndex", type: "uint64" },
    ],
    name: "getSpotPx",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
