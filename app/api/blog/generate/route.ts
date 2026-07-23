import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { runBlogGeneration } from "@/lib/blog-runner";

export const maxDuration = 300;

// Génération à la demande, réservée aux admins connectés (bouton
// "Générer maintenant"). Plus de déclencheur externe ni de cron.
export async function POST() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const result = await runBlogGeneration();

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result);
}
