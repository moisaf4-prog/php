import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, useTheme, API } from "../App";
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
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-cyber-muted hover:text-cyber-primary">
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-cyber-primary" />
            <h1 className="font-heading text-3xl font-bold text-cyber-primary tracking-tight">STRESSER</h1>
          </div>
          <p className="text-cyber-muted font-body">Layer 7 Stress Testing Panel</p>
        </div>

        {/* Form Card */}
        <div className="bg-cyber-surface border border-cyber-border p-8 relative">
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-primary" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-primary" />
          
          <h2 className="font-heading text-xl font-bold text-cyber-text mb-6 uppercase tracking-wider">Register</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
                <Input
                  data-testid="register-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose username"
                  className="pl-10 bg-cyber-highlight border-cyber-border focus:border-cyber-primary text-cyber-text font-code"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
                <Input
                  data-testid="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose password"
                  className="pl-10 bg-cyber-highlight border-cyber-border focus:border-cyber-primary text-cyber-text font-code"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Telegram ID</Label>
              <div className="relative">
                <SiTelegram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
                <Input
                  data-testid="register-telegram"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="@username or ID"
                  className="pl-10 bg-cyber-highlight border-cyber-border focus:border-cyber-primary text-cyber-text font-code"
                />
              </div>
            </div>
            
            <Button
              data-testid="register-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-cyber-primary text-black font-heading font-bold uppercase tracking-widest hover:bg-cyber-primaryDim hover:shadow-[0_0_15px_rgba(0,255,148,0.5)] transition-all"
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-cyber-muted text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-cyber-primary hover:text-cyber-accent transition-colors">
                Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
