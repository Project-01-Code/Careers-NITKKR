/**
 * Credit Points Service — Note-2 Rubric
 *
 * Auto-calculates credit points for Activities 1-5, 18, 19 from saved sections.
 * Server-side calculation prevents manipulation of academic scores.
 */

/**
 * Activity 1: External Sponsored R&D Projects (completed/ongoing) OR Patents Granted
 *
 * 8 credit points per project / patent.
 * If >1 person in a project: PI gets 5, rest (8-5)=3 split equally among others.
 * For patents: inventor logic mirrors project logic.
 */
function calcSponsoredProjectCredits(items = []) {
  let total = 0;
  const breakdown = [];

  for (const p of items) {
    if (p.isPrincipalInvestigator) {
      if (p.coInvestigatorCount === 0) {
        // Sole PI: gets full 8 points
        total += 8;
        breakdown.push({ title: p.title, role: 'Sole PI', points: 8 });
      } else {
        // PI with others: gets 5 points
        total += 5;
        breakdown.push({ title: p.title, role: 'PI (shared)', points: 5 });
      }
    } else {
      // Co-PI: gets share of remaining 3 points
      const coCount = Math.max(p.coInvestigatorCount, 1);
      const share = parseFloat((3 / coCount).toFixed(2));
      total += share;
      breakdown.push({ title: p.title, role: 'Co-PI', points: share });
    }
  }

  return { breakdown, total: parseFloat(total.toFixed(2)) };
}

/**
 * Activity 1b: Patents Granted
 *
 * 8 credit points per patent as inventor.
 * Same split logic: sole inventor=8, principal inventor=5, co-inventor gets share of 3.
 * Only 'Granted' patents qualify.
 */
function calcPatentCredits(items = []) {
  let total = 0;
  const breakdown = [];

  for (const p of items) {
    if (p.status !== 'Granted') continue;

    if (p.isPrincipalInventor) {
      if (p.coInventorCount === 0) {
        total += 8;
        breakdown.push({ title: p.patentTitle, role: 'Sole Inventor', points: 8 });
      } else {
        total += 5;
        breakdown.push({ title: p.patentTitle, role: 'Principal Inventor (shared)', points: 5 });
      }
    } else {
      const coCount = Math.max(p.coInventorCount, 1);
      const share = parseFloat((3 / coCount).toFixed(2));
      total += share;
      breakdown.push({ title: p.patentTitle, role: 'Co-Inventor', points: share });
    }
  }

  return { breakdown, total: parseFloat(total.toFixed(2)) };
}

/**
 * Activity 2: Consultancy Projects
 *
 * 2 credit points per ₹5,00,000 of consultancy (aggregated across all projects).
 * Maximum of 10 credit points.
 */
function calcConsultancyCredits(items = []) {
  const totalAmount = items.reduce((sum, c) => sum + (c.amount || 0), 0);
  const units = Math.floor(totalAmount / 500000);
  const rawPoints = units * 2;
  const total = Math.min(rawPoints, 10);

  return { totalAmount, units, total };
}

/**
 * Activity 3: PhD Guidance (completed / thesis submitted cases)
 *
 * 8 credit points per PhD student.
 * Guide (1st Supervisor): gets 5 points per student.
 * Remaining 3 points divided equally among other supervisors.
 * Both 'Awarded' and 'Submitted' qualify.
 */
function calcPhdCredits(items = []) {
  let total = 0;
  const breakdown = [];

  for (const p of items) {
    if (p.status !== 'Awarded' && p.status !== 'Submitted') continue;

    if (p.isFirstSupervisor) {
      if (p.coSupervisorCount === 0) {
        // Sole supervisor: gets full 8
        total += 8;
        breakdown.push({ scholar: p.scholarName, role: 'Sole Guide', points: 8 });
      } else {
        // Guide with co-supervisors: gets 5
        total += 5;
        breakdown.push({ scholar: p.scholarName, role: 'Guide (1st Supervisor)', points: 5 });
      }
    } else {
      // Co-supervisor: share of remaining 3
      const coCount = Math.max(p.coSupervisorCount, 1);
      const share = parseFloat((3 / coCount).toFixed(2));
      total += share;
      breakdown.push({ scholar: p.scholarName, role: 'Co-Supervisor', points: share });
    }
  }

  return { breakdown, total: parseFloat(total.toFixed(2)) };
}

/**
 * Activity 4: Journal Papers in SCI / Scopus (Paid journals not allowed)
 *
 * 4 credit points per paper since last promotion.
 * First author or Main supervisor gets 2 credit points.
 * Rest (4-2)=2 divided among others.
 */
