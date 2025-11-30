import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
let resend;
if (apiKey) {
    resend = new Resend(apiKey);
} else {
    console.warn("RESEND_API_KEY is missing. Emails will be logged to console instead.");
}

const fromEmail = `IPU Friendlist <noreply@ipufriendlist.com>`;

export const sendOtpEmail = async (to, otp) => {
    if (!resend) {
        console.log(`[MOCK EMAIL] To: ${to}, OTP: ${otp}`);
        return;
    }
    try {
        await resend.emails.send({
            from: fromEmail,
            to: to,
            subject: 'Your Login OTP for IPU Friendlist',
            html: `<p>Your One-Time Password is: <strong>${otp}</strong></p>`,
        });
        console.log("OTP email sent successfully via Resend to", to);
    } catch (error) {
        console.error("Error sending OTP email via Resend:", error);
        throw error;
    }
};

// UPDATED Welcome Email Function
export const sendWelcomeEmail = async (userName, userEmail, userEnrollmentNo) => {
    // Make sure your frontend URL is set in your .env file for production
    const loginLink = process.env.FRONTEND_URL || 'https://ipufriendlist.com';

    const emailContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Hi ${userName},</h2>
            <p>Welcome to IPU Friendlist! Your account has been created, and we're excited for you to join our exclusive community at GTBIT.</p>
            
            <h3>Your First Login</h3>
            <p>You may now proceed to log in. On your first login, you will be prompted to create your permanent, anonymous alias (your "fake name"). This is how others will see you, so choose wisely!</p>
            
            <h3 style="margin-top: 30px;">How It Works</h3>
            <p>From now on, you can chat with random, verified strangers from within your campus. Here’s what you need to know:</p>
            <ul>
                <li><strong>Be Respectful:</strong> At the end of each chat, both users will rate each other. Your average public rating will be visible to everyone, helping to build a safe and trustworthy community.</li>
                <li><strong>Make a Connection:</strong> If you find someone who matches your vibe, send them a "Connect" request. If they accept, a private chatroom will be created where you can continue the conversation anytime.</li>
                <li><strong>You're in Control:</strong> Any saved chatroom can be permanently deleted by either person at any time.</li>
            </ul>
            
            <p>We can't wait to see the connections you'll make.</p>
            <p>Best,<br/>The IPU Friendlist Team</p>
        </div>
    `;

    try {
        if (!resend) {
            console.log(`[MOCK EMAIL] Welcome email to ${userEmail}`);
            return;
        }
        await resend.emails.send({
            from: fromEmail,
            to: userEmail,
            subject: 'Welcome to IPU Friendlist! Your Account is Ready!',
            html: emailContent,
        });
        console.log(`Welcome email sent successfully to ${userEmail}`);
    } catch (error) {
        console.error("Error sending welcome email via Resend:", error);
        throw error;
    }
};