
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
import {Trash2, RefreshCw, DollarSign, Send, XCircle, Briefcase, TrendingUp, TrendingDown, CalendarIcon } from 'lucide-react';
import {Separator} from '@/components/ui/separator';
import {getTokenInfo} from '@/services/token-price';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface CalculationHistoryItem {
  tokenName: string; // User's original search input
  apiTokenName: string; // Name from API
  apiTokenSymbol: string; // Symbol from API
  purchaseDate: string; // YYYY-MM-DD
  purchaseAmountUSD: number;
  result: CalculateProfitLossOutput; // Contains apiTokenName and apiTokenSymbol from the calculation time
  id: string; 
}

const formatDateForDisplay = (dateString: string): string => {
  try {
    return format(new Date(dateString + "T00:00:00Z"), 'MMM d, yyyy'); 
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return dateString; 
  }
};

const formatDateForInput = (date: Date | undefined): string => {
  return date ? format(date, 'yyyy-MM-dd') : '';
};


const formatNumber = (value: number | undefined, precision = 5): string => {
  if (value === undefined || value === null || isNaN(value)) return '0.00000'; 
  
  if (Math.abs(value) < 0.00001 && value !== 0) {
    const exponential = value.toExponential(Math.max(2, precision - 3)); 
    if (parseFloat(exponential) !== 0 && Math.abs(parseFloat(exponential)) > 1e-10) return exponential;
    return value.toFixed(Math.max(precision, 8)); 
  }

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
}: {
  result: CalculateProfitLossOutput | undefined;
}) => {
  if (!result) return null;
  const isProfit = result.profitLoss >= 0;
  const profitLossColor = isProfit ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500';
  const profitLossText = isProfit ? 'Profit' : 'Loss';
  const ProfitLossIcon = isProfit ? TrendingUp : TrendingDown;

  return (
    <Card className="mt-6 bg-card border-border/70 rounded-lg shadow-sm">
      <CardHeader className="p-4 border-b border-border/70">
        <CardTitle className="text-md font-semibold text-foreground">
          Results for {result.apiTokenName} ({result.apiTokenSymbol})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2.5 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Price at Purchase:</p>
            <p className="font-medium text-foreground">${formatNumber(result.priceAtPurchase)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Qty Purchased:</p>
            <p className="font-medium text-foreground">{formatNumber(result.quantityPurchased, 8)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Price:</p>
            <p className="font-medium text-foreground">${formatNumber(result.currentPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Value:</p>
            <p className="font-medium text-foreground">${formatNumber(result.currentValue, 2)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className={`p-4 flex items-center space-x-2 rounded-b-lg ${isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        <ProfitLossIcon className={`h-5 w-5 shrink-0 ${profitLossColor}`} />
        <div>
          <p className={`text-xs font-medium ${profitLossColor}`}>{profitLossText}:</p>
          <p className={`text-xl font-bold ${profitLossColor}`}>
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
      <Label htmlFor="token-name" className="text-xs font-medium text-muted-foreground">Token Name or Symbol</Label>
      <Input
        id="token-name"
        placeholder="e.g., Bitcoin, ETH, 0xaddress..."
        value={tokenName}
        onChange={e => setTokenName(e.target.value)}
        className="bg-background border-border focus:border-primary focus:ring-primary text-sm"
      />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="purchase-date" className="text-xs font-medium text-muted-foreground">Purchase Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="purchase-date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal text-sm border-border hover:bg-muted/50',
              !purchaseDate && 'text-muted-foreground'
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
            disabled={date => date > new Date() || date < new Date('2009-01-03')}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="purchase-amount" className="text-xs font-medium text-muted-foreground">Investment Amount (USD)</Label>
      <Input
        id="purchase-amount"
        type="number"
        placeholder="e.g., 100"
        value={purchaseAmountUSD}
        onChange={e => setPurchaseAmountUSD(e.target.value)}
        min="0.00000001" 
        step="any" 
        className="bg-background border-border focus:border-primary focus:ring-primary text-sm"
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
  const profitLossColor = isProfit ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500';
  const profitLossText = isProfit ? 'Profit' : 'Loss';
  const ProfitLossIcon = isProfit ? TrendingUp : TrendingDown;

  const [showSellInput, setShowSellInput] = useState(false);
  const [targetProfit, setTargetProfit] = useState('');

  const handleSellClick = () => {
    if (targetProfit && !isNaN(parseFloat(targetProfit))) {
      onSell(item, parseFloat(targetProfit));
    } else {
      console.warn("Target profit for sell is invalid.");
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
    <Card className="mb-3 border-border/70 bg-card shadow-sm rounded-md">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-sm text-foreground flex items-center">
              {item.apiTokenName} 
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded-full font-mono">
                {item.apiTokenSymbol}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Invested ${formatNumber(item.purchaseAmountUSD, 2)} on {formatDateForDisplay(item.purchaseDate)}
            </p>
             <p className="text-xs text-muted-foreground/80 mt-0.5">
              (Searched as: {item.tokenName})
            </p>
          </div>
          <div className="flex space-x-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary" onClick={() => onRefresh(item)}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Refresh current price</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:text-emerald-500" onClick={() => setShowSellInput(!showSellInput)}>
                  <DollarSign className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Simulate Sell Order</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive" onClick={() => onRemove(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Remove from history</p></TooltipContent>
            </Tooltip>
          </div>
        </div>

        {showSellInput && (
          <div className="mt-2 mb-2.5 p-2.5 bg-muted/70 rounded-md border border-border/60">
            <Label htmlFor={`sell-target-${item.id}`} className="text-xs font-medium text-muted-foreground">Target Profit ($) for Sell</Label>
            <div className="flex items-center space-x-1.5 mt-1">
              <Input
                id={`sell-target-${item.id}`}
                type="number"
                placeholder="e.g., 100"
                value={targetProfit}
                onChange={(e) => setTargetProfit(e.target.value)}
                className="h-7 text-xs flex-grow bg-background border-border/80 focus:border-primary"
                step="any"
              />
              <Button variant="outline" size="icon" className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 hover:border-emerald-600" onClick={handleSellClick}>
                <Send className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setShowSellInput(false)}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-1">Current Profit: <span className={profitLossColor}>${formatNumber(item.result.profitLoss, 2)}</span></p>
          </div>
        )}

        <Separator className="my-2 bg-border/50" />
        
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-xs">
          <div>
            <p className="text-muted-foreground">Qty Purchased:</p>
            <p className="font-medium text-foreground">{formatNumber(item.result.quantityPurchased, 8)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Price at Purchase:</p>
            <p className="font-medium text-foreground">${formatNumber(item.result.priceAtPurchase)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current Price:</p>
            <p className="font-medium text-foreground">${formatNumber(item.result.currentPrice)}</p>
          </div>
           <div>
            <p className="text-muted-foreground">Current Value:</p>
            <p className="font-medium text-foreground">${formatNumber(item.result.currentValue, 2)}</p>
          </div>
        </div>

        <div className={`mt-2 flex items-center p-2 rounded-md ${isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          <ProfitLossIcon className={`h-4 w-4 mr-1.5 shrink-0 ${profitLossColor}`} />
          <div>
            <p className={`text-xs font-medium ${profitLossColor}`}>{profitLossText}:</p>
            <p className={`text-md font-bold ${profitLossColor}`}>
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
  <div className="h-full flex flex-col bg-muted/30">
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent rounded-none">
      <CardHeader className="flex flex-row justify-between items-center p-3.5 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <CardTitle className="text-md font-semibold text-foreground">Calculation History</CardTitle>
        {calculationHistory.length > 0 && (
           <Button variant="outline" size="sm" onClick={onClearHistory} className="text-xs h-7 border-border hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive">
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-3 no-scrollbar space-y-0">
        {calculationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-10">
            <Briefcase className="h-10 w-10 mb-2.5 text-gray-400" />
            <p className="text-sm font-medium">No calculations yet.</p>
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
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date()); 
  const [purchaseAmountUSD, setPurchaseAmountUSD] = useState('100'); 
  const [calculationResult, setCalculationResult] = useState<CalculateProfitLossOutput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistoryItem[]>([]);

  const generateId = (): string => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  // Load history from localStorage on client mount
  useEffect(() => {
    if (isClient) {
      const storedHistory = localStorage.getItem('calculationHistory_v4'); 
      if (storedHistory) {
        try {
          const parsedHistory = JSON.parse(storedHistory) as CalculationHistoryItem[];
          // Basic validation of stored data structure
          if (Array.isArray(parsedHistory) && parsedHistory.every(item => 
              item.hasOwnProperty('tokenName') && 
              item.hasOwnProperty('apiTokenName') && 
              item.hasOwnProperty('apiTokenSymbol') &&
              item.hasOwnProperty('purchaseDate') &&
              item.hasOwnProperty('purchaseAmountUSD') &&
              item.hasOwnProperty('result') &&
              item.result.hasOwnProperty('apiTokenName') &&
              item.result.hasOwnProperty('apiTokenSymbol') &&
              item.hasOwnProperty('id')
          )) {
            setCalculationHistory(parsedHistory);
          } else {
             console.warn("Stored history format is incompatible or missing required fields for v4. Clearing.");
             localStorage.removeItem('calculationHistory_v4'); 
          }
        } catch (e) {
          console.error("Error parsing stored history for v4:", e);
          localStorage.removeItem('calculationHistory_v4'); // Clear corrupted data
        }
      }
    }
  }, [isClient]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('calculationHistory_v4', JSON.stringify(calculationHistory));
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
        tokenName: input.tokenName, 
        apiTokenName: result.apiTokenName, // Store API provided name
        apiTokenSymbol: result.apiTokenSymbol, // Store API provided symbol
        purchaseDate: input.purchaseDate, 
        purchaseAmountUSD: input.purchaseAmountUSD,
        result,
        id: generateId(),
      };
      setCalculationHistory(prevHistory => [newHistoryItem, ...prevHistory.slice(0, 19)]); // Keep last 20 items

      toast({
        variant: 'default',
        className: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
        title: 'Calculation Successful',
        description: `Profit/loss for ${result.apiTokenName} (${result.apiTokenSymbol}) calculated.`,
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
  }, [tokenName, purchaseDate, purchaseAmountUSD, toast]); // Removed calculationHistory from deps to avoid loop with localStorage

  const removeHistoryItem = (id: string) => {
    setCalculationHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    toast({ title: 'Item Removed', description: 'The calculation has been removed from history.' });
  };

  const clearHistory = () => {
    setCalculationHistory([]);
    toast({ title: 'History Cleared', description: 'All calculations have been removed from history.' });
  };

  const refreshHistoryItem = async (item: CalculationHistoryItem) => {
    toast({ title: `Refreshing ${item.apiTokenSymbol || item.tokenName}...`, description: 'Fetching latest price data.' });
    setIsLoading(true); 
    try {
      // Use item.tokenName (user's original search query) for consistent refresh lookup, 
      // as API might return a slightly different name/symbol than what was stored from initial calc.
      const currentTokenInfo = await getTokenInfo(item.tokenName); 
      const newCurrentPrice = currentTokenInfo.currentPrice;
      const refreshedApiTokenName = currentTokenInfo.name; // Get latest name from API
      const refreshedApiTokenSymbol = currentTokenInfo.symbol; // Get latest symbol from API

      const newCurrentValue = item.result.quantityPurchased * newCurrentPrice;
      const newProfitLoss = newCurrentValue - item.purchaseAmountUSD;

      const updatedResult: CalculateProfitLossOutput = {
        ...item.result, 
        apiTokenName: refreshedApiTokenName, // Update with fresh API name
        apiTokenSymbol: refreshedApiTokenSymbol, // Update with fresh API symbol
        currentPrice: newCurrentPrice,
        currentValue: newCurrentValue,
        profitLoss: newProfitLoss,
      };

      setCalculationHistory(prevHistory =>
        prevHistory.map(historyItem =>
          historyItem.id === item.id 
            ? {...historyItem, apiTokenName: refreshedApiTokenName, apiTokenSymbol: refreshedApiTokenSymbol, result: updatedResult} 
            : historyItem
        )
      );

      toast({
        variant: 'default',
        className: 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/30 dark:border-sky-500/40 text-sky-700 dark:text-sky-300',
        title: 'Item Refreshed',
        description: `Data for ${refreshedApiTokenName} (${refreshedApiTokenSymbol}) updated successfully.`,
      });
    } catch (error: any) {
      console.error('Error refreshing item:', error);
      toast({
        variant: 'destructive',
        title: 'Refresh Error',
        description: error.message || `Failed to refresh ${item.apiTokenName || item.tokenName}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSellItem = (item: CalculationHistoryItem, targetProfit: number) => {
    // This is a placeholder for a real sell action
    console.log(`Simulated sell order for ${item.apiTokenSymbol} if profit reaches $${targetProfit}`);
    toast({
      variant: 'default',
      className: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 dark:border-amber-500/40 text-amber-700 dark:text-amber-300',
      title: 'Sell Order Placed (Simulated)',
      description: (
        <div>
          <p>Will "sell" {formatNumber(item.result.quantityPurchased, 8)} of {item.apiTokenName} ({item.apiTokenSymbol})</p>
          <p>if profit target <span className="font-semibold">${formatNumber(targetProfit, 2)}</span> is reached.</p>
          <p>Current profit: <span className={`font-semibold ${item.result.profitLoss >=0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            ${formatNumber(item.result.profitLoss, 2)}
            </span></p>
        </div>
      ),
      duration: 7000,
    });
  };

  // Loading skeleton for initial render before client-side hydration
  if (!isClient) {
    return (
        <div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-muted/20 text-foreground">
            <main className="flex flex-col justify-center items-center p-4 sm:p-6 md:w-1/2 lg:w-2/5 xl:w-1/3 w-full overflow-y-auto no-scrollbar">
                <div className="w-full max-w-md space-y-4 animate-pulse">
                    <div className="h-10 bg-card rounded-md"></div>
                    <div className="h-8 bg-card rounded-md w-3/4"></div>
                    <div className="space-y-3 pt-2">
                        <div className="h-6 bg-card rounded-md"></div>
                        <div className="h-10 bg-card rounded-md"></div>
                        <div className="h-6 bg-card rounded-md"></div>
                        <div className="h-10 bg-card rounded-md"></div>
                        <div className="h-6 bg-card rounded-md"></div>
                        <div className="h-10 bg-card rounded-md"></div>
                    </div>
                    <div className="h-12 bg-primary/70 rounded-md mt-4"></div>
                </div>
            </main>
            <aside className="md:w-1/2 lg:w-3/5 xl:w-2/3 w-full h-full md:max-h-screen md:border-l border-border/50">
                 <div className="h-full flex flex-col bg-card p-4 animate-pulse">
                    <div className="h-8 bg-muted rounded-md mb-4 w-1/2"></div>
                    <div className="space-y-3">
                        <div className="h-24 bg-muted rounded-md"></div>
                        <div className="h-24 bg-muted rounded-md"></div>
                        <div className="h-24 bg-muted rounded-md"></div>
                    </div>
                 </div>
            </aside>
        </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-muted/20 text-foreground font-sans">
      <main className="flex flex-col justify-center items-center p-4 sm:p-6 md:w-1/2 lg:w-2/5 xl:w-1/3 w-full overflow-y-auto no-scrollbar">
        <Card className="w-full max-w-md shadow-lg bg-card border-border/70 rounded-lg">
          <CardHeader className="border-b border-border/70 pb-3 pt-4 px-4">
            <CardTitle className="text-lg font-semibold flex items-center text-primary">
              <TrendingUp className="mr-2 h-5 w-5"/> Token Time Machine
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground pt-0.5">
              See how your crypto investments could have performed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4">
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
              className="w-full text-sm py-2.5 font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-sm hover:shadow-md transition-all duration-150 ease-in-out"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : 'Calculate Value'}
            </Button>
            {calculationResult && <ResultDisplay result={calculationResult} />}
          </CardContent>
        </Card>
        <footer className="text-center mt-5 text-xs text-muted-foreground/80">
          <p>&copy; {new Date().getFullYear()} Token Time Machine. All rights reserved.</p>
          <p className="mt-0.5">Data by DexGuru. For informational purposes only.</p>
        </footer>
      </main>

      <aside className="md:w-1/2 lg:w-3/5 xl:w-2/3 w-full h-full md:max-h-screen md:border-l border-border/50">
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

