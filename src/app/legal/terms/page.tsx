"use client"

import { Card, Button } from '@/components/PercocoUI'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function TermsOfService() {
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
                <h1 className="text-2xl font-black font-outfit text-white">Terms of Use.</h1>
            </header>

            <Card className="!p-8 bg-zinc-900/40 border-white/5 rounded-[2rem] space-y-6 text-zinc-400 text-sm font-medium leading-relaxed mb-8">
                <section className="space-y-2">
                    <h2 className="text-white font-black text-xs uppercase tracking-widest text-primary">1. Community Rules</h2>
                    <p>Pool Party is a professional tool for hospitality workers. There is zero tolerance for objectionable content or abusive behavior. Any user found violating these rules will be banned immediately.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-white font-black text-xs uppercase tracking-widest text-primary">2. Content Monitoring</h2>
                    <p>We provide users with the ability to report offensive content. Reported content is reviewed manually. Objectionable content will be removed within 24 hours.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-white font-black text-xs uppercase tracking-widest text-primary">3. Financial Accuracy</h2>
                    <p>While we strive for accuracy, Pool Party is a tracking tool and does not provide legal or tax advice. Always verify your earnings with your employer's official records.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-white font-black text-xs uppercase tracking-widest text-primary">4. Account Termination</h2>
                    <p>We reserve the right to terminate accounts that violate our community standards or engage in fraudulent activity.</p>
                </section>

                <p className="pt-4 text-[10px] font-black uppercase tracking-widest opacity-50 text-center">Effective Date: March 2026</p>
            </Card>

            <Button 
                onClick={() => router.push('/app/settings')}
                className="w-full py-6 rounded-[2rem] bg-zinc-900 border-white/5 text-zinc-400 font-black text-xs uppercase tracking-widest hover:text-white"
            >
                Return to Settings
            </Button>
        </div>
    )
}
