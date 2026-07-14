import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, Check, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";

const schema = yup.object({
  username: yup
    .string()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const slides = [
  {
    title: "Deploy your spaces instantly",
    description: "Launch servers and serverless workspaces at the edge in seconds with simple integrations.",
    tag: "Cloud Workspace",
  },
  {
    title: "Integrate with modern developer tools",
    description: "Connect your workspace directly with GitHub, Figma, Linear, Slack, and other tech pipelines.",
    tag: "Integrations",
  },
  {
    title: "Automate manual task queues",
    description: "Build visual or code-based task recipes to optimize your development and deployment workflows.",
    tag: "Automation",
  },
];

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [apiError, setApiError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeState, setFadeState] = useState("fade-in");

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setFadeState("fade-out");
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setFadeState("fade-in");
      }, 500);
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

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError("");
    try {
      await axios.post("/api/auth/signup", data);
      setIsLoading(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        navigate("/login");
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      const errMsg = error.response?.data?.message || "Registration failed. Please check your inputs or connection.";
      setApiError(errMsg);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans bg-slate-950">
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
          <h4 className="font-semibold text-slate-100 text-sm">Account Created</h4>
          <p className="text-xs text-slate-400">Your account is ready! Redirecting to login...</p>
        </div>
      </div>

      {/* Left panel (Visual/Marketing side) */}
      <div className="hidden lg:flex lg:w-1/2 p-16 flex-col justify-between relative z-10 border-r border-white/5 bg-gradient-to-b from-indigo-950/10 via-slate-900/10 to-slate-950/30 backdrop-blur-2xl">
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
        </div>
      </div>

      {/* Right panel (Interactive Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 relative z-10">
        <div className="w-full max-w-[420px] flex flex-col">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Create an account
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Start building your cloud workspaces today.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {apiError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>{apiError}</span>
              </div>
            )}
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-400">Username</label>
              <div className={`flex items-center rounded-xl px-4 bg-white/[0.02] border ${errors.username ? "border-red-500/50" : "border-white/10"}`}>
                <User className="text-slate-500 mr-3" size={18} />
                <input {...register("username")} id="username" type="text" placeholder="johndoe" className="w-full bg-transparent py-3.5 text-white text-sm focus:outline-none" />
              </div>
              {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className={`flex items-center rounded-xl px-4 bg-white/[0.02] border ${errors.email ? "border-red-500/50" : "border-white/10"}`}>
                <Mail className="text-slate-500 mr-3" size={18} />
                <input {...register("email")} id="email" type="email" placeholder="name@company.com" className="w-full bg-transparent py-3.5 text-white text-sm focus:outline-none" />
              </div>
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              <div className={`flex items-center rounded-xl px-4 bg-white/[0.02] border ${errors.password ? "border-red-500/50" : "border-white/10"}`}>
                <Lock className="text-slate-500 mr-3" size={18} />
                <input {...register("password")} id="password" type={showPassword ? "text" : "password"} placeholder="8+ characters required" className="w-full bg-transparent py-3.5 text-white text-sm focus:outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-3 text-slate-500"><Eye size={18} /></button>
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 py-3.5 font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "Sign Up"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-400">Already have an account?</span>
            <Link to="/login" className="ml-2 font-bold text-white hover:text-indigo-400">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
