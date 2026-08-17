import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, Building, Lock, X, Check, AlertCircle } from 'lucide-react';
import type { UserItem } from '../types';
import { updateSelfProfileApi, changePasswordApi } from '../services/api';

interface SelfProfileModalProps {
  currentUser: UserItem;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export const SelfProfileModal: React.FC<SelfProfileModalProps> = ({
  currentUser,
  onClose,
  onProfileUpdated
}) => {
  const [fullName, setFullName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [department, setDepartment] = useState(currentUser.department || '');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      // 1. Update Profile Metadata
      await updateSelfProfileApi({
        fullName,
        email,
        phone,
        department
      });

      // 2. Update Password if specified
      if (oldPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("New passwords do not match.");
        }
        await changePasswordApi(oldPassword, newPassword);
      }

      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
      onProfileUpdated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-6 select-none font-sans">
      <div className="bg-[#121826] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-[#3B82F6]" /> EDIT MY PROFILE
            </h2>
            <p className="text-xs text-slate-400">Update your personal information and account password.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMsg.text && (
          <div className={`p-3 rounded-xl text-xs font-mono border flex items-center gap-2 ${
            statusMsg.type === 'error' ? 'bg-red-500/10 border-red-500/25 text-red-400' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
          }`}>
            {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read Only Account Badge */}
          <div className="bg-[#182132] p-3 rounded-xl border border-white/5 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">User ID</span>
              <span className="text-[#3B82F6] font-bold">{currentUser.id}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">System Role</span>
              <span className="text-purple-400 font-bold uppercase">{currentUser.role.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Editable Personal Details */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>

          {/* Optional Password Update Section */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#EAB308] block flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> CHANGE PASSWORD (OPTIONAL)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <input
                  type="password"
                  placeholder="Old Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-[#182132] border border-white/10 rounded-xl p-2 text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#182132] border border-white/10 rounded-xl p-2 text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirm New"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#182132] border border-white/10 rounded-xl p-2 text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs uppercase"
            >
              {isLoading ? 'Saving...' : 'UPDATE MY PROFILE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
