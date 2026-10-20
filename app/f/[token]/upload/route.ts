import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { authorizedBriefing } from "@/lib/briefing-access";
import { BRIEFING_UPLOAD_MAX_MB, BRIEFING_UPLOAD_TYPES } from "@/lib/briefings";

/**
 * Upload tokens for files the client attaches to their briefing (logo, references).
 * Lives under /f/{token} so the PIN cookie, scoped to that path, comes along.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const briefing = await authorizedBriefing(token);
        if (!briefing) throw new Error("Unauthorized");
        if (briefing.submittedAt) throw new Error("This briefing was already sent");
        if (!pathname.startsWith("briefings/")) throw new Error("Invalid path");

        return {
          allowedContentTypes: BRIEFING_UPLOAD_TYPES,
          maximumSizeInBytes: BRIEFING_UPLOAD_MAX_MB * 1024 * 1024,
          // Unguessable file URLs; the files are public to anyone who has the link
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[Briefing Upload] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
