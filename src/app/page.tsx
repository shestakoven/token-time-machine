
'use client';

import {Calendar} from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  calculateProfitLoss,
  CalculateProfitLossInput,
  CalculateProfitLossOutput,
} from '@/ai/flows/calculate-profit-loss';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import {useState, useEffect, useCallback} from 'react';
import {useToast} from '@/hooks/use-toast';
import {format} from 'date-fns';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Trash2, RefreshCw, DollarSign, Send, XCircle, Briefcase, TrendingUp, TrendingDown, AlertTriangle, Info, CalendarIcon } from 'lucide-react';
import {Separator} from '@/components/ui/separator';
import {getTokenInfo} from '@/services/token-price';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface CalculationHistoryItem {
  tokenName: string;
  tokenSymbol: string; // Added token symbol
  purchaseDate: string; // YYYY-MM-DD
  purchaseAmountUSD: number;
  result: CalculateProfitLossOutput;
  id: string; // Unique identifier for each history item
}

const formatDateForDisplay = (dateString: string): string => {
  // Assuming dateString is "YYYY-MM-DD"
  // Add 1 day to correctly parse UTC date as local for display if necessary,
  // or ensure consistent UTC handling throughout.
  // For simplicity, directly parsing might be fine if purchaseDate is stored and handled as UTC.
  try {
    return format(new Date(dateString + "T00:00:00Z"), 'MMM d, yyyy'); // Treat as UTC
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return dateString; // Fallback to raw string
  }
};

const formatDateForInput = (date: Date | undefined): string => {
  return date ? format(date, 'yyyy-MM-dd') : '';
};


const formatNumber = (value: number | undefined, precision = 5): string => {
  if (value === undefined || value === null || isNaN(value)) return '0.00000'; // Handle NaN
  
  // For very small non-zero numbers, potentially use exponential or more precision
  if (Math.abs(value) < 0.00001 && value !== 0) {
    const exponential = value.toExponential(Math.max(2, precision - 3)); // Ensure some significant figures
    // Check if exponential is "0.00e+0" or similar, if so, fall back to toFixed with higher precision
    if (parseFloat(exponential) !== 0 && Math.abs(parseFloat(exponential)) > 1e-10) return exponential;
    // If exponential is still too close to zero, or precision is low, use toFixed with higher precision
    return value.toFixed(Math.max(precision, 8)); // show more for very small numbers
  }

  // Ensure a minimum number of decimal places for consistency if it's a very small number
  if (Math.abs(value) < 1 && value !== 0 && precision < 8) {
    const numStr = value.toString();
    const decimalIndex = numStr.indexOf('.');
    if (decimalIndex !== -1) {
      const decimalPlaces = numStr.length - decimalIndex - 1;
      if (decimalPlaces > precision) {
        let tempPrecision = precision;
        let formatted = value.toFixed(tempPrecision);
        while (parseFloat(formatted) === 0 && value !== 0 && tempPrecision < 10) {
          tempPrecision++;
          formatted = value.toFixed(tempPrecision);
        }
        if (parseFloat(formatted) !== 0) return formatted;
      }
    }
  }
  return value.toFixed(precision);
};


