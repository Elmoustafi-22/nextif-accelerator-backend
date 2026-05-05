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
        "❌ Email Error: SMTP_PASS is not defined in environment variables."
      );
      throw new Error("Brevo API Key (SMTP_PASS) is missing.");
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
      // Diagnostic log (masked)
      console.log(
        `Attempting to send email via Brevo API. Key length: ${
          env.SMTP_PASS.length
        }, Starts with: ${env.SMTP_PASS.substring(0, 5)}...`
      );

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
    const loginUrl = env.ADMIN_FRONTEND_URL; // Using the same base URL, usually /admin is the path

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome, ${firstName}!</h2>
          <p>You have been added as an <strong>Administrator</strong> to the <strong>NextIF Ambassador Portal</strong>.</p>
          
          <p>Please log in to the admin dashboard to manage ambassadors, tasks, and system settings.</p>
          
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
      subject: "Admin Access Granted: NextIF Ambassador Portal",
      html,
    });
  }

  /**
   * Send Welcome Email to New Ambassador
   */
  static async sendAmbassadorWelcomeEmail(
    to: string,
    firstName: string,
    lastName: string
  ) {
    const loginUrl = env.FRONTEND_URL;

    const html = `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    
    <p>Dear NextIF Ambassador,</p>

    <p>Your NextIF Ambassadors Portal is now active. Kindly log in to update your profile, access onboarding resources, and stay updated on upcoming activities.</p>

    <h3 style="color: #2563eb;">Login Instructions</h3>

    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <ul style="margin: 10px 0;">
        <li><strong>URL:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
        <li>Click on <strong>First time logging in</strong>, then sign in with:</li>
        <li><strong>Username:</strong> ${to}</li>
        <li><strong>Initial Password:</strong> Use your <strong>Last Name</strong> (case-sensitive)</li>
      </ul>
    </div>

    <p>If you encounter any errors, please send your complaints to 
      <a href="mailto:mustapha.it@nextif.org">mustapha.it@nextif.org</a>.
    </p>

    <p style="color: #6b7280; font-size: 0.9em;">
      Important: You will be required to set a new password immediately after your first successful login.
    </p>

    <p>Further updates and guidance will be shared through the portal. Please ensure you check it regularly.</p>

    <p>Warm regards,<br/>NextIF Team</p>
  </div>
`;

    return this.sendViaApi({
      to,
      subject: "Welcome to the NextIF Ambassador Portal!",
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
          <p>A new task has been assigned to you on the <strong>NextIF Ambassador Portal</strong>.</p>
          
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
}
