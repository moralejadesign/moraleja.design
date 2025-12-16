import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  console.log("[Upload] Starting upload request");
  
  const { userId } = await auth();
  
  if (!userId) {
    console.log("[Upload] Unauthorized - no userId");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Upload] Parsing formData...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("[Upload] No file in formData");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[Upload] File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    const filename = `projects/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    console.log(`[Upload] Uploading to blob: ${filename}`);
    
    const blob = await put(filename, file, {
      access: "public",
      allowOverwrite: true,
    });

    console.log(`[Upload] Success! URL: ${blob.url}`);
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[Upload] Error:", error);
    console.error("[Upload] Error name:", (error as Error).name);
    console.error("[Upload] Error message:", (error as Error).message);
    console.error("[Upload] Error stack:", (error as Error).stack);
    return NextResponse.json({ 
      error: "Failed to upload file",
      details: (error as Error).message 
    }, { status: 500 });
  }
}
