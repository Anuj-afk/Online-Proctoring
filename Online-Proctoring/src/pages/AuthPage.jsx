import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthPage() {
  const { isAuthenticated, isInitializing, login, signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(location.state?.mode === 'signup' ? 'signup' : 'login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = location.state?.from || '/create-exam';

  if (isInitializing) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center text-slate-600">
        Checking your session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  const updateField = (field) => (event) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: event.target.value,
    }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        await signup(formData);
      } else {
        await login(formData);
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(155deg,rgba(14,23,38,0.95),rgba(28,45,66,0.9))] p-8 text-[#fff8ea] shadow-[0_26px_80px_rgba(7,12,24,0.26)] sm:p-10">
          <Link className="text-sm font-medium text-amber-200 transition hover:text-white" to="/">
            Back to home
          </Link>

          <p className="mt-10 inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-200">
            Exam Workspace Access
          </p>
          <h1 className="mt-6 max-w-[11ch] text-5xl leading-[0.95] tracking-[-0.06em] sm:text-6xl">
            Keep every exam tied to the account that created it.
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/76 sm:text-lg">
            Sign in to manage only your own tests. New accounts can start creating exams
            immediately after signup.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <strong className="block text-2xl text-white">Private</strong>
              <span className="mt-2 block text-sm text-white/65">
                Exam lists are filtered to the signed-in user.
              </span>
            </article>
            <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <strong className="block text-2xl text-white">Fast</strong>
              <span className="mt-2 block text-sm text-white/65">
                Login and signup both happen from the same screen.
              </span>
            </article>
            <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <strong className="block text-2xl text-white">Persistent</strong>
              <span className="mt-2 block text-sm text-white/65">
                Your session stays available after refresh.
              </span>
            </article>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <div className="flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Signup
            </button>
          </div>

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {mode === 'signup' ? 'Start your exam builder account.' : 'Open your exam dashboard.'}
            </h2>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === 'signup' ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={updateField('name')}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="Enter your name"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
              <input
                type="email"
                value={formData.email}
                onChange={updateField('email')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                placeholder="Enter your email"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={formData.password}
                onChange={updateField('password')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
              />
            </label>

            {errorMessage ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-900 px-6 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? mode === 'signup'
                  ? 'Creating account...'
                  : 'Signing in...'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            {mode === 'signup' ? 'Already have an account?' : 'Need a new account?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
              className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4"
            >
              {mode === 'signup' ? 'Switch to login' : 'Switch to signup'}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}

export default AuthPage;
