import React, { useState, useEffect, useMemo } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  Search,
  MoreVertical,
  Edit2,
  Lock,
  Trash2,
  X,
  Check,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  ShieldAlert,
  Building,
  Mail,
  Phone,
  Clock,
  Activity,
  UserCheck,
  UserX,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import type { UserItem, UserRole, UserStatus, AuditLogItem } from '../types';
import {
  fetchUsersApi,
  createUserApi,
  updateUserApi,
  updateUserStatusApi,
  resetUserPasswordApi,
  deleteUserApi,
  fetchAuditLogsApi,
  updateUserPermissionsApi
} from '../services/api';
import { SelfProfileModal } from './SelfProfileModal';

interface UsersViewProps {
  currentUser?: UserItem | null;
  onRefreshCurrentUser?: () => void;
}

// System Categorized Permissions for Drawer Checkboxes
const PERMISSION_CATEGORIES = [
  {
    name: 'DASHBOARD',
    perms: [{ code: 'dashboard.view', label: 'View Dashboard' }]
  },
  {
    name: 'SURVEYS',
    perms: [
      { code: 'surveys.view', label: 'View Surveys' },
      { code: 'surveys.create', label: 'Create Survey' },
      { code: 'surveys.edit', label: 'Edit Survey' },
      { code: 'surveys.delete', label: 'Delete Survey' },
      { code: 'surveys.process', label: 'Process Survey' },
      { code: 'surveys.status', label: 'View Processing Status' },
      { code: 'surveys.download', label: 'Download Survey Data' }
    ]
  },
  {
    name: 'ROAD ANALYSIS',
    perms: [
      { code: 'analysis.view', label: 'View Road Analysis' },
      { code: 'analysis.detections', label: 'View AI Detection' },
      { code: 'analysis.condition', label: 'View Road Condition' },
      { code: 'analysis.iri', label: 'View IRI' },
      { code: 'analysis.distresses', label: 'View Distresses' }
    ]
  },
  {
    name: 'GIS',
    perms: [
      { code: 'gis.view', label: 'View GIS' },
      { code: 'gis.segments', label: 'View Road Segments' },
      { code: 'gis.points', label: 'View Detection Points' },
      { code: 'gis.edit', label: 'Edit GIS Data' },
      { code: 'gis.export', label: 'Export GIS Data' }
    ]
  },
  {
    name: 'REPORTS',
    perms: [
      { code: 'reports.view', label: 'View Reports' },
      { code: 'reports.generate', label: 'Generate Reports' },
      { code: 'reports.download', label: 'Download Reports' }
    ]
  },
  {
    name: 'USER MANAGEMENT',
    perms: [
      { code: 'users.view', label: 'View Users' },
      { code: 'users.create', label: 'Create Users' },
      { code: 'users.edit', label: 'Edit Users' },
      { code: 'users.status', label: 'Activate/Deactivate Users' },
      { code: 'users.reset_password', label: 'Reset Passwords' }
    ]
  },
  {
    name: 'PERMISSION MANAGEMENT',
    perms: [
      { code: 'permissions.view', label: 'View Permissions' },
      { code: 'permissions.edit', label: 'Edit Permissions' }
    ]
  },
  {
    name: 'SYSTEM',
    perms: [
      { code: 'system.settings', label: 'System Settings' },
      { code: 'system.audit_logs', label: 'Audit Logs' }
    ]
  }
];

const ALL_PERM_CODES = PERMISSION_CATEGORIES.flatMap(c => c.perms.map(p => p.code));

const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ALL_PERM_CODES,
  ADMIN: ALL_PERM_CODES,
  SUPERVISOR: [
    "dashboard.view", "surveys.view", "surveys.create", "surveys.edit", "surveys.process", "surveys.status", "surveys.download",
    "analysis.view", "analysis.detections", "analysis.condition", "analysis.iri", "analysis.distresses",
    "gis.view", "gis.segments", "gis.points", "gis.export",
    "reports.view", "reports.generate", "reports.download", "users.view"
  ],
  OPERATOR: [
    "dashboard.view", "surveys.view", "surveys.create", "surveys.process", "surveys.status",
    "analysis.view", "analysis.detections", "analysis.condition",
    "gis.view", "gis.segments", "gis.points", "reports.view"
  ],
  VIEWER: ["dashboard.view", "surveys.view", "analysis.view", "gis.view", "reports.view"]
};

