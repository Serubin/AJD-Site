import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { sendUpdateLink, type DeliveryResult } from "@/lib/notifications";
import { createPresignedLink, findValidLink, expireLink } from "@/lib/presignedLinks";
import {
  findUser,
  updateUser,
  checkEmailPhoneUniqueness,
  setSmsOptedOut,
  setEmailOptedOut,
} from "@/lib/users";
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

    // Submitting the form (which carries the consent disclaimer) re-opts the
    // user into the channel(s) they provided. Only write when currently opted
    // out to avoid redundant writes from the debounced lookup. NB: this is a
    // local re-opt-in; a user who texted STOP must text START before Twilio
    // will deliver again.
    let smsOptedOut = user.SmsOptedOut;
    if (typeof phone === "string" && phone.trim() && user.SmsOptedOut) {
      await setSmsOptedOut(user.Id, false);
      smsOptedOut = false;
      log.info("sms re-opt-in via form", { userId: user.Id });
    }
    if (typeof email === "string" && email.trim() && user.EmailOptedOut) {
      await setEmailOptedOut(user.Id, false);
      log.info("email re-opt-in via form", { userId: user.Id });
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
    // A pre-existing valid link was already delivered when it was created.
    let delivery: DeliveryResult = { delivered: true, channel: null };
    if (isNew) {
      delivery = await sendUpdateLink({
        linkSlug: link.Slug,
        toEmail: user.Email || undefined,
        toPhone: user.Phone || undefined,
        updateUrl,
        userId: user.Id,
        smsOptedOut,
      });
    }

    // A non-delivery here is not a server error: the user exists but is simply
    // unreachable right now (e.g. SMS is their only channel and it's disabled).
    // Return 200 with delivered:false so the auto-lookup can silently no-op
    // rather than surfacing an error the user can't act on.
    if (!delivery.delivered) {
      return NextResponse.json({ success: true, delivered: false, channel: null });
    }

    return NextResponse.json({
      success: true,
      delivered: true,
      channel: delivery.channel,
    });
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

    // Submitting the update form re-opts the user into the channel(s) they
    // provided (the form carries the consent disclaimer). A single deliberate
    // submit, so we clear unconditionally rather than depend on the update
    // response carrying the prior opt-out flags. NB: local re-opt-in only — a
    // user who texted STOP must text START before Twilio will deliver again.
    if (phone && phone.trim()) {
      await setSmsOptedOut(link.User.Id, false);
    }
    if (email && email.trim()) {
      await setEmailOptedOut(link.User.Id, false);
    }
    log.info("re-opt-in via update form", {
      userId: link.User.Id,
      sms: !!(phone && phone.trim()),
      email: !!(email && email.trim()),
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
