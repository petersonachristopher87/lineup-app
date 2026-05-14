import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Terms of Service</h1>
          <Link
            to="/"
            className="text-blue-700 hover:text-blue-900 text-sm font-semibold"
          >
            Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 space-y-4 text-sm text-left text-gray-800 leading-relaxed">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
            Placeholder — replace before launch
          </p>

          <p>
            By using Lineup Manager you agree to use it for its intended
            purpose: planning lineups, position rotations, and pitch counts for
            youth baseball and softball teams.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">Your account</h2>
          <p>
            You are responsible for keeping your sign-in credentials safe and
            for the accuracy of the rosters and games you enter.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">Acceptable use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Do not upload personal information about minors beyond what is
              reasonably needed to manage a team (name, jersey number, basic
              availability).
            </li>
            <li>
              Do not attempt to access teams, rosters, or data that don't
              belong to you.
            </li>
          </ul>

          <h2 className="text-base font-bold text-gray-900 pt-2">No warranty</h2>
          <p>
            Lineup Manager is provided as-is, with no warranty. The equity and
            safety-rule features are guides, not legal or league-rule
            substitutes — final lineup and pitch-count decisions are the
            coach's.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">Changes</h2>
          <p>
            These terms may be updated. Continued use after a change means you
            accept the updated terms.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">Contact</h2>
          <p>
            Questions? Email{' '}
            <a
              href="mailto:peterson.a.christopher@gmail.com"
              className="text-blue-700 hover:underline"
            >
              peterson.a.christopher@gmail.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
