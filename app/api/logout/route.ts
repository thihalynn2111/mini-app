import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Cookie ထဲမှာ သိမ်းထားတဲ့ session token ကို ဖယ်ရှားခြင်း (Cookie သက်တမ်းကုန်စေခြင်း)
    (await cookies()).set({
      name: "token", // သင့်ပရောဂျက်မှာသုံးနေတဲ့ cookie නာမည် (ဥပမာ token သို့မဟုတ် session)
      value: "",
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
