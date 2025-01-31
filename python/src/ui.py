import tkinter as tk
from tkinter import ttk, scrolledtext, filedialog, messagebox
import os
from typing import List, Dict, Tuple
import logging
from decoder import decode_data
from xlsxparser import update_student_records
import queue
import threading
from datetime import datetime

# Create a queue for log messages
log_queue = queue.Queue()

# Custom queue handler for logging
class QueueHandler(logging.Handler):
    def __init__(self, log_queue):
        super().__init__()
        self.log_queue = log_queue

    def emit(self, record):
        self.log_queue.put(self.format(record))

# Configure logging
logging.basicConfig(
    filename='updater_ui.log',
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    encoding='utf-8'
)
# Add queue handler to root logger
queue_handler = QueueHandler(log_queue)
queue_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
logging.getLogger().addHandler(queue_handler)

class InputOutputPair(ttk.Frame):
    """A frame containing an encoded text input and an XLSX file selector."""
    
    def __init__(self, parent, index: int, on_remove=None):
        super().__init__(parent)
        self.index = index
        
        # Create a styled frame with padding and border
        self.style = ttk.Style()
        self.style.configure("Card.TFrame", padding=10)
        self.configure(style="Card.TFrame")
        
        # Configure grid weights
        self.grid_columnconfigure(1, weight=1)
        
        # Row 0: Header with remove button
        header_frame = ttk.Frame(self)
        header_frame.grid(row=0, column=0, columnspan=2, sticky='ew', pady=(0, 10))
        
        # Style the header
        title_label = ttk.Label(
            header_frame, 
            text=f"Input/Output Pair #{index + 1}",
            font=('Helvetica', 10, 'bold')
        )
        title_label.pack(side=tk.LEFT)
        
        if on_remove:
            remove_btn = ttk.Button(
                header_frame,
                text="Remove",
                command=lambda: on_remove(self),
                style="Remove.TButton"
            )
            remove_btn.pack(side=tk.RIGHT)
            
        # Row 1: Encoded text input with label frame
        text_frame = ttk.LabelFrame(self, text="Encoded Data", padding=(5, 5, 5, 5))
        text_frame.grid(row=1, column=0, columnspan=2, sticky='ew', pady=(0, 10))
        text_frame.grid_columnconfigure(0, weight=1)
        
        self.text_input = scrolledtext.ScrolledText(
            text_frame,
            height=8,
            width=50,
            font=('Consolas', 9)
        )
        self.text_input.grid(row=0, column=0, sticky='ew', padx=5, pady=5)
        
        # Row 2: File selector in a label frame
        file_frame = ttk.LabelFrame(self, text="Excel File", padding=(5, 5, 5, 5))
        file_frame.grid(row=2, column=0, columnspan=2, sticky='ew')
        file_frame.grid_columnconfigure(0, weight=1)
        
        self.file_path = tk.StringVar()
        self.file_entry = ttk.Entry(
            file_frame,
            textvariable=self.file_path,
            font=('Consolas', 9)
        )
        self.file_entry.grid(row=0, column=0, sticky='ew', padx=5, pady=5)
        
        browse_btn = ttk.Button(
            file_frame,
            text="Browse",
            command=self._browse_file,
            style="Browse.TButton"
        )
        browse_btn.grid(row=0, column=1, padx=5, pady=5)
        
        # Add separator
        ttk.Separator(self, orient='horizontal').grid(
            row=3, column=0, columnspan=2, sticky='ew', pady=15
        )
    
    def _browse_file(self):
        """Open file dialog to select XLSX file."""
        filename = filedialog.askopenfilename(
            title=f"Select Excel File for Pair {self.index + 1}",
            filetypes=[("Excel files", "*.xlsx"), ("All files", "*.*")]
        )
        if filename:
            self.file_path.set(filename)
    
    def get_data(self) -> Tuple[str, str]:
        """Return the current encoded text and file path."""
        return self.text_input.get("1.0", tk.END).strip(), self.file_path.get()
    
    def set_data(self, encoded_text: str, file_path: str):
        """Set the encoded text and file path."""
        self.text_input.delete("1.0", tk.END)
        self.text_input.insert("1.0", encoded_text)
        self.file_path.set(file_path)

