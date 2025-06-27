// app/api/user/api-key/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-secret-key";

function encryptApiKey(apiKey: string): string {
  return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
}

function decryptApiKey(encryptedApiKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedApiKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// GET - Retrieve user's API key
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { apiKey: true },
    });

    if (!user?.apiKey) {
      return NextResponse.json({ hasApiKey: false });
    }

    try {
      const decryptedApiKey = decryptApiKey(user.apiKey);
      return NextResponse.json({
        hasApiKey: true,
        apiKey: decryptedApiKey,
      });
    } catch (error) {
      console.error("Decryption error:", error);
      return NextResponse.json({ hasApiKey: false });
    }
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return NextResponse.json(
      { error: "Failed to retrieve API key" },
      { status: 500 }
    );
  }
}

// POST - Save user's API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { apiKey } = await request.json();

    if (!apiKey || !apiKey.startsWith("sk-ant-") || apiKey.length < 20) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 400 }
      );
    }

    const encryptedApiKey = encryptApiKey(apiKey);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { apiKey: encryptedApiKey },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving API key:", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

// DELETE - Remove user's API key
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { apiKey: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing API key:", error);
    return NextResponse.json(
      { error: "Failed to remove API key" },
      { status: 500 }
    );
  }
}
