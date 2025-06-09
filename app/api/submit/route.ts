import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PASSWORD = process.env.SHARE_PASSWORD;

// CORSヘッダーを付与する関数
function withCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return res;
}

export async function OPTIONS() {
  // プリフライトリクエスト対応
  return withCORS(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")?.split(" ")[1];
  if (auth !== PASSWORD) {
    return withCORS(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  const rawBody = await req.text();
  const { url, title } = JSON.parse(rawBody);
  if (!url || !title) {
    return withCORS(
      NextResponse.json({ error: "Missing fields" }, { status: 400 })
    );
  }

  // 既にURLが登録されている場合は追加しない
  const exists = await prisma.sharedURL.findUnique({ where: { url } });
  if (exists) {
    return withCORS(
      NextResponse.json({ error: "URL already exists" }, { status: 409 })
    );
  }

  console.debug("add", { url, title });
  await prisma.sharedURL.create({ data: { url, title } });
  return withCORS(NextResponse.json({ success: true }));
}
