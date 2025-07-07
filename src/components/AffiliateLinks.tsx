'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Shield, DollarSign, Zap } from 'lucide-react';

interface AffiliateLink {
  name: string;
  description: string;
  url: string;
  bonus: string;
  icon: string;
  category: 'exchange' | 'wallet' | 'defi';
}

const affiliateLinks: AffiliateLink[] = [
  {
    name: "Binance",
    description: "World's largest crypto exchange",
    url: "https://accounts.binance.com/register?ref=YOUR_REF_CODE",
    bonus: "20% trading fee discount",
    icon: "🔶",
    category: "exchange"
  },
  {
    name: "Coinbase",
    description: "Beginner-friendly crypto platform",
    url: "https://coinbase.com/join/YOUR_REF_CODE", 
    bonus: "$10 bonus after $100 trade",
    icon: "🔵",
    category: "exchange"
  },
  {
    name: "KuCoin",
    description: "Advanced trading features",
    url: "https://www.kucoin.com/r/YOUR_REF_CODE",
    bonus: "Up to 40% fee discount",
    icon: "🟢",
    category: "exchange"
  },
  {
    name: "Ledger Nano X",
    description: "Hardware wallet for security",
    url: "https://shop.ledger.com/?r=YOUR_REF_CODE",
    bonus: "Free shipping on orders",
    icon: "🔒",
    category: "wallet"
  }
];

export const AffiliateLinks = () => {
  const handleAffiliateClick = (link: AffiliateLink) => {
    // Track affiliate click for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'affiliate_click', {
        affiliate_name: link.name,
        affiliate_category: link.category
      });
    }
    
    window.open(link.url, '_blank');
  };

  const exchanges = affiliateLinks.filter(link => link.category === 'exchange');
  const wallets = affiliateLinks.filter(link => link.category === 'wallet');

  return (
    <div className="space-y-6">
      {/* Ready to Buy? Section */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            Ready to Start Investing?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Found your next crypto opportunity? Here are trusted platforms to get started:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exchanges.map((link, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-between h-auto p-3 hover:bg-blue-500/10"
                onClick={() => handleAffiliateClick(link)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{link.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{link.name}</div>
                    <div className="text-xs text-muted-foreground">{link.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-emerald-600 font-medium">{link.bonus}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security First Section */}
      <Card className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            Secure Your Investment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Don't risk losing your crypto! Store it safely with a hardware wallet:
          </p>
          <div className="space-y-2">
            {wallets.map((link, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-between h-auto p-3 hover:bg-emerald-500/10"
                onClick={() => handleAffiliateClick(link)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{link.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{link.name}</div>
                    <div className="text-xs text-muted-foreground">{link.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-emerald-600 font-medium">{link.bonus}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground text-center">
        <p>
          🤝 We may earn a commission when you sign up through our links. 
          This helps us keep the calculator free and maintain our service.
        </p>
      </div>
    </div>
  );
};