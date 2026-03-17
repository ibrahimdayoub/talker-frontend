"use client";

import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { Menu, MessageSquare, MoreVertical, Paperclip, Phone, Send, Smile, Video, Loader2, Ghost } from 'lucide-react';
import { debounce } from 'lodash';
import { User } from '@/types/user';
import { useAuthStore } from '@/store/useAuthStore';
import { useConversationApi } from '@/lib/hooks/useConversation';
import { useMessageApi } from '@/lib/hooks/useMessage';
import { useSocket } from '@/lib/hooks/useSocket';
import { cn } from '@/lib/utils';
import ConversationInfoModal from '@/components/modals/ConversationInfo';
import UserProfileModal from '@/components/modals/UserProfile';
import TypingIndicator from './ui/TypingIndicator';

interface ChatBoxProps {
    selectedChatId: number | null;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatBox = ({ setIsSidebarOpen, selectedChatId }: ChatBoxProps) => {
    const { user: currentUserProfile } = useAuthStore();

    const { useGetConversationDetails } = useConversationApi();
    const { useGetMessages } = useMessageApi();
    const { joinConversation, sendMessage, setTyping, typingUsers, socket } = useSocket(selectedChatId || undefined);

    const { data: conversation, isLoading: isConvLoading } = useGetConversationDetails(selectedChatId as number);
    const { data: socketMessages, isLoading: isMsgsLoading } = useGetMessages(selectedChatId as number);

    const [messageText, setMessageText] = useState("");
    const [membersStatus, setMembersStatus] = useState<Record<number, boolean>>({});
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
    const [isConvInfoModalOpen, setIsConvInfoModalOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

    const debouncedSetTyping = useRef(
        debounce((chatId: number, isTyping: boolean) => {
            setTyping(chatId, isTyping);
        }, 500)
    ).current;

    const displayMessages = useMemo(() => {
        if (!conversation?.messages && !socketMessages) return [];

        const messageMap = new Map();
        [...(conversation?.messages || []), ...(socketMessages || [])].forEach(msg => {
            messageMap.set(msg.id, msg);
        });

        return Array.from(messageMap.values())
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [conversation?.messages, socketMessages]);

    const isLoading = isConvLoading || (selectedChatId && isMsgsLoading);

    const handleUserClick = (userData: User) => {
        setSelectedUser(userData);
        setIsUserProfileOpen(true);
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!messageText.trim()) return;

        if (selectedChatId) {
            sendMessage(selectedChatId, messageText);
            setTyping(selectedChatId, false);
        }

        setMessageText("");
    };

    const isPrivate = conversation && !conversation.isGroup;
    const otherParticipant = isPrivate
        ? conversation.participants.find((p: any) => p.userId !== currentUserProfile?.id)?.user
        : null;

    const chatName = isPrivate ? (otherParticipant?.displayname || otherParticipant?.username) : conversation?.name;
    const chatAvatar = isPrivate ? otherParticipant?.avatar : null;

    const activeTypingUsers = useMemo(() => {
        if (!selectedChatId || !typingUsers[selectedChatId]) return [];

        return Object.entries(typingUsers[selectedChatId])
            .filter(([username, isTyping]) => username !== currentUserProfile?.username && isTyping)
            .map(([username]) => {
                const participant = conversation.participants?.find(
                    (p: any) => p.user.username === username
                );
                return {
                    username,
                    displayName: participant?.user.displayname || username,
                    avatar: participant?.user.avatar
                };
            });
    }, [typingUsers, selectedChatId, currentUserProfile?.username, conversation]);

    useLayoutEffect(() => {
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        });
    }, [displayMessages]);

    useEffect(() => {
        if (selectedChatId && joinConversation) {
            joinConversation(selectedChatId);
        }
    }, [selectedChatId, joinConversation]);

    useEffect(() => {
        setMessageText("");
        return () => {
            if (selectedChatId) setTyping(selectedChatId, false);
        };
    }, [selectedChatId, setTyping]);

