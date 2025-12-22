import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Target, Zap, Clock, Users, Activity, Square, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  
  const [methods, setMethods] = useState([]);
  const [plans, setPlans] = useState({});
  const [runningAttacks, setRunningAttacks] = useState([]);
  
  // Attack form
  const [target, setTarget] = useState("");
  const [port, setPort] = useState(80);
  const [method, setMethod] = useState("");
  const [duration, setDuration] = useState(60);
  const [concurrents, setConcurrents] = useState(1);
  const [loading, setLoading] = useState(false);

  const currentPlan = plans[user?.plan] || { max_time: 60, max_concurrent: 1, methods: [] };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchRunningAttacks, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [methodsRes, plansRes] = await Promise.all([
        axios.get(`${API}/methods`),
        axios.get(`${API}/plans`)
      ]);
      setMethods(methodsRes.data);
      const plansMap = {};
      plansRes.data.forEach(p => plansMap[p.id] = p);
      setPlans(plansMap);
      fetchRunningAttacks();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRunningAttacks = async () => {
    try {
      const res = await axios.get(`${API}/attacks/running`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRunningAttacks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttack = async (e) => {
    e.preventDefault();
    if (!target || !method) {
      toast.error("Enter target and select method");
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API}/attacks`, {
        target,
        port,
        method,
        duration,
        concurrents
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Attack started!");
      fetchRunningAttacks();
      setTarget("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to start attack");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async (attackId) => {
    try {
      await axios.post(`${API}/attacks/${attackId}/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Attack stopped");
      fetchRunningAttacks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to stop");
    }
  };

  const availableMethods = methods.filter(m => currentPlan.methods?.includes(m.id));

  return (
    <Layout>
      <div data-testid="dashboard" className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-cyber-text tracking-tight">ATTACK PANEL</h1>
            <p className="text-cyber-muted mt-1">Launch Layer 7 stress tests</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-cyber-surface border border-cyber-border">
            <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
            <span className="font-code text-sm text-cyber-primary uppercase">{user?.plan} Plan</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-cyber-surface border border-cyber-border p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-cyber-primary" />
              <div>
                <p className="text-xs text-cyber-muted uppercase">Max Time</p>
                <p className="font-code text-xl text-cyber-text">{currentPlan.max_time}s</p>
              </div>
            </div>
          </div>
          <div className="bg-cyber-surface border border-cyber-border p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyber-accent" />
              <div>
                <p className="text-xs text-cyber-muted uppercase">Max Concurrent</p>
                <p className="font-code text-xl text-cyber-text">{currentPlan.max_concurrent}</p>
              </div>
            </div>
          </div>
          <div className="bg-cyber-surface border border-cyber-border p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-cyber-secondary" />
              <div>
                <p className="text-xs text-cyber-muted uppercase">Methods</p>
                <p className="font-code text-xl text-cyber-text">{currentPlan.methods?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-cyber-surface border border-cyber-border p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-cyber-primary" />
              <div>
                <p className="text-xs text-cyber-muted uppercase">Running</p>
                <p className="font-code text-xl text-cyber-text">{runningAttacks.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Running Attacks */}
        {runningAttacks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cyber-surface border border-cyber-primary/30 p-6"
          >
            <h2 className="font-heading text-lg text-cyber-primary mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 animate-pulse" />
              RUNNING ATTACKS
            </h2>
            <div className="space-y-3">
              {runningAttacks.map((attack) => (
                <div key={attack.id} className="flex items-center justify-between bg-cyber-highlight p-4 border border-cyber-border">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-cyber-primary animate-glow" />
                    <div>
                      <p className="font-code text-cyber-text">{attack.target}:{attack.port}</p>
                      <p className="text-xs text-cyber-muted">{attack.method} • {attack.duration}s • {attack.concurrents} threads</p>
                    </div>
                  </div>
                  <Button
                    data-testid={`stop-attack-${attack.id}`}
                    onClick={() => handleStop(attack.id)}
                    variant="ghost"
                    size="sm"
                    className="text-cyber-secondary hover:bg-cyber-secondary/10"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    STOP
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Attack Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-cyber-surface border border-cyber-border p-6 relative"
        >
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-primary" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-primary" />
          
          <h2 className="font-heading text-xl font-bold text-cyber-text mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-cyber-primary" />
            LAUNCH ATTACK
          </h2>

          <form onSubmit={handleAttack} className="space-y-6">
            {/* Target & Port */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs uppercase tracking-widest text-cyber-muted">Target URL / IP</Label>
                <Input
                  data-testid="attack-target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="https://example.com or 192.168.1.1"
                  className="bg-cyber-highlight border-cyber-border focus:border-cyber-primary text-cyber-text font-code"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-cyber-muted">Port</Label>
                <Input
                  data-testid="attack-port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value) || 80)}
                  className="bg-cyber-highlight border-cyber-border focus:border-cyber-primary text-cyber-text font-code"
                />
              </div>
            </div>

            {/* Method */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Attack Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger data-testid="attack-method" className="bg-cyber-highlight border-cyber-border text-cyber-text relative z-10">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-surface border-cyber-border" style={{ zIndex: 9999 }}>
                  {availableMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-cyber-text hover:bg-cyber-highlight cursor-pointer" data-testid={`method-${m.id}`}>
                      <div className="flex flex-col">
                        <span className="font-code">{m.name}</span>
                        <span className="text-xs text-cyber-muted">{m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableMethods.length === 0 && (
                <p className="text-xs text-cyber-secondary flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Upgrade your plan to access attack methods
                </p>
              )}
            </div>

            {/* Duration & Concurrents */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-widest text-cyber-muted">Duration</Label>
                  <span className="font-code text-cyber-primary">{duration}s</span>
                </div>
                <Slider
                  data-testid="attack-duration"
                  value={[duration]}
                  onValueChange={(v) => setDuration(v[0])}
                  max={currentPlan.max_time}
                  min={10}
                  step={10}
                  className="[&_[role=slider]]:bg-cyber-primary [&_[role=slider]]:border-cyber-primary"
                />
                <p className="text-xs text-cyber-muted">Max: {currentPlan.max_time}s</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-widest text-cyber-muted">Concurrents</Label>
                  <span className="font-code text-cyber-primary">{concurrents}</span>
                </div>
                <Slider
                  data-testid="attack-concurrents"
                  value={[concurrents]}
                  onValueChange={(v) => setConcurrents(v[0])}
                  max={currentPlan.max_concurrent}
                  min={1}
                  step={1}
                  className="[&_[role=slider]]:bg-cyber-primary [&_[role=slider]]:border-cyber-primary"
                />
                <p className="text-xs text-cyber-muted">Max: {currentPlan.max_concurrent}</p>
              </div>
            </div>

            {/* Submit */}
            <Button
              data-testid="attack-submit"
              type="submit"
              disabled={loading || !target || !method}
              className="w-full bg-cyber-primary text-black font-heading font-bold text-lg uppercase tracking-widest hover:bg-cyber-primaryDim hover:shadow-[0_0_20px_rgba(0,255,148,0.5)] transition-all py-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  LAUNCHING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  START ATTACK
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
