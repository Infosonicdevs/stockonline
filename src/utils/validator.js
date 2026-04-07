// utils/validator.js

/**
 * Validate required fields in any form object
 * @param {Object} data - form data object
 * @param {Array} requiredFields - array of required field names
 * @returns {Object} { isValid: boolean, missingFields: Array }
 */
export const validateRequiredFields = (data, requiredFields = []) => {
  const missingFields = requiredFields.filter(
    (field) =>
      !data[field] ||
      (typeof data[field] === "string" && data[field].trim() === "")
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};