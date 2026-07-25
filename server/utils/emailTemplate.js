// A single branded HTML shell used by every email QuillSpace sends —
// welcome, password reset/changed, newsletter confirmation. Keeps every
// email visually consistent instead of each one being a one-off inline
// HTML string with its own styling.
//
// Email clients don't reliably support custom web fonts or modern CSS,
// so this intentionally sticks to inline styles, table-safe layout, and
// web-safe font fallbacks (Georgia for the serif "brand" feel) rather
// than trying to import Instrument Serif/JetBrains Mono like the site does.

const buildEmail = ({ heading, bodyHtml, ctaText, ctaUrl }) => `
<div style="background-color:#FBF9F5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(36,31,46,0.08);">

    <div style="background: linear-gradient(135deg, #1B1830 0%, #2E1F66 100%); padding: 28px 32px;">
      <span style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 24px; color: #ffffff; letter-spacing: 0.5px;">
        QuillSpace
      </span>
    </div>

    <div style="padding: 32px;">
      <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; color: #241F2E; margin: 0 0 16px;">
        ${heading}
      </h1>

      <div style="font-size: 14px; line-height: 1.6; color: #444444;">
        ${bodyHtml}
      </div>

      ${
        ctaText && ctaUrl
          ? `<div style="margin: 28px 0 8px;">
              <a href="${ctaUrl}" style="background: #5044E5; color: #ffffff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                ${ctaText}
              </a>
            </div>`
          : ""
      }
    </div>

    <div style="padding: 20px 32px; border-top: 1px solid rgba(36,31,46,0.08); background: #FBF9F5;">
      <p style="font-size: 12px; color: #999999; margin: 0; line-height: 1.5;">
        This is an automated message from QuillSpace. Please do not reply to this email.
      </p>
    </div>

  </div>
</div>
`;

export default buildEmail;