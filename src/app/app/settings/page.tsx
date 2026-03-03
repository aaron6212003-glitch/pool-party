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
    const [shareToLeaderboard, setShareToLeaderboard] = useState(true)
    const [togglingShare, setTogglingShare] = useState(false)
    const [adminUnlocked, setAdminUnlocked] = useState(false)
    const [adminPin, setAdminPin] = useState('')
    const [pinError, setPinError] = useState(false)
    const [birthday, setBirthday] = useState('')
    const [workAnniversary, setWorkAnniversary] = useState('')
    const [bio, setBio] = useState('')
    const [phone, setPhone] = useState('')
    const [instagram, setInstagram] = useState('')
    const [favoriteSection, setFavoriteSection] = useState('')
    const [theme, setTheme] = useState('blue')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()
    const ADMIN_PIN = '654321'

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUser(user)
            setNewName(user?.user_metadata?.full_name || '')

            // Load avatar_url from profiles table (real source of truth, not JWT)
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, share_to_leaderboard, birthday, work_anniversary, bio, theme, phone, instagram, favorite_section')
                .eq('id', user.id)
                .single()
            if (profile) {
                setNewAvatar(profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`)
                setBirthday(profile.birthday || '')
                setWorkAnniversary(profile.work_anniversary || '')
                setBio(profile.bio || '')
                setPhone(profile.phone || '')
                setInstagram(profile.instagram || '')
                setFavoriteSection(profile.favorite_section || '')
                setTheme(profile.theme || 'blue')
                if (profile.share_to_leaderboard !== null) {
                    setShareToLeaderboard(profile.share_to_leaderboard)
                }
            }
        }
        init()
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
            // Only update the name in auth metadata (avatar lives in profiles table now)
            const { error } = await supabase.auth.updateUser({
                data: { full_name: newName }
            })
            if (error) throw error

            // Upsert to profiles with email (required) + avatar_url
            const { error: profileErr } = await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                avatar_url: newAvatar,
                share_to_leaderboard: shareToLeaderboard,
                birthday,
                work_anniversary: workAnniversary,
                bio,
                phone,
                instagram,
                favorite_section: favoriteSection,
                theme
            })
            if (profileErr) { console.error('Profile upsert error:', profileErr); throw profileErr }

            // Sync display name to all parties
            await supabase.from('group_members').update({ display_name: newName }).eq('user_id', user.id)

            toast.success('Profile updated!')
            setShowEdit(false)
            setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: newName } })
        } catch (e: any) {
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
            // Step 1: Compress to 200×200 JPEG
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

            // Step 2: Try Supabase Storage first
            const filePath = `${user.id}/avatar.jpg`
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' })

            if (!uploadError) {
                // Storage worked — use the public URL
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
                finalUrl = `${publicUrl}?t=${Date.now()}`
            } else {
                // Storage bucket doesn't exist or failed — fall back to base64 (small enough now)
                console.warn('Storage upload failed, falling back to base64:', uploadError.message)
                finalUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onload = (ev) => resolve(ev.target?.result as string)
                    reader.readAsDataURL(blob)
                })
            }

            // Step 3: Save to profiles table (with email to satisfy NOT NULL)
            const { error: profileErr } = await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                avatar_url: finalUrl,
                birthday,
                work_anniversary: workAnniversary,
                bio,
                phone,
                instagram,
                favorite_section: favoriteSection,
                share_to_leaderboard: shareToLeaderboard,
                theme
            })
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

    // Apply theme globally
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('app-theme', theme)

        // Auto-save theme to profile for immediate cross-device sync
        const syncTheme = async () => {
            if (user) {
                const { error } = await supabase.from('profiles').update({ theme }).eq('id', user.id)
                if (error) console.error('Failed to sync theme:', error)
            }
        }
        syncTheme()
    }, [theme, user])

    const THEMES = [
        { id: 'blue', color: '#007AFF', name: 'Original' },
        { id: 'emerald', color: '#10B981', name: 'Emerald' },
        { id: 'rose', color: '#F43F5E', name: 'Rose' },
        { id: 'amber', color: '#F59E0B', name: 'Amber' },
        { id: 'purple', color: '#A855F7', name: 'Purple' },
        { id: 'indigo', color: '#6366F1', name: 'Indigo' },
        { id: 'midnight', color: '#334155', name: 'Midnight' },
    ]

    // Owner-only admin actions — only deletes this user's own data
    const OWNER_ID = 'f46b2098-fcfe-4401-a68c-0d8fdedac90a'

    const handleWipeShifts = async () => {
        if (!confirm('⚠️ Wipe ALL your shift entries? This resets all your PRs and records. Cannot be undone.')) return
        if (!confirm('Are you absolutely sure? This is permanent.')) return
        setLoading(true)
        try {
            const { error } = await supabase.from('shift_entries').delete().eq('user_id', user?.id)
            if (error) throw error
            toast.success('All shift data wiped.')
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleWipeFeedEvents = async () => {
        if (!confirm('⚠️ Wipe all system notifications (PRs/grades) from every party feed for your account?')) return
        setLoading(true)
        try {
            const { error } = await supabase.from('party_feed').delete().eq('user_id', user?.id).eq('event_type', 'system')
            if (error) throw error
            toast.success('Feed system events cleared.')
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleNuclearWipe = async () => {
        if (!confirm('☢️ NUCLEAR RESET: This will delete ALL shifts for ALL members in ALL parties you own. This cannot be undone.')) return
        if (!confirm('Last chance — are you absolutely sure? Every single shift in every party you own will be gone.')) return
        setLoading(true)
        try {
            // Fetch all groups this user owns
            const { data: ownedGroups, error: gErr } = await supabase
                .from('groups')
                .select('id')
                .eq('owner_id', user.id)
            if (gErr) throw gErr
            if (!ownedGroups || ownedGroups.length === 0) {
                toast.error('No parties found where you are owner.')
                return
            }

            let wipedCount = 0
            for (const group of ownedGroups) {
                const { error: rpcErr } = await supabase.rpc('admin_wipe_group_data', { p_group_id: group.id })
                if (rpcErr) throw rpcErr
                wipedCount++
            }
            toast.success(`☢️ Nuked ${wipedCount} party${wipedCount > 1 ? 'ies' : ''} — all clean.`)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
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
                                src={newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
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

                    <div className="space-y-1.5 relative z-10 flex-1">
                        <h3 className="text-2xl font-black font-outfit text-white tracking-tighter">{newName || user?.user_metadata?.full_name || 'Server'}</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{user?.email}</p>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black tracking-widest px-3 py-1 mt-1 inline-block">🍽️ Server</Badge>
                        {favoriteSection && <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-1">Sect: {favoriteSection}</p>}
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

                        <div
                            className="p-5 flex items-center justify-between hover:bg-white/5 rounded-2xl transition-all cursor-pointer"
                            onClick={async () => {
                                if (togglingShare) return
                                setTogglingShare(true)
                                const next = !shareToLeaderboard
                                try {
                                    const { data: { user: u } } = await supabase.auth.getUser()
                                    if (!u) throw new Error('Not logged in')

                                    // Write to profiles table — readable by all party members via RLS
                                    const { error } = await supabase
                                        .from('profiles')
                                        .update({ share_to_leaderboard: next })
                                        .eq('id', u.id)
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
                            {/* Toggle */}
                            <button
                                type="button"
                                disabled={togglingShare}
                                className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${shareToLeaderboard ? 'bg-primary' : 'bg-zinc-700'
                                    } disabled:opacity-50`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${shareToLeaderboard ? 'left-6' : 'left-1'
                                    }`} />
                            </button>
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

            {/* App Aesthetics */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-black font-outfit text-lg text-white tracking-tight">App Aesthetics</h2>
                    <Badge className="bg-primary/20 text-primary border-none text-[8px]">Visual Kit</Badge>
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
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-700 text-center">Tapping a color updates the entire app instantly</p>
                    </div>
                </Card>
            </section>

            {/* Sign Out */}
            <section className="pt-2 pb-2">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/10 text-red-500 font-black text-sm uppercase tracking-widest hover:bg-red-500/20 active:scale-[0.98] transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </section>

            {/* Version footer */}
            <footer className="pt-2 pb-2">
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
                                            <img src={newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="Preview" className="w-full h-full object-cover" />
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
                                            className="text-[10px] px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 border-none flex items-center gap-2"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ImageIcon className="w-3 h-3" />
                                            {uploading ? 'Processing...' : 'Upload Photo'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            type="button"
                                            className="text-[10px] px-4 py-2 rounded-xl bg-white/5 text-zinc-500 border-none flex items-center gap-2"
                                            onClick={() => setNewAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`)}
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Random
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
                                            onChange={(e) => setBirthday(e.target.value)}
                                            placeholder="Day Month Year"
                                            className="bg-black text-xs"
                                        />
                                        <Input
                                            label="Serving Since"
                                            value={workAnniversary}
                                            onChange={(e) => setWorkAnniversary(e.target.value)}
                                            placeholder="Day Month Year"
                                            className="bg-black text-xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Phone Number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="555-555-5555"
                                            className="bg-black text-xs"
                                        />
                                        <Input
                                            label="Instagram Handle"
                                            value={instagram}
                                            onChange={(e) => setInstagram(e.target.value)}
                                            placeholder="@handle"
                                            className="bg-black text-xs"
                                        />
                                    </div>

                                    <Input
                                        label="Favorite Section"
                                        value={favoriteSection}
                                        onChange={(e) => setFavoriteSection(e.target.value)}
                                        placeholder="Patios / Upstairs"
                                        className="bg-black text-xs"
                                    />

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
            {/* Admin Panel — PIN locked */}
            {
                user && (
                    <section className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">🔐 Admin Panel</p>
                        <div className="rounded-[2rem] border border-red-500/20 bg-red-950/20 p-6 space-y-4">
                            {!adminUnlocked ? (
                                <>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60 text-center">Enter PIN to unlock</p>
                                    <div className="flex justify-center gap-2 mb-2">
                                        {[0, 1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={cn(
                                                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                                adminPin.length > i
                                                    ? pinError ? "border-red-500 bg-red-500" : "border-primary bg-primary"
                                                    : "border-white/20 bg-white/5"
                                            )}>
                                                {adminPin.length > i && !pinError && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k, idx) => (
                                            <button
                                                key={idx}
                                                disabled={k === ''}
                                                onClick={() => {
                                                    if (k === '⌫') {
                                                        setPinError(false)
                                                        setAdminPin(p => p.slice(0, -1))
                                                    } else if (typeof k === 'number') {
                                                        setPinError(false)
                                                        const next = adminPin + k
                                                        setAdminPin(next)
                                                        if (next.length === 6) {
                                                            if (next === ADMIN_PIN) {
                                                                setAdminUnlocked(true)
                                                            } else {
                                                                setPinError(true)
                                                                setTimeout(() => { setAdminPin(''); setPinError(false) }, 600)
                                                            }
                                                        }
                                                    }
                                                }}
                                                className={cn(
                                                    "py-3 rounded-2xl text-sm font-black transition-all",
                                                    k === '' ? "opacity-0 pointer-events-none" : "",
                                                    k === '⌫' ? "bg-white/5 text-zinc-400 active:bg-white/10" : "bg-white/5 text-white hover:bg-white/10 active:bg-primary/30 active:scale-95"
                                                )}
                                            >{k}</button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60">Destructive Actions</p>
                                        <button onClick={() => { setAdminUnlocked(false); setAdminPin('') }} className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest font-black">🔒 Lock</button>
                                    </div>
                                    <button
                                        onClick={handleWipeShifts}
                                        disabled={loading}
                                        className="w-full py-4 px-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/20 active:scale-95 transition-all text-left flex items-center gap-3"
                                    >
                                        <span className="text-lg">🗑️</span>
                                        <div>
                                            <p>Wipe All My Shifts</p>
                                            <p className="text-[10px] text-red-400/50 font-normal normal-case tracking-normal mt-0.5">Deletes all shift entries &amp; resets your PRs</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={handleWipeFeedEvents}
                                        disabled={loading}
                                        className="w-full py-4 px-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/20 active:scale-95 transition-all text-left flex items-center gap-3"
                                    >
                                        <span className="text-lg">🧹</span>
                                        <div>
                                            <p>Wipe My Feed Events</p>
                                            <p className="text-[10px] text-red-400/50 font-normal normal-case tracking-normal mt-0.5">Removes all PR &amp; grade alerts from party feeds</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={handleNuclearWipe}
                                        disabled={loading}
                                        className="w-full py-4 px-5 rounded-2xl bg-red-900/30 border border-red-600/50 text-red-300 text-xs font-black uppercase tracking-widest hover:bg-red-900/50 active:scale-95 transition-all text-left flex items-center gap-3"
                                    >
                                        <span className="text-lg">☢️</span>
                                        <div>
                                            <p>Nuclear Reset — Wipe Everyone</p>
                                            <p className="text-[10px] text-red-300/50 font-normal normal-case tracking-normal mt-0.5">Deletes ALL shifts &amp; PRs for every member in your parties</p>
                                        </div>
                                    </button>
                                </>
                            )}
                        </div>
                    </section>
                )
            }
        </div >
    )
}
