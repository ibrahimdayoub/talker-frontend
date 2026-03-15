"use client";

import { useEffect, useState } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatBox from '@/components/ChatBox';

export default function ChatPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

    const [mounted, setMounted] = useState(false);
    
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <div className="flex h-screen overflow-hidden transition-all duration-250">
            <ChatSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                selectedChatId={selectedChatId}
                setSelectedChatId={setSelectedChatId}
            />
            <ChatBox
                selectedChatId={selectedChatId}
                setIsSidebarOpen={setIsSidebarOpen}
            />
        </div>
    );
}