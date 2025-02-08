import { useState, useEffect } from 'react';

interface Protocol {
  protocol: string;
  connected: boolean;
}

interface Peer {
  multiaddr: string;
  protocols: Protocol[];
  origin: string;
}

interface ProtocolCount {
  name: string;
  value: number;
  connected: boolean;
}

export const usePeerProtocols = () => {
  const [protocolCounts, setProtocolCounts] = useState<ProtocolCount[]>([]);

  const fetchPeers = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8645/admin/v1/peers', {
        headers: {
          'accept': 'application/json'
        }
      });
      const peers: Peer[] = await response.json();
      
      // Count all protocols
      const counts = new Map<string, { connected: number, disconnected: number }>();
      
      peers.forEach(peer => {
        peer.protocols.forEach(p => {
          const current = counts.get(p.protocol) || { connected: 0, disconnected: 0 };
          if (p.connected) {
            current.connected += 1;
          } else {
            current.disconnected += 1;
          }
          counts.set(p.protocol, current);
        });
      });

      // Convert to array format for the pie chart
      const protocolData = Array.from(counts.entries()).flatMap(([name, stats]) => [
        {
          name: `${name} (Connected)`,
          value: stats.connected,
          connected: true
        },
        {
          name: `${name} (Disconnected)`,
          value: stats.disconnected,
          connected: false
        }
      ]).filter(item => item.value > 0); // Only include non-zero values

      setProtocolCounts(protocolData);
    } catch (error) {
      console.error('Failed to fetch peer protocols:', error);
      setProtocolCounts([]);
    }
  };

  useEffect(() => {
    fetchPeers();
    const interval = setInterval(fetchPeers, 30000);
    return () => clearInterval(interval);
  }, []);

  return protocolCounts;
}; 