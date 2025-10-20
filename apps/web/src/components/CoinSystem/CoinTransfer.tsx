import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, Send, XCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleAlert
} from "@/components/Shared/UI";

interface CoinTransferProps {
  fromWalletAddress: string;
  onTransferComplete?: () => void;
}

interface TransferData {
  fromWalletAddress: string;
  toWalletAddress: string;
  amount: number;
  coinType: "Experience" | "Achievement" | "Social" | "Premium";
}

const transferCoins = async (data: TransferData) => {
  const response = await fetch("/api/coin-system/transfer", {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error transferring coins");
  }

  return response.json();
};

const CoinTransfer: React.FC<CoinTransferProps> = ({
  fromWalletAddress,
  onTransferComplete
}) => {
  const [toWalletAddress, setToWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [coinType, setCoinType] = useState<
    "Experience" | "Achievement" | "Social" | "Premium"
  >("Experience");
  const [isValidating, setIsValidating] = useState(false);

  const queryClient = useQueryClient();

  const transferMutation = useMutation({
    mutationFn: transferCoins,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Coins transferred successfully");
      queryClient.invalidateQueries({
        queryKey: ["coinBalance", fromWalletAddress]
      });
      queryClient.invalidateQueries({
        queryKey: ["coinBalance", toWalletAddress]
      });
      setToWalletAddress("");
      setAmount("");
      onTransferComplete?.();
    }
  });

  const validateWalletAddress = (address: string) => {
    return address.length === 42 && address.startsWith("0x");
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateWalletAddress(toWalletAddress)) {
      toast.error("Invalid wallet address");
      return;
    }

    if (fromWalletAddress === toWalletAddress) {
      toast.error("Cannot transfer coins to yourself");
      return;
    }

    const transferAmount = Number.parseInt(amount);
    if (Number.isNaN(transferAmount) || transferAmount <= 0) {
      toast.error("Invalid coin amount");
      return;
    }

    transferMutation.mutate({
      amount: transferAmount,
      coinType,
      fromWalletAddress,
      toWalletAddress
    });
  };

  const coinTypeOptions = [
    {
      description: "Coins earned from gameplay",
      label: "Experience",
      value: "Experience"
    },
    {
      description: "Achievement coins",
      label: "Achievement",
      value: "Achievement"
    },
    { description: "Social activity coins", label: "Social", value: "Social" },
    {
      description: "Premium exclusive coins",
      label: "Premium",
      value: "Premium"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Transfer Coins
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Transfer your coins to other users
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleTransfer}>
          {/* Recipient Wallet Address */}
          <div className="space-y-2">
            <Label htmlFor="toWallet">Recipient Wallet Address</Label>
            <div className="relative">
              <Input
                className={`pr-10 ${
                  toWalletAddress && !validateWalletAddress(toWalletAddress)
                    ? "border-red-500"
                    : toWalletAddress && validateWalletAddress(toWalletAddress)
                      ? "border-green-500"
                      : ""
                }`}
                id="toWallet"
                onChange={(e) => {
                  setToWalletAddress(e.target.value);
                  setIsValidating(true);
                  setTimeout(() => setIsValidating(false), 500);
                }}
                placeholder="0x..."
                type="text"
                value={toWalletAddress}
              />
              {toWalletAddress && (
                <div className="-translate-y-1/2 absolute top-1/2 right-3 transform">
                  {isValidating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  ) : validateWalletAddress(toWalletAddress) ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {toWalletAddress && !validateWalletAddress(toWalletAddress) && (
              <p className="text-red-500 text-sm">Invalid wallet address</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              min="1"
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              required
              type="number"
              value={amount}
            />
          </div>

          {/* Coin Type */}
          <div className="space-y-2">
            <Label htmlFor="coinType">Coin Type</Label>
            <Select
              onValueChange={(value: any) => setCoinType(value)}
              value={coinType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {coinTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-gray-500 text-sm">
                        {option.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Button */}
          <Button
            className="w-full"
            disabled={
              transferMutation.isPending ||
              !toWalletAddress ||
              !amount ||
              !validateWalletAddress(toWalletAddress) ||
              fromWalletAddress === toWalletAddress
            }
            type="submit"
          >
            {transferMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Transferring...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Transfer Coins
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>

          {/* Warning */}
          <SimpleAlert>
            ⚠️ Coin transfers are irreversible. Please verify the recipient
            address before confirming.
          </SimpleAlert>
        </form>
      </CardContent>
    </Card>
  );
};

export default CoinTransfer;
