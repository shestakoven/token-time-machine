'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  calculationsToday: number;
  calculationsThisMonth: number;
  maxCalculationsPerDay: number;
  maxCalculationsPerMonth: number;
  hasUnlimitedCalculations: boolean;
  canExportData: boolean;
  hasAdvancedAnalytics: boolean;
  hasPriceAlerts: boolean;
  hasPortfolioTracking: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus;
  incrementCalculation: () => void;
  canMakeCalculation: () => boolean;
  upgradeRequired: boolean;
  setUpgradeRequired: (required: boolean) => void;
}

const defaultSubscription: SubscriptionStatus = {
  tier: 'free',
  calculationsToday: 0,
  calculationsThisMonth: 0,
  maxCalculationsPerDay: 10,
  maxCalculationsPerMonth: 100,
  hasUnlimitedCalculations: false,
  canExportData: false,
  hasAdvancedAnalytics: false,
  hasPriceAlerts: false,
  hasPortfolioTracking: false,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus>(defaultSubscription);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  // Load subscription data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('subscriptionData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Reset daily counter if it's a new day
        const today = new Date().toDateString();
        const lastUsedDate = localStorage.getItem('lastCalculationDate');
        
        if (lastUsedDate !== today) {
          parsed.calculationsToday = 0;
          localStorage.setItem('lastCalculationDate', today);
        }
        
        setSubscription({ ...defaultSubscription, ...parsed });
      } catch (error) {
        console.error('Error loading subscription data:', error);
      }
    }
  }, []);

  // Save subscription data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('subscriptionData', JSON.stringify(subscription));
  }, [subscription]);

  const incrementCalculation = () => {
    setSubscription(prev => ({
      ...prev,
      calculationsToday: prev.calculationsToday + 1,
      calculationsThisMonth: prev.calculationsThisMonth + 1,
    }));
    
    // Mark today as the last calculation date
    localStorage.setItem('lastCalculationDate', new Date().toDateString());
  };

  const canMakeCalculation = (): boolean => {
    if (subscription.hasUnlimitedCalculations) return true;
    return subscription.calculationsToday < subscription.maxCalculationsPerDay;
  };

  const value: SubscriptionContextType = {
    subscription,
    incrementCalculation,
    canMakeCalculation,
    upgradeRequired,
    setUpgradeRequired,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};