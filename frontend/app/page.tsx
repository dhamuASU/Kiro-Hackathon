import Link from "next/link";
import { Leaf, FlaskConical, Users, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#28396C] text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-semibold text-[#28396C]">DermaDecode</span>
        </div>
        <Link href="/login" className="rounded-full bg-[#28396C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#28396C]/90">
          Get started
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#28396C]/15 bg-[#F0FFC2] px-3 py-1 text-xs font-medium text-[#28396C]/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B5E18B]" />
          Kiro Spark Challenge @ ASU 2026
        </div>

        <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight text-[#28396C] md:text-6xl">
          Yuka shouts TOXIC.
          <span className="block text-[#B5E18B]">We explain why it matters to you.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-balance text-base text-gray-600 md:text-lg">
          DermaDecode is your personal skincare coach. Tell us your skin type and goals — our multi-agent AI breaks down every product in your bathroom using analogies, not scare tactics.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="rounded-full bg-[#28396C] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#28396C]/90">
            Analyze my routine →
          </Link>
          <Link href="/dashboard" className="rounded-full border border-gray-200 px-8 py-3.5 text-sm font-semibold text-gray-600 hover:border-[#28396C]">
            See a demo
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { icon: FlaskConical, title: "Analogy-first", body: "\"Sulfates are like sugar — fine in moderation, brutal at scale.\" Calibrated to your goals." },
            { icon: Users, title: "Personalized", body: "Your skin type, goals, and allergies change every analysis. Not generic scores." },
            { icon: ShieldCheck, title: "Banned-elsewhere receipts", body: "EU / California / Canada bans cited as sanity checks — never as the headline." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl bg-[#EAE6BC]/50 p-5 text-left">
              <Icon className="mb-3 h-5 w-5 text-[#28396C]" />
              <h3 className="font-semibold text-[#28396C]">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{body}</p>
            </div>
          ))}
        </div>

        <blockquote className="mx-auto mt-16 max-w-lg rounded-2xl bg-[#F0FFC2] p-6 text-left">
          <p className="text-sm italic text-[#28396C]">
            "It told me my shampoo's sulfate is like sugar — fine sometimes, brutal daily. I'd been using it daily for 8 years."
          </p>
          <footer className="mt-3 text-xs text-gray-500">— Demo persona: Maya, 27, sensitive skin, reduce acne goal</footer>
        </blockquote>
      </main>

      <footer className="border-t py-6 text-center text-xs text-gray-400">
        DermaDecode · Not a medical app · No "TOXIC" labels · Analogies, not alarms
      </footer>
    </div>
  );
}
