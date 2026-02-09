const nodemailer = require('nodemailer');

const hasEmailConfig = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  );
};

const buildTransporter = () => {
  const port = Number(process.env.SMTP_PORT);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendWelcomeEmail = async ({ to, username }) => {
  if (!hasEmailConfig()) {
    return { skipped: true };
  }

  const transporter = buildTransporter();
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: 'Welcome to MovieShelf!',
    text: `Hi ${username}, welcome to MovieShelf! Your account is ready.`,
    html: `<p>Hi ${username},</p><p>Welcome to <strong>MovieShelf</strong>! Your account is ready.</p>`
  };

  await transporter.sendMail(mailOptions);
  return { sent: true };
};

module.exports = {
  sendWelcomeEmail
};
