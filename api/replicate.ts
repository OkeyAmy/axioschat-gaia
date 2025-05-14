import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// This is a Vercel serverless function that mimics the behavior of your Flask proxy
// but uses Google's Gemini API instead of Replicate
export const config = {
  regions: ['iad1'], // Use your preferred region
};

export default async function handler(req: NextRequest) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Get the API token from the headers
    const apiToken = req.headers.get('X-Replicate-API-Token');
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Gemini API token is required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    if (!requestData) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    console.log('Received request:', JSON.stringify(requestData).substring(0, 500) + '...');

    // Extract the input data from the Replicate-style request
    const input = requestData.input || {};
    const query = input.query || '';
    const tools = input.tools || '[]';
    const temperature = input.temperature || 0.7;
    const top_p = input.top_p || 0.9;
    const max_tokens = input.max_new_tokens || 3000;

    // Parse the tools JSON string to get the actual tools array
    let parsedTools = [];
    try {
      parsedTools = JSON.parse(tools);
    } catch (e) {
      console.error('Error parsing tools JSON:', e);
      return NextResponse.json(
        { error: 'Invalid tools format' },
        { status: 400 }
      );
    }

    // Initialize the OpenAI client with Gemini configuration
    const openai = new OpenAI({
      apiKey: apiToken,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      dangerouslyAllowBrowser: true // Allow use in browser environment
    });

    // Call Gemini API through OpenAI compatibility layer
    const response = await openai.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful Web3 assistant that can execute functions to help users with blockchain tasks.',
        },
        { role: 'user', content: query },
      ],
      tools: parsedTools,
      tool_choice: 'auto',
      temperature,
      max_tokens,
    });

    console.log('Gemini response:', JSON.stringify(response).substring(0, 500) + '...');

    // Process the response to match the format expected by the client
    let output;
    const message = response.choices[0]?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      // Format function calls to match the expected format
      output = message.tool_calls.map(toolCall => {
        if (toolCall.type === 'function') {
          let args = {};
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.error('Error parsing function arguments:', e);
          }

          return {
            type: 'function',
            function: {
              name: toolCall.function.name,
              arguments: args
            }
          };
        }
        return null;
      }).filter(Boolean);
    } else {
      // If no function calls, just return the text
      output = message?.content || '';
    }

    // Return the response in the format expected by the client
    // This mimics the Replicate API response format
    return NextResponse.json({
      id: `gemini-${Date.now()}`,
      status: 'succeeded',
      output,
    });
  } catch (error) {
    console.error('Error in replicate proxy:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        detail: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