const ResultDisplay = ({
  result,
  tokenName, // Pass tokenName for context if needed, though symbol is now in result
}: {
  result: CalculateProfitLossOutput | undefined;
  tokenName?: string; 
}) => {
  if (!result) return null;
  const isProfit = result.profitLoss >= 0;
  const profitLossColor = isProfit ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  const profitLossText = isProfit ? 'Profit' : 'Loss';
  const ProfitLossIcon = isProfit ? TrendingUp : TrendingDown;

  return (
    <Card className="mt-6 bg-background/50 dark:bg-card/80 border-border/60 rounded-xl shadow-lg overflow-hidden">
      <CardHeader className="p-4 bg-muted/30 dark:bg-muted/20 border-b border-border/60">
        <CardTitle className="text-lg font-semibold text-foreground dark:text-gray-100">
          Calculation Results for {result.tokenSymbol}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Price at Purchase:</p>
            <p className="font-semibold text-foreground dark:text-gray-200">${formatNumber(result.priceAtPurchase)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Quantity Purchased:</p>
            <p className="font-semibold text-foreground dark:text-gray-200">{formatNumber(result.quantityPurchased, 8)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Current Price:</p>
            <p className="font-semibold text-foreground dark:text-gray-200">${formatNumber(result.currentPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Current Value:</p>
            <p className="font-semibold text-foreground dark:text-gray-200">${formatNumber(result.currentValue, 2)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className={`p-4 bg-opacity-10 flex items-center space-x-2 ${isProfit ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-red-500/10 dark:bg-red-500/20'}`}>
        <ProfitLossIcon className={`h-6 w-6 shrink-0 ${profitLossColor}`} />
        <div>
          <p className={`text-sm font-medium ${profitLossColor}`}>{profitLossText}:</p>
          <p className={`text-2xl font-bold ${profitLossColor}`}>
            ${formatNumber(result.profitLoss, 2)}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

const InputFields = ({
  tokenName,
  setTokenName,
  purchaseDate,
  setPurchaseDate,
  purchaseAmountUSD,
  setPurchaseAmountUSD,
}: {
  tokenName: string;
  setTokenName: React.Dispatch<React.SetStateAction<string>>;
  purchaseDate: Date | undefined;
  setPurchaseDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  purchaseAmountUSD: string;
  setPurchaseAmountUSD: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <>
    <div className="space-y-1.5">
      <Label htmlFor="token-name" className="text-sm font-medium text-foreground dark:text-gray-300">Token Name or Symbol</Label>
      <Input
        id="token-name"
        placeholder="e.g., Bitcoin, ETH, 0xaddress..."
        value={tokenName}
        onChange={e => setTokenName(e.target.value)}
        className="bg-background/70 dark:bg-gray-800/70 border-border/70 focus:border-primary focus:ring-primary dark:focus:border-primary dark:focus:ring-primary"
      />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="purchase-date" className="text-sm font-medium text-foreground dark:text-gray-300">Purchase Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="purchase-date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal bg-background/70 dark:bg-gray-800/70 border-border/70 hover:bg-muted/50 dark:hover:bg-gray-700/50',
              !purchaseDate && 'text-muted-foreground dark:text-gray-500'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {purchaseDate ? format(purchaseDate, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={purchaseDate}
            onSelect={setPurchaseDate}
            disabled={date => date > new Date() || date < new Date('2009-01-03')} // Bitcoin genesis
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="purchase-amount" className="text-sm font-medium text-foreground dark:text-gray-300">Investment Amount (USD)</Label>
      <Input
        id="purchase-amount"
        type="number"
        placeholder="e.g., 100"
        value={purchaseAmountUSD}
        onChange={e => setPurchaseAmountUSD(e.target.value)}
        min="0.00000001" 
        step="any" 
        className="bg-background/70 dark:bg-gray-800/70 border-border/70 focus:border-primary focus:ring-primary dark:focus:border-primary dark:focus:ring-primary"
      />
    </div>
  </>
);

const HistoryItem = ({
  item,
  onRemove,
  onRefresh,
  onSell,
}: {
  item: CalculationHistoryItem;
  onRemove: (id: string) => void;
  onRefresh: (item: CalculationHistoryItem) => void;
  onSell: (item: CalculationHistoryItem, targetProfit: number) => void;
}) => {
  const isProfit = item.result.profitLoss >= 0;
  const profitLossColor = isProfit ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  const profitLossText = isProfit ? 'Profit' : 'Loss';
  const ProfitLossIcon = isProfit ? TrendingUp : TrendingDown;

  const [showSellInput, setShowSellInput] = useState(false);
  const [targetProfit, setTargetProfit] = useState('');

  const handleSellClick = () => {
    if (targetProfit && !isNaN(parseFloat(targetProfit))) {
      onSell(item, parseFloat(targetProfit));
      setShowSellInput(false); // Optionally hide after "selling"
      // setTargetProfit(''); // Optionally clear input
    } else {
      // Maybe show a small validation message or toast
      console.warn("Target profit for sell is invalid.");
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
    <Card className="mb-3 border-border/50 dark:border-gray-700/60 bg-card/90 dark:bg-gray-800/70 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out rounded-lg">
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <p className="font-semibold text-md text-foreground dark:text-gray-100 flex items-center">
              {item.tokenName} 
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-mono dark:bg-primary/20 dark:text-primary-foreground/80">
                {item.tokenSymbol}
              </span>
            </p>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">
              Invested ${formatNumber(item.purchaseAmountUSD, 2)} on {formatDateForDisplay(item.purchaseDate)}
            </p>
          </div>
          <div className="flex space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary dark:hover:text-primary-foreground/90" onClick={() => onRefresh(item)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Refresh current price</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-emerald-500 dark:hover:text-emerald-400" onClick={() => setShowSellInput(!showSellInput)}>
                  <DollarSign className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Simulate Sell Order</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive dark:hover:text-red-500" onClick={() => onRemove(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Remove from history</p></TooltipContent>
            </Tooltip>
          </div>
        </div>

        {showSellInput && (
          <div className="mt-2.5 mb-3 p-3 bg-muted/60 dark:bg-gray-700/50 rounded-md border border-border/50 dark:border-gray-600/70">
            <Label htmlFor={`sell-target-${item.id}`} className="text-xs font-medium text-muted-foreground dark:text-gray-400">Target Profit ($) for Sell</Label>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <Input
                id={`sell-target-${item.id}`}
                type="number"
                placeholder="e.g., 100"
                value={targetProfit}
                onChange={(e) => setTargetProfit(e.target.value)}
                className="h-8 text-sm flex-grow bg-background/80 dark:bg-gray-800/80 border-border/70 focus:border-primary"
                step="any"
              />
              <Button variant="outline" size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-primary-foreground border-emerald-500 hover:border-emerald-600" onClick={handleSellClick}>
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive dark:hover:text-red-500" onClick={() => setShowSellInput(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-1.5">Current Profit: <span className={profitLossColor}>${formatNumber(item.result.profitLoss, 2)}</span></p>
          </div>
        )}

        <Separator className="my-2.5 bg-border/40 dark:bg-gray-700/40" />
        
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div>
            <p className="text-muted-foreground dark:text-gray-400">Qty Purchased:</p>
            <p className="font-medium text-foreground dark:text-gray-200">{formatNumber(item.result.quantityPurchased, 8)}</p>
          </div>
          <div>
            <p className="text-muted-foreground dark:text-gray-400">Price at Purchase:</p>
            <p className="font-medium text-foreground dark:text-gray-200">${formatNumber(item.result.priceAtPurchase)}</p>
          </div>
          <div>
            <p className="text-muted-foreground dark:text-gray-400">Current Price:</p>
            <p className="font-medium text-foreground dark:text-gray-200">${formatNumber(item.result.currentPrice)}</p>
          </div>
           <div>
            <p className="text-muted-foreground dark:text-gray-400">Current Value:</p>
            <p className="font-medium text-foreground dark:text-gray-200">${formatNumber(item.result.currentValue, 2)}</p>
          </div>
        </div>

        <div className={`mt-2.5 flex items-center p-2.5 rounded-md ${isProfit ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-red-500/10 dark:bg-red-500/20'}`}>
          <ProfitLossIcon className={`h-5 w-5 mr-2 shrink-0 ${profitLossColor}`} />
          <div>
            <p className={`text-xs font-medium ${profitLossColor}`}>{profitLossText}:</p>
            <p className={`text-lg font-bold ${profitLossColor}`}>
              ${formatNumber(item.result.profitLoss, 2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};

const CalculationHistory = ({
  calculationHistory,
  onRemove,
  onClearHistory,
  onRefresh,
  onSell,
}: {
  calculationHistory: CalculationHistoryItem[];
  onRemove: (id: string) => void;
  onClearHistory: () => void;
  onRefresh: (item: CalculationHistoryItem) => void;
  onSell: (item: CalculationHistoryItem, targetProfit: number) => void;
}) => (
  <div className="h-full flex flex-col bg-muted/20 dark:bg-black/10">
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent rounded-none">
      <CardHeader className="flex flex-row justify-between items-center p-4 border-b border-border/50 dark:border-gray-700/50 sticky top-0 bg-background/70 dark:bg-gray-900/70 backdrop-blur-sm z-10">
        <CardTitle className="text-lg font-semibold text-foreground dark:text-gray-100">Calculation History</CardTitle>
        {calculationHistory.length > 0 && (
           <Button variant="outline" size="sm" onClick={onClearHistory} className="text-xs border-border/70 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive dark:border-gray-700/70 dark:hover:bg-red-500/20 dark:hover:border-red-500/50 dark:hover:text-red-400">
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4 no-scrollbar space-y-0">
        {calculationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground dark:text-gray-500 pt-10">
            <Briefcase className="h-12 w-12 mb-3 text-gray-400 dark:text-gray-600" />
            <p className="text-md font-medium">No calculations yet.</p>
            <p className="text-xs">Your past calculations will appear here.</p>
          </div>
        ) : (
          calculationHistory.map(item => (
            <HistoryItem
              key={item.id}
              item={item}
              onRemove={onRemove}
              onRefresh={onRefresh}
              onSell={onSell}
            />
          ))
        )}
      </CardContent>
    </Card>
  </div>
);

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const [tokenName, setTokenName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date()); // Default to today
  const [purchaseAmountUSD, setPurchaseAmountUSD] = useState('100'); // Default to 100
  const [calculationResult, setCalculationResult] = useState<CalculateProfitLossOutput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistoryItem[]>([]);

  const generateId = (): string => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  useEffect(() => {
    if (isClient) {
      const storedHistory = localStorage.getItem('calculationHistory_v3'); // Updated key
      if (storedHistory) {
        try {
          const parsedHistory = JSON.parse(storedHistory) as CalculationHistoryItem[];
          if (Array.isArray(parsedHistory) && parsedHistory.every(item => 
              item.hasOwnProperty('tokenName') &&
              item.hasOwnProperty('tokenSymbol') && // Check for new field
              item.hasOwnProperty('purchaseDate') &&
              item.hasOwnProperty('purchaseAmountUSD') &&
              item.hasOwnProperty('result') &&
              item.hasOwnProperty('id') &&
              item.result.hasOwnProperty('tokenSymbol') // Check for new field in result
          )) {
            setCalculationHistory(parsedHistory);
          } else {
             console.warn("Stored history format is incompatible or missing 'tokenSymbol'. Clearing for v3.");
             localStorage.removeItem('calculationHistory_v3'); 
          }
        } catch (e) {
          console.error("Error parsing stored history for v3:", e);
          localStorage.removeItem('calculationHistory_v3'); 
        }
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('calculationHistory_v3', JSON.stringify(calculationHistory));
    }
  }, [calculationHistory, isClient]);

  const calculateResult = useCallback(async () => {
    const parsedPurchaseAmountUSD = parseFloat(purchaseAmountUSD);

    if (!tokenName.trim()) {
      toast({ variant: 'destructive', title: 'Token Name Missing', description: 'Please enter a token name or symbol.'});
      return;
    }
    if (!purchaseDate) {
      toast({ variant: 'destructive', title: 'Purchase Date Missing', description: 'Please select a purchase date.'});
      return;
    }
    if (isNaN(parsedPurchaseAmountUSD)) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Purchase amount must be a valid number.'});
      return;
    }
    if (parsedPurchaseAmountUSD <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Purchase amount must be greater than zero.'});
      return;
    }

    setIsLoading(true);
    setCalculationResult(undefined); 
    try {
      const input: CalculateProfitLossInput = {
        tokenName: tokenName.trim(),
        purchaseDate: formatDateForInput(purchaseDate), 
        purchaseAmountUSD: parsedPurchaseAmountUSD,
      };

      const result = await calculateProfitLoss(input);
      setCalculationResult(result);

      const newHistoryItem: CalculationHistoryItem = {
        tokenName: input.tokenName, // Store the name used for search
        tokenSymbol: result.tokenSymbol, // Store the actual symbol from API
        purchaseDate: input.purchaseDate, 
        purchaseAmountUSD: input.purchaseAmountUSD,
        result,
        id: generateId(),
      };
      setCalculationHistory(prevHistory => [newHistoryItem, ...prevHistory.slice(0, 19)]); 

      toast({
        variant: 'default',
        className: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
        title: 'Calculation Successful',
        description: `Profit/loss for ${result.tokenSymbol} calculated.`,
      });
    } catch (error: any) {
      console.error('Error calculating profit/loss:', error);
      toast({
        variant: 'destructive',
        title: 'Calculation Error',
        description: error.message || 'Failed to calculate. The token might not exist or data is unavailable for the selected date.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tokenName, purchaseDate, purchaseAmountUSD, toast]); 

  const removeHistoryItem = (id: string) => {
    setCalculationHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    toast({ title: 'Item Removed', description: 'The calculation has been removed from history.' });
  };

  const clearHistory = () => {
    setCalculationHistory([]);
    toast({ title: 'History Cleared', description: 'All calculations have been removed from history.' });
  };

  const refreshHistoryItem = async (item: CalculationHistoryItem) => {
    toast({ title: `Refreshing ${item.tokenSymbol}...`, description: 'Fetching latest price data.' });
    setIsLoading(true); 
    try {
      const currentTokenInfo = await getTokenInfo(item.tokenName); // Use original tokenName for lookup
      const newCurrentPrice = currentTokenInfo.currentPrice;

      // Ensure we use the correct symbol from the new lookup, in case tokenName was ambiguous
      const refreshedTokenSymbol = currentTokenInfo.symbol; 

      const newCurrentValue = item.result.quantityPurchased * newCurrentPrice;
      const newProfitLoss = newCurrentValue - item.purchaseAmountUSD;

      const updatedResult: CalculateProfitLossOutput = {
        ...item.result, 
        tokenSymbol: refreshedTokenSymbol, // Update symbol from refresh
        currentPrice: newCurrentPrice,
        currentValue: newCurrentValue,
        profitLoss: newProfitLoss,
      };

      setCalculationHistory(prevHistory =>
        prevHistory.map(historyItem =>
          historyItem.id === item.id ? {...historyItem, tokenSymbol: refreshedTokenSymbol, result: updatedResult} : historyItem
        )
      );

      toast({
        variant: 'default',
        className: 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/30 dark:border-sky-500/40 text-sky-700 dark:text-sky-300',
        title: 'Item Refreshed',
        description: `Data for ${refreshedTokenSymbol} updated successfully.`,
      });
    } catch (error: any) {
      console.error('Error refreshing item:', error);
      toast({
        variant: 'destructive',
        title: 'Refresh Error',
        description: error.message || `Failed to refresh ${item.tokenSymbol || item.tokenName}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSellItem = (item: CalculationHistoryItem, targetProfit: number) => {
    console.log(`Simulated sell order for ${item.tokenSymbol} if profit reaches $${targetProfit}`);
    toast({
      variant: 'default',
      className: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 dark:border-amber-500/40 text-amber-700 dark:text-amber-300',
      title: 'Sell Order Placed (Simulated)',
      description: (
        <div>
          <p>Will "sell" {formatNumber(item.result.quantityPurchased, 8)} of {item.tokenSymbol}</p>
          <p>if profit target <span className="font-semibold">${formatNumber(targetProfit, 2)}</span> is reached.</p>
          <p>Current profit: <span className={`font-semibold ${item.result.profitLoss >=0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            ${formatNumber(item.result.profitLoss, 2)}
            </span></p>
        </div>
      ),
      duration: 7000,
    });
  };

  if (!isClient) {
    // Basic skeleton or loading state for SSR/initial load
    return (
        <div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 text-foreground dark:text-gray-100">
            <main className="flex flex-col justify-center items-center p-4 sm:p-6 md:w-1/2 w-full overflow-y-auto no-scrollbar">
                <div className="w-full max-w-md space-y-4 animate-pulse">
                    <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4"></div>
                    <div className="space-y-3 pt-2">
                        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                    </div>
                    <div className="h-12 bg-primary/50 rounded-md mt-4"></div>
                </div>
            </main>
            <aside className="md:w-1/2 w-full h-full md:max-h-screen md:border-l border-gray-200/70 dark:border-gray-800/70">
                 <div className="h-full flex flex-col bg-gray-100/50 dark:bg-black/20 p-4 animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-md mb-4 w-1/2"></div>
                    <div className="space-y-3">
                        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                    </div>
                 </div>
            </aside>
        </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 text-foreground dark:text-gray-100 font-sans">
      {/* Main Content Area (Calculation Form) */}
      <main className="flex flex-col justify-center items-center p-4 sm:p-6 md:w-1/2 lg:w-2/5 xl:w-1/3 w-full overflow-y-auto no-scrollbar">
        <Card className="w-full max-w-md shadow-2xl dark:shadow-black/50 bg-card dark:bg-gray-900/90 backdrop-blur-lg border-border/30 dark:border-gray-700/50 rounded-xl">
          <CardHeader className="border-b border-border/30 dark:border-gray-700/50 pb-4 pt-5 px-5">
            <CardTitle className="text-xl font-bold flex items-center text-primary dark:text-primary-foreground/90">
              <TrendingUp className="mr-2.5 h-6 w-6"/> Token Time Machine
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground dark:text-gray-400 pt-1">
              See how your crypto investments could have performed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 p-5">
            <InputFields
              tokenName={tokenName}
              setTokenName={setTokenName}
              purchaseDate={purchaseDate}
              setPurchaseDate={setPurchaseDate}
              purchaseAmountUSD={purchaseAmountUSD}
              setPurchaseAmountUSD={setPurchaseAmountUSD}
            />
            <Button
              onClick={calculateResult}
              disabled={isLoading}
              className="w-full text-base py-3 font-semibold bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 dark:text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:-translate-y-0.5"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : 'Calculate Value'}
            </Button>
            {calculationResult && <ResultDisplay result={calculationResult} tokenName={tokenName} />}
          </CardContent>
        </Card>
        <footer className="text-center mt-6 text-xs text-muted-foreground dark:text-gray-600">
          <p>&copy; {new Date().getFullYear()} Token Time Machine. All rights reserved.</p>
          <p className="mt-1">Data provided by DexGuru. For informational purposes only.</p>
        </footer>
      </main>

      {/* Sidebar Area (Calculation History) */}
      <aside className="md:w-1/2 lg:w-3/5 xl:w-2/3 w-full h-full md:max-h-screen md:border-l border-border/30 dark:border-gray-800/50">
        <CalculationHistory
          calculationHistory={calculationHistory}
          onRemove={removeHistoryItem}
          onClearHistory={clearHistory}
          onRefresh={refreshHistoryItem}
          onSell={handleSellItem}
        />
      </aside>
    </div>
  );
}

