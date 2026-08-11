import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Mail,
  Building,
  Check,
  X
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Supervisor' | 'Operator' | 'Viewer';
  org: string;
  status: 'Active' | 'Suspended';
}

const mockUsersList: UserItem[] = [
  { id: 'USR-001', name: 'Anoop Kumar', email: 'a.kumar@nhai.gov.in', role: 'Admin', org: 'NHAI HQ', status: 'Active' },
  { id: 'USR-002', name: 'Sivesh Jha', email: 'sivesh.jha@nhai.gov.in', role: 'Operator', org: 'NHAI AP', status: 'Active' },
  { id: 'USR-003', name: 'Prasad Mandava', email: 'p.mandava@pwd.ap.gov.in', role: 'Supervisor', org: 'AP PWD', status: 'Active' },
  { id: 'USR-004', name: 'Ramesh G.', email: 'ramesh.g@dats.ai', role: 'Operator', org: 'DATS Contractor', status: 'Active' },
  { id: 'USR-005', name: 'Director General', email: 'dg@morth.gov.in', role: 'Viewer', org: 'MoRTH', status: 'Active' }
];

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>(mockUsersList);
  const [selectedUser, setSelectedUser] = useState<UserItem>(mockUsersList[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Supervisor' | 'Operator' | 'Viewer'>('Viewer');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    const newUser: UserItem = {
      id: `USR-00${users.length + 1}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      org: 'NHAI AP',
      status: 'Active'
    };
    setUsers(prev => [...prev, newUser]);
    setNewUserName('');
    setNewUserEmail('');
    setShowAddForm(false);
    alert(`Account created successfully for ${newUserName}. Activation email sent.`);
  };

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        alert(`Account ${u.name} has been ${nextStatus.toLowerCase()}!`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 select-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Access Control</span>
          <h2 className="text-white text-md font-bold uppercase tracking-wider">User Identity & Roles</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#2563EB] hover:bg-blue-750 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-glow"
        >
          <UserPlus className="w-4 h-4" /> ADD OPERATOR ACCOUNT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Users table */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="px-6 py-4">Account ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-[11px] text-slate-350 font-mono">
                {users.map((u) => {
                  const active = selectedUser.id === u.id;
                  return (
                    <tr 
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`hover:bg-slate-850/10 cursor-pointer transition-colors ${
                        active ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-6 py-3.5 font-bold text-primary-light">{u.id}</td>
                      <td className="px-6 py-3.5 text-slate-200 font-sans font-semibold">{u.name}</td>
                      <td className="px-6 py-3.5 text-slate-400">{u.email}</td>
                      <td className="px-6 py-3.5 text-slate-400 font-sans">{u.org}</td>
                      <td className="px-6 py-3.5">
                        <span className="bg-slate-950/60 border border-slate-850 text-slate-300 text-[9px] px-2 py-0.5 rounded uppercase font-bold">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(u.id);
                          }}
                          className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded transition-colors border ${
                            u.status === 'Active' 
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/15'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/15'
                          }`}
                        >
                          {u.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right role permissions matrix */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5 h-max">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Access Matrix</span>
            <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-400" />
              Role Permissions
            </h3>
          </div>

          <div className="space-y-4 pt-3 border-t border-slate-800/60 text-xs">
            <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-lg space-y-1 font-mono">
              <span className="text-slate-500 text-[9px] uppercase font-bold">Selected User</span>
              <span className="text-white block font-sans font-bold">{selectedUser.name}</span>
              <span className="text-primary-light block text-[9px] font-bold">ROLE: {selectedUser.role.toUpperCase()}</span>
            </div>

            <div className="space-y-3 font-mono text-[11px] text-slate-350">
              {[
                { perm: 'Read GIS overlay layers', active: true },
                { perm: 'Export PDF summaries', active: true },
                { perm: 'Record live survey runs', active: selectedUser.role !== 'Viewer' },
                { perm: 'Deploy OTA edge configs', active: selectedUser.role === 'Admin' || selectedUser.role === 'Supervisor' },
                { perm: 'Wipe system audit logs', active: selectedUser.role === 'Admin' }
              ].map((p, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{p.perm}</span>
                  {p.active ? (
                    <Check className="w-4 h-4 text-emerald-450" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add User modal form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 select-none">
          <form 
            onSubmit={handleAddUser}
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-in"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-slate-400" />
                Add User Account
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white font-sans text-xs font-bold"
              >
                CANCEL
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Full Name</span>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Ramesh Naidu"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 outline-none focus:border-primary/50"
                />
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Email Address</span>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. ramesh@nhai.gov.in"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 outline-none focus:border-primary/50"
                />
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 block uppercase font-bold text-[9px]">System Role</span>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 outline-none"
                >
                  <option value="Viewer">Viewer (Read Only)</option>
                  <option value="Operator">Operator (Field Collector)</option>
                  <option value="Supervisor">Supervisor (Campaign Manager)</option>
                  <option value="Admin">Admin (Full Control)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#2563EB] hover:bg-blue-750 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-glow"
            >
              <Check className="w-4 h-4" /> CREATE ACCOUNT
            </button>
          </form>
        </div>
      )}
    </div>
  );
};