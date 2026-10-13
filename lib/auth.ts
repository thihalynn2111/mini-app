import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    return decoded.userId;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}
