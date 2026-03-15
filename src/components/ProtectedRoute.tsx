"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();

    const [mounted, setMounted] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const isPublicPage = useMemo(() =>
        ['/', '/signin', '/signup'].includes(pathname),
        [pathname]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (!isAuthenticated && !isPublicPage) {
            setIsNavigating(true);
            router.replace('/signin');
        }

        if (isAuthenticated && (pathname === '/' || pathname === '/signin' || pathname === '/signup')) {
            setIsNavigating(true);
            router.replace('/chat');
        } else {
            setIsNavigating(false);
        }

    }, [mounted, isAuthenticated, pathname, router, isPublicPage]);

    const LoadingScreen = () => (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-white-bg dark:bg-dark-bg transition-all duration-250 background-pattern-05">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-50 h-50 bg-rose-500/25 dark:bg-indigo-500/25 rounded-full blur-[50px] animate-pulse" />
            <Loader2 size={50} className="text-indigo-500 dark:text-rose-500 animate-spin" />
            <div className="space-y-2.5 text-center">
                <h2 className=" text-2xl text-surface dark:text-white font-black">
                    Bero <span className="text-indigo-500 dark:text-rose-500">Talker</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                    Please Wait
                </p>
            </div>
        </div>
    );

    if (!mounted) return null;

    const showLoading = isNavigating || (!isAuthenticated && !isPublicPage) || (isAuthenticated && (pathname === '/' || pathname === '/signin' || pathname === '/signup'));

    return (
        <>
            {showLoading && <LoadingScreen />}
            <div className={showLoading ? "invisible" : "visible"}>
                {children}
            </div>
        </>
    );
}