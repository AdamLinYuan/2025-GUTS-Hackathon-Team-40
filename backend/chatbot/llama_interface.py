from llama_cpp import Llama

# Load model once (change path to your .gguf model)
llm = Llama(model_path="./models/llama-2-7b-chat.Q4_K_M.gguf", n_ctx=2048)

def get_llama_response(prompt: str) -> str:
    # Using the proper Llama 2 Chat template without the leading <s>
    formatted_prompt = f"""[INST] <<SYS>>
You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.

If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.
<</SYS>>

{prompt} [/INST]"""

    # Use a shorter response for the demo
    output = llm(formatted_prompt, max_tokens=256, stop=["[INST]", "</s>"], echo=False)
    return output["choices"][0]["text"].strip()

# For streaming responses, we need a different approach
def get_llama_response_stream(prompt):
    # Using the proper Llama 2 Chat template without the leading <s>
    formatted_prompt = f"""[INST] <<SYS>>
You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.

If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.
<</SYS>>

{prompt} [/INST]"""

    # Using the streaming capabilities of llama_cpp
    output_chunks = []
    
    # This simulates streaming by returning output in meaningful chunks
    completion_generator = llm.create_completion(
        formatted_prompt,
        max_tokens=512,
        stop=["[INST]", "</s>"],
        stream=True,
        echo=False
    )
    
    # Process the streaming response in chunks
    for token in completion_generator:
        chunk = token['choices'][0]['text']
        output_chunks.append(chunk)
        # Yield to create a true streaming experience
        yield chunk
    
    # Return the full text if needed
    return ''.join(output_chunks)