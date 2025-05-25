import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PASSWORD = process.env.SHARE_PASSWORD;

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("authorization")?.split(" ")[1];
  if (auth !== PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.sharedURL.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
