export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ── Left Panel ── */}
      <div className="hidden md:flex w-1/2 relative flex-col justify-center items-center p-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)' }}>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* Glow blobs */}
        <div className="absolute top-1/4 -left-16 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute bottom-1/4 -right-16 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />

        {/* Wordmark */}
        <div className="relative z-10 text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-2 h-10 rounded-full bg-indigo-400" />
            <h1 className="text-6xl font-black tracking-tighter text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              EZ TEST
            </h1>
          </div>
          <p className="text-indigo-200 text-lg font-light tracking-wide">
            AI-powered test case &amp; script generation
          </p>
        </div>

        {/* Mock chat cards */}
        <div className="relative z-10 w-full max-w-xs space-y-3">
          {/* Assistant bubble */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-400/30 border border-indigo-400/40 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-300">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-indigo-100 leading-relaxed">
              Hi! Ready to generate your test cases? 🚀
            </div>
          </div>

          {/* User bubble */}
          <div className="flex justify-end">
            <div className="bg-indigo-500/60 backdrop-blur-sm border border-indigo-400/30 rounded-2xl rounded-tr-none px-4 py-3 text-sm text-white leading-relaxed max-w-[80%]">
              Generate a login test case please.
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-400/30 border border-indigo-400/40 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-300">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom status */}
        <div className="absolute bottom-8 z-10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-indigo-300 font-medium tracking-wider uppercase">AI Model Online</span>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full md:w-1/2 bg-gray-50 flex flex-col justify-center items-center p-8">
        {children}
      </div>
    </div>
  );
}