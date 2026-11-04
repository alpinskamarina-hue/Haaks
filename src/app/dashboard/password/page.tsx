import { redirect } from "next/navigation";

// Password now lives in the profile's settings card.
export default function PasswordPage() {
  redirect("/dashboard/profile#settings");
}
