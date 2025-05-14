
import { Web3 } from 'web3';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, callback: (...args: any[]) => void) => void;
      removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
    };
    web3Context?: {
      connectWallet: () => void;
      disconnectWallet: () => void;
      isLoading: boolean;
      walletAddress?: string;
      isConnected: boolean;
      web3?: Web3;
      currentChain?: number;
    };
    transactionQueue?: {
      add: (tx: any) => string;
      execute: (id: string) => Promise<void>;
      remove: (id: string) => void;
      clear: () => void;
      getQueue: () => any[];
    };
  }
}
