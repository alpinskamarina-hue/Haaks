import { MyReplies } from "@/components/MyReplies";
import { getReplyDict, type MyReply } from "@/lib/job-replies";
import { loadWorkspace } from "@/lib/workspace";

export default async function MyRepliesPage() {
  const { supabase, lang } = await loadWorkspace();
  const { data } = await supabase.rpc("my_job_replies");
  return <MyReplies replies={(data ?? []) as MyReply[]} rt={getReplyDict(lang)} />;
}
