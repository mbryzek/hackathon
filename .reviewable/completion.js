// Reviewable review completion condition — https://docs.reviewable.io/admincenter.html
//
// FRONTEND repo. Mike does not review frontend PRs, so the Reviewable review
// auto-completes: every file is marked reviewed and the review is marked
// complete AS LONG AS no one has left an unresolved discussion (an unresolved
// discussion stays a hard block, so a real comment is never silently merged
// past).
//
// It also groups files in the matrix and marks generated code reviewed +
// vendored so it never needs a look. Groups sort alphabetically; the digit
// prefixes force the order.

function isGenerated(path) {
  // src/generated/ (SvelteKit), playwright/generated/ (e2e), src/Generated/ (Elm)
  return /(^|\/)generated\//i.test(path);
}

function groupOf(path) {
  if (isGenerated(path)) return '4. Generated';
  if (/\.json$/.test(path)) return '1. Specs & JSON';
  if (/(^|\/)tests?\//i.test(path) || /(^|\/)playwright\//i.test(path) || /Spec\.scala$/.test(path) || /\.(test|spec)\.[jt]s$/.test(path))
    return '3. Tests';
  return '2. Source';
}

var files = review.files.map(function (f) {
  return {
    path: f.path,
    group: groupOf(f.path),
    vendored: isGenerated(f.path),
    // Mark every revision reviewed so the file matrix is green with no clicks.
    revisions: (f.revisions || []).map(function (r) {
      return { key: r.key, reviewed: true };
    })
  };
});

var blocked = review.summary.numUnresolvedDiscussions > 0;

return {
  files: files,
  pendingReviewers: [],
  completed: !blocked,
  shortDescription: blocked ? 'Unresolved discussions' : 'Auto-completed'
};
