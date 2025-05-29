
'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient();

// Configure chains and transports
// For production, consider using environment variables for RPC URLs or dedicated providers like Alchemy/Infura
const config = createConfig({
  chains: [mainnet, sepolia], // Add other EVM chains as needed
  transports: {
    [mainnet.id]: http(), // Uses public RPC, rate limits may apply
    [sepolia.id]: http(), // Uses public RPC for Sepolia testnet
  },
  // Wagmi defaults to an injected connector (like MetaMask) if no connectors are specified.
  // For WalletConnect or other connectors, you'd add them here:
  // connectors: [
  //   walletConnect({ projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' }),
  //   injected(),
  // ],
});

export function AppWagmiProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
