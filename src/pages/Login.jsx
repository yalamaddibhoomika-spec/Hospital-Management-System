import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { Activity, User, Mail, Lock, ChevronRight, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, register } = useHealth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [specialization, setSpecialization] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password, role, specialization);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-500">
      {/* Medical-themed Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Heartbeat Line - Top */}
        <svg className="absolute top-1/4 left-0 w-full h-24 opacity-20" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 L200,50 L250,20 L280,80 L310,50 L1200,50" stroke="white" strokeWidth="3" fill="none" />
        </svg>

        {/* Heartbeat Line - Bottom */}
        <svg className="absolute bottom-1/4 left-0 w-full h-24 opacity-20" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 L400,50 L450,20 L480,80 L510,50 L1200,50" stroke="white" strokeWidth="3" fill="none" />
        </svg>

        {/* Floating Medical Icons */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float">
          <Activity className="w-16 h-16 text-white/60" />
        </div>

        <div className="absolute top-40 right-32 w-28 h-28 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float-delayed">
          <svg className="w-14 h-14 text-white/60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
          </svg>
        </div>

        <div className="absolute bottom-32 left-1/4 w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float">
          <svg className="w-12 h-12 text-white/60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        <div className="absolute bottom-20 right-20 w-36 h-36 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float-delayed">
          <svg className="w-16 h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Subtle gradient overlays */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-4">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden relative">
          {/* Decorative top gradient */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500"></div>

          <div className="p-8 lg:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg shadow-teal-500/20 mb-4">
                <img
                  src="/logo.png"
                  alt="HealthNexus"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">HealthNexus</h1>
              <p className="text-slate-500 text-sm">
                {isRegister ? 'Start your health journey today' : 'Welcome back, please sign in'}
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
                <Activity className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-4 pr-10 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>

                    {role === 'doctor' && (
                      <div className="relative group animate-fadeIn">
                        <input
                          type="text"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
                          placeholder="Specialization"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
                    placeholder="Email Address"
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
                    placeholder="Password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  <>
                    {isRegister ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/50 backdrop-blur-xl text-slate-500">
                    {isRegister ? 'Already have an account?' : 'New to HealthNexus?'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                {isRegister ? 'Sign in to your account' : 'Create a new account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
