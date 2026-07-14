import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Check, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

const schema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const slides = [
  {
    title: "Accelerate your development cycle",
    description: "Launch features faster with our pre-built cloud modules and automated deployment pipelines.",
    tag: "Productivity",
  },
  {
    title: "Enterprise-grade security controls",
    description: "Keep your workspace safe with end-to-end encryption, multi-factor login, and activity logs.",
    tag: "Security",
  },
  {
    title: "Insightful real-time analytics",
    description: "Analyze user behaviors and core performance metrics in real-time with visual dashboards.",
    tag: "Analytics",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeState, setFadeState] = useState("fade-in");

  // Handle slide rotation
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setFadeState("fade-out");
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setFadeState("fade-in");
      }, 500); // match transition duration
    }, 5000);

    return () => clearInterval(slideInterval);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => {
    setIsLoading(true);
    console.log("Submit Login Details:", data);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        navigate("/dashboard");
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans">
      {/* Background glowing morphing orbs */}
      <div className="orb-1" />
      <div className="orb-2" />
      <div className="orb-3" />

      {/* Dotted Grid overlay */}
      <div className="absolute inset-0 dotted-grid pointer-events-none" />

      {/* Success Toast */}
      <div
        className={`fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900/90 border border-emerald-500/30 backdrop-blur-xl px-5 py-4 rounded-2xl shadow-2xl text-emerald-400 transition-all duration-500 transform ${
          showSuccessToast
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-4 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
          <Check size={18} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-100 text-sm">Success</h4>
          <p className="text-xs text-slate-400">Welcome back! Redirecting to dashboard...</p>
        </div>
      </div>

      {/* Left panel (Visual/Marketing side) */}
      <div className="hidden lg:flex lg:w-1/2 p-16 flex-col justify-between relative z-10 border-r border-white/5 bg-gradient-to-b from-indigo-950/10 via-slate-900/10 to-slate-950/30 backdrop-blur-2xl">
        {/* Brand logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/25">
            <svg
              className="text-white w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
            Aura Cloud
          </span>
        </div>

        {/* Feature Carousel */}
        <div className="max-w-md my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 mb-6 animate-pulse">
            {slides[currentSlide].tag}
          </div>
          <div
            className={`transition-all duration-500 transform ${
              fadeState === "fade-in" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {slides[currentSlide].title}
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Carousel indicators */}
          <div className="flex gap-2.5 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setFadeState("fade-out");
                  setTimeout(() => {
                    setCurrentSlide(index);
                    setFadeState("fade-in");
                  }, 300);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === index ? "w-8 bg-indigo-500" : "w-2 bg-slate-800 hover:bg-slate-700"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trusted by modern product teams
          </p>
          <div className="flex gap-6 items-center text-slate-600 opacity-60">
            <span className="font-bold text-sm tracking-widest">STRIPE</span>
            <span className="font-bold text-sm tracking-widest">VERCEL</span>
            <span className="font-bold text-sm tracking-widest">LINEAR</span>
            <span className="font-bold text-sm tracking-widest">FIGMA</span>
          </div>
        </div>
      </div>

      {/* Right panel (Interactive Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 relative z-10">
        <div className="w-full max-w-[420px] flex flex-col">
          {/* Logo showing on mobile only */}
          <div className="flex items-center gap-3 lg:hidden mb-8 self-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 shadow-md shadow-indigo-500/20">
              <svg
                className="text-white w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Aura Cloud
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Sign in to manage your spaces and integrations.
            </p>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 text-sm font-semibold text-slate-200 transition duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 text-sm font-semibold text-slate-200 transition duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.442 22 12.017 22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-[1px] flex-grow bg-white/5" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              or continue with
            </span>
            <div className="h-[1px] flex-grow bg-white/5" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div
                className={`flex items-center rounded-xl transition-all duration-300 px-4 ${
                  errors.email
                    ? "border border-red-500/50 shadow-sm shadow-red-500/5"
                    : "border border-white/10 focus-within:border-indigo-500/50 focus-within:shadow-sm focus-within:shadow-indigo-500/5"
                } bg-white/[0.02] focus-within:bg-white/[0.04]`}
              >
                <div className="text-slate-500 mr-3 flex-shrink-0 flex items-center pointer-events-none">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  {...register("email")}
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-transparent py-3.5 text-white placeholder:text-slate-500 text-sm focus:outline-none"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1 animate-slide-down">
                  <AlertCircle size={14} />
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div
                className={`flex items-center rounded-xl transition-all duration-300 px-4 ${
                  errors.password
                    ? "border border-red-500/50 shadow-sm shadow-red-500/5"
                    : "border border-white/10 focus-within:border-indigo-500/50 focus-within:shadow-sm focus-within:shadow-indigo-500/5"
                } bg-white/[0.02] focus-within:bg-white/[0.04]`}
              >
                <div className="text-slate-500 mr-3 flex-shrink-0 flex items-center pointer-events-none">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full bg-transparent py-3.5 text-white placeholder:text-slate-500 text-sm focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-3 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors cursor-pointer flex-shrink-0"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1 animate-slide-down">
                  <AlertCircle size={14} />
                  <span>{errors.password.message}</span>
                </div>
              )}
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center">
              <label className="relative flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  disabled={isLoading}
                />
                <div className="h-5 w-5 rounded-md border border-white/10 bg-white/[0.02] peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-200 flex items-center justify-center">
                  <Check size={12} className="text-white scale-0 peer-checked:scale-100 transition-transform duration-200" />
                </div>
                <span className="ml-2.5 text-sm text-slate-400 font-medium peer-checked:text-slate-300 transition-colors">
                  Keep me signed in
                </span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 py-3.5 font-semibold text-white transition-all duration-300 hover:opacity-95 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Route redirect */}
          <div className="mt-8 text-center text-sm">
            <span className="text-slate-400">Don't have an account?</span>
            <Link
              to="/signup"
              className="ml-2 font-bold text-white hover:text-indigo-400 transition-colors"
            >
              Create free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}