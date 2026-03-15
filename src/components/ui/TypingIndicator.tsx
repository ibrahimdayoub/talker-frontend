interface TypingIndicatorProps {
    conversation?: any;
    activeTypingUsers: Array<{
        username: string;
        displayName?: string;
        avatar?: string;
    }>;
    otherParticipant?: any;
    baseUrl: string;
}

const TypingIndicator = ({
    conversation,
    activeTypingUsers,
    otherParticipant,
    baseUrl
}: TypingIndicatorProps) => {
    if (!activeTypingUsers?.length) return null;

    const getUserDisplay = () => {
        if (conversation?.isGroup) {
            return {
                avatar: activeTypingUsers[0]?.avatar,
                initial: activeTypingUsers[0]?.username?.[0]?.toUpperCase() || '👤',
                name: activeTypingUsers[0]?.displayName || activeTypingUsers[0]?.username
            };
        } else {
            return {
                avatar: otherParticipant?.avatar,
                initial: otherParticipant?.username?.[0]?.toUpperCase() || '👤',
                name: otherParticipant?.displayname || otherParticipant?.username
            };
        }
    };

    const userDisplay = getUserDisplay();

    return (
        <div className="flex items-end gap-2.5 max-w-[75%] sm:max-w-[50%]">
            {/* Avatar */}
            <div className="w-10 h-10 flex-none flex items-center justify-center bg-gradient-to-tr from-rose-200/50 to-rose-500/50 dark:from-indigo-500/25 dark:to-indigo-800/50 text-rose-400 dark:text-indigo-200 text-sm font-black border border-slate-200/50 dark:border-indigo-800/50 rounded-lg overflow-hidden">
                {userDisplay.avatar ? (
                    <img
                        src={`${baseUrl}${userDisplay.avatar}`}
                        className="w-full h-full object-cover"
                        alt={userDisplay.name || 'User'}
                    />
                ) : (
                    <span className="text-lg font-black">
                        {userDisplay.initial}
                    </span>
                )}
            </div>
            {/* Typing Bubble */}
            <div className="relative p-2.5 lg:p-3.5 bg-white-bg dark:bg-surface border border-slate-200 dark:border-slate-500/50 rounded-2xl rounded-bl-none">
                {/* User Name */}
                {conversation?.isGroup && (
                    <p className="text-[12px] font-bold text-rose-500 dark:text-indigo-500 uppercase mb-1">
                        {userDisplay.name}
                        {activeTypingUsers.length > 1 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 lowercase ml-1">
                                +{activeTypingUsers.length - 1} more
                            </span>
                        )}
                    </p>
                )}
                {/* Dots */}
                <div className="p-1.25 flex gap-1">
                    <span className="w-1 h-1 bg-rose-500 dark:bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-rose-500 dark:bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-rose-500 dark:bg-indigo-500 rounded-full animate-bounce"></span>
                </div>
            </div>
        </div>
    );
};

export default TypingIndicator;