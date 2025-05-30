import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PASSWORD = process.env.SHARE_PASSWORD;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")?.split(" ")[1];
  if (auth !== PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const urls = await prisma.sharedURL.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(urls);
}
