"use client"

import type React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Settings, X, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import ApiKeyInput from "./ApiKeyInput"

interface ModelSelectorProps {
  useOpenAI: boolean
  onUseOpenAIChange: (value: boolean) => void
  showSettings: boolean
  onShowSettingsChange: (value: boolean) => void
  llamaEndpoint: string
  onLlamaEndpointChange: (value: string) => void
  openaiApiKey: string
  onOpenAIApiKeyChange: (value: string) => void
  replicateApiKey: string
  onReplicateApiKeyChange: (value: string) => void
  className?: string
  debugMode?: boolean
  onDebugModeChange?: (value: boolean) => void
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  useOpenAI,
  onUseOpenAIChange,
  showSettings,
  onShowSettingsChange,
  llamaEndpoint,
  onLlamaEndpointChange,
  openaiApiKey,
  onOpenAIApiKeyChange,
  replicateApiKey,
  onReplicateApiKeyChange,
  className,
  debugMode,
  onDebugModeChange,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShowSettingsChange(!showSettings)}
            className={cn(
              "h-8 px-2 text-xs font-medium rounded-full transition-colors",
              showSettings && "bg-muted text-foreground"
            )}
          >
            {showSettings ? <X className="h-3.5 w-3.5 mr-1" /> : <Settings className="h-3.5 w-3.5 mr-1" />}
            {showSettings ? "Close" : "Settings"}
          </Button>
          {debugMode !== undefined && onDebugModeChange && (
            <div className="flex items-center gap-1.5 text-xs">
              <div className="flex h-8 items-center space-x-1 rounded-full bg-muted px-3">
                <Label htmlFor="debug-mode" className="text-muted-foreground font-medium">
                  Debug
                </Label>
                <Switch
                  id="debug-mode"
                  checked={debugMode}
                  onCheckedChange={onDebugModeChange}
                  className="data-[state=checked]:bg-amber-500"
              />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Label htmlFor="model-toggle" className="font-medium">Model:</Label>
          <div className="flex items-center p-1 rounded-full border border-muted-foreground/20 bg-background shadow-sm">
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 px-3 rounded-full text-xs flex gap-1 items-center transition-all",
                !useOpenAI && "bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium"
              )}
              onClick={() => onUseOpenAIChange(false)}
            >
              <Zap className={cn("h-3 w-3", !useOpenAI && "text-white")} />
              Local
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 px-3 rounded-full text-xs flex gap-1 items-center transition-all",
                useOpenAI && "bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium"
              )}
              onClick={() => onUseOpenAIChange(true)}
            >
              <Sparkles className={cn("h-3 w-3", useOpenAI && "text-white")} />
              Qwen
            </Button>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="border rounded-xl p-3 space-y-3 bg-muted/30 backdrop-blur-sm">
            <div className="space-y-2">
            <Label htmlFor="llama-endpoint" className="text-xs font-medium flex items-center">
              <Zap className="h-3 w-3 mr-1 text-blue-500" />
              Local Endpoint:
              </Label>
            <div className="flex gap-2">
              <input
                id="llama-endpoint"
                type="text"
                value={llamaEndpoint}
                onChange={(e) => onLlamaEndpointChange(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="http://localhost:11434"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center">
              <Sparkles className="h-3 w-3 mr-1 text-green-500" />
              GaiaNet API Key:
            </Label>
            <ApiKeyInput
              value={openaiApiKey}
              onChange={onOpenAIApiKeyChange}
              placeholder="Enter GaiaNet API key (starts with 'gaia-')"
              className="text-xs h-8 bg-background ring-offset-background focus-visible:ring-green-500"
            />
            <div className="text-xs text-muted-foreground">
              Get your API key at <a href="https://www.gaianet.ai/" className="text-green-500 hover:underline" target="_blank" rel="noopener noreferrer">gaianet.ai</a>. 
              <br/>Gaia Network API keys must start with <span className="font-mono bg-muted/50 px-1 rounded">gaia-</span> prefix. 
              <br/>Your key is stored in the OpenAI field but will be used for all Qwen requests.
              <br/>If you're seeing 401 errors, make sure your key is correctly formatted and reconnect your wallet if needed.
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Replicate API Key:</Label>
            <ApiKeyInput
              value={replicateApiKey}
              onChange={onReplicateApiKeyChange}
              placeholder="Enter Replicate API key"
              className="text-xs h-8 bg-background ring-offset-background focus-visible:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelSelector
