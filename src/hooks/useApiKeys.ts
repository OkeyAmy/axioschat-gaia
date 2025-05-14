"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

export interface ApiKeys {
  replicate: string
  openai: string // For backwards compatibility
  gemini: string // New explicit Gemini key
}

const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ 
    replicate: "", 
    openai: "", 
    gemini: "" 
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Helper function to validate Gaia Network API key format
  const validateGaiaKey = (key: string): boolean => {
    if (!key) return true // Empty key is "valid" (though not usable)
    return key.startsWith('gaia-')
  }

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem("apiKeys")
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys) as Partial<ApiKeys>
        
        // Find the Gaia Network API key - prioritize openai field where the user has it
        let gaiaKey = ""
        
        if (parsedKeys.openai && parsedKeys.openai.startsWith('gaia-')) {
          gaiaKey = parsedKeys.openai
          console.log("Found valid Gaia Network API key in openai field")
        } else if (parsedKeys.gemini && parsedKeys.gemini.startsWith('gaia-')) {
          gaiaKey = parsedKeys.gemini
          console.log("Found valid Gaia Network API key in gemini field")
        } else {
          gaiaKey = parsedKeys.openai || parsedKeys.gemini || ""
        }
        
        setApiKeys({
          replicate: parsedKeys.replicate || "",
          openai: parsedKeys.openai || "",
          gemini: gaiaKey, // Always use gaiaKey for the gemini field to ensure API calls work
        })
        
        // Show warning if key exists but doesn't have the gaia- prefix
        if (gaiaKey && !validateGaiaKey(gaiaKey)) {
          toast({
            title: "Invalid API Key Format",
            description: "Your Gaia Network API key doesn't start with 'gaia-'. Please update it in settings.",
            variant: "destructive",
            duration: 6000,
          })
        }
      } catch (error) {
        console.error("Failed to parse API keys from localStorage:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Update API key and save to localStorage
  const updateApiKey = (key: keyof ApiKeys, value: string) => {
    // For Gemini/Gaia Network key, validate format
    if (key === 'gemini' && value && !validateGaiaKey(value)) {
      toast({
        title: "Invalid API Key Format",
        description: "Gaia Network API keys must start with 'gaia-'. Please check your key and try again.",
        variant: "destructive",
        duration: 6000,
      })
    }
    
    setApiKeys((prev) => {
      const newKeys = { ...prev, [key]: value }
      
      // If updating the Gemini key, also update openai key for backward compatibility
      if (key === 'gemini') {
        newKeys.openai = value
      }
      
      localStorage.setItem("apiKeys", JSON.stringify(newKeys))
      return newKeys
    })
  }

  return {
    apiKeys,
    updateApiKey,
    isLoaded,
  }
}

export default useApiKeys
