// Validate an additive edit before touching the live Canvas. Existing nodes and
// edges must not be removed or changed by this fast path.
function addition(before, after) {
  const delta = {};
  for (const field of ['nodes', 'edges']) {
    const old = new Map(before[field].map(value => [value.id, value]));
    const seen = new Set();
    delta[field] = [];
    for (const value of after[field]) {
      if (seen.has(value.id)) throw Error('Duplicate Canvas ID');
      seen.add(value.id);
      if (old.has(value.id)) {
        if (JSON.stringify(old.get(value.id)) !== JSON.stringify(value)) throw Error('Additive placement changed existing Canvas data');
      } else delta[field].push(value);
    }
    for (const id of old.keys()) if (!seen.has(id)) throw Error('Additive placement removed existing Canvas data');
  }
  return delta;
}
module.exports = {addition};
