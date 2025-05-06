
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
import {Trash2, RefreshCw, DollarSign, Send, XCircle } from 'lucide-react';
import {Separator} from '@/components/ui/separator';
import {getTokenInfo} from '@/services/token-price';

// Define an interface for the calculation history items, extending the input with the result
interface CalculationHistoryItem extends CalculateProfitLossInput {
  result: CalculateProfitLossOutput;
  id: string; // Unique identifier for each history item
}

// Function to format the purchase date
const formatDate = (date: Date | undefined): string => {
  return date ? format(date, 'yyyy-MM-dd') : '';
};

// Function to format numbers to a fixed 5 decimal places.
const formatNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0.00000';
  // Check if the number is very small and needs scientific notation for precision
  if (Math.abs(value) < 0.00001 && value !== 0) {
    return value.toExponential(4); // Use 4 decimal places in scientific notation
  }
  return value.toFixed(5);
};


// Component for displaying the profit/loss result
const ResultDisplay = ({
  profitLossResult,
}: {
  profitLossResult: CalculateProfitLossOutput | undefined;
}) => {
  if (!profitLossResult) return null;
  const isProfit = profitLossResult.profitLoss >= 0;
  const profitColor = isProfit ? 'text-green-500' : 'text-red-500';
  const profitText = isProfit ? 'Profit' : 'Loss';

  return (
    <div className="mt-4 p-4 bg-muted dark:bg-muted/50 rounded-lg">
      <p className="text-sm text-muted-foreground">Current Price:</p>
      <p className="text-lg font-semibold">${formatNumber(profitLossResult.currentPrice)}</p>
      <p className={`text-sm mt-2 ${profitColor}`}>{profitText}:</p>
      <p className={`text-lg font-semibold ${profitColor}`}>
        ${formatNumber(profitLossResult.profitLoss)}
      </p>
    </div>
  );
};

