import { NextRequest, NextResponse } from "next/server";
import { createUser, findUser, checkEmailPhoneUniqueness } from "@/lib/users";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email") || undefined;
  const phone = searchParams.get("phone") || undefined;

  if (!email && !phone) {
    return NextResponse.json(
      { error: "Email or phone is required" },
      { status: 400 }
    );
  }

  try {
    const user = await findUser(email, phone);
    if (!user || !user.Id) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true });
  } catch (error) {
    console.error("Failed to find user:", error);
    return NextResponse.json(
      { error: "Failed to find user" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { name, email, phone, states, congressionalDistrict } = body as Record<string, unknown>;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const phoneValue =
    typeof phone === "string" ? phone : "";

  if (!Array.isArray(states) || states.length === 0) {
    return NextResponse.json({ error: "At least one state is required" }, { status: 400 });
  }

  try {
    const { emailTaken, phoneTaken } = await checkEmailPhoneUniqueness(
      email,
      phoneValue
    );
    if (emailTaken || phoneTaken) {
      const errors: Record<string, string> = {};
      if (emailTaken) errors.email = "This email is already registered.";
      if (phoneTaken) errors.phone = "This phone number is already registered.";
      const error =
        emailTaken && phoneTaken
          ? "This email and phone number are already registered."
          : emailTaken
            ? "This email is already registered."
            : "This phone number is already registered.";
      return NextResponse.json({ error, errors }, { status: 409 });
    }

    const user = await createUser({
      name,
      email,
      phone: phoneValue,
      states: states as string[],
      congressionalDistrict: typeof congressionalDistrict === "string" ? congressionalDistrict : "",
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
