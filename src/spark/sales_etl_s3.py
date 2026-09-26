import os
import shutil
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from pyspark.sql import SparkSession
from pyspark.sql import functions as F


# ============================================================
# NovaSales - AWS S3 Cloud ETL
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Load environment variables
load_dotenv(PROJECT_ROOT / ".env")

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "eu-north-1")
S3_BUCKET = os.getenv("NOVASALES_S3_BUCKET")


# ============================================================
# Validate environment
# ============================================================

if not AWS_ACCESS_KEY_ID:
    raise RuntimeError("AWS_ACCESS_KEY_ID is missing from .env")

if not AWS_SECRET_ACCESS_KEY:
    raise RuntimeError("AWS_SECRET_ACCESS_KEY is missing from .env")

if not S3_BUCKET:
    raise RuntimeError("NOVASALES_S3_BUCKET is missing from .env")


# ============================================================
# Paths
# ============================================================

S3_INPUT = f"s3a://{S3_BUCKET}/raw/historical_sales.csv"

LOCAL_OUTPUT_ROOT = PROJECT_ROOT / "data" / "aws_processed"

DAILY_OUTPUT = LOCAL_OUTPUT_ROOT / "daily_sales.csv"
REGION_OUTPUT = LOCAL_OUTPUT_ROOT / "region_sales.csv"


# ============================================================
# Spark Session
# ============================================================

spark = (
    SparkSession.builder
    .appName("NovaSales-Cloud-ETL")

    # Hadoop AWS connector
    .config(
        "spark.jars.packages",
        "org.apache.hadoop:hadoop-aws:3.5.0"
    )

    # AWS region / endpoint
    .config(
        "spark.hadoop.fs.s3a.endpoint",
        f"s3.{AWS_REGION}.amazonaws.com"
    )
    .config(
        "spark.hadoop.fs.s3a.endpoint.region",
        AWS_REGION
    )

    # AWS SDK v2-compatible provider
    .config(
        "spark.hadoop.fs.s3a.aws.credentials.provider",
        "org.apache.hadoop.fs.s3a.SimpleAWSCredentialsProvider"
    )

    # AWS credentials
    .config(
        "spark.hadoop.fs.s3a.access.key",
        AWS_ACCESS_KEY_ID
    )
    .config(
        "spark.hadoop.fs.s3a.secret.key",
        AWS_SECRET_ACCESS_KEY
    )

    # S3A configuration
    .config(
        "spark.hadoop.fs.s3a.impl",
        "org.apache.hadoop.fs.s3a.S3AFileSystem"
    )
    .config(
        "spark.hadoop.fs.s3a.path.style.access",
        "false"
    )

    # Spark configuration
    .config("spark.sql.shuffle.partitions", "8")

    .getOrCreate()
)

spark.sparkContext.setLogLevel("WARN")


# ============================================================
# Header
# ============================================================

print("=" * 70)
print("NovaSales Cloud ETL")
print("=" * 70)
print(f"AWS Region : {AWS_REGION}")
print(f"S3 Input   : {S3_INPUT}")
print()


# ============================================================
# Read Historical Sales from S3
# ============================================================

print("Reading historical sales from Amazon S3...")

df = (
    spark.read
    .option("header", "true")
    .option("inferSchema", "true")
    .csv(S3_INPUT)
)

raw_count = df.count()

print(f"Raw rows: {raw_count:,}")
print()


# ============================================================
# Clean and Standardize
# ============================================================

print("Cleaning and standardizing data...")

df = (
    df

    # Date
    .withColumn(
        "date",
        F.to_date("date")
    )

    # Numeric columns
    .withColumn(
        "quantity",
        F.col("quantity").cast("double")
    )
    .withColumn(
        "unit_price",
        F.col("unit_price").cast("double")
    )
    .withColumn(
        "discount_percent",
        F.col("discount_percent").cast("double")
    )
    .withColumn(
        "sales_amount",
        F.col("sales_amount").cast("double")
    )
    .withColumn(
        "currency_to_inr",
        F.col("currency_to_inr").cast("double")
    )
    .withColumn(
        "sales_amount_inr",
        F.col("sales_amount_inr").cast("double")
    )

    # Standardize marketing campaign
    .withColumn(
        "marketing_campaign",
        F.when(
            F.col("marketing_campaign").isNull()
            | (F.trim(F.col("marketing_campaign")) == "")
            | (
                F.lower(
                    F.trim(F.col("marketing_campaign"))
                ) == "none"
            ),
            F.lit("No Campaign")
        ).otherwise(
            F.col("marketing_campaign")
        )
    )

    # Recalculate INR sales
    .withColumn(
        "sales_amount_inr",
        F.col("sales_amount") * F.col("currency_to_inr")
    )
)


