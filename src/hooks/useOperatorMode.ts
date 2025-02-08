import { useState, useEffect } from 'react';
import axios from 'axios';

const NWAKU_URL = 'http://127.0.0.1:8645';
const CLIENT_TOPIC = '/waku-chat/1/client-message/proto';
const RESPONSE_TOPIC = '/waku-chat/1/server-response/proto';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

export const useOperatorMode = (isNodeActive: boolean, isRunning: boolean) => {
  const [isSubscribed, setIsSubscribed] = useState(false);

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
      const response = await axios.post(OLLAMA_URL, {
        model: 'dolphin-llama3',
        prompt: message,
        stream: false
      });
      return response.data.response;
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
          const decodedMessage = atob(msg.payload);
          const ollamaResponse = await processWithOllama(decodedMessage);
          await sendResponse(ollamaResponse);
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
    isSubscribed
  };
}; 