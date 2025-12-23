import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, useTheme, API } from "../App";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { SiTelegram } from "react-icons/si";
import { Lock, User, Zap, Moon, Sun } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !telegramId) {
      toast.error("Fill all fields");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register`, {
        username,
        password,
        telegram_id: telegramId
      });
      login(res.data.token, res.data.user);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-20">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-blue-500 rounded-lg">
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-100">Layer7<span className="text-blue-500">Top</span></span>
          </Link>
          <p className="text-slate-400">Create your account</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  data-testid="register-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose username"
                  className="pl-11 h-12 bg-slate-800 border-slate-700 text-slate-100 rounded-xl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  data-testid="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose password"
                  className="pl-11 h-12 bg-slate-800 border-slate-700 text-slate-100 rounded-xl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Telegram ID</Label>
              <div className="relative">
                <SiTelegram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  data-testid="register-telegram"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="@username or ID"
                  className="pl-11 h-12 bg-slate-800 border-slate-700 text-slate-100 rounded-xl"
                />
              </div>
            </div>
            
            <Button
              data-testid="register-submit"
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-500 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}