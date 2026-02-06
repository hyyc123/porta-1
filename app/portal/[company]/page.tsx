"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";

type ManifestModule = { id: string; title: string; live: boolean };

const FALLBACK_MODULES: ManifestModule[] = [
  { id: "test", title: "Test", live: true },
  { id: "introduction", title: "Introduction", live: false },
  { id: "safety-security", title: "Safety & Security", live: false },
  { id: "emergencies", title: "Emergencies", live: false },
  { id: "after-hours-protocol", title: "After-Hours Protocol", live: false },
];

export default function CompanyPortalPage({ params }: { params: { company: string } }) {
  const companySlug = params.company;

  const [accountName, setAccountName] = useState("Account");
  const [modules, setModules] = useState<ManifestModule[] | null>(null);
  const [error, setError] = useState<string>("");

  const portalBase = useMemo(() => `/portal/${companySlug}`, [companySlug]);

  useEffect(() => {
    (async () => {
      setError("");

      const supabase = getSupabaseClient();
      if (!supabase) {
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

      // Load profile (RLS: only their row)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("company_id, full_name, email")
        .eq("user_id", user.id)
        .single();

      if (profileErr || !profile) {
        setError("No profile found. Please contact an admin.");
        setAccountName("Account");
        setModules(FALLBACK_MODULES);
        return;
      }

      setAccountName(profile.full_name || profile.email || "Account");

      // Enforce: user can ONLY view their own portal slug
      const { data: companyRow, error: companyErr } = await supabase
        .from("companies")
        .select("slug")
        .eq("id", profile.company_id)
        .single();

      if (companyErr || !companyRow) {
        setError("Company not found.");
        setModules(FALLBACK_MODULES);
        return;
      }

      if (companyRow.slug !== companySlug) {
        window.location.href = `/portal/${companyRow.slug}`;
        return;
      }

      // Load manifest from public/portal/<company>/modules-manifest.json
      try {
        const res = await fetch(`${portalBase}/modules-manifest.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Manifest fetch failed (${res.status})`);
        const data = (await res.json()) as ManifestModule[];
        setModules(Array.isArray(data) && data.length ? data : FALLBACK_MODULES);
      } catch (e: any) {
        setError(
          "Module list failed to load (using fallback placeholders). " +
            (e?.message ? `(${e.message})` : "")
        );
        setModules(FALLBACK_MODULES);
      }
    })();
  }, [companySlug, portalBase]);

  const ASSET_VERSION = "2026-02-06-1";

  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <img
            src={`${portalBase}/structureproperties-logo.svg`}
            alt="Structure Properties"
            style={styles.brandImg}
            onError={(e) => {
              // if the company has a different logo name later, we can swap
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={styles.h1}>Structure Properties Training Portal</div>
            <div style={styles.sub}>QuarterSmart • Internal Training</div>
          </div>
        </div>

        <div style={styles.user} title="Signed in account">
          <div style={styles.dot} />
          <div style={styles.userName}>{accountName}</div>
        </div>
      </header>

      <section style={styles.grid}>
        {!modules ? (
          <div style={{ padding: 24, color: "#a7b4d6", fontWeight: 800 }}>Loading…</div>
        ) : (
          modules.map((m) => <ModuleCard key={m.id} m={m} base={portalBase} v={ASSET_VERSION} />)
        )}
      </section>

      {error ? (
        <div style={{ padding: "0 24px 24px", color: "#fb7185", fontWeight: 800 }}>{error}</div>
      ) : null}
    </div>
  );
}

function ModuleCard({ m, base, v }: { m: ManifestModule; base: string; v: string }) {
  const completedKey = `qs_completed_${m.id}`;
  const isCompleted = typeof window !== "undefined" && localStorage.getItem(completedKey) === "1";

  const modulePath = `${base}/modules/structureproperties/${m.id}`;
  const thumbUrl = `${modulePath}/thumb.png?v=${encodeURIComponent(v)}`;
  const href = `${modulePath}/module.html`;

  const badgeText = isCompleted ? "Completed" : m.live ? "In Progress" : "Coming Soon";

  return (
    <div style={styles.card}>
      <div style={styles.thumb}>
        <img
          alt={`${m.title} thumbnail`}
          src={thumbUrl}
          style={styles.thumbImg}
          onError={(e) => {
            // silently hide thumbnail if it doesn't exist
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div style={styles.content}>
        <div style={styles.title}>{m.title}</div>

        <div style={styles.meta}>
          <div
            style={{
              ...styles.badge,
              ...(isCompleted || m.live ? styles.badgeLive : {}),
            }}
          >
            {badgeText}
          </div>

          {m.live ? (
            <a href={href} style={{ ...styles.btn, ...styles.btnPrimary }}>
              {isCompleted ? "Review" : "Resume"}
            </a>
          ) : (
            <span style={{ ...styles.btn, opacity: 0.55, cursor: "not-allowed" }}>View</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    background:
      "radial-gradient(1200px 700px at 10% 10%, rgba(96,165,250,0.18), transparent 55%)," +
      "radial-gradient(1000px 600px at 90% 20%, rgba(110,231,183,0.12), transparent 60%)," +
      "radial-gradient(900px 600px at 50% 110%, rgba(96,165,250,0.10), transparent 60%)," +
      "#0b0f19",
    color: "#e9eefc",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "18px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.05))",
    position: "sticky",
    top: 0,
    backdropFilter: "blur(10px)",
    zIndex: 10,
  },
  brand: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
  brandImg: { height: 72, width: "auto", display: "block" },
  h1: {
    fontSize: 18,
    margin: 0,
    fontWeight: 950,
    letterSpacing: "0.2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sub: {
    fontSize: 12,
    color: "#a7b4d6",
    marginTop: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  user: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.22)",
    padding: "10px 12px",
    borderRadius: 999,
    maxWidth: "44vw",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "linear-gradient(180deg, rgba(110,231,183,0.9), rgba(96,165,250,0.7))",
    boxShadow: "0 0 18px rgba(110,231,183,0.25)",
    flex: "0 0 auto",
  },
  userName: {
    fontSize: 12,
    color: "#e9eefc",
    fontWeight: 900,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
    padding: "22px 24px 34px",
  },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    boxShadow: "0 14px 50px rgba(0,0,0,0.45)",
    overflow: "hidden",
    minHeight: 190,
    display: "flex",
    flexDirection: "column",
  },
  thumb: {
    height: 110,
    background:
      "radial-gradient(260px 180px at 20% 20%, rgba(96,165,250,0.18), transparent 60%)," +
      "radial-gradient(240px 180px at 80% 10%, rgba(110,231,183,0.10), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.00))",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    position: "relative",
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "contain", display: "block" },
  content: { padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  title: { fontWeight: 950, fontSize: 15, lineHeight: 1.2 },
  meta: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: "auto" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: "0.3px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    color: "#a7b4d6",
    textTransform: "uppercase",
  },
  badgeLive: {
    borderColor: "rgba(110,231,183,0.35)",
    color: "#e9eefc",
    background: "linear-gradient(180deg, rgba(110,231,183,0.20), rgba(110,231,183,0.10))",
  },
  btn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "#e9eefc",
    padding: "9px 12px",
    borderRadius: 12,
    fontWeight: 950,
    fontSize: 12,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 78,
  },
  btnPrimary: {
    borderColor: "rgba(110,231,183,0.35)",
    background: "linear-gradient(180deg, rgba(110,231,183,0.22), rgba(110,231,183,0.12))",
  },
};

