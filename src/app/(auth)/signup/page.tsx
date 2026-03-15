"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, Sparkles, EyeOff, Eye } from 'lucide-react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { useAuthApi } from '@/lib/hooks/useAuth';

const signupSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .regex(/^[a-z0-9_-]+$/, "Only small letters, numbers, - and _ allowed"),
    email: z.string().email("Please enter a valid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
            "Password is too weak. Must include uppercase, lowercase, and numbers"
        ),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
    const { useSignup } = useAuthApi();
    const { mutate: signup, isPending: isSigningUp } = useSignup();

    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = (data: SignupFormValues) => {
        signup(data);
    };

    return (
        <div className="relative min-h-screen p-5 flex items-center justify-center bg-white-bg dark:bg-dark-bg transition-all duration-250 background-pattern-05">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-800/5 to-rose-600/10 pointer-events-none" />
            <div className="relative w-full max-w-md p-5 sm:px-10 sm:py-7.5 space-y-10 bg-white-bg/70 dark:bg-dark-bg/90 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl border border-slate-200 dark:border-surface">
                {/* Header */}
                <div className="flex flex-col gap-1.25 items-center text-center">
                    <Link href="/" title='Bero Talker Messanger' className="h-15 w-15 mb-1.25 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 shadow-lg shadow-indigo-500/25 cursor-pointer">
                        <span className="text-2xl font-bold italic text-white">BT</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-surface dark:text-white">Get Started</h1>
                    <p className="text-slate-500 dark:text-slate-400">Connect with people who matter and start your conversation today!</p>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* User Name */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <User size={15} className="text-rose-500" /> User Name
                        </label>
                        <input
                            {...register("username")}
                            type="text"
                            placeholder="bero-talker"
                            className={cn(
                                "w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all duration-250 bg-slate-100 dark:bg-surface/50 text-surface dark:text-white focus:ring-2",
                                errors.username
                                    ? "border-red-500 focus:ring-transparent"
                                    : "border-slate-200 dark:border-surface focus:ring-rose-500/25 focus:border-rose-500"
                            )}
                        />
                        {errors.username && <p className="text-red-500 text-xs mt-1 ml-1">{errors.username.message as string}</p>}
                    </div>
                    {/* Email Address */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <Mail size={15} className="text-indigo-500" /> Email Address
                        </label>
                        <input
                            {...register("email")}
                            type="email"
                            placeholder="bero@example.com"
                            className={cn(
                                "w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all duration-250 bg-slate-100 dark:bg-surface/50 text-surface dark:text-white focus:ring-2",
                                errors.email
                                    ? "border-red-500 focus:ring-transparent"
                                    : "border-slate-200 dark:border-surface focus:ring-indigo-500/25 focus:border-indigo-500"
                            )}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message as string}</p>}
                    </div>
                    {/* Password */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <Lock size={15} className="text-rose-500" /> Password
                        </label>
                        <div className="relative group">
                            <input
                                {...register("password")}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className={cn(
                                    "w-full px-3.5 py-2.5 pr-10 rounded-xl border outline-none transition-all duration-250 bg-slate-100 dark:bg-surface/50 text-surface dark:text-white focus:ring-2",
                                    errors.password
                                        ? "border-red-500 focus:ring-transparent"
                                        : "border-slate-200 dark:border-surface focus:ring-rose-500/25 focus:border-rose-500"
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-all duration-250 cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message as string}</p>}
                    </div>
                    {/* Sign In */}
                    <div className="flex justify-between">
                        <span className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <Sparkles size={15} className="text-indigo-500" /> Registered?
                        </span>
                        <Link href="/signin" className="text-indigo-500 dark:text-indigo-400 text-sm font-bold hover:text-rose-500 dark:hover:text-rose-400 transition-all duration-250 underline underline-offset-2">
                            Sign In Here
                        </Link>
                    </div>
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSigningUp}
                        className={cn(
                            "w-full py-2.5 flex items-center justify-center gap-2.5 text-white font-bold text-lg tracking-wider rounded-xl shadow-xl shadow-indigo-500/25 transform transition-all duration-250 active:scale-95",
                            isSigningUp
                                ? "bg-indigo-500 dark:bg-indigo-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-500 to-rose-500 hover:shadow-indigo-500/50 cursor-pointer"
                        )}
                    >
                        {
                            isSigningUp ? (
                                <>
                                    <Loader2 className="animate-spin" size={25} />
                                    Creating...
                                </>
                            ) : (
                                "Create Account"
                            )
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}