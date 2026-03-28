"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const { scrollY } = useScroll();

  // Scroll-driven transforms — air.inc style: 0 → 500px
  const logoScale = useTransform(scrollY, [0, 500], [1, 0.22]);
  const logoY = useTransform(scrollY, [0, 500], [0, -320]);
  const logoRotate = useTransform(scrollY, [0, 500], [0, 360]);
  const logoOpacity = useTransform(scrollY, [420, 500], [1, 0]);

  // Navbar logo fades in as hero logo fades out
  const navLogoOpacity = useTransform(scrollY, [420, 520], [0, 1]);
  const navBg = useTransform(
    scrollY,
    [0, 400, 500],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0)", "rgba(255,255,255,0.18)"]
  );
  const navBlur = useTransform(scrollY, [400, 500], [0, 24]);

  // Tagline fades in below the logo
  const taglineOpacity = useTransform(scrollY, [0, 100], [1, 0]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthed(!!user);
    });
  }, []);

  const handleCTA = () => {
    if (isAuthed) router.push("/home");
    else router.push("/signup");
  };

  return (
    <div className="min-h-screen bg-bright-sky relative">
      {/* Cloud layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Large soft clouds */}
        <div className="animate-cloud-slow absolute top-[8%] left-[-5%] w-[700px] h-[300px] rounded-full opacity-[0.5]"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)" }} />
        <div className="animate-cloud absolute top-[5%] right-[-8%] w-[600px] h-[260px] rounded-full opacity-[0.45]"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 45%, transparent 70%)" }} />
        <div className="animate-cloud absolute bottom-[15%] left-[-10%] w-[800px] h-[280px] rounded-full opacity-[0.35]"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)" }} />
        <div className="animate-cloud-slow absolute top-[55%] right-[-5%] w-[550px] h-[220px] rounded-full opacity-[0.3]"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 45%, transparent 70%)" }} />
        {/* Smaller accent clouds */}
        <div className="animate-cloud absolute top-[30%] left-[15%] w-[300px] h-[120px] rounded-full opacity-[0.4]"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)" }} />
        <div className="animate-cloud-slow absolute top-[70%] right-[20%] w-[400px] h-[160px] rounded-full opacity-[0.3]"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar — liquid glass */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: navBg,
          backdropFilter: useTransform(navBlur, (v) => `blur(${v}px) saturate(1.8)`),
          WebkitBackdropFilter: useTransform(navBlur, (v) => `blur(${v}px) saturate(1.8)`),
          borderBottom: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              About
            </Link>
          </div>

          {/* Nav center logo — docks here after scroll */}
          <motion.div
            style={{ opacity: navLogoOpacity }}
            className="absolute left-1/2 -translate-x-1/2"
          >
            <span className="font-logo text-2xl text-white drop-shadow-sm">Kronos</span>
          </motion.div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Login
            </Link>
            <button
              onClick={handleCTA}
              className="px-5 py-2 rounded-full text-sm font-medium bg-white text-[#2a6dcc] hover:bg-white/90 transition-all hover:scale-105 shadow-md"
            >
              Get started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section — full viewport */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden z-10">
        {/* Giant glass "Kronos" — animates on scroll */}
        <motion.div
          className="fixed z-40"
          style={{
            scale: logoScale,
            y: logoY,
            rotate: logoRotate,
            opacity: logoOpacity,
            top: "42vh",
            left: "50%",
            x: "-50%",
          }}
        >
          <div className="animate-float select-none">
            <span
              className="font-logo glass-text"
              style={{ fontSize: "clamp(6rem, 15vw, 14rem)", lineHeight: 1.1 }}
            >
              Kronos
            </span>
          </div>
        </motion.div>

        {/* Tagline + CTA below logo */}
        <motion.div
          className="fixed z-30 flex flex-col items-center gap-6"
          style={{
            opacity: taglineOpacity,
            top: "68vh",
            left: "50%",
            x: "-50%",
          }}
        >
          <h1 className="text-2xl md:text-3xl font-medium text-white text-center" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.1)" }}>
            Your schedule. <em className="font-logo not-italic opacity-90">Described.</em>
          </h1>
          <button
            onClick={handleCTA}
            className="px-8 py-3.5 rounded-full text-base font-medium bg-white text-[#2a6dcc] hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
          >
            {isAuthed ? "Open Kronos" : "Get some Kronos"}
          </button>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <motion.svg
            width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </motion.svg>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.08)" }}>
              Describe your week.
              <br />
              <span className="text-white/80">We build it.</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto text-white/60">
              Tell Kronos what you need, and watch your calendar take shape. No dragging, no clicking through menus.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Natural language",
                desc: "Describe your schedule in plain words. Kronos understands context, recurrence, and priorities.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                ),
              },
              {
                title: "Image import",
                desc: "Snap a photo of a class schedule or meeting agenda. Kronos reads it and creates your events.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                  </svg>
                ),
              },
              {
                title: "Visual editing",
                desc: "Drag, resize, and refine. Your calendar is always editable — by hand or by voice.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                ),
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="rounded-2xl p-8"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">How it works</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { step: "01", title: "Describe your schedule", desc: "Type or speak your ideal week in natural language. Upload a photo of a syllabus or timetable." },
              { step: "02", title: "Kronos generates it", desc: "AI parses your description and creates structured calendar events — dates, times, colors, recurrence." },
              { step: "03", title: "Refine with follow-ups", desc: "Ask Kronos to move, add, or remove events. No need to start over — just keep talking." },
              { step: "04", title: "Edit visually", desc: "Drag, resize, and fine-tune events directly on your weekly calendar. It's yours to own." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="flex items-start gap-6 rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <span className="font-logo text-3xl text-white/30 flex-shrink-0 mt-1">{item.step}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/55">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section id="about" className="relative z-10 py-32 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="rounded-3xl px-10 py-14 md:px-16"
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}>
            <p className="text-2xl md:text-3xl font-light leading-snug text-white mb-6">
              &ldquo;The best calendar is one you never had to build by hand.&rdquo;
            </p>
            <p className="text-sm tracking-wider uppercase text-white/40">
              The Kronos Philosophy
            </p>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32 px-6">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-5">
            Ready to try it?
          </h2>
          <p className="text-lg text-white/60 mb-10">
            Describe your ideal week. Kronos handles the rest.
          </p>
          <button
            onClick={handleCTA}
            className="px-10 py-4 rounded-full text-base font-medium bg-white text-[#2a6dcc] hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
          >
            {isAuthed ? "Go to my calendar" : "Get started for free"}
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-logo text-lg text-white/40">Kronos</span>
          <p className="text-xs text-white/30">
            Built by Mario A. Esquivel III
          </p>
        </div>
      </footer>
    </div>
  );
}
