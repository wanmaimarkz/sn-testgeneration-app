export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Panel: Branding & Decorative */}
      <div className="hidden md:flex w-1/2 bg-linear-to-br from-purple-600 to-indigo-700 text-white flex-col justify-center items-center p-12 text-center">
        <h1 className="text-7xl font-black mb-6 tracking-tighter">EZ TEST</h1>
        <p className="text-2xl font-light mb-2">Easily create test cases and scripts</p>
        
        {/* Mock Chat UI for Visual Appeal */}
        <div className="w-full max-w-sm space-y-4 mt-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl w-fit">
                <span className="text-sm">Hi! How can I help with testing?</span>
            </div>
            <div className="flex items-center gap-3 bg-blue-600 p-3 rounded-xl w-fit ml-auto shadow-lg">
                <span className="text-sm">Generate a login test case please.</span>
            </div>
        </div>
      </div>

      {/* Right Panel: Actual Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-8">
        {children}
      </div>
    </div>
  );
}