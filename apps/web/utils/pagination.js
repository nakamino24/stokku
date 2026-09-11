function getPaginationItems(totalPages, currentPage) {
  const page = Math.min(Math.max(currentPage, 1), totalPages)
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const items = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) items.push('ellipsis')
  for (let value = start; value <= end; value += 1) items.push(value)
  if (end < totalPages - 1) items.push('ellipsis')
  items.push(totalPages)
  return items
}

module.exports = { getPaginationItems }
