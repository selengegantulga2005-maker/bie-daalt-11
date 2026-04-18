/**
 * Pagination, filtering, sorting тусламж функцүүд.
 */

function paginate(array, query) {
  let data = [...array];

  // Filtering — ?search=xxx
  if (query.search) {
    const q = query.search.toLowerCase();
    data = data.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(q))
    );
  }

  // Sorting — ?sort=title&order=asc|desc
  if (query.sort) {
    const order = query.order === 'desc' ? -1 : 1;
    data.sort((a, b) => {
      const av = String(a[query.sort] ?? '');
      const bv = String(b[query.sort] ?? '');
      return av.localeCompare(bv) * order;
    });
  }

  const total = data.length;
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const start = (page - 1) * limit;

  return {
    data:  data.slice(start, start + limit),
    meta:  { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

module.exports = { paginate };
