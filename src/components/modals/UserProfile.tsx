"use client";

import { X, Mail, MessageCircle, User as UserIco, Calendar, Loader2 } from "lucide-react";
import { User } from "@/types/user";
import { useUserApi } from "@/lib/hooks/useUser";
import { cn } from "@/lib/utils";

interface UserProfileProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserProfile({ user: initialUser, isOpen, onClose }: UserProfileProps) {
    const { useGetProfile } = useUserApi();
    const { data: fullUser, isLoading } = useGetProfile(initialUser?.id.toString());

    const userData = fullUser || initialUser;

    const joinedDate = userData?.createdAt
        ? new Date(userData.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : "N/A";

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

    if (!isOpen || !initialUser) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-slate-400/50 dark:bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />
            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white-bg dark:bg-dark-bg rounded-3xl shadow-3xl border border-slate-200 dark:border-surface overflow-hidden animate-in fade-in zoom-in duration-250">
                {/* Header/Cover */}
                <div className="relative h-28 bg-gradient-to-r from-rose-500/20 via-indigo-500/20 to-rose-500/20 border-b border-slate-100 dark:border-surface">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white-bg dark:bg-surface text-slate-500 dark:text-slate-400 rounded-full shadow-lg hover:text-rose-500 transition-all duration-250 z-20 cursor-pointer group"
                    >
                        <X size={20} className="group-hover:rotate-90 duration-250" />
                    </button>
                </div>
                {/* Avatar Section */}
                <div className="relative flex justify-center -mt-14">
                    <div className="relative">
                        <div className="w-25 h-25 p-1 bg-gradient-to-br from-indigo-500 to-rose-500 rounded-2xl shadow-2xl">
                            <div className="w-full h-full flex items-center justify-center bg-white-bg dark:bg-dark-bg rounded-2xl overflow-hidden">
                                {userData?.avatar ? (
                                    <img
                                        src={`${baseUrl}${userData.avatar}`}
                                        alt={userData.displayname}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-rose-500">
                                        {(userData?.displayname || userData?.username)?.[0]?.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Status Indicator */}
                        <div className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white dark:border-dark-bg rounded-full",
                            userData?.isOnline ? "bg-green-500" : "bg-slate-400"
                        )}>
                            {userData?.isOnline && <div className="w-full h-full bg-green-500 rounded-full animate-ping opacity-75" />}
                        </div>
                    </div>
                </div>
                {/* User Info Body */}
                <div className="px-5 pt-4 pb-8 space-y-5">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-rose-500 dark:text-indigo-500" />
                        </div>
                    ) : (
                        <>
                            <div className="text-center space-y-1">
                                <h1 className="text-2xl font-black text-surface dark:text-white tracking-tight">
                                    {userData?.displayname || userData?.username}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm italic font-medium">
                                    {userData?.bio || "Hey there! I'm using Bero Talker."}
                                </p>
                            </div>
                            <div className="space-y-3">
                                {/* Email Address */}
                                <div className="p-3.5 bg-slate-50 dark:bg-surface/40 rounded-2xl border border-slate-100 dark:border-surface/60 group hover:border-rose-500/30 transition-all duration-250">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl shadow-sm"><Mail size={20} /></div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{userData?.email || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Username */}
                                <div className="p-3.5 bg-slate-50 dark:bg-surface/40 rounded-2xl border border-slate-100 dark:border-surface/60 group hover:border-indigo-500/30 transition-all duration-250">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl shadow-sm"><UserIco size={20} /></div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">@{userData?.username}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Joined Date */}
                                <div className="p-3.5 bg-slate-50 dark:bg-surface/40 rounded-2xl border border-slate-100 dark:border-surface/60 group hover:border-rose-500/30 transition-all duration-250">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl shadow-sm"><Calendar size={20} /></div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member Since</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{joinedDate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 flex items-center justify-center gap-2.5 text-white font-bold text-base tracking-wider rounded-2xl shadow-lg shadow-rose-500/20 transform transition-all duration-250 active:scale-[0.98] bg-gradient-to-r from-indigo-500 to-rose-500 hover:opacity-90 cursor-pointer"
                            >
                                <MessageCircle size={20} /> Close Profile
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}