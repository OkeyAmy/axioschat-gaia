import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKeyInputProps {
  value: string;
  onChange: (key: string) => void;
  placeholder?: string;
  className?: string;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  value,
  onChange,
  placeholder = "Enter API key...",
  className
}) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const toggleShowKey = () => {
    setShowKey(prev => !prev);
  };

  const copyToClipboard = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
    }
  };

  return (
    <div className="relative">
      <Input
        type={showKey ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pr-20 rounded-md", className)}
      />
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-muted/80"
          onClick={toggleShowKey}
          tabIndex={-1}
        >
          {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 rounded-full hover:bg-muted/80",
            copied && "text-green-500"
          )}
          onClick={copyToClipboard}
          disabled={!value}
          tabIndex={-1}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
};

export default ApiKeyInput;
