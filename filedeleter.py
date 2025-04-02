import os
import hashlib
import argparse
import logging
from pathlib import Path
from collections import defaultdict
import subprocess

# Define your folder paths here
FOLDER_1 = r"D:\\family"  # First folder
FOLDER_2 = r"D:\\Camera"  # Second folder (update this)

# Default settings
USE_HASH = True       # Set to True to compare by file content, False to compare by filename
FORCE_DELETE = False  # Set to True to skip confirmation
SUMMARY_ONLY = True   # Set to True to show only summary, not individual files
BATCH_SIZE = 1000     # Number of files to process in each batch
KEEP_ONE_COPY = True  # Set to True to keep one copy of each file (in FOLDER_1)

def list_available_drives():
    """List all available drives including connected devices."""
    try:
        logging.info("Scanning for available drives and devices...")
        result = subprocess.run(['wmic', 'logicaldisk', 'get', 'caption,volumename'], 
                               capture_output=True, text=True, check=True)
        drives = result.stdout.strip().split('\n')[1:]
        logging.info("Available drives:")
        for drive in drives:
            if drive.strip():
                logging.info(f"  {drive.strip()}")
        
        # Additional information for MTP devices
        logging.info("\nLooking for connected MTP devices (phones, tablets)...")
        logging.info("For Android devices, try these common paths:")
        logging.info("1. This PC\\Pixel 5\\Internal shared storage\\DCIM\\Camera")
        logging.info("2. This PC\\Pixel 5\\Phone\\DCIM\\Camera")
        
        # List all mounted devices
        logging.info("\nListing all mounted devices:")
        for drive_letter in range(ord('A'), ord('Z')+1):
            drive = chr(drive_letter) + ":\\"
            if os.path.exists(drive):
                try:
                    volume_name = subprocess.run(['vol', drive], capture_output=True, text=True).stdout.strip()
                    logging.info(f"  {drive} - {volume_name}")
                except:
                    logging.info(f"  {drive}")
                    
        logging.info("\nIMPORTANT: To find the exact path to your phone:")
        logging.info("1. Open File Explorer")
        logging.info("2. Navigate to your Pixel 5")
        logging.info("3. Navigate to Internal shared storage > DCIM > Camera")
        logging.info("4. Copy the full path from the address bar")
        logging.info("5. Update the FOLDER_2 variable in the script")
    except Exception as e:
        logging.error(f"Error listing drives: {e}")

def setup_logging(verbose=False):
    """Configure logging based on verbosity level."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def get_file_hash(filepath):
    """Generate SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        return hasher.hexdigest()
    except IOError as e:
        logging.error(f"Failed to hash file {filepath}: {e}")
        return None

def get_files(folder, use_hash=False):
    """Retrieve a dictionary of file names or hashes from a folder."""
    files = {}
    folder_path = Path(folder)
    
    if not folder_path.exists() or not folder_path.is_dir():
        logging.error(f"Folder does not exist or is not a directory: {folder}")
        return files
    
    # Count total files for progress reporting
    try:
        total_files = sum(1 for _ in folder_path.rglob('*') if _.is_file())
        logging.info(f"Found {total_files} total files to scan in {folder}")
    except Exception as e:
        logging.error(f"Error counting files in {folder}: {e}")
        total_files = 0
    
    processed = 0
    
    try:
        for filepath in folder_path.rglob('*'):
            if filepath.is_file():
                processed += 1
                if processed % 100 == 0:
                    logging.info(f"Processed {processed}/{total_files} files in {folder}")
                
                if use_hash:
                    file_hash = get_file_hash(filepath)
                    if file_hash:
                        files[file_hash] = str(filepath)
                else:
                    files[filepath.name] = str(filepath)
        
        logging.info(f"Found {len(files)} unique files in {folder}")
        return files
    except Exception as e:
        logging.error(f"Error scanning folder {folder}: {e}")
        return files

