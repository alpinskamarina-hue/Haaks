import { redirect } from "next/navigation";

// The old "My requests" list is gone (Nasim, 2026-11-03): the feed is the one place for jobs.
export default function LeadsPage() {
  redirect("/dashboard/leads/feed");
}
