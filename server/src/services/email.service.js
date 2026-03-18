import sgMail from '@sendgrid/mail';

// SendGrid sends over HTTPS (port 443), bypassing Render's SMTP port restrictions.
// Docs: https://github.com/sendgrid/sendgrid-nodejs/tree/main/packages/mail
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = process.env.EMAIL_FROM || 'noreply@nitkkr.ac.in';

/**
 * Helper to wrap sgMail.send with essential error logging.
 */
const sendMailWithLogging = async (mailOptions) => {
  try {
    await sgMail.send(mailOptions);
  } catch (error) {
    const details = error.response?.body?.errors?.[0]?.message ?? error.message;
    console.error(`❌ Email failed to ${mailOptions.to}:`, details);
    throw error;
  }
};

/**
 * Send email verification OTP to the applicant.
 * Fire-and-forget - do not await the returned promise in the caller.
 */
export const sendVerificationOTP = (email, otp) => {
  return sendMailWithLogging({
    from: FROM,
    to: email,
    subject: 'Verify your email - NIT Kurukshetra Careers',
    text: `Your email verification OTP is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`,
    html: `
      <p>Hello,</p>
      <p>Your email verification OTP for NIT Kurukshetra Careers Portal is:</p>
      <h2 style="letter-spacing: 4px;">${otp}</h2>
      <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
};

/**
 * Send password reset OTP to the applicant.
 * Fire-and-forget - do not await the returned promise in the caller.
 */
export const sendPasswordResetOTP = (email, otp) => {
  return sendMailWithLogging({
    from: FROM,
    to: email,
    subject: 'Password Reset OTP - NIT Kurukshetra Careers',
    text: `Your password reset OTP is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`,
    html: `
      <p>Hello,</p>
      <p>Your password reset OTP for NIT Kurukshetra Careers Portal is:</p>
      <h2 style="letter-spacing: 4px;">${otp}</h2>
      <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  });
};

/**
 * Send application submission confirmation email.
 * Fire-and-forget - do not await the returned promise in the caller.
 */
export const sendApplicationConfirmation = (
  email,
  { applicationNumber, jobTitle }
) => {
  return sendMailWithLogging({
    from: FROM,
    to: email,
    subject: `Application Submitted - ${applicationNumber}`,
    text: `Your application ${applicationNumber} for the position of ${jobTitle} has been successfully submitted.`,
    html: `
      <p>Dear Applicant,</p>
      <p>Your application has been successfully submitted to NIT Kurukshetra.</p>
      <table style="border-collapse: collapse; margin-top: 12px;">
        <tr>
          <td style="padding: 4px 12px 4px 0; font-weight: bold;">Application Number</td>
          <td style="padding: 4px 0;">${applicationNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 12px 4px 0; font-weight: bold;">Position</td>
          <td style="padding: 4px 0;">${jobTitle}</td>
        </tr>
      </table>
      <p style="margin-top: 16px;">Please retain this email for your records. You can also download your application summary from the portal.</p>
    `,
  });
};

/**
 * Send application status update notification.
 * Fire-and-forget.
 */
export const sendApplicationStatusUpdate = (
  email,
  { applicationNumber, status, remarks }
) => {
  return sendMailWithLogging({
    from: FROM,
    to: email,
    subject: `Application Status Updated - ${applicationNumber}`,
    text: `The status of your application ${applicationNumber} has been updated to "${status}".${remarks ? `\n\nRemarks: ${remarks}` : ''}`,
    html: `
      <p>Dear Applicant,</p>
      <p>The status of your application for NIT Kurukshetra has been updated.</p>
      <table style="border-collapse: collapse; margin-top: 12px;">
        <tr>
          <td style="padding: 4px 12px 4px 0; font-weight: bold;">Application Number</td>
          <td style="padding: 4px 0;">${applicationNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 12px 4px 0; font-weight: bold;">New Status</td>
          <td style="padding: 4px 0;"><strong>${status.toUpperCase()}</strong></td>
        </tr>
      </table>
      ${remarks ? `<p style="margin-top: 16px;"><strong>Remarks:</strong><br/>${remarks}</p>` : ''}
      <p style="margin-top: 24px;">Please log in to the recruitment portal for further details.</p>
    `,
  });
};
