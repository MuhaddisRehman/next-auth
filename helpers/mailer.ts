import User from "@/Models/userModel";
import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

interface Props {
  email: string;
  emailType: string;
  userId: number;
}

export const sendEmail = async ({ email, emailType, userId }: Props) => {
  const hashedToken = await bcryptjs.hash(userId.toString(), 10);
  const tokenExpiry = Date.now() + 3600000; // 1 hour expiry

  try {
    if (emailType === "VERIFY") {
      await User.findByIdAndUpdate(userId, {
        verifyToken: hashedToken,
        verifyTokenExpiry: tokenExpiry,
      });
    } else if (emailType === "RESET") {
      await User.findByIdAndUpdate(userId, {
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: tokenExpiry,
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject:
        emailType === "VERIFY" ? "Verify your email" : "Reset your password",
      html:
        emailType === "VERIFY"
          ? `<p>Please verify your email by clicking the link below:</p>
           <a href="${process.env.DOMAIN}/verify-email?token=${hashedToken}">Verify Email</a>`
          : `<p>You can reset your password by clicking the link below:</p>
           <a href="${process.env.DOMAIN}/reset-password?token=${hashedToken}">Reset Password</a>`,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    console.log("Mail sent: ", mailResponse);
  } catch (error: any) {
    console.error("Error sending email: ", error);
    throw new Error("Error sending email");
  }
};