// Component for rendering the input fields
const InputFields = ({
  tokenName,
  setTokenName,
  purchaseDate,
  setPurchaseDate,
  purchasePrice,
  setPurchasePrice,
  quantity,
  setQuantity,
}: {
  tokenName: string;
  setTokenName: React.Dispatch<React.SetStateAction<string>>;
  purchaseDate: Date | undefined;
  setPurchaseDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  purchasePrice: string;
  setPurchasePrice: React.Dispatch<React.SetStateAction<string>>;
  quantity: string;
  setQuantity: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <>
    <div className="grid gap-2">
      <label
        htmlFor="token-name"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Token Name/Symbol
      </label>
      <Input
        id="token-name"
        placeholder="e.g., BTC"
        value={tokenName}
        onChange={e => setTokenName(e.target.value)}
        className="bg-background dark:bg-gray-800 border-border dark:border-gray-700 focus:border-primary dark:focus:border-primary"
      />
    </div>
    <div className="grid gap-2">
      <label
        htmlFor="purchase-date"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Purchase Date
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal bg-background dark:bg-gray-800 border-border dark:border-gray-700 hover:bg-muted dark:hover:bg-gray-700',
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
    <div className="grid gap-2">
      <label
        htmlFor="purchase-price"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Purchase Price
      </label>
      <Input
        id="purchase-price"
        type="text" // Changed to text to allow more flexible input
        placeholder="e.g., 30000"
        value={purchasePrice}
        onChange={e => setPurchasePrice(e.target.value)}
        className="bg-background dark:bg-gray-800 border-border dark:border-gray-700 focus:border-primary dark:focus:border-primary"
      />
    </div>
    <div className="grid gap-2">
      <label
        htmlFor="quantity"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Quantity
      </label>
      <Input
        id="quantity"
        type="text" // Changed to text to allow more flexible input
        placeholder="e.g., 1"
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
        className="bg-background dark:bg-gray-800 border-border dark:border-gray-700 focus:border-primary dark:focus:border-primary"
      />
    </div>
  </>
);

// Functional component to display each history item
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
  const profitColorClass = item.result.profitLoss >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const profitText = item.result.profitLoss >= 0 ? 'Profit' : 'Loss';
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
    <Card className="mb-4 border border-border dark:border-gray-700 bg-card dark:bg-gray-800 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-semibold text-lg text-foreground dark:text-gray-100">{item.tokenName}</p>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Purchased: {item.purchaseDate}
            </p>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary dark:text-gray-400 dark:hover:text-primary"
              onClick={() => onRefresh(item)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
             <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary dark:text-gray-400 dark:hover:text-primary"
              onClick={() => setShowSellInput(!showSellInput)}
            >
              <DollarSign className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-destructive dark:text-gray-400 dark:hover:text-destructive-foreground"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showSellInput && (
          <div className="mt-2 mb-3 p-3 bg-muted/50 dark:bg-gray-700/50 rounded-md">
            <label htmlFor={`sell-target-${item.id}`} className="text-xs text-muted-foreground dark:text-gray-400">Target Profit ($)</label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                id={`sell-target-${item.id}`}
                type="number"
                placeholder="e.g., 100"
                value={targetProfit}
                onChange={(e) => setTargetProfit(e.target.value)}
                className="h-8 text-sm bg-background dark:bg-gray-800 border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary"
              />
              <Button variant="outline" size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700" onClick={handleSellClick}>
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive dark:text-gray-400 dark:hover:text-red-400" onClick={() => setShowSellInput(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Separator className="my-2 bg-border dark:bg-gray-700" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Purchase Price:</p>
            <p className="font-medium text-foreground dark:text-gray-200">${formatNumber(item.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Quantity:</p>
            <p className="font-medium text-foreground dark:text-gray-200">{item.quantity}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Current Price:</p>
            <p className="font-medium text-foreground dark:text-gray-200">${formatNumber(item.result.currentPrice)}</p>
          </div>
          <div>
            <p className={`text-xs ${profitColorClass}`}>{profitText}:</p>
            <p className={`font-medium ${profitColorClass}`}>
              ${formatNumber(item.result.profitLoss)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for rendering the calculation history
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
  <div className="h-full flex flex-col bg-muted/30 dark:bg-gray-900/50">
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-row justify-between items-center p-4 border-b border-border dark:border-gray-700">
        <CardTitle className="text-lg font-semibold text-foreground dark:text-gray-100">Calculation History</CardTitle>
        {calculationHistory.length > 0 && (
           <Button variant="outline" size="sm" onClick={onClearHistory} className="text-xs border-border dark:border-gray-700 hover:bg-destructive/10 dark:hover:bg-destructive/20 hover:text-destructive dark:hover:text-destructive-foreground">
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4 no-scrollbar">
        {calculationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground dark:text-gray-500">
            <p className="mt-2 text-sm">No calculations yet.</p>
            <p className="text-xs">Your history will appear here.</p>
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

// Main Home component
export default function Home() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Define state variables
  const [tokenName, setTokenName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [profitLossResult, setProfitLossResult] = useState<CalculateProfitLossOutput | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistoryItem[]>([]);

  // Function to generate a unique ID for each history item
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36) ;
  };

  // Load calculation history from local storage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem('calculationHistory');
      if (storedHistory) {
        try {
          setCalculationHistory(JSON.parse(storedHistory));
        } catch (e) {
          console.error("Error parsing stored history:", e);
          localStorage.removeItem('calculationHistory'); // Clear corrupted data
        }
      }
    }
  }, []);

  // Save calculation history to local storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
    }
  }, [calculationHistory]);

  // useCallback hook to memoize the calculateResult function
  const calculateResult = useCallback(async () => {
    const parsedPurchasePrice = parseFloat(purchasePrice);
    const parsedQuantity = parseFloat(quantity);

    if (!tokenName || !purchaseDate || isNaN(parsedPurchasePrice) || isNaN(parsedQuantity)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please fill in all fields with valid numbers for price and quantity.',
      });
      return;
    }
     if (parsedPurchasePrice <= 0 || parsedQuantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Purchase price and quantity must be greater than zero.',
      });
      return;
    }


    setIsLoading(true);
    setProfitLossResult(undefined); // Clear previous result
    try {
      // Prepare input for the calculateProfitLoss function
      const input: CalculateProfitLossInput = {
        tokenName,
        purchaseDate: formatDate(purchaseDate),
        purchasePrice: parsedPurchasePrice,
        quantity: parsedQuantity,
      };

      // Call the calculateProfitLoss function
      const result = await calculateProfitLoss(input);
      setProfitLossResult(result);

      // Create a new history item with a unique ID
      const newHistoryItem: CalculationHistoryItem = {
        ...input,
        result,
        id: generateId(),
      };

      // Update calculation history
      setCalculationHistory(prevHistory => [newHistoryItem, ...prevHistory.slice(0, 19)]); // Keep max 20 items
       toast({
        title: 'Calculation Successful',
        description: `Profit/loss for ${tokenName} calculated.`,
      });
    } catch (error: any) {
      // Display error message
      console.error('Error calculating profit/loss:', error);
      toast({
        variant: 'destructive',
        title: 'Calculation Error',
        description: error.message || 'Failed to calculate profit/loss. The token might not exist or data is unavailable.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tokenName, purchaseDate, purchasePrice, quantity, toast]);

  // Function to remove a specific item from the calculation history
  const removeHistoryItem = (id: string) => {
    setCalculationHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(item => item.id !== id);
      // No need to directly call localStorage.setItem here, useEffect for calculationHistory handles it
      return updatedHistory;
    });
     toast({
      title: 'Item Removed',
      description: 'The calculation has been removed from history.',
    });
  };

  // Function to clear the entire calculation history
  const clearHistory = () => {
    setCalculationHistory([]);
    // No need to directly call localStorage.removeItem here, useEffect for calculationHistory handles it
    toast({
      title: 'History Cleared',
      description: 'All calculations have been removed from history.',
    });
  };

  // Function to refresh a specific item in the calculation history
  const refreshHistoryItem = async (item: CalculationHistoryItem) => {
    setIsLoading(true);
    try {
      // Fetch current price
      const tokenInfo = await getTokenInfo(item.tokenName);
      const currentPrice = tokenInfo.currentPrice;

      // Recalculate profit/loss
      const profitLoss = (currentPrice - item.purchasePrice) * item.quantity;
      const updatedResult: CalculateProfitLossOutput = {
        currentPrice: currentPrice,
        profitLoss: profitLoss,
      };

      // Update the item in history
      setCalculationHistory(prevHistory =>
        prevHistory.map(hItem =>
          hItem.id === item.id ? {...hItem, result: updatedResult} : hItem
        )
      );
      toast({
        title: 'Item Refreshed',
        description: `Current price for ${item.tokenName} updated.`,
      });
    } catch (error: any) {
      console.error('Error refreshing profit/loss:', error);
      toast({
        variant: 'destructive',
        title: 'Refresh Error',
        description: error.message || 'Failed to refresh profit/loss.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellItem = (item: CalculationHistoryItem, targetProfit: number) => {
    // This is a placeholder for actual sell logic
    // In a real app, this would interact with an exchange API
    console.log(`Attempting to sell ${item.quantity} of ${item.tokenName} when profit reaches $${targetProfit}`);
    toast({
      title: 'Sell Order Placed (Simulated)',
      description: `Will sell ${item.quantity} of ${item.tokenName} if profit reaches $${targetProfit}. Current profit: $${formatNumber(item.result.profitLoss)}`,
    });
    // You might want to add further logic here, like:
    // - Storing this "sell order" locally or on a server
    // - Periodically checking if the condition is met
  };


  if (!isClient) {
    return null; // Or a loading spinner, but null avoids hydration issues on initial server render
  }

  // Render the component
  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-background dark:bg-gray-900 text-foreground dark:text-gray-100">
      <div className="flex flex-col justify-center items-center p-6 md:w-1/2 w-full overflow-y-auto no-scrollbar">
        <Card className="w-full max-w-md shadow-none border-border dark:border-gray-700 bg-card dark:bg-gray-800">
          <CardHeader className="border-b border-border dark:border-gray-700 pb-4">
            <CardTitle className="text-xl font-semibold">Token Time Machine</CardTitle>
            <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">
              Calculate potential crypto profit & loss.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            <InputFields
              tokenName={tokenName}
              setTokenName={setTokenName}
              purchaseDate={purchaseDate}
              setPurchaseDate={setPurchaseDate}
              purchasePrice={purchasePrice}
              setPurchasePrice={setPurchasePrice}
              quantity={quantity}
              setQuantity={setQuantity}
            />
            <Button
              onClick={calculateResult}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-primary dark:hover:bg-primary/80"
            >
              {isLoading ? 'Calculating...' : 'Calculate Profit/Loss'}
            </Button>
            {profitLossResult && <ResultDisplay profitLossResult={profitLossResult} />}
          </CardContent>
        </Card>
      </div>

      {/* Calculation History Section */}
      <div className="md:w-1/2 w-full h-full md:max-h-screen md:border-l border-border dark:border-gray-700">
        <CalculationHistory
          calculationHistory={calculationHistory}
          onRemove={removeHistoryItem}
          onClearHistory={clearHistory}
          onRefresh={refreshHistoryItem}
          onSell={handleSellItem}
        />
      </div>
    </div>
  );
}
