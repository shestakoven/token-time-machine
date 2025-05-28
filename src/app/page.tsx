
'use client';

import {Calendar} from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
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
import {useState, useEffect, useCallback} from 'react';
import {useToast} from '@/hooks/use-toast';
import {format} from 'date-fns';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Trash2, RefreshCw, DollarSign, Send, XCircle, Briefcase, TrendingUp, TrendingDown, Info } from 'lucide-react';
import {Separator} from '@/components/ui/separator';
import {getTokenInfo} from '@/services/token-price';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface CalculationHistoryItem {
  tokenName: string;
  purchaseDate: string; // YYYY-MM-DD
  purchaseAmountUSD: number;
  result: CalculateProfitLossOutput;
  id: string; // Unique identifier for each history item
}

const formatDate = (date: Date | undefined): string => {
  return date ? format(date, 'yyyy-MM-dd') : '';
};

const formatNumber = (value: number | undefined, precision = 5): string => {
  if (value === undefined || value === null) return '0.00000';
  if (Math.abs(value) < 0.00001 && value !== 0 && precision >= 5) {
    return value.toExponential(4);
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
  const profitLossColor = isProfit ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const profitLossText = isProfit ? 'Profit' : 'Loss';

  return (
    <div className="mt-4 p-4 bg-muted/80 dark:bg-muted/50 rounded-lg space-y-3 shadow-inner">
      <div className="text-sm text-muted-foreground dark:text-gray-400">Calculation Results:</div>
      
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
       <Separator className="my-2 bg-border/70 dark:bg-gray-700/70" />
      <div>
        <p className={`text-sm font-medium ${profitLossColor}`}>{profitLossText}:</p>
        <p className={`text-2xl font-bold ${profitLossColor}`}>
          ${formatNumber(result.profitLoss, 2)}
        </p>
      </div>
    </div>
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
    <div className="grid gap-1.5">
      <Label htmlFor="token-name">Token Name/Symbol</Label>
      <Input
        id="token-name"
        placeholder="e.g., BTC, Ethereum"
        value={tokenName}
        onChange={e => setTokenName(e.target.value)}
      />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="purchase-date">Purchase Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="purchase-date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !purchaseDate && 'text-muted-foreground'
            )}
          >
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
    <div className="grid gap-1.5">
      <Label htmlFor="purchase-amount">Purchase Amount (USD)</Label>
      <Input
        id="purchase-amount"
        type="number"
        placeholder="e.g., 100"
        value={purchaseAmountUSD}
        onChange={e => setPurchaseAmountUSD(e.target.value)}
        min="0.01"
        step="any"
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
  const profitLossColor = isProfit ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const profitLossText = isProfit ? 'Profit' : 'Loss';
  const ProfitLossIcon = isProfit ? TrendingUp : TrendingDown;

  const [showSellInput, setShowSellInput] = useState(false);
  const [targetProfit, setTargetProfit] = useState('');

  const handleSellClick = () => {
    if (targetProfit && !isNaN(parseFloat(targetProfit))) {
      onSell(item, parseFloat(targetProfit));
      setShowSellInput(false);
      setTargetProfit('');
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
    <Card className="mb-3 border-border/70 dark:border-gray-700/70 bg-card dark:bg-gray-800/80 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-md text-foreground dark:text-gray-100">{item.tokenName}</p>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Invested ${formatNumber(item.purchaseAmountUSD, 2)} on {format(new Date(item.purchaseDate), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => onRefresh(item)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Refresh current price</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setShowSellInput(!showSellInput)}>
                  <DollarSign className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Simulate Sell Order</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive" onClick={() => onRemove(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Remove from history</p></TooltipContent>
            </Tooltip>
          </div>
        </div>

        {showSellInput && (
          <div className="mt-2 mb-3 p-2.5 bg-muted/70 dark:bg-gray-700/70 rounded-md">
            <Label htmlFor={`sell-target-${item.id}`} className="text-xs text-muted-foreground dark:text-gray-400">Target Profit ($) for Sell</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                id={`sell-target-${item.id}`}
                type="number"
                placeholder="e.g., 100"
                value={targetProfit}
                onChange={(e) => setTargetProfit(e.target.value)}
                className="h-8 text-sm"
              />
              <Button variant="outline" size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600 text-primary-foreground" onClick={handleSellClick}>
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setShowSellInput(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-1.5">Current Profit: ${formatNumber(item.result.profitLoss, 2)}</p>
          </div>
        )}

        <Separator className="my-2 bg-border/50 dark:bg-gray-700/50" />
        
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

        <div className={`mt-2 flex items-center p-2 rounded-md bg-opacity-10 ${isProfit ? 'bg-green-500/10 dark:bg-green-500/20' : 'bg-red-500/10 dark:bg-red-500/20'}`}>
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
  <div className="h-full flex flex-col bg-muted/30 dark:bg-black/20">
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent rounded-none">
      <CardHeader className="flex flex-row justify-between items-center p-4 border-b border-border/70 dark:border-gray-700/70 sticky top-0 bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
        <CardTitle className="text-lg font-semibold text-foreground dark:text-gray-100">Calculation History</CardTitle>
        {calculationHistory.length > 0 && (
           <Button variant="outline" size="sm" onClick={onClearHistory} className="text-xs">
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4 no-scrollbar space-y-0"> {/* Removed space-y-4, HistoryItem has mb-3 */}
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
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [purchaseAmountUSD, setPurchaseAmountUSD] = useState('');
  const [calculationResult, setCalculationResult] = useState<CalculateProfitLossOutput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistoryItem[]>([]);

  const generateId = (): string => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  useEffect(() => {
    if (isClient) {
      const storedHistory = localStorage.getItem('calculationHistory_v2'); // Changed key to avoid conflicts with old structure
      if (storedHistory) {
        try {
          const parsedHistory = JSON.parse(storedHistory);
          // Basic validation for parsed history items
          if (Array.isArray(parsedHistory) && parsedHistory.every(item => item.hasOwnProperty('purchaseAmountUSD'))) {
            setCalculationHistory(parsedHistory);
          } else {
             localStorage.removeItem('calculationHistory_v2'); // Clear incompatible old data
          }
        } catch (e) {
          console.error("Error parsing stored history:", e);
          localStorage.removeItem('calculationHistory_v2');
        }
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('calculationHistory_v2', JSON.stringify(calculationHistory));
    }
  }, [calculationHistory, isClient]);

  const calculateResult = useCallback(async () => {
    const parsedPurchaseAmountUSD = parseFloat(purchaseAmountUSD);

    if (!tokenName || !purchaseDate || isNaN(parsedPurchaseAmountUSD)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please fill in all fields. Purchase amount must be a valid number.',
      });
      return;
    }
    if (parsedPurchaseAmountUSD <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Purchase amount must be greater than zero.',
      });
      return;
    }

    setIsLoading(true);
    setCalculationResult(undefined);
    try {
      const input: CalculateProfitLossInput = {
        tokenName,
        purchaseDate: formatDate(purchaseDate),
        purchaseAmountUSD: parsedPurchaseAmountUSD,
      };

      const result = await calculateProfitLoss(input);
      setCalculationResult(result);

      const newHistoryItem: CalculationHistoryItem = {
        tokenName: input.tokenName,
        purchaseDate: input.purchaseDate,
        purchaseAmountUSD: input.purchaseAmountUSD,
        result,
        id: generateId(),
      };
      setCalculationHistory(prevHistory => [newHistoryItem, ...prevHistory.slice(0, 19)]);
      toast({
        title: 'Calculation Successful',
        description: `Profit/loss for ${tokenName} calculated.`,
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
    setIsLoading(true); // Can use a specific loading state for history items if needed
    try {
      const currentTokenInfo = await getTokenInfo(item.tokenName);
      const newCurrentPrice = currentTokenInfo.currentPrice;

      const newCurrentValue = item.result.quantityPurchased * newCurrentPrice;
      const newProfitLoss = newCurrentValue - item.purchaseAmountUSD;

      const updatedResult: CalculateProfitLossOutput = {
        ...item.result, // Keep priceAtPurchase and quantityPurchased
        currentPrice: newCurrentPrice,
        currentValue: newCurrentValue,
        profitLoss: newProfitLoss,
      };

      setCalculationHistory(prevHistory =>
        prevHistory.map(hItem =>
          hItem.id === item.id ? {...hItem, result: updatedResult} : hItem
        )
      );
      toast({
        title: 'Item Refreshed',
        description: `Data for ${item.tokenName} updated.`,
      });
    } catch (error: any) {
      console.error('Error refreshing item:', error);
      toast({
        variant: 'destructive',
        title: 'Refresh Error',
        description: error.message || 'Failed to refresh item.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSellItem = (item: CalculationHistoryItem, targetProfit: number) => {
    console.log(`Simulated sell order for ${item.tokenName} if profit reaches $${targetProfit}`);
    toast({
      title: 'Sell Order Placed (Simulated)',
      description: `Will "sell" ${formatNumber(item.result.quantityPurchased, 8)} of ${item.tokenName} if profit reaches $${formatNumber(targetProfit, 2)}. Current profit: $${formatNumber(item.result.profitLoss, 2)}`,
    });
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-background dark:bg-gray-950 text-foreground dark:text-gray-100">
      <main className="flex flex-col justify-center items-center p-4 sm:p-6 md:w-1/2 w-full overflow-y-auto no-scrollbar">
        <Card className="w-full max-w-md shadow-xl dark:shadow-2xl bg-card dark:bg-gray-900/80 backdrop-blur-md border-border/50 dark:border-gray-700/50">
          <CardHeader className="border-b border-border/50 dark:border-gray-700/50 pb-4">
            <CardTitle className="text-xl font-semibold flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-primary"/> Token Time Machine
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">
              See how much your past crypto investments would be worth today.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 sm:p-6">
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
              className="w-full text-base py-3"
              size="lg"
            >
              {isLoading ? 'Calculating...' : 'Calculate Value'}
            </Button>
            {calculationResult && <ResultDisplay result={calculationResult} />}
          </CardContent>
        </Card>
         <p className="text-xs text-muted-foreground mt-6 text-center max-w-md">
          <Info size={14} className="inline mr-1 mb-0.5"/>
          Historical price data is mocked for demonstration. For accurate calculations, integrate a real historical data API.
        </p>
      </main>

      <aside className="md:w-1/2 w-full h-full md:max-h-screen md:border-l border-border/50 dark:border-gray-700/50">
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
