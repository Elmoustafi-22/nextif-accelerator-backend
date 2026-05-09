import { env } from "../config/env";
import { generateGoogleCalendarLink } from "./calendar.util";

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
        <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Your Login Details</h3>
        
        <p style="margin: 15px 0 8px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Email</p>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-family: 'Courier New', monospace; font-size: 15px; color: #0f172a; font-weight: 700; letter-spacing: 0.3px;">${to}</div>

        <p style="margin: 20px 0 8px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Last Name (use as initial password)</p>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-family: 'Courier New', monospace; font-size: 15px; color: #0f172a; font-weight: 700; letter-spacing: 0.3px;">${lastName}</div>

        <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; background: #fef9c3; padding: 10px; border-radius: 6px; border: 1px solid #fef08a;">
          <strong>How to log in:</strong> Go to the portal, click <strong>"First time here?"</strong>, enter your <strong>email</strong> and <strong>last name</strong> exactly as shown above. You will then be prompted to set a new password.
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
   * Send Task Redo Email - High Fidelity
   */
  static async sendTaskRedoEmail(
    to: string,
    firstName: string,
    taskTitle: string,
    remark: string
  ) {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #fef2f2; padding: 40px 20px; text-align: center; color: #991b1b; border-bottom: 4px solid #fecaca;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Action Required: Task Revision</h1>
            <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">Polishing your journey to excellence</p>
          </div>

          <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #991b1b; margin-top: 0;">Hello ${firstName},</h2>
            
            <p style="font-size: 16px;">The admin team has reviewed your submission for <strong>${taskTitle}</strong>. We appreciate your effort, but we believe a few refinements will help this work truly shine.</p>

            <div style="background: #fff1f2; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #ffe4e6;">
              <p style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 12px; color: #be123c; letter-spacing: 1px;">Admin Feedback</p>
              <p style="margin: 10px 0; color: #9f1239; font-size: 16px; font-style: italic;">"${remark}"</p>
            </div>

            <p>Please log in to your dashboard to address this feedback and resubmit your task. We look forward to seeing your updated work!</p>
            
            <div style="text-align: center; margin-top: 35px;">
              <a href="${env.FRONTEND_URL}/tasks" style="background-color: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Revise & Resubmit</a>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">NextIF Global Mentorship & Accelerator Program</p>
          </div>
        </div>
      `;

    try {
      await this.sendViaApi({
        to,
        subject: `Revision Requested: ${taskTitle}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send task redo email:", error);
    }
  }

  /**
   * Send Task Success Email - High Fidelity
   */
  static async sendTaskSuccessEmail(
    to: string,
    firstName: string,
    taskTitle: string,
    points: number
  ) {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Task Verified Successfully!</h1>
            <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">Excellence recognized and rewarded</p>
          </div>

          <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #059669; margin-top: 0;">Great Job, ${firstName}!</h2>
            
            <p style="font-size: 16px;">Your submission for <strong>${taskTitle}</strong> has been reviewed and officially verified by the admin team.</p>

            <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #d1fae5; text-align: center;">
              <p style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 12px; color: #065f46; letter-spacing: 1px;">Reward Earned</p>
              <h1 style="margin: 10px 0; color: #059669; font-size: 48px;">+${points} XP</h1>
              <p style="margin: 0; color: #065f46; font-size: 14px;">Points have been added to your global rank.</p>
            </div>

            <p>Keep up the fantastic work. Every verified task brings you one step closer to becoming a leader in ethical finance.</p>
            
            <div style="text-align: center; margin-top: 35px;">
              <a href="${env.FRONTEND_URL}/dashboard" style="background-color: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View My Progress</a>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">NextIF Global Mentorship & Accelerator Program</p>
          </div>
        </div>
      `;

    try {
      await this.sendViaApi({
        to,
        subject: `Success! Task Verified: ${taskTitle} (+${points} Points)`,
        html,
      });
    } catch (error) {
      console.error("Failed to send task success email:", error);
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
              <a href="${generateGoogleCalendarLink(event.title, event.date, event.explanation || 'NextIF Mentorship Session', event.location)}" style="background-color: #4f46e5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">🗓️ Add to Google Calendar</a>
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

  static async sendBroadcastEmail(
    to: string,
    firstName: string,
    title: string,
    body: string,
    link?: string
  ) {
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #eef2f6; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Global Alert</h1>
          <p style="color: #94a3b8; margin: 10px 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; tracking: 1px;">Program Update • NextIF Accelerator</p>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #475569; margin: 0 0 20px;">Assalamu Alaikum, <strong>${firstName}</strong>,</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="font-size: 18px; color: #1e293b; margin: 0 0 12px; font-weight: 700;">${title}</h2>
            <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">${body}</p>
          </div>
          ${
            link
              ? `
            <div style="text-align: center; margin: 35px 0;">
              <a href="${link}" style="background-color: #3b82f6; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);">Access Link / Join Meeting</a>
            </div>
          `
              : ""
          }
          <div style="border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 25px;">
            <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.6;">
              Please log in to your dashboard to view more details or interact with this announcement.
            </p>
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; 2026 NextIF Accelerator. Nurturing the next generation of ethical finance leaders.</p>
        </div>
      </div>
    `;

    return this.sendViaApi({ to, subject: title, html });
  }
}
