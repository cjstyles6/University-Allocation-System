import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Route them based on their exact role
  switch (session?.user?.role) {
    case "ADMIN":
      redirect("/admin");
    case "STAFF":
      redirect("/staff");
    default:
      redirect("/student");
  }
}
