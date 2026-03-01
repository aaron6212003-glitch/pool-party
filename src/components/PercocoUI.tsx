"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Hash, X } from 'lucide-react'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const Card = ({ children, className, delay = 0, onClick }: { children: React.ReactNode, className?: string, delay?: number, onClick?: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
        className={cn("bg-zinc-900 border border-white/5 rounded-3xl shadow-2xl p-6", className)}
        onClick={onClick}
    >
        {children}
    </motion.div>
)

export const GlassCard = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay }}
        className={cn("bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl", className)}
    >
        {children}
    </motion.div>
)

export const Button = ({
    children,
    variant = 'primary',
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) => (
    <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
            "rounded-2xl font-black font-outfit transition-all flex items-center justify-center disabled:opacity-50",
            variant === 'primary' ? "bg-primary text-white shadow-lg shadow-primary/20" :
                variant === 'danger' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" :
                    "bg-zinc-800 text-white border border-white/5",
            className
        )}
        {...(props as any)}
    >
        {children}
    </motion.button>
)

import { Eye, EyeOff } from 'lucide-react'

export const Input = ({ label, error, className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string }) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
        <div className="space-y-1.5 w-full text-left">
            {label && <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary ml-1 font-outfit">{label}</label>}
            <div className="relative group">
                <input
                    type={inputType}
                    className={cn(
                        "w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white font-black font-outfit text-base placeholder:text-zinc-600 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all",
                        isPassword && "pr-12",
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-accent mt-1 ml-1 font-bold"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    )
}

export const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-primary/20 text-primary font-outfit", className)}>
        {children}
    </span>
)

export const SectionTitle = ({ children, subtitle }: { children: React.ReactNode, subtitle?: string }) => (
    <div className="mb-4 space-y-1">
        <h2 className="text-3xl font-black tracking-tighter font-outfit text-white">{children}</h2>
        {subtitle && <p className="text-zinc-500 text-xs font-bold leading-relaxed">{subtitle}</p>}
    </div>
)

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title?: string, children: React.ReactNode }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-sm"
                >
                    <Card className="!p-10 shadow-3xl bg-zinc-900 border-white/10 rounded-[3rem] space-y-8 relative">
                        {title && (
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black font-outfit text-white tracking-tighter">{title}</h3>
                                <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {children}
                    </Card>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
)

export const GroupInvitePanel = ({ code, onCopy }: { code: string, onCopy: () => void }) => {
    const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${code}` : code;
    return (
        <Card className="!p-8 shadow-apple-lg border-primary/10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Hash className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg font-outfit">Invite Coworkers</h3>
            </div>
            <div className="flex gap-3 bg-black p-2 rounded-xl ring-1 ring-white/10 overflow-hidden">
                <code className="flex-1 px-4 py-3 font-mono font-bold text-primary tracking-tight flex items-center text-xs truncate whitespace-nowrap overflow-x-auto">{inviteUrl}</code>
                <Button onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    onCopy();
                }} className="px-4 py-2 text-xs shrink-0">Copy Link</Button>
            </div>
            <p className="text-xs text-zinc-500 text-center">Send this link to your team to join this group instantly.</p>
        </Card>
    );
};
