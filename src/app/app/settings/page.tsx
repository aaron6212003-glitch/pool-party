"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, Button, Input, SectionTitle, GlassCard, Badge, cn } from '@/components/PercocoUI'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, User, Bell, Shield, ChevronRight, Moon, UserCircle, Settings, Mail, RefreshCw, Smartphone, Camera, Image as ImageIcon, UserMinus, Lock, Sparkles, Zap, Crown, ReceiptText, Palmtree, Eye, LayoutTemplate, Palette, Fingerprint } from 'lucide-react'
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
    
    // Brand Theme selection
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('app-theme') || 'blue'
        }
        return 'blue'
    })

    // Wrap Template selection states
    const [selectedTemplate, setSelectedTemplate] = useState<WrapTemplate>('obsidian')
    const [showWrapPreview, setShowWrapPreview] = useState(false)
    const [showTemplatePicker, setShowTemplatePicker] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUser(user)

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
                await supabase.from('profiles').upsert({ id: user.id, email: user.email, theme: theme })
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
        if (!confirm('🛑 WARNING: Permanent delete. Proseed?')) return
        if (!confirm('Type "DELETE" to confirm?')) return
        setLoading(true)
        try {
            await supabase.from('shift_entries').delete().eq('user_id', user.id)
            await supabase.from('group_members').delete().eq('user_id', user.id)
            await supabase.from('profiles').delete().eq('id', user.id)
            await supabase.auth.signOut()
            router.push('/')
        } catch (e: any) { toast.error(e.message) } finally { setLoading(false) }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!loaded || !user) return
        setLoading(true)
        try {
            await supabase.auth.updateUser({ data: { full_name: newName, avatar_url: newAvatar }})
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
        } catch (e: any) { toast.error(e.message) } finally { setLoading(false) }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const filePath = `${user.id}/avatar.jpg`
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
            const finalUrl = `${publicUrl}?t=${Date.now()}`
            await supabase.from('profiles').update({ avatar_url: finalUrl }).eq('id', user.id)
            setNewAvatar(finalUrl)
            toast.success('Photo saved! 📸')
        } catch (error: any) { toast.error(error.message) } finally { setUploading(false) }
    }

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
        { id: 'obsidian', name: 'Obsidian', icon: Sparkles, color: '#007AFF', desc: 'Space Age Glass' },
        { id: 'cyber', name: 'Cyberpunk', icon: Zap, color: '#f0abfc', desc: 'Neon Holographics' },
        { id: 'luxe', name: 'Luxe Gold', icon: Crown, color: '#fbbf24', desc: 'Old Money Satin' },
        { id: 'thermal', name: 'Minimalist', icon: ReceiptText, color: '#000000', desc: 'Classic Dot Matrix' },
        { id: 'sunset', name: 'Vaporwave', icon: Palmtree, color: '#fb7185', desc: 'Nostalgic Pulse' },
    ]

    useEffect(() => {
        if (!loaded || !user) return
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('app-theme', theme)
        const syncPref = async () => {
            const { error } = await supabase.from('profiles').update({ theme, wrap_template: selectedTemplate }).eq('id', user.id)
            if (error) console.error('Pref sync fail:', error)
        }
        syncPref()
    }, [theme, selectedTemplate, loaded, user?.id])

    return (
        <div className="p-6 pt-safe space-y-8 animate-in pb-32 bg-black min-h-screen no-scrollbar">
            <header className="space-y-1 mt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity & OS</p>
                <h1 className="text-4xl font-black font-outfit text-white tracking-tighter">Settings.</h1>
            </header>

            {/* Profile Section (Most Important) */}
            <section className="space-y-5">
                <Card className="flex items-center gap-6 !p-8 bg-zinc-900/40 border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <UserCircle className="w-64 h-64 text-primary" />
                    </div>

                    <div className="relative">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-black ring-4 ring-primary/10 overflow-hidden shrink-0 shadow-2xl">
                            <img src={newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full object-cover" />
                        </div>
                        <button onClick={() => setShowEdit(true)} className="absolute -right-2 -bottom-2 w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl transform active:scale-90 transition-transform">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2 relative z-10 flex-1">
                        <h3 className="text-3xl font-black font-outfit text-white tracking-tighter leading-none">{newName || 'Server'}</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black tracking-widest px-3 py-1.5 inline-block">🍽️ SERVER</Badge>
                            {favoriteSection && <Badge className="bg-white/5 text-zinc-500 border-none text-[8px] font-black px-3 py-1.5">{favoriteSection}</Badge>}
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Button variant="secondary" onClick={() => setShowEdit(true)} className="py-6 rounded-[2rem] bg-zinc-900/40 border-white/5 text-[10px] font-black uppercase tracking-widest gap-3">
                        <User className="w-4 h-4" /> Edit Profile
                    </Button>
                    <Button variant="primary" onClick={handleSignOut} className="py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest gap-3">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </Button>
                </div>
            </section>

            {/* Visuals (Brand Colors) */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-black font-outfit text-xl text-white tracking-tight flex items-center gap-3">
                        <Palette className="w-5 h-5 text-primary" /> Core Aesthetics
                    </h2>
                </div>

                <Card className="!p-8 bg-zinc-900/40 border-white/5 rounded-[3rem] shadow-xl space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-black font-outfit text-white">Brand Highlight</p>
                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Global OS accent color</p>
                            </div>
                            <div className="w-8 h-8 rounded-full shadow-2xl" style={{ backgroundColor: THEMES.find(t=>t.id===theme)?.color }} />
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={cn(
                                        "w-full aspect-square rounded-2xl border-2 transition-all flex items-center justify-center tap-highlight-transparent",
                                        theme === t.id ? "border-white ring-8 ring-white/5 scale-110" : "border-transparent opacity-40 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: t.color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Condensed Wrap Customization */}
                    <div className="pt-8 border-t border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-black font-outfit text-white">Post-Shift Identity</p>
                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Current: {WRAP_TEMPLATES.find(t=>t.id===selectedTemplate)?.name}</p>
                            </div>
                            <Button 
                                variant="secondary" 
                                className="px-6 py-3 rounded-2xl font-black uppercase text-[9px] bg-primary/10 text-primary border-none flex items-center gap-3 active:scale-95"
                                onClick={() => setShowTemplatePicker(true)}
                            >
                                <LayoutTemplate className="w-4 h-4" /> Pick Theme
                            </Button>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Privacy & Engine */}
            <section className="space-y-4">
                <h2 className="font-black font-outfit text-xl text-white tracking-tight flex items-center gap-3 px-1">
                    <Fingerprint className="w-5 h-5 text-secondary" /> Privacy & Hub
                </h2>
                
                <Card className="p-2 bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-xl overflow-hidden">
                    <div className="space-y-1">
                        <div className="p-5 flex items-center justify-between hover:bg-white/5 rounded-3xl transition-all cursor-pointer" onClick={async () => {
                            if (togglingShare) return
                            setTogglingShare(true)
                            const next = !shareToLeaderboard
                            await supabase.from('profiles').update({ share_to_leaderboard: next }).eq('id', user.id)
                            setShareToLeaderboard(next)
                            setTogglingShare(false)
                        }}>
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-emerald-400">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-black font-outfit text-white tracking-tight">Party Ranking</p>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-none">{shareToLeaderboard ? 'VISIBLE' : 'HIDDEN'}</p>
                                </div>
                            </div>
                            <button className={`w-14 h-8 rounded-full relative transition-colors duration-300 shadow-inner ${shareToLeaderboard ? 'bg-primary' : 'bg-zinc-800'}`}>
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-2xl transition-all duration-300 ${shareToLeaderboard ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-3xl transition-all group" onClick={() => setupNotifications()}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-orange-400">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-black font-outfit text-white tracking-tight">Shift Alerts</p>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-none">Smart Notifications</p>
                                </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white/5 group-hover:bg-primary/20 transition-colors">
                                <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    </div>
                </Card>
            </section>

            <section className="pt-6 space-y-4">
                <button onClick={handleDeleteAccount} className="w-full text-center text-[10px] font-black uppercase tracking-[0.6em] text-red-950 hover:text-red-600 transition-colors">
                    Terminate Account & Logs
                </button>
            </section>

            {/* Template Picker Modal */}
            <AnimatePresence>
                {showTemplatePicker && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end justify-center bg-black/90 backdrop-blur-3xl pb-safe">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-lg bg-zinc-900 rounded-t-[4rem] p-8 space-y-8 overflow-hidden relative shadow-[0_-40px_100px_rgba(0,0,0,0.8)]">
                            <div className="w-20 h-2 bg-white/10 rounded-full mx-auto" onClick={()=>setShowTemplatePicker(false)} />
                            <div className="space-y-2 text-center">
                                <h3 className="text-3xl font-black font-outfit text-white tracking-tighter">Wrap Style.</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity selection</p>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pb-8 pr-1">
                                {WRAP_TEMPLATES.map((t) => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => {
                                            setSelectedTemplate(t.id)
                                            setShowTemplatePicker(false)
                                            setShowWrapPreview(true)
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between p-7 rounded-[2.5rem] border-2 transition-all relative overflow-hidden group active:scale-95",
                                            selectedTemplate === t.id ? "bg-primary border-primary shadow-2xl shadow-primary/20" : "bg-black/30 border-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center transition-all", selectedTemplate === t.id ? "bg-white text-primary" : "bg-zinc-900 text-zinc-600")}>
                                                <t.icon className="w-7 h-7" />
                                            </div>
                                            <div className="text-left">
                                                <p className={cn("text-xl font-black font-outfit tracking-tight", selectedTemplate === t.id ? "text-white" : "text-zinc-400")}>{t.name}</p>
                                                <p className={cn("text-[9px] font-black uppercase tracking-widest", selectedTemplate === t.id ? "text-white/60" : "text-zinc-700")}>{t.desc}</p>
                                            </div>
                                        </div>
                                        <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform">
                                            <t.icon className="w-32 h-32 rotate-12" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <Button onClick={() => setShowTemplatePicker(false)} className="w-full py-7 rounded-[2.5rem] bg-white text-black font-black uppercase text-xs tracking-widest">
                                Close Selection
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {showWrapPreview && (
                    <ShiftWrap 
                        data={{ totalEarned: 342, tipsPerHour: 48, netSales: 1650, hours: 6.5, ccTips: 285, cashTips: 45, tipOut: 82.50, basePay: 94.25, grade: 'A+', gradeColor: '#10B981', date: new Date(), shiftType: 'Dinner' }} 
                        template={selectedTemplate}
                        onClose={() => setShowWrapPreview(false)} 
                    />
                )}
            </AnimatePresence>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div >
    )
}
