import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="max-w-3xl mx-auto p-8 space-y-6 bg-black min-h-screen text-zinc-300 font-sans">
            <h1 className="text-3xl font-black text-white font-outfit uppercase tracking-tighter">Privacy Policy</h1>
            <p className="text-sm">Last updated: March 2026</p>
            
            <section className="space-y-4">
                <h2 className="text-xl font-black text-white">1. Information We Collect</h2>
                <p>We collect information you provide directly to us, such as when you create or modify your account. This may include your name, email address, profile photo, and shift data.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-black text-white">2. How We Use Information</h2>
                <p>We use the information we collect to provide, maintain, and improve our services, including calculating shift performance, maintaining your profile, and tracking leaderboard metrics.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-black text-white">3. Deleting Your Data</h2>
                <p>You can request deletion of your account and all associated data at any time from the app Settings navigating to the "Delete Account" button. Doing so permanently destroys your shift history, profile data, and group memberships.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-black text-white">4. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us within the app or email support.</p>
            </section>
        </div>
    );
}
