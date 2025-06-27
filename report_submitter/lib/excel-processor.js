import { format, parse } from 'date-fns';

export class HomeworkData {
  constructor(jsonData) {
    this.date = new Date(jsonData.metadata.date.raw);
    this.attendance = jsonData.attendance;
    this.homework = jsonData.homework;
    this.previousHomework = jsonData.previousHomework;
  }
}

export class ExcelProcessor {
  constructor(spreadsheetData) {
    this.metadata = spreadsheetData.metadata;
    this.data = spreadsheetData.data;
    this.updates = [];
  }

  findHeaderAndDateRow(sheetName, targetDate) {
    const sheetData = this.data[sheetName];
    if (!sheetData || sheetData.length === 0) {
      return { headerRow: null, dateRow: null };
    }

    let headerRow = null;
    
    // Find header row
    for (let row = 0; row < sheetData.length; row++) {
      const firstCell = sheetData[row][0];
      if (firstCell && typeof firstCell === 'string' && firstCell.includes('التاريخ: السبت')) {
        headerRow = row;
        break;
      }
    }

    if (headerRow === null) {
      return { headerRow: null, dateRow: null };
    }

    // Find date row
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    let dateRow = null;

    for (let row = headerRow + 1; row < sheetData.length; row++) {
      const cellValue = sheetData[row][0];
      if (!cellValue) continue;

      try {
        let cellDate;
        if (cellValue instanceof Date) {
          cellDate = format(cellValue, 'yyyy-MM-dd');
        } else {
          cellDate = format(new Date(cellValue), 'yyyy-MM-dd');
        }

        if (cellDate === targetDateStr) {
          dateRow = row;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    return { headerRow, dateRow };
  }

  findHomeworkColumns(sheetName, headerRow) {
    const sheetData = this.data[sheetName];
    const homeworkTypes = [];
    let repetitionStart = null;
    const seenTypes = new Set();

    for (let col = 2; col < sheetData[headerRow].length; col++) {
      const value = sheetData[headerRow][col];
      if (!value) continue;

      const cellText = String(value).trim();

      if (seenTypes.has(cellText)) {
        repetitionStart = col;
        break;
      }

      if (['مراجعة بعيدة', 'مراجعة قريبة', 'حفظ'].some(type => cellText.includes(type))) {
        homeworkTypes.push(cellText);
        seenTypes.add(cellText);
      }
    }

    return { homeworkTypes, repetitionStart };
  }

  updateStudentWorksheet(studentName, homeworkData) {
    try {
      if (!this.data[studentName]) {
        return {
          success: false,
          error: `Worksheet not found for student: ${studentName}`
        };
      }

      const { headerRow, dateRow } = this.findHeaderAndDateRow(studentName, homeworkData.date);

      if (headerRow === null || dateRow === null) {
        return {
          success: false,
          error: 'Could not find header row or target date'
        };
      }

      const { homeworkTypes, repetitionStart } = this.findHomeworkColumns(studentName, headerRow);

      if (!repetitionStart) {
        return {
          success: false,
          error: 'Could not find homework type repetition'
        };
      }

      // Prepare updates
      const rowUpdates = [...this.data[studentName][dateRow]];

      // Update attendance (column B = index 1)
      const attendance = homeworkData.attendance[studentName];
      rowUpdates[1] = attendance.present ? 'حاضر' : 'غائب';

      // Update previous homework grades
      let currentCol = 2;
      for (const hwType of homeworkTypes) {
        if (homeworkData.previousHomework[hwType]) {
          const grade = homeworkData.previousHomework[hwType][studentName];
          if (grade) {
            rowUpdates[currentCol] = parseFloat(grade);
          }
        }
        currentCol++;
      }

      // Update new homework assignments
      currentCol = repetitionStart;
      for (const hwType of homeworkTypes) {
        let content = '';
        for (const assignment of homeworkData.homework.assignments) {
          const isRelevant = !assignment.assignedStudents || 
                           assignment.assignedStudents.includes(studentName);
          if (assignment.type === hwType && isRelevant) {
            content = assignment.content;
            break;
          }
        }
        rowUpdates[currentCol] = content;
        currentCol++;
      }

      // Add to updates array
      this.updates.push({
        range: `${studentName}!A${dateRow + 1}:${this.columnToLetter(rowUpdates.length)}${dateRow + 1}`,
        values: [rowUpdates]
      });

      return { success: true, error: null };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  columnToLetter(col) {
    let letter = '';
    while (col > 0) {
      col--;
      letter = String.fromCharCode(65 + (col % 26)) + letter;
      col = Math.floor(col / 26);
    }
    return letter;
  }

  processWorkbook(homeworkData) {
    const results = {};

    for (const studentName in homeworkData.attendance) {
      if (this.metadata.sheets.includes(studentName)) {
        results[studentName] = this.updateStudentWorksheet(studentName, homeworkData);
      } else {
        results[studentName] = {
          success: false,
          error: `Worksheet not found for student: ${studentName}`
        };
      }
    }

    return results;
  }

  getUpdates() {
    return this.updates;
  }
}

export async function processExcelFile(fileId, jsonData) {
  try {
    // Fetch current spreadsheet data
    const response = await fetch(`/api/sheets/${fileId}`);
    const spreadsheetData = await response.json();

    if (!response.ok) {
      throw new Error(spreadsheetData.error || 'Failed to fetch spreadsheet');
    }

    // Process the data
    const homeworkData = new HomeworkData(jsonData);
    const processor = new ExcelProcessor(spreadsheetData);
    const results = processor.processWorkbook(homeworkData);

    // Get updates
    const updates = processor.getUpdates();

    if (updates.length > 0) {
      // Apply updates
      const updateResponse = await fetch(`/api/sheets/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update spreadsheet');
      }
    }

    return results;
  } catch (error) {
    throw error;
  }
}