import PDFDocument from 'pdfkit';

/**
 * Generates a submission receipt PDF buffer for a given application.
 * @param {Object} application - Populated Mongoose Application document (userId, jobId populated)
 * @returns {Promise<Buffer>}
 */
export const generateReceiptPDF = (application) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
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

    // Portal header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('NIT Kurukshetra — Recruitment Portal', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(14)
      .font('Helvetica')
      .text('Application Submission Receipt', { align: 'center' });

    doc.moveDown(1);

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#888888')
      .lineWidth(1)
      .stroke();

    doc.moveDown(1);

    // Helper to render labeled fields
    const field = (label, value) => {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`${label}: `, { continued: true })
        .font('Helvetica')
        .text(String(value || 'N/A'));
      doc.moveDown(0.4);
    };

    // Application details
    field('Application Number', application.applicationNumber);
    field('Status', application.status?.toUpperCase());
    field(
      'Submitted At',
      application.submittedAt
        ? new Date(application.submittedAt).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'long',
            timeStyle: 'short',
          })
        : 'N/A'
    );

    doc.moveDown(0.5);

    // Section heading helper
    const sectionHeading = (title) => {
      doc.fontSize(12).font('Helvetica-Bold').text(title);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.5);
    };

    // Applicant details
    sectionHeading('Applicant Details');
    field('Name', applicantName);
    field('Email', user?.email);

    doc.moveDown(0.5);

    // Job details
    sectionHeading('Position Applied For');
    field('Job Title', job?.title || application.jobSnapshot?.title);
    field(
      'Advertisement No',
      job?.advertisementNo || application.jobSnapshot?.jobCode
    );
    field('Department', application.jobSnapshot?.department);

    doc.moveDown(0.5);

    // Submitted sections
    sectionHeading('Submitted Sections');

    if (application.sections && application.sections.size > 0) {
      let index = 1;
      for (const [sectionType] of application.sections) {
        doc
          .fontSize(11)
          .font('Helvetica')
          .text(
            `${index}. ${sectionType
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())}`
          );
        index++;
      }
    } else {
      doc.fontSize(11).font('Helvetica').text('No sections recorded.');
    }

    doc.moveDown(1.5);

    // Footer
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#888888')
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.5);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#555555')
      .text(
        'This is a system-generated receipt. Please retain this document for your records.',
        { align: 'center' }
      );

    doc.end();
  });
};
