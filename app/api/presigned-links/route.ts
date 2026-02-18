import { NextRequest, NextResponse } from "next/server";
import { createPresignedLink, findValidLink, expireLink } from "@/lib/presignedLinks";
import { findUser, updateUser, checkEmailPhoneUniqueness } from "@/lib/users";

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

  const { email, phone } = body as Record<string, unknown>;

  if ((!email || typeof email !== "string") && (!phone || typeof phone !== "string")) {
    return NextResponse.json(
      { error: "Email or phone is required" },
      { status: 400 }
    );
  }

  try {
    const user = await findUser(
      typeof email === "string" ? email : undefined,
      typeof phone === "string" ? phone : undefined
    );

    if (!user || !user.Id) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const link = await createPresignedLink(user.Id);
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    console.log(
      `[Presigned Link] Update link for user ${user.Id}: ${baseUrl}/get-involved/${link.Slug}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create presigned link:", error);
    return NextResponse.json(
      { error: "Failed to create presigned link" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { slug, name, email, phone, states, congressionalDistrict } =
    body as Record<string, unknown>;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json(
      { error: "Valid slug is required" },
      { status: 400 }
    );
  }

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const phoneValue =
    typeof phone === "string" ? phone : "";

  if (!Array.isArray(states) || states.length === 0) {
    return NextResponse.json(
      { error: "At least one state is required" },
      { status: 400 }
    );
  }

  try {
    const link = await findValidLink(slug);
    if (!link || !link.Id) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }

    const { emailTaken, phoneTaken } = await checkEmailPhoneUniqueness(
      email,
      phoneValue,
      link.User.Id
    );
    if (emailTaken || phoneTaken) {
      const errors: Record<string, string> = {};
      if (emailTaken) errors.email = "This email is already registered.";
      if (phoneTaken) errors.phone = "This phone number is already registered.";
      const error =
        emailTaken && phoneTaken
          ? "This email and phone number are already registered."
          : (errors.email || errors.phone);
      return NextResponse.json({ error, errors }, { status: 409 });
    }

    const user = await updateUser(link.User.Id, {
      name,
      email,
      phone: phoneValue,
      states: states as string[],
      congressionalDistrict:
        typeof congressionalDistrict === "string" ? congressionalDistrict : "",
    });

    await expireLink(link.Id);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Failed to update user via presigned link:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
