const registerOTPTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 30px;
      background: #f4f7fb;
      font-family: Arial, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }
    .logo {
      text-align: center;
      font-size: 32px;
      font-weight: 800;
      color: #6C63FF;
      letter-spacing: -0.5px;
    }
    .title {
      margin-top: 24px;
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      text-align: center;
    }
    .text {
      color: #475569;
      line-height: 1.7;
      margin-top: 16px;
      font-size: 15px;
      text-align: center;
    }
    .otp {
      margin: 30px auto;
      width: 240px;
      text-align: center;
      padding: 18px;
      font-size: 36px;
      letter-spacing: 8px;
      font-weight: 800;
      color: #6C63FF;
      border-radius: 12px;
      background: #EEF2FF;
      border: 2px dashed #6C63FF;
    }
    .note {
      margin-top: 24px;
      color: #64748B;
      font-size: 13px;
      text-align: center;
    }
    .footer {
      margin-top: 36px;
      color: #94A3B8;
      font-size: 13px;
      text-align: center;
      border-top: 1px solid #E2E8F0;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Resuvix AI</div>
    <div class="title">Verify Your Email Address 🚀</div>
    <div class="text">
      Welcome to Resuvix AI! Use the 6-digit verification code below to complete your registration.
    </div>
    <div class="otp">${otp}</div>
    <div class="text">
      This code is valid for <b>10 minutes</b>. Please do not share it with anyone.
    </div>
    <div class="note">
      If you did not request this verification code, you can safely ignore this email.
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Resuvix AI. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export default registerOTPTemplate;
