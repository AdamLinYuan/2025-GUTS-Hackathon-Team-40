import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please set it in your .env file.")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize the model with the updated model name
model = genai.GenerativeModel('gemini-2.0-flash')

# System prompt for the assistant
SYSTEM_PROMPT = """You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.

If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information."""

def get_gemini_response(prompt: str) -> str:
    """Get a non-streaming response from Gemini API"""
    try:
        # Combine system prompt with user prompt
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {prompt}\nAssistant:"
        
        # Generate response
        response = model.generate_content(full_prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        return "I apologize, but I encountered an error while processing your request. Please try again."

def get_gemini_response_stream(prompt):
    """Get a streaming response from Gemini API"""
    try:
        # Combine system prompt with user prompt
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {prompt}\nAssistant:"
        
        # Generate streaming response
        response = model.generate_content(full_prompt, stream=True)
        
        # Stream the response chunks
        for chunk in response:
            if chunk.text:
                yield chunk.text
                
    except Exception as e:
        print(f"Error in streaming response: {str(e)}")
        yield "I apologize, but I encountered an error while processing your request. Please try again."