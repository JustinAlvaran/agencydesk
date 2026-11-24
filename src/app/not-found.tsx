import Link from 'next/link'

export default function NotFound() {
  return (
    // Dark background gradient for the whole screen
    <div className="min-h-screen bg-white dark:bg-transparent flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-black to-red-950/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>
        </div>
      </div>
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          {/* Red accent for the 404 number */}
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          {/* Light text for contrast */}
          <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
          <p className="text-gray-400 mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            // Red accent for the button
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg"
          >
            Go Back Home
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>If you believe this is an error, please contact us at:</p>
            <p className="font-medium text-red-400">support@citc-ph.com</p>
          </div>
        </div>
        
        <div className="mt-12 text-xs text-gray-600">
          <p>CITC IT Website</p>
        </div>
      </div>
    </div>
  )
}