import { redirect } from "next/navigation";

// The look is now edited on the profile itself. Old links land there.
export default function CustomizePage() {
  redirect("/profile?mode=look");
}
