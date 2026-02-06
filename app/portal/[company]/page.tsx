"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";

export default function CompanyPortalPage({ params }: { params: { company: string } }) {
  const [msg, setMsg] = useState("Loading…");

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        // If env vars aren't present, fail closed to /login.
        window.location.href = "/login";
        return;
      }

      // Must be signed in
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Profile (RLS: only their row)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("company_id, full_name, email")
        .eq("user_id", user.id)
        .single();

      if (profileErr || !profile) {
        setMsg("No profile found. Please contact an admin.");
        return;
      }

      // Company slug
      const { data: companyRow, error: companyErr } = await supabase
        .from("companies")
        .select("slug, name")
        .eq("id", profile.company_id)
        .single();

      if (companyErr || !companyRow) {
        setMsg("Company not found.");
        return;
      }

      // Enforce: user can ONLY view their own portal
      if (companyRow.slug !== params.company) {
        window.location.href = `/portal/${companyRow.slug}`;
        return;
      }

      // Store identity for the static portal header
      if (profile.full_name) localStorage.setItem("qs_full_name", profile.full_name);
      if (profile.email) localStorage.setItem("qs_email", profile.email);

      // Go to the static portal (served from /public)
      window.location.href = `/portal/${companyRow.slug}/index.html`;
    })();
  }, [params.company]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Portal</h1>
      <p style={{ marginTop: 10, color: "#a7b4d6", fontWeight: 800 }}>{msg}</p>
    </main>
  );
}
