from nicegui import ui
from pathlib import Path
import os
from datetime import datetime
from typing import Optional
import json
from python.src.encoder_decoder import decode_data
from xlsxparser import update_student_records

class ExcelUpdaterUI:
    def __init__(self):
        # First, we initialize all our state variables that we'll need throughout the application
        self.current_step = 0
        self.decoded_data = None
        self.excel_file_path = None
        self.file_selected = False
        self.recent_files = []
        
        # Now we can safely set up our UI, knowing all our variables exist
        self.setup_ui()

    def setup_ui(self):
        """Sets up the main user interface structure."""
        # Add our global styles
        ui.add_head_html('''
            <style>
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem;
                }
                .file-drop-zone {
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
                .file-drop-zone:hover {
                    border-color: #5898d4;
                    background-color: #f8fafc;
                }
            </style>
        ''')
        
        # Create our main layout container
        with ui.column().classes('container'):
            # Main card that holds all our content
            with ui.card().classes('w-full max-w-3xl mx-auto'): 
                # Header section with title and status
                with ui.row().classes('w-full items-center justify-between p-4 border-b'):
                    ui.label('Student Records Updater').classes('text-2xl font-bold')
                    self.status_label = ui.label('Step 1: Paste Data').classes('text-gray-600')
                
                # Content section with all our steps
                with ui.column().classes('p-4 gap-4'):
                    self.setup_paste_step()
                    self.setup_file_step()
                    self.setup_preview_step()
                    self.setup_complete_step()

    def setup_paste_step(self):
        """Sets up the first step where users paste their data."""
        with ui.column().classes('w-full gap-4').bind_visibility_from(
            self, 'current_step', lambda x: x == 0
        ):
            # Clear instructions for the user
            ui.label('Paste your attendance data below:').classes('text-lg font-medium')
            
            # The main textarea where users will paste their data
            self.data_input = ui.textarea(
                placeholder='Paste the data from your attendance app here...'
            ).classes('w-full min-h-[200px]').style('resize: vertical; padding: 0.75rem;')
            
            # Helpful context for the user
            ui.label(
                'Copy the encoded data from your mobile app and paste it here'
            ).classes('text-sm text-gray-600')
            
            # Navigation button
            with ui.row().classes('w-full justify-end'):
                ui.button(
                    'Next →',
                    on_click=self.handle_paste
                ).props('color=primary').classes('px-6')

    def setup_file_step(self):
        """Sets up the file selection step."""
        with ui.column().classes('w-full gap-4').bind_visibility_from(
            self, 'current_step', lambda x: x == 1
        ):
            # File upload section
            with ui.card().classes('file-drop-zone p-8 text-center'):
                ui.icon('upload_file').classes('text-4xl text-gray-400 mb-2')
                ui.label('Drop your Excel file here or click to browse').classes('text-gray-600')
                self.file_upload = ui.upload(
                    auto_upload=True,
                    max_files=1,
                    on_upload=self.handle_file_upload
                ).props('accept=.xlsx')

            # Navigation buttons
            with ui.row().classes('w-full justify-between'):
                ui.button('← Back', on_click=lambda: self.show_step(0))
                self.next_file_btn = ui.button(
                    'Next →',
                    on_click=lambda: self.show_step(2)
                ).props('color=primary disable')

    

    def setup_complete_step(self):
        """Sets up the completion step showing success status."""
        with ui.column().classes('w-full gap-4').bind_visibility_from(
            self, 'current_step', lambda x: x == 3
        ):
            with ui.card().classes('w-full p-4 text-center'):
                ui.icon('check_circle').classes('text-6xl text-green-500')
                ui.label('Update Complete!').classes('text-xl font-bold')
                self.result_container = ui.column().classes('mt-4')
            
            with ui.row().classes('w-full justify-center gap-4'):
                ui.button('Start Over', on_click=self.reset_app)
                ui.button('Open File Location', on_click=self.open_file_location)

    def handle_paste(self):
        """
        Processes and validates the pasted data with proper notification handling.
        Note: This is no longer an async method since we don't need to await anything.
        """
        try:
            # First check for empty input
            if not self.data_input.value or not self.data_input.value.strip():
                ui.notify('Please paste your attendance data first', type='warning')
                return

            # Try to decode the data
            try:
                self.decoded_data = decode_data(self.data_input.value)
            except ValueError as e:
                # Handle specific decode errors with a descriptive message
                ui.notify(f'Invalid data format: {str(e)}', type='negative')
                return
            except Exception as e:
                # Handle unexpected decode errors
                ui.notify('An unexpected error occurred while processing the data', type='negative')
                print(f"Decode error: {str(e)}")  # Helpful for debugging
                return

            # If we get here, validation was successful
            ui.notify('Data validated successfully!', type='positive')
            self.show_step(1)  # Move to next step

        except Exception as e:
            # Catch any other unexpected errors
            print(f"Unexpected error in handle_paste: {str(e)}")
            ui.notify('An unexpected error occurred', type='negative')

    def handle_file_upload(self, e):
        """
        Processes the uploaded Excel file.
        
        Args:
            e: The upload event containing file information and content
        """
        try:
            # Get the temporary file object
            temp_file = e.content
            file_name = e.name
            
            # Create uploads directory if it doesn't exist
            os.makedirs('uploads', exist_ok=True)
            file_path = os.path.join('uploads', file_name)
            
            # Properly read and write the file content
            temp_file.seek(0)  # Go to start of temporary file
            file_content = temp_file.read()  # Read entire file content
            
            # Write the content to our permanent location
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            # Update application state
            self.excel_file_path = file_path
            self.file_selected = True
            self.next_file_btn.props('disable=false')
            
            # Show success notification (without await)
            ui.notify('File uploaded successfully!', type='positive')
            
        except Exception as e:
            # Log the error for debugging
            print(f"File upload error: {str(e)}")
            # Show error notification (without await)
            ui.notify(f'Upload error: {str(e)}', type='negative')
    
    def setup_preview_step(self):
        """Sets up the preview step where users can review changes."""
        with ui.column().classes('w-full gap-4').bind_visibility_from(
            self, 'current_step', lambda x: x == 2
        ):
            self.preview_container = ui.card().classes('w-full p-4')
            
            # Create a scrollable container for logs
            with ui.card().classes('w-full mt-4 bg-gray-50'):
                ui.label('Update Progress').classes('text-lg font-medium mb-2')
                with ui.scroll_area().classes('h-64'):
                    # We'll create a container that will hold our logs
                    self.log_container = ui.column().classes('w-full gap-1 p-4')
            
            with ui.row().classes('w-full justify-between mt-4'):
                ui.button('← Back', on_click=lambda: self.show_step(1))
                ui.button(
                    'Update File →',
                    on_click=self.process_update
                ).props('color=primary')

    def handle_log_message(self, message: str, level: str):
        """
        Handles incoming log messages and displays them in the UI.
        Creates styled log entries within the log container.
        """
        # Define colors for different log levels
        level_colors = {
            'info': 'text-blue-600',
            'warning': 'text-yellow-600',
            'error': 'text-red-600',
            'debug': 'text-gray-600'
        }
        
        # Get appropriate color class
        color_class = level_colors.get(level.lower(), 'text-gray-600')
        
        # Create timestamp
        timestamp = datetime.now().strftime('%H:%M:%S')
        
        # We use with statement to create label in the correct context
        with self.log_container:
            ui.label(f'[{timestamp}] {message}').classes(f'text-sm {color_class}')

    def process_update(self):
        """
        Processes the Excel file update with the new data and displays progress logs.
        """
        try:
            if not self.excel_file_path:
                ui.notify('No Excel file selected', type='warning')
                return
                
            if not self.decoded_data:
                ui.notify('No attendance data available', type='warning')
                return

            # Clear existing log messages by removing all children
            self.log_container.clear()

            # Add initial status message
            self.handle_log_message("Starting update process...", "info")

            output_dir = os.path.dirname(self.excel_file_path)
            base_name = os.path.splitext(os.path.basename(self.excel_file_path))[0]
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = os.path.join(output_dir, f'{base_name}_updated_{timestamp}.xlsx')
            
            # Process the update with logging
            update_student_records(
                file_path=self.excel_file_path,
                update_data=self.decoded_data,
                output_file=output_path,
                log_callback=self.handle_log_message
            )
            
            # Show success message
            ui.notify('File updated successfully!', type='positive')
            self.handle_log_message("Update completed successfully!", "info")
            
            self.output_file_path = output_path
            self.show_step(3)
            
        except Exception as e:
            error_message = str(e)
            print(f"Update error: {error_message}")
            self.handle_log_message(f"Error during update: {error_message}", "error")
            ui.notify(
                'There was a problem updating the file. Please check your data and try again.',
                type='negative'
            )

    def show_step(self, step: int):
        """Updates the UI to show the specified step."""
        self.current_step = step
        steps = ['Paste Data', 'Select File', 'Preview', 'Complete']
        self.status_label.text = f'Step {step + 1}: {steps[step]}'

    def reset_app(self):
        """Resets the application to its initial state."""
        self.current_step = 0
        self.decoded_data = None
        self.excel_file_path = None
        self.file_selected = False
        self.data_input.value = ''
        self.show_step(0)

    def open_file_location(self):
        """Opens the file explorer to show the updated file."""
        if self.excel_file_path:
            os.startfile(os.path.dirname(self.excel_file_path))

def main():
    """Initializes and runs the application."""
    app = ExcelUpdaterUI()
    ui.run(
        title='Student Records Updater',
        host='127.0.0.1',
        port=8080,
        reload=False,
        show=True,
        favicon='📊'
    )

if __name__ == '__main__':
    main()