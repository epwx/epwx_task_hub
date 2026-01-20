'use client';

import { Header } from "@/components/Header";
import { useAccount } from "wagmi";
import { useState } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { parseUnits } from "viem";

const TASK_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_TASK_MANAGER as `0x${string}`;
const EPWX_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`;

const ERC20_ABI = [
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const TASK_MANAGER_ABI = [
  {
    "inputs": [
      {"name": "_taskType", "type": "string"},
      {"name": "_targetUrl", "type": "string"},
      {"name": "_rewardPerTask", "type": "uint256"},
      {"name": "_maxCompletions", "type": "uint256"},
      {"name": "_duration", "type": "uint256"}
    ],
    "name": "createCampaign",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export default function AdvertisePage() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'like',
    targetUrl: '',
    rewardPerTask: '',
    maxCompletions: '',
    durationInDays: '7'
  });

    // ...existing code...
    // TODO: Implement the rest of the component logic and UI
    return (
      <div>
        <Header />
        <h1>Advertise Page</h1>
        {/* Add your form and other UI elements here */}
      </div>
    );
  }


        










































