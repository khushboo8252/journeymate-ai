const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendDriverApprovalRequestEmail = async (driver) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "New Driver Approval Request - Ukyro",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Driver Approval Request</h2>
          <p>A new driver has submitted their profile for approval:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${driver.fullName}</p>
            <p><strong>Email:</strong> ${driver.email}</p>
            <p><strong>Phone:</strong> ${driver.phone}</p>
            <p><strong>Vehicle Number:</strong> ${driver.vehicleNumber}</p>
            <p><strong>Vehicle Seats:</strong> ${driver.vehicleSeats}</p>
          </div>
          
          <p>Please review the driver's documents and approve/reject their profile in the admin dashboard.</p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated email from Ukyro. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Driver approval request email sent to admin");
  } catch (error) {
    console.error("Error sending driver approval request email:", error);
  }
};

const sendDriverApprovalEmail = async (driverEmail, driverName, approved) => {
  try {
    const subject = approved ? "Driver Profile Approved - Ukyro" : "Driver Profile Rejected - Ukyro";
    const message = approved
      ? "Congratulations! Your driver profile has been approved. You can now start publishing rides."
      : "Your driver profile has been rejected. Please review your documents and submit again.";

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: driverEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${approved ? '#22c55e' : '#ef4444'};">${approved ? 'Profile Approved' : 'Profile Rejected'}</h2>
          <p>Dear ${driverName},</p>
          <p>${message}</p>
          
          ${approved ? `
            <p>You can now:</p>
            <ul>
              <li>Publish rides on the platform</li>
              <li>Accept passenger bookings</li>
              <li>Start earning money</li>
            </ul>
          ` : `
            <p>If you believe this is a mistake, please contact support or review your documents and submit your profile again.</p>
          `}
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated email from Ukyro. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Driver ${approved ? 'approval' : 'rejection'} email sent to ${driverEmail}`);
  } catch (error) {
    console.error("Error sending driver approval email:", error);
  }
};

module.exports = {
  sendDriverApprovalRequestEmail,
  sendDriverApprovalEmail,
};
