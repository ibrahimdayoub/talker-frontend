"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Check, Loader2, ScreenShare } from "lucide-react";
import { useAuthStore } from '@/store/useAuthStore';
import { useUserApi } from "@/lib/hooks/useUser"; // استيراد الهوك الحقيقي

import { cn } from "@/lib/utils";
import { useConversationApi } from "@/lib/hooks/useConversation";
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from "react-hot-toast";

// --- Validation Schema ---
const createGroupSchema = z.object({
    name: z.string().min(3, "Group name must be at least 3 characters"),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

interface CreateGroupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateGroup({ isOpen, onClose }: CreateGroupProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const { user: currentUser } = useAuthStore();

    // --- API Hooks ---
    const { useCreateGroupChat } = useConversationApi();
    const { useSearch } = useUserApi(); // استخدام هوك البحث/الجلب

    const { mutate: createGroup, isPending: isSubmitting } = useCreateGroupChat();

    // جلب المستخدمين: ببعت string فاضي ليرجعلي الكل، والـ enabled مربوط بـ isOpen
    const { data: users = [], isLoading: isLoadingUsers } = useSearch("");


    console.log("Usssers", users)

    // --- Form Configuration ---
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<CreateGroupFormValues>({
        resolver: zodResolver(createGroupSchema),
    });

    if (!isOpen) return null;

    const toggleUser = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    const onSubmit = (data: CreateGroupFormValues) => {
        if (selectedIds.length === 0) {
            toast.error("Please select at least one participant");
            return;
        }

        createGroup({
            name: data.name,
            participants: selectedIds
        }, {
            onSuccess: () => {
                reset();
                setSelectedIds([]);
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-400/50 dark:bg-black/50 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-md space-y-3.5 bg-white dark:bg-[#0f172a] rounded-3xl shadow-3xl border border-slate-200 dark:border-slate-600 overflow-hidden duration-300">
                {/* Cover */}
                <div className="relative h-25 p-5 flex items-center justify-between bg-gradient-to-r from-pink-500/25 dark:from-pink-500/10 to-purple-500/25 dark:to-purple-500/10 border-b border-slate-200 dark:border-slate-600">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">New Community</h3>
                    <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600/50 text-slate-600 dark:text-slate-400 rounded-full shadow-xl transition-all z-20 cursor-pointer group">
                        <X size={20} className="group-hover:rotate-90 duration-300" />
                    </button>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:px-10 sm:pb-7.5 space-y-5">
                    {/* Group Name */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <ScreenShare size={15} className="text-orange-600" /> Group Name
                        </label>
                        <input
                            {...register("name")}
                            placeholder="The Friends"
                            className={cn(
                                "w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2",
                                errors.name
                                    ? "border-red-500 focus:ring-transparent"
                                    : "border-slate-200 dark:border-slate-800 focus:ring-orange-600/25 focus:border-orange-600"
                            )}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>}
                    </div>
                    {/* Avilable Users */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Select Participants</h4>
                            <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400">({selectedIds.length})</h4>
                        </div>
                        <div className="max-h-75 pr-2.5 overflow-y-auto custom-scrollbar space-y-2.5">
                            {isLoadingUsers ? (
                                <div className="py-5 flex flex-col items-center justify-center gap-2.5 text-slate-600 dark:text-slate-400">
                                    <Loader2 className="animate-spin" size={35} />
                                    <p className="text-sm tracking-wides">Loading Users...</p>
                                </div>
                            ) : (
                                users.map((user: any) => (
                                    <div key={user.id} className="p-3.5 flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 group duration-300">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 p-2 flex justify-center items-center bg-orange-500/5 text-orange-500 border border-slate-200 dark:border-slate-800 group-hover:border-orange-500/50 rounded-lg shadow-lg duration-300 uppercase font-bold">
                                                {user.username?.[0]}
                                            </div>
                                            <div className="overflow-hidden space-y-0.5">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{user.displayname || user.username}</p>
                                                <p className="text-sm text-slate-800 dark:text-slate-200 truncate">@{user.email}</p>
                                            </div>
                                        </div>

                                        <div onClick={() => toggleUser(user.id)} className={cn("w-7.5 h-7.5 flex items-center justify-center rounded-lg border duration-300 cursor-pointer", selectedIds.includes(user.id) ? "bg-purple-500 text-white border-transparent shadow-lg shadow-purple-500/25" : "border-slate-200 dark:border-slate-600")}>
                                            {selectedIds.includes(user.id) && <Check size={15} strokeWidth={3} />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                            "w-full py-2.5 flex items-center justify-center gap-2.5 text-white font-bold text-lg tracking-wider rounded-xl shadow-xl transform transition-all active:scale-95 group",
                            isSubmitting
                                ? "bg-purple-600 dark:bg-purple-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-600 to-orange-600 hover:shadow-purple-600/50 cursor-pointer shadow-purple-600/25"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={25} />
                                Creating...
                            </>
                        ) : (
                            "Create Group"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}