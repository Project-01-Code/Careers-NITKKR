/**
 * Credit Points Service
 * Auto-calculates credit points (Activities 1–4) from previously saved
 * application sections. Client cannot manipulate these values.
 *
 * Rubric: NIT Kurukshetra, Assistant Professor Grade-I (Level-12)
 */

/**
 * Activity 1 — Externally Sponsored R&D Projects
 * As Only PI (no co-investigator): 5 per project
 * As PI (with co-investigators):   4 per project
 * As Co-PI:                        2 per project
 */
function calcSponsoredProjectCredits(items = []) {
  let onlyPI = 0,
    asPI = 0,
    asCoPI = 0;
  for (const p of items) {
    if (p.isPrincipalInvestigator) {
      if (p.coInvestigatorCount === 0) onlyPI += 5;
      else asPI += 4;
    } else {
      asCoPI += 2;
    }
  }
  return { onlyPI, asPI, asCoPI, total: onlyPI + asPI + asCoPI };
}

/**
 * Activity 2 — Consultancy Projects (≥ ₹5 lakhs = ₹500,000)
 * 3 credits per qualifying project
 */
function calcConsultancyCredits(items = []) {
  const qualifying = items.filter((c) => c.amount >= 500000);
  const points = qualifying.length * 3;
  return { count: qualifying.length, total: points };
}

/**
 * Activity 3 — PhD Completed (Awarded only)
 * As Sole Supervisor:  10 per student
 * As 1st Supervisor:   7 per student
 * As Co-Supervisor:    3 per student
 */
function calcPhdCredits(items = []) {
  let soleSupervisor = 0,
    firstSupervisor = 0,
    coSupervisor = 0;
  for (const p of items) {
    if (p.status !== 'Awarded') continue;
    if (p.isFirstSupervisor && p.coSupervisorCount === 0) soleSupervisor += 10;
    else if (p.isFirstSupervisor) firstSupervisor += 7;
    else coSupervisor += 3;
  }
  return {
    soleSupervisor,
    firstSupervisor,
    coSupervisor,
    total: soleSupervisor + firstSupervisor + coSupervisor,
  };
}

/**
 * Activity 4 — Journal Papers in SCI/Scopus (Unpaid only)
 * As First Author / Main Supervisor:
 *   Sole author:     7
 *   2 authors:       6
 *   3+ authors:      5
 * As Co-author / Co-Supervisor:
 *   2 authors:       3
 *   3+ authors:      2
 * Paid journals get 0.
 */
function calcJournalCredits(items = []) {
  let firstAuthorTotal = 0;
  let coAuthorTotal = 0;

  for (const p of items) {
    if (p.journalType !== 'SCI / Scopus Journals') continue;
    if (p.isPaidJournal) continue; // Paid journals excluded

    const totalAuthors = p.coAuthorCount + 1; // +1 for self

    if (p.isFirstAuthor) {
      if (totalAuthors === 1) firstAuthorTotal += 7;
      else if (totalAuthors === 2) firstAuthorTotal += 6;
      else firstAuthorTotal += 5;
    } else {
      if (totalAuthors === 2) coAuthorTotal += 3;
      else coAuthorTotal += 2;
    }
  }

  return {
    firstAuthor: firstAuthorTotal,
    coAuthor: coAuthorTotal,
    total: firstAuthorTotal + coAuthorTotal,
  };
}

/**
 * Activity 1b — Patents Granted
 * As Only Inventor:       10
 * As Principal Inventor:  7
 * As Co-Inventor:         3
 */
function calcPatentCredits(items = []) {
  let onlyInventor = 0,
    asInventor = 0,
    asCoInventor = 0;
  for (const p of items) {
    if (p.status !== 'Granted') continue;
    if (p.isPrincipalInventor && p.coInventorCount === 0) onlyInventor += 10;
    else if (p.isPrincipalInventor) asInventor += 7;
    else asCoInventor += 3;
  }
  return {
    onlyInventor,
    asInventor,
    asCoInventor,
    total: onlyInventor + asInventor + asCoInventor,
  };
}

/**
 * Calculate auto-credit points from previously saved sections.
 * This is called when the credit_points section is saved/validated.
 *
 * @param {Object} application - Mongoose Application document
 * @returns {Object} Auto-calculated credits breakdown + total
 */
export function calculateAutoCredits(application) {
  const getItems = (key) => {
    const section = application.sections.get(key);
    return section?.data?.items || [];
  };

  const sponsored = calcSponsoredProjectCredits(getItems('sponsored_projects'));
  const patents = calcPatentCredits(getItems('patents'));
  const consultancy = calcConsultancyCredits(getItems('consultancy_projects'));
  const phd = calcPhdCredits(getItems('phd_supervision'));
  const journals = calcJournalCredits(getItems('publications_journal'));

  const autoTotal =
    sponsored.total +
    patents.total +
    consultancy.total +
    phd.total +
    journals.total;

  return {
    sponsoredProjects: sponsored,
    patents,
    consultancy,
    phdCompleted: phd,
    journalPapers: journals,
    autoTotal,
  };
}

/**
 * Calculates the sum of manually entered credit activities (5-22).
 * @param {Array} manualActivities
 * @returns {number}
 */
export function calcManualCredits(manualActivities = []) {
  return manualActivities.reduce((sum, a) => sum + (a.claimedPoints || 0), 0);
}
