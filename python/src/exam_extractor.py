import os
import pandas as pd

def extract_exam_scores(file_path):
    xls = pd.ExcelFile(file_path)
    students_scores = {}
    
    for sheet in xls.sheet_names:
        if "Tabelle" not in sheet and "الطالب" not in sheet:  # Exclude non-student sheets
            df = xls.parse(sheet)
            
            # Locate the row containing "First Semester Exam" label
            exam_row_index = df[df.apply(lambda row: row.astype(str).str.contains("امتحان الفصل الدراسى الأول", na=False).any(), axis=1)].index
            
            if not exam_row_index.empty:
                row_idx = exam_row_index[0]  # Get the row index of the exam header
                
                # Extract exam sections from the row below the header
                section_row = df.iloc[row_idx + 1].dropna()
                scores_row = df.iloc[row_idx + 2].dropna()
                
                # Filter out only the sections that have corresponding scores
                valid_columns = list(set(section_row.index) & set(scores_row.index))
                if not valid_columns:
                    print(f"Warning: No valid exam data found in sheet '{sheet}' of file '{file_path}'")
                    continue
                
                exam_sections = section_row.loc[valid_columns].tolist()
                scores = scores_row.loc[valid_columns].tolist()
                
                students_scores[sheet] = scores
    
    if not students_scores:
        print(f"No valid exam scores found in file: {file_path}")
        return pd.DataFrame()
    
    # Create a DataFrame with dynamic column names
    scores_df = pd.DataFrame.from_dict(students_scores, orient="index", columns=exam_sections)
    
    return scores_df

def process_xlsx_files_in_folder(folder_path):
    for filename in os.listdir(folder_path):
        if filename.endswith(".xlsx"):
            file_path = os.path.join(folder_path, filename)
            scores_df = extract_exam_scores(file_path)
            
            if scores_df.empty:
                print(f"Skipping file '{filename}' due to missing exam data.")
                continue
            
            # Save as CSV with the same name as the Excel file
            csv_filename = os.path.splitext(filename)[0] + ".csv"
            csv_path = os.path.join(folder_path, csv_filename)
            scores_df.to_csv(csv_path, encoding='utf-8-sig')
            print(f"Saved: {csv_filename}")

# Example usage
folder_path = r"C:\Users\HELR_LPTP\OneDrive\Desktop\الجمعة"
process_xlsx_files_in_folder(folder_path)
