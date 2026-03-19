"use client"

import { Card, Button } from '@/components/PercocoUI'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function PrivacyPolicy() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-black p-6">
            <header className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-black font-outfit text-white">Privacy Policy.</h1>
            </header>

            <Card className="!p-8 bg-zinc-900/40 border-white/5 rounded-[2rem] space-y-6 text-zinc-400 text-sm font-medium leading-relaxed">
                <section className="space-y-2">
                    <h2 className="text-white font-black text-xs uppercase tracking-widest">1. Data Collection</h2>
                    <p>We collect shift data, tips, and hourly wages to provide you with financial insights. Your data is stored securely in your private vault.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-white font-black text-xs uppercase tracking-widest">2. Account Deletion</h2>
                    <p>You can delete your account and all associated data at any time from the Settings menu. This action is permanent and irreversible.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-white font-black text-xs uppercase tracking-widest">3. User Generated Content</h2>
                    <p>When you post to a Party Feed, your content is shared with your chosen group. Avoid sharing sensitive personal information.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-white font-black text-xs uppercase tracking-widest">4. Third Parties</h2>
                    <p>We do not sell your data. We use industry-standard encryption and security providers to keep your information safe.</p>
                </section>

                <p className="pt-4 text-[10px] font-black uppercase tracking-widest opacity-50 text-center">Last Updated: March 2026</p>
            </Card>
        </div>
    )
}
