import { redirect } from "next/navigation";

export default function CompanyPortalPage({
  params,
}: {
  params: { company: string };
}) {
  // Serve the static portal HTML from /public/portals/<company>/index.html
  redirect(`/portals/${params.company}/index.html`);
}
