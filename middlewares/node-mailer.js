const nodeMailer = require('nodemailer');
const dotenv = require('dotenv');
const xoauth2 = require('xoauth2');

dotenv.config();

const email = process.env.nodeMailerEmail;

const transporter = nodeMailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    xoauth2: xoauth2.createXOAuth2Generator({
      user: email,
      clientId: process.env.nodeMailerClId,
      clientSecret: process.env.nodeMailerSecret,
    }),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = {
  registerByMail: (receiverEmail, otp) => {
    console.log('Sending mail!');
    const mailOptions = {
      from: `"Caro Xịn Sò" ${email}`,
      to: `${receiverEmail}`,
      subject: 'Xác thực Email Qua Google',
      text:
        `Nhập mã OTP tương ứng để kích hoạt email của bạn: ${otp} \n`
        + 'Vui lòng không cung cấp OTP này ch ai khác!',
    };
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error', error);
          reject({ success: false, error });
        }
        console.log('Info', info);
        resolve({ success: true, info });
      });
    });
  },
};
