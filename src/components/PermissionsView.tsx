import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Search,
  Check,
  X,
  Lock,
  RefreshCw,
  Sliders,
  Building,
  Key
} from 'lucide-react';
import type { UserItem, UserRole } from '../types';
import { fetchPermissionsApi, fetchRolesApi, fetchUsersApi, updateUserPermissionsApi } from '../services/api';

interface PermissionsViewProps {
  currentUser?: UserItem | null;
}

export const PermissionsView: React.FC<PermissionsViewProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<Record<string, string[]>>({});
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [selectedUserPerms, setSelectedUserPerms] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [permRes, roleRes, userRes] = await Promise.all([
        fetchPermissionsApi(),
        fetchRolesApi(),
        fetchUsersApi().catch(() => [])
      ]);
      setCategories(permRes.categories || []);
      setRoleTemplates(roleRes.templates || {});
      setUsers(userRes || []);
      if (userRes && userRes.length > 0) {
        setSelectedUser(userRes[0]);
        setSelectedUserPerms(userRes[0].permissions || []);
      }
    } catch (e) {
      console.error("Error loading permissions data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectUser = (u: UserItem) => {
    setSelectedUser(u);
    setSelectedUserPerms(u.permissions || []);
    setSaveSuccessMsg('');
  };

  const handleTogglePerm = (code: string) => {
    if (selectedUserPerms.includes(code)) {
      setSelectedUserPerms(selectedUserPerms.filter(c => c !== code));
    } else {
      setSelectedUserPerms([...selectedUserPerms, code]);
    }
  };

  const handleApplyRoleTemplate = (role: UserRole) => {
    const template = roleTemplates[role] || [];
    setSelectedUserPerms(template);
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;
    try {
      await updateUserPermissionsApi(selectedUser.id, selectedUserPerms);
      setSaveSuccessMsg(`Permissions saved successfully for ${selectedUser.name}!`);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, permissions: selectedUserPerms } : u));
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update user permissions');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.loginId.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full w-full bg-[#0C111A] text-slate-100 p-8 font-sans select-none">
        <div className="max-w-md w-full bg-[#121826] border border-white/10 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">ACCESS DENIED</h2>
          <p className="text-xs text-slate-400">
            Permission Configuration controls are restricted exclusively to <span className="text-purple-400 font-mono font-bold">SUPER_ADMIN</span> accounts.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-500 bg-[#182132]/60 p-3 rounded-xl border border-white/5">
            Your current role: <span className="text-white font-bold">{currentUser?.role || 'VIEWER'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#0C111A] text-slate-100 overflow-y-auto p-6 select-none font-sans relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#3B82F6]" />
            <span>PERMISSION MANAGEMENT</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-purple-500/15 text-purple-400 border border-purple-500/25 uppercase font-semibold">
              Super Admin Only
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure system permission matrices, default role templates, and custom access controls.</p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-[#182132] border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload Permissions
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3B82F6] mb-3" />
          <span>Loading system permission catalog...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
          {/* Left Panel: User Selector */}
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-4 flex flex-col h-full shadow-2xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#3B82F6]" /> Select User Account
            </h2>

            {/* Search Box */}
            <div className="flex items-center w-full h-9 bg-[#182132]/80 border border-white/10 rounded-xl px-3 gap-2 mb-3">
              <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Search user..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-200 w-full placeholder-slate-500"
              />
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredUsers.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#3B82F6]/15 border-[#3B82F6]/40 text-white shadow-md'
                        : 'bg-[#182132]/40 border-white/5 text-slate-300 hover:bg-[#182132]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{u.name}</span>
                        <span className="text-[9px] font-mono text-[#3B82F6]">{u.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.loginId} • {u.org}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase border ${
                      u.role === 'SUPER_ADMIN' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Permission Assignment Grid */}
          <div className="lg:col-span-2 bg-[#121826] border border-white/5 rounded-2xl p-6 flex flex-col h-full shadow-2xl overflow-y-auto">
            {selectedUser ? (
              <div className="space-y-6">
                {/* User Header Summary */}
                <div className="bg-[#182132] p-4 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-[#3B82F6] font-bold uppercase">{selectedUser.id}</span>
                    <h2 className="text-lg font-bold text-white">{selectedUser.name} ({selectedUser.loginId})</h2>
                    <p className="text-xs text-slate-400">{selectedUser.org} • {selectedUser.department}</p>
                  </div>

                  {/* Apply Template Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-slate-400 mr-1">Load Template:</span>
                    <button
                      onClick={() => handleApplyRoleTemplate('SUPER_ADMIN')}
                      className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 font-bold"
                    >
                      Super Admin
                    </button>
                    <button
                      onClick={() => handleApplyRoleTemplate('SUPERVISOR')}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-bold"
                    >
                      Supervisor
                    </button>
                    <button
                      onClick={() => handleApplyRoleTemplate('OPERATOR')}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold"
                    >
                      Operator
                    </button>
                    <button
                      onClick={() => handleApplyRoleTemplate('VIEWER')}
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 font-bold"
                    >
                      Viewer
                    </button>
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400 font-mono flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {/* Categorized Permissions Grid */}
                <div className="space-y-6">
                  {categories.map((cat) => (
                    <div key={cat.category} className="bg-[#182132]/40 border border-white/5 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3B82F6]">
                          {cat.label || cat.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">
                          {cat.permissions.filter((p: any) => selectedUserPerms.includes(p.code)).length} / {cat.permissions.length} enabled
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cat.permissions.map((perm: any) => {
                          const isEnabled = selectedUserPerms.includes(perm.code);
                          return (
                            <label
                              key={perm.code}
                              className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                isEnabled
                                  ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-white'
                                  : 'bg-[#182132]/60 border-white/5 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => handleTogglePerm(perm.code)}
                                className="accent-[#3B82F6] rounded mt-0.5"
                              />
                              <div>
                                <span className="text-xs font-semibold block">{perm.label}</span>
                                <span className="text-[10px] text-slate-400 font-mono block leading-tight mt-0.5">{perm.description}</span>
                                <span className="text-[9px] text-[#3B82F6] font-mono font-semibold block mt-1">{perm.code}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Save Action */}
                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button
                    onClick={handleSaveUserPermissions}
                    className="px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-sans font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                  >
                    SAVE PERMISSION CONFIGURATION
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 font-sans">
                Select a user account from the left list to configure custom permissions.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
