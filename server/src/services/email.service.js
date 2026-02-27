import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false, // TLS via STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM =
  process.env.EMAIL_FROM || 'NIT Kurukshetra Careers <noreply@nitkkr.ac.in>';

/**
 * Send email verification OTP to the applicant.
 * Fire-and-forget — do not await the returned promise in the caller.
 */
export const sendVerificationOTP = (email, otp) => {
  return transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Verify your email — NIT Kurukshetra Careers',
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
 * Fire-and-forget — do not await the returned promise in the caller.
 */
export const sendPasswordResetOTP = (email, otp) => {
  return transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Password Reset OTP — NIT Kurukshetra Careers',
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
 * Fire-and-forget — do not await the returned promise in the caller.
 */
export const sendApplicationConfirmation = (
  email,
  { applicationNumber, jobTitle }
) => {
  return transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Application Submitted — ${applicationNumber}`,
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
      <p style="margin-top: 16px;">Please retain this email for your records. You can also download your submission receipt from the portal.</p>
    `,
  });
};
