/**
 * Credit Points Service
 *
 * Auto-calculates credit points for Activities 1 through 4 based on the saved sections.
 * This server-side calculation prevents manipulation of academic scores by the applicant.
 *
 * Rubric Target: NIT Kurukshetra, Assistant Professor Grade-I (Level-12)
 */

/**
 * Activity 1: Externally Sponsored R&D Projects
 *
 * Logic:
 * - PI only (no co-investigators): 5 points
 * - PI (with co-investigators):    4 points
 * - Co-PI:                         2 points
 *
 * @param {Array} items - List of sponsored project entries.
 * @returns {Object} Points breakdown for Activity 1.
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
 * Activity 2: Consultancy Projects
 *
 * Qualifies if amount >= ₹5,00,000 (5 Lakhs).
 * 3 points per qualifying project.
 *
 * @param {Array} items - List of consultancy project entries.
 * @returns {Object} Points breakdown for Activity 2.
 */
function calcConsultancyCredits(items = []) {
  const qualifyingLimit = 500000;
  const qualifying = items.filter((c) => c.amount >= qualifyingLimit);
  const points = qualifying.length * 3;
  return { count: qualifying.length, total: points };
}

/**
 * Activity 3: PhD Supervision (Awarded only)
 *
 * Logic:
 * - Sole Supervisor: 10 points
 * - 1st Supervisor:   7 points
 * - Co-Supervisor:    3 points
 *
 * @param {Array} items - List of PhD supervision entries.
 * @returns {Object} Points breakdown for Activity 3.
 */
function calcPhdCredits(items = []) {
  let soleSupervisor = 0,
    firstSupervisor = 0,
    coSupervisor = 0;
  for (const p of items) {
    // Only 'Awarded' status qualifies for points
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
 * Activity 4: Journal Papers in SCI/Scopus (Unpaid only)
 *
 * Logic depends on author position and total author count:
 * - First Author / Main Supervisor:
 *   - Sole author: 7
 *   - 2 authors:   6
 *   - 3+ authors:  5
 * - Co-author / Co-Supervisor:
 *   - 2 authors:   3
 *   - 3+ authors:  2
 *
 * @param {Array} items - List of journal publication entries.
 * @returns {Object} Points breakdown for Activity 4.
 */
function calcJournalCredits(items = []) {
  let firstAuthorTotal = 0;
  let coAuthorTotal = 0;

  for (const p of items) {
    // Filter for Indexed (SCI/Scopus) and Unpaid journals only
    if (p.journalType !== 'SCI / Scopus Journals') continue;
    if (p.isPaidJournal) continue;

    const totalAuthors = p.coAuthorCount + 1; // Includes the applicant

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
 * Activity 1b: Patents Granted
 *
 * Logic:
 * - Sole Inventor:      10 points
 * - Principal Inventor:  7 points
 * - Co-Inventor:         3 points
 *
 * @param {Array} items - List of patent entries.
 * @returns {Object} Points breakdown for Patents.
 */
function calcPatentCredits(items = []) {
  let onlyInventor = 0,
    asInventor = 0,
    asCoInventor = 0;
  for (const p of items) {
    // Only 'Granted' patents qualify
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
 * Orchestrates the auto-calculation of credits from all relevant sections.
 * Called during credit points evaluation.
 *
 * @param {Object} application - The Mongoose Application document.
 * @returns {Object} Comprehensive breakdown of all auto-calculated credits.
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
 * Calculates the sum of points for manually claimed activities (5-22).
 * Note: These are subject to administrative audit.
 *
 * @param {Array} manualActivities - List of manually entered activities.
 * @returns {number} Total manual points claimed.
 */
export function calcManualCredits(manualActivities = []) {
  return manualActivities.reduce((sum, a) => sum + (a.claimedPoints || 0), 0);
}
