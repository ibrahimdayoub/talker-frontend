"use client";

import { useEffect, useState } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatBox from '@/components/ChatBox';

export default function ChatPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // نغيرها لتستقبل id المحادثة (رقم أو null)
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <div className="flex h-screen overflow-hidden transition-colors duration-300">
            {/* نمرر دالة التغيير للسايد بار */}
            <ChatSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                selectedChatId={selectedChatId}
                setSelectedChatId={setSelectedChatId}
            />
            {/* نمرر الـ id للـ ChatBox */}
            <ChatBox
                selectedChatId={selectedChatId}
                setIsSidebarOpen={setIsSidebarOpen}
            />
        </div>
    );
}