const resetOTPTemplate = (name, otp) => `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<style>

body{
    margin:0;
    padding:30px;
    background:#f4f7fb;
    font-family:Arial,sans-serif;
}

.container{
    max-width:600px;
    margin:auto;
    background:#ffffff;
    border-radius:12px;
    padding:40px;
}

.logo{
    text-align:center;
    font-size:30px;
    font-weight:bold;
    color:#4F46E5;
}

.title{
    margin-top:30px;
    font-size:24px;
    font-weight:bold;
}

.text{
    color:#555;
    line-height:1.7;
    margin-top:20px;
}

.otp{

    margin:35px auto;

    width:220px;

    text-align:center;

    padding:18px;

    font-size:34px;

    letter-spacing:8px;

    font-weight:bold;

    color:#4F46E5;

    border-radius:10px;

    background:#EEF2FF;

}

.note{

    margin-top:30px;

    color:#777;

    font-size:14px;

}

.footer{

    margin-top:40px;

    color:#999;

    font-size:13px;

    text-align:center;

}

</style>

</head>

<body>

<div class="container">

<div class="logo">

Resuvix AI

</div>

<div class="title">

Password Reset OTP

</div>

<div class="text">

Hello <b>${name}</b>,

<br><br>

We received a request to reset your password.

Use the OTP below to continue.

</div>

<div class="otp">

${otp}

</div>

<div class="text">

This OTP is valid for <b>10 minutes</b>.

Do not share this code with anyone.

</div>

<div class="note">

If you didn't request a password reset, you can safely ignore this email.

</div>

<div class="footer">

© ${new Date().getFullYear()} Resuvix AI

</div>

</div>

</body>

</html>
`;

export default resetOTPTemplate;