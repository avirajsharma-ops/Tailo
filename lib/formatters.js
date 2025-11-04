/**
 * Format designation - returns only the title
 * @param {Object|string} designation - Designation object or string
 * @returns {string} Formatted designation string
 */
export const formatDesignation = (designation) => {
  if (!designation) return 'N/A'

  // Handle if designation is a string
  if (typeof designation === 'string') return designation

  // Handle if designation is an object - return only title
  const title = designation.title || designation

  return title || 'N/A'
}

/**
 * Format employee full name
 * @param {Object} employee - Employee object with firstName and lastName
 * @returns {string} Full name
 */
export const formatEmployeeName = (employee) => {
  if (!employee) return 'N/A'
  const firstName = employee.firstName || ''
  const lastName = employee.lastName || ''
  return `${firstName} ${lastName}`.trim() || 'N/A'
}

