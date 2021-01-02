const nodeMailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const email = process.env.nodeMailerEmail;
const password = process.env.nodeMailerPassword;

const transporter = nodeMailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: email,
    pass: password,
    // Get From Google Console OAuth Credential
    clientId: process.env.nodeMailerClId,
    clientSecret: process.env.nodeMailerSecret,
    // Get From Google Developer OAuth20 PlayGround
    refreshToken: process.env.nodeMailerRefreshToken,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = {
  registerByMail: (receiverEmail, otp) => {
    console.log('Sending mail!');
    const mailOptions = {
      from: `"Super Caro" ${email}`,
      to: `${receiverEmail}`,
      subject: 'Activate Your Account Via Google',
      text:
        `Provide Following OTP To Activate Your Account: ${otp} \n`
        + 'Please do not provide this OTP for anyone else!',
    };
    return new Promise((resolve) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error: ', error);
          resolve({ success: false, error });
        } else {
          console.log('Info:  ', info);
          resolve({ success: true, info });
        }
      });
    });
  },

  resendOTP: (receiverEmail, otp) => {
    console.log('Sending mail!');
    const mailOptions = {
      from: `"Super Caro" ${email}`,
      to: `${receiverEmail}`,
      subject: 'Resend OTP',
      text:
        `Provide Following OTP To Activate Or Reset Your Password Your Password: ${otp} \n`
        + 'If this is not you, ignore this email!',
    };
    return new Promise((resolve) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error: ', error);
          resolve({ success: false, error });
        } else {
          console.log('Info:  ', info);
          resolve({ success: true, info });
        }
      });
    });
  },
};
