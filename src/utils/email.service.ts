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
              <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Lagos' })} @ ${dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' })} WAT (${dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })} GMT)</li>
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
   * Send Task Rejected Email - High Fidelity
   */
  static async sendTaskRejectedEmail(
    to: string,
    firstName: string,
    taskTitle: string,
    remark: string
  ) {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #fef2f2; padding: 40px 20px; text-align: center; color: #991b1b; border-bottom: 4px solid #fecaca;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Task Submission Rejected</h1>
            <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">Important update regarding your submission</p>
          </div>

          <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #991b1b; margin-top: 0;">Hello ${firstName},</h2>
            
            <p style="font-size: 16px;">The admin team has reviewed your submission for <strong>${taskTitle}</strong> and unfortunately, it has been marked as <strong>Rejected</strong>.</p>

            <div style="background: #fff1f2; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #ffe4e6;">
              <p style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 12px; color: #be123c; letter-spacing: 1px;">Admin Reason for Rejection</p>
              <p style="margin: 10px 0; color: #9f1239; font-size: 16px; font-style: italic;">"${remark}"</p>
            </div>

            <p>If you believe this was an error, please reach out via the complaints portal on your dashboard.</p>
            
            <div style="text-align: center; margin-top: 35px;">
              <a href="${env.FRONTEND_URL}/dashboard" style="background-color: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Dashboard</a>
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
        subject: `Task Rejected: ${taskTitle}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send task rejection email:", error);
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
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">NextIF Global Islamic Finance Career Mentorship & Accelerator Program</h1>
            <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">Nurturing the next leaders of Islamic Finance</p>
          </div>

          <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #4f46e5; margin-top: 0;">Assalamu Alaikum ${firstName},</h2>
            
            <p style="font-size: 16px;">This is to notify you of the upcoming session for the <strong>NextIF Global Career Mentorship & Accelerator Program (Cohort II)</strong>.</p>

            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4f46e5;">
              <p style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 12px; color: #64748b; letter-spacing: 1px;">Upcoming Highlight</p>
              <h3 style="margin: 10px 0; color: #1e293b; font-size: 20px;">${event.title}</h3>
              
              <ul style="list-style: none; padding: 0; margin: 15px 0; color: #475569;">
                <li style="margin-bottom: 8px;">📍 <strong>Where:</strong> <a href="${event.location}" style="color: #4f46e5; text-decoration: none;">Join Virtual Session</a></li>
                <li style="margin-bottom: 8px;">📅 <strong>When:</strong> ${new Date(event.date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Lagos' })}</li>
                <li style="margin-bottom: 8px;">⏰ <strong>Time:</strong> ${new Date(event.date).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })} WAT (${new Date(event.date).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} GMT)${event.endDate ? ` - ${new Date(event.endDate).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })} WAT (${new Date(event.endDate).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} GMT)` : ''}</li>
                <li style="margin-bottom: 8px;">🎙️ <strong>Lead Expert:</strong> ${event.speaker || "World-Renowned Innovator"}</li>
              </ul>
            </div>

            <p>Kindly clear your schedule and join early to avoid missing important discussions and activities.</p>
            <p>We look forward to having you in the session.</p>
            
            <div style="text-align: center; margin-top: 35px;">
              <a href="${generateGoogleCalendarLink(event.title, event.date, event.explanation || 'NextIF Mentorship Session', event.location, event.endDate)}" style="background-color: #4f46e5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">🗓️ Add to Google Calendar</a>
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
        subject: `Upcoming Session Notification - ${event.title}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send event notification email:", error);
    }
  }

  /**
   * Send Recording Available Email (Active Users)
   */
  static async sendEventRecordingActiveEmail(
    to: string,
    firstName: string,
    eventTitle: string
  ) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Recording Now Available: ${eventTitle}</h2>
        <p>Assalamu Alaikum ${firstName},</p>
        <p>We are pleased to inform you that the recording for the session <strong>${eventTitle}</strong> is now available on your dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.FRONTEND_URL}/events" style="background-color: #4f46e5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Watch Recording on Dashboard</a>
        </div>
        <p>Best regards,<br/>The NextIF Team</p>
      </div>
    `;

    return this.sendViaApi({
      to,
      subject: `Recording Available: ${eventTitle}`,
      html,
    });
  }

  /**
   * Send Recording Available Email (Active Users) - Generic
   */
  static async sendRecordingAvailableActiveEmail(
    to: string,
    firstName: string,
    title: string,
    url: string
  ) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Recording Available</h1>
        </div>

        <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
          <p>Assalamu Alaikum ${firstName},</p>
          <p>We are pleased to inform you that the recording for <strong>${title}</strong> is now available.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #4f46e5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Watch Recording</a>
          </div>
          <p>Best regards,<br/>The NextIF Team</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0;">NextIF Global Mentorship & Accelerator Program</p>
        </div>
      </div>
    `;

    return this.sendViaApi({
      to,
      subject: `Recording Available: ${title}`,
      html,
    });
  }

  /**
   * Send Recording Available Email (Preloaded Users)
   */
  static async sendEventRecordingPreloadedEmail(
    to: string,
    firstName: string,
    lastName: string,
    eventTitle: string
  ) {
    const loginUrl = env.FRONTEND_URL;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Recording Available: ${eventTitle}</h1>
        </div>

        <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
          <p>Assalamu Alaikum ${firstName},</p>
          <p>The recording for the session <strong>${eventTitle}</strong> is now available on the NextIF Portal.</p>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">First Time Logging In?</h3>
            
            <p style="margin: 15px 0 8px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Email</p>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-family: 'Courier New', monospace; font-size: 15px; color: #0f172a; font-weight: 700; letter-spacing: 0.3px;">${to}</div>

            <p style="margin: 20px 0 8px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Last Name (Initial Password)</p>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-family: 'Courier New', monospace; font-size: 15px; color: #0f172a; font-weight: 700; letter-spacing: 0.3px;">${lastName}</div>

            <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; background: #fef9c3; padding: 10px; border-radius: 6px; border: 1px solid #fef08a;">
              <strong>How to log in:</strong> Go to the portal, click <strong>"First time here?"</strong>, enter your <strong>email</strong> and <strong>last name</strong> exactly as shown above.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${loginUrl}/events" style="background-color: #4f46e5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Watch Recording</a>
          </div>

          <p style="margin-top: 30px;">Best regards,<br/>The NextIF Team</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0;">NextIF Global Mentorship & Accelerator Program</p>
        </div>
      </div>
    `;

    return this.sendViaApi({
      to,
      subject: `Recording Available: ${eventTitle}`,
      html,
    });
  }

  /**
   * Send Recording Available Email (Preloaded Users) - Generic
   */
  static async sendRecordingAvailablePreloadedEmail(
    to: string,
    firstName: string,
    lastName: string,
    title: string,
    url: string
  ) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Recording Available: ${title}</h1>
        </div>

        <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
          <p>Assalamu Alaikum ${firstName},</p>
          <p>The recording for the session <strong>${title}</strong> is now available on the NextIF Portal.</p>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">First Time Logging In?</h3>
            
            <p style="margin: 15px 0 8px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Email</p>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-family: 'Courier New', monospace; font-size: 15px; color: #0f172a; font-weight: 700; letter-spacing: 0.3px;">${to}</div>

            <p style="margin: 20px 0 8px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Last Name (Initial Password)</p>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-family: 'Courier New', monospace; font-size: 15px; color: #0f172a; font-weight: 700; letter-spacing: 0.3px;">${lastName}</div>

            <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; background: #fef9c3; padding: 10px; border-radius: 6px; border: 1px solid #fef08a;">
              <strong>How to log in:</strong> Go to the portal, click <strong>"First time here?"</strong> (or <strong>"First time logging in?"</strong>), enter your <strong>email</strong> and <strong>last name</strong> exactly as shown above.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${url}" style="background-color: #4f46e5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Watch Recording</a>
          </div>

          <p style="margin-top: 30px;">Best regards,<br/>The NextIF Team</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0;">NextIF Global Mentorship & Accelerator Program</p>
        </div>
      </div>
    `;

    return this.sendViaApi({
      to,
      subject: `Recording Available: ${title}`,
      html,
    });
  }

  /**
   * Send Event Notification Email (Preloaded Users)
   */
  static async sendEventNotificationPreloadedEmail(
    to: string,
    firstName: string,
    lastName: string,
    event: any
  ) {
    const loginUrl = env.FRONTEND_URL;
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">NextIF Global Islamic Finance Career Mentorship & Accelerator Program</h1>
            <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">Nurturing the next leaders of Islamic Finance</p>
          </div>

          <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #4f46e5; margin-top: 0;">Assalamu Alaikum ${firstName},</h2>
            
            <p style="font-size: 16px;">This is to notify you of the upcoming session for the <strong>NextIF Global Career Mentorship & Accelerator Program (Cohort II)</strong>.</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #4f46e5;">
              <ul style="list-style: none; padding: 0; margin: 0; color: #475569;">
                <li style="margin-bottom: 8px;">📅 <strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</li>
                <li style="margin-bottom: 8px;">⏰ <strong>Time:</strong> ${new Date(event.date).toLocaleTimeString()}${event.endDate ? ` - ${new Date(event.endDate).toLocaleTimeString()}` : ''}</li>
                <li style="margin-bottom: 8px;">📍 <strong>Link:</strong> <a href="${event.location}" style="color: #4f46e5;">Join Session</a></li>
              </ul>
            </div>

            <p>Kindly clear your schedule and join early to avoid missing important discussions and activities.</p>
            <p>We look forward to having you in the session.</p>

            <div style="background: #fdf2f2; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #fee2e2;">
              <h3 style="margin-top: 0; color: #991b1b; font-size: 16px;">First Time Logging In?</h3>
              <p style="font-size: 14px; color: #4b5563;">Use your email and last name to access the portal:</p>
              <p style="margin: 10px 0; font-family: monospace; font-weight: bold;">Email: ${to}<br/>Password: ${lastName}</p>
            </div>
            
            <div style="text-align: center; margin-top: 35px;">
              <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Portal</a>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">NextIF Global Mentorship & Accelerator Program</p>
          </div>
        </div>
      `;

    try {
      await this.sendViaApi({
        to,
        subject: `Upcoming Session Notification - ${event.title}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send preloaded event email:", error);
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
              <li><strong>Date:</strong> ${new Date(event.date).toLocaleString('en-US', { timeZone: 'Africa/Lagos' })} WAT (${new Date(event.date).toLocaleString('en-US', { timeZone: 'UTC' })} GMT)</li>
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
   * Notify Admin about a new Event (Preloaded)
   */
  static async sendAdminEventNotificationPreloadedEmail(
    to: string,
    adminName: string,
    lastName: string,
    event: any,
    creatorName: string
  ) {
    const loginUrl = env.ADMIN_FRONTEND_URL;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Admin Alert: New Event Scheduled</h2>
          <p>Hello ${adminName},</p>
          <p>A new event <strong>${event.title}</strong> has been created by <strong>${creatorName}</strong>.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-weight: bold; color: #1e293b;">Event Details:</p>
            <ul style="margin: 10px 0; color: #334155;">
              <li><strong>Title:</strong> ${event.title}</li>
              <li><strong>Date:</strong> ${new Date(event.date).toLocaleString('en-US', { timeZone: 'Africa/Lagos' })} WAT (${new Date(event.date).toLocaleString('en-US', { timeZone: 'UTC' })} GMT)</li>
            </ul>
          </div>

          <div style="background: #fdf2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">Admin Credentials:</p>
            <p style="margin: 5px 0; font-size: 14px;">Email: ${to}<br/>Password: ${lastName}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Admin Panel</a>
          </div>
          
          <p>Best regards,<br/>NextIF System Bot</p>
        </div>
      `;

    return this.sendViaApi({
      to,
      subject: `[Admin] New Event: ${event.title}`,
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

  private static formatMessageBody(body: string): string {
    if (!body) return "";

    // 1. Escape HTML tags to prevent custom injected HTML/XSS issues in emails
    let formatted = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Bold: **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // 3. Italics: *text* or _text_
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");

    // 4. Inline code: `code`
    formatted = formatted.replace(/`(.*?)`/g, "<code style='background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #e11d48;'>$1</code>");

    // 5. Standalone URL Autolinking:
    // Any URL starting with http/https that is not inside href attribute or markdown brackets
    formatted = formatted.replace(/(?<!href=["'])(https?:\/\/[^\s<()]+)/g, "<a href='$1' style='color: #3b82f6; text-decoration: underline;' target='_blank'>$1</a>");

    // 6. Markdown links: [text](url) (replace AFTER auto-link so we don't double wrap)
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' style='color: #3b82f6; text-decoration: underline;' target='_blank'>$1</a>");

    // 7. Handle lists (lines starting with - or * or numbers)
    const lines = formatted.split("\n");
    let inList = false;
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemContent = trimmed.substring(2);
        let prefix = "";
        if (!inList) {
          inList = true;
          prefix = "<ul style='margin: 8px 0; padding-left: 20px; color: #475569;'>";
        }
        return `${prefix}<li style='margin-bottom: 4px;'>${itemContent}</li>`;
      } else {
        let suffix = "";
        if (inList) {
          inList = false;
          suffix = "</ul>";
        }
        return suffix + line;
      }
    });
    if (inList) {
      processedLines.push("</ul>");
    }

    formatted = processedLines.join("\n");

    // 8. Convert remaining newlines to <br />
    formatted = formatted.replace(/\n/g, "<br />");

    return formatted;
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
            <div style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">${this.formatMessageBody(body)}</div>
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

  /**
   * Send Password Reset OTP Email
   */
  static async sendOtpEmail(to: string, firstName: string, otp: string) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Password Reset Request</h1>
          <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">NextIF Fellow Portal Security</p>
        </div>

        <div style="padding: 35px; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px;">Hello ${firstName},</h2>
          
          <p style="font-size: 16px;">We received a request to reset your password. Use the following code to verify your identity. This code is valid for <strong>10 minutes</strong>.</p>

          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
            <div style="font-family: 'Courier New', monospace; font-size: 42px; color: #0f172a; font-weight: 800; letter-spacing: 8px; background: #ffffff; display: inline-block; padding: 10px 25px; border-radius: 8px; border: 1px solid #e2e8f0;">${otp}</div>
          </div>

          <p style="font-size: 14px; color: #64748b; background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7;">
            <strong>Security Tip:</strong> If you did not request this code, please ignore this email or contact support if you have concerns about your account security.
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0;"><strong>NextIF Global Mentorship & Accelerator Program</strong></p>
          <p style="margin: 5px 0;">Empowering Innovators. Nurturing Leaders.</p>
        </div>
      </div>
    `;

    return this.sendViaApi({
      to,
      subject: `[NextIF] ${otp} is your verification code`,
      html,
    });
  }

  /**
   * Send Certificate Payment Success Email to Fellow
   */
  static async sendPaymentSuccessFellowEmail(
    to: string,
    firstName: string,
    amount: string,
    currency: string
  ) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Payment Successful!</h1>
          <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">Your NextIF Program Certificate is secured.</p>
        </div>

        <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #059669; margin-top: 0;">Congratulations, ${firstName}!</h2>
          
          <p style="font-size: 16px;">We have successfully received your payment of <strong>${currency ? currency + " " : ""}${amount}</strong> for the NextIF Global Career Mentorship & Accelerator Program Certificate.</p>

          <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #d1fae5;">
            <p style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 12px; color: #065f46; letter-spacing: 1px;">What Happens Next?</p>
            <p style="margin: 10px 0 0 0; color: #065f46; font-size: 14px;">Your payment has been logged, and your dashboard is updated. Our team will generate and upload your official certificate shortly. You will be able to download it directly from your portal once available.</p>
          </div>
          
          <div style="text-align: center; margin-top: 35px;">
            <a href="${env.FRONTEND_URL}/certificate" style="background-color: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Certificate Status</a>
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
        subject: `Payment Confirmation: NextIF Program Certificate`,
        html,
      });
    } catch (error) {
      console.error("Failed to send payment success email to fellow:", error);
    }
  }

  /**
   * Send Certificate Payment Success Email to Admin
   */
  static async sendPaymentSuccessAdminEmail(
    to: string,
    adminName: string,
    fellowName: string,
    fellowEmail: string,
    amount: string,
    currency: string,
    paymentMethod: "PAYSTACK" | "MANUAL"
  ) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">New Certificate Payment</h1>
          <p style="margin-top: 10px; opacity: 0.9; font-size: 14px;">Action Required: Generate Certificate</p>
        </div>

        <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #4f46e5; margin-top: 0;">Hello ${adminName},</h2>
          
          <p style="font-size: 16px;">A new payment has been successfully recorded for a program certificate.</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <ul style="list-style: none; padding: 0; margin: 0; color: #334155;">
              <li style="margin-bottom: 8px;"><strong>Fellow Name:</strong> ${fellowName}</li>
              <li style="margin-bottom: 8px;"><strong>Fellow Email:</strong> ${fellowEmail}</li>
              <li style="margin-bottom: 8px;"><strong>Amount Paid:</strong> ${currency ? currency + " " : ""}${amount}</li>
              <li style="margin-bottom: 8px;"><strong>Method:</strong> ${paymentMethod}</li>
            </ul>
          </div>

          <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #fee2e2;">
            <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 14px;">Required Action</p>
            <p style="margin: 5px 0 0 0; color: #7f1d1d; font-size: 14px;">Please generate the official certificate for this fellow and upload it via the Admin Panel under the Fellows section.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${env.ADMIN_FRONTEND_URL}/fellows" style="background-color: #4f46e5; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Admin Panel</a>
          </div>
        </div>
      </div>
    `;

    try {
      await this.sendViaApi({
        to,
        subject: `[Admin Alert] Certificate Payment Received - ${fellowName}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send payment success email to admin:", error);
    }
  }

  /**
   * Send Certificate Ready Email to Fellow
   */
  static async sendCertificateReadyEmail(
    to: string,
    firstName: string,
    certificateUrl: string
  ) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Certificate Ready!</h1>
          <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">Congratulations! Your program certificate has been issued.</p>
        </div>

        <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #059669; margin-top: 0;">Congratulations, ${firstName}!</h2>
          
          <p style="font-size: 16px;">Your official certificate for the NextIF Global Career Mentorship & Accelerator Program is now available for download and sharing.</p>

          <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #d1fae5; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #065f46; font-size: 14px; font-weight: bold;">You can now view, download, and share your credential directly from your dashboard.</p>
            <a href="${env.FRONTEND_URL}/certificate" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Certificate</a>
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
        subject: `Your NextIF Program Certificate is Ready!`,
        html,
      });
    } catch (error) {
      console.error("Failed to send certificate ready email to fellow:", error);
    }
  }
}
