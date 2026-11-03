import { getHelperDict } from "@/lib/helper-i18n";
import { MyReplies } from "@/components/MyReplies";
import { catalogActive, getReplyDict, type MyInvite, type MyReply } from "@/lib/job-replies";
import { loadWorkspace } from "@/lib/workspace";

export default async function MyRepliesPage() {
  const { supabase, profile, lang } = await loadWorkspace();
  const catalog = profile as typeof profile & { in_catalog?: boolean; catalog_until?: string | null };
  const [{ data: replies }, { data: invites }] = await Promise.all([supabase.rpc("my_job_replies"), supabase.rpc("my_invites")]);
  return (
    <MyReplies
      replies={(replies ?? []) as MyReply[]}
      invites={(invites ?? []) as MyInvite[]}
      inCatalog={catalogActive(catalog)}
      catalogUntil={catalog.catalog_until ?? null}
      rt={getReplyDict(lang)}
      helper={getHelperDict(lang)}
    />
  );
}
