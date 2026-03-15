"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Users, MessageCircle, MoreHorizontal, AtSign, Mail } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocket } from "@/lib/hooks/useSocket";
import { cn } from "@/lib/utils";

interface ConversationInfoProps {
    conversation: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ConversationInfo({ conversation, isOpen, onClose }: ConversationInfoProps) {
    const { user: currentUser } = useAuthStore();
    const { socket, typingUsers } = useSocket(conversation?.id);
    const [membersStatus, setMembersStatus] = useState<Record<number, boolean>>({});

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";

    useEffect(() => {
        if (!socket || !conversation?.participants) return;

        // Initialize online status
        const initialStatus: Record<number, boolean> = {};
        conversation.participants.forEach((p: any) => {
            initialStatus[p.user.id] = p.user.isOnline;
        });
        setMembersStatus(initialStatus);

        // Listen for user status updates
        const handleStatus = (updatedUser: any) => {
            setMembersStatus((prev) => ({
                ...prev,
                [updatedUser.id]: updatedUser.isOnline,
            }));
        };
        socket.on("userStatus", handleStatus);

        // Listen for socket reconnect to refresh statuses
        const handleReconnect = () => {
            const refreshedStatus: Record<number, boolean> = {};
            conversation.participants.forEach((p: any) => {
                refreshedStatus[p.user.id] = p.user.isOnline;
            });
            setMembersStatus(refreshedStatus);
        };
        socket.on("connect", handleReconnect);

        return () => {
            socket.off("userStatus", handleStatus);
            socket.off("connect", handleReconnect);
        };
    }, [socket, conversation]);

    if (!isOpen || !conversation) return null;

    const isGroup = conversation.isGroup;
    const otherParticipant = !isGroup
        ? conversation.participants?.find((p: any) => p.userId !== currentUser?.id)?.user
        : null;
    const displayName = isGroup ? conversation.name : (otherParticipant?.displayname || otherParticipant?.username);
    const avatarContent = isGroup
        ? displayName?.[0]?.toUpperCase() || "G"
        : otherParticipant?.avatar
            ? <img src={`${baseUrl}${otherParticipant.avatar}`} className="w-full h-full object-cover rounded-2xl" />
            : otherParticipant?.username?.[0]?.toUpperCase() || "U";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-400/50 dark:bg-black/50 backdrop-blur-md" onClick={onClose} />
            {/* Modal Container */}
            <div className="relative w-full max-w-md space-y-3.5 bg-white-bg dark:bg-dark-bg rounded-3xl shadow-3xl border border-slate-200 dark:border-slate-500 overflow-hidden duration-250">
                {/* Header/Cover */}
                <div className="relative h-25 bg-gradient-to-r from-rose-500/25 dark:from-rose-500/10 to-indigo-500/25 dark:to-indigo-500/10 border-b border-slate-200 dark:border-slate-500">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 bg-white-bg dark:bg-surface/50 border border-slate-200 dark:border-slate-500/50 text-slate-500 dark:text-slate-400 rounded-full shadow-xl transition-all duration-250 z-20 cursor-pointer group"
                    >
                        <X size={20} className="group-hover:rotate-90 duration-250" />
                    </button>
                </div>
                {/* Profile Avatar */}
                <div className="relative flex justify-center -mt-17.5">
                    <div className="relative w-25 h-25 p-1 bg-gradient-to-br from-indigo-500 to-rose-500 rounded-2xl shadow-2xl transition-transform duration-250">
                        <div className="w-full h-full flex items-center justify-center bg-white-bg dark:bg-dark-bg text-6xl font-bold text-surface dark:text-white rounded-2xl overflow-hidden">
                            {avatarContent}
                        </div>
                        {/* Status indicator for private chat */}
                        {!isGroup && otherParticipant && (
                            <div className={cn(
                                "absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white dark:border-dark-bg rounded-full",
                                membersStatus[otherParticipant.id] ? "bg-green-500" : "bg-slate-400"
                            )}>
                                {membersStatus[otherParticipant.id] && <div className="w-full h-full bg-green-500 rounded-full animate-ping opacity-75" />}
                            </div>
                        )}
                    </div>
                </div>
                {/* Chat Info */}
                <div className="px-5 sm:px-10 pb-5 sm:pb-7.5 space-y-5">
                    {/* Name & Status & Types */}
                    <div className="text-center space-y-2.5">
                        <h1 className="text-2xl font-black text-surface dark:text-white truncate">{displayName}</h1>
                        {/* Private Chat Status */}
                        {!isGroup && otherParticipant && (
                            <p
                                className={`text-[10px] font-bold tracking-tight uppercase ${typingUsers[conversation?.id]?.[otherParticipant.username]
                                    ? "text-green-500"
                                    : membersStatus[otherParticipant.id]
                                        ? "text-green-500"
                                        : "text-gray-400"
                                    }`}
                            >
                                {
                                    typingUsers[conversation?.id]?.[otherParticipant.username]
                                        ? "Typing..."
                                        : membersStatus[otherParticipant.id]
                                            ? "Online"
                                            // : "Offline"
                                            : "Last seen at " + new Date(otherParticipant.lastSeen).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })
                                }
                            </p>
                        )}
                        {/* Chat Type */}
                        <div className="w-fit mx-auto px-5 py-2.5 flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-rose-500 dark:text-indigo-500 bg-rose-100 dark:bg-indigo-900/10 rounded-full shadow-sm">
                            {isGroup ? <Users size={15} /> : <MessageCircle size={15} />}
                            <span>{isGroup ? "Group Conversation" : "Private Chat"}</span>
                        </div>
                    </div>
                    {/* Info (Created / Username & Members / Email) */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3.5 bg-slate-100 dark:bg-surface/50 rounded-xl border border-slate-200 dark:border-surface group duration-250">
                            <div className="flex flex-col items-start gap-2.5">
                                <div className="p-2 bg-rose-500/5 text-rose-500 border border-slate-200 dark:border-surface group-hover:border-rose-500/50 rounded-lg shadow-lg duration-250">
                                    {isGroup ? <Calendar size={15} /> : <AtSign size={15} />}
                                </div>
                                <div className="overflow-hidden space-y-1.25 w-full">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                        {isGroup ? "Created On" : "Username"}
                                    </p>
                                    <p className="text-sm text-surface dark:text-slate-200 truncate">
                                        {isGroup
                                            ? new Date(conversation.createdAt).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })
                                            : `@${otherParticipant?.username}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-3.5 bg-slate-100 dark:bg-surface/50 rounded-xl border border-slate-200 dark:border-surface group duration-250">
                            <div className="flex flex-col items-start gap-2.5">
                                <div className="p-2 bg-green-500/5 text-green-500 border border-slate-200 dark:border-surface group-hover:border-green-500/50 rounded-lg shadow-lg duration-250">
                                    {isGroup ? <Users size={15} /> : <Mail size={15} />}
                                </div>
                                <div className="overflow-hidden space-y-1.25 w-full">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                        {isGroup ? "Members" : "Email"}
                                    </p>
                                    <p className="text-sm text-surface dark:text-slate-200 truncate">
                                        {isGroup
                                            ? `${Object.values(membersStatus).filter(Boolean).length} of ${conversation.participants?.length || 0} Active`
                                            : otherParticipant?.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Members List for Group */}
                    {isGroup && (
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Active Members
                                </h4>
                                <MoreHorizontal size={15} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="max-h-37.5 pr-2.5 overflow-y-auto custom-scrollbar space-y-2.5">
                                {conversation.participants?.map((p: any) => {
                                    const isOnline = membersStatus[p.user.id];
                                    const isTyping = typingUsers[conversation?.id]?.[p.user.username] ?? false;
                                    return (
                                        <div
                                            key={p.id}
                                            className="p-2.5 bg-slate-100 dark:bg-surface/50 rounded-xl border border-slate-200 dark:border-surface group duration-250"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-10 h-10 flex justify-center items-center bg-rose-500/5 text-rose-500 border border-slate-200 dark:border-surface group-hover:border-rose-500/50 rounded-lg shadow-lg duration-250 uppercase font-bold relative">
                                                    {
                                                        p.user?.avatar
                                                            ? <img src={`${baseUrl}${p.user.avatar}`} className="w-full h-full object-cover rounded-lg" />
                                                            : p.user?.username?.[0]
                                                    }
                                                    <div
                                                        className={`absolute -bottom-0.75 -right-0.75 w-2.5 h-2.5 rounded-full border border-white dark:border-dark-bg ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                                                            }`}
                                                    />
                                                </div>
                                                <div className="overflow-hidden space-y-0.5">
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                        {p.user?.displayname || p.user?.username}
                                                    </p>
                                                    <p className="text-sm text-surface dark:text-slate-200 truncate">
                                                        @{p.user?.username} {isTyping ? "• Typing..." : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