    useEffect(() => {
        if (!socket || !conversation?.participants) return;

        const initialStatus: Record<number, boolean> = {};
        conversation.participants.forEach((p: any) => {
            initialStatus[p.user.id] = p.user.isOnline;
        });
        setMembersStatus(initialStatus);

        const handleStatus = (updatedUser: any) => {
            setMembersStatus(prev => ({ ...prev, [updatedUser.id]: updatedUser.isOnline }));
        };
        const handleReconnect = () => {
            const refreshedStatus: Record<number, boolean> = {};
            conversation.participants.forEach((p: any) => {
                refreshedStatus[p.user.id] = p.user.isOnline;
            });
            setMembersStatus(refreshedStatus);
        };

        socket.on("userStatusChanged", handleStatus);
        socket.on("connect", handleReconnect);

        return () => {
            socket.off("userStatusChanged", handleStatus);
            socket.off("connect", handleReconnect);
        };
    }, [socket, conversation]);

    return (
        <>
            <main className="relative flex-1 bg-white-bg dark:bg-dark-bg transition-all duration-250">
                {
                    selectedChatId ? (
                        isLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-500 dark:text-rose-500" size={35} />
                            </div>
                        ) : (
                            <div className='h-full flex-1 flex flex-col'>
                                {/* Header */}
                                <div className="h-15 p-5 py-7.5 flex-none flex items-center justify-between bg-white-bg dark:bg-dark-bg border-b border-slate-200 dark:border-surface z-10 transition-all duration-250">
                                    <div className="flex items-center gap-3.5 hover:opacity-85 transition-all duration-250 cursor-pointer" onClick={() => setIsConvInfoModalOpen(true)}>
                                        <div className="relative">
                                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-rose-500 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-500/20 overflow-hidden">
                                                {chatAvatar ? <img src={`${baseUrl}${chatAvatar}`} className="w-full h-full object-cover" alt="Avatar" /> : chatName?.[0]?.toUpperCase() || "G"}
                                            </div>
                                            {
                                                isPrivate &&
                                                <div className={cn(
                                                    "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white dark:border-dark-bg rounded-full",
                                                    otherParticipant?.isOnline ? "bg-green-500" : "bg-slate-400"
                                                )}></div>
                                            }
                                        </div>
                                        <div>
                                            <h2 className="text-surface dark:text-white text-base md:text-lg font-bold truncate max-w-[150px] md:max-w-none">{chatName}</h2>
                                            <p className="text-rose-500 dark:text-indigo-500 text-[10px] font-bold tracking-tight uppercase">
                                                {activeTypingUsers.length > 0 ? (
                                                    <span className="animate-pulse">
                                                        {conversation?.isGroup
                                                            ? `${activeTypingUsers.map(u => u.displayName).join(", ")} ${activeTypingUsers.length === 1 ? "is" : "are"} typing...`
                                                            : `${activeTypingUsers[0].displayName} is typing...`}
                                                    </span>
                                                ) : conversation?.isGroup ? (
                                                    `${Object.values(membersStatus).filter(Boolean).length} of ${conversation.participants?.length || 0} Active`
                                                ) : (
                                                    otherParticipant?.isOnline ? "Online" : "Offline"
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="hidden md:block p-1.25 lg:px-2.5 text-slate-500 hover:text-rose-500 transition-all duration-250 cursor-pointer"><Phone size={20} /></button>
                                        <button className="hidden md:block p-1.25 lg:px-2.5 text-slate-500 hover:text-indigo-500 transition-all duration-250 cursor-pointer"><Video size={20} /></button>
                                        <button className="p-1.25 lg:px-2.5 text-slate-500 cursor-pointer"><MoreVertical size={20} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }} className="md:hidden p-1.25 lg:px-2.5 text-slate-500 cursor-pointer"><Menu size={20} /></button>
                                    </div>
                                </div>
                                {/* Messages */}
                                <div ref={scrollRef} className="flex-1 p-5 space-y-1.25 overflow-y-auto custom-scrollbar scroll-smooth chat-background-pattern"
                                >
                                    {
                                        displayMessages.length > 0 ? (
                                            <>
                                                {
                                                    displayMessages.map((msg: any, index) => {
                                                        const isMe = msg.userId === currentUserProfile?.id;
                                                        const isFirstInGroup = index === 0 || displayMessages[index - 1]?.userId !== msg.userId;
                                                        const isMiddleInGroup = displayMessages[index - 1]?.userId === msg.userId && displayMessages[index + 1]?.userId === msg.userId;
                                                        const isAloneInGroup = displayMessages[index]?.userId === msg.userId && displayMessages[index - 1]?.userId !== msg.userId && displayMessages[index + 1]?.userId !== msg.userId;
                                                        const isLastInGroup = index === displayMessages.length - 1 || displayMessages[index + 1]?.userId !== msg.userId;

                                                        const getBubbleStyles = () => {
                                                            if (isMe) {
                                                                if (isAloneInGroup) return "rounded-2xl rounded-br-none";
                                                                if (isFirstInGroup) return "rounded-2xl rounded-br-none";
                                                                if (isLastInGroup) return "rounded-2xl rounded-tr-none";
                                                                return "rounded-2xl rounded-tr-none rounded-br-none"; // Middle
                                                            } else {
                                                                if (isAloneInGroup) return "rounded-2xl rounded-bl-none";
                                                                if (isFirstInGroup) return "rounded-2xl rounded-bl-none";
                                                                if (isLastInGroup) return "rounded-2xl rounded-tl-none";
                                                                return "rounded-2xl rounded-tl-none rounded-bl-none"; // Middle
                                                            }
                                                        };

                                                        return (
                                                            <div key={msg.id} className={cn("flex items-end gap-2.5 max-w-[75%] md:max-w-[50%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                                                                {!isMe && (
                                                                    <div
                                                                        className={cn(
                                                                            "w-10 h-10 flex-none flex items-center justify-center bg-gradient-to-tr from-rose-200/50 to-rose-500/50 dark:from-indigo-500/25 dark:to-indigo-800/50 text-rose-400 dark:text-indigo-200 text-sm font-black border border-slate-200/50 dark:border-indigo-800/50 rounded-xl hover:scale-110 transition-all duration-250 cursor-pointer overflow-hidden",
                                                                            !isLastInGroup && "invisible"
                                                                        )}
                                                                        onClick={() => handleUserClick(msg.user)}
                                                                    >
                                                                        {msg.user?.avatar ? (
                                                                            <img src={`${baseUrl}${msg.user.avatar}`} className="w-full h-full object-cover" alt="User" />
                                                                        ) : (
                                                                            msg.user?.username?.[0].toUpperCase()
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <div className={cn("relative p-2.5 pb-1.25 lg:pb-1.25 shadow-sm transition-all duration-250",
                                                                    isMe ? "bg-gradient-to-br from-indigo-500 to-rose-500 rounded-2xl rounded-br-none" : "bg-white-bg dark:bg-surface border border-slate-200 dark:border-slate-500/25",
                                                                    getBubbleStyles()
                                                                )}>
                                                                    {!isMe && isLastInGroup && (
                                                                        <p className="text-[12px] font-bold text-rose-500 dark:text-indigo-500 uppercase mb-1">
                                                                            {msg.user?.displayname}
                                                                        </p>
                                                                    )}
                                                                    <p className={cn("text-sm leading-relaxed", isMe ? "text-white" : "text-slate-500 dark:text-slate-200")}>{msg.content}</p>
                                                                    <p className={cn("text-[10px] font-bold mt-1.25 text-right", isMe ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>
                                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        {isMe && msg.seenBy && (
                                                                            <span className="ms-1.25 text-[8px] text-white/75">
                                                                                {msg.seenBy.length > 0 ? '✓✓' : '✓'}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                }
                                                <TypingIndicator
                                                    conversation={conversation}
                                                    activeTypingUsers={activeTypingUsers}
                                                    otherParticipant={otherParticipant}
                                                    baseUrl={baseUrl}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                {activeTypingUsers.length > 0 ? (
                                                    <TypingIndicator
                                                        conversation={conversation}
                                                        activeTypingUsers={activeTypingUsers}
                                                        otherParticipant={otherParticipant}
                                                        baseUrl={baseUrl}
                                                    />
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center gap-3.5 text-center p-10 opacity-80">
                                                        <div className="relative w-20 h-20 flex items-center justify-center bg-white-bg dark:bg-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-500/50 transition-all duration-250 hover:scale-110">
                                                            <svg width="0" height="0" className="absolute">
                                                                <linearGradient id="empty-msg-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                                                                    <stop stopColor="oklch(64.5% 0.246 16.439)" offset="0%" />
                                                                    <stop stopColor="oklch(58.5% 0.233 277.117)" offset="100%" />
                                                                </linearGradient>
                                                            </svg>
                                                            <Ghost size={40} style={{ stroke: "url(#empty-msg-gradient)" }} />
                                                        </div>
                                                        <h2 className="text-2xl font-bold text-surface dark:text-white">No Messages Yet</h2>
                                                        <p className="max-w-sm text-base text-slate-500 dark:text-slate-400">
                                                            Say hello to <span className="text-rose-500 font-bold">{chatName}</span> and start the conversation!
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )
                                    }
                                </div>
                                {/* Input */}
                                <form onSubmit={handleSend} className="flex-none px-2.5 py-3.25 lg:px-5 bg-white-bg dark:bg-dark-bg border-t border-slate-200 dark:border-surface transition-all duration-250">
                                    <div className="mx-auto px-2.5 py-1.25 lg:pl-5 flex items-center bg-slate-50 dark:bg-surface/50 rounded-xl shadow-xl border border-slate-200 dark:border-surface focus-within:border-rose-500 transition-all duration-250">
                                        <input type="text" value={messageText}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setMessageText(value);
                                                if (selectedChatId) {
                                                    if (value.length > 0) {
                                                        debouncedSetTyping(selectedChatId, true);
                                                    } else {
                                                        debouncedSetTyping(selectedChatId, false);
                                                    }
                                                }
                                            }}
                                            placeholder="Type Message..." className="flex-1 bg-transparent border-none outline-none placeholder:text-slate-500 text-surface dark:text-white" />
                                        <button type="button" className="hidden md:block p-1.25 lg:px-2.5 text-slate-500 hover:text-rose-500 transition-all duration-250 cursor-pointer"><Smile size={20} /></button>
                                        <button type="button" className="hidden md:block p-1.25 lg:px-2.5 text-slate-500 hover:text-indigo-500 transition-all duration-250 cursor-pointer"><Paperclip size={20} /></button>
                                        <button type="submit" className="p-1.25 lg:px-2.5 flex items-center justify-center hover:scale-110 hover:rotate-45 transition-all duration-250 cursor-pointer">
                                            <svg width="0" height="0" className="absolute">
                                                <linearGradient id="send-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                                                    <stop stopColor="#ea580c" offset="0%" />
                                                    <stop stopColor="#9333ea" offset="100%" />
                                                </linearGradient>
                                            </svg>
                                            <Send size={25} style={{ stroke: "url(#send-gradient)" }} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-3.5 text-center p-10 chat-background-pattern">
                            <div className="relative w-20 h-20 flex items-center justify-center bg-white-bg dark:bg-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-500/50 transition-all duration-250 hover:scale-110">
                                <svg width="0" height="0" className="absolute">
                                    <linearGradient id="empty-conv-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                                        <stop stopColor="oklch(64.5% 0.246 16.439)" offset="0%" />
                                        <stop stopColor="oklch(58.5% 0.233 277.117)" offset="100%" />
                                    </linearGradient>
                                </svg>
                                <MessageSquare size={40} style={{ stroke: "url(#empty-conv-gradient)" }} />
                            </div>
                            <h2 className="text-2xl font-bold text-surface dark:text-white">Your Inbox is Waiting</h2>
                            <p className="max-w-sm text-base text-slate-500 dark:text-slate-400">Select a conversation to start.</p>
                            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-bold rounded-xl shadow-xl transition-all duration-250">Show Contacts</button>
                        </div>
                    )
                }
            </main>
            <ConversationInfoModal isOpen={isConvInfoModalOpen} onClose={() => setIsConvInfoModalOpen(false)} conversation={conversation} />
            <UserProfileModal isOpen={isUserProfileOpen} onClose={() => setIsUserProfileOpen(false)} user={selectedUser} />
        </>
    )
}

export default ChatBox;