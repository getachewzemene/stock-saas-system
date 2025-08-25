import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function getUserFromRequest(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.id) return null;
  const user = await db.user.findUnique({
    where: { id: token.id as string },
    include: { location: true },
  });
  return user;
}
