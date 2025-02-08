import { useState, useEffect } from 'react';

export const useWakuVersion = () => {
  const [version, setVersion] = useState<string>('');

  const fetchVersion = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8645/debug/v1/version', {
        headers: {
          'accept': 'text/plain'
        }
      });
      const versionText = await response.text();
      setVersion(versionText);
    } catch (error) {
      setVersion('Unknown');
    }
  };

  useEffect(() => {
    fetchVersion();
    const interval = setInterval(fetchVersion, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return version;
}; 