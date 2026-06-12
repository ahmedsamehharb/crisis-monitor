import { redirect } from "next/navigation";

export default function EventsIndexPage() {
  redirect("/events/active");
}
