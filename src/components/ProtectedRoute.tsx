"use client";

import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
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
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-white dark:bg-[#0f172a] transition-all duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-50 h-50 bg-orange-500/25 dark:bg-purple-500/25 rounded-full blur-[50px] animate-pulse" />
            <Loader2 size={50} className="text-purple-500 dark:text-orange-500 animate-spin" />
            <div className="space-y-2.5 text-center">
                <h2 className=" text-2xl text-slate-800 dark:text-white font-black">
                    Bero <span className="text-purple-500 dark:text-orange-500">Talker</span>
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