"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Camera, Mail, User as UserIco, AlignLeft, Loader2, ScreenShare, RefreshCcw } from "lucide-react";
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from "@/lib/utils";
import { useUserApi } from "@/lib/hooks/useUser";
import { User } from "@/types/user.types";

interface MyProfileProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
}

const updateProfileSchema = z.object({
    displayname: z
        .string()
        .min(3, "Display name must be at least 3 characters")
        .max(50, "Display name is too long"),
    bio: z
        .string()
        .max(255, "Bio cannot exceed 255 characters")
        .optional()
});

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export default function MyProfile({ user, isOpen, onClose }: MyProfileProps) {
    const { useGetProfile, useUpdateProfile, useUpdateAvatar } = useUserApi();

    const { refetch: syncProfile, isRefetching: isSyncing } = useGetProfile("me");
    const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
    const { mutate: updateAvatar, isPending: isUpdatingAvatar } = useUpdateAvatar();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create local preview
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            updateAvatar(file);
        }
    };

    const onSubmit = (data: UpdateProfileFormValues) => {
        updateProfile(data, {
            onSuccess: () => {
                onClose();
            }
        });
    };

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
            <div className="relative w-full max-w-md space-y-5 bg-white-bg dark:bg-dark-bg rounded-3xl shadow-3xl border border-slate-200 dark:border-slate-500 overflow-hidden duration-250">
                {/* Header/Cover */}
                <div className="relative h-25 bg-gradient-to-r from-rose-500/25 dark:from-rose-500/10 to-indigo-500/25 dark:to-indigo-500/10 border-b border-slate-200 dark:border-slate-500">
                    {/* Sync Button */}
                    <button
                        onClick={() => syncProfile()}
                        disabled={isSyncing}
                        className="absolute top-5 left-5 p-2 bg-white-bg dark:bg-surface/50 border border-slate-200 dark:border-slate-500/50 text-slate-500 dark:text-slate-400 rounded-full shadow-xl transition-all duration-250 z-20 cursor-pointer group"
                    >
                        <RefreshCcw
                            size={20}
                            className={cn("duration-250", isSyncing ? "animate-spin" : "group-hover:rotate-90")}
                        />
                    </button>
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white-bg dark:bg-surface/50 border border-slate-200 dark:border-slate-500/50 text-slate-500 dark:text-slate-400 rounded-full shadow-xl transition-all duration-250 z-20 cursor-pointer group">
                        <X size={20} className="group-hover:rotate-90 duration-250" />
                    </button>
                </div>
                {/* Avatar Section */}
                <div className="relative flex justify-center -mt-17.5">
                    <div className="relative group">
                        <div className="w-25 h-25 p-1 bg-gradient-to-br from-indigo-500 to-rose-500 rounded-2xl shadow-2xl transition-transform duration-250 group-hover:scale-105 overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center bg-white-bg dark:bg-dark-bg text-6xl font-bold text-surface dark:text-white rounded-2xl overflow-hidden">
                                {displayImage ? (
                                    <img
                                        src={displayImage}
                                        alt="Avatar"
                                        className="w-full h-full rounded-2xl object-cover"
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
                            className="absolute -bottom-3.5 -right-3.5 p-2 bg-white-bg dark:bg-surface/50 backdrop-blur-lg rounded-lg shadow-lg border border-slate-200 dark:border-surface/50 text-rose-500 hover:text-indigo-500 group-hover:translate-1 transition-all duration-250 cursor-pointer"
                        >
                            <Camera size={20} />
                        </button>
                    </div>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-5 md:px-10 md:pb-7.5 space-y-5">
                    {/* Readonly Info */}
                    <div className="flex flex-wrap gap-2.5">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <Mail size={20} className="text-rose-500" />Email:
                        </div>
                        <span className="border px-2.5 py-1.25 text-sm font-normal text-slate-500 dark:text-slate-400 normal-case bg-slate-100 dark:bg-surface/50 border-slate-200 dark:border-surface rounded-lg">{user.email}</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <UserIco size={20} className="text-indigo-500" />Username:
                        </div>
                        <span className="border px-2.5 py-1.25 text-sm font-normal text-slate-500 dark:text-slate-400 normal-case bg-slate-100 dark:bg-surface/50 border-slate-200 dark:border-surface rounded-lg">@{user.username}</span>
                    </div>
                    {/* Display Name */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <ScreenShare size={20} className="text-rose-500" /> Display Name
                        </label>
                        <input
                            {...register("displayname")}
                            placeholder="How should we call you?"
                            className="w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all duration-250 bg-slate-100 dark:bg-surface/50 text-surface dark:text-white focus:ring-2 border-slate-200 dark:border-surface focus:ring-rose-500/25 focus:border-rose-500"
                        />
                        {errors.displayname && <p className="text-red-500 text-xs mt-1 ml-1">{errors.displayname.message}</p>}
                    </div>
                    {/* Bio */}
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1.25">
                            <AlignLeft size={20} className="text-indigo-500" /> Bio
                        </label>
                        <textarea
                            {...register("bio")}
                            rows={3}
                            placeholder="Tell us about yourself..."
                            className="w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all duration-250 bg-slate-100 dark:bg-surface/50 text-surface dark:text-white focus:ring-2 border-slate-200 dark:border-surface focus:ring-indigo-500/25 focus:border-indigo-500"
                        />
                        {errors.bio && <p className="text-red-500 text-xs mt-1 ml-1">{errors.bio.message}</p>}
                    </div>
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isUpdatingProfile || !isDirty}
                        className={cn(
                            "w-full py-2.5 flex items-center justify-center gap-2.5 text-white font-bold text-lg tracking-wider rounded-xl shadow-xl transform transition-all duration-250 active:scale-95 group",
                            (isUpdatingProfile || !isDirty)
                                ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-500 to-rose-500 hover:shadow-indigo-500/50 cursor-pointer shadow-indigo-500/25"
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