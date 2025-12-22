import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, useTheme, API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Lock, User, Zap, Moon, Sun } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Fill all fields");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { username, password });
      login(res.data.token, res.data.user);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-panel flex items-center justify-center p-4">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-panel-muted hover:text-panel-primary rounded-lg">
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-panel-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-panel">Stresser<span className="text-panel-primary">.io</span></span>
          </Link>
          <p className="text-panel-muted">Sign in to your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-panel-surface rounded-2xl border border-panel p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-panel-muted">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-panel-muted" />
                <Input
                  data-testid="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-11 h-12 bg-panel-hover border-panel text-panel rounded-xl focus:ring-2 focus:ring-panel-primary"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-panel-muted">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-panel-muted" />
                <Input
                  data-testid="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-11 h-12 bg-panel-hover border-panel text-panel rounded-xl focus:ring-2 focus:ring-panel-primary"
                />
              </div>
            </div>
            
            <Button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-panel-primary hover:bg-panel-primary/90 text-white font-semibold rounded-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-panel-muted text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-panel-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
