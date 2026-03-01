import Link from 'next/link'
import { Card, Button, SectionTitle, GlassCard } from '@/components/PercocoUI'
import { Calculator, Users, Trophy, ChevronRight, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">🎉</div>
          <span className="font-bold text-xl tracking-tight font-outfit">Pool Party</span>
        </div>
        <Link href="/login">
          <Button variant="secondary" className="px-4 py-2 text-sm">Log In</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 pt-10 pb-16 space-y-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
          <Zap className="w-3 h-3 fill-primary" />
          <span>V1.0 NOW LIVE</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight font-outfit leading-tight leading-[1.1]">
          Servers win together,<br />
          <span className="text-primary italic">Faster.</span>
        </h1>
        <p className="text-[var(--muted-foreground)] max-w-xs mx-auto text-lg leading-relaxed">
          The cleanest way for restaurant teams to track sales, manage the tip pool, and see who's leading the pack.
        </p>
        <div className="pt-4">
          <Link href="/login">
            <Button className="w-full text-lg py-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
              Start Tracking Now
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 space-y-4 pb-20">
        <Card className="flex items-start gap-4" delay={0.1}>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold">Instant Pool Calc</h3>
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">Enter your net sales and see your support pool contribution in seconds.</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4" delay={0.2}>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold">Team Groups</h3>
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">Create a group for your restaurant and invite your coworkers.</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4" delay={0.3}>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold">Team Rankings</h3>
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">Compete for the highest net sales and most shifts logged this week.</p>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mt-auto p-8 text-center text-[var(--muted-foreground)] text-xs">
        <p>© 2024 Pool Party. Made for servers, by servers.</p>
      </footer>
    </div>
  )
}
