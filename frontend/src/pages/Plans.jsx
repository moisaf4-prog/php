import { useState, useEffect } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Check, Zap, Clock, Users, CreditCard, ArrowRight } from "lucide-react";
import { SiLitecoin, SiMonero, SiTether, SiSolana } from "react-icons/si";

export default function Plans() {
  usePageTitle("Plans & Pricing");
  const { user } = useAuth();
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
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Checkout failed");
    } finally {
      setLoading("");
    }
  };

  const planColors = {
    free: "border-slate-700",
    basic: "border-blue-500",
    premium: "border-emerald-500",
    enterprise: "border-amber-500"
  };

  const planBtnColors = {
    basic: "bg-blue-600 hover:bg-blue-700",
    premium: "bg-emerald-600 hover:bg-emerald-700",
    enterprise: "bg-amber-600 hover:bg-amber-700"
  };

  return (
    <Layout>
      <div data-testid="plans-page" className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100">Choose Your Plan</h1>
          <p className="text-slate-400 mt-2">Select a plan that fits your testing needs</p>
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-slate-500 text-sm">We accept:</span>
            <SiLitecoin className="w-5 h-5 text-slate-400 hover:text-blue-500 transition-colors" title="Litecoin" />
            <SiMonero className="w-5 h-5 text-slate-400 hover:text-orange-500 transition-colors" title="Monero" />
            <SiTether className="w-5 h-5 text-slate-400 hover:text-green-500 transition-colors" title="USDT" />
            <SiSolana className="w-5 h-5 text-slate-400 hover:text-purple-500 transition-colors" title="Solana" />
            <CreditCard className="w-5 h-5 text-slate-400" title="Card" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, idx) => {
            const isCurrentPlan = user?.plan === plan.id;
            const colorClass = planColors[plan.id] || "border-slate-700";
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative bg-slate-900 border-2 ${colorClass} rounded-xl p-6 flex flex-col`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase rounded-full">
                    Current
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-100 uppercase tracking-wider">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-slate-100">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-slate-300 text-sm">
                      {plan.max_time >= 60 ? `${plan.max_time / 60}min` : `${plan.max_time}s`} max attack
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-cyan-500" />
                    <span className="text-slate-300 text-sm">
                      {plan.max_concurrent} concurrent
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-300 text-sm">
                      {plan.methods.length} methods
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-2 mb-6">
                  {plan.features?.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-400 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {plan.id === "free" ? (
                  <Button disabled className="w-full bg-slate-800 text-slate-500 cursor-not-allowed rounded-lg">
                    Free Plan
                  </Button>
                ) : isCurrentPlan ? (
                  <Button disabled className="w-full bg-blue-600/20 text-blue-500 cursor-not-allowed rounded-lg">
                    Active
                  </Button>
                ) : (
                  <Button
                    data-testid={`buy-${plan.id}`}
                    onClick={() => handlePurchase(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full ${planBtnColors[plan.id] || 'bg-blue-600 hover:bg-blue-700'} text-white font-bold uppercase tracking-wider rounded-lg`}
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
      </div>
    </Layout>
  );
}