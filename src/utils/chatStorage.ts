import { ChatSession, ChatMessage } from '@/types/chat';

declare global {
  interface Window {
    electronAPI: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<boolean>;
      };
    };
  }
}

// Generate a chat session title from the first message
const generateTitle = (message: string): string => {
  const words = message.split(' ').slice(0, 6);
  return words.join(' ') + (words.length < message.split(' ').length ? '...' : '');
};

// Create a new chat session
export const createChatSession = async (firstMessage: string): Promise<ChatSession> => {
  const newSession: ChatSession = {
    id: Date.now().toString(),
    title: generateTitle(firstMessage),
    messages: [{
      id: Date.now().toString(),
      content: firstMessage,
      timestamp: Date.now(),
      sender: 'user'
    }],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Get existing sessions
  const existingSessions = await getChatSessions();
  
  // Add new session to the beginning
  const updatedSessions = [newSession, ...existingSessions];
  
  // Save to store
  await window.electronAPI.store.set('sessions', updatedSessions);

  // Emit storage event for UI update
  window.dispatchEvent(new CustomEvent('chat-storage-changed'));

  return newSession;
};

// Get all chat sessions
export const getChatSessions = async (): Promise<ChatSession[]> => {
  return await window.electronAPI.store.get('sessions') || [];
};

// Get a specific chat session
export const getChatSession = async (id: string): Promise<ChatSession | null> => {
  const sessions = await getChatSessions();
  return sessions.find(session => session.id === id) || null;
};

// Add a message to a chat session
export const addMessageToSession = async (
  sessionId: string, 
  content: string, 
  sender: 'user' | 'assistant'
): Promise<ChatSession> => {
  const sessions = await getChatSessions();
  const sessionIndex = sessions.findIndex(session => session.id === sessionId);
  
  if (sessionIndex === -1) {
    throw new Error('Chat session not found');
  }

  const newMessage: ChatMessage = {
    id: Date.now().toString(),
    content,
    timestamp: Date.now(),
    sender
  };

  sessions[sessionIndex].messages.push(newMessage);
  sessions[sessionIndex].updatedAt = Date.now();

  await window.electronAPI.store.set('sessions', sessions);

  // Emit storage event for UI update
  window.dispatchEvent(new CustomEvent('chat-storage-changed'));

  return sessions[sessionIndex];
};

// Delete a chat session
export const deleteChatSession = async (id: string): Promise<void> => {
  const sessions = await getChatSessions();
  const updatedSessions = sessions.filter(session => session.id !== id);
  await window.electronAPI.store.set('sessions', updatedSessions);

  // Emit storage event for UI update
  window.dispatchEvent(new CustomEvent('chat-storage-changed'));
}; 