def find_and_delete_duplicates(folder1, folder2, use_hash=False, dry_run=False, 
                              confirm=True, summary_only=False, batch_size=1000, 
                              verbose=False, keep_one_copy=True):
    """
    Find duplicate files in both folders and delete them.
    
    Args:
        folder1: Path to the first folder
        folder2: Path to the second folder
        use_hash: If True, compare files by hash; otherwise by filename
        dry_run: If True, only show what would be deleted without actually deleting
        confirm: If True, ask for confirmation before deleting
        summary_only: If True, only show summary statistics, not individual files
        batch_size: Number of files to process in each batch
        verbose: If True, show more detailed logging
        keep_one_copy: If True, keep one copy of each file (in folder1)
    """
    logging.info(f"Scanning folder 1: {folder1}")
    files1 = get_files(folder1, use_hash)
    
    logging.info(f"Scanning folder 2: {folder2}")
    files2 = get_files(folder2, use_hash)
    
    if not files1 or not files2:
        logging.warning("One or both folders are empty or could not be read")
        return 0
    
    # Find matching files
    matching_keys = set(files1.keys()) & set(files2.keys())
    
    if not matching_keys:
        logging.info("No matching files found between the folders")
        return 0
    
    # Prepare lists of files to delete
    files_to_delete_folder1 = []
    files_to_delete_folder2 = []
    
    for key in matching_keys:
        if keep_one_copy:
            # Keep the copy in folder1, delete from folder2
            files_to_delete_folder2.append(files2[key])
        else:
            # Delete from both folders
            files_to_delete_folder1.append(files1[key])
            files_to_delete_folder2.append(files2[key])
    
    # Group files by directory for better summary
    files_by_dir1 = defaultdict(list)
    files_by_dir2 = defaultdict(list)
    
    for filepath in files_to_delete_folder1:
        parent_dir = str(Path(filepath).parent)
        files_by_dir1[parent_dir].append(filepath)
        
    for filepath in files_to_delete_folder2:
        parent_dir = str(Path(filepath).parent)
        files_by_dir2[parent_dir].append(filepath)
    
    # Print summary
    total_files_to_delete = len(files_to_delete_folder1) + len(files_to_delete_folder2)
    logging.info(f"Found {len(matching_keys)} duplicate files between the folders")
    
    if keep_one_copy:
        logging.info(f"Will keep one copy in folder 1 and delete {len(files_to_delete_folder2)} files from folder 2")
    else:
        logging.info(f"Will delete {total_files_to_delete} files total ({len(files_to_delete_folder1)} from folder 1, {len(files_to_delete_folder2)} from folder 2)")
    
    if not summary_only:
        if files_to_delete_folder1:
            logging.info(f"\nFiles to delete from folder 1 ({folder1}):")
            for directory, files in files_by_dir1.items():
                logging.info(f"  {directory}: {len(files)} files")
                if verbose:
                    for filepath in files[:10]:  # Show only first 10 files per directory
                        logging.info(f"    - {Path(filepath).name}")
                    if len(files) > 10:
                        logging.info(f"    - ... and {len(files) - 10} more")
        
        if files_to_delete_folder2:
            logging.info(f"\nFiles to delete from folder 2 ({folder2}):")
            for directory, files in files_by_dir2.items():
                logging.info(f"  {directory}: {len(files)} files")
                if verbose:
                    for filepath in files[:10]:  # Show only first 10 files per directory
                        logging.info(f"    - {Path(filepath).name}")
                    if len(files) > 10:
                        logging.info(f"    - ... and {len(files) - 10} more")
    
    if dry_run:
        logging.info("Dry run completed. No files were deleted.")
        return 0
    
    if confirm:
        if keep_one_copy:
            confirmation = input(f"\nKeep files in folder 1 and delete {len(files_to_delete_folder2)} matching files from folder 2? (y/N): ").lower()
        else:
            confirmation = input(f"\nDelete all {total_files_to_delete} matching files from both folders? (y/N): ").lower()
            
        if confirmation != 'y':
            logging.info("Deletion cancelled by user")
            return 0
    
    # Process deletion in batches
    deleted_count = 0
    
    # Delete from folder 1 if not keeping one copy
    if files_to_delete_folder1:
        total_batches = (len(files_to_delete_folder1) + batch_size - 1) // batch_size
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min((batch_num + 1) * batch_size, len(files_to_delete_folder1))
            batch = files_to_delete_folder1[start_idx:end_idx]
            
            logging.info(f"Processing batch {batch_num + 1}/{total_batches} from folder 1 ({len(batch)} files)")
            
            for filepath in batch:
                try:
                    os.remove(filepath)
                    deleted_count += 1
                    if deleted_count % 100 == 0:
                        logging.info(f"Deleted {deleted_count}/{total_files_to_delete} files")
                except OSError as e:
                    logging.error(f"Failed to delete {filepath}: {e}")
    
    # Delete from folder 2
    if files_to_delete_folder2:
        total_batches = (len(files_to_delete_folder2) + batch_size - 1) // batch_size
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min((batch_num + 1) * batch_size, len(files_to_delete_folder2))
            batch = files_to_delete_folder2[start_idx:end_idx]
            
            logging.info(f"Processing batch {batch_num + 1}/{total_batches} from folder 2 ({len(batch)} files)")
            
            for filepath in batch:
                try:
                    os.remove(filepath)
                    deleted_count += 1
                    if deleted_count % 100 == 0:
                        logging.info(f"Deleted {deleted_count}/{total_files_to_delete} files")
                except OSError as e:
                    logging.error(f"Failed to delete {filepath}: {e}")
    
    logging.info(f"Successfully deleted {deleted_count} files")
    return deleted_count

