import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { sendSignupConfirmation } from "@/lib/notifications";
import { createPresignedLink } from "@/lib/presignedLinks";
import { runExclusive } from "@/lib/runExclusive";
import {
  createUser,
  findUser,
  findUserByPhone,
  updateUser,
  checkEmailPhoneUniqueness,
  type UserRecord,
} from "@/lib/users";
import {
  parseJsonBody,
  joinUsPayloadSchema,
  buildConflictResponse,
  handleApiError,
} from "@/lib/api";

const log = logger.child({ component: "signup" });

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
      // Bypass mode: a signup whose phone matches an existing *unverified*
      // record (e.g. an imported contact we can't yet text) merges onto that
      // record instead of being rejected as a duplicate phone. It is then
      // re-verified via the mandatory email link below. A verified phone match
      // is still treated as a duplicate.
      let mergeTarget: UserRecord | null = null;
      if (config.bypassVerification && phone.trim()) {
        const byPhone = await findUserByPhone(phone);
        if (byPhone?.Id && byPhone.Verified === false) {
          mergeTarget = byPhone;
        }
      }

      const { emailTaken, phoneTaken } = await checkEmailPhoneUniqueness(
        email,
        phone,
        mergeTarget?.Id,
      );
      // With a merge target its own phone is excluded, so phoneTaken reflects a
      // *different* record. A taken email (any other record) still blocks — we
      // won't collapse two distinct records together.
      if (emailTaken || phoneTaken) {
        log.info("signup rejected: duplicate", {
          emailTaken,
          phoneTaken,
          merge: !!mergeTarget,
        });
        return buildConflictResponse(emailTaken, phoneTaken);
      }

      const user = mergeTarget
        ? await updateUser(mergeTarget.Id!, {
            name,
            email,
            phone,
            states,
            congressionalDistrict,
          })
        : await createUser({
            name,
            email,
            phone,
            states,
            congressionalDistrict,
          });
      log.info(mergeTarget ? "user merged (verification bypass)" : "user created", {
        userId: user.Id,
      });

      if (user.Id) {
        const { link, isNew } = await createPresignedLink(user.Id);
        const baseUrl = config.app.baseUrl;
        const confirmUrl = `${baseUrl}/join-us/confirm/${link.Slug}`;
        log.info("signup confirmation", {
          userId: user.Id,
          slug: link.Slug,
          isNew,
          sent: isNew,
        });
        if (isNew) {
          const delivery = await sendSignupConfirmation({
            linkSlug: link.Slug,
            toEmail: email,
            toPhone: phone || undefined,
            name,
            confirmUrl,
            userId: user.Id,
            smsOptedOut: user.SmsOptedOut,
          });
          // The record was created, but we couldn't deliver the confirmation
          // link (e.g. its channel is disabled): surface failure so the UI does
          // not falsely tell the user to check their inbox.
          if (!delivery.delivered) {
            return NextResponse.json(
              {
                error:
                  "We couldn't send your confirmation link right now. Please try again later.",
                delivered: false,
              },
              { status: 502 },
            );
          }
        }
      }

      return NextResponse.json({ success: true, user }, { status: 201 });
    });
  } catch (error) {
    return handleApiError(error, "Failed to create user");
  }
}
