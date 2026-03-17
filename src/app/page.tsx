"use client";

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { MessageSquare, Zap, Shield, ChevronRight, Sun, Moon } from 'lucide-react';

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative min-h-screen p-5 flex flex-col items-center justify-center bg-white-bg dark:bg-dark-bg overflow-hidden transition-all duration-250 background-pattern-04">
      {/* Blobs Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Left - rose Glow */}
        <div className="absolute -top-[10%] -left-[10%] w-[40rem] h-[40rem] bg-rose-500/20 rounded-full blur-[120px] animate-blob" />
        {/* Top Right - Soft indigo Glow */}
        <div className="absolute top-[10%] -right-[5%] w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        {/* Bottom Center - Deep Indigo/rose Glow */}
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] bg-indigo-500/5 rounded-full blur-[130px] animate-blob animation-delay-4000" />
      </div>
      {/* Content */}
      <div className="relative max-w-5xl text-center space-y-10">
        {/* Intro */}
        <div className="space-y-5">
          <div
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-5 py-2.5 inline-flex items-center gap-1.25 rounded-full bg-white-bg dark:bg-surface border border-slate-200 dark:border-slate-500 hover:bg-slate-200 dark:hover:bg-slate-500 transition-all duration-250 cursor-pointer">
            {
              theme === "dark" ?
                <Sun className="mx-auto text-rose-500 group-hover:scale-110 transition-transform" size={20} /> :
                <Moon className="mx-auto text-indigo-500 group-hover:scale-110 transition-transform" size={20} />
            }
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Version 1.0 is live</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
            <span className="text-surface dark:text-white">Bero</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-rose-500 to-rose-500">{" "} Talker</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Where every word matters, in <span className="text-surface dark:text-white italic">real-time</span>.
            Experience the future of seamless messaging today.
          </p>
        </div>
        {/* Feature Tags */}
        <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-5">
          <div className="p-3.5 bg-white-bg dark:bg-surface/50 rounded-xl border border-slate-200 dark:border-slate-500 shadow-lg transition-all duration-250 group">
            <Zap className="mx-auto mb-1.25 text-indigo-500 group-hover:scale-110 transition-transform" size={25} />
            <span className="text-sm uppercase text-slate-500 dark:text-slate-200">Real-time Sockets</span>
          </div>
          <div className="p-3.5 bg-white-bg dark:bg-surface/50 rounded-xl border border-slate-200 dark:border-slate-500 shadow-lg transition-all duration-250 group">
            <Shield className="mx-auto mb-1.25 text-rose-500 group-hover:scale-110 transition-transform" size={25} />
            <span className="text-sm uppercase text-slate-500 dark:text-slate-200">Secure & Private</span>
          </div>
          <div className="p-3.5 bg-white-bg dark:bg-surface/50 rounded-xl border border-slate-200 dark:border-slate-500 shadow-lg transition-all duration-250 group">
            <MessageSquare className="mx-auto mb-1.25 text-rose-500 group-hover:scale-110 transition-transform" size={25} />
            <span className="text-sm uppercase text-slate-500 dark:text-slate-200">Modern UX</span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-2.5 md:gap-5">
          <Link
            href="/signin"
            className="w-full md:w-56 px-10 py-3.5 md:text-lg font-medium bg-white-bg dark:bg-surface text-surface dark:text-white border border-slate-200 dark:border-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-500 shadow-lg transition-all duration-250 text-center"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="w-full md:w-56 px-10 py-3.5 flex items-center justify-center gap-2.5 md:text-lg font-bold bg-gradient-to-r from-indigo-500 to-rose-500 text-white rounded-xl shadow-xl shadow-rose-500/25 hover:shadow-indigo-500/25 transform transition-all duration-250 hover:-translate-y-0.5 active:scale-95 text-center"
          >
            Get Started <ChevronRight size={25} />
          </Link>
        </div>
        {/* Footer Hint */}
        <div className="pt-10 text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">
          Built with Nest.js • Socket.io • PostgreSql • Next.js • Tailwind
        </div>
      </div>
    </div>
  );
}