def main():
    # Parse command line arguments, but use the predefined variables as defaults
    parser = argparse.ArgumentParser(description='Find and delete duplicate files between two folders')
    parser.add_argument('--folder1', default=FOLDER_1, 
                        help=f'First folder (default: {FOLDER_1})')
    parser.add_argument('--folder2', default=FOLDER_2, 
                        help=f'Second folder (default: {FOLDER_2})')
    parser.add_argument('--hash', action='store_true', default=USE_HASH, 
                        help='Use file hash for comparison instead of filename')
    parser.add_argument('--dry-run', action='store_true', 
                        help='Show what would be deleted without actually deleting')
    parser.add_argument('--force', '-f', action='store_true', default=FORCE_DELETE, 
                        help='Skip confirmation before deleting')
    parser.add_argument('--summary', '-s', action='store_true', default=SUMMARY_ONLY, 
                        help='Show only summary, not individual files')
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE, 
                        help=f'Number of files to process in each batch (default: {BATCH_SIZE})')
    parser.add_argument('--verbose', '-v', action='store_true', default=False, 
                        help='Enable verbose logging')
    parser.add_argument('--list-drives', action='store_true',
                        help='List available drives and connected devices')
    parser.add_argument('--keep-one', action='store_true', default=KEEP_ONE_COPY,
                        help='Keep one copy of each file in folder1 (default: True)')
    parser.add_argument('--delete-all', action='store_true', 
                        help='Delete matching files from both folders')
    
    args = parser.parse_args()
    setup_logging(args.verbose)
    
    if args.list_drives:
        list_available_drives()
        return
    
    # If --delete-all is specified, override --keep-one
    keep_one_copy = not args.delete_all if args.delete_all else args.keep_one
    
    find_and_delete_duplicates(
        args.folder1, 
        args.folder2, 
        use_hash=args.hash, 
        dry_run=args.dry_run, 
        confirm=not args.force,
        summary_only=args.summary,
        batch_size=args.batch_size,
        verbose=args.verbose,
        keep_one_copy=keep_one_copy
    )

if __name__ == "__main__":
    main()