// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // 1. Basic validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400 },
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user in database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "Registration successful!" },
      { status: 201 },
    );
  } catch (error: any) {
    // THIS prints the exact cause in your VS Code terminal
    console.error("REGISTER_API_ERROR:", error);

    return NextResponse.json(
      { message: error.message || "Something went wrong on the server" },
      { status: 500 },
    );
  }
}