function calcJournalCredits(items = []) {
  let total = 0;
  const breakdown = [];

  for (const p of items) {
    if (p.journalType !== 'SCI / Scopus Journals') continue;
    if (p.isPaidJournal) continue;

    if (p.isFirstAuthor) {
      if (p.coAuthorCount === 0) {
        // Sole author: gets full 4
        total += 4;
        breakdown.push({ paper: p.paperTitle, role: 'Sole Author', points: 4 });
      } else {
        // First author: gets 2
        total += 2;
        breakdown.push({ paper: p.paperTitle, role: 'First Author', points: 2 });
      }
    } else {
      // Co-author: share of remaining 2
      const coCount = Math.max(p.coAuthorCount, 1);
      const share = parseFloat((2 / coCount).toFixed(2));
      total += share;
      breakdown.push({ paper: p.paperTitle, role: 'Co-Author', points: share });
    }
  }

  return { breakdown, total: parseFloat(total.toFixed(2)) };
}

/**
 * Activity 5: Conference Papers (SCI/Scopus/Web of Science/Internationally Renowned)
 *
 * 1 credit point per paper, max 10 credit points.
 * First author or Main Supervisor gets 0.6.
 * Rest (1-0.6)=0.4 divided among others.
 */
function calcConferenceCredits(items = []) {
  let total = 0;
  const breakdown = [];

  for (const p of items) {
    if (total >= 10) break; // cap at 10

    if (p.isFirstAuthor) {
      if (p.coAuthorCount === 0) {
        const pts = Math.min(1, 10 - total);
        total += pts;
        breakdown.push({ paper: p.paperTitle, role: 'Sole Author', points: pts });
      } else {
        const pts = Math.min(0.6, 10 - total);
        total += pts;
        breakdown.push({ paper: p.paperTitle, role: 'First Author', points: pts });
      }
    } else {
      const coCount = Math.max(p.coAuthorCount, 1);
      const share = parseFloat(Math.min(0.4 / coCount, 10 - total).toFixed(2));
      total += share;
      breakdown.push({ paper: p.paperTitle, role: 'Co-Author', points: share });
    }
  }

  total = Math.min(parseFloat(total.toFixed(2)), 10);
  return { breakdown, total };
}

/**
 * Activity 18: Text/Reference Books from reputed international publishers
 *
 * 6 credit points per book, max 18 credit points.
 * Only type="Book" qualifies (not Book Chapter or Monograph).
 */
function calcIntlBookCredits(items = []) {
  const books = items.filter((b) => b.type === 'Book');
  const rawPoints = books.length * 6;
  const total = Math.min(rawPoints, 18);
  return { count: books.length, total };
}

/**
 * Activity 19: Books from national publishers or book chapters from intl publishers
 *
 * 2 credit points per unit, max 6 credit points.
 * type="Book Chapter" qualifies.
 */
function calcBookChapterCredits(items = []) {
  const chapters = items.filter((b) => b.type === 'Book Chapter');
  const rawPoints = chapters.length * 2;
  const total = Math.min(rawPoints, 6);
  return { count: chapters.length, total };
}

/**
 * Orchestrates auto-calculation of credits from all relevant sections.
 *
 * @param {Object} application - The Mongoose Application document.
 * @returns {Object} Comprehensive breakdown of all auto-calculated credits.
 */
export function calculateAutoCredits(application) {
  const getItems = (key) => {
    const section = application.sections.get(key);
    return section?.data?.items || [];
  };

  const sponsoredProjects = calcSponsoredProjectCredits(getItems('sponsored_projects'));
  const patents = calcPatentCredits(getItems('patents'));
  const consultancy = calcConsultancyCredits(getItems('consultancy_projects'));
  const phdCompleted = calcPhdCredits(getItems('phd_supervision'));
  const journalPapers = calcJournalCredits(getItems('publications_journal'));
  const conferencePapers = calcConferenceCredits(getItems('publications_conference'));
  const intlBooks = calcIntlBookCredits(getItems('publications_books'));
  const bookChapters = calcBookChapterCredits(getItems('publications_books'));

  const autoTotal =
    sponsoredProjects.total +
    patents.total +
    consultancy.total +
    phdCompleted.total +
    journalPapers.total +
    conferencePapers.total +
    intlBooks.total +
    bookChapters.total;

  return {
    sponsoredProjects,
    patents,
    consultancy,
    phdCompleted,
    journalPapers,
    conferencePapers,
    intlBooks,
    bookChapters,
    autoTotal: parseFloat(autoTotal.toFixed(2)),
  };
}

/**
 * Sum of points for manually claimed activities (6-17, 20-22).
 * Subject to administrative audit.
 */
export function calcManualCredits(manualActivities = []) {
  return manualActivities.reduce((sum, a) => sum + (a.claimedPoints || 0), 0);
}
