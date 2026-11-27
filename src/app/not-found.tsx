import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-white dark:bg-zinc-950 flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 shadow-xl backdrop-blur-xl">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-4">
          AgencyDesk
        </span>
        <h1 className="text-7xl sm:text-8xl font-black text-primary mb-3">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-8 leading-relaxed">
          We couldn&apos;t find the page you&apos;re looking for. It may have moved, or the URL
          may be incorrect.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all"
          >
            Go Back Home
          </Link>
          <Link
            href="/inquire"
            className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-all"
          >
            Start Inquiry
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400">
          <p>Need help? Contact us at</p>
          <a
            href="mailto:inquiries@agencydesk.dev"
            className="font-semibold text-primary hover:underline"
          >
            inquiries@agencydesk.dev
          </a>
        </div>
      </div>
    </div>
  );
}
