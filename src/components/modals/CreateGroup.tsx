"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useQueryClient } from '@tanstack/react-query';
import { X, Check, Loader2, ScreenShare } from "lucide-react";
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserApi } from "@/lib/hooks/useUser";
import { useConversationApi } from "@/lib/hooks/useConversation";
import { useSocket } from "@/lib/hooks/useSocket";
import { cn } from "@/lib/utils";

interface CreateGroupProps {
    isOpen: boolean;
    onClose: () => void;
}

const createGroupSchema = z.object({
    name: z.string().min(3, "Group name must be at least 3 characters"),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export default function CreateGroup({ isOpen, onClose }: CreateGroupProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const queryClient = useQueryClient();
    const { useSearch } = useUserApi();
    const { useCreateGroupChat } = useConversationApi();
    const { createGroup: socketCreateGroup } = useSocket();

    const { data: users = [], isLoading: isLoadingUsers } = useSearch("");
    const { mutate: createGroup, isPending: isSubmitting } = useCreateGroupChat();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<CreateGroupFormValues>({
        resolver: zodResolver(createGroupSchema),
    });

    const toggleUser = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    const onSubmit = (data: CreateGroupFormValues) => {
        if (selectedIds.length === 0) {
            toast.error("Please select at least one participant");
            return;
        }

        if (socketCreateGroup) {
            socketCreateGroup(data.name, selectedIds, (newGroup) => {
                queryClient.setQueryData(['conversations'], (oldData: any[]) => {
                    if (!oldData) return [newGroup];
                    const exists = oldData.some(c => c.id === newGroup.id);
                    return exists ? oldData : [newGroup, ...oldData];
                });
            });

            reset();
            setSelectedIds([]);
            onClose();
            toast.success("Group created successfully!");
        } else {
            // Fallback to API if socket not available
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
        }
    };

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-400/50 dark:bg-black/50 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-md space-y-3.5 bg-white-bg dark:bg-dark-bg rounded-3xl shadow-3xl border border-slate-200 dark:border-slate-500 overflow-hidden duration-250">
                {/* Cover */}
                <div className="relative h-25 p-5 flex items-center justify-between bg-gradient-to-r from-rose-500/25 dark:from-rose-500/10 to-indigo-500/25 dark:to-indigo-500/10 border-b border-slate-200 dark:border-slate-500">
                    <h3 className="text-2xl font-black text-surface dark:text-white">New Community</h3>
                    <button onClick={onClose} className="p-2 bg-white-bg dark:bg-surface/50 border border-slate-200 dark:border-slate-500/50 text-slate-500 dark:text-slate-400 rounded-full shadow-xl transition-all duration-250 z-20 cursor-pointer group">
                        <X size={20} className="group-hover:rotate-90 duration-250" />
                    </button>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:px-7.5 sm:pb-7.5 space-y-5">
                    {/* Group Name */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <ScreenShare size={15} className="text-rose-500" /> Group Name
                        </label>
                        <input
                            {...register("name")}
                            placeholder="The Friends"
                            className={cn(
                                "w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all duration-250 bg-slate-100 dark:bg-surface/50 text-surface dark:text-white focus:ring-2",
                                errors.name
                                    ? "border-red-500 focus:ring-transparent"
                                    : "border-slate-200 dark:border-surface focus:ring-rose-500/25 focus:border-rose-500"
                            )}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>}
                    </div>
                    {/* Avilable Users */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Select Participants</h4>
                            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">({selectedIds.length})</h4>
                        </div>
                        <div className="max-h-75 pr-2.5 overflow-y-auto custom-scrollbar space-y-2.5">
                            {isLoadingUsers ? (
                                <div className="py-5 flex flex-col items-center justify-center gap-2.5 text-slate-500 dark:text-slate-400">
                                    <Loader2 className="animate-spin" size={35} />
                                    <p className="text-sm tracking-wides">Loading Users...</p>
                                </div>
                            ) : (
                                users.map((user: any) => (
                                    <div key={user.id} className="p-2.5 flex justify-between items-center bg-slate-100 dark:bg-surface/50 rounded-xl border border-slate-200 dark:border-surface group duration-250">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 flex justify-center items-center bg-rose-500/5 text-rose-500 border border-slate-200 dark:border-surface group-hover:border-rose-500/50 rounded-lg shadow-lg duration-250 uppercase font-bold">
                                                {
                                                    user?.avatar
                                                        ? <img src={`${baseUrl}${user.avatar}`} className="w-full h-full object-cover rounded-lg" />
                                                        : user?.username?.[0]
                                                }
                                            </div>
                                            <div className="overflow-hidden space-y-0.5">
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{user.displayname}</p>
                                                <p className="text-sm text-surface dark:text-slate-200 truncate">@{user.username}</p>
                                            </div>
                                        </div>
                                        <div onClick={() => toggleUser(user.id)} className={cn("w-7.5 h-7.5 flex items-center justify-center rounded-lg border duration-250 cursor-pointer", selectedIds.includes(user.id) ? "bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/25" : "border-slate-200 dark:border-slate-500")}>
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
                            "w-full py-2.5 flex items-center justify-center gap-2.5 text-white font-bold text-lg tracking-wider rounded-xl shadow-xl transform transition-all duration-250 active:scale-95 group",
                            isSubmitting
                                ? "bg-indigo-500 dark:bg-indigo-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-500 to-rose-500 hover:shadow-indigo-500/50 cursor-pointer shadow-indigo-500/25"
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