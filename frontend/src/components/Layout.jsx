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
  { path: "/admin", label: "Dashboard", icon: Shield },
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
    <div className="min-h-screen bg-panel flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 border-r border-panel bg-panel-surface">
        {/* Logo */}
        <div className="p-5 border-b border-panel">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-panel-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-panel">Stresser<span className="text-panel-primary">.io</span></span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.slice(1)}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${ 
                  isActive
                    ? "bg-panel-primary/10 text-panel-primary"
                    : "text-panel-muted hover:text-panel hover:bg-panel-hover"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          
          {user?.role === "admin" && (
            <>
              <div className="pt-4 pb-2 px-3">
                <span className="text-xs uppercase tracking-wider text-panel-muted font-medium">Admin</span>
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.path.replace(/\//g, '-').slice(1)}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-panel-warning/10 text-panel-warning"
                        : "text-panel-muted hover:text-panel-warning hover:bg-panel-hover"
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
        
        {/* User Info */}
        <div className="p-4 border-t border-panel">
          <div className="mb-4 px-2">
            <p className="text-xs text-panel-muted">Signed in as</p>
            <p className="font-medium text-panel truncate">{user?.username}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-panel-primary/10 text-panel-primary mt-1">
              {user?.plan}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="text-panel-muted hover:text-panel-primary hover:bg-panel-hover rounded-lg"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              onClick={handleLogout}
              data-testid="logout-btn"
              variant="ghost"
              className="flex-1 justify-start gap-2 text-panel-muted hover:text-panel-danger hover:bg-panel-danger/10 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-panel/95 backdrop-blur border-b border-panel">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-panel-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-panel">Stresser.io</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-panel-muted rounded-lg">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-panel rounded-lg">
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-panel-surface border-b border-panel"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-panel-muted hover:text-panel-primary rounded-lg"
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
                  className="flex items-center gap-3 px-3 py-2.5 text-panel-muted hover:text-panel-warning rounded-lg"
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 text-panel-muted hover:text-panel-danger w-full rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </motion.nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 pt-20 lg:pt-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
