import '../index.css';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

// Define types
type ChatbotResponse = {
  response: string;
};

type Message = {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
  isEditing?: boolean;
};

const ChatPage = () => {
    const { isDarkMode, toggleDarkMode } = useTheme(); // Use theme from context
    const authContext = useAuth(); // Use authentication context
    const navigate = useNavigate();
    
    const [prompt, setPrompt] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [editingMessage, setEditingMessage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [conversations, setConversations] = useState<any[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false); // Track if a message is currently streaming

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authContext.loading && !authContext.isAuthenticated) {
      navigate('/login');
    }
  }, [authContext.isAuthenticated, authContext.loading, navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [prompt]);

  useEffect(() => {
    // Skip if authentication is still loading or not authenticated
    if (authContext.loading || !authContext.isAuthenticated || !authContext.token) return;
    
    console.log("Auth is ready, checking for saved conversation");
    
    // Load conversation ID from localStorage
    const savedConversationId = localStorage.getItem('currentConversationId');
    
    if (savedConversationId) {
      console.log("Found saved conversation ID:", savedConversationId);
      
      // First fetch the list of conversations to ensure we have the latest data
      fetchConversations().then(() => {
        // Now load the specific conversation
        fetch(`http://localhost:8000/api/conversations/${savedConversationId}/`, {
          headers: {
            'Authorization': `Token ${authContext.token}`
          }
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            console.error("Failed to fetch conversation:", response.status);
            throw new Error("Failed to fetch conversation");
          }
        })
        .then(data => {
          console.log("Successfully loaded conversation:", data);
          
          // Update current conversation ID
          setCurrentConversationId(savedConversationId);
          
          // Transform the messages
          if (data.messages && Array.isArray(data.messages)) {
            // Define interface for the server-side message format
            interface ServerMessage {
              id: number | string;
              sender: 'user' | 'bot';
              content: string;
              created_at: string;
            }
            
            const formattedMessages = data.messages.map((msg: ServerMessage) => ({
              id: msg.id.toString(),
              sender: msg.sender,
              message: msg.content,
              timestamp: new Date(msg.created_at)
            }));
            
            console.log("Setting messages:", formattedMessages);
            setMessages(formattedMessages);
          } else {
            console.error("Invalid messages data:", data.messages);
          }
        })
        .catch(error => {
          console.error("Error loading conversation:", error);
          // Remove invalid conversation ID
          localStorage.removeItem('currentConversationId');
          setCurrentConversationId(null);
        });
      });
    } else {
      console.log("No saved conversation ID");
      // Ensure we still load the conversations list
      fetchConversations();
    }
  }, [authContext.token, authContext.isAuthenticated, authContext.loading]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/conversations/', {
        headers: {
          'Authorization': `Token ${authContext.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched conversations:", data);
        setConversations(data);
        return data;
      } else {
        console.error("Failed to fetch conversations:", response.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/conversations/${conversationId}/`, {
        headers: {
          'Authorization': `Token ${authContext.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Transform messages to our format
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender,
          message: msg.content,
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
        setCurrentConversationId(conversationId);
        localStorage.setItem('currentConversationId', conversationId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    localStorage.removeItem('currentConversationId');
  };

  const sendMessage = async () => {
    if (!prompt.trim()) return;

    if (editingMessage) {
      // Update existing message
      setMessages(
        messages.map((msg) =>
          msg.id === editingMessage
            ? { ...msg, message: prompt, timestamp: new Date() }
            : msg
        )
      );
      setEditingMessage(null);
      setPrompt('');
      return;
    }

    // Create a new message
    setLoading(true);
    const newMessageId = generateId();
    setMessages((prev) => [
      ...prev,
      {
        id: newMessageId,
        sender: 'user',
        message: prompt,
        timestamp: new Date(),
      },
    ]);
    
    const currentPrompt = prompt;
    setPrompt(''); // Clear input immediately after sending

    try {
      // Show typing indicator
      setIsTyping(true);

      // Get the current conversation ID if any
      const conversationId = localStorage.getItem('currentConversationId');
      
      // Create a fetch request for streaming with auth token
      const response = await fetch('http://localhost:8000/api/chat-stream/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${authContext.token}`
        },
        body: JSON.stringify({ 
          prompt: currentPrompt,
          conversation_id: conversationId 
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      
      // Create bot message with empty content initially
      const botMessageId = generateId();
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          sender: 'bot',
          message: '',
          timestamp: new Date(),
        },
      ]);

      // Hide typing indicator now that we're streaming
      setIsTyping(false);
      
      // Stream response
      await streamResponse(response, botMessageId);
      
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          sender: 'bot',
          message: 'Something went wrong. Try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const streamResponse = async (response: Response, botMessageId: string) => {
    setIsStreaming(true);
    
    try {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      
      let accumulatedMessage = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("Stream complete");
          break;
        }
        
        // Decode and process the chunk
        const chunk = decoder.decode(value, { stream: true });
        console.log("Received chunk:", chunk);
        
        // Process each line
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const eventData = JSON.parse(line.substring(5));
              
              // Append the new chunk to our accumulated message
              accumulatedMessage += eventData.chunk || '';
              
              // Update the bot message with the accumulated content
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === botMessageId 
                    ? { ...msg, message: accumulatedMessage } 
                    : msg
                )
              );
              
              // If this is the last chunk, store the conversation ID
              if (eventData.done && eventData.conversation_id) {
                console.log("Setting conversation ID from stream:", eventData.conversation_id);
                localStorage.setItem('currentConversationId', eventData.conversation_id);
                setCurrentConversationId(eventData.conversation_id);
                // Refresh conversations list
                fetchConversations();
              }
            } catch (e) {
              console.error('Error parsing event data:', e, line.substring(5));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in stream processing:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  const editMessage = (id: string) => {
    const messageToEdit = messages.find((msg) => msg.id === id);
    if (messageToEdit) {
      // Find the index of the message
      const messageIndex = messages.findIndex((msg) => msg.id === id);
      
      // Keep only messages up to the one being edited
      const updatedMessages = messages.slice(0, messageIndex + 1);
      setMessages(updatedMessages);
      
      setEditingMessage(id);
      setPrompt(messageToEdit.message);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleSubmit = () => {
    if (editingMessage) {
      submitEditedMessage();
    } else {
      sendMessage();
    }
  };

  const submitEditedMessage = async () => {
    if (!editingMessage || !prompt.trim()) return;
    
    // Update the message being edited
    setMessages(prev => 
      prev.map(msg => 
        msg.id === editingMessage 
          ? { ...msg, message: prompt, timestamp: new Date() } 
          : msg
      )
    );
    
    // Store the current prompt and clear the editing state
    const currentPrompt = prompt;
    setEditingMessage(null);
    setPrompt('');
    setLoading(true);
    
    try {
      // Show typing indicator
      setIsTyping(true);
      
      // Make the API request
      const response = await fetch('http://localhost:8000/api/chat-stream/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${authContext.token}`
        },
        body: JSON.stringify({ 
          prompt: currentPrompt,
          conversation_id: currentConversationId 
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      
      // Create bot message with empty content initially
      const botMessageId = generateId();
      setMessages(prev => [
        ...prev,
        {
          id: botMessageId,
          sender: 'bot',
          message: '',
          timestamp: new Date(),
        },
      ]);

      // Hide typing indicator now that we're streaming
      setIsTyping(false);
      
      // Stream response
      await streamResponse(response, botMessageId);
      
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          sender: 'bot',
          message: 'Something went wrong. Try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const deleteMessage = (id: string) => {
    setMessages(messages.filter((msg) => msg.id !== id));
    if (editingMessage === id) {
      setEditingMessage(null);
      setPrompt('');
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setPrompt('');
  };

  const renderBotMessage = (msg: Message) => {
    return (
      <p className="whitespace-pre-wrap">
        {msg.message}
        {isStreaming && msg.id === messages[messages.length - 1].id && (
          <span className="animate-pulse">▌</span>
        )}
      </p>
    );
  };

  // Dynamic theme classes
  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const headerBg = isDarkMode ? 'bg-gray-800' : 'bg-blue-600';
  const inputBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
  const inputBorder = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const inputText = isDarkMode ? 'text-white' : 'text-gray-800';
  const placeholderColor = isDarkMode ? 'placeholder-gray-400' : 'placeholder-gray-500';

  // If still loading auth state, show loading spinner
  if (authContext.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Side menu with user info */}
      <div className={`w-64 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border-r`}>
        <div className="p-4">
          <div className="mb-6">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Welcome, {authContext.user?.username}
            </h3>
            <button 
              onClick={authContext.logout}
              className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Logout
            </button>
          </div>
          
          <button
            onClick={startNewConversation}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
          >
            New Conversation
          </button>
          
          <div className="space-y-2 mt-4">
            <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Your Conversations</h3>
            
            {conversations.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No conversations yet
              </p>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`p-2 rounded-lg cursor-pointer ${
                    currentConversationId === conv.id
                      ? isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                      : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  <p className={`truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {conv.title}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Existing Chat Container, wrapped in a flex container */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`${headerBg} text-white p-4 shadow-md`}>
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {/* Back to Home */}
                <Link to="/" className="text-white hover:text-gray-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <h1 className="text-xl font-semibold">AI Assistant Chat</h1>
              </div>

              {/* Add dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-opacity-30 bg-black hover:bg-opacity-40 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Chat Container */}
        <div className="flex-1 overflow-y-auto container mx-auto lg:max-w-4xl py-6 px-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">Start a New Conversation</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Type your message below to begin chatting with our AI assistant
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  A new conversation will be created automatically when you send your first message
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-6 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white mr-3 flex-shrink-0">
                  AI
                </div>
              )}
              <div className="flex flex-col max-w-[75%]">
                <div
                  className={`px-4 py-3 rounded-lg break-words ${
                    msg.sender === 'user'
                      ? isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'
                      : isDarkMode ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-gray-200 text-gray-800'
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">
                      {msg.message}
                      {msg.isEditing && <span className="text-xs ml-1 opacity-70">(edited)</span>}
                    </p>
                  ) : renderBotMessage(msg)}
                  
                  {/* Timestamp */}
                  <div className={`text-right text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
                
                {/* Edit/Delete buttons for user messages */}
                {msg.sender === 'user' && (
                  <div className="flex justify-end space-x-2 mt-1">
                    <button 
                      onClick={() => editMessage(msg.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteMessage(msg.id)}
                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white ml-3 flex-shrink-0">
                  You
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex mb-6 justify-start">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white mr-3 flex-shrink-0">
                AI
              </div>
              <div className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-200'}`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'} p-4`}>
          <div className="container mx-auto lg:max-w-4xl">
            {editingMessage && (
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-sm font-medium text-blue-500 dark:text-blue-400">Editing message</span>
                <button 
                  onClick={cancelEdit}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {/* New design with button inside textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                className={`w-full p-3 pr-12 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${inputText} ${placeholderColor}`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSubmit}
                className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" transform="rotate(90 10 10)" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;