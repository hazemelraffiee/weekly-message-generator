// src/config/examConfig.js

/**
 * Exam configurations for different classes
 */
export const examConfigs = {
  "الفوج التمهيدي - القاعدة النورانية": {
    examName: "اختبار الفصل الدراسي الثالث",
    configs: [
      {
        name: "الحزب ال 60",
        sections: [
          { id: "memorization", name: "حفظ", weight: 3 },
          { id: "tajweed", name: "تجويد", weight: 1 }
        ]
      },
      {
        name: "القاعدة النورانية",
        sections: [
          { id: "memorization", name: "حفظ", weight: 2 },
          { id: "nouraneya", name: "القاعدة النورانية", weight: 2 }
        ]
      }
    ]
  },

  "الفوج الأول": {
    examName: "اختبار الفصل الدراسي الثالث",
    sections: [
      { id: "memorization", name: "حفظ", weight: 3 },
      { id: "tajweed", name: "تجويد", weight: 1 }
    ]
  },

  "الفوج الثاني": {
    examName: "اختبار الفصل الدراسي الثالث",
    sections: [
      { id: "memorization", name: "حفظ", weight: 5 },
      { id: "revision", name: "مراجعة", weight: 3.5 },
      { id: "tajweed", name: "تجويد", weight: 1.5 }
    ]
  },

"الفوج الثالث": {
    examName: "اختبار الفصل الدراسي الثالث",
    sections: [
      { id: "memorization", name: "حفظ", weight: 3 },
      { id: "tajweed", name: "تجويد", weight: 1 }
    ]
  },

  "الفوج الرابع": {
    examName: "اختبار الفصل الدراسي الثالث",
    sections: [
      { id: "memorization", name: "حفظ", weight: 4 },
      { id: "revision", name: "مراجعة", weight: 3 }
    ]
  },

  "الفوج الخامس": {
    examName: "اختبار الفصل الدراسي الثالث",
    sections: [
      { id: "memorization", name: "حفظ", weight: 3 },
      { id: "revision", name: "مراجعة", weight: 2 },
      { id: "nouraneya", name: "القاعدة النورانية", weight: 2 }
    ]
  },

  // Default configuration used when class name is not found
  "default": {
    examName: "اختبار الفصل الدراسي الثالث",
    sections: [
      { id: "memorization", name: "حفظ", weight: 3 },
      { id: "revision", name: "مراجعة", weight: 2 },
      { id: "tajweed", name: "تجويد", weight: 2 },
    ]
  }
};

/**
 * Transform a configuration from old format to new format
 * @param {Object} config - Configuration object
 * @returns {Object} Configuration with configs array
 */
const transformConfig = (config) => {
  if (!config) return null;

  // If config already has configs array, return as is
  if (config.configs && Array.isArray(config.configs) && config.configs.length > 0) {
    return config;
  }

  // If we have sections, transform to new format
  if (config.sections && Array.isArray(config.sections)) {
    return {
      ...config,
      configs: [
        {
          name: "التكوين الافتراضي",
          sections: config.sections
        }
      ]
    };
  }
  
  // If we have neither configs nor sections, return a safe default
  return {
    ...config,
    configs: [
      {
        name: "التكوين الافتراضي",
        sections: []
      }
    ]
  };
};

/**
 * Get exam configuration for a specific class
 * @param {string} className - The name of the class
 * @returns {Object} The exam configuration
 */
export const getExamConfig = (className) => {
  // Fall back to default config if className is falsy
  if (!className) {
    return transformConfig(examConfigs.default);
  }

  // Get the config for this class or use default
  const config = examConfigs[className] || examConfigs.default;
  
  // Transform to new format if needed
  return transformConfig(config);
};