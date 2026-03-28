import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { sendSignupConfirmation } from "@/lib/notifications";
import { createPresignedLink } from "@/lib/presignedLinks";
import { runExclusive } from "@/lib/runExclusive";
import { createUser, findUser, checkEmailPhoneUniqueness } from "@/lib/users";
import {
  parseJsonBody,
  joinUsPayloadSchema,
  buildConflictResponse,
  handleApiError,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email") || undefined;
  const phone = searchParams.get("phone") || undefined;

  if (!email && !phone) {
    return NextResponse.json(
      { error: "Email or phone is required" },
      { status: 400 },
    );
  }

  try {
    const user = await findUser(email, phone);
    if (!user || !user.Id) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true });
  } catch (error) {
    return handleApiError(error, "Failed to find user");
  }
}

export async function POST(request: NextRequest) {
  const bodyOrError = await parseJsonBody(request);
  if (bodyOrError instanceof NextResponse) return bodyOrError;

  const parsed = joinUsPayloadSchema.safeParse(bodyOrError);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json({ error: first.message }, { status: 400 });
  }

  const { name, email, phone, states, congressionalDistrict } = parsed.data;
  const signupKey = `signup:${email.trim().toLowerCase()}`;

  try {
    return await runExclusive(signupKey, async () => {
      const { emailTaken, phoneTaken } = await checkEmailPhoneUniqueness(email, phone);
      if (emailTaken || phoneTaken) {
        return buildConflictResponse(emailTaken, phoneTaken);
      }

      const user = await createUser({
        name,
        email,
        phone,
        states,
        congressionalDistrict,
      });

      if (user.Id) {
        const { link, isNew } = await createPresignedLink(user.Id);
        const baseUrl = config.app.baseUrl;
        const confirmUrl = `${baseUrl}/join-us/confirm/${link.Slug}`;
        if (isNew) {
          await sendSignupConfirmation({
            linkSlug: link.Slug,
            toEmail: email,
            toPhone: phone || undefined,
            name,
            confirmUrl,
            userId: user.Id,
          });
        }
      }

      return NextResponse.json({ success: true, user }, { status: 201 });
    });
  } catch (error) {
    return handleApiError(error, "Failed to create user");
  }
}
