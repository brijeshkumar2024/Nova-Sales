from pathlib import Path
import sys
from dotenv import load_dotenv

# Add project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from src.aws.s3_client import upload_file


load_dotenv(PROJECT_ROOT / ".env")

daily_file = PROJECT_ROOT / "data" / "aws_processed" / "daily_sales.csv"
region_file = PROJECT_ROOT / "data" / "aws_processed" / "region_sales.csv"


print("=" * 60)
print("NovaSales - Upload Processed Data to S3")
print("=" * 60)

print("\nUploading daily sales...")
upload_file(
    str(daily_file),
    "processed/daily_sales.csv"
)

print("\nUploading regional sales...")
upload_file(
    str(region_file),
    "processed/region_sales.csv"
)

print("\n" + "=" * 60)
print("PROCESSED DATA UPLOAD COMPLETED")
print("=" * 60)