import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../features/auth/api';
import { Button, Input } from '../components/UI';
import {
  MessageCircle, Loader2, Github,
  Shield, User, ArrowRight, Mail, Lock, Check
} from 'lucide-react';
import { useForm } from 'react-hook-form';

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setApiError(null);
    loginMutation.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          navigate('/');
        },
        onError: (error: any) => {
          // Extract error message from API response
          const message = error?.response?.data?.message || 'Login failed. Please try again.';
          setApiError(message);
        },
      }
    );
  };

  const fillDemo = (role: 'admin' | 'agent') => {
    setValue('email', role === 'admin' ? 'admin@example.com' : 'agent@example.com');
    setValue('password', 'password');
  };

  const isLoading = loginMutation.isPending;

  return (
    <div className="w-full h-screen grid lg:grid-cols-2 overflow-hidden">

      {/* Left Panel - Brand & Visuals */}
      <div className="hidden lg:flex relative flex-col justify-between bg-zinc-950 p-12 text-white overflow-hidden">

        {/* Ambient Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[5000ms]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-[1]"></div>
        <div className="absolute inset-0 z-[2] opacity-20"
          style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 text-white">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Relvo AI</span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-lg mt-auto mb-20">
          <h2 className="text-4xl font-bold mb-6 leading-tight tracking-tight">
            Customer support, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              reimagined for scale.
            </span>
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed mb-8">
            Join 10,000+ companies delivering seamless support experiences with our unified omnichannel inbox and AI-powered automation.
          </p>

          <div className="flex gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-xs font-medium">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full rounded-full" />
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center text-sm">
              <span className="font-semibold text-white">Trusted by teams</span>
              <span className="text-zinc-500 text-xs">Rated 4.9/5 on G2</span>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="relative z-10 text-xs text-zinc-600 font-mono">
          BUILD_ID: STATIC_V1.0.4
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex items-center justify-center bg-background p-8 relative">
        <div className="w-full max-w-[420px] space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">

          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Enter your credentials to access your workspace
            </p>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* API Error Message */}
              {apiError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {apiError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  Work Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    placeholder="name@company.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    className="pl-10 h-11 bg-muted/30 border-input focus:bg-background transition-all"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1"><span className="w-1 h-1 rounded-full bg-destructive"></span> {errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary font-medium transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10 h-11 bg-muted/30 border-input focus:bg-background transition-all"
                    disabled={isLoading}
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Password is required"
                    })}
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1"><span className="w-1 h-1 rounded-full bg-destructive"></span> {errors.password.message}</p>}
              </div>

              <Button className="w-full h-11 font-semibold text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="outline" type="button" disabled={isLoading} className="w-full h-11 font-medium hover:bg-muted/50">
              <Github className="mr-2 h-5 w-5" />
              Github
            </Button>
          </div>

          {/* Persona Selection Cards */}
          <div className="pt-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 text-center">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="flex flex-col items-start p-4 border border-border rounded-xl hover:bg-muted/40 hover:border-primary/50 transition-all text-left group relative overflow-hidden"
              >
                <div className="mb-3 p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-1 relative z-10">
                  <div className="font-semibold text-sm">Administrator</div>
                  <div className="text-xs text-muted-foreground">Full system access</div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('agent')}
                className="flex flex-col items-start p-4 border border-border rounded-xl hover:bg-muted/40 hover:border-primary/50 transition-all text-left group relative overflow-hidden"
              >
                <div className="mb-3 p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div className="space-y-1 relative z-10">
                  <div className="font-semibold text-sm">Support Agent</div>
                  <div className="text-xs text-muted-foreground">Ticket handling</div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              </button>
            </div>
          </div>

          <p className="px-8 text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">Terms</a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
          </p>

        </div>
      </div>
    </div>
  );
}
