import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PASSWORD = process.env.SHARE_PASSWORD;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")?.split(" ")[1];
  if (auth !== PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  //件数の比較
  const ifModifiedSince = req.headers.get("If-Modified-Since");
  const ifCount = Number(req.headers.get("X-Url-Count") || "0");
  const latest = await prisma.sharedURL.findFirst({
    orderBy: { createdAt: "desc" },
  });
  const count = await prisma.sharedURL.count();
  if (ifModifiedSince && latest) {
    const since = new Date(ifModifiedSince);
    const latestSec = Math.floor(new Date(latest.createdAt).getTime() / 1000);
    const sinceSec = Math.floor(since.getTime() / 1000);

    if (latestSec === sinceSec && count === ifCount) {
      return new NextResponse(null, { status: 304 });
    }
  }

  const urls = await prisma.sharedURL.findMany({
    orderBy: { createdAt: "desc" },
  });
  const res = NextResponse.json(urls);
  if (latest) res.headers.set("Last-Modified", latest.createdAt.toUTCString());
  res.headers.set("X-Url-Count", count.toString());
  return res;
}
