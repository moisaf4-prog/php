import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "../App";
import { motion } from "framer-motion";
import { 
  Zap, Target, History, CreditCard, User, Shield, LogOut, Menu, X, Moon, Sun, Server
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const navItems = [
  { path: "/dashboard", label: "Attack Panel", icon: Target },
  { path: "/logs", label: "Attack Logs", icon: History },
  { path: "/plans", label: "Plans", icon: CreditCard },
  { path: "/profile", label: "Profile", icon: User },
];

const adminItems = [
  { path: "/admin", label: "Admin Panel", icon: Shield },
  { path: "/admin/servers", label: "Servers", icon: Server },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 border-r border-cyber-border bg-cyber-surface z-40">
        {/* Logo */}
        <div className="p-6 border-b border-cyber-border">
          <Link to="/" className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyber-primary" />
            <span className="font-heading text-xl font-bold text-cyber-primary tracking-tight">STRESSER</span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.slice(1)}`}
                className={`flex items-center gap-3 px-4 py-3 font-body text-sm uppercase tracking-wider transition-all relative z-10 ${ 
                  isActive
                    ? "bg-cyber-primary/10 text-cyber-primary border-l-2 border-cyber-primary"
                    : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-highlight"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          
          {user?.role === "admin" && (
            <>
              <div className="pt-4 pb-2">
                <span className="text-xs uppercase tracking-wider text-cyber-muted px-4">Admin</span>
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.path.replace(/\//g, '-').slice(1)}`}
                    className={`flex items-center gap-3 px-4 py-3 font-body text-sm uppercase tracking-wider transition-all relative z-10 ${
                      isActive
                        ? "bg-cyber-secondary/10 text-cyber-secondary border-l-2 border-cyber-secondary"
                        : "text-cyber-muted hover:text-cyber-secondary hover:bg-cyber-highlight"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        
        {/* User Info & Actions */}
        <div className="p-4 border-t border-cyber-border">
          <div className="mb-4 px-4">
            <p className="text-xs text-cyber-muted uppercase tracking-wider">Logged in as</p>
            <p className="font-code text-cyber-text truncate">{user?.username}</p>
            <p className="text-xs text-cyber-primary uppercase mt-1">{user?.plan} plan</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="text-cyber-muted hover:text-cyber-primary hover:bg-cyber-primary/10"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              onClick={handleLogout}
              data-testid="logout-btn"
              variant="ghost"
              className="flex-1 justify-start gap-3 text-cyber-muted hover:text-cyber-secondary hover:bg-cyber-secondary/10"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-cyber-bg/95 backdrop-blur border-b border-cyber-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyber-primary" />
            <span className="font-heading text-lg font-bold text-cyber-primary">STRESSER</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-cyber-muted"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-cyber-text"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-cyber-surface border-b border-cyber-border"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-cyber-muted hover:text-cyber-primary"
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {user?.role === "admin" && adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-cyber-muted hover:text-cyber-secondary"
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 text-cyber-muted hover:text-cyber-secondary w-full"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </motion.nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
