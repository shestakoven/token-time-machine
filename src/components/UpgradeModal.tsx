'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Star, Crown } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsage: {
    calculationsToday: number;
    maxCalculationsPerDay: number;
  };
}

export const UpgradeModal = ({ open, onOpenChange, currentUsage }: UpgradeModalProps) => {
  const handleUpgrade = (tier: 'premium' | 'pro') => {
    // In production, this would integrate with Stripe
    console.log(`Upgrading to ${tier}`);
    
    // For demo purposes, let's simulate a successful upgrade
    if (tier === 'premium') {
      // Update localStorage to simulate premium access
      const subscriptionData = {
        tier: 'premium',
        hasUnlimitedCalculations: true,
        canExportData: true,
        hasAdvancedAnalytics: true,
        hasPriceAlerts: true,
        hasPortfolioTracking: true,
      };
      localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
      // Reload page to update subscription context
      window.location.reload();
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">
            🚀 Unlock Premium Features
          </DialogTitle>
          <DialogDescription className="text-base">
            You've used {currentUsage.calculationsToday} of {currentUsage.maxCalculationsPerDay} free calculations today.
            Upgrade to continue analyzing your crypto gains!
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Premium Plan */}
          <div className="relative border-2 border-emerald-500 rounded-xl p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <Badge className="absolute -top-3 left-6 bg-emerald-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Most Popular
            </Badge>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                Premium
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Unlimited calculations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Portfolio tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Price alerts & notifications</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Export data to CSV/PDF</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Advanced analytics & charts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Priority support</span>
              </li>
            </ul>

            <Button 
              onClick={() => handleUpgrade('premium')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              size="lg"
            >
              Upgrade to Premium
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="border rounded-xl p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-purple-500" />
                Pro
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">$19.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Everything in Premium</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-500" />
                <span className="text-sm">API access (10k calls/month)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-500" />
                <span className="text-sm">White-label solutions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Custom integrations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Multi-chain support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-500" />
                <span className="text-sm">DeFi yield calculations</span>
              </li>
            </ul>

            <Button 
              onClick={() => handleUpgrade('pro')}
              variant="outline"
              className="w-full border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
              size="lg"
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>

        <div className="text-center mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Special Launch Offer:</strong> First 100 customers get 50% off for 3 months!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cancel anytime. No hidden fees. 7-day money-back guarantee.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};