import Subscriber from "../models/subscriberModel.js";
import resend from "../configs/resend.js";
import buildEmail from "../utils/emailTemplate.js";

// POST /api/newsletter/subscribe — public, no auth
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.json({ success: false, message: "Please enter a valid email." });
    }

    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.json({ success: true, message: "You're already subscribed!" });
    }

    await Subscriber.create({ email });

    try {
      await resend.emails.send({
        from: "QuillSpace <onboarding@resend.dev>",
        to: email,
        subject: "You're subscribed to QuillSpace",
        html: buildEmail({
          heading: "You're in!",
          bodyHtml: `<p>Thanks for subscribing to QuillSpace. We'll let you know when there's something worth reading.</p>`,
        }),
      });
    } catch (emailError) {
      console.log("Failed to send subscription confirmation email:", emailError.message);
      // Don't fail the subscription just because the confirmation email had an issue.
    }

    res.json({ success: true, message: "Subscribed! Check your inbox for a confirmation." });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};