const nodeMailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const email = process.env.nodeMailerEmail;
const password = process.env.nodeMailerPassword;

const transporter = nodeMailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: email,
    pass: password,
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
          console.log(error);
          reject({ success: false, error });
        }
        console.log(info);
        resolve({ success: true, info });
      });
    });
  },
};
