"use client";

import { useEffect, useState } from 'react';
import { LogOut, Search, X, Users, Sun, Moon, Loader2 } from 'lucide-react';
import { useTheme } from "next-themes";
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuthApi } from '@/lib/hooks/useAuth';
import { useUserApi } from '@/lib/hooks/useUser';
import { useConversationApi } from '@/lib/hooks/useConversation';
import { useSocket } from '@/lib/hooks/useSocket';
import { cn } from '@/lib/utils';
import CreateGroupModal from '@/components/modals/CreateGroup';
import MyProfileModal from '@/components/modals/MyProfile';

interface ChatSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedChatId: number | null;
    setSelectedChatId: (id: number) => void;
}

const ChatSidebar = ({ isSidebarOpen, setIsSidebarOpen, selectedChatId, setSelectedChatId }: ChatSidebarProps) => {
    const { theme, setTheme } = useTheme();
    const { user: currentUser } = useAuthStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
    const [isGrpModalOpen, setIsGrpModalOpen] = useState(false);

    const queryClient = useQueryClient();
    const { useLogout } = useAuthApi();
    const { useSearch } = useUserApi();
    const { useGetConversations, useCreatePrivateChat } = useConversationApi();
    const { createConversation, joinConversation, typingUsers, socket } = useSocket(selectedChatId || undefined);

    const { mutate: logout, isPending: isLoggingOut } = useLogout();
    const { data: searchResults = [] } = useSearch(searchQuery);
    const { data: conversations = [] } = useGetConversations();
    const { mutate: startChat } = useCreatePrivateChat();

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

    useEffect(() => {
        if (!socket) return;

        const handleNewConversation = (newChat: any) => {
            console.log('New conversation in sidebar:', newChat);

            if (joinConversation) {
                joinConversation(newChat.id);
            }
        };

        socket.on('newConversation', handleNewConversation);

        return () => {
            socket.off('newConversation', handleNewConversation);
        };
    }, [socket, joinConversation]);

    useEffect(() => {
        if (!socket) return;

        const handleNewGroup = (newGroup: any) => {
            console.log('New group in sidebar:', newGroup);

            if (joinConversation) {
                joinConversation(newGroup.id);
            }
        };

        socket.on('newGroup', handleNewGroup);

        return () => {
            socket.off('newGroup', handleNewGroup);
        };
    }, [socket, joinConversation]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (newMessage: any) => {
            console.log('New message in sidebar:', newMessage);

            queryClient.setQueryData(['conversations'], (oldData: any[]) => {
                if (!oldData) return oldData;

                // Add lastMessage to the conversation
                const updatedData = oldData.map((conv: any) => {
                    if (conv.id === newMessage.conversationId) {
                        return {
                            ...conv,
                            lastMessage: {
                                id: newMessage.id,
                                content: newMessage.content,
                                createdAt: newMessage.createdAt,
                                userId: newMessage.userId,
                                user: newMessage.user
                            },
                            updatedAt: newMessage.createdAt
                        };
                    }
                    return conv;
                });

                // Reorder the conversations
                return updatedData.sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
            });
        };

        socket.on('receiveMessage', handleReceiveMessage);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
        };
    }, [socket, queryClient]);

    return (
        <>
            <aside className={cn(
                "fixed inset-y-0 left-0 w-full sm:w-100 h-full flex flex-col bg-white-bg dark:bg-dark-bg border-r border-slate-200 dark:border-surface transition-all duration-250 sm:relative sm:translate-x-0 z-50",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Sidebar Header */}
                <div className="h-15 p-5 py-7.5 flex-none flex items-center justify-between bg-white-bg dark:bg-dark-bg border-b border-slate-200 dark:border-surface z-10 transition-all duration-250">
                    <div className="flex items-center gap-2.5 hover:opacity-85 transition-all duration-250 cursor-pointer">
                        <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-rose-500 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-500/20">
                            BT
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-surface dark:text-white">
                            Bero<span className="text-transparent font-black bg-clip-text bg-gradient-to-r from-indigo-500 to-rose-500">Talker</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2.5 hover:bg-slate-50 dark:hover:bg-surface rounded-full transition-all duration-250 group cursor-pointer"
                        >
                            {theme === "dark" ? (
                                <Sun size={20} className="text-rose-500 group-hover:rotate-45 transition-transform duration-250" />
                            ) : (
                                <Moon size={20} className="text-indigo-500 group-hover:-rotate-12 transition-transform duration-250" />
                            )}
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="sm:hidden p-1.25 lg:px-2.5 text-slate-500 cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                {/* Search Input */}
                <div className="flex-none p-2.5 lg:p-5 lg:pb-3.5 bg-white-bg dark:bg-dark-bg transition-all duration-250">
                    <div className="mx-auto px-2.5 py-1.25 lg:pl-5 flex items-center bg-slate-50 dark:bg-surface/50 rounded-xl border border-slate-200 dark:border-surface focus-within:border-indigo-500 transition-all duration-250">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="flex-1 bg-transparent border-none outline-none placeholder:text-slate-500 text-surface dark:text-white"
                        />
                        <button className="p-1.25 lg:px-2.5 text-slate-500 hover:text-indigo-500 transition-all duration-250 cursor-pointer">
                            <Search size={20} />
                        </button>
                    </div>
                </div>
                {/* Chats List */}
                <div className="flex-1 flex flex-col min-h-0 h-screen bg-white-bg dark:bg-dark-bg overflow-hidden transition-all duration-250">
                    <div className="px-5 pb-1.25 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                {searchQuery ? 'Search Results' : 'Active Chats'}
                            </span>
                            <span className="px-1.5 py-0.5 text-rose-500 bg-rose-500/10 dark:text-indigo-500 dark:bg-indigo-500/10 text-[10px] rounded-full font-bold min-w-[20px] text-center">
                                {searchQuery ? searchResults.length : conversations.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsGrpModalOpen(true)}
                            className="px-3.5 py-2.5 flex items-center gap-1.25 bg-gradient-to-r from-indigo-500 to-rose-500 text-white rounded-lg hover:shadow-lg shadow-rose-500/10 transition-all duration-250 cursor-pointer"
                        >
                            <Users size={15} />
                            <span className="text-xs font-bold uppercase tracking-wide">New Group</span>
                        </button>
                    </div>
                    <div className="flex-1 px-5 py-2.5 space-y-1.25 overflow-y-auto custom-scrollbar">
                        {searchQuery ? (
                            // Search results section
                            searchResults.map((u: any) => (
                                <div
                                    key={u.id}
                                    onClick={() => {
                                        startChat(u.id, {
                                            onSuccess: (data: any) => {
                                                setSelectedChatId(data.id);
                                                setSearchQuery("");
                                                setIsSidebarOpen(false); // Close on mobile after selection
                                                createConversation(data, u.id);
                                            }
                                        });
                                    }}
                                    className="relative p-2.5 flex items-center gap-2.5 bg-slate-50 dark:bg-surface/50 hover:bg-gradient-to-r from-rose-100/50 to-indigo-100/50 dark:from-rose-500/5 dark:to-indigo-500/5 rounded-xl cursor-pointer border border-transparent hover:border-rose-100/50 dark:hover:border-rose-500/10 shadow-sm transition-all duration-250"
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-rose-500 text-white font-black rounded-xl shadow-xl shadow-rose-500/10">
                                            {u.avatar ? <img src={`${baseUrl}${u.avatar}`} className="w-full h-full object-cover rounded-xl" alt="" /> : u.username[0].toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1.25 overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-surface dark:text-white truncate">{u.displayname || u.username}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Conversations list section
                            conversations.map((chat: any) => {
                                const isPrivate = !chat.isGroup;
                                const otherUser = isPrivate ? chat.participants.find((p: any) => p.userId !== currentUser?.id)?.user : null;
                                const chatName = isPrivate ? (otherUser?.displayname || otherUser?.username) : chat.name;
                                const lastMsg = chat.lastMessage;
                                return (
                                    <div
                                        key={chat.id}
                                        onClick={() => {
                                            setSelectedChatId(chat.id);
                                            setIsSidebarOpen(false); // Close on mobile after selection
                                        }}
                                        className={cn(
                                            "relative p-2.5 flex items-center gap-2.5 bg-slate-50 dark:bg-surface/50 hover:bg-gradient-to-r from-rose-100/50 to-indigo-100/50 dark:from-rose-500/5 dark:to-indigo-500/5 rounded-xl cursor-pointer border border-transparent hover:border-rose-100/50 dark:hover:border-rose-500/10 shadow-sm transition-all duration-250",
                                            selectedChatId === chat.id && "bg-gradient-to-r from-rose-100/50 to-indigo-100/50 dark:from-rose-500/5 dark:to-indigo-500/5 border-rose-100/50 dark:border-rose-500/10 shadow-md"
                                        )}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-rose-500 text-white font-black rounded-xl shadow-xl shadow-rose-500/10">
                                                {isPrivate && otherUser?.avatar ? (
                                                    <img src={`${baseUrl}${otherUser.avatar}`} className="w-full h-full object-cover rounded-xl" alt="" />
                                                ) : (
                                                    chatName?.[0]?.toUpperCase() || "G"
                                                )}
                                            </div>
                                            {isPrivate && (
                                                <div className={cn(
                                                    "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white dark:border-dark-bg rounded-full",
                                                    otherUser?.isOnline ? "bg-green-500" : "bg-slate-400"
                                                )}></div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1.25 overflow-hidden">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-surface dark:text-white truncate">{chatName}</span>
                                                <span className="text-[10px] font-medium text-slate-500">
                                                    {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {(() => {
                                                    const typingUsernames = Object.entries(typingUsers[chat.id] || {})
                                                        .filter(([username, isTyping]) => isTyping === true && username !== currentUser?.username)
                                                        .map(([username]) => username);

                                                    const isTyping = typingUsernames.length > 0;

                                                    const getDisplayName = (username: string) => {
                                                        const participant = chat.participants?.find((p: any) => p.user.username === username);
                                                        return participant?.user.displayname || username;
                                                    };

                                                    return isTyping ? (
                                                        <span className="font-bold text-rose-500 dark:text-indigo-500 animate-pulse">
                                                            {typingUsernames.length > 1
                                                                ? "Multiple people typing..."
                                                                : `${getDisplayName(typingUsernames[0])} is typing...`}
                                                        </span>
                                                    ) : lastMsg ? (
                                                        <>
                                                            <span className="font-bold text-rose-500 dark:text-indigo-500">
                                                                {currentUser?.username === lastMsg.user?.username ? "You" :
                                                                    isPrivate ? lastMsg.user?.displayname?.split(" ")[0] :
                                                                        lastMsg.user?.displayname
                                                                }: {" "}
                                                            </span>
                                                            {lastMsg.content}
                                                        </>
                                                    ) : (
                                                        <span className="italic">No messages yet</span>
                                                    );
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                {/* User Profile Footer */}
                <div className="flex-none px-2.5 py-2.5 lg:px-5 bg-white-bg dark:bg-dark-bg border-t border-slate-200 dark:border-surface transition-all duration-250">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.25 flex-1 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-surface/50 rounded-xl hover:shadow-xl border border-transparent hover:border-slate-200 dark:hover:border-surface transition-all duration-250 cursor-pointer"
                            onClick={() => setIsMyProfileOpen(true)}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-rose-500 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-500/20 overflow-hidden">
                                    {currentUser?.avatar ? (
                                        <img src={`${baseUrl}${currentUser.avatar}`} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        currentUser?.username?.[0]?.toUpperCase() || "U"
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-dark-bg rounded-full"></div>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-surface dark:text-white text-base font-bold truncate">
                                    {currentUser?.displayname || `@${currentUser?.username}`}
                                </h2>
                                <p className="text-indigo-500 text-xs truncate">
                                    {currentUser?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => logout()}
                            disabled={isLoggingOut}
                            className="px-2.5 py-2.5 flex-none text-slate-500 hover:text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/10 rounded-xl transition-all duration-250 cursor-pointer disabled:opacity-50"
                        >
                            {isLoggingOut ? <Loader2 size={25} className="animate-spin" /> : <LogOut size={25} />}
                        </button>
                    </div>
                </div>
            </aside>
            <CreateGroupModal isOpen={isGrpModalOpen} onClose={() => setIsGrpModalOpen(false)} />
            <MyProfileModal isOpen={isMyProfileOpen} onClose={() => setIsMyProfileOpen(false)} user={currentUser} />
        </>
    );
};

export default ChatSidebar;