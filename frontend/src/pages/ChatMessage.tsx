interface Message {
  id: string;
  type: 'clue' | 'guess' | 'system';
  text: string;
  isCorrect?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.type === 'system') {
    return (
      <div className="flex items-center justify-center gap-2 p-3 bg-gray-200 dark:bg-gray-700/50 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-700 dark:text-gray-300">{message.text}</p>
      </div>
    );
  }

  if (message.type === 'clue') {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[70%] space-y-1">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-sm text-gray-500 dark:text-gray-400">You</span>
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium">
              Clue
            </span>
          </div>
          <div className="bg-blue-600 dark:bg-blue-700 text-white rounded-lg rounded-tr-none p-3">
            {message.text}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    );
  }

  if (message.type === 'guess') {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-600 dark:bg-purple-700 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="max-w-[70%] space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">AI</span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                message.isCorrect 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {message.isCorrect ? 'Correct!' : 'Guess'}
            </span>
          </div>
          <div className={`rounded-lg rounded-tl-none p-3 ${
            message.isCorrect 
              ? 'bg-green-600 dark:bg-green-700 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}>
            {message.text}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
