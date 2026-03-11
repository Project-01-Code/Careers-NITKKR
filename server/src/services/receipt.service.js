import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

/**
 * Generates a beautiful submission receipt PDF buffer for a given application.
 * @param {Object} application - Populated Mongoose Application document (userId, jobId populated)
 * @returns {Promise<Buffer>}
 */
export const generateReceiptPDF = (application) => {
  return new Promise((resolve, reject) => {
    // We add more margins for a cleaner look
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const user = application.userId;
    const job = application.jobId;
    const applicantName =
      `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() ||
      user?.email ||
      'N/A';

    // 1. Header with Logo (if it exists)
    const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo.png');
    let hasLogo = false;
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 60 });
        hasLogo = true;
      }
    } catch (err) {
      console.warn('Could not load logo for receipt:', err.message);
    }

    const headerX = hasLogo ? 120 : 50;

    // Institution Name
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#1e3a8a') // A darker blue/primary color
      .text('National Institute of Technology Kurukshetra', headerX, 45, { width: 420 });

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text('Kurukshetra, Haryana 136119, India', headerX, doc.y + 2);

    // Separator line
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1.5).strokeColor('#1e3a8a').stroke();
    doc.moveDown(1.5);

    // 2. Receipt Title
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('APPLICATION ACKNOWLEDGEMENT SLIP', 50, doc.y, { align: 'center', characterSpacing: 1 });
    doc.moveDown(1.5);

    // Helpers
    const drawRow = (label, value, x1, x2, y) => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#4b5563').text(label, x1, y);
      doc.fontSize(10).font('Helvetica').fillColor('#000000').text(String(value || 'N/A'), x2, y, { width: 170 });
      return doc.y; // Return the absolute bottom Y conceptually, doc.y handles wrapping but relies on text box
    };

    const drawSectionHeader = (title, startY) => {
      doc.rect(50, startY, 495, 25).fill('#f3f4f6');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1f2937').text(title, 60, startY + 7);
      return startY + 35; // 10 margin below the box
    };

    let currentY = doc.y;

    // 3. Application Details Box
    currentY = drawSectionHeader('Application Overview', currentY);
    
    drawRow('Application No:', application.applicationNumber, 60, 160, currentY);
    let nextY = drawRow('Payment Status:', application.paymentStatus?.toUpperCase() || 'PENDING', 320, 420, currentY);

    const submissionDate = application.submittedAt
      ? new Date(application.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      : 'Draft / Not Submitted';
      
    currentY = Math.max(currentY + 15, nextY); // advance line
    drawRow('Submission Date:', submissionDate, 60, 160, currentY);
    nextY = drawRow('Current Status:', application.status?.toUpperCase() || 'UNKNOWN', 320, 420, currentY);

    currentY = Math.max(currentY + 25, nextY + 10);

    // 4. Position & Job Details
    currentY = drawSectionHeader('Position Details', currentY);

    nextY = drawRow('Designation:', job?.title || application.jobSnapshot?.title, 60, 160, currentY);
    currentY = nextY + 5;
    nextY = drawRow('Department:', application.jobSnapshot?.department, 60, 160, currentY);
    currentY = nextY + 5;
    nextY = drawRow('Advt. Reference:', job?.advertisementNo || application.jobSnapshot?.jobCode, 60, 160, currentY);

    currentY = nextY + 20;

    // 5. Applicant Summary
    currentY = drawSectionHeader('Applicant Summary', currentY);

    // Fetch personal info if available
    const personalData = application.sections?.get('personal')?.data;

    drawRow('Full Name:', applicantName, 60, 160, currentY);
    if (personalData?.mobile || personalData?.phone) {
      nextY = drawRow('Phone:', personalData.mobile || personalData.phone, 320, 420, currentY);
    } else {
      nextY = currentY + 15;
    }
    
    currentY = Math.max(currentY + 15, nextY);
    drawRow('Email Address:', user?.email, 60, 160, currentY);
    
    if (personalData) {
      nextY = drawRow('Category:', personalData.category?.toUpperCase() || 'GENERAL', 320, 420, currentY);
      currentY = Math.max(currentY + 15, nextY);
      
      drawRow('PwD Status:', personalData.disability ? 'YES (Differently Abled)' : 'NO', 60, 160, currentY);
      nextY = drawRow('Gender:', personalData.gender?.toUpperCase() || 'N/A', 320, 420, currentY);
      
      currentY = Math.max(currentY + 15, nextY);
    } else {
      currentY = currentY + 15;
    }

    currentY = currentY + 15;

    // Check if we need a new page before checklist
    if (currentY > 600) {
      doc.addPage();
      currentY = 50;
    }

    // 6. Section Completion Checklist
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1f2937').text('Submitted Sections Checklist', 50, currentY);
    currentY += 20;
    
    let col = 1;

    if (application.sections && application.sections.size > 0) {
      for (const [sectionType] of application.sections) {
        // Handle page break for huge list
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        const formattedName = sectionType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const xPos = col === 1 ? 60 : 320;
        
        // Draw little checkmark box
        doc.rect(xPos, currentY, 10, 10).fillAndStroke('#e5e7eb', '#9ca3af');
        
        // Checkmark itself (Draw a green tick)
        doc.moveTo(xPos + 2, currentY + 5).lineTo(xPos + 4, currentY + 7).lineTo(xPos + 8, currentY + 2).strokeColor('#059669').lineWidth(1.5).stroke();
        
        doc.fontSize(10).font('Helvetica').fillColor('#374151').text(formattedName, xPos + 20, currentY);

        col++;
        if (col > 2) {
          col = 1;
          currentY += 20;
        }
      }
      if (col === 2) currentY += 20; // add line feed if stopped on first col
    } else {
      doc.fontSize(10).font('Helvetica-Oblique').fillColor('#6b7280').text('No sections data available in snapshot.', 50, currentY);
      currentY += 20;
    }

    currentY += 40;

    // 7. Signatures
    // We add two lines - one for applicant, one for office use
    const endY = currentY > 650 ? 700 : currentY; 
    if (endY === 700 && currentY > 700) {
        doc.addPage();
    }
    
    doc.moveTo(70, endY).lineTo(220, endY).lineWidth(1).strokeColor('#000').stroke();
    doc.fontSize(10).font('Helvetica').fillColor('#000').text('Signature of Applicant', 90, endY + 5);

    doc.moveTo(370, endY).lineTo(520, endY).lineWidth(1).strokeColor('#000').stroke();
    doc.fontSize(10).font('Helvetica').fillColor('#000').text('For Office Use Only', 395, endY + 5);

    // 8. Footer on every page
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.rect(0, 800, 595, 42).fill('#1e3a8a');
        doc.fontSize(8).fillColor('#ffffff').font('Helvetica').text(
          `System Generated Receipt | Ref: ${application.applicationNumber} | Generated On: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
          50, 815, { align: 'center' }
        );
    }

    doc.end();
  });
};