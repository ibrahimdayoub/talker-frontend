"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Menu, MessageSquare, MoreVertical, Paperclip, Phone, Send, Smile, Video, Loader2, Ghost } from 'lucide-react';
import ConversationInfoModal from '@/components/modals/ConversationInfo';
import UserProfileModal from '@/components/modals/UserProfile';
import { useConversationApi } from '@/lib/hooks/useConversation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/lib/hooks/useSocket';
import { cn } from '@/lib/utils';
import { useMessageApi } from '@/lib/hooks/useMessage';
import { debounce } from 'lodash';

interface ChatBoxProps {
    selectedChatId: number | null;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}


interface User {
    id: number;
    username: string;
    displayname?: string;
    avatar?: string;
    isOnline?: boolean;
}

interface Message {
    id: number;
    content: string;
    createdAt: string;
    userId: number;
    user?: User;
}

interface Conversation {
    id: number;
    name?: string;
    isGroup: boolean;
    participants: Array<{
        userId: number;
        user: User;
    }>;
    messages?: Message[];
}

const ChatBox = ({ setIsSidebarOpen, selectedChatId }: ChatBoxProps) => {
    const { user: currentUserProfile } = useAuthStore();
    const { useGetConversationDetails } = useConversationApi();
    const { useGetMessages } = useMessageApi();

    const { sendMessage, setTyping, typingUsers, socket } = useSocket(selectedChatId || undefined);
    const [membersStatus, setMembersStatus] = useState<Record<number, boolean>>({});
    const [messageText, setMessageText] = useState("");
    const [isConvInfoModalOpen, setIsConvInfoModalOpen] = useState(false);
    const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

    const { data: conversation, isLoading: isConvLoading } = useGetConversationDetails(selectedChatId as number);
    const { data: socketMessages, isLoading: isMsgsLoading } = useGetMessages(selectedChatId as number);

    const debouncedSetTyping = useRef(
        debounce((chatId: number, isTyping: boolean) => {
            setTyping(chatId, isTyping);
        }, 500)
    ).current;

    // في الـ onChange


    // دمج الرسائل بدون تكرار
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

    // Online status
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

    // Auto-scroll
    // useEffect(() => {
    //     if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    // }, [displayMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

            if (isNearBottom) {
                scrollRef.current.scrollTop = scrollHeight;
            }
        }
    }, [displayMessages]);

    // Cleanup typing
    useEffect(() => {
        return () => {
            if (selectedChatId) setTyping(selectedChatId, false);
        };
    }, [selectedChatId, setTyping]);

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

    const activeTypingUsers = Object.entries(typingUsers)
        .filter(([username]) => username !== currentUserProfile?.username && typingUsers[username])
        .map(([username]) => username);

    const isPrivate = conversation && !conversation.isGroup;
    const otherParticipant = isPrivate
        ? conversation.participants.find((p: any) => p.userId !== currentUserProfile?.id)?.user
        : null;

    const chatName = isPrivate ? (otherParticipant?.displayname || otherParticipant?.username) : conversation?.name;
    const chatAvatar = isPrivate ? otherParticipant?.avatar : null;

    return (
        <>
            <main className="relative h-full flex-1 flex flex-col bg-white dark:bg-[#0f172a] transition-all duration-300">
                {selectedChatId ? (
                    isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-orange-500" size={32} />
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="h-15 p-5 py-7.5 flex-none flex items-center justify-between bg-white dark:bg-[hsl(222,47%,11%)] border-b border-slate-200 dark:border-slate-800 z-10 transition-all duration-300">
                                <div className="flex items-center gap-3.5 hover:opacity-85 transition-all duration-300 cursor-pointer" onClick={() => setIsConvInfoModalOpen(true)}>
                                    <div className="relative">
                                        <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-600 to-orange-600 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 overflow-hidden">
                                            {chatAvatar ? <img src={`${baseUrl}${chatAvatar}`} className="w-full h-full object-cover" alt="Avatar" /> : chatName?.[0]?.toUpperCase() || "G"}
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white dark:border-[#0f172a] rounded-full",
                                            isPrivate && otherParticipant?.isOnline ? "bg-green-500" : "bg-slate-400"
                                        )}></div>
                                    </div>
                                    <div>
                                        <h2 className="text-slate-800 dark:text-white text-base sm:text-lg font-bold truncate max-w-[150px] sm:max-w-none">{chatName}</h2>
                                        <p className="text-orange-500 text-[10px] font-bold tracking-tight uppercase">
                                            {activeTypingUsers.length > 0 ? (
                                                <span className="animate-pulse">
                                                    {conversation?.isGroup
                                                        ? `${activeTypingUsers.join(", ")} ${activeTypingUsers.length === 1 ? "is" : "are"} typing...`
                                                        : "is typing..."}
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
                                    <button className="hidden sm:block p-1.25 lg:px-2.5 text-slate-500 hover:text-orange-500 transition-all duration-300 cursor-pointer"><Phone size={20} /></button>
                                    <button className="hidden sm:block p-1.25 lg:px-2.5 text-slate-500 hover:text-purple-500 transition-all duration-300 cursor-pointer"><Video size={20} /></button>
                                    <button className="p-1.25 lg:px-2.5 text-slate-500 cursor-pointer"><MoreVertical size={20} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }} className="sm:hidden p-1.25 lg:px-2.5 text-slate-500 cursor-pointer"><Menu size={20} /></button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 p-5 space-y-5 overflow-y-auto custom-scrollbar scroll-smooth">
                                {displayMessages.length > 0 ? (
                                    displayMessages.map((msg: any) => {
                                        const isMe = msg.userId === currentUserProfile?.id;
                                        return (
                                            <div key={msg.id} className={cn("flex items-end gap-3.5 max-w-[80%] sm:max-w-[70%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                                                {!isMe && (
                                                    <div onClick={() => handleUserClick(msg.user)} className="w-10 h-10 flex-none flex items-center justify-center bg-gradient-to-tr from-slate-100/25 to-slate-200/50 dark:from-purple-600/25 dark:to-purple-800/50 text-purple-600 dark:text-purple-200 text-xs font-black border border-slate-200/50 dark:border-purple-800/50 rounded-lg hover:scale-110 transition-all duration-300 cursor-pointer overflow-hidden">
                                                        {msg.user?.avatar ? <img src={`${baseUrl}${msg.user.avatar}`} className="w-full h-full object-cover" alt="User" /> : msg.user?.username?.[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div className={cn("relative p-2.5 lg:p-3.5 shadow-sm transition-all duration-300",
                                                    isMe ? "bg-gradient-to-br from-purple-500 to-orange-500 rounded-2xl rounded-br-none" : "bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-600/50"
                                                )}>
                                                    {!isMe && <p className="text-[12px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">{msg.user?.username}</p>}
                                                    <p className={cn("text-sm leading-relaxed", isMe ? "text-white" : "text-slate-600 dark:text-slate-200")}>{msg.content}</p>
                                                    <p className={cn("text-[10px] font-bold mt-2.5 text-right", isMe ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    {isMe && msg.seenBy && (
                                                        <span className="text-[8px] text-white/60 mt-1 block">
                                                            {msg.seenBy.length > 0 ? '✓✓' : '✓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-5 text-center p-10 opacity-80">
                                        <div className="relative w-20 h-20 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600/50 transition-all hover:scale-110 duration-300">
                                            <svg width="0" height="0" className="absolute">
                                                <linearGradient id="empty-msg-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                                                    <stop stopColor="#ea580c" offset="0%" />
                                                    <stop stopColor="#9333ea" offset="100%" />
                                                </linearGradient>
                                            </svg>
                                            <Ghost size={40} style={{ stroke: "url(#empty-msg-gradient)" }} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">No Messages Yet</h2>
                                        <p className="max-w-sm text-base text-slate-600 dark:text-slate-400">
                                            Say hello to <span className="text-orange-500 font-bold">{chatName}</span> and start the conversation!
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSend} className="flex-none px-2.5 py-3 lg:px-5 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 transition-all duration-300">
                                <div className="mx-auto px-2.5 py-1.25 lg:pl-5 flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 focus-within:border-orange-600 transition-all duration-300">
                                    <input type="text" value={messageText}

                                        // onChange={(e) => {
                                        //     const value = e.target.value;
                                        //     setMessageText(value);
                                        //     if (selectedChatId) setTyping(selectedChatId, value.length > 0);
                                        // }} 

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


                                        placeholder="Type Message..." className="flex-1 bg-transparent border-none outline-none placeholder:text-slate-500 text-slate-800 dark:text-white" />
                                    <button type="button" className="hidden sm:block p-1.25 lg:px-2.5 text-slate-500 hover:text-orange-500 transition-all duration-300 cursor-pointer"><Smile size={20} /></button>
                                    <button type="button" className="hidden sm:block p-1.25 lg:px-2.5 text-slate-500 hover:text-purple-500 transition-all duration-300 cursor-pointer"><Paperclip size={20} /></button>
                                    <button type="submit" className="p-1.25 lg:px-2.5 flex items-center justify-center hover:scale-110 hover:rotate-45 transition-all duration-300 cursor-pointer">
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
                        </>
                    )
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-5 text-center p-10">
                        <div className="relative w-20 h-20 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600/50 transition-all hover:scale-110 duration-300">
                            <MessageSquare size={40} className="text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your Inbox is Waiting</h2>
                        <p className="max-w-sm text-base text-slate-600 dark:text-slate-400">Select a conversation to start.</p>
                        <button onClick={() => setIsSidebarOpen(true)} className="sm:hidden px-5 py-2.5 bg-gradient-to-r from-purple-600 to-orange-600 text-white font-bold rounded-xl shadow-xl transition-all duration-300">Show Contacts</button>
                    </div>
                )}
            </main>

            <ConversationInfoModal isOpen={isConvInfoModalOpen} onClose={() => setIsConvInfoModalOpen(false)} conversation={conversation} />
            <UserProfileModal isOpen={isUserProfileOpen} onClose={() => setIsUserProfileOpen(false)} user={selectedUser} />
        </>
    )
}

export default ChatBox;
