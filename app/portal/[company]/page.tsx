export default function CompanyPortalPage({
  params,
}: {
  params: { company: string };
}) {
  return (
    <main style={{ width: "100vw", height: "100vh", margin: 0 }}>
      <iframe
        src={`/portals/${params.company}/index.html`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </main>
  );
}
