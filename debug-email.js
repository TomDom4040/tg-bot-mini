require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('=== Email Configuration ===');
console.log('HOST:', process.env.EMAIL_HOST);
console.log('PORT:', process.env.EMAIL_PORT);
console.log('USER:', process.env.EMAIL_USER);
console.log('PASS:', process.env.EMAIL_PASS ? 'SET (' + process.env.EMAIL_PASS.length + ' chars)' : 'NOT SET');
console.log('FROM:', process.env.EMAIL_FROM);
console.log('BASE_URL:', process.env.BASE_URL);

async function testEmail() {
  console.log('\n=== Creating Transporter ===');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log('Transporter created');

  try {
    console.log('\n=== Verifying Connection ===');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
  } catch (error) {
    console.error('❌ SMTP verification failed:', error.message);
    return;
  }

  try {
    console.log('\n=== Sending Test Email ===');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'people.us20@gmail.com',
      subject: 'Test Email from Admin Panel',
      text: 'This is a test email from admin panel',
      html: '<h1>Test Email</h1><p>This is a test email from admin panel</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
