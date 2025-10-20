import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, CreditCard } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { SimpleAlert } from "@/components/Shared/UI";
import { Button } from "@/components/Shared/UI/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/Shared/UI/Dialog";
import { Input } from "@/components/Shared/UI/Input";
import { Label } from "@/components/Shared/UI/Label";

interface WithdrawModalProps {
  walletAddress: string;
  userCoins: number;
  children: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

interface WithdrawData {
  walletAddress: string;
  userTx: string;
  amount: number;
  from: string;
  to: string;
}

const createWithdraw = async (data: WithdrawData) => {
  const response = await fetch("/api/transaction-system/withdraw", {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error creating withdrawal request");
  }

  return response.json();
};

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  walletAddress,
  userCoins,
  children,
  isOpen,
  setIsOpen
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const modalIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setModalIsOpen = setIsOpen || setInternalIsOpen;
  const [amount, setAmount] = useState("");
  const [userTx, setUserTx] = useState("");
  const [from, setFrom] = useState(walletAddress);
  const [to, setTo] = useState("");

  const queryClient = useQueryClient();

  const withdrawMutation = useMutation({
    mutationFn: createWithdraw,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: (data) => {
      toast.success("Withdrawal request submitted successfully");
      queryClient.invalidateQueries({
        queryKey: ["coinBalance", walletAddress]
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions", walletAddress]
      });
      setModalIsOpen(false);
      setAmount("");
      setUserTx("");
      setTo("");
    }
  });

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawAmount = Number.parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (withdrawAmount > userCoins) {
      toast.error("Insufficient balance");
      return;
    }

    if (!userTx.trim()) {
      toast.error("Transaction ID is required");
      return;
    }

    if (!to.trim()) {
      toast.error("Destination address is required");
      return;
    }

    withdrawMutation.mutate({
      amount: withdrawAmount,
      from: from.trim(),
      to: to.trim(),
      userTx: userTx.trim(),
      walletAddress
    });
  };

  const isFormValid =
    amount &&
    Number.parseFloat(amount) > 0 &&
    Number.parseFloat(amount) <= userCoins &&
    userTx.trim() &&
    to.trim() &&
    !withdrawMutation.isPending;

  return (
    <Dialog onOpenChange={setModalIsOpen} open={modalIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-500" />
            Withdrawal Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Current Balance:</span>
              <span className="font-bold text-lg">
                {userCoins.toLocaleString()} coins
              </span>
            </div>
          </div>

          {/* Withdraw Form */}
          <form className="space-y-4" onSubmit={handleWithdraw}>
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (coins)</Label>
              <Input
                id="amount"
                max={userCoins}
                min="1"
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                required
                step="0.01"
                type="number"
                value={amount}
              />
              <p className="text-gray-500 text-xs">
                Maximum: {userCoins.toLocaleString()} coins
              </p>
            </div>

            {/* Transaction ID */}
            <div className="space-y-2">
              <Label htmlFor="userTx">Transaction ID</Label>
              <Input
                id="userTx"
                onChange={(e) => setUserTx(e.target.value)}
                placeholder="0x..."
                required
                type="text"
                value={userTx}
              />
              <p className="text-gray-500 text-xs">
                Your blockchain transaction ID
              </p>
            </div>

            {/* From Address */}
            <div className="space-y-2">
              <Label htmlFor="from">From Address</Label>
              <Input
                id="from"
                onChange={(e) => setFrom(e.target.value)}
                required
                type="text"
                value={from}
              />
            </div>

            {/* To Address */}
            <div className="space-y-2">
              <Label htmlFor="to">To Address</Label>
              <Input
                id="to"
                onChange={(e) => setTo(e.target.value)}
                placeholder="0x..."
                required
                type="text"
                value={to}
              />
            </div>

            {/* Warning */}
            <SimpleAlert>
              <AlertTriangle className="h-4 w-4" />
              <div>
                ⚠️ Coin withdrawals are irreversible. Please verify the
                destination address carefully.
              </div>
            </SimpleAlert>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => setModalIsOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!isFormValid}
                type="submit"
              >
                {withdrawMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Submit Request
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
