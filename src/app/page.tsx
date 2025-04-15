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
import {ScrollArea} from '@/components/ui/scroll-area';
import {Trash2} from 'lucide-react';
import {Separator} from '@/components/ui/separator';

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
  return value !== undefined ? value.toFixed(5) : '';
};

// Component for displaying the profit/loss result
const ResultDisplay = ({
  profitLossResult,
}: {
  profitLossResult: CalculateProfitLossOutput | undefined;
}) => {
  const profitColor =
    profitLossResult && profitLossResult.profitLoss >= 0
      ? 'text-green-500'
      : 'text-red-500';
  const profitText =
    profitLossResult && profitLossResult.profitLoss >= 0 ? 'Profit' : 'Loss';

  return profitLossResult ? (
    <div className="mt-4">
      <p>Current Price: ${formatNumber(profitLossResult.currentPrice)}</p>
      <p className={profitColor}>
        {profitText}: ${formatNumber(profitLossResult.profitLoss)}
      </p>
    </div>
  ) : null;
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
  purchasePrice: number | undefined;
  setPurchasePrice: React.Dispatch<React.SetStateAction<number | undefined>>;
  quantity: number | undefined;
  setQuantity: React.Dispatch<React.SetStateAction<number | undefined>>;
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
    <div className="grid gap-2">
      <label
        htmlFor="purchase-price"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Purchase Price
      </label>
      <Input
        id="purchase-price"
        type="number"
        placeholder="e.g., 30000"
        value={purchasePrice !== undefined ? purchasePrice.toString() : ''}
        onChange={e => {
          const parsedValue = e.target.value ? parseFloat(e.target.value) : undefined;
          if (
            (parsedValue === undefined || !isNaN(parsedValue)) &&
            (e.target.value === '' || (parsedValue !== undefined && isFinite(parsedValue)))
          ) {
            setPurchasePrice(parsedValue);
          }
        }}
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
        type="number"
        placeholder="e.g., 1"
        value={quantity !== undefined ? quantity.toString() : ''}
        onChange={e => {
          const parsedValue = e.target.value ? parseFloat(e.target.value) : undefined;
          if (
            (parsedValue === undefined || !isNaN(parsedValue)) &&
            (e.target.value === '' || (parsedValue !== undefined && isFinite(parsedValue)))
          ) {
            setQuantity(parsedValue);
          }
        }}
      />
    </div>
  </>
);

// Functional component to display each history item
const HistoryItem = ({
  item,
  onRemove,
}: {
  item: CalculationHistoryItem;
  onRemove: (id: string) => void;
}) => {
  const profitColorClass = item.result.profitLoss >= 0 ? 'text-green-500' : 'text-red-500';
  const profitText = item.result.profitLoss >= 0 ? 'Profit' : 'Loss';

  return (
    <Card className="mb-4 border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg">{item.tokenName}</p>
            <p className="text-sm text-muted-foreground">Date: {item.purchaseDate}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Separator className="my-2" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm">Price:</p>
            <p>{formatNumber(item.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-sm">Quantity:</p>
            <p>{item.quantity}</p>
          </div>
          <div>
            <p className="text-sm">Current Price:</p>
            <p>{formatNumber(item.result.currentPrice)}</p>
          </div>
          <div>
            <p className="text-sm">{profitText}:</p>
            <p className={profitColorClass}>{formatNumber(item.result.profitLoss)}</p>
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
}: {
  calculationHistory: CalculationHistoryItem[];
  onRemove: (id: string) => void;
  onClearHistory: () => void;
}) => (
  <div className="h-full p-6">
    <Card className="h-full flex flex-col border-none">
      <CardHeader className="flex flex-row justify-between items-center p-4">
        <CardTitle className="text-xl">Calculation History</CardTitle>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={onClearHistory}>
            Clear History
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto p-0">
        <div className="p-4">
          {calculationHistory.map((item, index) => (
            <HistoryItem key={index} item={item} onRemove={onRemove} />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Main Home component
export default function Home() {
  // Define state variables
  const [tokenName, setTokenName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [profitLossResult, setProfitLossResult] = useState<CalculateProfitLossOutput | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistoryItem[]>([]);

  // Function to generate a unique ID for each history item
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Load calculation history from local storage on component mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('calculationHistory');
    if (storedHistory) {
      setCalculationHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Save calculation history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
  }, [calculationHistory]);

  // useCallback hook to memoize the calculateResult function
  const calculateResult = useCallback(async () => {
    // Validate input fields
    if (!tokenName || !purchaseDate || purchasePrice === undefined || quantity === undefined) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare input for the calculateProfitLoss function
      const input: CalculateProfitLossInput = {
        tokenName,
        purchaseDate: formatDate(purchaseDate),
        purchasePrice,
        quantity,
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
      setCalculationHistory(prevHistory => [newHistoryItem, ...prevHistory]);
    } catch (error: any) {
      // Display error message
      console.error('Error calculating profit/loss:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate profit/loss.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tokenName, purchaseDate, purchasePrice, quantity, toast]);

  // Function to remove a specific item from the calculation history
  const removeHistoryItem = (id: string) => {
    setCalculationHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(item => item.id !== id);
      localStorage.setItem('calculationHistory', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  // Function to clear the entire calculation history
  const clearHistory = () => {
    localStorage.removeItem('calculationHistory');
    setCalculationHistory([]);
  };

  // Render the component
  return (
    <div className="flex h-screen bg-background">
      <div className="flex flex-col justify-center items-center p-6 w-1/2">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Token Time Machine</CardTitle>
            <CardDescription>
              Enter the token details to calculate potential profit/loss.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
            <Button onClick={calculateResult} disabled={isLoading}>
              {isLoading ? 'Calculating...' : 'Calculate'}
            </Button>
            <ResultDisplay profitLossResult={profitLossResult} />
          </CardContent>
        </Card>
      </div>

      {/* Calculation History Section */}
      <div className="w-1/2">
        <CalculationHistory
          calculationHistory={calculationHistory}
          onRemove={removeHistoryItem}
          onClearHistory={clearHistory}
        />
      </div>
    </div>
  );
}
