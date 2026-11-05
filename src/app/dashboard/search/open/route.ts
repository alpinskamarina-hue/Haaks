import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { USERNAME_RE } from "@/lib/username";

// Opening a profile from search: on the free plan this is one of 3 profile views per 24 hours.
// The same profile again within 24 hours, and the builder's own profile, cost nothing.
export async function GET(request: NextRequest) {
  const u = (request.nextUrl.searchParams.get("u") ?? "").toLowerCase();
  const back = new URL("/dashboard/search", request.url);
  back.searchParams.set("q", request.nextUrl.searchParams.get("q") ?? "");
  if (!USERNAME_RE.test(u)) return NextResponse.redirect(back);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/", request.url));

  const { data: me } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  if (me?.username !== u) {
    const { error } = await supabase.rpc("use_free", { p_feature: "profile_view", p_ref: u });
    if (error) {
      back.searchParams.set("limit", "1");
      return NextResponse.redirect(back);
    }
  }
  return NextResponse.redirect(new URL(`/@${u}`, request.url));
}
