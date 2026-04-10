/**
 * get-in-touch-form controller
 */

import { factories } from '@strapi/strapi';

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function subjectSnippet(value: unknown, max = 60): string {
  if (value === null || value === undefined || value === '') {
    return 'New submission';
  }
  return String(value).replace(/[\r\n]+/g, ' ').trim().slice(0, max) || 'New submission';
}

export default factories.createCoreController(
  'api::get-in-touch-form.get-in-touch-form',
  ({ strapi }) => ({
    async create(ctx) {
      const response = await super.create(ctx);

      const { fullName, email, phoneNumber, city, state, countryCode, role } =
        response.data ?? {};

      const phoneDisplay =
        [countryCode, phoneNumber].filter(Boolean).join(' ').trim() || null;

      const emailTrimmed =
        email != null && String(email).trim() !== '' ? String(email).trim() : '';
      const emailHtml = emailTrimmed
        ? `<a href="mailto:${escapeHtml(emailTrimmed)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(emailTrimmed)}</a>`
        : '—';

      try {
        const notificationEmail =
          process.env.NOTIFICATION_EMAIL || process.env.SMTP_USERNAME;

        const nameForSubject = subjectSnippet(fullName);

        await strapi.service('plugin::email.email').send({
          to: notificationEmail,
          subject: `Get in touch: ${nameForSubject}`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Get in touch submission</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:24px 28px;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">Codeswift</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;line-height:1.3;color:#f8fafc;">New get in touch submission</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#cbd5e1;">Someone submitted the form on your site. Details are below.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;width:38%;vertical-align:top;">Full name</td>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:15px;line-height:1.5;color:#18181b;vertical-align:top;">${escapeHtml(fullName)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;vertical-align:top;">Email</td>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:15px;line-height:1.5;color:#18181b;vertical-align:top;">${emailHtml}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;vertical-align:top;">Phone</td>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:15px;line-height:1.5;color:#18181b;vertical-align:top;">${escapeHtml(phoneDisplay)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;vertical-align:top;">City</td>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:15px;line-height:1.5;color:#18181b;vertical-align:top;">${escapeHtml(city)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;vertical-align:top;">State</td>
                  <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:15px;line-height:1.5;color:#18181b;vertical-align:top;">${escapeHtml(state)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;vertical-align:top;">Role</td>
                  <td style="padding:12px 0;font-size:15px;line-height:1.5;color:#18181b;vertical-align:top;">${escapeHtml(role)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-size:12px;line-height:1.5;color:#a1a1aa;">
              This message was sent automatically from your Strapi get in touch form.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim(),
        });
      } catch (error) {
        strapi.log.error(
          'Failed to send get-in-touch-form email notification:',
          error,
        );
      }

      return response;
    },
  }),
);
