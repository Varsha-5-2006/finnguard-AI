import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  FileCheck2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

export const AuthView: React.FC = () => {
  const { login, register, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login Form State
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regTitle, setRegTitle] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);

  // UI Status
  const [loading, setLoading] = useState<boolean>(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both registered email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    setRegistrationSuccess(null);
    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRegistrationSuccess(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      await register(regName.trim(), regEmail.trim(), regPassword, regTitle.trim() || 'Fraud Analyst');
      // Registration successful: show confirmation and transition to Login page
      setRegistrationSuccess(`Account created successfully for ${regEmail.trim()}. Please sign in below using your credentials.`);
      setEmail(regEmail.trim());
      setPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegTitle('');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Registration failed. The email address may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setDemoLoadingRole(role);
    setError(null);
    setRegistrationSuccess(null);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setError(err.message || 'Demo sign-in failed. Please verify server connectivity.');
    } finally {
      setDemoLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-cyan-500 selection:text-white font-sans">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(14,165,233,0.12),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-xl space-y-6 relative z-10 my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 ring-1 ring-white/20">
            <Shield className="w-8 h-8 fill-white/15 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">FinGuard AI</h1>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono">
                ENTERPRISE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Financial Fraud Detection & Autonomous Risk Intelligence Platform
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'login' ? 'Institutional Sign In' : 'Create New Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'login'
                  ? 'Access your fraud monitoring dashboard with registered credentials.'
                  : 'Register a new institutional analyst profile.'}
              </p>
            </div>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-slate-800 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setRegistrationSuccess(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-slate-800 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {registrationSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{registrationSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="analyst@finguard.ai"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Remember session on this device</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-cyan-400 hover:underline cursor-pointer font-medium"
                >
                  Create an account
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || Boolean(demoLoadingRole)}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Registration Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-300 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Role Assignment Policy:</span> Self-registered accounts are provisioned with the standard <span className="text-white font-semibold">Fraud Analyst</span> role. Administrative and Compliance privileges must be assigned by an authenticated administrator.
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Cole"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="jordan.cole@finguard.ai"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Fraud Risk Analyst"
                  value={regTitle}
                  onChange={e => setRegTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 8 characters"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full pl-3.5 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="p-1 text-slate-400 hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      className={`w-full pl-3.5 pr-9 py-2.5 bg-slate-950 border rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                        regConfirmPassword && regConfirmPassword !== regPassword
                          ? 'border-rose-500/70'
                          : 'border-slate-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="p-1 text-slate-400 hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Guidance */}
              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${regPassword.length >= 8 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className={regPassword.length >= 8 ? 'text-emerald-400' : ''}>At least 8 characters in length</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${regPassword && regPassword === regConfirmPassword ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className={regPassword && regPassword === regConfirmPassword ? 'text-emerald-400' : ''}>Passwords match</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>Create Account</span>
              </button>
            </form>
          )}

          {/* Clearly Separated Project Reviewer / Demo Access Section */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Reviewer Demo Access
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                1-Click Authenticated Personas
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Explore FinGuard AI across the 3 institutional roles with pre-configured synthetic demo data:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Persona 1: Analyst */}
              <button
                type="button"
                disabled={loading || Boolean(demoLoadingRole)}
                onClick={() => handleDemoSignIn('analyst')}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition-all cursor-pointer group disabled:opacity-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs group-hover:text-cyan-400 transition-colors">
                      Fraud Analyst
                    </span>
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium">Marcus Vance</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Real-time monitoring, alert triage, cases, and Gemini AI.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold text-cyan-400 flex items-center justify-between">
                  <span>Sign In As Analyst</span>
                  {demoLoadingRole === 'analyst' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
              </button>

              {/* Persona 2: Compliance */}
              <button
                type="button"
                disabled={loading || Boolean(demoLoadingRole)}
                onClick={() => handleDemoSignIn('compliance')}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl text-left transition-all cursor-pointer group disabled:opacity-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs group-hover:text-indigo-400 transition-colors">
                      Compliance Officer
                    </span>
                    <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium">Elena Rostova</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    AML reports, SAR summaries, and immutable audit logs.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold text-indigo-400 flex items-center justify-between">
                  <span>Sign In As Comp</span>
                  {demoLoadingRole === 'compliance' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
              </button>

              {/* Persona 3: Admin */}
              <button
                type="button"
                disabled={loading || Boolean(demoLoadingRole)}
                onClick={() => handleDemoSignIn('admin')}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl text-left transition-all cursor-pointer group disabled:opacity-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs group-hover:text-purple-400 transition-colors">
                      Administrator
                    </span>
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium">Sarah Jenkins</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Detection heuristic weights, user roles, and thresholds.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold text-purple-400 flex items-center justify-between">
                  <span>Sign In As Admin</span>
                  {demoLoadingRole === 'admin' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Institutional Fraud Detection & Risk Scoring • End-to-End JWT Session Authorization</p>
          <p className="text-[10px] text-slate-600">
            FinGuard AI decision support system • Complies with financial compliance guidelines
          </p>
        </div>
      </div>
    </div>
  );
};
