import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import ejs from "ejs";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT), // Parse port as number
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (
  to: string,
  subject: string,
  htmlFile: string,
  context: any
) => {
  console.log(
    process.env.EMAIL_HOST,
    process.env.EMAIL_PORT,
    process.env.EMAIL_SECURE,
    process.env.EMAIL_USER,
    process.env.EMAIL_PASS
  );

  const htmlFilePath = path.resolve(__dirname, "../templates", htmlFile);
  const htmlTemplate = await fs.readFile(htmlFilePath, "utf-8");
  const html = ejs.render(htmlTemplate, context);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
