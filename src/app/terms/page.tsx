import React from 'react';

export default function TermsOfService() {
    return (
        <div className="max-w-3xl mx-auto p-8 space-y-6 bg-black min-h-screen text-zinc-300 font-sans">
            <h1 className="text-3xl font-black text-white font-outfit uppercase tracking-tighter">Terms of Service</h1>
            <p className="text-sm">Last updated: March 2026</p>
            
            <section className="space-y-4">
                <h2 className="text-xl font-black text-white">1. Acceptance of Terms</h2>
                <p>By accessing or using our application, you agree to be bound by these Terms of Service.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-black text-white">2. User Conduct</h2>
                <p>You agree not to use the application to post or transmit any material that is abusive, harassing, defamatory, vulgar, or otherwise objectionable. We reserve the right to ban users or remove content that violates this rule.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-black text-white">3. Disclaimers</h2>
                <p>The application and its contents are provided "as is". We make no warranties, expressed or implied, regarding the accuracy of shift tracker calculations.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-black text-white">4. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Your continued use of the app constitutes acceptance of any changes.</p>
            </section>
        </div>
    );
}
