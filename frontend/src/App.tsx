import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import PlannerPage from "./pages/planner/plannerpage";
import SubjectsPage from "./pages/subjects/subjectspage";
import SubjectDetailsPage from "./pages/subjects/subjectdetailspage";
import StudySessionsPage from "./pages/sessions/studysessionspage";
import TimerPage from "./pages/timer/timerpage";
import AnalyticsPage from "./pages/analytics/analyticspage";
import NotesPage from "./pages/notes/notespage";
import NoteDetailsPage from "./pages/notes/notedetailspage";
import ResourcesPage from "./pages/resources/resourcespage";
import SubjectResourcePage from "./pages/resources/subjectresourcepage";
import PlaceholderPage from "./pages/placeholder";
import ProtectedRoute from "./components/protectedroute";

import { TaskProvider } from "./context/taskcontext";
import { GoalProvider } from "./context/goalcontext";
import { SubjectProvider } from "./context/subjectcontext";
import { SessionProvider } from "./context/sessioncontext";
import { NoteProvider } from "./context/notecontext";
import { ResourceProvider } from "./context/resourcecontext";

export default function App() {
  return (
    <TaskProvider>
      <GoalProvider>
        <SubjectProvider>
          <SessionProvider>
            <NoteProvider>
              <ResourceProvider>
                <Routes>
                  {/* Initial page */}
                  <Route path="/" element={<Login />} />

                  {/* Auth */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* REDIRECT LEGACY TASKS ROUTE TO PLANNER */}
                  <Route
                    path="/tasks"
                    element={<Navigate to="/planner" replace />}
                  />

                  {/* STUDY PLANNER PAGE */}
                  <Route
                    path="/planner"
                    element={
                      <ProtectedRoute>
                        <PlannerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/planner/:goalId"
                    element={<Navigate to="/planner" replace />}
                  />

                  {/* SUBJECTS PAGES */}
                  <Route
                    path="/subjects"
                    element={
                      <ProtectedRoute>
                        <SubjectsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/subjects/:subjectId"
                    element={
                      <ProtectedRoute>
                        <SubjectDetailsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* STUDY SESSIONS & TIMER */}
                  <Route
                    path="/sessions"
                    element={
                      <ProtectedRoute>
                        <StudySessionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/timer"
                    element={
                      <ProtectedRoute>
                        <TimerPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ANALYTICS, NOTES & RESOURCES */}
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <AnalyticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notes"
                    element={
                      <ProtectedRoute>
                        <NotesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notes/:noteId"
                    element={
                      <ProtectedRoute>
                        <NoteDetailsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resources"
                    element={
                      <ProtectedRoute>
                        <ResourcesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resources/subject/:subjectId"
                    element={
                      <ProtectedRoute>
                        <SubjectResourcePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* OTHER SIDEBAR MODULES */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <PlaceholderPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </ResourceProvider>
            </NoteProvider>
          </SessionProvider>
        </SubjectProvider>
      </GoalProvider>
    </TaskProvider>
  );
}