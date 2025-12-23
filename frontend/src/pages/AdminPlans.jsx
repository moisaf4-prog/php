import { useState, useEffect } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  CreditCard, Plus, Edit2, Trash2, Save, X, RefreshCw, ArrowLeft, Clock, Users, Zap
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminPlans() {
  usePageTitle("Plan Management");
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    id: "",
    name: "",
    price: 0,
    max_time: 60,
    max_concurrent: 1,
    methods: [],
    features: []
  });
  const [newFeature, setNewFeature] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, methodsRes] = await Promise.all([
        axios.get(`${API}/plans`),
        axios.get(`${API}/methods`)
      ]);
      setPlans(plansRes.data);
      setMethods(methodsRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async () => {
    if (!newPlan.id || !newPlan.name) {
      toast.error("ID and Name are required");
      return;
    }
    try {
      await axios.post(`${API}/admin/plans`, newPlan, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Plan created");
      setNewPlan({ id: "", name: "", price: 0, max_time: 60, max_concurrent: 1, methods: [], features: [] });
      setShowAddPlan(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create plan");
    }
  };

  const handleUpdatePlan = async (planId) => {
    try {
      await axios.put(`${API}/admin/plans/${planId}`, editingPlan, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Plan updated");
      setEditingPlan(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (planId === "free") {
      toast.error("Cannot delete free plan");
      return;
    }
    if (!confirm("Delete this plan? Users on this plan will be moved to free.")) return;
    try {
      await axios.delete(`${API}/admin/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Plan deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete plan");
    }
  };

  const toggleMethod = (methodId, isEditing = false) => {
    if (isEditing && editingPlan) {
      setEditingPlan(prev => ({
        ...prev,
        methods: prev.methods.includes(methodId)
          ? prev.methods.filter(m => m !== methodId)
          : [...prev.methods, methodId]
      }));
    } else {
      setNewPlan(prev => ({
        ...prev,
        methods: prev.methods.includes(methodId)
          ? prev.methods.filter(m => m !== methodId)
          : [...prev.methods, methodId]
      }));
    }
  };

  const addFeature = (isEditing = false) => {
    if (!newFeature.trim()) return;
    if (isEditing && editingPlan) {
      setEditingPlan(prev => ({ ...prev, features: [...(prev.features || []), newFeature.trim()] }));
    } else {
      setNewPlan(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
    }
    setNewFeature("");
  };

  const removeFeature = (idx, isEditing = false) => {
    if (isEditing && editingPlan) {
      setEditingPlan(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
    } else {
      setNewPlan(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="admin-plans" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <CreditCard className="w-7 h-7 text-blue-500" />
                Plan Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">Configure subscription plans</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchData} variant="ghost" className="text-slate-400 hover:text-blue-500 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button onClick={() => setShowAddPlan(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </Button>
          </div>
        </div>

        {showAddPlan && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-xl p-6 border border-slate-800"
          >
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Create New Plan</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Plan ID</Label>
                <Input
                  value={newPlan.id}
                  onChange={(e) => setNewPlan(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s/g, '-') }))}
                  placeholder="pro-plus"
                  className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Name</Label>
                <Input
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(p => ({ ...p, name: e.target.value }))}
                  placeholder="Pro Plus"
                  className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Price ($)</Label>
                <Input
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Max Time (s)</Label>
                <Input
                  type="number"
                  value={newPlan.max_time}
                  onChange={(e) => setNewPlan(p => ({ ...p, max_time: parseInt(e.target.value) || 60 }))}
                  className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Max Concurrent</Label>
                <Input
                  type="number"
                  value={newPlan.max_concurrent}
                  onChange={(e) => setNewPlan(p => ({ ...p, max_concurrent: parseInt(e.target.value) || 1 }))}
                  className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add feature"
                    className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button onClick={() => addFeature()} type="button" size="icon" className="bg-slate-700 hover:bg-slate-600 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {newPlan.features.map((f, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded flex items-center gap-1">
                      {f}
                      <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <Label className="text-xs text-slate-400 mb-2 block">Methods</Label>
              <div className="flex flex-wrap gap-2">
                {methods.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMethod(m.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                      newPlan.methods.includes(m.id)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-500'
                    }`}
                  >
                    {m.id}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddPlan} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                <Save className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
              <Button onClick={() => setShowAddPlan(false)} variant="ghost" className="text-slate-400 hover:text-slate-100 rounded-lg">
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-900 rounded-xl p-5 border border-slate-800"
            >
              {editingPlan?.id === plan.id ? (
                <div className="space-y-3">
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan(p => ({ ...p, name: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-slate-100 font-bold text-lg rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-slate-500">Price</Label>
                      <Input
                        type="number"
                        value={editingPlan.price}
                        onChange={(e) => setEditingPlan(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                        className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Max Time</Label>
                      <Input
                        type="number"
                        value={editingPlan.max_time}
                        onChange={(e) => setEditingPlan(p => ({ ...p, max_time: parseInt(e.target.value) || 60 }))}
                        className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Max Concurrent</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_concurrent}
                      onChange={(e) => setEditingPlan(p => ({ ...p, max_concurrent: parseInt(e.target.value) || 1 }))}
                      className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Methods</Label>
                    <div className="flex flex-wrap gap-1">
                      {methods.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMethod(m.id, true)}
                          className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                            editingPlan.methods.includes(m.id)
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}
                        >
                          {m.id}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => handleUpdatePlan(plan.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                      <Save className="w-3 h-3 mr-1" /> Save
                    </Button>
                    <Button onClick={() => setEditingPlan(null)} size="sm" variant="ghost" className="text-slate-400 rounded-lg">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-100 uppercase">{plan.name}</h3>
                      <p className="text-2xl font-bold text-blue-500">${plan.price.toFixed(2)}<span className="text-sm text-slate-500">/mo</span></p>
                    </div>
                    <div className="flex gap-1">
                      <Button onClick={() => setEditingPlan({ ...plan })} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-500 rounded">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      {plan.id !== "free" && (
                        <Button onClick={() => handleDeletePlan(plan.id)} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500 rounded">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>{plan.max_time}s max attack</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4 text-cyan-500" />
                      <span>{plan.max_concurrent} concurrent</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>{plan.methods?.length || 0} methods</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-2">Methods:</p>
                    <div className="flex flex-wrap gap-1">
                      {plan.methods?.map(m => (
                        <span key={m} className="px-1.5 py-0.5 text-xs font-mono bg-slate-800 rounded text-blue-400">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}