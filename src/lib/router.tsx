import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CreateTeamPage } from '@/pages/CreateTeamPage'
import { RosterPage } from '@/pages/RosterPage'
import { GameListPage } from '@/pages/GameListPage'
import { CreateGamePage } from '@/pages/CreateGamePage'
import { EditGamePage } from '@/pages/EditGamePage'
import { AttendancePage } from '@/pages/AttendancePage'
import { LineupGridPage } from '@/pages/LineupGridPage'
import { TeamDetailPage } from '@/pages/TeamDetailPage'
import { TeamSettingsPage } from '@/pages/TeamSettingsPage'
import { TeamProfilePage } from '@/pages/TeamProfilePage'
import { ManageTemplatesPage } from '@/pages/ManageTemplatesPage'
import { TeamSeasonStatsPage } from '@/pages/TeamSeasonStatsPage'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function TeamRouteWrapper({ component: Component }: { component: React.ComponentType<{ teamId: string }> }) {
  const { teamId } = useParams()
  return teamId ? <Component teamId={teamId} /> : <Navigate to="/" replace />
}

function GameRouteWrapper({
  component: Component,
}: {
  component: React.ComponentType<{ gameId: string; teamId: string }>
}) {
  const { gameId, teamId } = useParams()
  return gameId && teamId ? <Component gameId={gameId} teamId={teamId} /> : <Navigate to="/" replace />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <ManageTemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-team"
            element={
              <ProtectedRoute>
                <CreateTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId"
            element={
              <ProtectedRoute>
                <TeamRouteWrapper component={TeamDetailPage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId/profile"
            element={
              <ProtectedRoute>
                <TeamRouteWrapper component={TeamProfilePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId/stats"
            element={
              <ProtectedRoute>
                <TeamRouteWrapper component={TeamSeasonStatsPage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId/settings"
            element={
              <ProtectedRoute>
                <TeamRouteWrapper component={TeamSettingsPage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId/roster"
            element={
              <ProtectedRoute>
                <TeamRouteWrapper component={RosterPage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId/games"
            element={
              <ProtectedRoute>
                <TeamRouteWrapper component={GameListPage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId/games/new"
            element={
              <ProtectedRoute>
                <TeamRouteWrapper component={CreateGamePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId/games/:gameId/edit"
            element={
              <ProtectedRoute>
                <GameRouteWrapper component={EditGamePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId/games/:gameId/attendance"
            element={
              <ProtectedRoute>
                <GameRouteWrapper component={AttendancePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/:teamId/games/:gameId/lineup"
            element={
              <ProtectedRoute>
                <GameRouteWrapper component={LineupGridPage} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}
