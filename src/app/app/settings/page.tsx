"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, Button, Input, SectionTitle, GlassCard, Badge, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, User, Bell, Shield, ChevronRight, Moon, UserCircle, Settings, Mail, RefreshCw, Smartphone, Camera, Image as ImageIcon, UserMinus, Lock, Sparkles, Zap, Crown, ReceiptText, Palmtree, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { setupNotifications } from '@/lib/notifications'
import ShiftWrap, { WrapTemplate } from '@/components/ShiftWrap'

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [newName, setNewName] = useState('')
    const [newAvatar, setNewAvatar] = useState('')
    const [user, setUser] = useState<any>(null)
    const [uploading, setUploading] = useState(false)
    const [shareToLeaderboard, setShareToLeaderboard] = useState(true)
    const [togglingShare, setTogglingShare] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [birthday, setBirthday] = useState('')
    const [workAnniversary, setWorkAnniversary] = useState('')
    const [bio, setBio] = useState('')
    const [phone, setPhone] = useState('')
    const [instagram, setInstagram] = useState('')
    const [favoriteSection, setFavoriteSection] = useState('')
    
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('app-theme') || 'blue'
        }
        return 'blue'
    })

    const [selectedTemplate, setSelectedTemplate] = useState<WrapTemplate>('obsidian')
    const [showWrapPreview, setShowWrapPreview] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUser(user)

            // Load avatar_url from profiles table (real source of truth, not JWT)
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, share_to_leaderboard, birthday, work_anniversary, bio, theme, phone, instagram, favorite_section, wrap_template')
                .eq('id', user.id)
                .single()

            if (profile) {
                setNewName(user?.user_metadata?.full_name || '')
                if (profile.avatar_url) setNewAvatar(profile.avatar_url)
                setBirthday(profile.birthday || '')
                setWorkAnniversary(profile.work_anniversary || '')
                setBio(profile.bio || '')
                setPhone(profile.phone || '')
                setInstagram(profile.instagram || '')
                setFavoriteSection(profile.favorite_section || '')
                if (profile.theme) {
                    setTheme(profile.theme)
                    localStorage.setItem('app-theme', profile.theme)
                }
                if (profile.wrap_template) {
                    setSelectedTemplate(profile.wrap_template as WrapTemplate)
                }
                if (profile.share_to_leaderboard !== null) {
                    setShareToLeaderboard(profile.share_to_leaderboard)
                }
            } else {
                await supabase.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    theme: theme
                })
            }
            setLoaded(true)
        }
        init()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const handleDeleteAccount = async () => {
        if (!confirm('🛑 WARNING: This will permanently delete your profile, shifts, and remove you from all parties. Your account cannot be recovered. Are you absolutely sure?')) return
        if (!confirm('FINAL WARNING: Type "DELETE" to confirm? This is permanent.')) return
        
        setLoading(true)
        try {
            await supabase.from('shift_entries').delete().eq('user_id', user.id)
            await supabase.from('group_members').delete().eq('user_id', user.id)
            await supabase.from('party_feed').delete().eq('user_id', user.id)
            await supabase.from('user_achievements').delete().eq('user_id', user.id)
            await supabase.from('profiles').delete().eq('id', user.id)
            
            await supabase.auth.signOut()
            toast.success('Account and data deleted.')
            router.push('/')
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!loaded || !user) return toast.error("Profile not loaded yet.")

        setLoading(true)
        try {
            const { error: authErr } = await supabase.auth.updateUser({
                data: { full_name: newName, avatar_url: newAvatar }
            })
            if (authErr) throw authErr

            const { error: profileErr } = await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                avatar_url: newAvatar,
                share_to_leaderboard: shareToLeaderboard,
                birthday,
                work_anniversary: workAnniversary,
                bio,
                phone,
                theme,
                wrap_template: selectedTemplate
            })
            if (profileErr) throw profileErr

            await supabase.from('group_members').update({ display_name: newName }).eq('user_id', user.id)

            toast.success('Profile updated!')
            setShowEdit(false)

            const { data: { user: freshUser } } = await supabase.auth.getUser()
            if (freshUser) setUser(freshUser)
        } catch (e: any) {
            console.error('Update error:', e)
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setUploading(true)
        try {
            const blob = await new Promise<Blob>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (ev) => {
                    const img = new window.Image()
                    img.onload = () => {
                        const SIZE = 200
                        const canvas = document.createElement('canvas')
                        canvas.width = SIZE
                        canvas.height = SIZE
                        const ctx = canvas.getContext('2d')!
                        const min = Math.min(img.width, img.height)
                        const sx = (img.width - min) / 2
                        const sy = (img.height - min) / 2
                        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE)
                        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Compression failed')), 'image/jpeg', 0.80)
                    }
                    img.onerror = reject
                    img.src = ev.target?.result as string
                }
                reader.onerror = reject
                reader.readAsDataURL(file)
            })

            let finalUrl: string
            const filePath = `${user.id}/avatar.jpg`
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' })

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
                finalUrl = `${publicUrl}?t=${Date.now()}`
            } else {
                finalUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onload = (ev) => resolve(ev.target?.result as string)
                    reader.readAsDataURL(blob)
                })
            }

            const { error: profileErr } = await supabase.from('profiles')
                .update({ avatar_url: finalUrl })
                .eq('id', user.id)

            if (profileErr) throw profileErr

            setNewAvatar(finalUrl)
            toast.success('Photo saved! 📸')
        } catch (error: any) {
            console.error('Photo upload error:', error)
            toast.error(error.message || 'Could not upload photo.')
        } finally {
            setUploading(false)
        }
    }

    const formatDateInput = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 8)
        let formatted = cleaned
        if (cleaned.length > 2 && cleaned.length <= 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`
        } else if (cleaned.length > 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`
        }
        return formatted
    }

    const formatPhoneInput = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 10)
        let formatted = cleaned
        if (cleaned.length > 3 && cleaned.length <= 6) {
            formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
        } else if (cleaned.length > 6) {
            formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
        }
        return formatted
    }

    useEffect(() => {
        if (!loaded || !user) return

        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('app-theme', theme)

        const syncThemeAndTemplate = async () => {
            const { error } = await supabase.from('profiles')
                .update({ theme, wrap_template: selectedTemplate })
                .eq('id', user.id)
            if (error) console.error('Failed to sync profile preferences:', error)
        }
        syncThemeAndTemplate()
    }, [theme, selectedTemplate, loaded, user?.id])

    const THEMES = [
        { id: 'blue', color: '#007AFF', name: 'Original' },
        { id: 'emerald', color: '#10B981', name: 'Emerald' },
        { id: 'rose', color: '#F43F5E', name: 'Rose' },
        { id: 'amber', color: '#F59E0B', name: 'Amber' },
        { id: 'purple', color: '#A855F7', name: 'Purple' },
        { id: 'indigo', color: '#6366F1', name: 'Indigo' },
        { id: 'midnight', color: '#334155', name: 'Midnight' },
    ]

    const WRAP_TEMPLATES: { id: WrapTemplate, name: string, icon: any, color: string, desc: string }[] = [
        { id: 'obsidian', name: 'Obsidian', icon: Sparkles, color: '#007AFF', desc: 'Premium Glass' },
        { id: 'cyber', name: 'Cyberpunk', icon: Zap, color: '#f0abfc', desc: 'Neon Edge' },
        { id: 'luxe', name: 'Luxe Gold', icon: Crown, color: '#fbbf24', desc: 'Old Money' },
        { id: 'thermal', name: 'Minimalist', icon: ReceiptText, color: '#000000', desc: 'Clean Thermal' },
        { id: 'sunset', name: 'Vaporwave', icon: Palmtree, color: '#fb7185', desc: 'Retro Vibe' },
    ]

    const exampleShiftData = {
        totalEarned: 342,
        tipsPerHour: 48,
        netSales: 1650,
        hours: 6.5,
        ccTips: 285,
        cashTips: 45,
        tipOut: 82.50,
        basePay: 94.25,
        grade: 'A+',
        gradeColor: '#10B981',
        date: new Date(),
        shiftType: 'Dinner',
    }

    return (
        <div className="p-6 pt-safe space-y-8 animate-in pb-32 bg-black min-h-screen">
            <header className="space-y-1 mt-6">
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
                                src={newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`
                                }}
                            />
                        </div>
                        <button
                            onClick={() => setShowEdit(true)}
                            className="absolute -right-1 -bottom-1 w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-1.5 relative z-10 flex-1">
                        <h3 className="text-2xl font-black font-outfit text-white tracking-tighter">{newName || user?.user_metadata?.full_name || 'Server'}</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{user?.email}</p>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black tracking-widest px-3 py-1 mt-1 inline-block">🍽️ Server</Badge>
                        {favoriteSection && <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-1">Sect: {favoriteSection}</p>}
                    </div>
                </Card>
            </section>

            {/* Shift Wrap Customization */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-black font-outfit text-lg text-white tracking-tight">Wrap Customization</h2>
                    <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest px-3">Free for now</Badge>
                </div>

                <Card className="!p-8 bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-xl space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-black font-outfit text-white">Visual Template</p>
                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Post-shift identity style</p>
                        </div>
                        <Button 
                            variant="secondary" 
                            className="text-[9px] px-5 py-2.5 rounded-xl border-none bg-white/5 text-zinc-400 font-black uppercase flex items-center gap-2"
                            onClick={() => setShowWrapPreview(true)}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Live Preview
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {WRAP_TEMPLATES.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id)}
                                className={cn(
                                    "flex items-center justify-between p-5 rounded-3xl border-2 transition-all group overflow-hidden relative",
                                    selectedTemplate === t.id 
                                        ? "bg-primary/10 border-primary ring-4 ring-primary/5" 
                                        : "bg-black/20 border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                        selectedTemplate === t.id ? "bg-primary text-white scale-110" : "bg-zinc-900 text-zinc-600"
                                    )}>
                                        <t.icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className={cn("text-base font-black font-outfit tracking-tight", selectedTemplate === t.id ? "text-white" : "text-zinc-500")}>{t.name}</p>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t.desc}</p>
                                    </div>
                                </div>
                                {selectedTemplate === t.id && (
                                    <div className="w-2.5 h-2.5 bg-primary rounded-full relative z-10 ring-4 ring-primary/20" />
                                )}
                                
                                {/* Background design flair based on theme */}
                                <div className={cn(
                                    "absolute top-0 right-0 py-6 px-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity",
                                    selectedTemplate === t.id && "opacity-[0.1]"
                                )}>
                                    <t.icon className="w-32 h-32" />
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
            </section>

            {/* App Aesthetics */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-black font-outfit text-lg text-white tracking-tight">App Aesthetics</h2>
                    <Badge className="bg-zinc-900 text-zinc-600 border-none">Visual Kit</Badge>
                </div>

                <Card className="!p-6 bg-zinc-900/40 border-white/5 rounded-3xl shadow-xl">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-primary">
                                <Settings className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-black font-outfit text-white leading-tight">Brand Color</p>
                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-none">Global Accent Color</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={cn(
                                        "w-full aspect-square rounded-xl border-2 transition-all flex items-center justify-center tap-highlight-transparent",
                                        theme === t.id ? "border-white ring-4 ring-white/10" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: t.color }}
                                >
                                    {theme === t.id && <div className="w-2 h-2 rounded-full bg-white shadow-lg" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>
            </section>

            {/* Personal Sections */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-black font-outfit text-lg text-white tracking-tight">Permissions & HUD</h2>
                </div>

                <Card className="p-2 bg-zinc-900/40 border-white/5 rounded-[2rem] shadow-xl overflow-hidden">
                    <div className="space-y-1">
                        <div
                            className="p-5 flex items-center justify-between hover:bg-white/5 rounded-2xl transition-all cursor-pointer"
                            onClick={async () => {
                                if (togglingShare) return
                                setTogglingShare(true)
                                const next = !shareToLeaderboard
                                try {
                                    const { error } = await supabase
                                        .from('profiles')
                                        .update({ share_to_leaderboard: next })
                                        .eq('id', user.id)
                                    if (error) throw error

                                    setShareToLeaderboard(next)
                                    toast.success(next ? 'Your stats are now visible to your parties' : 'Your stats are now hidden from parties')
                                } catch (e: any) {
                                    toast.error(e.message)
                                } finally {
                                    setTogglingShare(false)
                                }
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-secondary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black font-outfit text-white tracking-tight">Ranking Visibility</p>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                                        {shareToLeaderboard ? 'Party can see your stats' : 'Your stats are hidden'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${shareToLeaderboard ? 'bg-primary' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${shareToLeaderboard ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        <div 
                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-2xl transition-all group"
                            onClick={() => {
                                setupNotifications()
                                toast.promise(setupNotifications(), {
                                    loading: 'Requesting permissions...',
                                    success: 'Notifications enabled!',
                                    error: 'Could not enable notifications.'
                                })
                            }}
                        >
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

            {/* Sign Out & Danger Zone */}
            <section className="pt-2 pb-2 space-y-3">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 font-black text-sm uppercase tracking-widest hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
                
                <button
                    onClick={handleDeleteAccount}
                    className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/10 text-red-500 font-black text-sm uppercase tracking-widest hover:bg-red-500/20 active:scale-[0.98] transition-all"
                >
                    <UserMinus className="w-4 h-4" />
                    Delete Account
                </button>
            </section>

            {/* Version footer */}
            <footer className="pt-2 pb-2">
                <div className="text-center opacity-40">
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.5em]">Pool Party OS v1.1.0 - Built in Paradise</p>
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
                            className="w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <Card className="!p-10 shadow-3xl bg-zinc-900/90 border-white/10 rounded-[3rem] space-y-8 mb-20">
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
                                            <img
                                                src={newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`
                                                }}
                                            />
                                        </div>
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        <Button
                                            variant="secondary"
                                            type="button"
                                            className="text-[10px] px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 border-none flex items-center gap-2 font-black uppercase"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ImageIcon className="w-3 h-3" />
                                            Upload Photo
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Birthday"
                                            value={birthday}
                                            onChange={(e) => setBirthday(formatDateInput(e.target.value))}
                                            placeholder="MM/DD/YYYY"
                                            className="bg-black text-xs"
                                        />
                                        <Input
                                            label="Serving Since"
                                            value={workAnniversary}
                                            onChange={(e) => setWorkAnniversary(formatDateInput(e.target.value))}
                                            placeholder="MM/DD/YYYY"
                                            className="bg-black text-xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <Input
                                            label="Phone Number"
                                            value={phone}
                                            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                                            placeholder="555-555-5555"
                                            className="bg-black text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Short Bio</label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Brief description of your service style..."
                                            rows={3}
                                            className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-black font-outfit text-base placeholder:text-zinc-600 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Button type="submit" className="w-full py-6 text-xl rounded-[2rem] shadow-2xl shadow-primary/20" disabled={loading || uploading}>
                                            {loading ? "Updating..." : "Save Identity"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shift Wrap Preview Modal */}
            <AnimatePresence>
                {showWrapPreview && (
                    <ShiftWrap 
                        data={exampleShiftData} 
                        template={selectedTemplate}
                        onClose={() => setShowWrapPreview(false)} 
                    />
                )}
            </AnimatePresence>
        </div >
    )
}
