import React, { useState } from 'react';
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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export const OperatorDashboard: React.FC = () => {
  const {
    account,
    isOperator,
    operatorDetails,
    loading,
    error,
    connectWallet,
    registerAsOperator,
    withdrawFunds,
  } = useAvalancheContract();

  const [minimumPayment, setMinimumPayment] = useState('0.01');
  const [costPerToken, setCostPerToken] = useState('0.001');
  const [modelDetails, setModelDetails] = useState('');

  const handleRegister = async () => {
    await registerAsOperator(
      parseFloat(minimumPayment),
      parseFloat(costPerToken),
      modelDetails
    );
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

  if (!isOperator) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Register as Operator</CardTitle>
          <CardDescription>
            Set up your inference service and start earning AVAX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minimumPayment">Minimum Payment (AVAX)</Label>
            <Input
              id="minimumPayment"
              type="number"
              step="0.01"
              value={minimumPayment}
              onChange={(e) => setMinimumPayment(e.target.value)}
              placeholder="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPerToken">Cost per Token (AVAX)</Label>
            <Input
              id="costPerToken"
              type="number"
              step="0.001"
              value={costPerToken}
              onChange={(e) => setCostPerToken(e.target.value)}
              placeholder="0.001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelDetails">Model Details</Label>
            <Input
              id="modelDetails"
              value={modelDetails}
              onChange={(e) => setModelDetails(e.target.value)}
              placeholder="e.g., GPT-3 175B parameters"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleRegister}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          >
            Register as Operator
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operator Dashboard</CardTitle>
          <CardDescription>Manage your inference service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Earnings</Label>
              <div className="text-2xl font-bold">
                {operatorDetails?.totalEarnings
                  ? ethers.utils.formatEther(operatorDetails.totalEarnings)
                  : '0'} AVAX
              </div>
            </div>
            <div className="space-y-2">
              <Label>Available Balance</Label>
              <div className="text-2xl font-bold">
                {operatorDetails?.availableBalance
                  ? ethers.utils.formatEther(operatorDetails.availableBalance)
                  : '0'} AVAX
              </div>
            </div>
            <div className="space-y-2">
              <Label>Completed Tasks</Label>
              <div className="text-2xl font-bold">
                {operatorDetails?.completedTasks?.toString() || '0'}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="text-2xl font-bold text-green-500">
                {operatorDetails?.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={withdrawFunds}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            disabled={!operatorDetails?.availableBalance?.gt(0)}
          >
            Withdraw Funds
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}; 