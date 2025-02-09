import { useState, useEffect } from 'react';
import axios from 'axios';

const NWAKU_URL = 'http://127.0.0.1:8645';
const CLIENT_TOPIC = '/waku-chat/1/client-message/proto';
const RESPONSE_TOPIC = '/waku-chat/1/server-response/proto';

interface WakuMessage {
  payload: string;
  timestamp: number;
  contentTopic: string;
  isResponse: boolean;
}

export const useWakuChat = (isNodeActive: boolean, isInferenceMode: boolean) => {
  const [messages, setMessages] = useState<WakuMessage[]>([]);

  // Subscribe to response topic
  const subscribeToResponseTopic = async () => {
    try {
      await axios.post(
        `${NWAKU_URL}/relay/v1/auto/subscriptions`,
        [RESPONSE_TOPIC],
        {
          headers: {
            'accept': 'text/plain',
            'content-type': 'application/json'
          }
        }
      );
      console.log('Successfully subscribed to response topic:', RESPONSE_TOPIC);
    } catch (error) {
      console.error('Error subscribing to response topic:', error);
    }
  };

  // Fetch responses
  const fetchResponses = async () => {
    if (!isNodeActive) return;

    try {
      const encodedTopic = encodeURIComponent(RESPONSE_TOPIC);
      const response = await axios.get(
        `${NWAKU_URL}/relay/v1/auto/messages/${encodedTopic}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.length > 0) {
        setMessages(prevMessages => {
          const newMessages = response.data.filter(
            (newMsg: WakuMessage) => !prevMessages.some(
              prevMsg => prevMsg.timestamp === newMsg.timestamp
            )
          ).map((msg: WakuMessage) => ({
            ...msg,
            isResponse: true
          }));
          return [...prevMessages, ...newMessages];
        });
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  // Send message
  const sendMessage = async (message: string) => {
    if (!message.trim() || !isNodeActive) return;

    try {
      const encodedMessage = btoa(message);
      await axios.post(
        `${NWAKU_URL}/relay/v1/auto/messages`,
        {
          payload: encodedMessage,
          contentTopic: CLIENT_TOPIC,
          timestamp: Date.now()
        },
        {
          headers: {
            'content-type': 'application/json'
          }
        }
      );
      
      // Add user message to the list
      setMessages(prev => [...prev, {
        payload: encodedMessage,
        timestamp: Date.now(),
        contentTopic: CLIENT_TOPIC,
        isResponse: false
      }]);
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  // Subscribe to response topic when entering inference mode
  useEffect(() => {
    if (isInferenceMode && isNodeActive) {
      subscribeToResponseTopic();
    }
  }, [isInferenceMode, isNodeActive]);

  // Poll for responses
  useEffect(() => {
    if (!isInferenceMode || !isNodeActive) return;

    const interval = setInterval(fetchResponses, 1000);
    return () => clearInterval(interval);
  }, [isInferenceMode, isNodeActive]);

  return {
    messages,
    sendMessage,
    clearMessages: () => setMessages([])
  };
}; 