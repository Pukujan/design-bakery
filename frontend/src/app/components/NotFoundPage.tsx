import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="min-h-screen px-6 py-28 sm:py-32 md:py-36 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950">
      <div className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl border-4 border-black bg-white/90 p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:bg-gray-900/90">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-400">
          404
        </p>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-xl text-base text-gray-700 dark:text-gray-300">
          This route is not part of the public site right now.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center rounded-full border-4 border-black bg-yellow-400 px-5 py-3 font-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:bg-yellow-300"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