class XLSXUpdaterApp:
    """Main application window for updating XLSX files with encoded data."""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("XLSX Updater")
        
        # Start maximized
        self.root.state('zoomed')
        
        # Configure styles
        self.setup_styles()
        
        # Configure grid weights
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_rowconfigure(1, weight=1)
        
        # Create main container with two panes
        self.paned_window = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        self.paned_window.grid(row=0, column=0, sticky='nsew', padx=10, pady=10)
        
        # Left pane for input pairs
        self.left_frame = ttk.Frame(self.paned_window)
        self.paned_window.add(self.left_frame, weight=2)
        
        # Right pane for log display
        self.right_frame = ttk.LabelFrame(self.paned_window, text="Processing Log")
        self.paned_window.add(self.right_frame, weight=1)
        
        # Configure log display
        self.setup_log_display()
        
        # Create scrollable canvas for pairs
        self.canvas = tk.Canvas(self.left_frame)
        self.scrollbar = ttk.Scrollbar(self.left_frame, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = ttk.Frame(self.canvas)
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )
        
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        # Grid the canvas and scrollbar
        self.canvas.grid(row=1, column=0, sticky="nsew", padx=(5, 0))
        self.scrollbar.grid(row=1, column=1, sticky="ns")
        
        # Configure left frame grid weights
        self.left_frame.grid_columnconfigure(0, weight=1)
        self.left_frame.grid_rowconfigure(1, weight=1)
        
        # Bottom buttons frame
        self.button_frame = ttk.Frame(self.left_frame, padding="10")
        self.button_frame.grid(row=2, column=0, columnspan=2, sticky='ew')
        
        ttk.Button(
            self.button_frame,
            text="Add New Pair",
            command=self._add_pair,
            style="Action.TButton"
        ).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(
            self.button_frame,
            text="Process All Files",
            command=self._process_all,
            style="Action.TButton"
        ).pack(side=tk.RIGHT, padx=5)
        
        self.pairs: List[InputOutputPair] = []
        self._add_pair()  # Add initial pair
        
        # Start log polling
        self.poll_log_queue()
    
    def setup_styles(self):
        """Configure ttk styles for the application."""
        style = ttk.Style()
        
        # Configure frame styles
        style.configure("Card.TFrame", background="#f0f0f0")
        
        # Configure button styles
        style.configure("Action.TButton", padding=5)
        style.configure("Browse.TButton", padding=3)
        style.configure("Remove.TButton", padding=3)
        
        # Configure label frame style
        style.configure("TLabelframe", padding=10)
        style.configure("TLabelframe.Label", font=('Helvetica', 9, 'bold'))
    
    def setup_log_display(self):
        """Set up the log display area."""
        self.log_text = scrolledtext.ScrolledText(
            self.right_frame,
            height=10,
            width=50,
            font=('Consolas', 9),
            wrap=tk.WORD
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Add a clear button for the log
        ttk.Button(
            self.right_frame,
            text="Clear Log",
            command=self._clear_log,
            style="Action.TButton"
        ).pack(side=tk.BOTTOM, pady=5)
    
    def _clear_log(self):
        """Clear the log display."""
        self.log_text.delete(1.0, tk.END)
    
    def poll_log_queue(self):
        """Check for new log messages and display them."""
        while True:
            try:
                message = log_queue.get_nowait()
                self.log_text.insert(tk.END, message + '\n')
                self.log_text.see(tk.END)
            except queue.Empty:
                break
        self.root.after(100, self.poll_log_queue)
    
    def _add_pair(self):
        """Add a new input-output pair to the UI."""
        pair = InputOutputPair(
            self.scrollable_frame,
            len(self.pairs),
            on_remove=self._remove_pair if len(self.pairs) > 0 else None
        )
        pair.grid(row=len(self.pairs), column=0, sticky='ew', padx=5, pady=5)
        self.pairs.append(pair)
        self.scrollable_frame.grid_columnconfigure(0, weight=1)
    
    def _remove_pair(self, pair: InputOutputPair):
        """Remove a pair from the UI."""
        pair.grid_forget()
        self.pairs.remove(pair)
        # Update indices of remaining pairs
        for i, p in enumerate(self.pairs):
            p.index = i
    
    def _process_all(self):
        """Process all input-output pairs."""
        # Disable process button during processing
        for widget in self.button_frame.winfo_children():
            widget.configure(state='disabled')
        
        # Clear the log display
        self._clear_log()
        
        def process_thread():
            try:
                logging.info("Starting processing of all pairs...")
                
                for pair in self.pairs:
                    encoded_text, xlsx_path = pair.get_data()
                    
                    if not encoded_text or not xlsx_path:
                        logging.error(f"Missing data for pair {pair.index + 1}")
                        self.root.after(0, lambda: messagebox.showerror(
                            "Error",
                            f"Please provide both encoded text and XLSX file for pair {pair.index + 1}"
                        ))
                        return
                    
                    # Generate output path
                    output_path = self._generate_output_path(xlsx_path)
                    
                    try:
                        logging.info(f"Processing pair {pair.index + 1}...")
                        
                        # Decode the encoded string
                        decoded_data = decode_data(encoded_text)
                        logging.info(f"Successfully decoded data for pair {pair.index + 1}")
                        
                        # Update the XLSX file
                        update_student_records(xlsx_path, decoded_data, output_path)
                        logging.info(f"Successfully updated XLSX file for pair {pair.index + 1}")
                        
                    except Exception as e:
                        error_msg = f"Error processing pair {pair.index + 1}: {str(e)}"
                        logging.error(error_msg)
                        self.root.after(0, lambda: messagebox.showerror("Error", error_msg))
                        return
                
                logging.info("All files have been processed successfully!")
                self.root.after(0, lambda: messagebox.showinfo(
                    "Success",
                    "All files have been processed successfully!"
                ))
                
            except Exception as e:
                error_msg = f"Unexpected error: {str(e)}"
                logging.error(error_msg)
                self.root.after(0, lambda: messagebox.showerror("Error", error_msg))
            
            finally:
                # Re-enable process button
                self.root.after(0, lambda: [
                    widget.configure(state='normal')
                    for widget in self.button_frame.winfo_children()
                ])
        
        # Start processing in a separate thread
        threading.Thread(target=process_thread, daemon=True).start()
    
    def _generate_output_path(self, input_path: str) -> str:
        """Generate output file path by adding '-modified' before the extension."""
        base, ext = os.path.splitext(input_path)
        return f"{base}-modified{ext}"
    
    def run(self):
        """Start the application."""
        self.root.mainloop()

if __name__ == "__main__":
    app = XLSXUpdaterApp()
    app.run()