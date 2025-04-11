/**
 * Exam configurations for different classes
 * Key: Class name (must match exactly with the className in the URL data)
 * Value: Object containing exam configuration
 */
export const examConfigs = {
  // Example class configurations

  // Default configuration used when class name is not found
  "default": {
    examName: "اختبار الفصل الدراسي الثاني",
    sections: [
      { id: "memorization", name: "حفظ", weight: 1 },
      { id: "tajweed", name: "تجويد", weight: 1 },
    ]
  }
};

/**
 * Get exam configuration for a specific class
 * @param {string} className - The name of the class
 * @returns {Object} The exam configuration
 */
export const getExamConfig = (className) => {
  if (!className) return examConfigs.default;

  return examConfigs[className] || examConfigs.default;
};