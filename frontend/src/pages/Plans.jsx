import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Check, Zap, Clock, Users, CreditCard, ArrowRight } from "lucide-react";
import { SiLitecoin, SiMonero, SiTether, SiSolana } from "react-icons/si";

export default function Plans() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API}/plans`);
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurchase = async (planId) => {
    if (planId === "free") return;
    
    setLoading(planId);
    try {
      const res = await axios.post(`${API}/checkout`, {
        plan_id: planId,
        origin_url: window.location.origin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Redirect to Stripe
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Checkout failed");
    } finally {
      setLoading("");
    }
  };

  const planColors = {
    free: "border-cyber-muted",
    basic: "border-cyber-accent",
    premium: "border-cyber-primary",
    enterprise: "border-cyber-secondary"
  };

  return (
    <Layout>
      <div data-testid="plans-page" className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-cyber-text tracking-tight">CHOOSE YOUR POWER</h1>
          <p className="text-cyber-muted mt-2">Select a plan that fits your testing needs</p>
          
          {/* Crypto Icons */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-cyber-muted text-sm">We accept:</span>
            <SiLitecoin className="w-5 h-5 text-gray-400" title="Litecoin" />
            <SiMonero className="w-5 h-5 text-orange-400" title="Monero" />
            <SiTether className="w-5 h-5 text-green-400" title="USDT" />
            <SiSolana className="w-5 h-5 text-purple-400" title="Solana" />
            <CreditCard className="w-5 h-5 text-cyber-muted" title="Card" />
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, idx) => {
            const isCurrentPlan = user?.plan === plan.id;
            const colorClass = planColors[plan.id] || "border-cyber-border";
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative bg-cyber-surface border-2 ${colorClass} p-6 flex flex-col`}
              >
                {/* Corner decorations */}
                <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${colorClass}`} />
                <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${colorClass}`} />
                
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyber-primary text-black text-xs font-heading font-bold uppercase">
                    Current
                  </div>
                )}
                
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="font-heading text-xl font-bold text-cyber-text uppercase tracking-wider">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="font-heading text-3xl font-bold text-cyber-text">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-cyber-muted text-sm">/month</span>
                  </div>
                </div>
                
                {/* Specs */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-cyber-primary" />
                    <span className="text-cyber-text text-sm">
                      {plan.max_time >= 60 ? `${plan.max_time / 60}min` : `${plan.max_time}s`} max attack
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-cyber-accent" />
                    <span className="text-cyber-text text-sm">
                      {plan.max_concurrent} concurrent
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-cyber-secondary" />
                    <span className="text-cyber-text text-sm">
                      {plan.methods.length} methods
                    </span>
                  </div>
                </div>
                
                {/* Features */}
                <div className="flex-1 space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyber-primary flex-shrink-0" />
                      <span className="text-cyber-muted text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Action Button */}
                {plan.id === "free" ? (
                  <Button
                    disabled
                    className="w-full bg-cyber-muted/20 text-cyber-muted font-heading uppercase tracking-wider cursor-not-allowed"
                  >
                    Free Plan
                  </Button>
                ) : isCurrentPlan ? (
                  <Button
                    disabled
                    className="w-full bg-cyber-primary/20 text-cyber-primary font-heading uppercase tracking-wider cursor-not-allowed"
                  >
                    Active
                  </Button>
                ) : (
                  <Button
                    data-testid={`buy-${plan.id}`}
                    onClick={() => handlePurchase(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full font-heading font-bold uppercase tracking-wider transition-all ${
                      plan.id === "premium" 
                        ? "bg-cyber-primary text-black hover:bg-cyber-primaryDim hover:shadow-[0_0_15px_rgba(0,255,148,0.5)]"
                        : plan.id === "enterprise"
                        ? "bg-cyber-secondary text-white hover:bg-cyber-secondary/80 hover:shadow-[0_0_15px_rgba(255,0,60,0.5)]"
                        : "bg-cyber-accent text-black hover:bg-cyber-accent/80"
                    }`}
                  >
                    {loading === plan.id ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Purchase <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Methods Preview */}
        <div className="bg-cyber-surface border border-cyber-border p-6">
          <h2 className="font-heading text-lg font-bold text-cyber-text mb-4">AVAILABLE METHODS BY PLAN</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border">
                  <th className="text-left py-2 text-xs uppercase tracking-wider text-cyber-muted">Method</th>
                  {plans.map(p => (
                    <th key={p.id} className="text-center py-2 text-xs uppercase tracking-wider text-cyber-muted">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["HTTP-GET", "HTTP-POST", "HTTP-HEAD", "SLOWLORIS", "TLS-VIP", "CF-BYPASS", "BROWSER-SIM", "RUDY"].map(method => (
                  <tr key={method} className="border-b border-cyber-border/50">
                    <td className="py-2 font-code text-sm text-cyber-text">{method}</td>
                    {plans.map(p => (
                      <td key={p.id} className="text-center py-2">
                        {p.methods.includes(method) ? (
                          <Check className="w-4 h-4 text-cyber-primary mx-auto" />
                        ) : (
                          <span className="text-cyber-muted">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
