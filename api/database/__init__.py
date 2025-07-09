# Import and expose all database operations
from database.operations import (
    get_all_entries,
    get_entry_by_id,
    get_crack_detections,
    get_detection_summary,
    create_entry,
    create_crack_detection,
    create_detection_summary,
    update_entry,
    delete_entry,
    get_auth_user,
    get_user
)