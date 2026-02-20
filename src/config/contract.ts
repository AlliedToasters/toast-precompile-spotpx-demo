export const CONTRACT_ADDRESS =
  "0x591107f6cc706d2abf10763def3bd85dddfe1d9b" as const;

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
