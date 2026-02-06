"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabaseClient";

function companySlugFromEmail(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return null;

  if (domain === "structureproperties.com") return "structureproperties";
  return null;
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const prefillEmail = params.get("email");
      if (prefillEmail) setEmail(prefillEmail);
    } catch {
      // ignore
    }
  }, []);

  async function signUp() {
    setStatus("");

    const name = fullName.trim();
    const emailClean = email.trim().toLowerCase();

    if (!name) return setStatus("Please enter your full name.");
    if (!emailClean || !password) return setStatus("Email and password are required.");

    const companySlug = companySlugFromEmail(emailClean);
    if (!companySlug) return setStatus("Your email domain is not authorized for this portal.");

    const supabase = getSupabaseClient();
    if (!supabase) return setStatus("Supabase is not configured (missing env vars in Vercel).");

    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailClean,
        password,
      });
      if (signUpError) throw signUpError;

      // If confirmations ever get turned ON, session can be null:
      if (!signUpData.session) {
        setStatus("Account created. Check your email to confirm, then sign in.");
        // Still send them to login after a moment
        window.location.href = `/login?signup=success&email=${encodeURIComponent(emailClean)}`;
        return;
      }

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) throw new Error("Auth session missing!");

      const { data: company, error: companyErr } = await supabase
        .from("companies")
        .select("id, slug")
        .eq("slug", companySlug)
        .single();

      if (companyErr || !company) throw new Error("Company not found in database.");

      // Create profile if it doesn't exist
      const { data: existingProfile, error: profileSelectErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileSelectErr) throw profileSelectErr;

      if (!existingProfile) {
        const { error: profileInsertErr } = await supabase.from("profiles").insert({
          user_id: user.id,
          full_name: name,
          email: emailClean,
          company_id: company.id,
        });
        if (profileInsertErr) throw profileInsertErr;
      }

      // Sign out so they land back at /login cleanly
      await supabase.auth.signOut();

      window.location.href = `/login?signup=success&email=${encodeURIComponent(emailClean)}`;
    } catch (err: any) {
      setStatus(err?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={topBarStyle} />
        <div style={{ padding: 26 }}>
          <Header />

          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <Field label="Full name">
              <input
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
                autoComplete="name"
              />
            </Field>

            <Field label="Work email">
              <input
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                autoComplete="email"
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                autoComplete="new-password"
              />
            </Field>

            <button onClick={signUp} disabled={loading} style={buttonStyle(loading)}>
              {loading ? "Creating..." : "Create account"}
            </button>

            <div style={{ fontSize: 13, color: "#a7b4d6", lineHeight: 1.4 }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: "#e9eefc", textDecoration: "underline" }}>
                Sign in
              </a>
            </div>

            {status ? (
              <div style={{ fontSize: 13, color: "#fb7185", lineHeight: 1.4 }}>{status}</div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={logoWrapStyle}>
        <img
          src="/logo.png"
          alt="QuarterSmart"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      <div style={{ marginTop: 14, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 950 }}>Create your account</div>
        <div style={{ marginTop: 6, fontSize: 13, color: "#a7b4d6", lineHeight: 1.5 }}>
          Authorized work emails only
          <br />
          You will sign in after creating
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#a7b4d6", fontWeight: 850 }}>{label}</div>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
  boxShadow: "0 18px 70px rgba(0,0,0,0.6)",
  overflow: "hidden",
};

const topBarStyle: React.CSSProperties = {
  height: 6,
  background: "linear-gradient(90deg, rgba(96,165,250,0.85), rgba(110,231,183,0.85))",
};

const logoWrapStyle: React.CSSProperties = {
  width: 108,
  height: 108,
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.28)",
  boxShadow: "0 14px 40px rgba(0,0,0,0.55)",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 14,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.18)",
  color: "#e9eefc",
  outline: "none",
};

function buttonStyle(loading: boolean): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(110,231,183,0.35)",
    background: "linear-gradient(180deg, rgba(110,231,183,0.22), rgba(110,231,183,0.12))",
    fontWeight: 950,
    color: "#e9eefc",
    cursor: "pointer",
    opacity: loading ? 0.7 : 1,
  };
}
