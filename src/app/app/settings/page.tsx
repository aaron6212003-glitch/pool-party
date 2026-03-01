"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, Button, Input, SectionTitle, GlassCard, Badge, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, User, Bell, Shield, ChevronRight, Moon, UserCircle, Settings, Mail, RefreshCw, Smartphone, Camera, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [newName, setNewName] = useState('')
    const [newAvatar, setNewAvatar] = useState('')
    const [user, setUser] = useState<any>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
            setNewName(data.user?.user_metadata?.full_name || '')
            setNewAvatar(data.user?.user_metadata?.avatar_url || '')
        })
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: newName,
                    avatar_url: newAvatar
                }
            })
            if (error) throw error
            toast.success("Profile updated!")
            setShowEdit(false)
            router.refresh()
            // Update local state
            setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: newName, avatar_url: newAvatar } })
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user found")

            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Math.random()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            // Upload the file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                if (uploadError.message.includes("Bucket not found")) {
                    toast.error("Storage Error: 'avatars' bucket must be created in Supabase.")
                    return
                }
                throw uploadError
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setNewAvatar(publicUrl)
            toast.success("Photo uploaded!")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleHardReset = async () => {
        if (confirm("Are you sure? This will delete all your shift entries.")) {
            setLoading(true)
            try {
                const { error } = await supabase.from('shift_entries').delete().eq('user_id', user?.id)
                if (error) throw error
                toast.success("All data cleared successfully.")
            } catch (e: any) {
                toast.error(e.message)
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <div className="p-6 space-y-8 animate-in pb-32 bg-black min-h-screen">
            <header className="space-y-1 mt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity & OS</p>
                <h1 className="text-4xl font-black font-outfit text-white tracking-tighter">Settings.</h1>
            </header>

            {/* Profile Header */}
            <section className="space-y-4">
                <Card className="flex items-center gap-6 !p-8 bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <UserCircle className="w-48 h-48 text-primary" />
                    </div>

                    <div className="relative">
                        <div className="w-20 h-20 rounded-[2rem] bg-black ring-4 ring-primary/10 overflow-hidden shrink-0 shadow-2xl">
                            <img
                                src={user?.user_metadata?.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            onClick={() => setShowEdit(true)}
                            className="absolute -right-1 -bottom-1 w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-1.5 relative z-10">
                        <h3 className="text-2xl font-black font-outfit text-white tracking-tighter">{user?.user_metadata?.full_name ?? 'Server'}</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{user?.email}</p>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black tracking-widest px-3 py-1 mt-1">PRO LEVEL OWNER</Badge>
                    </div>
                </Card>
            </section>

            {/* Account Settings */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-black font-outfit text-lg text-white tracking-tight">Personal</h2>
                    <Badge className="bg-zinc-900 text-zinc-600 border-none">Active Session</Badge>
                </div>

                <Card className="p-2 bg-zinc-900/40 border-white/5 rounded-[2rem] shadow-xl overflow-hidden">
                    <div className="space-y-1">
                        <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-2xl transition-all group" onClick={() => setShowEdit(true)}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black font-outfit text-white tracking-tight">Edit Profile</p>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Name & Photo</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-primary transition-colors" />
                        </div>

                        <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-2xl transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-secondary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black font-outfit text-white tracking-tight">Privacy Settings</p>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Ranking Opt-in</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 bg-primary rounded-full relative shadow-inner">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                            </div>
                        </div>

                        <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-2xl transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-orange-400">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black font-outfit text-white tracking-tight">Notifications</p>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Shift Reminders</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                </Card>
            </section>

            {/* App Prefs */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-black font-outfit text-lg text-white tracking-tight">System</h2>
                    <Badge className="bg-zinc-900 text-zinc-600 border-none">Build 1.0.4</Badge>
                </div>

                <Card className="p-2 bg-zinc-900/40 border-white/5 rounded-[2rem] shadow-xl overflow-hidden">
                    <div className="space-y-1">
                        <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-2xl transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black font-outfit text-white tracking-tight">PWA Installation</p>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Ready to Install</p>
                                </div>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-none">Available</Badge>
                        </div>

                        <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-2xl transition-all group" onClick={handleHardReset}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-red-500">
                                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                                </div>
                                <div>
                                    <p className="text-sm font-black font-outfit text-red-500 tracking-tight">Hard Reset</p>
                                    <p className="text-[10px] text-zinc-800 font-black uppercase tracking-widest">Clear all data</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-900 group-hover:text-red-500 transition-colors" />
                        </div>
                    </div>
                </Card>
            </section>

            {/* Logout */}
            <footer className="pt-6 space-y-6">
                <Button variant="secondary" className="w-full py-6 rounded-[2rem] bg-red-500/5 border-red-500/10 text-red-500 font-black font-outfit group" onClick={handleSignOut}>
                    <div className="flex items-center justify-center gap-2">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Terminate Session
                    </div>
                </Button>
                <div className="text-center opacity-40">
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.5em]">Pool Party OS v1.0.4 - Built in Paradise</p>
                </div>
            </footer>

            {/* Edit Modal / Photo Picker */}
            <AnimatePresence>
                {showEdit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm"
                        >
                            <Card className="!p-10 shadow-3xl bg-zinc-900/90 border-white/10 rounded-[3rem] space-y-8">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black font-outfit text-white tracking-tighter">Edit Identity.</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Profiles update in real-time</p>
                                    </div>
                                    <button
                                        onClick={() => setShowEdit(false)}
                                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl">
                                        <div className="w-32 h-32 bg-black ring-4 ring-primary/10 transition-all group-hover:scale-105 duration-500">
                                            <img src={newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            className="text-[10px] px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 border-none flex items-center gap-2"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ImageIcon className="w-3 h-3" />
                                            Upload Photo
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="text-[10px] px-4 py-2 rounded-xl bg-white/5 text-zinc-500 border-none flex items-center gap-2"
                                            onClick={() => setNewAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`)}
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Random Avatar
                                        </Button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                    />
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <Input
                                        label="Full Display Name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Aaron Stephens"
                                        className="bg-black text-lg py-5"
                                    />

                                    <div className="pt-2">
                                        <Button type="submit" className="w-full py-6 text-xl rounded-2xl shadow-2xl shadow-primary/20" disabled={loading || uploading}>
                                            {loading ? "Updating..." : "Save Identity"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
