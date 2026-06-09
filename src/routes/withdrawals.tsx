import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Wallet, IndianRupee, ArrowRight, Loader2, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/withdrawals")({
  head: () => ({
    meta: [
      { title: "Withdraw Earnings — Ukyro" },
      { name: "description", content: "Withdraw your driver earnings to bank account or request cash withdrawal." },
    ],
  }),
  component: WithdrawalsPage,
});

const schema = z.object({
  amount: z.string().refine(v => Number(v) > 0, "Amount must be greater than 0"),
  withdrawalMethod: z.enum(["bank", "cash"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Withdrawal {
  _id: string;
  amount: number;
  withdrawalMethod: string;
  status: string;
  createdAt: string;
  notes?: string;
  rejectionReason?: string;
}

function WithdrawalsPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { withdrawalMethod: "bank" },
  });

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get<{
        withdrawals: Withdrawal[];
        pendingAmount: number;
      }>("/api/withdrawals");
      setWithdrawals(response.withdrawals);
      setPendingAmount(response.pendingAmount);
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
    }
  };

  useEffect(() => {
    if (user && user.role === "driver") {
      fetchWithdrawals();
    }
  }, [user]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    const amount = Number(values.amount);
    if (amount > (user.earnings || 0)) {
      toast.error(`Insufficient earnings. Your available earnings: ₹${user.earnings}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/withdrawals", {
        amount,
        withdrawalMethod: values.withdrawalMethod,
        notes: values.notes,
      });
      toast.success("Withdrawal request submitted successfully");
      setValue("amount", "");
      setValue("notes", "");
      fetchWithdrawals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit withdrawal request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelWithdrawal = async (id: string) => {
    try {
      await api.delete(`/api/withdrawals/${id}`);
      toast.success("Withdrawal cancelled successfully");
      fetchWithdrawals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel withdrawal");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-blue-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "paid":
        return <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-500/20 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) return null;

  if (!user || user.role !== "driver") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="glass rounded-2xl p-10 text-center max-w-sm w-full">
            <Wallet className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Driver Only</h2>
            <p className="text-muted-foreground mb-6">This page is only for drivers to withdraw their earnings.</p>
            <Button onClick={() => navigate({ to: "/dashboard" })} className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">Go to Dashboard</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Withdraw Earnings</h1>
              <p className="text-sm text-muted-foreground">Withdraw your driver earnings to bank account or request cash</p>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Earnings</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                  <span className="text-3xl font-bold">{(user.earnings || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
              {pendingAmount > 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
                  <div className="flex items-center gap-1.5 mt-1 justify-end">
                    <IndianRupee className="h-4 w-4 text-amber-600" />
                    <span className="text-xl font-semibold text-amber-600">{pendingAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Request Withdrawal</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount to withdraw"
                  min={1}
                  max={user.earnings}
                  {...register("amount")}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                <p className="text-xs text-muted-foreground">Available: ₹{(user.earnings || 0).toLocaleString("en-IN")}</p>
              </div>

              <div className="space-y-1.5">
                <Label>Withdrawal Method</Label>
                <RadioGroup
                  defaultValue="bank"
                  onValueChange={(value) => setValue("withdrawalMethod", value as "bank" | "cash")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer">
                      <ArrowRight className="h-4 w-4" />
                      Bank Transfer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="h-4 w-4" />
                      Cash Withdrawal
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {watch("withdrawalMethod") === "bank" && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-700">Your bank account details from your profile will be used for the transfer.</p>
                </div>
              )}

              {watch("withdrawalMethod") === "cash" && (
                <div className="space-y-1.5">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any notes for the admin regarding your cash withdrawal request..."
                    rows={2}
                    {...register("notes")}
                  />
                  <p className="text-xs text-muted-foreground">Admin will verify and hand over cash to you.</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-semibold h-12"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Withdrawal Request"}
              </Button>
            </form>
          </div>

          {/* Withdrawal History */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Withdrawal History</h2>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal._id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">₹{withdrawal.amount.toLocaleString("en-IN")}</span>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {withdrawal.withdrawalMethod === "bank" ? "Bank Transfer" : "Cash Withdrawal"} • {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </p>
                      {withdrawal.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {withdrawal.rejectionReason}</p>
                      )}
                    </div>
                    {withdrawal.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cancelWithdrawal(withdrawal._id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

function watch(field: string) {
  return field;
}
