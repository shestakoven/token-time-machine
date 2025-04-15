"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateProfitLoss, CalculateProfitLossInput, CalculateProfitLossOutput } from "@/ai/flows/calculate-profit-loss";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalculationHistoryItem extends CalculateProfitLossInput {
  result: CalculateProfitLossOutput;
}

export default function Home() {
  const [tokenName, setTokenName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [profitLossResult, setProfitLossResult] = useState<CalculateProfitLossOutput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistoryItem[]>([]);

  useEffect(() => {
    // Load calculation history from local storage on component mount
    const storedHistory = localStorage.getItem("calculationHistory");
    if (storedHistory) {
      setCalculationHistory(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    // Save calculation history to local storage whenever it changes
    localStorage.setItem("calculationHistory", JSON.stringify(calculationHistory));
  }, [calculationHistory]);


  const calculateResult = async () => {
    if (!tokenName || !purchaseDate || !purchasePrice || !quantity) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const input: CalculateProfitLossInput = {
        tokenName,
        purchaseDate: format(purchaseDate, "yyyy-MM-dd"),
        purchasePrice,
        quantity,
      };
      const result = await calculateProfitLoss(input);
      setProfitLossResult(result);

      // Update calculation history
      setCalculationHistory(prevHistory => [
        ...prevHistory,
        {
          ...input,
          result,
        }
      ]);
    } catch (error: any) {
      console.error("Error calculating profit/loss:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to calculate profit/loss.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const profitColor = profitLossResult && profitLossResult.profitLoss >= 0 ? "text-green-500" : "text-red-500";
  const profitText = profitLossResult && profitLossResult.profitLoss >= 0 ? "Profit" : "Loss";

  return (
    <div className="flex justify-center items-start min-h-screen py-12 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Token Time Machine</CardTitle>
          <CardDescription>
            Enter the token details to calculate potential profit/loss.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="token-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Token Name/Symbol
            </label>
            <Input
              id="token-name"
              placeholder="e.g., BTC"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="purchase-date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Purchase Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !purchaseDate && "text-muted-foreground"
                  )}
                >
                  {purchaseDate ? format(purchaseDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={setPurchaseDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("2009-01-03")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <label htmlFor="purchase-price" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Purchase Price
            </label>
            <Input
              id="purchase-price"
              type="number"
              placeholder="e.g., 30000"
              value={purchasePrice === undefined ? "" : purchasePrice.toString()}
              onChange={(e) => setPurchasePrice(e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="quantity" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Quantity
            </label>
            <Input
              id="quantity"
              type="number"
              placeholder="e.g., 1"
              value={quantity === undefined ? "" : quantity.toString()}
              onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <Button onClick={calculateResult} disabled={isLoading}>
            {isLoading ? "Calculating..." : "Calculate"}
          </Button>

          {profitLossResult && (
            <div className="mt-4">
              <p>
                Current Price: ${profitLossResult.currentPrice.toFixed(2)}
              </p>
              <p className={profitColor}>
                {profitText}: ${profitLossResult.profitLoss.toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calculation History */}
      {calculationHistory.length > 0 && (
        <Card className="w-full max-w-md mt-4">
          <CardHeader>
            <CardTitle>Calculation History</CardTitle>
            <CardDescription>
              Past calculations for reference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full rounded-md border">
              <div className="p-4">
                {calculationHistory.map((item, index) => (
                  <div key={index} className="mb-4">
                    <p>Token: {item.tokenName}</p>
                    <p>Date: {item.purchaseDate}</p>
                    <p>Price: {item.purchasePrice}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p className={profitLossResult && profitLossResult.profitLoss >= 0 ? "text-green-500" : "text-red-500"}>
                      {profitLossResult && profitLossResult.profitLoss >= 0 ? "Profit" : "Loss"}: ${item.result.profitLoss.toFixed(2)}
                    </p>
                    <hr />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
