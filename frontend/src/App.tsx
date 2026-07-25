import { useCallback, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getProfile, ApiError, type CreatorProfile } from "./lib/api";
import { AppStatusProvider } from "./context/AppStatusContext";
import NavBar from "./components/NavBar";
import ErrorBanner from "./components/ErrorBanner";
import Spinner from "./components/Spinner";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Incidents from "./pages/Incidents";
import IncidentRoom from "./pages/IncidentRoom";
import Activity from "./pages/Activity";

const AUTH_KEY = "ghosttrace_authed";

type ProfileState =
  | { status: "loading" }
  | { status: "ready"; profile: CreatorProfile | null }
  | { status: "error"; message: string };

function AppShell() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "true");
  const [profileState, setProfileState] = useState<ProfileState>({ status: "loading" });
  const location = useLocation();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }, []);

  const loadProfile = useCallback(() => {
    setProfileState({ status: "loading" });
    getProfile()
      .then((profile) => setProfileState({ status: "ready", profile }))
      .catch((err) =>
        setProfileState({
          status: "error",
          message: err instanceof ApiError ? err.message : "Could not reach the GhostTrace backend.",
        })
      );
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadProfile();
  }, [authed, loadProfile]);

  useEffect(() => {
    if (
      profileState.status === "ready" &&
      profileState.profile === null &&
      location.pathname !== "/onboarding"
    ) {
      navigate("/onboarding", { replace: true });
    }
  }, [profileState, location.pathname, navigate]);

  const hasProfile = profileState.status === "ready" ? !!profileState.profile : null;

  if (!authed) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Login
            onLogin={() => {
              localStorage.setItem(AUTH_KEY, "true");
              setAuthed(true);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar hasProfile={hasProfile} onLogout={logout} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {profileState.status === "error" && (
          <div className="mb-6">
            <ErrorBanner
              message={`Backend unreachable — ${profileState.message}. You can keep browsing; we'll retry.`}
              onRetry={loadProfile}
            />
          </div>
        )}

        {profileState.status === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-24 text-xs uppercase tracking-[0.16em] text-ink-faint">
            <Spinner size={20} />
            Loading GhostTrace…
          </div>
        ) : (
          <div key={location.pathname} className="animate-page-in">
            <Routes>
              <Route
                path="/onboarding"
                element={
                  <Onboarding
                    onDone={() => {
                      loadProfile();
                      navigate("/");
                    }}
                  />
                }
              />
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/incidents/:id" element={<IncidentRoom />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppStatusProvider>
      <AppShell />
    </AppStatusProvider>
  );
}
