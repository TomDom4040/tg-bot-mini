require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Email settings:');
console.log('HOST:', process.env.EMAIL_HOST);
console.log('PORT:', process.env.EMAIL_PORT);
console.log('USER:', process.env.EMAIL_USER);
console.log('PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
console.log('FROM:', process.env.EMAIL_FROM);

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'people.us20@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email from admin panel'
    });
    
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Email error:', error.message);
  }
}

testEmail();
