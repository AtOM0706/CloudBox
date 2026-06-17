import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tokenStore } from "../api/client";
import { useAuth } from "../auth/AuthContext";

/** Lands here after Google login: ?token=JWT → store it, load the user, go home. */
export default function OAuthCallbackPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");
    if (token) {
      tokenStore.set(token);
      refresh().then(() => navigate("/", { replace: true }));
    } else {
      navigate(`/login?error=${error ?? "oauth"}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <p className="text-sm text-slate-500">Signing you in…</p>
    </div>
  );
}
