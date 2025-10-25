import os
import json
import re
try:
    import google.generativeai as genai
except Exception:
    genai = None  # type: ignore
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')

if genai is not None:
    if GEMINI_API_KEY:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.0-flash')
        except Exception as _e:
            # Configuration failed (bad key or model name)
            print(f"Gemini configuration error: {_e}")
            model = None  # type: ignore
    else:
        model = None  # type: ignore
else:
    model = None  # type: ignore

SYSTEM_PROMPT = """You are playing a game with the user that has a few simple rules. The user has a secret word which it is going to try to
describe without saying the word itself. You have to guess the word based on the user's description. Only respond with your guess. You are allowed to say "I don't know" if the sentence could be describing many things or doesn't make sense. If the guess is a person, use their full name. 
Do not ask any questions. You should not guess the same thing twice in a row"""

def get_gemini_response(prompt: str) -> str:
    try:
        if genai is None:
            raise RuntimeError("Gemini SDK (google-generativeai) is not installed in this environment")
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) is missing from environment/.env")
        if model is None:
            raise RuntimeError("Gemini model not configured (check API key validity and model name)")
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {prompt}\nAssistant:"
        response = model.generate_content(full_prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        return "I apologize, but I encountered an error while processing your request. Please try again."

def get_gemini_response_stream(prompt):
    try:
        if genai is None:
            raise RuntimeError("Gemini SDK (google-generativeai) is not installed in this environment")
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) is missing from environment/.env")
        if model is None:
            raise RuntimeError("Gemini model not configured (check API key validity and model name)")
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {prompt}\nAssistant:"
        response = model.generate_content(full_prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text
                
    except Exception as e:
        print(f"Error in streaming response: {str(e)}")
        yield "I apologize, but I encountered an error while processing your request. Please try again."


def extract_terms_from_pdf(pdf_bytes: bytes, max_terms: int = 150) -> list:
    if not pdf_bytes:
        raise ValueError("No PDF bytes provided")

    max_terms = max(1, min(int(max_terms or 150), 150))

    prompt = (
                "Read and analyze the uploaded PDF. "
                "Respond ONLY with a JSON array of the most important terms, "
                "including names, organizations, and domain-specific terminology when possible. "
                f"Return ONLY strict JSON with the following schema: {{\n  \"terms\": [\"term1\", \"term2\", ...]\n}}. "
                f"Return at most {max_terms} items. No commentary, no markdown fences."
            )

    try:
        if genai is None:
            raise RuntimeError("Gemini SDK (google-generativeai) is not installed in this environment")
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) is missing from environment/.env")
        if model is None:
            raise RuntimeError("Gemini model not configured (check API key validity and model name)")
        file_part = {"mime_type": "application/pdf", "data": pdf_bytes}
        response = model.generate_content([prompt, file_part])
        text = (response.text or "").strip()

        def _extract_json(s: str) -> dict:
            s = s.strip()
            s = re.sub(r"^```(json)?|```$", "", s, flags=re.IGNORECASE | re.MULTILINE).strip()
            m = re.search(r"\{[\s\S]*\}", s)
            if m:
                s = m.group(0)
            return json.loads(s)

        data = _extract_json(text)
        terms = data.get("terms", []) if isinstance(data, dict) else []
        seen = set()
        result = []
        for t in terms:
            if not isinstance(t, str):
                continue
            cleaned = t.strip()
            if cleaned and cleaned.lower() not in seen:
                seen.add(cleaned.lower())
                result.append(cleaned)
            if len(result) >= max_terms:
                break
        return result
    except Exception as e:
        print(f"Error extracting terms from PDF: {e}")
        return []