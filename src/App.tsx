import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { PasswordChangePrompt } from './components/PasswordChangePrompt';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-brand rounded-[20px] flex items-center justify-center shadow-lg shadow-brand/20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-brand font-black uppercase tracking-widest text-xs">Carregando ELTI...</p>
        </motion.div>
      </div>
    );
  }

  // Check if mandatory password change is required
  const mustChangePassword = profile?.criado_secretaria === true && profile?.senha_alterada === false;

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen"
        >
          <Auth onSuccess={() => { }} />
        </motion.div>
      ) : mustChangePassword ? (
        <motion.div
          key="password-change"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen"
        >
          <PasswordChangePrompt />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen"
        >
          <Dashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
