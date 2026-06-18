import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Eye, EyeOff, Lock, Mail, KeyRound, ShieldCheck } from 'lucide-react';

export default function Login() {
  const login = useStore(s => s.login);
  const [mode, setMode] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    let success = false;
    if (mode === 'email') {
      success = login(email, password);
    } else {
      success = login(pin);
    }
    setLoading(false);
    if (!success) {
      setError(mode === 'email' ? 'Invalid email or password.' : 'Invalid PIN. Please try again.');
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) setPin(p => p + digit);
  };

  const handlePinDelete = () => setPin(p => p.slice(0, -1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-2xl mb-4 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">KOUSHIK'S</h1>
          <h2 className="text-xl font-semibold text-blue-200">THE SUPPLEMENT STORE</h2>
          <p className="text-blue-300 text-sm mt-1">Seamless Inventory Tracking</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('email'); setError(''); setPin(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'email'
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Mail size={16} /> Email Login
            </button>
            <button
              onClick={() => { setMode('pin'); setError(''); setPassword(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'pin'
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <KeyRound size={16} /> PIN Login
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {mode === 'email' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">Enter Your PIN</label>
                <div className="flex justify-center gap-3 mb-6">
                  {Array.from({ length: Math.max(4, pin.length + (pin.length < 6 ? 1 : 0)) }, (_, i) => (
                    <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                      i < pin.length
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      {i < pin.length ? '●' : ''}
                    </div>
                  )).slice(0, 6)}
                </div>
                {/* PIN Pad */}
                <div className="grid grid-cols-3 gap-3">
                  {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => d === '⌫' ? handlePinDelete() : d !== '' ? handlePinInput(d) : undefined}
                      className={`h-14 rounded-xl font-semibold text-lg transition-all active:scale-95 ${
                        d === ''
                          ? 'invisible'
                          : d === '⌫'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <ShieldCheck size={16} className="text-red-500 shrink-0" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'pin' && pin.length < 4)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-blue-600 dark:text-blue-300">
              <p>👑 Admin: admin@koushikstore.com / admin123 (PIN: 1234)</p>
              <p>🏪 Manager: manager@koushikstore.com / manager123 (PIN: 2345)</p>
              <p>👤 Staff: staff@koushikstore.com / staff123 (PIN: 3456)</p>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          © 2024 KOUSHIK'S THE SUPPLEMENT STORE. All rights reserved.
        </p>
      </div>
    </div>
  );
}
