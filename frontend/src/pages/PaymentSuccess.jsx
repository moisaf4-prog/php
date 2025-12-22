import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "../App";
import { Check, Loader2, X, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("loading"); // loading, success, failed
  const [attempts, setAttempts] = useState(0);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (sessionId) {
      pollStatus();
    } else {
      setStatus("failed");
    }
  }, [sessionId]);

  const pollStatus = async () => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus("failed");
      return;
    }

    try {
      const res = await axios.get(`${API}/checkout/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.payment_status === "paid") {
        setStatus("success");
        await refreshUser();
        toast.success("Payment successful! Plan upgraded.");
        return;
      } else if (res.data.status === "expired") {
        setStatus("failed");
        toast.error("Payment session expired");
        return;
      }

      // Continue polling
      setAttempts(prev => prev + 1);
      setTimeout(pollStatus, pollInterval);
    } catch (err) {
      console.error(err);
      setAttempts(prev => prev + 1);
      setTimeout(pollStatus, pollInterval);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-cyber-surface border border-cyber-border p-12 text-center max-w-md w-full relative"
      >
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyber-primary" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyber-primary" />

        {status === "loading" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyber-highlight flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-cyber-primary animate-spin" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-cyber-text mb-2">PROCESSING PAYMENT</h1>
            <p className="text-cyber-muted">Please wait while we confirm your payment...</p>
            <p className="text-xs text-cyber-muted mt-4">Attempt {attempts + 1} of 10</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyber-primary/20 flex items-center justify-center border-glow">
              <Check className="w-10 h-10 text-cyber-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-cyber-primary mb-2">PAYMENT SUCCESSFUL</h1>
            <p className="text-cyber-muted mb-8">Your plan has been upgraded. Start testing now!</p>
            <Button
              data-testid="goto-dashboard"
              onClick={() => navigate("/dashboard")}
              className="bg-cyber-primary text-black font-heading font-bold uppercase tracking-widest hover:bg-cyber-primaryDim"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyber-secondary/20 flex items-center justify-center">
              <X className="w-10 h-10 text-cyber-secondary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-cyber-secondary mb-2">PAYMENT FAILED</h1>
            <p className="text-cyber-muted mb-8">Something went wrong. Please try again.</p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/plans")}
                className="w-full bg-cyber-secondary text-white font-heading font-bold uppercase tracking-widest hover:bg-cyber-secondary/80"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                className="w-full text-cyber-muted hover:text-cyber-text"
              >
                Back to Dashboard
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
