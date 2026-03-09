"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Camera, Mail, User, AlignLeft, Loader2, ScreenShare, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserApi } from "@/lib/hooks/useUser";

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// --- Validation Schema ---
const updateProfileSchema = z.object({
    displayname: z
        .string()
        .min(3, "Display name must be at least 3 characters")
        .max(50, "Display name is too long")
        .optional()
        .or(z.literal("")),
    bio: z
        .string()
        .max(255, "Bio cannot exceed 255 characters")
        .optional()
        .or(z.literal("")),
});

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

interface MyProfileProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function MyProfile({ user, isOpen, onClose }: MyProfileProps) {
    // --- API Hooks from Factory ---
    const { useGetProfile, useUpdateProfile, useUpdateAvatar } = useUserApi();

    // Instance of hooks
    const { refetch: syncProfile, isRefetching: isSyncing } = useGetProfile("me");
    const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
    const { mutate: updateAvatar, isPending: isUpdatingAvatar } = useUpdateAvatar();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // --- Form Configuration ---
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset
    } = useForm<UpdateProfileFormValues>({
        resolver: zodResolver(updateProfileSchema),
        values: {
            displayname: user?.displayname || "",
            bio: user?.bio || ""
        }
    });

    // --- Handlers ---

    /**
     * Handles avatar selection and instant upload
     */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create local preview
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            // Trigger mutation
            updateAvatar(file);
        }
    };

    /**
     * Handles text profile updates
     */
    const onSubmit = (data: UpdateProfileFormValues) => {
        updateProfile(data, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    // --- Cleanup & Rendering Logic ---

    useEffect(() => {
        // Reset preview when the real avatar from server is updated
        setPreviewUrl(null);
    }, [user?.avatar]);

    if (!isOpen || !user) return null;

    // Build image URL carefully
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
    const displayImage = previewUrl || (user.avatar ? `${baseUrl}${user.avatar}` : null);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-400/50 dark:bg-black/50 backdrop-blur-md" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative w-full max-w-md space-y-5 bg-white dark:bg-[#0f172a] rounded-3xl shadow-3xl border border-slate-200 dark:border-slate-600 overflow-hidden duration-300">

                {/* Header / Cover Area */}
                <div className="relative h-25 bg-gradient-to-r from-pink-500/25 dark:from-pink-500/10 to-purple-500/25 dark:to-purple-500/10 border-b border-slate-200 dark:border-slate-600">
                    {/* Sync Button */}
                    <button
                        onClick={() => syncProfile()}
                        disabled={isSyncing}
                        className="absolute top-5 left-5 p-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600/50 text-slate-600 dark:text-slate-400 rounded-full shadow-xl transition-all z-20 cursor-pointer group"
                    >
                        <RefreshCcw
                            size={20}
                            className={cn("duration-300", isSyncing ? "animate-spin" : "group-hover:rotate-90")}
                        />
                    </button>
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600/50 text-slate-600 dark:text-slate-400 rounded-full shadow-xl transition-all z-20 cursor-pointer group">
                        <X size={20} className="group-hover:rotate-90 duration-300" />
                    </button>
                </div>

                {/* Avatar Section */}
                <div className="relative flex justify-center -mt-17.5">
                    <div className="relative group">
                        <div className="w-25 h-25 p-1 bg-gradient-to-br from-purple-500 to-orange-500 rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-105 overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center bg-white dark:bg-[#0f172a] text-6xl font-bold text-slate-800 dark:text-white rounded-2xl overflow-hidden">
                                {displayImage ? (
                                    <img
                                        src={displayImage}
                                        alt="Avatar"
                                        className="w-full xxxh-full rounded-2xl object-cover"
                                    />
                                ) : (
                                    user.username?.[0]?.toUpperCase()
                                )}
                            </div>
                            {/* Avatar Loading Overlay */}
                            {isUpdatingAvatar && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                                    <Loader2 className="text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Hidden File Input */}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-3.5 -right-3.5 p-2 bg-white dark:bg-slate-800/50 backdrop-blur-lg rounded-lg shadow-lg border border-slate-200 dark:border-slate-800/50 text-orange-600 hover:text-purple-600 group-hover:translate-1 transition-all duration-500 cursor-pointer"
                        >
                            <Camera size={20} />
                        </button>
                    </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:px-10 sm:pb-7.5 space-y-5">
                    {/* Readonly Info */}
                    <div className="flex flex-wrap gap-2.5">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <Mail size={15} className="text-orange-600" />Email:
                        </div>
                        <span className="border px-2.5 py-1.25 text-sm font-normal text-slate-600 dark:text-slate-400 normal-case bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-lg">{user.email}</span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <User size={15} className="text-purple-600" />Username:
                        </div>
                        <span className="border px-2.5 py-1.25 text-sm font-normal text-slate-600 dark:text-slate-400 normal-case bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-lg">{user.username}</span>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <ScreenShare size={15} className="text-orange-600" /> Display Name
                        </label>
                        <input
                            {...register("displayname")}
                            placeholder="How should we call you?"
                            className="w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2 border-slate-200 dark:border-slate-800 focus:ring-orange-600/25 focus:border-orange-600"
                        />
                        {errors.displayname && <p className="text-red-500 text-xs mt-1 ml-1">{errors.displayname.message}</p>}
                    </div>

                    {/* Bio */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <AlignLeft size={15} className="text-purple-600" /> Bio
                        </label>
                        <textarea
                            {...register("bio")}
                            rows={3}
                            placeholder="Tell us about yourself..."
                            className="w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2 border-slate-200 dark:border-slate-800 focus:ring-purple-600/25 focus:border-purple-600"
                        />
                        {errors.bio && <p className="text-red-500 text-xs mt-1 ml-1">{errors.bio.message}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isUpdatingProfile || !isDirty}
                        className={cn(
                            "w-full py-2.5 flex items-center justify-center gap-2.5 text-white font-bold text-lg tracking-wider rounded-xl shadow-xl transform transition-all active:scale-95 group",
                            (isUpdatingProfile || !isDirty)
                                ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-600 to-orange-600 hover:shadow-purple-600/50 cursor-pointer shadow-purple-600/25"
                        )}
                    >
                        {isUpdatingProfile ? (
                            <><Loader2 className="animate-spin" size={25} /> Updating...</>
                        ) : "Update Profile"}
                    </button>
                </form>
            </div>
        </div>
    );
}