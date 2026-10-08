import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { canCreateQuestionSets } from "@/lib/auth/rbac";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  if (!canCreateQuestionSets(session.role)) {
    return NextResponse.json(
      { error: "Forbidden: Only hosts and faculty can upload question assets." },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).` },
        { status: 400 }
      );
    }

    const mimeType = file.type.toLowerCase();
    const extension = ALLOWED_MIME_TYPES[mimeType];

    if (!extension) {
      return NextResponse.json(
        {
          error: `Unsupported file type '${file.type}'. Allowed formats: JPG, PNG, WEBP, GIF, SVG.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify basic magic bytes for security against malicious file extensions
    if (mimeType === "image/jpeg") {
      if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
        return NextResponse.json({ error: "Invalid JPEG image file signature." }, { status: 400 });
      }
    } else if (mimeType === "image/png") {
      if (
        buffer[0] !== 0x89 ||
        buffer[1] !== 0x50 ||
        buffer[2] !== 0x4e ||
        buffer[3] !== 0x47
      ) {
        return NextResponse.json({ error: "Invalid PNG image file signature." }, { status: 400 });
      }
    } else if (mimeType === "image/gif") {
      const header = buffer.toString("ascii", 0, 3);
      if (header !== "GIF") {
        return NextResponse.json({ error: "Invalid GIF image file signature." }, { status: 400 });
      }
    }

    // Save to public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFileName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: safeFileName,
      size: file.size,
      mimeType,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process image upload." },
      { status: 500 }
    );
  }
}
