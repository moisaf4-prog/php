import { useState, useEffect } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Check, Zap, Clock, Users, CreditCard, ArrowRight, X, Loader2, Shield, Star } from "lucide-react";
import { SiBitcoin, SiLitecoin, SiEthereum, SiMonero, SiDogecoin } from "react-icons/si";

export default function Plans() {
  usePageTitle("Plans & Pricing");
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState([]);
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
      const [plansRes, methodsRes, settingsRes] = await Promise.all([
        axios.get(`${API}/plans`),
        axios.get(`${API}/methods`),
        axios.get(`${API}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} }))
      ]);
      setPlans(plansRes.data);
      setMethods(methodsRes.data);
      setSettings(settingsRes.data);
      if (settingsRes.data?.accepted_crypto?.length > 0) {
        setSelectedCrypto(settingsRes.data.accepted_crypto[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMethodName = (methodId) => {
    const method = methods.find(m => m.id === methodId);
    return method?.name || methodId;
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
    }, 5000);
    
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
      case 'DOGE': return SiDogecoin;
      default: return CreditCard;
    }
  };

  const planStyles = {
    free: { border: "border-slate-700", bg: "bg-slate-900", text: "text-slate-400", btn: "bg-slate-800 text-slate-500" },
    basic: { border: "border-blue-500/50", bg: "bg-blue-500/5", text: "text-blue-400", btn: "bg-blue-600 hover:bg-blue-700" },
    premium: { border: "border-emerald-500/50", bg: "bg-emerald-500/5", text: "text-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-700" },
    enterprise: { border: "border-amber-500/50", bg: "bg-amber-500/5", text: "text-amber-400", btn: "bg-amber-600 hover:bg-amber-700" }
  };

  const formatDuration = (seconds) => {
    if (seconds >= 3600) return `${seconds / 3600}h`;
    if (seconds >= 60) return `${seconds / 60}m`;
    return `${seconds}s`;
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">Choose Your Plan</h1>
          <p className="text-slate-400">Select the plan that best fits your testing needs</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, idx) => {
            const isCurrentPlan = user?.plan === plan.id;
            const style = planStyles[plan.id] || planStyles.free;
            const planMethods = plan.methods || [];
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative ${style.bg} border ${style.border} rounded-xl p-6 flex flex-col`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Active
                  </div>
                )}
                
                {plan.id === "enterprise" && !isCurrentPlan && (
                  <div className="absolute -top-3 right-4 px-2 py-1 bg-amber-500 text-black text-xs font-bold uppercase rounded-full">
                    Popular
                  </div>
                )}
                
                <div className="mb-5">
                  <h3 className={`text-lg font-bold uppercase tracking-wider ${style.text}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-slate-100">
                      ${plan.price?.toFixed(2) || '0.00'}
                    </span>
                    {plan.duration_days && (
                      <span className="text-slate-500 text-sm">/{plan.duration_days}d</span>
                    )}
                  </div>
                </div>
                
                {/* Key Features */}
                <div className="space-y-2 mb-5 pb-5 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Duration</span>
                    <span className="text-slate-200 font-medium">{formatDuration(plan.max_time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Concurrent</span>
                    <span className="text-slate-200 font-medium">{plan.max_concurrent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Methods</span>
                    <span className="text-slate-200 font-medium">{planMethods.length}</span>
                  </div>
                </div>
                
                {/* Methods List */}
                <div className="flex-1 mb-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Included Methods</p>
                  {planMethods.length > 0 ? (
                    <div className="space-y-1.5">
                      {planMethods.map((methodId, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-slate-300 text-sm">{getMethodName(methodId)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm italic">No methods included</p>
                  )}
                </div>
                
                {/* Action Button */}
                {plan.id === "free" ? (
                  <Button disabled className="w-full bg-slate-800 text-slate-500 cursor-not-allowed rounded-lg">
                    Free Tier
                  </Button>
                ) : isCurrentPlan ? (
                  <Button disabled className="w-full bg-blue-600/20 text-blue-400 cursor-not-allowed rounded-lg">
                    <Check className="w-4 h-4 mr-2" /> Active Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePurchase(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full ${style.btn} text-white font-semibold rounded-lg`}
                  >
                    {loading === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Upgrade <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Crypto Accepted */}
        <div className="text-center pt-4">
          <p className="text-slate-500 text-sm mb-3">Accepted Cryptocurrencies</p>
          <div className="flex items-center justify-center gap-4">
            <SiBitcoin className="w-6 h-6 text-orange-500" title="Bitcoin" />
            <SiLitecoin className="w-6 h-6 text-blue-400" title="Litecoin" />
            <SiEthereum className="w-6 h-6 text-purple-400" title="Ethereum" />
            <SiDogecoin className="w-6 h-6 text-yellow-500" title="Dogecoin" />
            <SiMonero className="w-6 h-6 text-orange-400" title="Monero" />
          </div>
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
                  onClick={() => { setShowPaymentModal(null); setPaymentData(null); setCheckingPayment(false); }}
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
                  <span className="text-2xl font-bold text-emerald-500">${showPaymentModal.price?.toFixed(2)}</span>
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
                        {(settings?.accepted_crypto || ['BTC', 'LTC', 'ETH', 'DOGE']).map((crypto) => {
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
                <div className="text-center py-4">
                  {checkingPayment && (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-slate-300">Waiting for payment...</p>
                      <p className="text-xs text-slate-500">
                        Complete payment in the new window. This will update automatically.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500 mt-4 text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Secure payment via CoinPayments
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}
