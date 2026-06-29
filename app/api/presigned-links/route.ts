import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { sendUpdateLink } from "@/lib/notifications";
import { createPresignedLink, findValidLink, expireLink } from "@/lib/presignedLinks";
import { findUser, updateUser, checkEmailPhoneUniqueness } from "@/lib/users";
import {
  parseJsonBody,
  joinUsPayloadSchema,
  buildConflictResponse,
  handleApiError,
} from "@/lib/api";

const log = logger.child({ component: "presigned-links" });

export async function POST(request: NextRequest) {
  const bodyOrError = await parseJsonBody(request);
  if (bodyOrError instanceof NextResponse) return bodyOrError;

  const { email, phone } = bodyOrError;

  if ((!email || typeof email !== "string") && (!phone || typeof phone !== "string")) {
    return NextResponse.json(
      { error: "Email or phone is required" },
      { status: 400 },
    );
  }

  try {
    const user = await findUser(
      typeof email === "string" ? email : undefined,
      typeof phone === "string" ? phone : undefined,
    );

    if (!user || !user.Id) {
      log.warn("update link requested for unknown user");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const { link, isNew } = await createPresignedLink(user.Id);
    const baseUrl = config.app.baseUrl;
    const updateUrl = `${baseUrl}/join-us/${link.Slug}`;
    log.info("update link requested", {
      userId: user.Id,
      slug: link.Slug,
      isNew,
      sent: isNew,
    });
    if (isNew) {
      await sendUpdateLink({
        linkSlug: link.Slug,
        toEmail: user.Email || undefined,
        toPhone: user.Phone || undefined,
        updateUrl,
        userId: user.Id,
        smsOptedOut: user.SmsOptedOut,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to create presigned link");
  }
}

export async function PATCH(request: NextRequest) {
  const bodyOrError = await parseJsonBody(request);
  if (bodyOrError instanceof NextResponse) return bodyOrError;

  const { slug } = bodyOrError;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json(
      { error: "Valid slug is required" },
      { status: 400 },
    );
  }

  const parsed = joinUsPayloadSchema.safeParse(bodyOrError);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json({ error: first.message }, { status: 400 });
  }

  const { name, email, phone, states, congressionalDistrict } = parsed.data;

  try {
    const link = await findValidLink(slug);
    if (!link || !link.Id) {
      log.warn("update attempted with invalid/expired slug", { slug });
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 },
      );
    }

    const { emailTaken, phoneTaken } = await checkEmailPhoneUniqueness(
      email,
      phone,
      link.User.Id,
    );
    if (emailTaken || phoneTaken) {
      return buildConflictResponse(emailTaken, phoneTaken);
    }

    const user = await updateUser(link.User.Id, {
      name,
      email,
      phone,
      states,
      congressionalDistrict,
    });

    await expireLink(link.Id);
    log.info("user updated via slug", {
      userId: link.User.Id,
      linkId: link.Id,
      slug,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleApiError(error, "Failed to update user");
  }
}
