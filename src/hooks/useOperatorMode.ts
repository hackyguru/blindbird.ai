import { useState, useEffect } from 'react';
import axios from 'axios';
import { initializeHE } from '@/utils/encryption';

const NWAKU_URL = 'http://127.0.0.1:8645';
const CLIENT_TOPIC = '/waku-chat/1/client-message/proto';
const RESPONSE_TOPIC = '/waku-chat/1/server-response/proto';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

export const useOperatorMode = (isNodeActive: boolean, isRunning: boolean) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState<Array<{
    content: string;
    timestamp: number;
    status: 'received' | 'processing' | 'responded';
  }>>([]);
  const [encryption, setEncryption] = useState<any>(null);

  // Initialize encryption
  useEffect(() => {
    const init = async () => {
      try {
        const encryptionUtils = await initializeHE();
        setEncryption(encryptionUtils);
      } catch (error) {
        console.error('Error initializing encryption:', error);
      }
    };
    void init();
  }, []);

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
  const processWithOllama = async (message: string): Promise<string> => {
    try {
      const parsedMessage = JSON.parse(message);
      
      // If message contains encrypted data, process it
      if (parsedMessage.metadata?.isHomomorphic && encryption) {
        try {
          const encryptedValue = parsedMessage.metadata.encryptedValue;
          // Perform homomorphic operation (square in this case)
          const processedValue = await encryption.evaluateMessage(encryptedValue);
          return `Processed encrypted value. Original message: ${parsedMessage.message}`;
        } catch (error) {
          console.error('Homomorphic processing error:', error);
        }
      }

      // Fall back to regular Ollama processing
      return await axios.post(OLLAMA_URL, {
        model: 'dolphin-llama3',
        prompt: parsedMessage.message,
        stream: false
      });
    } catch (error) {
      console.error('Error processing with Ollama:', error);
      return 'Sorry, I encountered an error processing your request.';
    }
  };

  // Send response back through Waku
  const sendResponse = async (response: string) => {
    try {
      const encodedMessage = btoa(response);
      await axios.post(
        `${NWAKU_URL}/relay/v1/auto/messages`,
        {
          payload: encodedMessage,
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
    if (!isNodeActive || !isRunning || !isSubscribed) return;

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
          const decodedMessage = JSON.parse(atob(msg.payload));
          
          // Add to received messages if not already present
          setReceivedMessages(prev => {
            if (prev.some(m => m.timestamp === msg.timestamp)) return prev;
            
            return [...prev, {
              content: decodedMessage.message, // Extract just the message content
              timestamp: msg.timestamp,
              status: 'received'
            }].slice(-10);
          });

          // Process with Ollama and update status
          setReceivedMessages(prev => 
            prev.map(m => m.timestamp === msg.timestamp ? {...m, status: 'processing'} : m)
          );
          
          const ollamaResponse = await processWithOllama(decodedMessage);
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
    if (isNodeActive && isRunning && !isSubscribed) {
      void subscribeToClientTopic();
    } else if (!isRunning) {
      setIsSubscribed(false);
    }
  }, [isNodeActive, isRunning]);

  // Poll for messages when running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(fetchAndProcessMessages, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isNodeActive, isSubscribed]);

  return {
    isSubscribed,
    receivedMessages
  };
}; 