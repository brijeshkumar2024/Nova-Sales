import os
from pathlib import Path

from dotenv import load_dotenv
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    count,
    countDistinct,
    sum as spark_sum,
    avg,
    min as spark_min,
    max as spark_max,
    when,
    lit,
)


# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "eu-north-1")
S3_BUCKET = os.getenv("NOVASALES_S3_BUCKET")

if not S3_BUCKET:
    raise RuntimeError(
        "NOVASALES_S3_BUCKET is not configured in .env"
    )

S3_INPUT = f"s3a://{S3_BUCKET}/raw/historical_sales.csv"

LOCAL_OUTPUT_ROOT = PROJECT_ROOT / "data" / "aws_processed"
LOCAL_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

DAILY_OUTPUT = LOCAL_OUTPUT_ROOT / "daily_sales"
REGION_OUTPUT = LOCAL_OUTPUT_ROOT / "region_sales"


# ============================================================
# Spark session
# ============================================================

spark = (
    SparkSession.builder
    .appName("NovaSales-S3-ETL")
    .master("local[*]")
    .config("spark.sql.shuffle.partitions", "8")
    .config(
        "spark.hadoop.fs.s3a.aws.credentials.provider",
        "com.amazonaws.auth.DefaultAWSCredentialsProviderChain",
    )
    .config(
        "spark.hadoop.fs.s3a.endpoint",
        f"s3.{AWS_REGION}.amazonaws.com",
    )
    .getOrCreate()
)

spark.sparkContext.setLogLevel("WARN")


# ============================================================
# Read from Amazon S3
# ============================================================

print("=" * 70)
print("NovaSales Cloud ETL")
print("=" * 70)

print(f"AWS Region : {AWS_REGION}")
print(f"S3 Input   : {S3_INPUT}")
print()

print("Reading historical sales from Amazon S3...")

df = (
    spark.read
    .option("header", "true")
    .option("inferSchema", "true")
    .csv(S3_INPUT)
)

raw_count = df.count()

print(f"Raw rows loaded from S3: {raw_count:,}")
print()


# ============================================================
# Basic cleaning
# ============================================================

print("Cleaning and standardizing data...")

df = (
    df
    .withColumn("date", col("date").cast("date"))
    .withColumn("quantity", col("quantity").cast("double"))
    .withColumn("unit_price", col("unit_price").cast("double"))
    .withColumn(
        "discount_percent",
        col("discount_percent").cast("double"),
    )
    .withColumn(
        "sales_amount",
        col("sales_amount").cast("double"),
    )
    .withColumn(
        "currency_to_inr",
        col("currency_to_inr").cast("double"),
    )
    .withColumn(
        "sales_amount_inr",
        col("sales_amount_inr").cast("double"),
    )
    .withColumn(
        "marketing_campaign",
        when(
            col("marketing_campaign").isNull()
            | (col("marketing_campaign") == ""),
            lit("No Campaign"),
        ).otherwise(col("marketing_campaign")),
    )
)


# ============================================================
# Remove invalid records
# ============================================================

df = df.dropDuplicates(["transaction_id"])

df = df.filter(
    col("transaction_id").isNotNull()
    & col("date").isNotNull()
    & col("region").isNotNull()
    & col("product_id").isNotNull()
    & col("quantity").isNotNull()
    & col("sales_amount_inr").isNotNull()
)

clean_count = df.count()

print(f"Rows after cleaning: {clean_count:,}")
print()


# ============================================================
# Daily unified sales time series
# ============================================================

print("Creating daily sales aggregation...")

daily_sales = (
    df.groupBy("date")
    .agg(
        spark_sum("sales_amount_inr").alias(
            "daily_sales_inr"
        ),
        spark_sum("quantity").alias(
            "daily_quantity"
        ),
        count("*").alias(
            "daily_transactions"
        ),
        countDistinct("product_id").alias(
            "active_products"
        ),
        countDistinct("region").alias(
            "active_regions"
        ),
    )
    .orderBy("date")
)

daily_count = daily_sales.count()

print(f"Daily rows: {daily_count:,}")
print()


# ============================================================
# Regional aggregation
# ============================================================

print("Creating regional sales aggregation...")

region_sales = (
    df.groupBy("region")
    .agg(
        spark_sum("sales_amount_inr").alias(
            "total_sales_inr"
        ),
        spark_sum("quantity").alias(
            "total_quantity"
        ),
        count("*").alias(
            "total_transactions"
        ),
        avg("sales_amount_inr").alias(
            "average_transaction_value_inr"
        ),
        spark_min("date").alias(
            "first_sale_date"
        ),
        spark_max("date").alias(
            "latest_sale_date"
        ),
    )
    .orderBy(col("total_sales_inr").desc())
)


# ============================================================
# Write local cloud-ETL outputs
# ============================================================

print("Writing processed outputs...")

daily_sales.coalesce(1).write.mode("overwrite").option(
    "header", "true"
).csv(str(DAILY_OUTPUT))

region_sales.coalesce(1).write.mode("overwrite").option(
    "header", "true"
).csv(str(REGION_OUTPUT))


# ============================================================
# Verification
# ============================================================

print()
print("=" * 70)
print("CLOUD ETL COMPLETED")
print("=" * 70)

print(f"Raw S3 rows       : {raw_count:,}")
print(f"Clean rows        : {clean_count:,}")
print(f"Daily rows        : {daily_count:,}")

print()
print("Regional sales:")
region_sales.show(truncate=False)

print()
print("Daily sales sample:")
daily_sales.orderBy("date").show(5, truncate=False)

print()
print(f"Daily output  : {DAILY_OUTPUT}")
print(f"Region output : {REGION_OUTPUT}")

print()
print("S3 → PySpark → ETL pipeline: SUCCESS")

spark.stop()