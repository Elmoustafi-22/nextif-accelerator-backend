import { env } from "../config/env";

export class EmailService {
  private static readonly BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

  /**
   * Internal helper to send email via Brevo HTTP API
   */
  private static async sendViaApi(options: {
    to: string;
    subject: string;
    html: string;
    senderName?: string;
  }) {
    if (!env.SMTP_PASS) {
      console.error(
        "❌ Email Error: SMTP_PASS (Brevo API Key) is not defined."
      );
      throw new Error("Brevo API Key is missing.");
    }

    const payload = {
      sender: {
        name: options.senderName || "NextIF",
        email: env.FROM_EMAIL,
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    };

    try {
      console.log(`Attempting to send email to ${options.to} via Brevo API...`);

      const response = await fetch(this.BREVO_API_URL, {
        method: "POST",
        headers: {
          "api-key": env.SMTP_PASS,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Brevo API Error: ${response.status} - ${JSON.stringify(data)}`
        );
      }

      console.log("Email sent successfully via Brevo API:", data);
      return data;
    } catch (error) {
      console.error("Failed to send email via Brevo API:", error);
      throw error;
    }
  }

  /**
   * Send Welcome Email to New Admin
   */
  static async sendAdminWelcomeEmail(
    to: string,
    firstName: string,
    lastName: string
  ) {
    const loginUrl = env.ADMIN_FRONTEND_URL;

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome, ${firstName}!</h2>
          <p>You have been added as an <strong>Administrator</strong> to the <strong>NextIF Fellow Portal</strong>.</p>
          
          <p>Please log in to the admin dashboard to manage fellows, tasks, and system settings.</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Login Instructions:</p>
            <ul style="margin: 10px 0;">
              <li><strong>URL:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
              <li>Click on <strong>First time logging in</strong> (Admin section), then sign in with:</li>
              <li><strong>Username:</strong> ${to}</li>
              <li><strong>Initial Password:</strong> Use your <strong>Last Name</strong> (case-sensitive)</li>
            </ul>
          </div>

          <p>If you encounter any errors, please send your complaints to <a href="mailto:mustapha.it@nextif.org">mustapha.it@nextif.org</a>.</p>
         
          <p style="color: #6b7280; font-size: 0.9em;">Important: You will be required to set a new password immediately after your first successful login.</p>
          
          <p>Best regards,<br/>The NextIF Technical Team</p>
        </div>
      `;

    return this.sendViaApi({
      to,
      subject: "Admin Access Granted: NextIF Fellow Portal",
      html,
    });
  }

  /**
   * Send Welcome Email to New Fellow - High Fidelity
   */
  static async sendFellowWelcomeEmail(
    to: string,
    firstName: string,
    lastName: string
  ) {
    const loginUrl = env.FRONTEND_URL;

    const html = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
    
    <!-- Header with Branding -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Welcome to NextIF Cohort 002</h1>
      <p style="margin-top: 10px; opacity: 0.9; font-size: 16px; font-weight: 400;">The Global Islamic Finance Career Mentorship & Accelerator</p>
    </div>

    <div style="padding: 35px; line-height: 1.6; color: #1e293b;">
      <h2 style="color: #4f46e5; margin-top: 0; font-size: 22px;">Assalamu Alaikum ${firstName},</h2>
      
      <p style="font-size: 16px;">Congratulations! You have been selected to join the next generation of <strong>Ethical Finance Leaders</strong>. You are now part of a 5-week virtual experience where you'll learn directly from world-renowned founders, innovators, and experts in Islamic Finance.</p>

      <p style="margin-top: 20px;">Your <strong>NextIF Fellows Portal</strong> is now active. This is your hub for mentorship, task management, and connecting with the community.</p>

      <!-- Credentials Card -->
      <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Your Secure Access Details</h3>
        
        <ul style="list-style: none; padding: 0; margin: 15px 0; color: #334155;">
          <li style="margin-bottom: 12px;">🌐 <strong>Portal URL:</strong> <a href="${loginUrl}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${loginUrl}</a></li>
          <li style="margin-bottom: 12px;">📧 <strong>Username:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${to}</span></li>
          <li style="margin-bottom: 12px;">🔑 <strong>Initial Password:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${lastName}</span> <small style="color: #64748b;">(Case-sensitive)</small></li>
        </ul>

        <p style="margin: 15px 0 0 0; font-size: 13px; color: #64748b; background: #fef9c3; padding: 10px; border-radius: 6px; border: 1px solid #fef08a;">
          <strong>Action Required:</strong> Click on "First time logging in" and you will be prompted to set a new password immediately.
        </p>
      </div>

      <div style="text-align: center; margin-top: 35px;">
        <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 16px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Enter the Fellows Portal</a>
      </div>

      <p style="margin-top: 40px; font-size: 14px; color: #475569;">If you encounter any issues during your first login, our technical team is here to help at <a href="mailto:mustapha.it@nextif.org" style="color: #4f46e5;">mustapha.it@nextif.org</a>.</p>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
      
      <p style="margin: 0; font-weight: bold; color: #1e293b;">Warm regards,</p>
      <p style="margin: 5px 0; color: #4f46e5; font-weight: 600;">The NextIF Team</p>
    </div>

    <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0;"><strong>NextIF Global Mentorship & Accelerator Program</strong></p>
      <p style="margin: 5px 0;">Empowering Innovators. Shariah-Aligned Excellence. Nurturing Leaders.</p>
    </div>
  </div>
`;

    return this.sendViaApi({
      to,
      subject: `Assalamu Alaikum ${firstName}: Welcome to NextIF Cohort 002!`,
      html,
    });
  }

  /**
   * Send Task Assigned Email
   */
  static async sendTaskAssignedEmail(
    to: string,
    firstName: string,
    taskTitle: string,
    dueDate: Date
  ) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Hello ${firstName},</h2>
          <p>A new task has been assigned to you on the <strong>NextIF Fellow Portal</strong>.</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Task Details:</p>
            <ul style="margin: 10px 0;">
              <li><strong>Title:</strong> ${taskTitle}</li>
              <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}</li>
            </ul>
          </div>
          
          <p>Please log in to your dashboard to view the full details and start working on it.</p>
          
          <p>Best regards,<br/>The NextIF Team</p>
        </div>
      `;

    try {
      await this.sendViaApi({
        to,
        subject: `New Task Assigned: ${taskTitle}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send task assignment email:", error);
    }
  }

  /**
   * Send Task Redo Email
   */
  static async sendTaskRedoEmail(
    to: string,
    firstName: string,
    taskTitle: string,
    remark: string,
    newDueDate: Date
  ) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #dc2626;">Redo Requested: ${taskTitle}</h2>
          <p>Hello ${firstName},</p>
          <p>The admin has reviewed your submission for <strong>${taskTitle}</strong> and requested some changes.</p>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">Admin Remark:</p>
            <p style="margin: 10px 0; color: #b91c1c;">"${remark}"</p>
            <p style="margin: 10px 0 0 0; font-weight: bold; color: #991b1b;">New Due Date:</p>
            <p style="margin: 5px 0 0 0; color: #b91c1c;">${newDueDate.toLocaleDateString()} ${newDueDate.toLocaleTimeString()}</p>
          </div>
          
          <p>Please address the feedback and resubmit the task by the new deadline.</p>
          
          <p>Best regards,<br/>The NextIF Team</p>
        </div>
      `;

    try {
      await this.sendViaApi({
        to,
        subject: `Action Required: Redo for ${taskTitle}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send task redo email:", error);
    }
  }

  /**
   * Send Event Notification Email - Refined with Program Vision
   */
  static async sendEventNotificationEmail(
    to: string,
    firstName: string,
    event: any
  ) {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <!-- Header Image/Color -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Next Generation of Ethical Finance Leaders</h1>
            <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">Nurturing the next leaders of Islamic Finance</p>
          </div>

          <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #4f46e5; margin-top: 0;">Assalamu Alaikum ${firstName},</h2>
            
            <p style="font-size: 16px;">Your journey in the <strong>Global Islamic Finance Career Mentorship & Accelerator Program</strong> continues! We are excited to announce a new milestone in your professional development.</p>

            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4f46e5;">
              <p style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 12px; color: #64748b; letter-spacing: 1px;">Upcoming Highlight</p>
              <h3 style="margin: 10px 0; color: #1e293b; font-size: 20px;">${event.title}</h3>
              
              <ul style="list-style: none; padding: 0; margin: 15px 0; color: #475569;">
                <li style="margin-bottom: 8px;">📍 <strong>Where:</strong> <a href="${event.location}" style="color: #4f46e5; text-decoration: none;">Join Virtual Session</a></li>
                <li style="margin-bottom: 8px;">📅 <strong>When:</strong> ${new Date(event.date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                <li style="margin-bottom: 8px;">⏰ <strong>Time:</strong> ${new Date(event.date).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</li>
                <li style="margin-bottom: 8px;">🎙️ <strong>Lead Expert:</strong> ${event.speaker || "World-Renowned Innovator"}</li>
              </ul>
            </div>

            <p>This is your opportunity to learn directly from founders, innovators, and experts as we explore <strong>Ethical Innovation</strong> and <strong>Shariah-aligned excellence</strong>.</p>
            
            <div style="text-align: center; margin-top: 35px;">
              <a href="${event.location}" style="background-color: #4f46e5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Secure Your Seat Now</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #64748b; font-style: italic;">"Being part of the NextIF experience means building the future of Halal Entrepreneurship across the globe."</p>
          </div>

          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">NextIF Global Mentorship & Accelerator Program (Cohort 002)</p>
            <p style="margin: 5px 0;">Empowering Innovators. Nurturing Leaders.</p>
          </div>
        </div>
      `;

    try {
      await this.sendViaApi({
        to,
        subject: `Assalamu Alaikum ${firstName}: New Mentorship Session - ${event.title}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send event notification email:", error);
    }
  }

  /**
   * Send Event Update (Recording) Email
   */
  static async sendEventUpdateEmail(
    to: string,
    firstName: string,
    event: any
  ) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Recording Available: ${event.title}</h2>
          <p>Hello ${firstName},</p>
          <p>The recording for the event <strong>${event.title}</strong> is now available.</p>
          
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #dcfce7;">
            <p style="margin: 0; font-weight: bold; color: #166534;">Watch Recording:</p>
            <p style="margin: 10px 0;"><a href="${event.recordingLink}" style="color: #166534; font-weight: bold;">${event.recordingLink}</a></p>
          </div>
          
          <p>You can also access this link from your dashboard under the Events section.</p>
          
          <p>Best regards,<br/>The NextIF Team</p>
        </div>
      `;

    try {
      await this.sendViaApi({
        to,
        subject: `Recording Available: ${event.title}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send event update email:", error);
    }
  }

  /**
   * Notify Admin about a new Event
   */
  static async sendAdminEventNotificationEmail(
    to: string,
    adminName: string,
    event: any,
    creatorName: string
  ) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Admin Alert: New Event Scheduled</h2>
          <p>Hello ${adminName},</p>
          <p>This is an internal notification that a new event has been created by <strong>${creatorName}</strong>.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-weight: bold; color: #1e293b;">Event Details:</p>
            <ul style="margin: 10px 0; color: #334155;">
              <li><strong>Title:</strong> ${event.title}</li>
              <li><strong>Type:</strong> ${event.type}</li>
              <li><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</li>
            </ul>
          </div>
          
          <p>All active fellows have been notified via email and system alerts.</p>
          
          <p>Best regards,<br/>NextIF System Bot</p>
        </div>
      `;

    return this.sendViaApi({
      to,
      subject: `[Admin] New Event Created: ${event.title}`,
      html,
    });
  }

  /**
   * Notify Admin about a new Fellow
   */
  static async sendAdminFellowOnboardedEmail(
    to: string,
    adminName: string,
    fellow: any,
    creatorName: string
  ) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Admin Alert: New Fellow Onboarded</h2>
          <p>Hello ${adminName},</p>
          <p>A new fellow has been successfully onboarded by <strong>${creatorName}</strong>.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-weight: bold; color: #1e293b;">Fellow Details:</p>
            <ul style="margin: 10px 0; color: #334155;">
              <li><strong>Name:</strong> ${fellow.firstName} ${fellow.lastName}</li>
              <li><strong>Email:</strong> ${fellow.email}</li>
              <li><strong>Institution:</strong> ${fellow.profile.institution}</li>
            </ul>
          </div>
          
          <p>The fellow has been sent their welcome credentials and portal access.</p>
          
          <p>Best regards,<br/>NextIF System Bot</p>
        </div>
      `;

    return this.sendViaApi({
      to,
      subject: `[Admin] New Fellow Onboarded: ${fellow.firstName} ${fellow.lastName}`,
      html,
    });
  }
}
