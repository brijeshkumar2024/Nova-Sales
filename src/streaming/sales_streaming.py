from pathlib import Path

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    current_timestamp,
    sum as spark_sum,
    count,
    approx_count_distinct,
    window,
)
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    IntegerType,
    DoubleType,
)


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

RAW_FILE = BASE_DIR / "data" / "raw" / "historical_sales.csv"

STREAM_INPUT_DIR = BASE_DIR / "data" / "streaming" / "input"
STREAM_OUTPUT_DIR = BASE_DIR / "data" / "streaming" / "processed"
CHECKPOINT_DIR = BASE_DIR / "data" / "streaming" / "checkpoint"


# ============================================================
# SPARK SESSION
# ============================================================

def create_spark_session():
    spark = (
        SparkSession.builder
        .appName("NovaSales-RealTime-Sales-Streaming")
        .master("local[*]")
        .config("spark.sql.shuffle.partitions", "8")
        .config(
            "spark.sql.streaming.forceDeleteTempCheckpointLocation",
            "true",
        )
        .config(
            "spark.hadoop.fs.file.impl",
            "org.apache.hadoop.fs.RawLocalFileSystem",
        )
        .config(
            "spark.hadoop.fs.file.impl.disable.cache",
            "true",
        )
        .getOrCreate()
    )

    spark.sparkContext.setLogLevel("WARN")

    return spark


# ============================================================
# STREAMING INPUT SCHEMA
# ============================================================

STREAM_SCHEMA = StructType([
    StructField("transaction_id", StringType(), True),
    StructField("date", StringType(), True),
    StructField("region", StringType(), True),
    StructField("country", StringType(), True),
    StructField("product_id", StringType(), True),
    StructField("product_name", StringType(), True),
    StructField("category", StringType(), True),
    StructField("quantity", IntegerType(), True),
    StructField("unit_price", DoubleType(), True),
    StructField("currency", StringType(), True),
    StructField("discount_percent", DoubleType(), True),
    StructField("marketing_campaign", StringType(), True),
    StructField("sales_amount", DoubleType(), True),
    StructField("currency_to_inr", DoubleType(), True),
    StructField("sales_amount_inr", DoubleType(), True),
])


# ============================================================
# PREPARE STREAMING INPUT
# ============================================================

def prepare_streaming_input(spark):
    """
    Converts the historical sales dataset into multiple
    streaming batch directories.

    This simulates continuous sales data arriving from
    regional offices.
    """

    STREAM_INPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    existing_batches = list(
        STREAM_INPUT_DIR.glob("batch_*.csv")
    )

    if existing_batches:
        print(
            f"Existing streaming batches found: "
            f"{len(existing_batches)}"
        )
        return

    print("Preparing streaming input batches...")

    raw_df = (
        spark.read
        .option("header", "true")
        .option("inferSchema", "true")
        .csv(str(RAW_FILE))
    )

    total_rows = raw_df.count()

    batch_size = 5000

    print(f"Total source rows : {total_rows}")
    print(f"Batch size        : {batch_size}")

    from pyspark.sql.window import Window
    from pyspark.sql.functions import row_number

    window_spec = Window.orderBy("transaction_id")

    numbered_df = raw_df.withColumn(
        "_row_number",
        row_number().over(window_spec),
    )

    batch_count = (
        total_rows + batch_size - 1
    ) // batch_size

    for batch_number in range(batch_count):

        start_row = (
            batch_number * batch_size + 1
        )

        end_row = min(
            (batch_number + 1) * batch_size,
            total_rows,
        )

        batch_df = (
            numbered_df
            .filter(
                (col("_row_number") >= start_row)
                & (col("_row_number") <= end_row)
            )
            .drop("_row_number")
        )

        batch_path = (
            STREAM_INPUT_DIR
            / f"batch_{batch_number + 1:04d}.csv"
        )

        (
            batch_df
            .coalesce(1)
            .write
            .mode("overwrite")
            .option("header", "true")
            .csv(str(batch_path))
        )

        print(
            f"Created batch "
            f"{batch_number + 1:02d}/{batch_count:02d}"
        )

    print("\nStreaming input preparation completed.")
    print(
        f"Input directory: {STREAM_INPUT_DIR}"
    )


# ============================================================
# START STRUCTURED STREAMING
# ============================================================

