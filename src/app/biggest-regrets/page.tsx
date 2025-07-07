'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Share2, Twitter, Facebook, Copy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface RegretStory {
  token: string;
  symbol: string;
  investmentAmount: number;
  purchaseDate: string;
  purchasePrice: number;
  currentPrice: number;
  potentialValue: number;
  story: string;
  verified: boolean;
}

const legendaryRegrets: RegretStory[] = [
  {
    token: "Bitcoin",
    symbol: "BTC",
    investmentAmount: 100,
    purchaseDate: "2010-05-22",
    purchasePrice: 0.008,
    currentPrice: 43000,
    potentialValue: 537500000,
    story: "The famous Bitcoin Pizza Day - 10,000 BTC for 2 pizzas worth $25",
    verified: true
  },
  {
    token: "Bitcoin",
    symbol: "BTC", 
    investmentAmount: 1000,
    purchaseDate: "2011-02-09",
    purchasePrice: 1.00,
    currentPrice: 43000,
    potentialValue: 43000000,
    story: "Early Bitcoin believer who forgot about their wallet",
    verified: true
  },
  {
    token: "Ethereum",
    symbol: "ETH",
    investmentAmount: 500,
    purchaseDate: "2015-07-30",
    purchasePrice: 0.31,
    currentPrice: 2500,
    potentialValue: 4032258,
    story: "ICO participant who sold too early",
    verified: true
  },
  {
    token: "Dogecoin",
    symbol: "DOGE",
    investmentAmount: 100,
    purchaseDate: "2013-12-08",
    purchasePrice: 0.00026,
    currentPrice: 0.08,
    potentialValue: 30769230,
    story: "Bought as a joke, could have been a millionaire",
    verified: true
  },
  {
    token: "Chainlink", 
    symbol: "LINK",
    investmentAmount: 200,
    purchaseDate: "2017-09-19",
    purchasePrice: 0.11,
    currentPrice: 14.50,
    potentialValue: 26363636,
    story: "Sold during the 2018 bear market for a loss",
    verified: false
  },
  {
    token: "Solana",
    symbol: "SOL", 
    investmentAmount: 300,
    purchaseDate: "2020-04-10",
    purchasePrice: 0.78,
    currentPrice: 98.00,
    potentialValue: 37692308,
    story: "Didn't believe in the Solana ecosystem early on",
    verified: false
  }
];

const formatNumber = (value: number): string => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(2)}`;
};

const RegretCard = ({ regret }: { regret: RegretStory }) => {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const multiplier = regret.potentialValue / regret.investmentAmount;
  
  const shareText = `😱 If I had invested $${regret.investmentAmount} in ${regret.token} on ${regret.purchaseDate}, it would be worth ${formatNumber(regret.potentialValue)} today! That's a ${multiplier.toFixed(0)}x return! 🚀`;

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText + ` Check it out: ${window.location.href}`);
    // You could add a toast notification here
  };

  return (
    <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      {regret.verified && (
        <Badge className="absolute top-4 right-4 bg-emerald-500 text-white">
          ✓ Verified
        </Badge>
      )}
      
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-bold">{regret.token} ({regret.symbol})</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShareMenuOpen(!shareMenuOpen)}
            className="relative"
          >
            <Share2 className="h-4 w-4" />
            {shareMenuOpen && (
              <div className="absolute top-8 right-0 z-10 bg-card border rounded-lg shadow-lg p-2 space-y-1 min-w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareOnTwitter}
                  className="w-full justify-start text-xs"
                >
                  <Twitter className="h-3 w-3 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareOnFacebook}
                  className="w-full justify-start text-xs"
                >
                  <Facebook className="h-3 w-3 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="w-full justify-start text-xs"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy
                </Button>
              </div>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Investment</p>
            <p className="font-semibold text-lg">${regret.investmentAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Purchase Date</p>
            <p className="font-semibold">{new Date(regret.purchaseDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Price Then</p>
            <p className="font-semibold">${regret.purchasePrice.toFixed(6)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Price Now</p>
            <p className="font-semibold">${regret.currentPrice.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-lg border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Would be worth today</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatNumber(regret.potentialValue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Multiplier</p>
              <p className="text-xl font-bold flex items-center">
                <TrendingUp className="h-5 w-5 mr-1 text-emerald-500" />
                {multiplier.toFixed(0)}x
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground italic">"{regret.story}"</p>
        </div>
        
        <Link href="/" className="block">
          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            Calculate Your Own Regret 😅
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default function BiggestRegretsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calculator
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              💔 Biggest Crypto Regrets
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Stories that will make you want to build a time machine
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              These are real scenarios of early crypto opportunities. Don't let FOMO get to you - 
              the next opportunity might be just around the corner! 🚀
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {legendaryRegrets.map((regret, index) => (
            <RegretCard key={index} regret={regret} />
          ))}
        </div>

        <div className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-8 border border-blue-500/20">
          <h2 className="text-2xl font-bold mb-4">Don't Live with Regrets!</h2>
          <p className="text-muted-foreground mb-6">
            While you can't change the past, you can make smarter decisions for the future. 
            Use our calculator to analyze current opportunities and track your portfolio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                Start Calculating Now
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Join Our Newsletter
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Prices are approximate and for educational purposes only. Past performance does not guarantee future results.</p>
        </div>
      </div>
    </div>
  );
}