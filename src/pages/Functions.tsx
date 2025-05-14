import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { mainnet } from "wagmi/chains";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowUpDown, ArrowLeftRight, FileCode, Sparkles } from "lucide-react";
import WalletRequired from "@/components/WalletRequired";
import WalletSection from "@/components/functions/WalletSection";
import TransferSection from "@/components/functions/TransferSection";
import TransactionsSection from "@/components/functions/TransactionsSection";
import DexSection from "@/components/functions/DexSection";
import ContractsSection from "@/components/functions/ContractsSection";
import TransactionQueue from "@/components/TransactionQueue";
import { TransactionQueueProvider } from "@/hooks/useTransactionQueue";
import { cn } from "@/lib/utils";

// Define prop interfaces for the components
interface ChainProps {
  currentChain: number;
}

interface ChainSectionProps extends ChainProps {
  setCurrentChain: (chainId: number) => void;
}

const Functions = () => {
  const { isConnected } = useAccount();
  const networkChainId = useChainId() || mainnet.id;
  const [currentChain, setCurrentChain] = useState<number>(mainnet.id);

  // Sync the current chain with the network chain when it changes
  useEffect(() => {
    if (networkChainId) {
      setCurrentChain(networkChainId);
    }
  }, [networkChainId]);
  
  // Make current chain available globally
  useEffect(() => {
    // Expose the transaction queue to the window object for potential access from the chat
    if (window.web3Context) {
      window.web3Context.currentChain = currentChain;
    }
  }, [currentChain]);

  return (
    <TransactionQueueProvider>
      <div className="min-h-screen flex flex-col bg-background dark:bg-slate-950">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Web3 Functions
              </h1>
            </div>
            <p className="text-muted-foreground ml-[52px]">
              Interact with blockchain networks and smart contracts directly from your wallet
            </p>
          </div>
          
          {!isConnected ? (
            <WalletRequired />
          ) : (
            <div className="grid gap-6">
              <Tabs defaultValue="wallet" className="w-full">
                <div className="bg-background border border-border/50 rounded-lg p-1 mb-6 shadow-sm">
                  <TabsList className="w-full grid grid-cols-4 bg-transparent h-auto p-0">
                    <TabsTrigger 
                      value="wallet" 
                      className={cn(
                        "flex items-center gap-2 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      )}
                    >
                      <Wallet className="h-4 w-4" />
                      <span>Wallet</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="transactions" 
                      className={cn(
                        "flex items-center gap-2 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      )}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      <span>Transactions</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="dex" 
                      className={cn(
                        "flex items-center gap-2 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      )}
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      <span>DEX</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="contracts" 
                      className={cn(
                        "flex items-center gap-2 py-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      )}
                    >
                      <FileCode className="h-4 w-4" />
                      <span>Contracts</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="wallet" className="space-y-6 animate-in fade-in-50">
                  <WalletSection 
                    currentChain={currentChain} 
                    setCurrentChain={setCurrentChain} 
                  />
                  <TransferSection currentChain={currentChain} />
                </TabsContent>
                
                <TabsContent value="transactions" className="space-y-6 animate-in fade-in-50">
                  <TransactionsSection />
                </TabsContent>
                
                <TabsContent value="dex" className="space-y-6 animate-in fade-in-50">
                  <DexSection />
                </TabsContent>
                
                <TabsContent value="contracts" className="min-h-[400px] animate-in fade-in-50">
                  <ContractsSection />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
        
        {/* Transaction Queue Component */}
        <TransactionQueue chainId={currentChain} />
      </div>
    </TransactionQueueProvider>
  );
};

export default Functions;
