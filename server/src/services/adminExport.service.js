import PDFDocument from 'pdfkit';

/**
 * Generates a full application PDF for Admin review.
 * @param {Object} application - Fully populated Mongoose Application document
 * @returns {Promise<Buffer>}
 */
export const generateFullApplicationPDF = (application) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const user = application.userId;
        const profile = user?.profile || {};

        // Header
        doc.fontSize(18).font('Helvetica-Bold').text('NIT Kurukshetra — Faculty Recruitment', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(`Application ID: ${application.applicationNumber}`, { align: 'center' });
        doc.moveDown(1);

        const drawLine = () => {
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#aaaaaa').lineWidth(1).stroke().moveDown(0.5);
        };

        const sectionHeader = (title) => {
            doc.moveDown(1).fontSize(14).font('Helvetica-Bold').fillColor('#003366').text(title.toUpperCase());
            doc.fillColor('#000000');
            drawLine();
        };

        const field = (label, value) => {
            doc.fontSize(10).font('Helvetica-Bold').text(`${label}: `, { continued: true })
                .font('Helvetica').text(String(value || 'N/A'));
            doc.moveDown(0.3);
        };

        // 1. Personal Info
        sectionHeader('Personal Information');
        field('Full Name', `${profile.firstName || ''} ${profile.lastName || ''}`);
        field('Email', user?.email);
        field('Category', application.jobSnapshot?.category || 'N/A');
        field('Gender', profile.gender || 'N/A');
        field('Department', application.jobSnapshot?.department);

        // 2. Sections Summary
        sectionHeader('Application Sections');
        application.sections.forEach((content, type) => {
            const status = content.isComplete ? 'Complete' : 'Incomplete';
            field(type.replace(/_/g, ' ').toUpperCase(), status);
        });

        // 3. Credit Points (If exists)
        const creditSection = application.sections.get('credit_points');
        if (creditSection?.data) {
            sectionHeader('Credit Point Claims');
            field('Total Credits Claimed', creditSection.data.totalCreditsClaimed);
            field('Total Credits Allowed', creditSection.data.totalCreditsAllowed);
        }

        // Footer
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#888888').text(
                `Generated on ${new Date().toLocaleString()} — Page ${i + 1} of ${range.count}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
        }

        doc.end();
    });
};
