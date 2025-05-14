import { NextRequest } from 'next/server';

// This is a Vercel serverless function that acts as a proxy for Qwen API via Gaia Network
// to avoid CORS issues with browser-based requests
export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gemini-API-Key',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Only allow POST requests for actual API calls
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get the API token from the headers
    const apiToken = req.headers.get('X-Gemini-API-Key');
    if (!apiToken) {
      console.error('Missing Gaia Network API key in headers');
      return new Response(JSON.stringify({
        error: 'Gaia Network API token is required',
        details: 'The X-Gemini-API-Key header is missing or empty'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Verify that the API key has the correct format (starts with 'gaia-')
    if (!apiToken.startsWith('gaia-')) {
      console.error('Invalid Gaia Network API key format: key does not start with "gaia-"');
      return new Response(JSON.stringify({
        error: 'Invalid Gaia Network API key format',
        details: 'The API key must start with "gaia-". Please disconnect and reconnect your wallet or update your API key in settings.'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Log that we received a key (mask most of it for security)
    const maskedKey = apiToken.substring(0, 8) + '...' + apiToken.substring(apiToken.length - 4);
    console.log(`Received API key in gemini-proxy: ${maskedKey}`);

    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to parse request body',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!requestData) {
      return new Response(JSON.stringify({
        error: 'Request body is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('Alternative proxy handling request for Gaia Network Qwen API');

    // Extract parameters from the request
    const {
      model = 'qwen72b',
      messages,
      temperature = 0.7,
      max_tokens = 5000
    } = requestData;

    // Using direct fetch for OpenAI-compatible Gaia Network API
    const gaiaEndpoint = 'https://qwen72b.gaia.domains/v1/chat/completions';
    console.log(`Making request to Gaia Network endpoint: ${gaiaEndpoint}`);

    const response = await fetch(gaiaEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens
      })
    });

    // Check if the response is OK
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error(`Gaia Network API error (${response.status}):`, errorText);
      } catch (error) {
        errorText = 'Could not read error response';
      }
      
      return new Response(JSON.stringify({
        error: `Gaia Network API returned ${response.status}`,
        details: errorText
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get the response data
    let responseData;
    try {
      responseData = await response.json();
      console.log('Received response from Gaia Network API');
      
      // Return the response directly as Gaia Network API is already OpenAI-compatible
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gemini-API-Key'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to parse Gaia Network API response',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error('Error in gemini-proxy:', error);
    
    return new Response(JSON.stringify({
      error: 'Proxy server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 