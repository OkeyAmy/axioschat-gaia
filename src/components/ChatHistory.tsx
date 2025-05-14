import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquarePlus, RotateCcw, ChevronRight, ChevronLeft, Clock, Search, Calendar, Filter, ArrowDownUp, MessageCircle, CalendarDays, Trash2, Pin, PlusCircle, LayoutGrid, MoreHorizontal, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import useWeb3 from "@/hooks/useWeb3";
import { fetchRecentTransactions } from "@/utils/blockchain";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatHistoryProps {
  onSelectChat: (chatId: number, messages: Array<{ role: string; content: string }>) => void;
  onNewChat: () => void;
  activeChat: number | null;
  currentChain: number;
  onCollapseChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
}

// Helper function to format dates nicely
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // If today, show time only
  if (date.toDateString() === now.toDateString()) {
    return format(date, 'h:mm a');
  }
  
  // If within the last 7 days, show day name
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  if (date > oneWeekAgo) {
    return format(date, 'EEE');
  }
  
  // Otherwise show date
  return format(date, 'MMM d');
};

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  onSelectChat, 
  onNewChat, 
  activeChat, 
  currentChain,
  onCollapseChange = () => {},
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByDate, setGroupByDate] = useState(true);
  const [currentTab, setCurrentTab] = useState('recent');
  const [pinnedChats, setPinnedChats] = useState<number[]>([]);
  
  // Mock data - this would be fetched from a real API in production
  const [history, setHistory] = useState([
    {
      id: 1,
      title: "Smart Contract Deployment",
      messages: [
        { role: "user", content: "How do I deploy a smart contract on Ethereum?" },
        { role: "assistant", content: "To deploy a smart contract on Ethereum, you'll need:\n\n1. Your compiled contract code\n2. Access to an Ethereum node\n3. Some ETH for gas fees\n\nYou can use tools like Hardhat or Truffle to simplify the process." }
      ],
      timestamp: Date.now() - 1000000,
      last_message: "To deploy a smart contract on Ethereum, you'll need..."
    },
    {
      id: 2,
      title: "Understanding Blockchain",
      messages: [
        { role: "user", content: "Can you explain how blockchain works?" },
        { role: "assistant", content: "Blockchain is a distributed ledger technology that maintains a continuously growing list of records called blocks. Each block contains a timestamp and a link to the previous block, forming a chain." }
      ],
      timestamp: Date.now() - 2500000,
      last_message: "Blockchain is a distributed ledger technology that maintains..."
    },
    {
      id: 3,
      title: "Crypto Wallets",
      messages: [
        { role: "user", content: "What's the difference between hot and cold wallets?" },
        { role: "assistant", content: "Hot wallets are connected to the internet, making them more convenient but less secure. Cold wallets are offline storage options, offering better security but less convenience." }
      ],
      timestamp: Date.now() - 84000000,
      last_message: "Hot wallets are connected to the internet, making them..."
    }
  ]);

  // Effect for collapsing sidebar
  useEffect(() => {
    if (isCollapsed !== defaultCollapsed) {
      setIsCollapsed(defaultCollapsed);
    }
  }, [defaultCollapsed]);

  // Handle collapse change
  const handleCollapseChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapseChange(collapsed);
  };

  // Toggle pin status
  const togglePin = (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId) 
        : [...prev, chatId]
    );
  };

  // Filter chats based on search
  const filteredHistory = searchQuery 
    ? history.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.last_message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history;

  // Group chats by date if enabled
  const groupedChats = () => {
    if (!groupByDate) return { all: filteredHistory };
    
    return filteredHistory.reduce((groups: {[key: string]: typeof history}, chat) => {
      const date = new Date(chat.timestamp);
      const now = new Date();
      
      let group = 'older';
      
      if (date.toDateString() === now.toDateString()) {
        group = 'today';
      } else if (date > new Date(now.setDate(now.getDate() - 7))) {
        group = 'thisWeek';
      } else if (date > new Date(now.setDate(now.getDate() - 30))) {
        group = 'thisMonth';
      }
      
      if (!groups[group]) groups[group] = [];
      groups[group].push(chat);
      return groups;
    }, {});
  };

  // Render the collapsed state view
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col border rounded-lg bg-background/80 shadow-sm">
        <div className="flex items-center justify-center p-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCollapseChange(false)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="h-8 w-8 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            title="New Chat"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCollapseChange(false)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Chat History"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border rounded-2xl bg-background/80 backdrop-blur-sm shadow-md overflow-hidden">
      {/* Header with improved visual styling */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-400/10">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Chat History
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Display Options</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Group by date</span>
                  <Button 
                    variant={groupByDate ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setGroupByDate(!groupByDate)}
                    className="h-7 text-xs"
                  >
                    {groupByDate ? "On" : "Off"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCollapseChange(true)}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Animated search section */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-b bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 bg-background/80 rounded-xl text-sm border-indigo-100 dark:border-indigo-800/30 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* New chat and action buttons */}
      <div className="p-4 flex gap-2">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md shadow-indigo-500/10 rounded-xl"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          className="shrink-0 h-9 w-9 rounded-xl border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          title="Refresh conversations"
          onClick={() => setHistory([...history])}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Tabs for chat organization */}
      <div className="px-4">
        <Tabs defaultValue="recent" value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="w-full bg-muted/50 h-9 p-1 rounded-lg">
            <TabsTrigger value="recent" className="rounded-md text-xs h-7">Recent</TabsTrigger>
            <TabsTrigger value="pinned" className="rounded-md text-xs h-7">Pinned</TabsTrigger>
            <TabsTrigger value="all" className="rounded-md text-xs h-7">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Chat list with groups */}
      <ScrollArea className="flex-1 px-4 py-3">
        <AnimatePresence initial={false}>
          {currentTab === 'pinned' ? (
            // Pinned chats view
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium text-muted-foreground">Pinned Conversations</h4>
              </div>
              {filteredHistory
                .filter(chat => pinnedChats.includes(chat.id))
                .map((chat, index) => renderChatItem(chat, index))}
            </div>
          ) : groupByDate ? (
            // Grouped chats view
            <div className="space-y-6">
              {Object.entries(groupedChats()).map(([group, chats]) => {
                if (chats.length === 0) return null;
                
                let groupTitle = 'Older';
                if (group === 'today') groupTitle = 'Today';
                if (group === 'thisWeek') groupTitle = 'This Week';
                if (group === 'thisMonth') groupTitle = 'This Month';
                
                return (
                  <div key={group} className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" />
                        {groupTitle}
                      </h4>
                      <span className="text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full">
                        {chats.length}
                      </span>
                    </div>
                    {chats.map((chat, index) => renderChatItem(chat, index))}
                  </div>
                );
              })}
            </div>
          ) : (
            // All chats ungrouped
            <div className="space-y-3">
              {filteredHistory.map((chat, index) => renderChatItem(chat, index))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
  
  // Helper function to render an individual chat item
  function renderChatItem(chat: any, index: number) {
    const isPinned = pinnedChats.includes(chat.id);
    
    return (
      <motion.div 
        key={chat.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        className={cn(
          "p-3 rounded-xl cursor-pointer transition-all duration-200 group relative",
          "hover:shadow-md",
          activeChat === chat.id 
            ? "bg-gradient-to-r from-indigo-100/80 to-purple-100/80 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-sm border border-indigo-200/50 dark:border-indigo-800/30" 
            : "bg-card/40 border border-transparent hover:border-indigo-200/50 dark:hover:border-indigo-800/30 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-950/30 dark:hover:to-purple-950/30"
        )}
        onClick={() => onSelectChat(chat.id, chat.messages)}
      >
        <div className="flex items-center justify-between mb-1">
          <h4 className={cn(
            "font-medium text-sm truncate transition-colors max-w-[80%]",
            activeChat === chat.id ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
          )}>
            {chat.title}
          </h4>
          <span className="text-[10px] text-muted-foreground bg-muted/50 dark:bg-muted/30 px-1.5 py-0.5 rounded-full flex items-center shrink-0">
            {formatDate(chat.timestamp)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {chat.last_message}
        </p>
        
        {/* Action buttons */}
        <div className="absolute right-2 top-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-background/80"
            onClick={(e) => togglePin(chat.id, e)}
          >
            <Pin className={cn(
              "h-3 w-3", 
              isPinned ? "text-indigo-500 fill-indigo-500" : "text-muted-foreground"
            )} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-background/80"
                onClick={(e) => e.stopPropagation()} // Prevent triggering chat selection
              >
                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-xs cursor-pointer">
                <Pin className="h-3.5 w-3.5 mr-2" /> 
                {isPinned ? "Unpin chat" : "Pin chat"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer">
                <MessageSquarePlus className="h-3.5 w-3.5 mr-2" /> 
                Continue as new
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs cursor-pointer text-red-500">
                <Trash2 className="h-3.5 w-3.5 mr-2" /> 
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  }
};

export default ChatHistory;
