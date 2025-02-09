import React, { useState, useEffect } from 'react';
import { useAvalancheContract } from '@/hooks/useAvalancheContract';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ethers } from 'ethers';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface Operator {
  address: string;
  modelDetails: string;
  minimumPayment: string;
  costPerToken: string;
  isActive: boolean;
}

export const UserPayment: React.FC = () => {
  const {
    account,
    loading,
    error,
    connectWallet,
    contract,
    requestInference
  } = useAvalancheContract();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [tokenCount, setTokenCount] = useState<string>('100');
  const [estimatedCost, setEstimatedCost] = useState<string>('0');

  // Fetch active operators
  const fetchOperators = async () => {
    if (!contract) return;

    try {
      // This is a mock implementation - you'll need to implement the actual contract call
      const mockOperators: Operator[] = [
        {
          address: '0x1234...5678',
          modelDetails: 'GPT-3 175B',
          minimumPayment: '0.01',
          costPerToken: '0.001',
          isActive: true
        },
        {
          address: '0x8765...4321',
          modelDetails: 'LLAMA-2 70B',
          minimumPayment: '0.005',
          costPerToken: '0.0005',
          isActive: true
        }
      ];
      setOperators(mockOperators);
    } catch (err) {
      console.error('Error fetching operators:', err);
    }
  };

  // Calculate estimated cost
  const calculateEstimatedCost = () => {
    const operator = operators.find(op => op.address === selectedOperator);
    if (!operator || !tokenCount) return;

    const tokens = parseFloat(tokenCount);
    const cost = parseFloat(operator.costPerToken) * tokens;
    const minimum = parseFloat(operator.minimumPayment);

    setEstimatedCost(cost < minimum ? minimum.toString() : cost.toString());
  };

  useEffect(() => {
    if (contract) {
      fetchOperators();
    }
  }, [contract]);

  useEffect(() => {
    calculateEstimatedCost();
  }, [selectedOperator, tokenCount]);

  const handlePayment = async () => {
    if (!selectedOperator || !tokenCount) return;
    await requestInference(selectedOperator, parseInt(tokenCount), parseFloat(estimatedCost));
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Button
          onClick={connectWallet}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-2 rounded-xl hover:opacity-90 transition-all"
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500 p-6">
        {error}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Pay for Inference</CardTitle>
        <CardDescription>
          Select an operator and specify the number of tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="operator">Select Operator</Label>
          <Select
            value={selectedOperator}
            onValueChange={setSelectedOperator}
          >
            <SelectTrigger id="operator">
              <SelectValue placeholder="Select an operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((operator) => (
                <SelectItem
                  key={operator.address}
                  value={operator.address}
                >
                  {operator.modelDetails} ({operator.address})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tokenCount">Number of Tokens</Label>
          <Input
            id="tokenCount"
            type="number"
            min="1"
            value={tokenCount}
            onChange={(e) => setTokenCount(e.target.value)}
            placeholder="100"
          />
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Estimated Cost
            </span>
            <span className="text-lg font-bold">
              {estimatedCost} AVAX
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handlePayment}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          disabled={!selectedOperator || !tokenCount || parseFloat(estimatedCost) <= 0}
        >
          Pay for Inference
        </Button>
      </CardFooter>
    </Card>
  );
}; 