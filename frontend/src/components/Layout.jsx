import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "../App";
import { motion } from "framer-motion";
import { 
  Zap, Target, History, CreditCard, User, Shield, LogOut, Menu, X, Moon, Sun, Server, Users
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
  { path: "/admin/users", label: "Users", icon: Users },
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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 border-r border-slate-800 bg-slate-900">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-100">Stresser<span className="text-blue-500">.io</span></span>
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
                    ? "bg-blue-600/10 text-blue-500"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
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
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Admin</span>
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
                        ? "bg-amber-500/10 text-amber-500"
                        : "text-slate-400 hover:text-amber-500 hover:bg-slate-800"
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
        <div className="p-4 border-t border-slate-800">
          <div className="mb-4 px-2">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="font-medium text-slate-100 truncate">{user?.username}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600/10 text-blue-500 mt-1">
              {user?.plan}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-blue-500 hover:bg-slate-800 rounded-lg"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              onClick={handleLogout}
              data-testid="logout-btn"
              variant="ghost"
              className="flex-1 justify-start gap-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-100">Stresser.io</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 rounded-lg">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-100 rounded-lg">
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-slate-900 border-b border-slate-800"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-blue-500 rounded-lg"
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
                  className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-amber-500 rounded-lg"
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-500 w-full rounded-lg"
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
