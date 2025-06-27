import os
import pandas as pd
from datetime import datetime
import logging

# Set up logging configuration
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('log.log', mode='w', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# Define attendance date range constants
ATTENDANCE_START_DATE = pd.to_datetime('2024-09-01')
ATTENDANCE_END_DATE = pd.to_datetime('2024-12-31')

def parse_date(date_str):
    """Helper function to parse date string into pandas datetime"""
    try:
        return pd.to_datetime(date_str)
    except:
        try:
            # Handle DD-MM-YY format
            date_parts = date_str.split('-')
            if len(date_parts) == 3:
                return pd.to_datetime(f"20{date_parts[2]}-{date_parts[1]}-{date_parts[0]}")
        except:
            pass
    return None

def count_attendance_from_weekly(df):
    """Count attendance by checking dates within specified range"""
    attended = 0
    total_sessions = 0
    
    # Process each row
    for idx, row in df.iterrows():
        date_str = str(row.iloc[0]).strip()
        
        # Skip empty rows or rows without digits
        if not date_str or not any(char.isdigit() for char in date_str):
            continue
            
        # Parse the date
        date = parse_date(date_str)
        if date is None:
            continue
            
        # Check if date is within our specified range
        if ATTENDANCE_START_DATE <= date <= ATTENDANCE_END_DATE:
            total_sessions += 1
            status = str(row.iloc[1]).strip()
            
            if status == 'حاضر':
                attended += 1
                logging.debug(f"Row {idx}: Present on {date.date()} - {status}")
            else:
                logging.debug(f"Row {idx}: Absent on {date.date()} - {status}")
    
    logging.info(f"Final count: {attended} present out of {total_sessions} total sessions (between {ATTENDANCE_START_DATE.date()} and {ATTENDANCE_END_DATE.date()})")
    return attended, total_sessions

def extract_attendance(df, sheet_name):
    """Extract attendance data from the sheet."""
    logging.info(f"\n{'='*50}")
    logging.info(f"Processing attendance for sheet: {sheet_name}")
    
    return count_attendance_from_weekly(df)

def extract_exam_scores(file_path):
    """Extract exam scores and attendance from the Excel file."""
    logging.info(f"\nProcessing file: {file_path}")
    
    xls = pd.ExcelFile(file_path)
    students_scores = {}
    
    for sheet in xls.sheet_names:
        if "Tabelle" not in sheet and "الطالب" not in sheet:
            try:
                logging.info(f"\nProcessing sheet: {sheet}")
                df = pd.read_excel(file_path, sheet_name=sheet)
                
                # Extract attendance first
                attended, total = extract_attendance(df, sheet)
                
                # Rest of the exam processing code
                exam_row_index = df[df.apply(lambda row: row.astype(str).str.contains("امتحان الفصل الدراسى الثانى", na=False).any(), axis=1)].index
                
                if not exam_row_index.empty:
                    row_idx = exam_row_index[0]
                    
                    section_row = df.iloc[row_idx + 1].dropna()
                    scores_row = df.iloc[row_idx + 2].dropna()
                    
                    valid_columns = list(set(section_row.index) & set(scores_row.index))
                    if not valid_columns:
                        logging.warning(f"No valid exam data found in sheet '{sheet}'")
                        continue
                    
                    exam_sections = section_row.loc[valid_columns].tolist()
                    scores = scores_row.loc[valid_columns].tolist()
                    
                    # Add attendance as an additional score
                    exam_sections.append('Attendance')
                    scores.append(f"{attended}/{total}" if total > 0 else "0/0")
                    
                    students_scores[sheet] = scores
            except Exception as e:
                logging.error(f"Error processing sheet {sheet}: {str(e)}")
                continue
    
    if not students_scores:
        logging.warning(f"No valid exam scores found in file: {file_path}")
        return pd.DataFrame()
    
    # Create DataFrame with scores including attendance
    scores_df = pd.DataFrame.from_dict(students_scores, orient="index", columns=exam_sections)
    
    return scores_df

def process_xlsx_files_in_folder(folder_path):
    """Process all Excel files in the specified folder."""
    for filename in os.listdir(folder_path):
        if filename.endswith(".xlsx"):
            file_path = os.path.join(folder_path, filename)
            scores_df = extract_exam_scores(file_path)
            
            if scores_df.empty:
                logging.warning(f"Skipping file '{filename}' due to missing exam data.")
                continue
            
            # Save scores CSV
            csv_filename = os.path.splitext(filename)[0] + "_scores.csv"
            csv_path = os.path.join(folder_path, csv_filename)
            scores_df.to_csv(csv_path, encoding='utf-8-sig')
            logging.info(f"Saved: {csv_filename}")

# Example usage
if __name__ == "__main__":
    folder_path = r"C:\Users\HELR_LPTP\OneDrive\Desktop\الجمعة"
    process_xlsx_files_in_folder(folder_path)