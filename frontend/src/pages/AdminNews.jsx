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
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  Newspaper, Plus, Edit2, Trash2, Save, X, RefreshCw, ArrowLeft, Eye, EyeOff
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminNews() {
  usePageTitle("News Management");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newNews, setNewNews] = useState({
    title: "",
    content: "",
    type: "info",
    is_active: true
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await axios.get(`${API}/admin/news`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNews(res.data);
    } catch (err) {
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNews = async () => {
    if (!newNews.title || !newNews.content) {
      toast.error("Title and content are required");
      return;
    }
    try {
      await axios.post(`${API}/admin/news`, newNews, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("News created");
      setNewNews({ title: "", content: "", type: "info", is_active: true });
      setShowAddForm(false);
      fetchNews();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create");
    }
  };

  const handleUpdateNews = async () => {
    if (!editingNews) return;
    try {
      await axios.put(`${API}/admin/news/${editingNews.id}`, editingNews, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("News updated");
      setEditingNews(null);
      fetchNews();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!confirm("Delete this news item?")) return;
    try {
      await axios.delete(`${API}/admin/news/${newsId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("News deleted");
      fetchNews();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await axios.put(`${API}/admin/news/${item.id}`, {
        ...item,
        is_active: !item.is_active
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNews();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "update": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "alert": return "bg-red-500/10 text-red-500 border-red-500/30";
      case "promo": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
      <div data-testid="admin-news" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <Newspaper className="w-7 h-7 text-blue-500" />
                News Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">Manage announcements and updates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchNews} variant="ghost" className="text-slate-400 hover:text-blue-500 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add News
            </Button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-xl p-6 border border-slate-800"
          >
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Create News</h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Title</Label>
                  <Input
                    value={newNews.title}
                    onChange={(e) => setNewNews(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="News title"
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Type</Label>
                  <Select value={newNews.type} onValueChange={(val) => setNewNews(prev => ({ ...prev, type: val }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="info" className="text-slate-300">Info</SelectItem>
                      <SelectItem value="update" className="text-blue-500">Update</SelectItem>
                      <SelectItem value="alert" className="text-red-500">Alert</SelectItem>
                      <SelectItem value="promo" className="text-emerald-500">Promo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Content</Label>
                <Textarea
                  value={newNews.content}
                  onChange={(e) => setNewNews(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="News content..."
                  rows={4}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddNews} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-4 h-4 mr-2" /> Create
                </Button>
                <Button onClick={() => setShowAddForm(false)} variant="ghost" className="text-slate-400 hover:text-slate-100">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* News List */}
        <div className="space-y-4">
          {news.length === 0 ? (
            <div className="bg-slate-900 rounded-xl p-12 text-center border border-slate-800">
              <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No news yet</p>
            </div>
          ) : (
            news.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-slate-900 rounded-xl border border-slate-800 ${!item.is_active ? 'opacity-50' : ''}`}
              >
                {editingNews?.id === item.id ? (
                  /* Edit Mode */
                  <div className="p-5 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400">Title</Label>
                        <Input
                          value={editingNews.title}
                          onChange={(e) => setEditingNews(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-slate-800 border-slate-700 text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400">Type</Label>
                        <Select value={editingNews.type} onValueChange={(val) => setEditingNews(prev => ({ ...prev, type: val }))}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="info" className="text-slate-300">Info</SelectItem>
                            <SelectItem value="update" className="text-blue-500">Update</SelectItem>
                            <SelectItem value="alert" className="text-red-500">Alert</SelectItem>
                            <SelectItem value="promo" className="text-emerald-500">Promo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Content</Label>
                      <Textarea
                        value={editingNews.content}
                        onChange={(e) => setEditingNews(prev => ({ ...prev, content: e.target.value }))}
                        rows={3}
                        className="bg-slate-800 border-slate-700 text-slate-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateNews} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Save className="w-4 h-4 mr-2" /> Save
                      </Button>
                      <Button onClick={() => setEditingNews(null)} variant="ghost" className="text-slate-400">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <h3 className="font-semibold text-slate-100">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          onClick={() => handleToggleActive(item)} 
                          variant="ghost" 
                          size="sm" 
                          className={`rounded-lg ${item.is_active ? 'text-emerald-500' : 'text-slate-500'}`}
                          title={item.is_active ? "Hide" : "Show"}
                        >
                          {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button onClick={() => setEditingNews({ ...item })} variant="ghost" size="sm" className="text-slate-400 hover:text-blue-500 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDeleteNews(item.id)} variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{item.content}</p>
                    <p className="text-xs text-slate-600">{formatDate(item.created_at)}</p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
