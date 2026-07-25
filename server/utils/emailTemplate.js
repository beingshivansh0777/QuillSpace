// A single branded HTML shell used by every email QuillSpace sends —
// welcome, password reset/changed, newsletter confirmation. Keeps every
// email visually consistent instead of each one being a one-off inline
// HTML string with its own styling.
//
// Email clients don't reliably support custom web fonts or modern CSS,
// so this intentionally sticks to inline styles, table-safe layout, and
// web-safe font fallbacks (Georgia for the serif "brand" feel) rather
// than trying to import Instrument Serif/JetBrains Mono like the site does.

const buildEmail = ({
  name = "there",
  heading,
  bodyHtml,
  ctaText,
  ctaUrl,
  securityNote = null,
}) => `
<div style="background:#FBF9F5;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <div
    style="
      max-width:560px;
      width:100%;
      margin:0 auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      border:1px solid rgba(36,31,46,0.08);
      box-shadow:0 8px 30px rgba(0,0,0,0.05);
    "
  >

    <!-- Header -->
    <div
      style="
        background:linear-gradient(135deg,#1B1830 0%,#2E1F66 100%);
        padding:32px 24px;
        text-align:center;
      "
    >

      <img
        src="https://ik.imagekit.io/luckymishra/title.jpeg"
        alt="QuillSpace"
        width="60"
        height="60"
        style="display:block;margin:0 auto 14px;"
      />

      <div
        style="
          color:#ffffff;
          font-size:28px;
          font-family:Georgia,'Times New Roman',serif;
          font-style:italic;
          letter-spacing:0.5px;
        "
      >
        QuillSpace
      </div>

    </div>

    <!-- Content -->
    <div style="padding:32px 28px;">

      <p
        style="
          margin:0 0 14px;
          color:#666;
          font-size:15px;
        "
      >
        Hi ${name},
      </p>

      <h1
        style="
          margin:0 0 18px;
          font-size:24px;
          line-height:1.3;
          color:#241F2E;
          font-family:Georgia,'Times New Roman',serif;
        "
      >
        ${heading}
      </h1>

      <div
        style="
          font-size:15px;
          line-height:1.8;
          color:#444;
        "
      >
        ${bodyHtml}
      </div>

      ${
        ctaText && ctaUrl
          ? `
          <hr style="border:none;border-top:1px solid #ECE8E2;margin:28px 0;" />

          <div style="text-align:center;">
            <a
              href="${ctaUrl}"
              style="
                display:inline-block;
                padding:14px 34px;
                background:#5044E5;
                color:#ffffff;
                border-radius:999px;
                text-decoration:none;
                font-weight:700;
                font-size:15px;
              "
            >
              ${ctaText}
            </a>
          </div>
        `
          : ""
      }

      ${
        securityNote
          ? `
          <hr style="border:none;border-top:1px solid #ECE8E2;margin:28px 0;" />

          <div
            style="
              background:#F7F7FB;
              border-left:4px solid #5044E5;
              padding:16px;
              border-radius:10px;
              font-size:13px;
              line-height:1.7;
              color:#555;
            "
          >
            <strong>Security Note</strong><br><br>
            ${securityNote}
          </div>
        `
          : ""
      }

      <hr style="border:none;border-top:1px solid #ECE8E2;margin:28px 0;" />

      <p
        style="
          margin:0;
          color:#444;
          font-size:14px;
          line-height:1.8;
        "
      >
        Thanks,<br />
        <strong>QuillSpace Team</strong><br />
        <span style="color:#777;">
          Building beyond limits.
        </span>
      </p>

    </div>

    <!-- Footer -->
    <div
      style="
        padding:24px;
        text-align:center;
        background:#FBF9F5;
        border-top:1px solid rgba(36,31,46,0.08);
      "
    >

      <p
        style="
          margin:0;
          color:#777;
          font-size:12px;
          line-height:1.7;
        "
      >
        Need help?<br />
        support@quillspace.ai
      </p>

      <p
        style="
          margin-top:18px;
          color:#999;
          font-size:11px;
          line-height:1.7;
        "
      >
        © 2026 QuillSpace. All rights reserved.
        <br /><br />
        This is an automated email.
        Please do not reply.
      </p>

    </div>

  </div>

</div>
`;

export default buildEmail;