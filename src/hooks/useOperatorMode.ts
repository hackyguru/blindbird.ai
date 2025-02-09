import { useState, useEffect } from 'react';
import axios from 'axios';
import { encryptionService } from '@/services/encryption';

const NWAKU_URL = 'http://127.0.0.1:8645';
const CLIENT_TOPIC = '/waku-chat/1/client-message/proto';
const RESPONSE_TOPIC = '/waku-chat/1/server-response/proto';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

interface Message {
  content: string;
  timestamp: number;
  status: 'received' | 'processing' | 'responded';
}

export const useOperatorMode = (isNodeActive: boolean, isRunning: boolean) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);

  // Initialize encryption on mount
  useEffect(() => {
    const initializeEncryption = async () => {
      try {
        await encryptionService.initialize();
        setIsEncryptionReady(true);
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
      }
    };

    if (isRunning) {
      void initializeEncryption();
    }
  }, [isRunning]);

  // Subscribe to client topic
  const subscribeToClientTopic = async () => {
    try {
      await axios.post(
        `${NWAKU_URL}/relay/v1/auto/subscriptions`,
        [CLIENT_TOPIC],
        {
          headers: {
            'accept': 'text/plain',
            'content-type': 'application/json'
          }
        }
      );
      setIsSubscribed(true);
      console.log('Successfully subscribed to client topic:', CLIENT_TOPIC);
    } catch (error) {
      console.error('Error subscribing to client topic:', error);
      setIsSubscribed(false);
    }
  };

  // Process message with Ollama
  const processWithOllama = async (encryptedPrompt: string): Promise<string> => {
    try {
      // Evaluate the encrypted prompt (this maintains FE security)
      const evaluatedPrompt = await encryptionService.evaluatePrompt(encryptedPrompt);
      
      // Send to Ollama
      const response = await axios.post(OLLAMA_URL, {
        model: 'dolphin-llama3',
        prompt: evaluatedPrompt,
        stream: false
      });

      // Return encrypted response
      return response.data.response;
    } catch (error) {
      console.error('Error processing with Ollama:', error);
      return 'Error processing your request.';
    }
  };

  // Send response back through Waku
  const sendResponse = async (response: string) => {
    try {
      await axios.post(
        `${NWAKU_URL}/relay/v1/auto/messages`,
        {
          payload: response,
          contentTopic: RESPONSE_TOPIC,
          timestamp: Date.now()
        },
        {
          headers: {
            'content-type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error sending response:', error);
    }
  };

  // Fetch and process messages
  const fetchAndProcessMessages = async () => {
    if (!isNodeActive || !isRunning || !isSubscribed || !isEncryptionReady) return;

    try {
      const encodedTopic = encodeURIComponent(CLIENT_TOPIC);
      const response = await axios.get(
        `${NWAKU_URL}/relay/v1/auto/messages/${encodedTopic}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.length > 0) {
        for (const msg of response.data) {
          // Add to received messages if not already present
          setReceivedMessages(prev => {
            if (prev.some(m => m.timestamp === msg.timestamp)) return prev;
            
            const newMessage: Message = {
              content: '[Encrypted Prompt]', // We don't show the actual content
              timestamp: msg.timestamp,
              status: 'received' as const
            };
            
            return [...prev, newMessage].slice(-10); // Keep last 10 messages
          });

          // Process with Ollama and update status
          setReceivedMessages(prev => 
            prev.map(m => m.timestamp === msg.timestamp ? {...m, status: 'processing'} : m)
          );
          
          const ollamaResponse = await processWithOllama(msg.payload);
          await sendResponse(ollamaResponse);
          
          // Update status after processing
          setReceivedMessages(prev => 
            prev.map(m => m.timestamp === msg.timestamp ? {...m, status: 'responded'} : m)
          );
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Subscribe/unsubscribe based on running state
  useEffect(() => {
    if (isNodeActive && isRunning && !isSubscribed && isEncryptionReady) {
      void subscribeToClientTopic();
    } else if (!isRunning) {
      setIsSubscribed(false);
    }
  }, [isNodeActive, isRunning, isEncryptionReady]);

  // Poll for messages when running
  useEffect(() => {
    if (!isRunning || !isEncryptionReady) return;

    const interval = setInterval(fetchAndProcessMessages, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isNodeActive, isSubscribed, isEncryptionReady]);

  return {
    isSubscribed,
    receivedMessages,
    isEncryptionReady
  };
}; 