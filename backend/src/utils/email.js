const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
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

const sendBookingNotificationEmail = async (driverEmail, driverName, passengerName, passengerPhone, rideOrigin, rideDestination, rideDate, seatsBooked, baseTotal, platformFee, upfrontAmount, remainingAmount) => {
  try {
    const totalWithFee = baseTotal + platformFee;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: driverEmail,
      subject: "New Booking Received - Ukyro",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">New Booking Received!</h2>
          <p>Dear ${driverName},</p>
          <p>You have received a new booking on your ride. Here are the details:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Passenger Information</h3>
            <p><strong>Name:</strong> ${passengerName}</p>
            <p><strong>Phone:</strong> ${passengerPhone}</p>
            <p><strong>Seats Booked:</strong> ${seatsBooked}</p>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Ride Information</h3>
            <p><strong>From:</strong> ${rideOrigin}</p>
            <p><strong>To:</strong> ${rideDestination}</p>
            <p><strong>Date:</strong> ${new Date(rideDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Time:</strong> ${new Date(rideDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Payment Information</h3>
            <p><strong>Base Fare:</strong> ₹${baseTotal}</p>
            <p><strong>Platform Fee + GST (5%):</strong> ₹${platformFee}</p>
            <p style="font-size: 16px; font-weight: bold; color: #f59e0b; margin-top: 10px;"><strong>Remaining Payment:</strong> ₹${remainingAmount}</p>
          </div>
          
          <p>Please contact the passenger to confirm pickup details. The passenger has paid the upfront amount.</p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated email from Ukyro. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Booking notification email sent to ${driverEmail}`);
  } catch (error) {
    console.error("Error sending booking notification email:", error);
  }
};

module.exports = {
  sendDriverApprovalRequestEmail,
  sendDriverApprovalEmail,
  sendBookingNotificationEmail,
};
