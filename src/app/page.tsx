"use client";

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { MessageSquare, Zap, Shield, ChevronRight, Sun, Moon } from 'lucide-react';

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative min-h-screen p-5 flex flex-col items-center justify-center bg-white dark:bg-[#0f172a] overflow-hidden transition-colors duration-300">
      {/* Blobs Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Left - Orange Glow */}
        <div className="absolute -top-[10%] -left-[10%] w-[40rem] h-[40rem] bg-orange-500/20 rounded-full blur-[120px] animate-blob" />
        {/* Top Right - Soft Purple Glow */}
        <div className="absolute top-[10%] -right-[5%] w-[35rem] h-[35rem] bg-purple-600/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        {/* Bottom Center - Deep Indigo/Pink Glow */}
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[130px] animate-blob animation-delay-4000" />
      </div>
      {/* Content */}
      <div className="relative max-w-5xl text-center space-y-10">
        {/* Intro */}
        <div className="space-y-5">
          <div
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-5 py-2.5 inline-flex items-center gap-1.25 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-300 cursor-pointer">
            {
              theme === "dark" ?
                <Sun className="mx-auto text-orange-500 group-hover:scale-110 transition-transform" size={20} /> :
                <Moon className="mx-auto text-purple-500 group-hover:scale-110 transition-transform" size={20} />
            }
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Version 1.0 is live</span>
          </div>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter">
            <span className="text-slate-800 dark:text-white">Bero</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">{" "} Talker</span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Where every word matters, in <span className="text-slate-800 dark:text-white italic">real-time</span>.
            Experience the future of seamless messaging today.
          </p>
        </div>
        {/* Feature Tags */}
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg transition-all group">
            <Zap className="mx-auto mb-1.25 text-purple-500 group-hover:scale-110 transition-transform" size={25} />
            <span className="text-sm uppercase text-slate-600 dark:text-slate-200">Real-time Sockets</span>
          </div>
          <div className="p-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg transition-all group">
            <Shield className="mx-auto mb-1.25 text-pink-500 group-hover:scale-110 transition-transform" size={25} />
            <span className="text-sm uppercase text-slate-600 dark:text-slate-200">Secure & Private</span>
          </div>
          <div className="p-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg transition-all group">
            <MessageSquare className="mx-auto mb-1.25 text-orange-500 group-hover:scale-110 transition-transform" size={25} />
            <span className="text-sm uppercase text-slate-600 dark:text-slate-200">Modern UX</span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
          <Link
            href="/signin"
            className="w-full sm:w-56 px-10 py-3.5 sm:text-lg font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 shadow-lg transition-all text-center"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-56 px-10 py-3.5 flex items-center justify-center gap-2.5 sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-orange-600 text-white rounded-xl shadow-xl shadow-orange-500/25 hover:shadow-purple-500/25 transform transition-all hover:-translate-y-0.5 active:scale-95 text-center"
          >
            Get Started <ChevronRight size={25} />
          </Link>
        </div>
        {/* Footer Hint */}
        <div className="pt-10 text-slate-600 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">
          Built with Nest.js • Socket.io • PostgreSql • Next.js • Tailwind
        </div>
      </div>
    </div>
  );
}