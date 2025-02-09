import axios from 'axios';
import { useState, useEffect } from 'react';
import { encryptionService } from '@/services/encryption';

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

    if (isInferenceMode) {
      void initializeEncryption();
    }
  }, [isInferenceMode]);

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
    if (!isNodeActive || !isEncryptionReady) return;

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
        const newMessages = await Promise.all(
          response.data
            .filter((newMsg: WakuMessage) => 
              !messages.some(prevMsg => prevMsg.timestamp === newMsg.timestamp)
            )
            .map(async (msg: WakuMessage) => {
              try {
                // Decrypt the response
                const decryptedPayload = await encryptionService.decryptResponse(msg.payload);
                return {
                  ...msg,
                  payload: decryptedPayload,
                  isResponse: true
                };
              } catch (error) {
                console.error('Error decrypting response:', error);
                return null;
              }
            })
        );

        // Filter out failed decryptions and add to messages
        const validMessages = newMessages.filter((msg): msg is WakuMessage => msg !== null);
        if (validMessages.length > 0) {
          setMessages(prev => [...prev, ...validMessages]);
        }
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  // Send message
  const sendMessage = async (message: string) => {
    if (!message.trim() || !isNodeActive || !isEncryptionReady) return false;

    try {
      // Encrypt the message
      const encryptedMessage = await encryptionService.encryptPrompt(message);

      await axios.post(
        `${NWAKU_URL}/relay/v1/auto/messages`,
        {
          payload: encryptedMessage,
          contentTopic: CLIENT_TOPIC,
          timestamp: Date.now()
        },
        {
          headers: {
            'content-type': 'application/json'
          }
        }
      );
      
      // Add user message to the list (store original message for display)
      setMessages(prev => [...prev, {
        payload: message, // Store unencrypted for display
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
    if (isInferenceMode && isNodeActive && isEncryptionReady) {
      subscribeToResponseTopic();
    }
  }, [isInferenceMode, isNodeActive, isEncryptionReady]);

  // Poll for responses
  useEffect(() => {
    if (!isInferenceMode || !isNodeActive || !isEncryptionReady) return;

    const interval = setInterval(fetchResponses, 1000);
    return () => clearInterval(interval);
  }, [isInferenceMode, isNodeActive, isEncryptionReady]);

  return {
    messages,
    sendMessage,
    clearMessages: () => setMessages([]),
    isEncryptionReady
  };
}; 