import os
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv


# Load environment variables from project .env
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")


AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "eu-north-1")
S3_BUCKET = os.getenv("NOVASALES_S3_BUCKET")


if not S3_BUCKET:
    raise RuntimeError(
        "NOVASALES_S3_BUCKET is not configured in the .env file."
    )


s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
)


def check_bucket_access() -> bool:
    """Check whether the configured S3 bucket is accessible."""
    try:
        s3.head_bucket(Bucket=S3_BUCKET)
        return True
    except ClientError as exc:
        print(f"S3 bucket access failed: {exc}")
        return False


def list_objects(prefix: str = "") -> list[str]:
    """Return object keys stored under the specified S3 prefix."""
    response = s3.list_objects_v2(
        Bucket=S3_BUCKET,
        Prefix=prefix,
    )

    return [
        item["Key"]
        for item in response.get("Contents", [])
    ]


def upload_file(
    local_path: str | Path,
    s3_key: str,
) -> bool:
    """Upload a local file to the configured NovaSales S3 bucket."""
    local_path = Path(local_path)

    if not local_path.exists():
        raise FileNotFoundError(
            f"Local file not found: {local_path}"
        )

    try:
        s3.upload_file(
            str(local_path),
            S3_BUCKET,
            s3_key,
        )

        print(
            f"Uploaded: {local_path.name} -> "
            f"s3://{S3_BUCKET}/{s3_key}"
        )
        return True

    except ClientError as exc:
        print(f"S3 upload failed: {exc}")
        return False


def download_file(
    s3_key: str,
    local_path: str | Path,
) -> bool:
    """Download an S3 object to a local file."""
    local_path = Path(local_path)
    local_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    try:
        s3.download_file(
            S3_BUCKET,
            s3_key,
            str(local_path),
        )

        print(
            f"Downloaded: s3://{S3_BUCKET}/{s3_key} "
            f"-> {local_path}"
        )
        return True

    except ClientError as exc:
        print(f"S3 download failed: {exc}")
        return False


def get_object_uri(s3_key: str) -> str:
    """Return the S3 URI for an object."""
    return f"s3://{S3_BUCKET}/{s3_key}"


if __name__ == "__main__":
    print("NovaSales S3 Client")
    print(f"Region: {AWS_REGION}")
    print(f"Bucket: {S3_BUCKET}")

    if check_bucket_access():
        print("S3 bucket access: OK")

        objects = list_objects("raw/")

        print("Objects under raw/:")
        for obj in objects:
            print(f"  - {obj}")
    else:
        print("S3 bucket access: FAILED")