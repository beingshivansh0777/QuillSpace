import fs from "fs";
import SupportTicket from "../models/supportTicketModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import imagekit from "../configs/imageKit.js";
import resend from "../configs/resend.js";
import buildEmail from "../utils/emailTemplate.js";

const CATEGORY_LABELS = {
  bug: "Bug",
  feature_request: "Feature Request",
  account_issue: "Account Issue",
  other: "Other",
};

const notifyAllAdmins = async ({ actor, type, ticket }) => {
  const admins = await User.find({ role: "admin" }).select("_id");
  await Notification.insertMany(
    admins
      .filter((a) => a._id.toString() !== actor) // don't notify an admin about their own action
      .map((a) => ({
        recipient: a._id,
        actor,
        type,
        ticket,
      }))
  );
};

// POST /api/tickets — create a new support ticket
export const createTicket = async (req, res) => {
  try {
    const { category, description } = req.body;

    if (!category || !description?.trim()) {
      return res.json({ success: false, message: "Please fill in category and description." });
    }

    let screenshot = null;
    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: req.file.originalname,
        folder: "/tickets",
      });
      screenshot = imagekit.url({ path: response.filePath });
    }

    const ticket = await SupportTicket.create({
      user: req.user.id,
      category,
      description: description.trim(),
      screenshot,
      messages: [
        {
          sender: req.user.id,
          senderRole: "user",
          content: description.trim(),
        },
      ],
    });

    const user = await User.findById(req.user.id);

    // Confirmation email to the user
    try {
      await resend.emails.send({
        from: "QuillSpace <onboarding@resend.dev>",
        to: user.email,
        subject: "We received your support ticket",
        html: buildEmail({
          heading: "We've got your ticket",
          bodyHtml: `
            <p>Hi ${user.name}, thanks for reaching out. Here's what you submitted:</p>
            <p style="background:#FBF9F5; padding:12px 16px; border-radius:8px; margin-top:12px;">
              <strong>${CATEGORY_LABELS[category]}</strong><br/>${description.trim()}
            </p>
            <p style="margin-top:16px;">Our team will get back to you soon.</p>
          `,
        }),
      });
    } catch (emailError) {
      console.log("Failed to send ticket confirmation email:", emailError.message);
    }

    // Notify all admins in-app
    await notifyAllAdmins({ actor: req.user.id, type: "new_ticket", ticket: ticket._id });

    res.json({ success: true, message: "Ticket submitted!", ticket });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/tickets/mine — the logged-in user's own tickets
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/tickets/admin/all — every ticket, admin only
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({})
      .populate("user", "name email")
      .sort({ updatedAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/tickets/:id — owner or admin only
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("user", "name email")
      .populate("messages.sender", "name role avatar");

    if (!ticket) {
      return res.json({ success: false, message: "Ticket not found." });
    }
    if (ticket.user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.json({ success: false, message: "Not authorized to view this ticket." });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/tickets/:id/reply — owner or admin
export const replyToTicket = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.json({ success: false, message: "Reply can't be empty." });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.json({ success: false, message: "Ticket not found." });
    }

    const isOwner = ticket.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.json({ success: false, message: "Not authorized to reply to this ticket." });
    }

    ticket.messages.push({
      sender: req.user.id,
      senderRole: isAdmin ? "admin" : "user",
      content: content.trim(),
    });

    // A reply reopens a resolved/closed ticket automatically, unless an
    // admin is the one replying (they might just be adding a closing note).
    if (!isAdmin && (ticket.status === "resolved" || ticket.status === "closed")) {
      ticket.status = "open";
    }

    await ticket.save();

    if (isAdmin) {
      // notify + email the ticket owner
      await Notification.create({
        recipient: ticket.user,
        actor: req.user.id,
        type: "ticket_reply",
        ticket: ticket._id,
      });

      try {
        const owner = await User.findById(ticket.user);
        await resend.emails.send({
          from: "QuillSpace <onboarding@resend.dev>",
          to: owner.email,
          subject: "New reply on your support ticket",
          html: buildEmail({
            heading: "You have a new reply",
            bodyHtml: `<p>Our team replied to your support ticket:</p><p style="background:#FBF9F5; padding:12px 16px; border-radius:8px; margin-top:12px;">${content.trim()}</p>`,
            ctaText: "View ticket",
            ctaUrl: `${process.env.CLIENT_URL}/support/${ticket._id}`,
          }),
        });
      } catch (emailError) {
        console.log("Failed to send ticket-reply email:", emailError.message);
      }
    } else {
      // user replied — notify admins in-app only
      await notifyAllAdmins({ actor: req.user.id, type: "ticket_reply", ticket: ticket._id });
    }

    res.json({ success: true, message: "Reply sent.", ticket });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// PATCH /api/tickets/:id/status — admin only
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res.json({ success: false, message: "Invalid status." });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.json({ success: false, message: "Ticket not found." });
    }

    ticket.status = status;
    await ticket.save();

    await Notification.create({
      recipient: ticket.user,
      actor: req.user.id,
      type: "ticket_status_changed",
      ticket: ticket._id,
    });

    res.json({ success: true, message: "Status updated.", ticket });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};