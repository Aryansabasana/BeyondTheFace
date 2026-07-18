
export function CameraError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="card p-6 flex flex-col items-center gap-4 text-center max-w-sm mx-auto bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-sm">
      <div className="text-surface-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 2l20 20" />
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l1.5-2h4M17 7h2a2 2 0 0 1 2 2v2" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">Camera Issue</h3>
        <p className="text-sm text-surface-600 dark:text-surface-300">{error}</p>
      </div>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900"
      >
        Retry
      </button>
    </div>
  );
}
