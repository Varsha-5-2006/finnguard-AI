import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Users,
  Database,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { api } from '../services/api.js';
import { DetectionRuleConfig, SystemSettings, User } from '../types/index.js';
import { Modal } from '../components/common/Modal.js';
import { ConfirmModal } from '../components/common/ConfirmModal.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [rules, setRules] = useState<DetectionRuleConfig[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Add User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('Password123!');
  const [newRole, setNewRole] = useState<string>('analyst');
  const [newTitle, setNewTitle] = useState<string>('Risk Analyst');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, settingsRes] = await Promise.all([
        api.getRules(),
        api.getSettings(),
      ]);
      setRules(rulesRes.rules || []);
      setSettings(settingsRes.settings || null);

      if (isAdmin) {
        const usersRes = await api.getUsers();
        setUsers(usersRes.users || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    if (!isAdmin) return;
    try {
      await api.updateRule(ruleId, { isEnabled: !currentEnabled });
      setRules(prev =>
        prev.map(r => (r.id === ruleId ? { ...r, isEnabled: !currentEnabled } : r))
      );
      toast.success(
        `Detection rule ${!currentEnabled ? 'activated' : 'disabled'} successfully.`,
        'Rule Updated'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update rule');
    }
  };

  const handleUpdateRuleWeight = async (ruleId: string, weight: number) => {
    if (!isAdmin) return;
    try {
      await api.updateRule(ruleId, { weight });
      setRules(prev =>
        prev.map(r => (r.id === ruleId ? { ...r, weight } : r))
      );
      toast.success(`Weight updated to ${weight} points.`, 'Rule Weight Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update rule weight');
    }
  };

  const handleUpdateThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !settings) return;
    try {
      await api.updateSettings(settings);
      toast.success('Risk scoring thresholds updated and synchronized.', 'Thresholds Calibrated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update thresholds');
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoData();
      toast.success('Demo database reset to initial seeds successfully.', 'Database Reset');
      setIsResetConfirmOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset demo database');
      setIsResetting(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newPassword) return;
    try {
      await api.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        title: newTitle,
      });
      setIsAddUserOpen(false);
      setNewName('');
      setNewEmail('');
      const usersRes = await api.getUsers();
      setUsers(usersRes.users || []);
      toast.success(`New account for "${newName}" provisioned successfully.`, 'User Created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to provision user');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUser(userId, { status: nextStatus });
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, status: nextStatus as any } : u))
      );
      toast.success(`User status changed to ${nextStatus}.`, 'Status Updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
        <p className="text-xs font-semibold text-slate-600">Loading engine configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Detection Engine & Rule Calibration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure explainable scoring heuristics, adjust alert score bands, and administer team credentials.
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only: Switch to Admin role in the sidebar to edit rules.</span>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Heuristic Rules Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-600" />
              Active Detection Heuristic Rules ({rules.length})
            </h3>
            <p className="text-xs text-slate-500">
              Each rule operates with transparent scoring contributions. Toggle or calibrate weights below.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                !rule.isEnabled ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/40'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">[{rule.code}]</span>
                  <span className="capitalize px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                    {rule.category}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">{rule.description}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold text-[11px]">Weight:</span>
                  <select
                    disabled={!isAdmin}
                    value={rule.weight}
                    onChange={e => handleUpdateRuleWeight(rule.id, parseInt(e.target.value, 10))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 disabled:opacity-60 cursor-pointer"
                  >
                    {[10, 15, 20, 25, 30, 35, 40].map(w => (
                      <option key={w} value={w}>
                        +{w} pts
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => handleToggleRule(rule.id, rule.isEnabled)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 ${
                    rule.isEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {rule.isEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Threshold Bands Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-600" />
          Risk Band & Auto-Alert Thresholds
        </h3>

        <form onSubmit={handleUpdateThresholds} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Low Risk Ceiling (Max Score):</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.riskBands.lowMax}
                onChange={e =>
                  setSettings({
                    ...settings,
                    riskBands: { ...settings.riskBands, lowMax: parseInt(e.target.value, 10) || 0 },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standard cleared transactions (0 - 24)</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Medium Risk Ceiling (Max Score):</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.riskBands.mediumMax}
                onChange={e =>
                  setSettings({
                    ...settings,
                    riskBands: { ...settings.riskBands, mediumMax: parseInt(e.target.value, 10) || 0 },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Step-up verification required (25 - 49)</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Auto-Alert Trigger Threshold:</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.autoAlertThreshold}
                onChange={e =>
                  setSettings({
                    ...settings,
                    autoAlertThreshold: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Score where automatic alert is opened (default 50)</span>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save Threshold Parameters
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Admin User Management */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                Institutional Team & Role Administration
              </h3>
              <p className="text-xs text-slate-500">
                Grant role-based authorization (Admin, Fraud Analyst, Compliance Officer).
              </p>
            </div>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono uppercase font-bold text-[11px] px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.title || 'Risk Officer'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold capitalize px-2 py-0.5 rounded-full text-[10px] ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className="text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Database Maintenance & Demo Reset */}
      <div className="bg-rose-50/50 border border-rose-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            Reset Demonstration Database
          </h4>
          <p className="text-xs text-rose-700 mt-0.5">
            Safely reset the database to fresh baseline seed records (re-creates standard demo transactions, alerts, and cases).
          </p>
        </div>
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          disabled={!isAdmin}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          Reset Demo Database
        </button>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <Modal
          isOpen={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
          title="Provision Institutional User Account"
          subtitle="Add an authorized administrator, fraud analyst, or compliance officer."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name:</label>
              <input
                type="text"
                placeholder="e.g. Jordan Cole"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Institutional Email:</label>
              <input
                type="email"
                placeholder="jordan.cole@finguard.ai"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Temporary Password:</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">System Role:</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none capitalize"
                >
                  <option value="analyst">Fraud Analyst</option>
                  <option value="compliance">Compliance Officer</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Job Title:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={!newName || !newEmail}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-40"
              >
                Provision Account
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Resetting Demo Database */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Demonstration Database?"
        message="Are you sure you want to revert the system database to fresh seed data? All synthetic attack simulations, active alerts, and case investigation records will be reset to baseline initial values."
        confirmText="Yes, Reset Database"
        cancelText="Cancel"
        variant="danger"
        isLoading={isResetting}
      />
    </div>
  );
};
