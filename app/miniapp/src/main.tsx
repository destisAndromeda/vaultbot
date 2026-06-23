import { createRoot } from 'react-dom/client';
import App from './App';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

const wallets = [new PhantomWalletAdapter()];
const endpoint = 'https://api.devnet.solana.com';

createRoot(document.getElementById('root')!).render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <App />
    </WalletProvider>
  </ConnectionProvider>
);
