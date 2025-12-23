import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "../App";
import { usePageTitle } from "../hooks/usePageTitle";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Target, Zap, Clock, Users, Activity, Square, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  usePageTitle("Attack Panel");
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  
  const [methods, setMethods] = useState([]);
  const [plans, setPlans] = useState({});
  const [runningAttacks, setRunningAttacks] = useState([]);
  
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
      await axios.post(`${API}/attacks`, { target, port, method, duration, concurrents }, {
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
      <div data-testid="dashboard" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Attack Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Launch Layer 7 stress tests</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-mono text-sm text-blue-500 uppercase">{user?.plan} Plan</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase">Max Time</p>
                <p className="font-mono text-xl text-slate-100">{currentPlan.max_time}s</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase">Max Concurrent</p>
                <p className="font-mono text-xl text-slate-100">{currentPlan.max_concurrent}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase">Methods</p>
                <p className="font-mono text-xl text-slate-100">{currentPlan.methods?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase">Running</p>
                <p className="font-mono text-xl text-slate-100">{runningAttacks.length}</p>
              </div>
            </div>
          </div>
        </div>

        {runningAttacks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-emerald-500/30 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-emerald-500 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 animate-pulse" />
              Running Attacks
            </h2>
            <div className="space-y-3">
              {runningAttacks.map((attack) => (
                <div key={attack.id} className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="font-mono text-slate-100">{attack.target}:{attack.port}</p>
                      <p className="text-xs text-slate-500">{attack.method} • {attack.duration}s • {attack.concurrents} threads</p>
                    </div>
                  </div>
                  <Button
                    data-testid={`stop-attack-${attack.id}`}
                    onClick={() => handleStop(attack.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-500/10"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-500" />
            Launch Attack
          </h2>

          <form onSubmit={handleAttack} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Target URL / IP</Label>
                <Input
                  data-testid="attack-target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="https://example.com or 192.168.1.1"
                  className="bg-slate-800 border-slate-700 text-slate-100 font-mono rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Port</Label>
                <Input
                  data-testid="attack-port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value) || 80)}
                  className="bg-slate-800 border-slate-700 text-slate-100 font-mono rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-slate-500">Attack Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger data-testid="attack-method" className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {availableMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-slate-100 hover:bg-slate-800">
                      <div className="flex flex-col">
                        <span className="font-mono">{m.name}</span>
                        <span className="text-xs text-slate-500">{m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableMethods.length === 0 && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Upgrade your plan to access attack methods
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Duration</Label>
                  <span className="font-mono text-blue-500">{duration}s</span>
                </div>
                <Slider
                  data-testid="attack-duration"
                  value={[duration]}
                  onValueChange={(v) => setDuration(v[0])}
                  max={currentPlan.max_time}
                  min={10}
                  step={10}
                  className="[&_[role=slider]]:bg-blue-500"
                />
                <p className="text-xs text-slate-500">Max: {currentPlan.max_time}s</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Concurrents</Label>
                  <span className="font-mono text-blue-500">{concurrents}</span>
                </div>
                <Slider
                  data-testid="attack-concurrents"
                  value={[concurrents]}
                  onValueChange={(v) => setConcurrents(v[0])}
                  max={currentPlan.max_concurrent}
                  min={1}
                  step={1}
                  className="[&_[role=slider]]:bg-blue-500"
                />
                <p className="text-xs text-slate-500">Max: {currentPlan.max_concurrent}</p>
              </div>
            </div>

            <Button
              data-testid="attack-submit"
              type="submit"
              disabled={loading || !target || !method}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg uppercase tracking-wider py-6 rounded-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Launching...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Start Attack
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}