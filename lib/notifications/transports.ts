import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { config } from "../config";

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<void> {
  const sg = config.sendgrid;
  if (!sg) return;
  sgMail.setApiKey(sg.apiKey);
  await sgMail.send({
    to,
    from: sg.fromEmail,
    subject,
    text,
    ...(html ? { html } : {}),
  });
}

export async function sendSms(to: string, body: string): Promise<void> {
  const sms = config.twilioSms;
  if (!sms) return;
  const client = twilio(sms.accountSid, sms.authToken);
  await client.messages.create({
    body,
    from: sms.messagingPhoneNumber,
    to,
  });
}
