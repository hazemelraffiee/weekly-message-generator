import React from 'react';
import { AlertTriangle, PenLine, Calendar } from 'lucide-react';

const DateWarningModal = ({ 
  onStartNew, 
  onKeepCurrent,
  selectedDate,
  todayDate 
}) => {
  // Formats date in both Hijri and Gregorian calendars
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    // Format Gregorian date
    const gregorianFormatter = new Intl.DateTimeFormat('ar', options);
    const gregorianParts = gregorianFormatter.formatToParts(date);
    let gregorianDate = '';

    gregorianParts.forEach(part => {
      if (part.type === 'weekday') gregorianDate += part.value + '، ';
      else if (['day', 'month', 'year'].includes(part.type)) gregorianDate += part.value + ' ';
      else if (part.type === 'literal' && part.value !== '، ') gregorianDate += part.value;
    });
    gregorianDate = gregorianDate.trim() + ' م';

    // Format Hijri date using Umm al-Qura calendar
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', options);
    const hijriParts = hijriFormatter.formatToParts(date);
    let hijriDate = '';

    hijriParts.forEach(part => {
      if (part.type === 'weekday') hijriDate += part.value + '، ';
      else if (['day', 'month', 'year'].includes(part.type)) hijriDate += part.value + ' ';
      else if (part.type === 'literal' && part.value !== '، ') hijriDate += part.value;
    });
    hijriDate = hijriDate.trim() + ' هـ';

    return `${hijriDate} الموافق ${gregorianDate}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-lg w-full shadow-xl border border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-100 mb-2">تنبيه: تاريخ الحصة مختلف</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                لاحظنا أن تاريخ الحصة المحدد مختلف عن تاريخ اليوم. هل تريد البدء بحصة جديدة؟
              </p>
            </div>
          </div>
        </div>

        {/* Date Comparison */}
        <div className="p-6 border-b border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div className="space-y-1">
              <div className="text-sm text-gray-400">تاريخ الحصة المحدد:</div>
              <div className="text-sm text-gray-200 leading-relaxed">{formatDate(selectedDate)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-green-400 flex-shrink-0" />
            <div className="space-y-1">
              <div className="text-sm text-gray-400">تاريخ اليوم:</div>
              <div className="text-sm text-gray-200 leading-relaxed">{formatDate(todayDate)}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onKeepCurrent}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
          >
            الاحتفاظ بالتاريخ الحالي
          </button>
          <button
            onClick={onStartNew}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 transition-colors group"
          >
            <PenLine className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
            بدء حصة جديدة
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateWarningModal;