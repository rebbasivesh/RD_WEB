import React, { useState } from 'react';
import {
  Search,
  Bell,
  User as UserIcon,
  Settings,
  Moon,
  LogOut,
  Key,
  Shield,
  X,
  Lock
} from 'lucide-react';
import type { Survey, UserItem } from '../types';
import { changePasswordApi } from '../services/api';

interface NavbarProps {
  deviceConnected: boolean;
  selectedSurvey: Survey | null;
  activeTab: string;
  currentUser?: UserItem | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ selectedSurvey, activeTab, currentUser, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      await changePasswordApi(oldPassword, newPassword);
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPwdMsg({ type: '', text: '' });
      }, 1500);
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Failed to change password' });
    }
  };

  const userName = currentUser?.name || 'Anoop Kumar';
  const userRole = currentUser?.role ? currentUser.role.replace('_', ' ') : 'SUPER ADMIN';
  const loginId = currentUser?.loginId || 'anoop.admin';

  return (
    <header className="w-full h-[60px] bg-[#06080E] border-b border-white/5 flex items-center justify-between px-6 z-40 select-none font-sans text-slate-100 shrink-0 shadow-lg relative">
      
      {/* Left: Logo, Project Name, Breadcrumb */}
      <div className="flex items-center gap-4">
        <img src="/dats_logo.png" alt="DATS Logo" className="h-[26px] w-auto select-none" />
        <div className="h-4 w-[1px] bg-white/10" />
        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] font-medium font-sans">
          <span className="text-[#3B82F6] font-bold font-mono tracking-[1.5px] text-[10.5px]">NIRIKSHAN</span>
          <span>/</span>
          <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold font-mono">
            {activeTab === 'live_survey' ? 'Live Stream' : activeTab === 'users' ? 'User Directory' : 'GIS'}
          </span>
        </div>
      </div>

      {/* Right: Global Search, Notifications, Theme Toggle, User Profile */}
      <div className="flex items-center gap-3.5 shrink-0 relative">
        
        {/* Global Search */}
        <div className="relative w-[180px] hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Global Search..."
            className="w-full bg-[#202B3D]/50 border border-white/5 rounded-xl pl-9 pr-3.5 py-1 text-[11px] text-white placeholder-slate-500 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all font-sans"
          />
        </div>

        {/* Notifications */}
        <button 
          className="relative p-2 hover:bg-[#182132] rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
        </button>

        {/* User Profile Trigger Button */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2.5 border-l border-white/10 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#182132] border border-white/10 flex items-center justify-center shadow-inner text-[#3B82F6] font-bold text-xs">
              {userName.charAt(0)}
            </div>
            <div className="flex flex-col text-left font-sans leading-none">
              <span className="text-[11px] font-semibold text-white truncate max-w-[120px]">{userName}</span>
              <span className="text-[8px] text-[#3B82F6] font-bold uppercase mt-0.5 tracking-wider font-mono">
                {userRole}
              </span>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-[#182132] border border-white/10 rounded-2xl shadow-2xl z-50 py-2 font-sans"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2 border-b border-white/5 space-y-0.5">
                <span className="text-[11px] font-bold text-white block">{userName}</span>
                <span className="text-[9px] text-[#3B82F6] font-mono block">ID: {loginId}</span>
              </div>

              <button
                onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }}
                className="w-full px-4 py-2 text-xs text-slate-200 hover:bg-[#202B3D] flex items-center gap-2.5"
              >
                <UserIcon className="w-4 h-4 text-[#3B82F6]" /> My Profile
              </button>

              <button
                onClick={() => { setShowChangePasswordModal(true); setShowUserMenu(false); }}
                className="w-full px-4 py-2 text-xs text-slate-200 hover:bg-[#202B3D] flex items-center gap-2.5"
              >
                <Key className="w-4 h-4 text-[#EAB308]" /> Change Password
              </button>

              <div className="my-1 border-t border-white/5" />

              <button
                onClick={() => { setShowUserMenu(false); if (onLogout) onLogout(); }}
                className="w-full px-4 py-2 text-xs text-[#EF4444] hover:bg-[#202B3D] flex items-center gap-2.5 font-bold"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MY PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-6 select-none font-sans">
          <div className="bg-[#121826] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#3B82F6]" />
                MY PROFILE DETAILS
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#182132] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">FULL NAME</span>
                <span className="text-white font-bold font-sans">{userName}</span>
              </div>
              <div className="bg-[#182132] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">LOGIN ID</span>
                <span className="text-[#3B82F6] font-bold">{loginId}</span>
              </div>
              <div className="bg-[#182132] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">ROLE</span>
                <span className="text-purple-400 font-bold uppercase">{userRole}</span>
              </div>
              <div className="bg-[#182132] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">ORGANIZATION</span>
                <span className="text-slate-200 font-sans">{currentUser?.org || 'NHAI HQ'}</span>
              </div>
              <div className="bg-[#182132] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">EMAIL</span>
                <span className="text-slate-300 font-sans">{currentUser?.email || 'a.kumar@nhai.gov.in'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-bold uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-6 select-none font-sans">
          <form
            onSubmit={handleChangePasswordSubmit}
            className="bg-[#121826] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#EAB308]" />
                CHANGE YOUR PASSWORD
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwdMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-mono border ${
                pwdMsg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {pwdMsg.text}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase"
              >
                UPDATE PASSWORD
              </button>
            </div>
          </form>
        </div>
      )}

    </header>
  );
};
