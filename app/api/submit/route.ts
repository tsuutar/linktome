import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PASSWORD = process.env.SHARE_PASSWORD;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")?.split(" ")[1];
  if (auth !== PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await req.text();
  const { url, title } = JSON.parse(rawBody);
  if (!url || !title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 既にURLが登録されている場合は追加しない
  const exists = await prisma.sharedURL.findUnique({ where: { url } });
  if (exists) {
    return NextResponse.json({ error: "URL already exists" }, { status: 409 });
  }

  console.debug("add", { url, title });
  await prisma.sharedURL.create({ data: { url, title } });
  return NextResponse.json({ success: true });
}
