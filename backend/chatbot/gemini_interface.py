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
SYSTEM_PROMPT = """You are playing a game with the user that has a few simple rules. The user has a secret word which it is going to try to
describe without saying the word itself. You have to guess the word based on the user's description. Only respond with your guess. You are allowed to say "I don't know" if the sentence could be describing many things or doesn't make sense. If the guess is a person, use their full name. 
Do not ask any questions. You should not guess the same thing twice in a row"""

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