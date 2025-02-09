import { useState, useEffect } from 'react';

export const useNodeStatus = () => {
  const [isNodeActive, setIsNodeActive] = useState(false);

  const checkNodeStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8645/health');
      setIsNodeActive(response.status === 200);
    } catch (error) {
      setIsNodeActive(false);
    }
  };

  useEffect(() => {
    checkNodeStatus();
    const interval = setInterval(checkNodeStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return isNodeActive;
}; 