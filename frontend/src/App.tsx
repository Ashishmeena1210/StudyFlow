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
                  <Route
                    path="/"
                    element={<Login />}
                  />

                  {/* Auth */}
                  <Route
                    path="/login"
                    element={<Login />}
                  />

                  <Route
                    path="/register"
                    element={<Register />}
                  />

                  {/* Dashboard */}
                  <Route
                    path="/dashboard"
                    element={<Dashboard />}
                  />

                  {/* REDIRECT LEGACY TASKS ROUTE TO PLANNER */}
                  <Route
                    path="/tasks"
                    element={<Navigate to="/planner" replace />}
                  />

                  {/* STUDY PLANNER PAGE */}
                  <Route
                    path="/planner"
                    element={<PlannerPage />}
                  />
                  <Route
                    path="/planner/:goalId"
                    element={<Navigate to="/planner" replace />}
                  />

                  {/* SUBJECTS PAGES */}
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/subjects/:subjectId" element={<SubjectDetailsPage />} />

                  {/* STUDY SESSIONS & TIMER */}
                  <Route path="/sessions" element={<StudySessionsPage />} />
                  <Route path="/timer" element={<TimerPage />} />

                  {/* ANALYTICS, NOTES & RESOURCES */}
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/notes/:noteId" element={<NoteDetailsPage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/resources/subject/:subjectId" element={<SubjectResourcePage />} />

                  {/* OTHER SIDEBAR MODULES */}
                  <Route path="/settings" element={<PlaceholderPage />} />

                  {/* Fallback */}
                  <Route
                    path="*"
                    element={
                      <Navigate
                        to="/dashboard"
                        replace
                      />
                    }
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