export interface StatusPanelContent {
  signUpTitle: string;
  signUpBody: string;
  updateTitle: string;
  updateBody: string;
  linkSentTitle: string;
  linkSentBody: string;
  confirmEmailTitle: string;
  confirmEmailBody: string;
}

export const defaultStatusContent: StatusPanelContent = {
  signUpTitle: "Thank You for Signing Up",
  signUpBody:
    "We're excited to have you in our coalition and to work with you in advocating for American Democracy and Jewish Security. Our semi-regularnewsletter will find its way to you soon, and in the mean time we invite you to join our WhatsApp Group.",
  updateTitle: "Your Info Has Been Updated",
  updateBody:
    "Your information has been saved successfully. Thank you for keeping your details up to date — it helps us coordinate more effectively and keep you in the loop. If you aren't already part of our WhatsApp group, we invite you to join.",
  linkSentTitle: "Check Your Inbox",
  linkSentBody:
    "We found your existing record and have sent a link to update your information. Please check your email or phone for the update link.",
  confirmEmailTitle: "Check Your Email",
  confirmEmailBody:
    "We've sent a confirmation link to your email. Click it to verify and get the link to join our WhatsApp group.",
};