export const UsersView: React.FC<UsersViewProps> = ({ currentUser, onRefreshCurrentUser }) => {
  const userRole = currentUser?.role || 'VIEWER';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isSupervisor = userRole === 'SUPERVISOR';
  const isOperatorOrViewer = userRole === 'OPERATOR' || userRole === 'VIEWER';

  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [orgFilter, setOrgFilter] = useState<string>('ALL');

  // Active Dropdown Action Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modals & Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showSelfEditModal, setShowSelfEditModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);

  // Confirmations
  const [confirmDeactivateUser, setConfirmDeactivateUser] = useState<UserItem | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserItem | null>(null);
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<{ user: UserItem; newRole: UserRole } | null>(null);

  // Form States for Create User
  const [formFullName, setFormFullName] = useState('');
  const [formLoginId, setFormLoginId] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formOrg, setFormOrg] = useState('NHAI HQ');
  const [formDepartment, setFormDepartment] = useState('Pavement Engineering');
  const [formRole, setFormRole] = useState<UserRole>('OPERATOR');
  const [formStatus, setFormStatus] = useState<UserStatus>('active');
  const [formPassword, setFormPassword] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>(ROLE_DEFAULT_PERMISSIONS.OPERATOR);

  // Form States for Edit User Drawer (Super Admin)
  const [editFullName, setEditFullName] = useState('');
  const [editLoginId, setEditLoginId] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editOrg, setEditOrg] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editScope, setEditScope] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('OPERATOR');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // Reset Password Modal State
  const [newPassword, setNewPassword] = useState('');
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isSuperAdmin || isSupervisor) {
        const usersData = await fetchUsersApi();
        setUsers(usersData);
      }
    } catch (err: any) {
      console.warn("Could not load users directory from API:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    if (isSuperAdmin || isSupervisor) {
      try {
        const logs = await fetchAuditLogsApi();
        setAuditLogs(logs);
      } catch (e) {
        setAuditLogs([]);
      }
    }
  };

  useEffect(() => {
    loadData();
    loadAuditLogs();
  }, [currentUser]);

  // Open Edit User Drawer (Super Admin)
  const handleOpenEditUser = (u: UserItem) => {
    setEditingUser(u);
    setEditFullName(u.name);
    setEditLoginId(u.loginId);
    setEditEmail(u.email);
    setEditPhone(u.phone || '');
    setEditOrg(u.org);
    setEditDept(u.department || '');
    setEditScope(u.scopeRegion || 'All Regions');
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditPermissions(u.permissions || ROLE_DEFAULT_PERMISSIONS[u.role] || []);
    setActiveMenuId(null);
  };

  // Role Change in Create Form
  const handleRoleChangeInCreateForm = (role: UserRole) => {
    setFormRole(role);
    setFormPermissions(ROLE_DEFAULT_PERMISSIONS[role] || []);
  };

  // Summary counts
  const summaryCounts = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive' || u.status === 'locked').length,
      pending: users.filter(u => u.status === 'pending').length
    };
  }, [users]);

  // Unique Orgs for filter
  const uniqueOrgs = useMemo(() => {
    return Array.from(new Set(users.map(u => u.org).filter(Boolean)));
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || u.name.toLowerCase().includes(q) || u.loginId.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter.toLowerCase();
      const matchOrg = orgFilter === 'ALL' || u.org === orgFilter;
      return matchQuery && matchRole && matchStatus && matchOrg;
    });
  }, [users, searchQuery, roleFilter, statusFilter, orgFilter]);

  // Submit Create User
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName || !formLoginId || !formEmail || !formPassword) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      await createUserApi({
        fullName: formFullName,
        loginId: formLoginId,
        email: formEmail,
        phone: formPhone,
        organization: formOrg,
        department: formDepartment,
        role: formRole,
        status: formStatus,
        password: formPassword,
        permissions: formPermissions
      });
      alert(`User ${formFullName} (${formLoginId}) created successfully!`);
      setShowCreateDrawer(false);
      loadData();
      loadAuditLogs();
      setFormFullName('');
      setFormLoginId('');
      setFormEmail('');
      setFormPhone('');
      setFormPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  // Submit Edit User (Super Admin)
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Check if role is changing to/from Super Admin
    if (editingUser.role !== editRole) {
      setRoleChangeConfirm({ user: editingUser, newRole: editRole });
      return;
    }

    await executeEditUserSave();
  };

  const executeEditUserSave = async () => {
    if (!editingUser) return;
    try {
      await updateUserApi(editingUser.id, {
        fullName: editFullName,
        loginId: editLoginId,
        email: editEmail,
        phone: editPhone,
        organization: editOrg,
        department: editDept,
        scopeRegion: editScope,
        role: editRole,
        status: editStatus,
        permissions: editPermissions
      });
      alert(`User ${editFullName} updated successfully!`);
      setEditingUser(null);
      setRoleChangeConfirm(null);
      loadData();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  // Toggle status (Active / Inactive / Lock / Unlock)
  const handleToggleStatus = async (user: UserItem, targetStatus: UserStatus) => {
    try {
      await updateUserStatusApi(user.id, targetStatus);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: targetStatus } : u));
      setConfirmDeactivateUser(null);
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword) return;
    try {
      await resetUserPasswordApi(resettingUser.id, newPassword, forcePasswordChange);
      alert(`Password reset successfully for user ${resettingUser.name}.`);
      setResettingUser(null);
      setNewPassword('');
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    try {
      await deleteUserApi(confirmDeleteUser.id);
      setUsers(prev => prev.filter(u => u.id !== confirmDeleteUser.id));
      setConfirmDeleteUser(null);
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // ==================== OPERATOR & VIEWER VIEW (MY PROFILE CARD) ====================
  if (isOperatorOrViewer) {
    return (
      <div className="flex-1 flex flex-col h-full w-full bg-[#0C111A] text-slate-100 p-6 font-sans select-none overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-[#3B82F6]" /> MY PROFILE DETAILS
              </h1>
              <p className="text-xs text-slate-400 mt-1">Manage your account information and login credentials.</p>
            </div>
            <button
              onClick={() => setShowSelfEditModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase transition-all shadow-md flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> EDIT MY PROFILE
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-4 border-b border-white/5 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-[#182132] border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] font-bold text-2xl font-mono shadow-inner">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#3B82F6] font-bold uppercase block">{currentUser?.id || 'USR-002'}</span>
                <h2 className="text-xl font-bold text-white">{currentUser?.name || 'User Account'}</h2>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono uppercase mt-1 border ${
                  userRole === 'OPERATOR' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {userRole}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-[#182132]/60 p-3.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold block">LOGIN ID</span>
                <span className="text-white font-bold">{currentUser?.loginId}</span>
              </div>
              <div className="bg-[#182132]/60 p-3.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold block">EMAIL ADDRESS</span>
                <span className="text-slate-200 font-sans">{currentUser?.email}</span>
              </div>
              <div className="bg-[#182132]/60 p-3.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold block">PHONE NUMBER</span>
                <span className="text-slate-300">{currentUser?.phone || 'Not provided'}</span>
              </div>
              <div className="bg-[#182132]/60 p-3.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold block">ORGANIZATION</span>
                <span className="text-slate-200 font-sans">{currentUser?.org || 'NHAI'}</span>
              </div>
            </div>

            {/* Access Summary Matrix for Operator / Viewer */}
            <div className="space-y-3 border-t border-white/5 pt-5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6] block">
                MY PERMISSIONS SUMMARY
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                {(currentUser?.permissions || ROLE_DEFAULT_PERMISSIONS[userRole] || []).map(p => (
                  <div key={p} className="flex items-center gap-2 bg-[#182132]/40 p-2 rounded-lg border border-white/5 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showSelfEditModal && currentUser && (
          <SelfProfileModal
            currentUser={currentUser}
            onClose={() => setShowSelfEditModal(false)}
            onProfileUpdated={() => {
              if (onRefreshCurrentUser) onRefreshCurrentUser();
            }}
          />
        )}
      </div>
    );
  }

  // ==================== SUPER ADMIN & SUPERVISOR VIEW ====================
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#0C111A] text-slate-100 overflow-y-auto p-6 select-none font-sans relative">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>USER MANAGEMENT</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25 uppercase font-semibold">
              {isSuperAdmin ? 'Global Admin' : 'Supervisor Scope'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage users, access controls, account statuses, and audit trails.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation Tabs */}
          <div className="flex bg-[#121826] p-1 rounded-xl border border-white/5 font-mono text-xs">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold ${
                activeTab === 'users' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Users Directory
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold ${
                activeTab === 'audit' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Audit Log
            </button>
          </div>

          {/* Edit Self Profile Button */}
          {currentUser && (
            <button
              onClick={() => setShowSelfEditModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#182132] border border-white/10 text-xs text-slate-200 hover:text-white flex items-center gap-2 font-mono"
            >
              <UserIcon className="w-4 h-4 text-[#3B82F6]" /> Edit My Profile
            </button>
          )}

          {/* Create User Button (SUPER ADMIN Only) */}
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateDrawer(true)}
              className="px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase transition-all shadow-md flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>CREATE USER</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* 2. SUMMARY CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
            <div className="bg-[#121826] border border-white/5 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">TOTAL USERS</span>
                <span className="text-xl font-bold text-white mt-1 block">{summaryCounts.total}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
                <UsersIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#121826] border border-white/5 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">ACTIVE</span>
                <span className="text-xl font-bold text-[#10B981] mt-1 block">{summaryCounts.active}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#121826] border border-white/5 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">INACTIVE / LOCKED</span>
                <span className="text-xl font-bold text-slate-400 mt-1 block">{summaryCounts.inactive}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <UserX className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#121826] border border-white/5 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">PENDING</span>
                <span className="text-xl font-bold text-[#EAB308] mt-1 block">{summaryCounts.pending}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center text-[#EAB308]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 3. SEARCH & FILTER TOOLBAR */}
          <div className="bg-[#121826] border border-white/5 p-3 rounded-xl mb-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center w-full md:w-80 h-[38px] bg-[#182132]/80 border border-white/10 rounded-xl px-3 gap-2 focus-within:border-[#3B82F6] transition-colors">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search name, login ID, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-200 w-full placeholder-slate-500 py-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-[38px] bg-[#182132] border border-white/10 text-xs text-slate-300 rounded-xl px-3 outline-none font-mono"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-[38px] bg-[#182132] border border-white/10 text-xs text-slate-300 rounded-xl px-3 outline-none font-mono"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LOCKED">Locked</option>
                <option value="PENDING">Pending</option>
              </select>

              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="h-[38px] bg-[#182132] border border-white/10 text-xs text-slate-300 rounded-xl px-3 outline-none font-mono"
              >
                <option value="ALL">All Organizations</option>
                {uniqueOrgs.map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. USER DIRECTORY TABLE */}
          <div className="flex-1 bg-[#121826] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[360px]">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-white/10 bg-[#182132]/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                    <th className="px-5 py-4">User ID</th>
                    <th className="px-5 py-4">Full Name</th>
                    <th className="px-5 py-4">Login ID</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Organization</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Last Login</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-mono">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-[#3B82F6]" />
                          <span>Loading user directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-slate-500 font-sans">
                        No users match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isMenuOpen = activeMenuId === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-[#182132]/50 transition-colors group">
                          <td className="px-5 py-4 font-bold text-[#3B82F6]">{u.id}</td>
                          <td className="px-5 py-4 font-sans font-semibold text-white">{u.name}</td>
                          <td className="px-5 py-4 font-semibold text-slate-300">{u.loginId}</td>
                          <td className="px-5 py-4 text-slate-400 font-sans">{u.email}</td>
                          <td className="px-5 py-4 text-slate-300 font-sans">{u.org}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono uppercase border ${
                              u.role === 'SUPER_ADMIN' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                              u.role === 'SUPERVISOR' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                              u.role === 'OPERATOR' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase font-mono border ${
                              u.status === 'active' ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/25' :
                              u.status === 'pending' ? 'bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/25' :
                              u.status === 'locked' ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/25' : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'active' ? 'bg-[#10B981]' : u.status === 'pending' ? 'bg-[#EAB308]' : u.status === 'locked' ? 'bg-[#EF4444]' : 'bg-slate-400'
                              }`} />
                              {u.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-[11px]">{u.lastLogin || 'Never'}</td>
                          
                          {/* Actions Column */}
                          <td className="px-5 py-4 text-center relative">
                            <button
                              onClick={() => setActiveMenuId(isMenuOpen ? null : u.id)}
                              className="p-1.5 rounded-lg hover:bg-[#182132] text-slate-400 hover:text-white transition-colors"
                              title="User Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div
                                className="absolute right-6 mt-1 w-52 bg-[#182132] border border-white/10 rounded-xl shadow-2xl z-50 py-1 font-sans text-left"
                                onMouseLeave={() => setActiveMenuId(null)}
                              >
                                <button
                                  onClick={() => { setViewingUser(u); setActiveMenuId(null); }}
                                  className="w-full px-3.5 py-2 text-xs text-slate-200 hover:bg-[#202B3D] flex items-center gap-2"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#3B82F6]" /> View Profile
                                </button>
                                {isSuperAdmin && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEditUser(u)}
                                      className="w-full px-3.5 py-2 text-xs text-slate-200 hover:bg-[#202B3D] flex items-center gap-2"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" /> Edit User
                                    </button>
                                    <button
                                      onClick={() => { setResettingUser(u); setActiveMenuId(null); }}
                                      className="w-full px-3.5 py-2 text-xs text-slate-200 hover:bg-[#202B3D] flex items-center gap-2"
                                    >
                                      <Lock className="w-3.5 h-3.5 text-[#EAB308]" /> Reset Password
                                    </button>
                                    <div className="my-1 border-t border-white/5" />
                                    {u.status === 'active' ? (
                                      <button
                                        onClick={() => { setConfirmDeactivateUser(u); setActiveMenuId(null); }}
                                        className="w-full px-3.5 py-2 text-xs text-amber-400 hover:bg-[#202B3D] flex items-center gap-2"
                                      >
                                        <UserX className="w-3.5 h-3.5" /> Deactivate Account
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => { handleToggleStatus(u, 'active'); setActiveMenuId(null); }}
                                        className="w-full px-3.5 py-2 text-xs text-[#10B981] hover:bg-[#202B3D] flex items-center gap-2"
                                      >
                                        <UserCheck className="w-3.5 h-3.5" /> Activate Account
                                      </button>
                                    )}
                                    <button
                                      onClick={() => { setConfirmDeleteUser(u); setActiveMenuId(null); }}
                                      className="w-full px-3.5 py-2 text-xs text-[#EF4444] hover:bg-[#202B3D] flex items-center gap-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete User
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* AUDIT LOG TAB */
        <div className="flex-1 bg-[#121826] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">System Security & Audit Activity Log</h2>
              <p className="text-xs text-slate-400">Chronological history of security events, administrative changes, and authentication logs.</p>
            </div>
            <button
              onClick={loadAuditLogs}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#182132] text-xs text-slate-300 hover:text-white flex items-center gap-2 font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#182132]/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor User</th>
                  <th className="px-4 py-3">Action Event</th>
                  <th className="px-4 py-3">Target Account</th>
                  <th className="px-4 py-3">Details / Metadata</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#182132]/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                    <td className="px-4 py-3 font-bold text-[#3B82F6]">{log.actorLoginId}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{log.targetUserId || '-'}</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">{log.details}</td>
                    <td className="px-4 py-3 text-slate-500">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== EDIT USER DRAWER (SUPER ADMIN) ==================== */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-[#121826] border-l border-white/10 h-full flex flex-col shadow-2xl p-6 overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono text-[#3B82F6] font-bold uppercase">{editingUser.id}</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-cyan-400" /> EDIT USER & ROLE PERMISSIONS
                </h2>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-6 flex-1 text-xs">
              {/* 1. ACCOUNT INFORMATION */}
              <div className="space-y-3 bg-[#182132]/50 p-4 rounded-xl border border-white/5 font-mono">
                <span className="text-[10px] font-bold uppercase text-[#3B82F6] block">1. ACCOUNT INFORMATION</span>
                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div><span className="text-slate-500 text-[9px] uppercase block">User ID:</span> {editingUser.id}</div>
                  <div>
                    <label className="text-slate-400 text-[9px] uppercase block mb-1">Login ID (Super Admin Editable):</label>
                    <input
                      type="text"
                      required
                      value={editLoginId}
                      onChange={(e) => setEditLoginId(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-[#3B82F6] font-mono font-bold outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div><span className="text-slate-500 text-[9px] uppercase block">Created Date:</span> {editingUser.createdAt || '-'}</div>
                  <div><span className="text-slate-500 text-[9px] uppercase block">Last Login:</span> {editingUser.lastLogin || 'Never'}</div>
                </div>
              </div>

              {/* 2. PERSONAL INFORMATION */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6] block">2. PERSONAL INFORMATION</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-slate-400 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. ORGANIZATION */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6] block">3. ORGANIZATION SCOPE</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Organization</label>
                    <input
                      type="text"
                      value={editOrg}
                      onChange={(e) => setEditOrg(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Department</label>
                    <input
                      type="text"
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Scope / Region</label>
                    <input
                      type="text"
                      value={editScope}
                      onChange={(e) => setEditScope(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. ROLE & STATUS */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6] block">4. ROLE & STATUS</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">System Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full bg-[#182132] border border-white/10 text-slate-200 rounded-xl p-2.5 outline-none font-mono focus:border-[#3B82F6]"
                    >
                      <option value="SUPER_ADMIN">SUPER ADMIN (Global Authority)</option>
                      <option value="SUPERVISOR">SUPERVISOR (Campaign Supervision)</option>
                      <option value="OPERATOR">OPERATOR (Field Processing)</option>
                      <option value="VIEWER">VIEWER (Read Only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Account Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                      className="w-full bg-[#182132] border border-white/10 text-slate-200 rounded-xl p-2.5 outline-none font-mono focus:border-[#3B82F6]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive / Suspended</option>
                      <option value="locked">Locked</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. PERMISSIONS CHECKBOXES */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6] block">5. CUSTOM PERMISSIONS</span>
                <div className="space-y-3 bg-[#182132]/40 p-4 rounded-xl border border-white/5">
                  {PERMISSION_CATEGORIES.map(cat => (
                    <div key={cat.name} className="space-y-1.5">
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block">{cat.name}</span>
                      <div className="grid grid-cols-2 gap-2">
                        {cat.perms.map(p => {
                          const checked = editPermissions.includes(p.code);
                          return (
                            <label key={p.code} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) setEditPermissions([...editPermissions, p.code]);
                                  else setEditPermissions(editPermissions.filter(c => c !== p.code));
                                }}
                                className="accent-[#3B82F6] rounded"
                              />
                              <span>{p.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold uppercase shadow-md"
                >
                  SAVE USER CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      {roleChangeConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-6 select-none font-sans">
          <div className="bg-[#121826] border border-purple-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-purple-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-md font-bold text-white uppercase">Confirm Role Change</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to change <strong>{roleChangeConfirm.user.name}</strong>'s role to <strong>{roleChangeConfirm.newRole}</strong>?
              {roleChangeConfirm.newRole === 'SUPER_ADMIN' && (
                <span className="block mt-2 text-purple-300 font-mono text-[11px] bg-purple-500/10 p-2 rounded border border-purple-500/20">
                  ⚠️ This action grants complete global administrative access across the entire platform.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setRoleChangeConfirm(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={executeEditUserSave}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase shadow-md"
              >
                CONFIRM ROLE CHANGE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER DRAWER */}
      {showCreateDrawer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-[#121826] border-l border-white/10 h-full flex flex-col shadow-2xl p-6 overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#3B82F6]" /> CREATE NEW USER
                </h2>
                <p className="text-xs text-slate-400">Add credentials, assign system role, and configure permissions.</p>
              </div>
              <button onClick={() => setShowCreateDrawer(false)} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-6 flex-1 text-xs">
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6] block">1. PERSONAL DETAILS</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Naidu"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@nhai.gov.in"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-slate-400 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6] block">2. ACCOUNT CREDENTIALS</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Login ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ramesh.op"
                      value={formLoginId}
                      onChange={(e) => setFormLoginId(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6] block">3. ROLE & ORGANIZATION</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Organization</label>
                    <input
                      type="text"
                      value={formOrg}
                      onChange={(e) => setFormOrg(e.target.value)}
                      className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">System Role *</label>
                    <select
                      value={formRole}
                      onChange={(e) => handleRoleChangeInCreateForm(e.target.value as UserRole)}
                      className="w-full bg-[#182132] border border-white/10 text-slate-200 rounded-xl p-2.5 outline-none font-mono focus:border-[#3B82F6]"
                    >
                      <option value="SUPER_ADMIN">SUPER ADMIN</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="OPERATOR">OPERATOR</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateDrawer(false)} className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#3B82F6] text-white font-bold uppercase shadow-md">SAVE USER ACCOUNT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAILS DRAWER */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#121826] border-l border-white/10 h-full flex flex-col shadow-2xl p-6 overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono text-[#3B82F6] font-bold uppercase">{viewingUser.id}</span>
                <h2 className="text-xl font-bold text-white">{viewingUser.name}</h2>
              </div>
              <button onClick={() => setViewingUser(null)} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6 flex-1 text-xs font-mono">
              <div className="bg-[#182132] p-4 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between"><span className="text-slate-400">ROLE:</span> <span className="text-purple-400 font-bold">{viewingUser.role}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">STATUS:</span> <span className="text-[#10B981] font-bold">{viewingUser.status}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">LOGIN ID:</span> <span className="text-white font-bold">{viewingUser.loginId}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">EMAIL:</span> <span className="text-slate-300 font-sans">{viewingUser.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">ORG:</span> <span className="text-slate-300 font-sans">{viewingUser.org}</span></div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button onClick={() => setViewingUser(null)} className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-bold uppercase">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-6 select-none font-sans">
          <form onSubmit={handleResetPasswordSubmit} className="bg-[#121826] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-md font-bold text-white flex items-center gap-2"><Lock className="w-4 h-4 text-[#EAB308]" /> RESET PASSWORD FOR {resettingUser.name}</h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">New Password *</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#182132] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#3B82F6]" />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button type="button" onClick={() => setResettingUser(null)} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#EAB308] text-slate-950 font-bold text-xs uppercase">RESET PASSWORD</button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM DEACTIVATE MODAL */}
      {confirmDeactivateUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-md font-bold text-white uppercase text-amber-500">Deactivate Account?</h3>
            <p className="text-xs text-slate-300">Deactivate <strong>{confirmDeactivateUser.name}</strong> ({confirmDeactivateUser.loginId})?</p>
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button onClick={() => setConfirmDeactivateUser(null)} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300">Cancel</button>
              <button onClick={() => handleToggleStatus(confirmDeactivateUser, 'inactive')} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-[#121826] border border-red-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-md font-bold text-white uppercase text-[#EF4444]">Delete User Permanently?</h3>
            <p className="text-xs text-slate-300">Delete user <strong>{confirmDeleteUser.name}</strong> ({confirmDeleteUser.loginId})?</p>
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button onClick={() => setConfirmDeleteUser(null)} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300">Cancel</button>
              <button onClick={handleDeleteUser} className="px-4 py-2 rounded-xl bg-[#EF4444] text-white font-bold text-xs uppercase">DELETE USER</button>
            </div>
          </div>
        </div>
      )}

      {/* SELF EDIT PROFILE MODAL */}
      {showSelfEditModal && currentUser && (
        <SelfProfileModal
          currentUser={currentUser}
          onClose={() => setShowSelfEditModal(false)}
          onProfileUpdated={() => {
            if (onRefreshCurrentUser) onRefreshCurrentUser();
          }}
        />
      )}
    </div>
  );
};