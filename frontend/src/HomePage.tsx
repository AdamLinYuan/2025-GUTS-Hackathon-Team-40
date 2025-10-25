import { Link } from 'react-router-dom';
import './index.css';
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from './Layout'; // Import the theme context
import { useAuth } from './AuthContext'; // Import the auth context

type Message = {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
};

const HomePage = () => {
  const { isDarkMode } = useTheme(); // Use the theme from context
  const { isAuthenticated, user } = useAuth(); // Use the auth context
  
  // Chat widget state
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isExpanded]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [prompt]);

  useEffect(() => {
    // Add an initial welcome message when the chat widget is opened
    if (isExpanded && messages.length === 0) {
      const welcomeMessage = isAuthenticated 
        ? "Hello! How can I help you today?"
        : "Hello! This is a demo version of our chatbot. You can try it out, but for full features and to save your conversations, please sign in.";
      
      setMessages([{ 
        id: generateId(),
        sender: 'bot', 
        message: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [isExpanded, isAuthenticated]);

  const toggleChat = () => {
    setIsExpanded(!isExpanded);
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    // Add user message
    const newMessageId = generateId();
    setMessages((prev) => [...prev, { 
      id: newMessageId,
      sender: 'user', 
      message: prompt,
      timestamp: new Date()
    }]);
    const currentPrompt = prompt;
    setPrompt('');

    try {
      // Show typing indicator with slight delay to make it more natural
      setTimeout(() => setIsTyping(true), 300);
      
      // Use chat-demo endpoint instead of chat endpoint
      const res = await fetch('http://localhost:8000/api/chat-demo/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      });

      if (!res.ok) throw new Error('Failed to fetch response.');

      const data = await res.json();
      
      // Hide typing indicator before showing the response
      setIsTyping(false);
      
      setMessages((prev) => [...prev, { 
        id: generateId(),
        sender: 'bot', 
        message: data.response,
        timestamp: new Date()
      }]);

      // If we're in demo mode and not logged in, show a CTA message
      if (data.demo_mode && !isAuthenticated && messages.length < 2) {
        // Add a slight delay before showing the CTA message
        setTimeout(() => {
          setMessages((prev) => [...prev, { 
            id: generateId(),
            sender: 'bot', 
            message: "This is a demo version with limited capabilities. Sign in to save your conversations and access the full chatbot features.",
            timestamp: new Date()
          }]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      setMessages((prev) => [...prev, { 
        id: generateId(),
        sender: 'bot', 
        message: 'Something went wrong. Try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <main className="container mx-auto p-4">
        <section className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to Your App</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            This is your homepage. Use this as a base for routing and app navigation.
          </p>

          {/* Link to full chat page */}
          <div className="mt-4">
            {isAuthenticated ? (
              <Link 
                to="/chat" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <span>Continue Chatting</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Sign in to access the full chatbot with conversation history.
                </p>
                <div className="flex space-x-4">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <span>Sign In</span>
                  </Link>
                  <Link 
                    to="/register" 
                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span>Register</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Feature {i}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Maecenas feugiat magna.
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Chat Widget */}
      <div 
        className={`fixed transition-all duration-300 ease-in-out shadow-xl rounded-lg ${
          isExpanded 
            ? 'bottom-4 right-4 w-96 h-[500px]' 
            : 'bottom-4 right-4 w-16 h-16'
        }`}
      >
        {!isExpanded ? (
          <button 
            onClick={toggleChat}
            className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        ) : (
          <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg overflow-hidden`}>
            {/* Chat Header */}
            <header className="bg-blue-600 border-b border-blue-500 py-3 px-4 flex justify-between items-center">
              <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
              <button 
                onClick={toggleChat}
                className="p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </header>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-3 scroll-smooth">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Start a conversation with the AI assistant.
                  </p>
                </div>
              )}
              
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white mr-2 flex-shrink-0 text-xs">
                      AI
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div
                      className={`px-3 py-2 rounded-lg max-w-[80%] break-words ${
                        msg.sender === 'user'
                          ? isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'
                          : isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800'
                      }`}
                      style={{ wordBreak: 'break-word' }}
                    >
                      <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                      
                      {/* Timestamp */}
                      <div className={`text-right text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatTimestamp(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white ml-2 flex-shrink-0 text-xs">
                      U
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex mb-3 justify-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white mr-2 flex-shrink-0 text-xs">
                    AI
                  </div>
                  <div className={`px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
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
            
            {/* Sign-in prompt for non-authenticated users */}
            {!isAuthenticated && (
              <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-2 text-center`}>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Using demo version with limited features
                </p>
                <div className="flex justify-center space-x-2">
                  <Link 
                    to="/login" 
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className={`border-t p-2 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}>
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  className={`w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-500'
                  }`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AI Assistant..."
                  style={{ minHeight: '36px', maxHeight: '100px' }}
                />
                <button
                  onClick={sendMessage}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0 self-end"
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" transform="rotate(90 10 10)" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;