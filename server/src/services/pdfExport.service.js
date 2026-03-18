import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../constants.js';
import {
  C,
  PAGE_W,
  PAGE_H,
  MARGIN,
  CONTENT_W,
  makeLayout,
  drawHeader,
  drawSectionBar,
  drawKVRow,
  drawBadge,
  recursiveRender,
} from '../utils/pdf.utils.js';

/**
 * High-performance, Unified PDF Generation Service
 * Supports:
 * 1. Admin Docket (Full Application + Reviews + Receipt)
 * 2. Applicant Receipt (Application Summary + Receipt)
 */
export const generateApplicationPDF = async (applicationId, options = {}) => {
  const { includeReviews = false, title = 'Application Report' } = options;

  const app = await mongoose
    .model('Application')
    .findById(applicationId)
    .populate('userId', 'email profile')
    .populate('jobId', 'title advertisementNo department')
    .lean();

  if (!app) throw new Error('Application not found');

  const reviews = includeReviews
    ? await mongoose
        .model('Review')
        .find({ applicationId: app._id })
        .populate('reviewerId', 'email profile')
        .lean()
    : [];

  const payment = await mongoose
    .model('Payment')
    .findOne({ applicationId: app._id })
    .sort({ createdAt: -1 })
    .lean();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        // CRITICAL FIX: bottom: 0 prevents infinite blank pages when stamping footers
        margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: 0 },
        size: 'A4',
        bufferPages: true,
        info: {
          Title: `${title} - ${app.applicationNumber}`,
          Author: 'NIT Kurukshetra',
        },
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const lay = makeLayout(doc);
      let y = drawHeader(doc, title);
      lay.forceDrawn(); // Let the layout engine know the header took up space

      // --- 1. Top Section & Status Bar ---
      y = drawSectionBar(doc, lay, title, y, { bg: C.navy, fg: C.white });

      // Payment Badge
      let badgeText = 'PENDING';
      let badgeColor = C.red;
      if (app.paymentStatus === PAYMENT_STATUS.PAID) {
        badgeText = 'PAID';
        badgeColor = C.green;
      }
      if (app.paymentStatus === PAYMENT_STATUS.EXEMPTED) {
        badgeText = 'EXEMPTED';
        badgeColor = C.amber;
      }
      drawBadge(doc, badgeText, y - 30, badgeColor); // Floats right, doesn't shift Y

      y = drawKVRow(doc, lay, 'Application No', app.applicationNumber, y);
      y = drawKVRow(doc, lay, 'Current Status', app.status?.toUpperCase(), y);
      y = drawKVRow(
        doc,
        lay,
        'Submission Date',
        app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'N/A',
        y
      );
      y += 10;

      // --- 2. Candidate Info ---
      y = drawSectionBar(doc, lay, 'CANDIDATE PROFILE', y);
      const fullName =
        `${app.userId?.profile?.firstName || ''} ${app.userId?.profile?.lastName || ''}`.trim() ||
        app.userId?.email;
      y = drawKVRow(doc, lay, 'Full Name', fullName, y);
      y = drawKVRow(doc, lay, 'Email', app.userId?.email, y);
      y = drawKVRow(doc, lay, 'Designation', app.jobId?.title, y);
      y = drawKVRow(doc, lay, 'Department', app.jobId?.department, y);
      y += 10;

      // --- 3. Payment/Receipt ---
      if (
        app.paymentStatus === PAYMENT_STATUS.PAID ||
        app.paymentStatus === PAYMENT_STATUS.EXEMPTED
      ) {
        y = drawSectionBar(doc, lay, 'PAYMENT & FEE ACKNOWLEDGEMENT', y);
        if (app.paymentStatus === PAYMENT_STATUS.EXEMPTED) {
          y = lay.ensureSpace(y, 40, (safeY) => {
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .fillColor(C.amber)
              .text('Fee Exemption Granted', MARGIN, safeY);
            doc
              .fontSize(8.5)
              .font('Helvetica')
              .fillColor(C.s500)
              .text(
                'Eligible for exemption based on institutional guidelines (SC/ST/PwD/Female).',
                MARGIN,
                doc.y + 2
              );
            return doc.y + 15;
          });
        } else if (payment) {
          y = drawKVRow(
            doc,
            lay,
            'Transaction ID',
            payment.razorpayPaymentId || payment.orderId,
            y
          );
          y = drawKVRow(doc, lay, 'Amount', `INR ${payment.amount}`, y);
          y = drawKVRow(
            doc,
            lay,
            'Timestamp',
            new Date(payment.updatedAt).toLocaleString(),
            y
          );
        } else {
          y = drawKVRow(doc, lay, 'Record', 'Payment recorded in system', y);
        }
        y += 10;
      }

      // --- 4. Application Sections ---
      const sections =
        app.sections instanceof Map
          ? [...app.sections.keys()]
          : Object.keys(app.sections || {});
      const orderedSections = [
        'personal',
        'education',
        'experience',
        'publications_journal',
        'publications_conference',
        'publications_books',
        'patents',
        'sponsored_projects',
        'consultancy_projects',
        'phd_supervision',
        'subjects_taught',
        'organized_programs',
        'credit_points',
        'referees',
        'other_info',
      ].filter((k) => sections.includes(k));

      orderedSections.forEach((secKey) => {
        const sec =
          app.sections instanceof Map
            ? app.sections.get(secKey)
            : app.sections[secKey];
        if (!sec || !sec.data) return;

        y = lay.ensureSpace(y, 40, (safeY) => safeY); // guarantee some space before the header
        y = drawSectionBar(
          doc,
          lay,
          secKey.replace(/_/g, ' ').toUpperCase(),
          y
        );

        const data = sec.data;
        const items = Array.isArray(data)
          ? data
          : data.items ||
            (secKey === 'experience' && data.entries ? data.entries : null);

        if (Array.isArray(items)) {
          if (items.length === 0) {
            y = drawKVRow(doc, lay, 'Status', 'No entries provided', y);
          } else {
            items.forEach((item) => {
              y = lay.ensureSpace(y, 25, (safeY) => {
                doc.rect(MARGIN, safeY, CONTENT_W, 16).fill(C.s50);
                doc
                  .fontSize(8)
                  .font('Helvetica-Bold')
                  .fillColor(C.primary)
                  .text(` ENTRY`, MARGIN + 5, safeY + 4);
                return safeY + 24;
              });
              y = recursiveRender(doc, lay, item, MARGIN + 10, y);
              y += 8;
            });
          }
        } else {
          y = recursiveRender(doc, lay, data, MARGIN, y);
        }
        y += 15;
      });

      // --- 5. Reviewer Evaluations ---
      if (includeReviews && reviews.length > 0) {
        y = lay.ensureSpace(y, 40, (safeY) => safeY);
        y = drawSectionBar(doc, lay, 'EXPERT EVALUATION SUMMARY', y, {
          bg: C.navy,
          fg: C.white,
        });
        reviews.forEach((r) => {
          const rName =
            `${r.reviewerId?.profile?.firstName || ''} ${r.reviewerId?.profile?.lastName || ''}`.trim() ||
            r.reviewerId?.email;
          y = drawKVRow(doc, lay, 'Evaluator', rName, y);
          y = drawKVRow(
            doc,
            lay,
            'Total Score',
            `${r.scorecard?.totalScore ?? 0} / 100`,
            y
          );
          y = drawKVRow(
            doc,
            lay,
            'Recommendation',
            r.scorecard?.recommendation,
            y
          );
          y = drawKVRow(doc, lay, 'Expert Comments', r.scorecard?.comments, y);
          y += 15;
        });
      }

      // --- Footer ---
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.rect(0, PAGE_H - 35, PAGE_W, 35).fill(C.navy);
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor(C.s400)
          .text(
            `NIT Kurukshetra  ·  ${app.applicationNumber}  ·  Page ${i + 1} of ${range.count}`,
            MARGIN,
            PAGE_H - 22,
            { align: 'center', width: CONTENT_W }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
