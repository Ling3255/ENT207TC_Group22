import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import LandingPage from "./_landing/LandingPage";

function getDefaultRoute(role?: string) {
  if (role === "SUPER_ADMIN") return "/admin/users";
  if (role === "STAFF") return "/staff";
  return "/applicant/dashboard";
}

export const revalidate = 0;

export default async function HomePage() {
  /* Auth check on server — redirect logged-in users immediately */
  const cookieStore = await cookies();
  const token = cookieStore.get("engimatch_token")?.value;

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (user && user.status === "APPROVED") {
        redirect(getDefaultRoute(user.role));
      }
    }
  }

  const [programmeCount, universityCount] = await Promise.all([
    prisma.programme.count(),
    prisma.university.count(),
  ]);

  return <LandingPage stats={{ programmeCount, universityCount }} />;
}
