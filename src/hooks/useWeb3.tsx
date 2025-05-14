
import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { useAccount, useChainId } from 'wagmi';
import { useWalletClient } from 'wagmi';

export const useWeb3 = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initWeb3 = async () => {
      if (isConnected && window.ethereum) {
        try {
          // Create new Web3 instance using window.ethereum
          const web3Instance = new Web3(window.ethereum);
          
          // Request access to user accounts
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          setWeb3(web3Instance);
          setIsReady(true);
          console.log("Web3 initialized successfully with provider window.ethereum");
        } catch (error) {
          console.error("Error initializing Web3 with window.ethereum:", error);
          
          // Try to use walletClient as fallback
          if (walletClient) {
            try {
              // Attempt to create provider from walletClient
              // @ts-ignore - Assuming walletClient has a provider property
              const provider = walletClient.provider;
              if (provider) {
                const web3Instance = new Web3(provider);
                setWeb3(web3Instance);
                setIsReady(true);
                console.log("Web3 initialized successfully with walletClient provider");
              } else {
                setIsReady(false);
              }
            } catch (walletError) {
              console.error("Error initializing Web3 with walletClient:", walletError);
              setIsReady(false);
            }
          } else {
            setIsReady(false);
          }
        }
      } else {
        setWeb3(null);
        setIsReady(false);
      }
    };

    initWeb3();

    // Handle account changes
    const handleAccountsChanged = () => {
      if (window.ethereum) {
        initWeb3();
      }
    };

    // Handle network changes
    const handleChainChanged = () => {
      if (window.ethereum) {
        window.location.reload();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isConnected, walletClient]);

  return { 
    web3, 
    isReady, 
    address,
    chainId,
    isConnected
  };
};

export default useWeb3;