def start_stream(spark):

    print(
        "\nStarting NovaSales Structured Streaming..."
    )

    print(f"Input       : {STREAM_INPUT_DIR}")
    print(f"Output      : {STREAM_OUTPUT_DIR}")
    print(f"Checkpoint  : {CHECKPOINT_DIR}")

    STREAM_OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    CHECKPOINT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # READ STREAMING CSV FILES
    # --------------------------------------------------------

    streaming_df = (
        spark.readStream
        .schema(STREAM_SCHEMA)
        .option("header", "true")
        .option("maxFilesPerTrigger", 1)
        .option("recursiveFileLookup", "true")
        .csv(str(STREAM_INPUT_DIR))
    )

    # --------------------------------------------------------
    # DATA CLEANING AND TYPE NORMALIZATION
    # --------------------------------------------------------

    cleaned_df = (
        streaming_df

        .withColumn(
            "date",
            col("date").cast("date"),
        )

        .withColumn(
            "quantity",
            col("quantity").cast("int"),
        )

        .withColumn(
            "unit_price",
            col("unit_price").cast("double"),
        )

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

        # Recalculate normalized INR sales.
        .withColumn(
            "sales_amount_inr",
            col("sales_amount")
            * col("currency_to_inr"),
        )

        # Normalize campaign values.
        .withColumn(
            "marketing_campaign",
            col("marketing_campaign"),
        )

        # Processing timestamp.
        .withColumn(
            "processed_at",
            current_timestamp(),
        )

        # Remove invalid records.
        .filter(
            col("transaction_id").isNotNull()
            & col("date").isNotNull()
            & col("region").isNotNull()
            & col("product_id").isNotNull()
            & col("quantity").isNotNull()
            & col("sales_amount_inr").isNotNull()
            & (col("quantity") > 0)
            & (col("sales_amount_inr") >= 0)
        )

        # Remove duplicate transactions.
        .dropDuplicates(
            ["transaction_id"]
        )
    )

    # --------------------------------------------------------
    # WATERMARK
    # --------------------------------------------------------

    watermarked_df = (
        cleaned_df
        .withWatermark(
            "processed_at",
            "2 minutes",
        )
    )

    # --------------------------------------------------------
    # REAL-TIME WINDOW AGGREGATION
    # --------------------------------------------------------
    #
    # IMPORTANT:
    # Structured Streaming does not support exact
    # countDistinct aggregations in this query.
    #
    # approx_count_distinct is streaming-compatible
    # and provides an efficient cardinality estimate.
    # --------------------------------------------------------

    aggregated_df = (
        watermarked_df
        .groupBy(
            window(
                col("processed_at"),
                "1 minute",
            ),
            col("date"),
        )
        .agg(

            spark_sum(
                "sales_amount_inr"
            ).alias(
                "total_sales_inr"
            ),

            spark_sum(
                "quantity"
            ).alias(
                "total_quantity"
            ),

            count(
                "transaction_id"
            ).alias(
                "transaction_count"
            ),

            approx_count_distinct(
                "region"
            ).alias(
                "active_regions"
            ),

            approx_count_distinct(
                "product_id"
            ).alias(
                "active_products"
            ),
        )
    )

    # --------------------------------------------------------
    # FLATTEN WINDOW STRUCT
    #
    # CSV cannot directly write Spark STRUCT columns.
    # --------------------------------------------------------

    final_df = (
        aggregated_df

        .withColumn(
            "window_start",
            col("window.start"),
        )

        .withColumn(
            "window_end",
            col("window.end"),
        )

        .drop("window")

        .select(
            "window_start",
            "window_end",
            "date",
            "total_sales_inr",
            "total_quantity",
            "transaction_count",
            "active_regions",
            "active_products",
        )
    )

    # --------------------------------------------------------
    # WRITE STREAM
    # --------------------------------------------------------

    query = (
        final_df
        .writeStream
        .format("csv")
        .outputMode("append")
        .option(
            "header",
            "true",
        )
        .option(
            "path",
            str(STREAM_OUTPUT_DIR),
        )
        .option(
            "checkpointLocation",
            str(CHECKPOINT_DIR),
        )

        # Local Windows Spark takes longer than
        # 5 seconds for each micro-batch.
        .trigger(
            processingTime="15 seconds"
        )

        .start()
    )

    print(
        "\nStreaming query started successfully."
    )

    print(
        "Recursive file discovery enabled."
    )

    print(
        "Window columns flattened for CSV output."
    )

    print(
        "Distinct counts replaced with "
        "streaming-compatible approximate counts."
    )

    print(
        "Trigger interval: 15 seconds."
    )

    print(
        "New input files are processed automatically."
    )

    print(
        "Press Ctrl+C to stop streaming.\n"
    )

    query.awaitTermination()


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    spark = create_spark_session()

    try:

        prepare_streaming_input(spark)

        start_stream(spark)

    except KeyboardInterrupt:

        print(
            "\nStreaming stopped by user."
        )

    finally:

        spark.stop()

        print(
            "Spark session stopped."
        )