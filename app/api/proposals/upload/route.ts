import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdminUserId } from "@/lib/admin-auth";
import { PROPOSAL_IMAGE_TYPES, PROPOSAL_UPLOAD_MAX_MB } from "@/lib/proposals";

/** Upload tokens for slide images (PDF pages are rendered to images in the browser first). */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await getAdminUserId())) throw new Error("Unauthorized");
        if (!pathname.startsWith("proposals/")) throw new Error("Invalid path");
        return {
          allowedContentTypes: PROPOSAL_IMAGE_TYPES,
          maximumSizeInBytes: PROPOSAL_UPLOAD_MAX_MB * 1024 * 1024,
          // Unguessable file URLs; the images are public to anyone who has the link
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[Proposal Upload] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
