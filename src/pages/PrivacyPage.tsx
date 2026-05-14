import { Link } from 'react-router-dom'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
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
            Lineup Manager is built for youth baseball and softball coaches. We
            collect the minimum information needed to run the app: your email
            address (for sign-in), the team roster you create, and the games
            and lineups you record.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">
            What we store
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your account email and (optional) display name.</li>
            <li>
              The teams, players, games, lineups, attendance, and pitch counts
              you enter.
            </li>
            <li>
              Standard Supabase authentication metadata (session timestamps,
              email-confirmation status).
            </li>
          </ul>

          <h2 className="text-base font-bold text-gray-900 pt-2">
            What we don't do
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>We don't sell or share your data with third parties.</li>
            <li>We don't show ads.</li>
            <li>
              We don't collect information about players beyond what you enter
              (name, jersey number, optional notes).
            </li>
          </ul>

          <h2 className="text-base font-bold text-gray-900 pt-2">
            Deleting your data
          </h2>
          <p>
            You can delete a team (and everything in it) from your dashboard.
            To delete your entire account and all associated data, email{' '}
            <a
              href="mailto:peterson.a.christopher@gmail.com"
              className="text-blue-700 hover:underline"
            >
              peterson.a.christopher@gmail.com
            </a>
            .
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">
            Questions
          </h2>
          <p>
            Reach out at{' '}
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
