from pathlib import Path
import sys
import os
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from src.aws.s3_client import upload_file


load_dotenv(PROJECT_ROOT / ".env")

STREAMING_DIR = PROJECT_ROOT / "data" / "streaming" / "processed"

print("=" * 60)
print("NovaSales - Upload Streaming Output to S3")
print("=" * 60)

if not STREAMING_DIR.exists():
    raise FileNotFoundError(
        f"Streaming output directory not found: {STREAMING_DIR}"
    )

files = sorted(STREAMING_DIR.glob("part-*.csv"))

if not files:
    raise FileNotFoundError(
        f"No streaming CSV files found in: {STREAMING_DIR}"
    )

print(f"\nFound {len(files)} streaming output files.")

uploaded = 0

for file_path in files:
    s3_key = f"streaming/processed/{file_path.name}"

    print(f"Uploading: {file_path.name}")

    upload_file(
        str(file_path),
        s3_key
    )

    uploaded += 1

print("\n" + "=" * 60)
print(f"STREAMING UPLOAD COMPLETED")
print(f"Files uploaded: {uploaded}")
print("=" * 60)