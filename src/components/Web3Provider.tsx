
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useAccount, useDisconnect, useConfig } from 'wagmi';
import Web3 from 'web3';

interface Web3ProviderProps {
  children: React.ReactNode;
  onConnect?: (address: string) => void;
}

const Web3Provider: React.FC<Web3ProviderProps> = ({ children, onConnect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [web3Instance, setWeb3Instance] = useState<Web3 | null>(null);
  const config = useConfig();
  
  // Initialize Web3 instance when connected
  useEffect(() => {
    const initWeb3 = async () => {
      if (isConnected && window.ethereum) {
        try {
          setIsLoading(true);
          
          // Request access to the user's accounts
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Create new Web3 instance
          const web3 = new Web3(window.ethereum);
          setWeb3Instance(web3);
          
          console.log("Web3 initialized with provider:", window.ethereum);
          console.log("Connected to chain ID:", await web3.eth.getChainId());
          
          setIsLoading(false);
        } catch (error) {
          console.error("Error initializing Web3:", error);
          setIsLoading(false);
          
          toast({
            title: "Connection Error",
            description: "Failed to initialize Web3. Please refresh and try again.",
            variant: "destructive",
          });
        }
      } else {
        setWeb3Instance(null);
      }
    };

    initWeb3();
  }, [isConnected, chain]);

  // Handle wallet connection
  useEffect(() => {
    if (address && isConnected && onConnect) {
      onConnect(address);
      
      toast({
        title: "Wallet connected",
        description: `Connected to address: ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    }
  }, [address, isConnected, onConnect]);

  // Handle chain changes
  useEffect(() => {
    const handleChainChanged = () => {
      window.location.reload();
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect();
        setWeb3Instance(null);
      } else {
        // Account changed, reinitialize web3
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum);
          setWeb3Instance(web3);
        }
      }
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [disconnect]);

  // Expose the wallet connection methods to child components
  const contextValue = {
    connectWallet: () => {
      // This is handled by RainbowKit's ConnectButton
      console.log("Use RainbowKit's ConnectButton to connect wallet");
    },
    disconnectWallet: () => {
      disconnect();
    },
    isLoading,
    walletAddress: address,
    isConnected,
    web3: web3Instance,
    chainId: chain?.id
  };

  // Add this to the window for child components to access
  useEffect(() => {
    // @ts-ignore
    window.web3Context = contextValue;
  }, [isLoading, address, isConnected, web3Instance, chain]);

  return <>{children}</>;
};

export default Web3Provider;