# ============================================================
# Remove Invalid Records
# ============================================================

before_cleaning = df.count()

df = (
    df

    # Remove duplicate transactions
    .dropDuplicates(["transaction_id"])

    # Required fields
    .filter(F.col("transaction_id").isNotNull())
    .filter(F.col("date").isNotNull())
    .filter(F.col("region").isNotNull())
    .filter(F.col("product_id").isNotNull())

    # Valid numeric values
    .filter(F.col("quantity") > 0)
    .filter(F.col("sales_amount_inr") >= 0)
    .filter(F.col("currency_to_inr") > 0)
)

after_cleaning = df.count()

print(f"Rows before cleaning : {before_cleaning:,}")
print(f"Rows after cleaning  : {after_cleaning:,}")
print()


# ============================================================
# Daily Sales Aggregation
# ============================================================

print("Creating daily sales aggregation...")

daily_sales = (
    df
    .groupBy("date")
    .agg(
        F.round(
            F.sum("sales_amount_inr"),
            2
        ).alias("daily_sales_inr"),

        F.sum("quantity")
        .cast("long")
        .alias("daily_quantity"),

        F.countDistinct("transaction_id")
        .alias("daily_transactions"),

        F.countDistinct("product_id")
        .alias("active_products"),

        F.countDistinct("region")
        .alias("active_regions")
    )
    .orderBy("date")
)


# ============================================================
# Regional Sales Aggregation
# ============================================================

print("Creating regional sales aggregation...")

region_sales = (
    df
    .groupBy("region")
    .agg(
        F.round(
            F.sum("sales_amount_inr"),
            2
        ).alias("total_sales_inr"),

        F.sum("quantity")
        .cast("long")
        .alias("total_quantity"),

        F.countDistinct("transaction_id")
        .alias("total_transactions"),

        F.countDistinct("product_id")
        .alias("active_products")
    )
    .orderBy(
        F.desc("total_sales_inr")
    )
)


# ============================================================
# Collect Aggregated Results
#
# IMPORTANT:
# Do NOT use Spark .write.csv() here.
# Windows Hadoop NativeIO can fail during local commit.
# We use Pandas for the small aggregated outputs instead.
# ============================================================

print("Collecting aggregated results...")

daily_pd = daily_sales.toPandas()
region_pd = region_sales.toPandas()

print(f"Daily rows    : {len(daily_pd):,}")
print(f"Regional rows : {len(region_pd):,}")
print()


# ============================================================
# Prepare Output Directory
# ============================================================

LOCAL_OUTPUT_ROOT.mkdir(
    parents=True,
    exist_ok=True
)

# Remove previous files if present
if DAILY_OUTPUT.exists():
    DAILY_OUTPUT.unlink()

if REGION_OUTPUT.exists():
    REGION_OUTPUT.unlink()


# ============================================================
# Write Daily CSV using Pandas
# ============================================================

print("Writing daily sales output...")

daily_pd.to_csv(
    DAILY_OUTPUT,
    index=False
)


# ============================================================
# Write Regional CSV using Pandas
# ============================================================

print("Writing regional sales output...")

region_pd.to_csv(
    REGION_OUTPUT,
    index=False
)


# ============================================================
# Verification
# ============================================================

print()
print("=" * 70)
print("NovaSales Cloud ETL - Verification")
print("=" * 70)

print(f"Raw rows              : {raw_count:,}")
print(f"Clean rows            : {after_cleaning:,}")
print(f"Daily rows            : {len(daily_pd):,}")
print(f"Regional rows         : {len(region_pd):,}")

print()
print("Daily sales preview:")
print(
    daily_pd.head(10).to_string(index=False)
)

print()
print("Regional sales preview:")
print(
    region_pd.to_string(index=False)
)

print()
print(f"Daily output  : {DAILY_OUTPUT}")
print(f"Region output : {REGION_OUTPUT}")

print()
print("=" * 70)
print("CLOUD ETL COMPLETED SUCCESSFULLY")
print("=" * 70)


# ============================================================
# Stop Spark
# ============================================================

spark.stop()