import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { loginApi } from '../services/api';
import type { UserItem } from '../types';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: UserItem, permissions: string[], forceChange: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setErrorMsg('Please enter both User ID and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const data = await loginApi(loginId.trim(), password);
      const token = data.access_token;
      
      if (rememberMe) {
        localStorage.setItem('dats_token', token);
      } else {
        sessionStorage.setItem('dats_token', token);
      }
      
      onLoginSuccess(token, data.user, data.permissions || [], data.force_password_change);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#06080E] text-slate-100 flex flex-col justify-between items-center p-6 select-none font-sans relative overflow-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3B82F6]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <div className="w-full max-w-7xl flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/dats_logo.png" alt="DATS Logo" className="h-8 w-auto" />
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[#3B82F6] font-bold font-mono tracking-[2px] text-xs">NIRIKSHAN</span>
            <span className="text-[9px] text-slate-500 font-mono font-semibold uppercase tracking-wider">Edge AI Platform</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-[#121826]/80 px-3 py-1.5 rounded-xl border border-white/5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>ENTERPRISE ENCRYPTED SESSION</span>
        </div>
      </div>

      {/* Centered Login Card */}
      <div className="w-full max-w-[420px] bg-[#121826] border border-white/10 rounded-2xl p-8 shadow-[0_16px_48px_rgba(0,0,0,0.6)] z-10 space-y-6 my-auto">
        {/* Card Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] mb-1">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">DATS NIRIKSHAN</h1>
          <p className="text-xs text-slate-400">Edge AI Road Survey & GIS Platform</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/25 p-3 rounded-xl flex items-start gap-2 text-xs text-[#EF4444] font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User ID Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              User ID / Login ID
            </label>
            <div className="flex items-center w-full h-11 bg-[#182132]/80 border border-white/10 rounded-xl px-3.5 gap-2 focus-within:border-[#3B82F6] transition-colors relative">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                required
                placeholder="e.g. anoop.admin"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-100 w-full placeholder-slate-500 py-0"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Password
            </label>
            <div className="flex items-center w-full h-11 bg-[#182132]/80 border border-white/10 rounded-xl px-3.5 gap-2 focus-within:border-[#3B82F6] transition-colors relative">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-100 w-full placeholder-slate-500 py-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Options */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[#3B82F6] rounded w-3.5 h-3.5"
              />
              <span>Remember me</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Protected Session</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_16px_rgba(59,130,246,0.3)] hover:shadow-[0_0_24px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>LOG IN TO DATS NIRIKSHAN</span>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="text-center font-mono text-[10px] text-slate-500 shrink-0 space-y-1 z-10">
        <div>Secure access to DATS NIRIKSHAN • Edge AI System</div>
        <div>Version 1.0.0 • DATS Engineering</div>
      </div>
    </div>
  );
};
