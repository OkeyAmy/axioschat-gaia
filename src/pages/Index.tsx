
import React, { useState } from 'react';
import Header from '@/components/Header';
import ChatHistory from '@/components/ChatHistory';
import ChatMessages from '@/components/ChatMessages';

const Home: React.FC = () => {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);

  const handleSelectChat = (chatId: number, messages: { role: string; content: string }[]) => {
    setActiveChat(chatId);
    setChatMessages(messages || []);
  };

  const handleNewChat = () => {
    const newChatId = Date.now();
    setActiveChat(newChatId);
    setChatMessages([]); // Clear messages for a new chat
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-1/4 p-4 flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Your Chats</h2>
          <p className="text-muted-foreground mb-4">
            Select a chat to continue or start a new one.
          </p>
          <ChatHistory 
            onSelectChat={handleSelectChat} 
            onNewChat={handleNewChat} 
            activeChat={activeChat} 
            currentChain={1} // Add the missing currentChain prop
          />
        </div>
        <div className="w-full md:w-3/4 p-4">
          <ChatMessages messages={chatMessages} />
        </div>
      </div>
    </div>
  );
};

export default Home;
