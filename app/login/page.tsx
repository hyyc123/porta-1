"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { getSupabaseClient } from "../../lib/supabaseClient";

// Domain → company slug map (easy to expand later)
function companySlugFromEmail(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return null;

  if (domain === "structureproperties.com") return "structureproperties";

  // Later:
  // if (domain === "acme.com") return "acme";
  return null;
}

export default function LoginPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInOrSignUp() {
    setStatus("");

    const name = fullName.trim();
    const emailClean = email.trim().toLowerCase();

    if (!name) return setStatus("Please enter your full name.");
    if (!emailClean || !password) return setStatus("Email and password are required.");

    // Decide which company this email belongs to
    const companySlug = companySlugFromEmail(emailClean);
    if (!companySlug) {
      return setStatus("Your email domain is not authorized for this portal.");
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("Supabase is not configured (missing env vars in Vercel).");
      return;
    }

    setLoading(true);

    try {
      // 1) Sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailClean,
        password,
      });

      // 2) If sign-in fails, try sign-up
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: emailClean,
          password,
        });
        if (signUpError) throw signUpError;
      }

      // 3) Get the authenticated user
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes.user;
      if (!user) throw new Error("No authenticated user found.");

      // 4) Look up company by slug
      const { data: company, error: companyErr } = await supabase
        .from("companies")
        .select("id, slug")
        .eq("slug", companySlug)
        .single();

      if (companyErr || !company) {
        throw new Error("Company not found in database. Ask admin to add it.");
      }

      // 5) Check if profile exists
      const { data: existingProfile, error: profileSelectErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // If select fails (shouldn't, but just in case)
      if (profileSelectErr) {
        throw profileSelectErr;
      }

      // 6) Create profile if missing
      if (!existingProfile) {
        const { error: profileInsertErr } = await supabase.from("profiles").insert({
          user_id: user.id,
          full_name: name,
          email: emailClean,
          company_id: company.id,
        });

        if (profileInsertErr) throw profileInsertErr;
      }

      // 7) Save for exports / convenience
      localStorage.setItem("qs_full_name", name);
      localStorage.setItem("qs_email", emailClean);

      // 8) Redirect to company portal
      window.location.href = `/portal/${company.slug}`;
    } catch (err: any) {
      setStatus(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          boxShadow: "0 18px 70px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 6,
            background:
              "linear-gradient(90deg, rgba(96,165,250,0.85), rgba(110,231,183,0.85))",
          }}
        />

        <div style={{ padding: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
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
              }}
            >
              <img
                src="/logo.png"
                alt="QuarterSmart"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            <div style={{ marginTop: 14, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 950 }}>QuarterSmart Sign In</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "#a7b4d6", lineHeight: 1.5 }}>
                Company training portal
                <br />
                Secure access for authorized teams
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <Field label="Full name">
              <input
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Work email">
              <input
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <button
              onClick={signInOrSignUp}
              disabled={loading}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(110,231,183,0.35)",
                background:
                  "linear-gradient(180deg, rgba(110,231,183,0.22), rgba(110,231,183,0.12))",
                fontWeight: 950,
                color: "#e9eefc",
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign in / Create account"}
            </button>

            {status ? (
              <div style={{ fontSize: 13, color: "#fb7185", lineHeight: 1.4 }}>{status}</div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.18)",
  color: "#e9eefc",
  outline: "none",
};
