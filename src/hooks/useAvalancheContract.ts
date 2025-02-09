import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AIInferenceMarketplace__factory } from '@/types/contracts';

const AVALANCHE_TESTNET_PARAMS = {
  chainId: '0xA869', // 43113 in hex
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export const useAvalancheContract = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isOperator, setIsOperator] = useState(false);
  const [operatorDetails, setOperatorDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      // Add Avalanche network if not already added
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [AVALANCHE_TESTNET_PARAMS],
        });
      } catch (addError) {
        console.error('Error adding network:', addError);
      }

      // Create contract instance
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contractInstance = AIInferenceMarketplace__factory.connect(CONTRACT_ADDRESS, signer);
      setContract(contractInstance);

      // Check if connected account is an operator
      const operator = await contractInstance.operators(accounts[0]);
      setIsOperator(operator.isRegistered);
      if (operator.isRegistered) {
        setOperatorDetails(operator);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error connecting wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const registerAsOperator = async (minimumPayment: number, costPerToken: number, modelDetails: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!contract) throw new Error('Contract not initialized');

      const tx = await contract.registerOperator(
        ethers.utils.parseEther(minimumPayment.toString()),
        ethers.utils.parseEther(costPerToken.toString()),
        modelDetails
      );
      await tx.wait();

      // Update operator status
      const operator = await contract.operators(account);
      setIsOperator(operator.isRegistered);
      setOperatorDetails(operator);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error registering as operator:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestInference = async (operatorAddress: string, tokenCount: number, payment: number) => {
    try {
      setLoading(true);
      setError(null);

      if (!contract) throw new Error('Contract not initialized');

      const tx = await contract.requestInference(
        operatorAddress,
        tokenCount,
        { value: ethers.utils.parseEther(payment.toString()) }
      );
      await tx.wait();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error requesting inference:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeInference = async (requestId: number) => {
    try {
      setLoading(true);
      setError(null);

      if (!contract) throw new Error('Contract not initialized');

      const tx = await contract.completeInference(requestId);
      await tx.wait();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error completing inference:', err);
    } finally {
      setLoading(false);
    }
  };

  const withdrawFunds = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!contract) throw new Error('Contract not initialized');

      const tx = await contract.withdrawFunds();
      await tx.wait();

      // Update operator details after withdrawal
      if (isOperator) {
        const operator = await contract.operators(account);
        setOperatorDetails(operator);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error withdrawing funds:', err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0]);
        setIsOperator(false);
        setOperatorDetails(null);
        connectWallet();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return {
    account,
    isOperator,
    operatorDetails,
    loading,
    error,
    connectWallet,
    registerAsOperator,
    requestInference,
    completeInference,
    withdrawFunds,
  };
}; 