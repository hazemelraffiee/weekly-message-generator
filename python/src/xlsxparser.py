from datetime import datetime
import pandas as pd
from openpyxl import load_workbook
import logging
from typing import Optional, Callable

from custom_logging import UILogHandler

def update_student_records(file_path: str, update_data: dict, output_file: str, log_callback: Optional[Callable] = None):
    """
    Updates student records in Excel file with support for UI logging.
    
    Args:
        file_path: Path to input Excel file
        update_data: Dictionary with update data
        output_file: Path for output file
        log_callback: Optional callback function for UI logging
    """
    # Set up logging
    logger = logging.getLogger('xlsx_updater')
    logger.setLevel(logging.INFO)
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Add UI handler if callback provided
    if log_callback:
        ui_handler = UILogHandler(log_callback)
        ui_handler.setLevel(logging.INFO)
        logger.addHandler(ui_handler)
    
    date = update_data['metadata']['date']['raw']
    attendance_data = update_data['attendance']
    previous_homework_data = update_data['previousHomework']
    
    # Load workbook
    wb = load_workbook(file_path, data_only=True)
    
    expected_students = set(attendance_data.keys())
    found_students = set(wb.sheetnames)
    missing_sheets = expected_students - found_students
    extra_sheets = found_students - expected_students
    
    if missing_sheets:
        logger.warning(f"لم يتم العثور على أوراق الطلاب المتوقعة: {', '.join(missing_sheets)}")
    if extra_sheets:
        logger.info(f"تم العثور على أوراق طلاب إضافية: {', '.join(extra_sheets)}")
    
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        logger.info(f"معالجة ورقة الطالب: {sheet_name}")
        
        # Find date row
        date_found = False
        row_index = None
        for row in ws.iter_rows(min_row=1, max_row=ws.max_row, min_col=1, max_col=1):
            for cell in row:
                cell_date = str(cell.value).split()[0]
                if cell_date == date:
                    row_index = cell.row
                    date_found = True
                    break
            if date_found:
                break
        
        if not date_found:
            logger.warning(f"لم يتم العثور على التاريخ {date} في ورقة الطالب: {sheet_name}")
            continue
        
        # Update attendance
        student_name = sheet_name
        if student_name in attendance_data:
            ws.cell(row=row_index, column=2, value='حاضر' if attendance_data[student_name]['present'] else 'غائب')
            logger.info(f"تم تحديث الحضور للطالب {student_name}")
        else:
            logger.warning(f"تم العثور على الطالب {student_name} في ورقة العمل ولكنه غير موجود في البيانات المقدمة")
        
        # Update homework scores
        for hw_type, students in previous_homework_data.items():
            if student_name in students:
                column_index = 4 if hw_type == 'حفظ' else 5
                ws.cell(row=row_index, column=column_index, value=students[student_name])
                logger.info(f"تم تحديث درجة {hw_type} للطالب {student_name}")
    
    # Save workbook
    wb.save(output_file)
    logger.info(f"تم حفظ الملف المحدث باسم {output_file}")