/**
 * job-application controller
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

function formatMultiline(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value)
    .split(/\r?\n/)
    .map((line) => escapeHtml(line))
    .join('<br>');
}

type EducationEntry = {
  degree?: string;
  institution?: string;
  startYear?: string;
  endYear?: string;
};

type ExperienceEntry = {
  title?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
};

function normalizeComponentList<T>(items: unknown): T[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => {
    if (
      item &&
      typeof item === 'object' &&
      item !== null &&
      'attributes' in item &&
      (item as { attributes?: T }).attributes
    ) {
      return (item as { attributes: T }).attributes;
    }
    return item as T;
  });
}

function resumeLinkHtml(resume: unknown): string {
  if (resume === null || resume === undefined || String(resume).trim() === '') {
    return '—';
  }
  const r = String(resume).trim();
  const safe = escapeHtml(r);
  return `<a href="${safe}" style="color:#2563eb;text-decoration:none;word-break:break-all;">${safe}</a>`;
}

function row(label: string, valueHtml: string, withBorder = true): string {
  const border = withBorder ? 'border-bottom:1px solid #e4e4e7;' : '';
  return `
                <tr>
                  <td style="padding:12px 0;${border}font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;width:38%;vertical-align:top;">${label}</td>
                  <td style="padding:12px 0;${border}font-size:15px;line-height:1.5;color:#18181b;vertical-align:top;">${valueHtml}</td>
                </tr>`;
}

function buildEducationBlocks(educations: EducationEntry[]): string {
  if (!educations.length) {
    return '<p style="margin:0;font-size:15px;line-height:1.5;color:#71717a;">—</p>';
  }
  return educations
    .map((e, index) => {
      const years = [e.startYear, e.endYear].filter(Boolean).join(' – ') || null;
      return `
 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #e4e4e7;border-radius:6px;margin-top:${index === 0 ? '0' : '12px'};">
                <tr>
                  <td style="padding:14px 16px;background-color:#fafafa;font-size:13px;font-weight:600;color:#18181b;">Education ${index + 1}</td>
                </tr>
                <tr>
                  <td style="padding:0 16px 14px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      ${row('Degree', escapeHtml(e.degree), true)}
                      ${row('Institution', escapeHtml(e.institution), true)}
                      ${row('Years', escapeHtml(years), false)}
                    </table>
                  </td>
                </tr>
              </table>`;
    })
    .join('');
}

function buildExperienceBlocks(experiences: ExperienceEntry[]): string {
  if (!experiences.length) {
    return '<p style="margin:0;font-size:15px;line-height:1.5;color:#71717a;">—</p>';
  }
  return experiences
    .map((e, index) => {
      const period = [e.startDate, e.endDate].filter(Boolean).join(' – ') || null;
      return `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #e4e4e7;border-radius:6px;margin-top:${index === 0 ? '0' : '12px'};">
                <tr>
                  <td style="padding:14px 16px;background-color:#fafafa;font-size:13px;font-weight:600;color:#18181b;">Experience ${index + 1}</td>
                </tr>
                <tr>
                  <td style="padding:0 16px 14px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      ${row('Title', escapeHtml(e.title), true)}
                      ${row('Company', escapeHtml(e.company), true)}
                      ${row('Dates', escapeHtml(period), false)}
                    </table>
                  </td>
                </tr>
              </table>`;
    })
    .join('');
}

export default factories.createCoreController(
  'api::job-application.job-application',
  ({ strapi }) => ({
    async create(ctx) {
      const response = await super.create(ctx);

      const data = response.data ?? {};
      const {
        firstName,
        lastName,
        fullName,
        email,
        phone,
        countryCode,
        address,
        coverLetter,
        resume,
        jobSlug,
        education,
        experience,
      } = data;

      const phoneDisplay =
        [countryCode, phone].filter(Boolean).join(' ').trim() || null;

      const displayName =
        (fullName && String(fullName).trim()) ||
        [firstName, lastName].filter(Boolean).join(' ').trim() ||
        '';

      const emailTrimmed =
        email != null && String(email).trim() !== '' ? String(email).trim() : '';
      const emailHtml = emailTrimmed
        ? `<a href="mailto:${escapeHtml(emailTrimmed)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(emailTrimmed)}</a>`
        : '—';

      const educations = normalizeComponentList<EducationEntry>(education);
      const experiences = normalizeComponentList<ExperienceEntry>(experience);

      const educationSectionHtml = buildEducationBlocks(educations);
      const experienceSectionHtml = buildExperienceBlocks(experiences);

      const subjectJob = jobSlug ? subjectSnippet(jobSlug, 45) : null;
      const subjectPerson = subjectSnippet(displayName || 'Applicant', 45);
      const subject = subjectJob
        ? `Job application: ${subjectJob} — ${subjectPerson}`
        : `Job application: ${subjectPerson}`;

      try {
        const notificationEmail =
          process.env.NOTIFICATION_EMAIL || process.env.SMTP_USERNAME;

        await strapi.service('plugin::email.email').send({
          to: notificationEmail,
          subject,
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job application submission</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:24px 28px;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">Codeswift</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;line-height:1.3;color:#f8fafc;">New job application</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#cbd5e1;">A candidate applied via your careers form. Summary below.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                ${row('Job', escapeHtml(jobSlug), true)}
                ${row('First name', escapeHtml(firstName), true)}
                ${row('Last name', escapeHtml(lastName), true)}
                ${row('Full name', escapeHtml(fullName), true)}
                ${row('Email', emailHtml, true)}
                ${row('Phone', escapeHtml(phoneDisplay), true)}
                ${row('Address', escapeHtml(address), true)}
                ${row('Cover letter', formatMultiline(coverLetter), true)}
                ${row('Resume', resumeLinkHtml(resume), false)}
              </table>
              <p style="margin:24px 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Education</p>
              ${educationSectionHtml}
              <p style="margin:24px 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Experience</p>
              ${experienceSectionHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-size:12px;line-height:1.5;color:#a1a1aa;">
              This message was sent automatically from your Strapi job application form.
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
          'Failed to send job-application email notification:',
          error,
        );
      }

      return response;
    },
  }),
);
