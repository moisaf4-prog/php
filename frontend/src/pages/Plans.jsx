import { useState, useEffect } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Check, Zap, Clock, Users, CreditCard, ArrowRight, X, Loader2 } from "lucide-react";
import { SiBitcoin, SiLitecoin, SiEthereum, SiMonero } from "react-icons/si";

export default function Plans() {
  usePageTitle("Plans & Pricing");
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState("LTC");
  const [paymentData, setPaymentData] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, settingsRes] = await Promise.all([
        axios.get(`${API}/plans`),
        axios.get(`${API}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} }))
      ]);
      setPlans(plansRes.data);
      setSettings(settingsRes.data);
      if (settingsRes.data?.accepted_crypto?.length > 0) {
        setSelectedCrypto(settingsRes.data.accepted_crypto[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurchase = async (planId) => {
    if (planId === "free") return;
    const plan = plans.find(p => p.id === planId);
    setShowPaymentModal(plan);
  };

  const initiatePayment = async () => {
    if (!showPaymentModal) return;
    setLoading(showPaymentModal.id);
    
    try {
      const res = await axios.post(`${API}/payments/coinpayments/create`, {
        plan_id: showPaymentModal.id,
        currency: selectedCrypto
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPaymentData(res.data);
      
      // Open CoinPayments checkout in new window
      const cpUrl = `https://www.coinpayments.net/index.php?cmd=_pay_simple&reset=1&merchant=${res.data.merchant_id}&item_name=${encodeURIComponent(res.data.item_name)}&currency=${res.data.currency}&amountf=${res.data.amount}&want_shipping=0&custom=${res.data.custom}&ipn_url=${encodeURIComponent(res.data.ipn_url)}`;
      
      window.open(cpUrl, '_blank', 'width=600,height=800');
      toast.success("Payment window opened. Complete the payment there.");
      
      // Start checking payment status
      startPaymentCheck(res.data.payment_id);
      
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create payment");
    } finally {
      setLoading("");
    }
  };

  const startPaymentCheck = (paymentId) => {
    setCheckingPayment(true);
    
    const checkInterval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/payments/status/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.status === "completed") {
          clearInterval(checkInterval);
          setCheckingPayment(false);
          setShowPaymentModal(null);
          setPaymentData(null);
          toast.success("Payment completed! Your plan has been activated.");
          if (refreshUser) refreshUser();
          fetchData();
        } else if (res.data.status === "failed") {
          clearInterval(checkInterval);
          setCheckingPayment(false);
          toast.error("Payment failed or was cancelled.");
        }
      } catch (err) {
        console.error("Error checking payment:", err);
      }
    }, 5000); // Check every 5 seconds
    
    // Stop checking after 30 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      setCheckingPayment(false);
    }, 30 * 60 * 1000);
  };

  const getCryptoIcon = (crypto) => {
    switch(crypto) {
      case 'BTC': return SiBitcoin;
      case 'LTC': 
      case 'LTCT': return SiLitecoin;
      case 'ETH': return SiEthereum;
      case 'XMR': return SiMonero;
      default: return CreditCard;
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

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-100">Complete Payment</h3>
                <button 
                  onClick={() => { setShowPaymentModal(null); setPaymentData(null); }}
                  className="text-slate-400 hover:text-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Plan</span>
                  <span className="text-slate-100 font-bold">{showPaymentModal.name}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-2xl font-bold text-emerald-500">${showPaymentModal.price.toFixed(2)}</span>
                </div>
              </div>

              {!paymentData ? (
                <>
                  <div className="mb-6">
                    <label className="text-sm text-slate-400 mb-2 block">Select Cryptocurrency</label>
                    <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                        <SelectValue placeholder="Select crypto" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {(settings?.accepted_crypto || ['BTC', 'LTC', 'ETH', 'USDT']).map((crypto) => {
                          const Icon = getCryptoIcon(crypto);
                          return (
                            <SelectItem key={crypto} value={crypto} className="text-slate-100">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {crypto}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={initiatePayment}
                    disabled={loading === showPaymentModal.id}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                  >
                    {loading === showPaymentModal.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Pay with {selectedCrypto} <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  {checkingPayment && (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-slate-300">Waiting for payment confirmation...</p>
                      <p className="text-xs text-slate-500">
                        Complete the payment in the opened window. This page will update automatically.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500 mt-4 text-center">
                Payments are processed securely via CoinPayments
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}