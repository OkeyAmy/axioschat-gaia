from flask import Flask, request, jsonify
import requests
import os
import json
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
OLLAMA_BASE_URL = "http://localhost:11434"  # Default Ollama endpoint
REPLICATE_API_URL = "https://api.replicate.com/v1/predictions"

@app.route('/api/replicate', methods=['POST'])
def proxy_replicate():
    """
    This endpoint forwards requests to the Replicate API using the HTTP API approach
    """
    # Get the request data
    request_data = request.json
    
    if not request_data:
        return jsonify({"error": "Request body is required"}), 400
    
    # Get the API token from the headers
    api_token = request.headers.get('X-Replicate-API-Token')
    if not api_token:
        return jsonify({"error": "Replicate API token is required"}), 401
    
    print(f"Forwarding request to Replicate API: {json.dumps(request_data)[:500]}...")
    
    # Implement retry mechanism for cold starts
    max_retries = 2
    retry_count = 0
    
    while retry_count <= max_retries:
        try:
            # Forward the request to Replicate API using the HTTP API approach
            response = requests.post(
                REPLICATE_API_URL,
                headers={
                    "Authorization": f"Bearer {api_token}",
                    "Content-Type": "application/json",
                    "Prefer": "wait"  # Added Prefer: wait header to wait for completion
                },
                json=request_data,
                timeout=30  # Add a timeout to prevent hanging
            )
            
            # Get the response from Replicate
            try:
                response_data = response.json()
                print(f"Raw Replicate API response: {json.dumps(response_data)[:500]}...")
                
                # Add more detailed logging for the output field
                if 'output' in response_data:
                    print(f"COMPLETE OUTPUT: {json.dumps(response_data['output'])}")
                    
                    # Parse output for better debugging
                    if response_data['output'] is not None:
                        try:
                            if isinstance(response_data['output'], str):
                                # Try to parse the string as JSON
                                parsed_output = json.loads(response_data['output'])
                                print(f"Parsed output (JSON): {json.dumps(parsed_output, indent=2)}")
                                
                                # If it's an array of strings, try to parse each string
                                if isinstance(parsed_output, list):
                                    parsed_items = []
                                    for item in parsed_output:
                                        if isinstance(item, str) and (item.startswith('{') or item.startswith('[')):
                                            try:
                                                parsed_item = json.loads(item)
                                                parsed_items.append(parsed_item)
                                            except:
                                                parsed_items.append(item)
                                        else:
                                            parsed_items.append(item)
                                    print(f"Parsed items: {json.dumps(parsed_items, indent=2)}")
                        except Exception as e:
                            print(f"Error parsing output JSON: {str(e)}")
                            print(f"Raw output: {response_data['output']}")
                else:
                    print("No 'output' field found in response")
                
                # If there's an error, print the full response for debugging
                if not response.ok:
                    print(f"FULL ERROR RESPONSE: {json.dumps(response_data)}")
            except:
                print(f"Non-JSON response from Replicate API: {response.text[:500]}...")
                return jsonify({"error": f"Invalid response from Replicate API: {response.text[:200]}..."}), response.status_code
            
            # Check if we got a null output (cold start)
            if response.ok and response_data.get('output') is None and retry_count < max_retries:
                print(f"Attempt {retry_count + 1}: Replicate returned null output (cold start). Retrying...")
                retry_count += 1
                # Wait before retrying (exponential backoff)
                time.sleep(2 ** retry_count)
                continue
            
            if not response.ok:
                error_message = f"Error from Replicate API: {response_data}"
                print(error_message)
                return jsonify(response_data), response.status_code
            
            # With Prefer: wait, we should get the completed prediction directly
            # No need to poll for results
            return jsonify(response_data)
            
        except Exception as e:
            error_message = f"Error communicating with Replicate API: {str(e)}"
            print(error_message)
            
            retry_count += 1
            if retry_count <= max_retries:
                print(f"Retrying request (attempt {retry_count}/{max_retries})...")
                time.sleep(2 ** retry_count)  # Exponential backoff
                continue
            
            return jsonify({"error": error_message}), 500
    
    return jsonify({"error": "Maximum retries exceeded"}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle local LLM chat requests using Ollama"""
    try:
        request_data = request.json
        
        if not request_data:
            return jsonify({"error": "Request body is required"}), 400
        
        # Extract messages from the request
        messages = request_data.get('messages', [])
        
        if not messages:
            return jsonify({"error": "No messages provided"}), 400
        
        # Format messages for Ollama
        formatted_messages = []
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            formatted_messages.append({"role": role, "content": content})
        
        # Prepare the request for Ollama
        ollama_request = {
            "model": request_data.get('model', 'llama3'),
            "messages": formatted_messages,
            "stream": False,
            "options": {
                "temperature": request_data.get('temperature', 0.7)
            }
        }
        
        print(f"Sending chat request to Ollama: {json.dumps(ollama_request)[:100]}...")
        
        # Send request to Ollama
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            headers={"Content-Type": "application/json"},
            json=ollama_request
        )
        
        if not response.ok:
            error_message = f"Error from Ollama API: {response.status_code} {response.text}"
            print(error_message)
            return jsonify({"error": error_message}), response.status_code
        
        # Parse Ollama response
        ollama_response = response.json()
        
        # Format response to match what the frontend expects
        assistant_message = ollama_response.get("message", {})
        formatted_response = {
            "message": {
                "role": "assistant",
                "content": assistant_message.get("content", "No response from Ollama")
            }
        }
        
        return jsonify(formatted_response)
    
    except Exception as e:
        error_message = f"Error in chat endpoint: {str(e)}"
        print(error_message)
        return jsonify({"error": error_message}), 500

@app.route('/api/ollama', methods=['POST'])
def ollama_proxy():
    """
    This endpoint forwards requests to Ollama as a fallback
    when Replicate API is not available or for testing
    """
    # Get the request data
    request_data = request.json
    
    if not request_data:
        return jsonify({"error": "Request body is required"}), 400
    
    # Extract the query and other parameters from the request
    input_data = request_data.get('input', {})
    query = input_data.get('query', '')
    temperature = input_data.get('temperature', 0.7)
    
    print(f"Forwarding request to Ollama: {query[:100]}...")
    
    # Prepare the request for Ollama
    ollama_request = {
        "model": "llama3",  # You can change this to your preferred model
        "prompt": query,
        "stream": False,
        "options": {
            "temperature": temperature
        }
    }
    
    try:
        # Send request to Ollama
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            headers={"Content-Type": "application/json"},
            json=ollama_request
        )
        
        if not response.ok:
            error_message = f"Error from Ollama API: {response.status_code} {response.text}"
            print(error_message)
            return jsonify({"error": error_message}), response.status_code
        
        # Parse Ollama response
        ollama_response = response.json()
        
        # Format response to match what the frontend expects from Replicate
        formatted_response = {
            "id": "ollama-response",
            "status": "succeeded",
            "output": ollama_response.get("response", "No response from Ollama")
        }
        
        return jsonify(formatted_response)
    
    except Exception as e:
        error_message = f"Error communicating with Ollama: {str(e)}"
        print(error_message)
        return jsonify({"error": error_message}), 500

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 3000))
    
    # Allow configuring Ollama endpoint from environment
    ollama_url = os.environ.get('OLLAMA_URL')
    if ollama_url:
        OLLAMA_BASE_URL = ollama_url
    
    print(f"Using Ollama endpoint: {OLLAMA_BASE_URL}")
    print(f"Server running on port {port}")
    
    app.run(host='0.0.0.0', port=port, debug=True)
