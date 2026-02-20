import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { makePublicClient } from "@/config/client";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const publicClient = makePublicClient();

function App() {
  const { theme, toggleTheme } = useTheme();
  const [spotIndex, setSpotIndex] = useState("");
  const [rawResult, setRawResult] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    setRawResult(null);

    try {
      const data = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getSpotPx",
        args: [BigInt(spotIndex.trim() || "1460")],
      });

      setRawResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("SpotPxPrecompileFailed")) {
          setError("Spot price precompile call failed. Check the spot index.");
        } else if (msg.includes("reverted")) {
          setError("Contract call reverted. Check your input.");
        } else {
          setError(msg.length > 200 ? msg.slice(0, 200) + "..." : msg);
        }
      } else {
        setError("Query failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const usdPrice =
    rawResult !== null ? (Number(rawResult) / 1000).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-6 py-16">
        <header className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold tracking-tight">
              HyperEVM Precompile Demo
            </h1>
            <button
              onClick={toggleTheme}
              className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Read a spot price from HyperCore L1 via a smart contract precompile.
            No oracles, no bridges — the value comes directly from the L1 order
            book at block construction time.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spot Price</CardTitle>
            <CardDescription>
              Query the current price for a spot market by its index. Enter 1460
              for VHYPUR/USDC on testnet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="spot-index"
                  className="text-sm font-medium text-foreground"
                >
                  Spot Index
                </label>
                <Input
                  id="spot-index"
                  placeholder="1460"
                  value={spotIndex}
                  onChange={(e) => setSpotIndex(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) handleQuery();
                  }}
                />
              </div>

              <Button
                onClick={handleQuery}
                disabled={loading}
                className="w-full"
                size="sm"
              >
                {loading ? "Querying..." : "Query"}
              </Button>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {rawResult !== null && !error && (
                <div className="rounded-md bg-muted/50 border border-border p-3 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      raw
                    </span>
                    <span className="font-mono text-sm break-all">
                      {rawResult.toString()}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      USD
                    </span>
                    <span className="font-mono text-sm">${usdPrice}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          Reading from contract{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
            0x5911...1d9b
          </code>{" "}
          on HyperEVM Testnet
        </footer>
      </div>
    </div>
  );
}

export default App;
