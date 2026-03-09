"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Loader2, Mail, Lock, Sparkles, EyeOff, Eye } from 'lucide-react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { useAuthApi } from '@/lib/hooks/useAuth';

const signinSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters")
});

type SigninFormValues = z.infer<typeof signinSchema>;

export default function Signin() {
    const { useSignin } = useAuthApi();
    const { mutate: signin, isPending: isSigningIn } = useSignin();

    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SigninFormValues>({
        resolver: zodResolver(signinSchema),
    });

    const onSubmit = (data: SigninFormValues) => {
        signin(data);
    };

    return (
        <div className="relative min-h-screen p-5 flex items-center justify-center bg-white dark:bg-[#0f172a] transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/5 to-orange-600/5 dark:from-purple-600/10 dark:to-orange-600/10 pointer-events-none" />
            <div className="relative w-full max-w-md p-5 sm:px-10 sm:py-7.5 space-y-10 bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex flex-col gap-1.25 items-center text-center">
                    <Link href="/" title='Bero Talker Messanger' className="h-15 w-15 mb-1.25 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-orange-600 shadow-lg shadow-purple-600/25 cursor-pointer">
                        <span className="text-2xl font-bold italic text-white">BT</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Welcome Back</h1>
                    <p className="text-slate-600 dark:text-slate-400">Good to see you again, Sign in to pick up where you left off!</p>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Email Address */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <Mail size={15} className="text-purple-600" /> Email Address
                        </label>
                        <input
                            {...register("email")}
                            type="email"
                            placeholder="bero@example.com"
                            className={cn(
                                "w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2",
                                errors.email
                                    ? "border-red-500 focus:ring-transparent"
                                    : "border-slate-200 dark:border-slate-800 focus:ring-purple-600/25 focus:border-purple-600"
                            )}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message as string}</p>}
                    </div>
                    {/* Password */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <Lock size={15} className="text-orange-600" /> Password
                        </label>
                        <div className="relative group">
                            <input
                                {...register("password")}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className={cn(
                                    "w-full px-3.5 py-2.5 pr-10 rounded-xl border outline-none transition-all bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2",
                                    errors.password
                                        ? "border-red-500 focus:ring-transparent"
                                        : "border-slate-200 dark:border-slate-800 focus:ring-orange-600/25 focus:border-orange-600"
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-orange-600 transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message as string}</p>}
                    </div>
                    {/* Sign Up */}
                    <div className="flex justify-between">
                        <span className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <Sparkles size={15} className="text-purple-600" /> New Here?
                        </span>
                        <Link href="/signup" className="text-purple-600 dark:text-purple-400 text-sm font-bold hover:text-orange-600 dark:hover:text-orange-400 transition-all underline underline-offset-2">
                            Create Account
                        </Link>
                    </div>
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSigningIn}
                        className={cn(
                            "w-full py-2.5 flex items-center justify-center gap-2.5 text-white font-bold text-lg tracking-wider rounded-xl shadow-xl shadow-purple-600/25 transform transition-all active:scale-95 group",
                            isSigningIn
                                ? "bg-purple-600 dark:bg-purple-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-600 to-orange-600 hover:shadow-purple-600/50 cursor-pointer"
                        )}
                    >
                        {
                            isSigningIn ? (
                                <>
                                    <Loader2 className="animate-spin" size={25} />
                                    Signing In...
                                </>
                            ) : (
                                "Sign In"
                            )
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}