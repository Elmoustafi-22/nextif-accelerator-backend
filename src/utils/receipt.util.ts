import PDFDocument from "pdfkit";
import { cloudinary } from "../config/cloudinary.config";

export interface IPaymentReceiptData {
  reference: string;
  amount: number;
  currency: string;
  paymentType: string;
  createdAt: Date | string;
  metadata?: any;
}

export interface IAmbassadorReceiptData {
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Generates a clean, beautifully formatted PDF receipt for a payment.
 */
export const generateReceiptPDF = (
  payment: IPaymentReceiptData,
  ambassador: IAmbassadorReceiptData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Colors
      const primaryColor = "#4f46e5"; // Indigo
      const secondaryColor = "#1e293b"; // Slate-800
      const textMuted = "#64748b"; // Slate-500
      const lightBg = "#f8fafc"; // Slate-50
      const greenColor = "#16a34a"; // Green-600

      // Draw Top Accent Bar
      doc.rect(0, 0, doc.page.width, 15).fill(primaryColor);

      // --- HEADER ---
      doc.fillColor(primaryColor).fontSize(24).font("Helvetica-Bold").text("NextIF", 50, 45);
      doc.fillColor(secondaryColor).fontSize(14).font("Helvetica-Bold").text("ACCELERATOR", doc.x, doc.y - 5);
      
      // Receipt Title & Metadata (Right Aligned)
      doc.fillColor(secondaryColor).fontSize(20).font("Helvetica-Bold").text("PAYMENT RECEIPT", 350, 45, { align: "right" });
      
      const paymentDate = new Date(payment.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.fillColor(textMuted).fontSize(9).font("Helvetica").text(`Date: ${paymentDate}`, 350, 70, { align: "right" });
      doc.text(`Reference: ${payment.reference}`, 350, 85, { align: "right" });

      // Horizontal Rule
      doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, 115).lineTo(doc.page.width - 50, 115).stroke();

      // --- BILL TO / FROM ---
      doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("ISSUED TO:", 50, 140);
      doc.fillColor(secondaryColor).fontSize(11).font("Helvetica-Bold").text(`${ambassador.firstName} ${ambassador.lastName}`, 50, 155);
      doc.fillColor(textMuted).fontSize(10).font("Helvetica").text(ambassador.email, 50, 170);

      doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("ISSUED BY:", 350, 140);
      doc.fillColor(secondaryColor).fontSize(11).font("Helvetica-Bold").text("NextIF Accelerator", 350, 155);
      doc.fillColor(textMuted).fontSize(10).font("Helvetica").text("accelerator@nextif.com", 350, 170);

      // --- TRANSACTION DETAILS TABLE ---
      const tableTop = 220;
      doc.fillColor(secondaryColor).fontSize(12).font("Helvetica-Bold").text("Transaction Summary", 50, tableTop);

      // Table Header Background
      doc.rect(50, tableTop + 20, doc.page.width - 100, 25).fill(lightBg);

      // Table Headers
      doc.fillColor(secondaryColor).fontSize(9).font("Helvetica-Bold").text("Description", 60, tableTop + 28);
      doc.text("Payment Method", 250, tableTop + 28);
      doc.text("Status", 370, tableTop + 28);
      doc.text("Amount", 480, tableTop + 28);

      // Table Content
      const itemY = tableTop + 55;
      doc.fillColor(secondaryColor).fontSize(10).font("Helvetica");
      
      const description = payment.paymentType === "CERTIFICATE" ? "Program Certificate Fee" : "Accelerator Payment";
      doc.text(description, 60, itemY);
      doc.text("Paystack", 250, itemY);

      // Status Badge (Success)
      doc.fillColor(greenColor).font("Helvetica-Bold").text("SUCCESSFUL", 370, itemY);
      
      // Format Currency
      const amountVal = payment.amount / 100;
      const formattedAmount = payment.currency === "NGN" 
        ? `NGN ${amountVal.toLocaleString()}`
        : `USD ${amountVal.toLocaleString()}`;
      
      doc.fillColor(secondaryColor).font("Helvetica-Bold").text(formattedAmount, 480, itemY);

      // Horizontal separator line
      doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, itemY + 20).lineTo(doc.page.width - 50, itemY + 20).stroke();

      // --- TOTAL SECTION ---
      const totalTop = itemY + 35;
      doc.fillColor(textMuted).fontSize(10).font("Helvetica").text("Subtotal:", 350, totalTop, { align: "right" });
      doc.fillColor(secondaryColor).font("Helvetica-Bold").text(formattedAmount, 480, totalTop);

      doc.fillColor(textMuted).font("Helvetica").text("Total Paid:", 350, totalTop + 20, { align: "right" });
      doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text(formattedAmount, 480, totalTop + 20);

      // --- FOOTER / NOTICE ---
      const footerTop = doc.page.height - 100;
      doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, footerTop).lineTo(doc.page.width - 50, footerTop).stroke();

      doc.fillColor(textMuted).fontSize(9).font("Helvetica-Oblique")
        .text("This receipt is generated automatically for a successful online payment transaction via Paystack. Thank you for being a part of the NextIF Accelerator program.", 50, footerTop + 15, {
          align: "center",
          width: doc.page.width - 100,
        });

      doc.fillColor(primaryColor).fontSize(9).font("Helvetica-Bold")
        .text("https://nextif.com", 50, footerTop + 45, {
          align: "center",
          width: doc.page.width - 100,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Uploads a PDF Buffer directly to Cloudinary and returns its secure URL.
 */
export const uploadReceiptToCloudinary = (
  pdfBuffer: Buffer,
  reference: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "nextif_receipts",
        public_id: `receipt_${reference}`,
        resource_type: "raw",
        format: "pdf",
      },
      (error, result) => {
        if (error) {
          console.error("[Receipt Util] Cloudinary upload error:", error);
          reject(error);
        } else {
          console.log(`[Receipt Util] Receipt uploaded successfully: ${result?.secure_url}`);
          resolve(result?.secure_url || "");
        }
      }
    );
    uploadStream.end(pdfBuffer);
  });
};
