from typing import Optional, Callable
import logging

class UILogHandler(logging.Handler):
    """Custom logging handler that forwards logs to a UI callback function"""
    def __init__(self, callback: Callable[[str, str], None]):
        super().__init__()
        self.callback = callback
    
    def emit(self, record):
        try:
            msg = self.format(record)
            level = record.levelname.lower()
            self.callback(msg, level)
        except Exception:
            self.handleError(record)