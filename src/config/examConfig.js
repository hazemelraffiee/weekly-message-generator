/**
 * Exam configurations for different classes
 * Key: Class name (must match exactly with the className in the URL data)
 * Value: Object containing exam configuration
 */
export const examConfigs = {
  // Arabic classes
  "الصف الرابع": {
    examName: "اختبار الرياضيات النهائي",
    sections: [
      { id: "algebra", name: "الجبر", weight: 2 },
      { id: "geometry", name: "الهندسة", weight: 1 },
      { id: "mental_math", name: "الحساب الذهني", weight: 1 }
    ]
  },
  "الصف الخامس": {
    examName: "اختبار العلوم النصفي",
    sections: [
      { id: "biology", name: "علم الأحياء", weight: 1 },
      { id: "chemistry", name: "الكيمياء", weight: 1 },
      { id: "physics", name: "الفيزياء", weight: 2 }
    ]
  },
  "الصف السادس": {
    examName: "اختبار اللغة العربية",
    sections: [
      { id: "reading", name: "القراءة والفهم", weight: 2 },
      { id: "grammar", name: "القواعد", weight: 2 },
      { id: "writing", name: "التعبير", weight: 1 }
    ]
  },

  // English classes
  "Grade 4": {
    examName: "Final Math Exam",
    sections: [
      { id: "algebra", name: "Algebra", weight: 2 },
      { id: "geometry", name: "Geometry", weight: 1 },
      { id: "mental_math", name: "Mental Math", weight: 1 }
    ]
  },
  "Grade 5": {
    examName: "Science Midterm",
    sections: [
      { id: "biology", name: "Biology", weight: 1 },
      { id: "chemistry", name: "Chemistry", weight: 1 },
      { id: "physics", name: "Physics", weight: 2 }
    ]
  },
  "Grade 6": {
    examName: "English Language Exam",
    sections: [
      { id: "reading", name: "Reading & Comprehension", weight: 2 },
      { id: "grammar", name: "Grammar", weight: 2 },
      { id: "writing", name: "Writing", weight: 1 }
    ]
  },

  // Default configuration used when class name is not found
  "default": {
    examName: "تقييم عام",
    sections: [
      { id: "section1", name: "الجزء الأول", weight: 1 },
      { id: "section2", name: "الجزء الثاني", weight: 1 }
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