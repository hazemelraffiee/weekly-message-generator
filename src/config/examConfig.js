/**
 * Exam configurations for different classes
 * Key: Class name (must match exactly with the className in the URL data)
 * Value: Object containing exam configuration
 */
export const examConfigs = {
  // Example class configurations
  "الفوج التمهيدي - القاعدة النورانية": {
    examName: "اختبار الفصل الدراسي الثاني",
    sections: [
      { id: "memorization", name: "حفظ", weight: 3 },
      { id: "tajweed", name: "تجويد", weight: 2 },
      { id: "nouraneya", name: "القاعدة النورانية", weight: 3 },
      { id: "extra_memorization", name: "حفظ إضافي - الحزب الـ 60", weight: 3 },
    ]
  },

  "الفوج الأول": {
    examName: "اختبار الفصل الدراسي الثاني",
    sections: [
      { id: "memorization", name: "حفظ", weight: 7 },
      { id: "tajweed", name: "تجويد", weight: 2 },
      { id: "performance", name: "أداء", weight: 1 }
    ]
  },

  "الفوج الثاني": {
    examName: "اختبار الفصل الدراسي الثاني",
    sections: [
      { id: "memorization", name: "حفظ", weight: 5 },
      { id: "revision", name: "مراجعة", weight: 3.5 },
      { id: "tajweed", name: "تجويد", weight: 1.5 }
    ]
  },

  "الفوج الرابع": {
    examName: "اختبار الفصل الدراسي الثاني",
    sections: [
      { id: "memorization", name: "حفظ", weight: 4 },
      { id: "revision", name: "مراجعة", weight: 3 },
      { id: "tajweed", name: "تجويد", weight: 2 },
    ]
  },

  "الفوج الخامس": {
    examName: "اختبار الفصل الدراسي الثاني",
    sections: [
      { id: "memorization", name: "حفظ", weight: 3 },
      { id: "revision", name: "مراجعة", weight: 2 }
    ]
  },

  // Default configuration used when class name is not found
  "default": {
    examName: "اختبار الفصل الدراسي الثاني",
    sections: [
      { id: "memorization", name: "حفظ", weight: 3 },
      { id: "revision", name: "مراجعة", weight: 2 },
      { id: "tajweed", name: "تجويد", weight: 2 },
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