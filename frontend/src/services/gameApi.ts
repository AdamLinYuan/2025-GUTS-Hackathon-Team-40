// API service for the AI Articulate game
const API_BASE_URL = 'http://localhost:8000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create headers with authentication
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  };
};

export interface GameSession {
  id: string;
  title: string;
  score: number;
  current_word: string;
  num_rounds: number;
}

export interface Message {
  id: number;
  sender: 'user' | 'bot';
  content: string;
  created_at: string;
}

/**
 * Start a new game session
 */
export const startGameSession = async (
  category: string,
  subcategory: string,
  totalRounds: number
): Promise<GameSession> => {
  const response = await fetch(`${API_BASE_URL}/chat-stream/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      conversation_id: null,
      prompt: `Starting game: ${category} - ${subcategory}, ${totalRounds} rounds`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to start game session:', error);
    throw new Error(`Failed to start game session: ${response.status} ${response.statusText}`);
  }

  // For SSE, we need to read the stream to get the conversation_id
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let conversationId = '';

  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done && data.conversation_id) {
                conversationId = data.conversation_id;
                break;
              }
            } catch (e) {
              console.error('Error parsing SSE line:', e);
            }
          }
        }

        if (conversationId) break;
      }
    } finally {
      reader.releaseLock();
    }
  }

  if (!conversationId) {
    throw new Error('Failed to retrieve conversation ID from stream');
  }

  // Fetch the conversation details
  const convResponse = await fetch(`${API_BASE_URL}/conversations/${conversationId}/`, {
    headers: getHeaders(),
  });

  if (!convResponse.ok) {
    throw new Error('Failed to fetch conversation details');
  }

  return convResponse.json();
};

/**
 * Get conversation details (to retrieve current word)
 */
export const getConversationDetails = async (conversationId: string): Promise<GameSession> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch conversation');
  }

  return response.json();
};

/**
 * Submit a clue and get AI's response via streaming
 */
export const submitClueAndGetGuess = async (
  conversationId: string,
  clue: string,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string, isCorrect: boolean) => void
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/chat-stream/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      conversation_id: conversationId,
      prompt: clue,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit clue');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.chunk) {
              fullResponse += data.chunk;
              onChunk(data.chunk);
            }

            if (data.done) {
              // Check if the response contains a correct guess
              // The backend updates the conversation when AI guesses correctly
              const updatedConv = await getConversationDetails(conversationId);
              const isCorrect = updatedConv.score > 0; // Score increments when AI guesses
              onComplete(fullResponse, isCorrect);
              return;
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  }
};

/**
 * Get the current word for the conversation
 */
export const getCurrentWord = async (conversationId: string): Promise<string> => {
  const conversation = await getConversationDetails(conversationId);
  return conversation.current_word;
};

/**
 * Check if AI guessed correctly by comparing responses
 */
export const checkIfCorrectGuess = async (
  conversationId: string,
  previousScore: number
): Promise<{ isCorrect: boolean; newScore: number; newWord: string }> => {
  const conversation = await getConversationDetails(conversationId);
  const isCorrect = conversation.score > previousScore;
  
  return {
    isCorrect,
    newScore: conversation.score,
    newWord: conversation.current_word,
  };
};
