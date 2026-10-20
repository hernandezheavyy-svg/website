import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "Password required." }, { status: 400 });
  }

  const hash = process.env.PANEL_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    // Generic message — don't leak info
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const session = await getSession();
  session.authenticated = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
