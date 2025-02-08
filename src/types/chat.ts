export interface ChatMessage {
  id: string;
  content: string;
  timestamp: number;
  sender: 'user' | 'assistant';
}

export interface ChatSession {
  id: string;
  title: string;  // First few words of the first message
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
} 