import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request) {
  try {
    const { to, firstName, otp, status, type } = await request.json();

    if (!to) {
      return new Response("Recipient email is required", { status: 400 });
    }

    let msg;

    if (type === "account_creation") {
      //  Email for Operator Account Creation
      msg = {
        to,
        from: process.env.EMAIL_FROM,
        subject: "Operator Account Created - SAKE",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Hi, <strong>${firstName}</strong></h2>
            <p>Your Operator Account for SAKE has been created successfully. You can use the following credentials to log in:</p>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${otp}</p>
            <div style="margin: 20px 0;">
              <a href="https://yourwebsite.com/login" 
                 style="display: inline-block; background-color:rgb(40, 55, 167); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                 Go to your profile page
              </a>
            </div>
            <p><strong>Note:</strong> It is important to change this default password after logging in for the first time.</p>
            <p>Thank you!</p>
          </div>
        `,
      };
    } else if (type === "driver_account_creation") {
      //  Email for Driver Account Creation
      msg = {
        to,
        from: process.env.EMAIL_FROM,
        subject: "Welcome to SAKE - Your Driver Account is Ready",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Hi, <strong>${firstName}</strong></h2>
            <p>Your Driver Account for SAKE has been successfully created.</p>
            <p>You can use the following credentials to log in:</p>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${otp}</p>
            <div style="margin: 20px 0;">
              <a href="https://yourwebsite.com/driver-login" 
                 style="display: inline-block; background-color:rgb(40, 55, 167); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                 Log in to your driver account
              </a>
            </div>
            <p><strong>Note:</strong> Please change your password after logging in for security reasons.</p>
            <p>Drive safely, and welcome aboard!</p>
          </div>
        `,
      };
    } else if (type === "status_update") {
      let statusMessage = "";

      if (status === "Verified") {
        statusMessage = `
          <p>Congratulations! Your operator account has been verified. You now have full access to the SAKE system.</p>
          <p>You can log in and start managing your operations.</p>
          <div style="margin: 20px 0;">
            <a href="https://yourwebsite.com/login" 
               style="display: inline-block; background-color:rgb(40, 55, 167); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Log in to your account
            </a>
          </div>
          <p>Thank you for being part of SAKE!</p>
        `;
      } else if (status === "Suspended") {
        statusMessage = `
          <p>We regret to inform you that your operator account has been suspended.</p>
          <p>If you believe this is an error or wish to appeal, please contact our support team for further assistance.</p>
          <p>We appreciate your understanding.</p>
        `;
      } else {
        statusMessage = `<p>Your account status has been updated to: <strong>${status}</strong>.</p>`;
      }

      //  Email for Operator Status Update
      msg = {
        to,
        from: process.env.EMAIL_FROM,
        subject: "Account Status Update - SAKE",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Hi, <strong>${firstName}</strong></h2>
            ${statusMessage}
          </div>
        `,
      };
    } else if (type === "operator_status_update") {
      let statusMessage = "";

      if (status === "Verified") {
        statusMessage = `
          <p>Great news! Your operator account has been verified.</p>
          <p>You now have full access to SAKE's account.</p>
          <div style="margin: 20px 0;">
            <a href="https://yourwebsite.com/operator-login" 
               style="display: inline-block; background-color:rgb(40, 55, 167); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Log in to your operator account
            </a>
          </div>
          <p>Welcome aboard, and thank you for being part of SAKE!</p>
        `;
      } else if (status === "Suspended") {
        statusMessage = `
          <p>We regret to inform you that your operator account has been suspended.</p>
          <p>If you believe this is a mistake, please contact our support team.</p>
        `;
      } else {
        statusMessage = `<p>Your operator account status has been updated to: <strong>${status}</strong>.</p>`;
      }

      //  Email for Operator Status Update
      msg = {
        to,
        from: process.env.EMAIL_FROM,
        subject: "Account Status Update - SAKE",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Hi, <strong>${firstName}</strong></h2>
            ${statusMessage}
          </div>
        `,
      };
    } else {
      return new Response("Invalid email type", { status: 400 });
    }

    await sendgrid.send(msg);
    return new Response("Email sent successfully", { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response("Error sending email", { status: 500 });
  }
}
