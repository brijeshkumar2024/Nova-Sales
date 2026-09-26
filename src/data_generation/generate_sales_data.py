from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# NovaSales - Realistic Historical Sales Dataset Generator
# ============================================================

SEED = 42
N_TRANSACTIONS = 100_000

rng = np.random.default_rng(SEED)

OUTPUT_DIR = Path("data/raw")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ------------------------------------------------------------
# Business configuration
# ------------------------------------------------------------

REGIONS = {
    "North": ["India", "UAE"],
    "South": ["India", "Singapore"],
    "East": ["India", "Bangladesh"],
    "West": ["India", "UAE"],
    "Central": ["India", "Singapore"],
}

REGION_WEIGHTS = {
    "North": 0.22,
    "South": 0.20,
    "East": 0.18,
    "West": 0.23,
    "Central": 0.17,
}

REGION_MULTIPLIERS = {
    "North": 1.05,
    "South": 1.12,
    "East": 0.92,
    "West": 1.18,
    "Central": 0.88,
}


PRODUCTS = [
    ("P001", "Laptop Pro", "Electronics", 75000),
    ("P002", "Smartphone X", "Electronics", 42000),
    ("P003", "Tablet Air", "Electronics", 28000),
    ("P004", "Wireless Headphones", "Accessories", 6500),
    ("P005", "Smart Watch", "Accessories", 9000),
    ("P006", "Gaming Monitor", "Electronics", 32000),
    ("P007", "Mechanical Keyboard", "Accessories", 7500),
    ("P008", "Office Chair", "Furniture", 14000),
    ("P009", "Standing Desk", "Furniture", 22000),
    ("P010", "Air Purifier", "Home Appliances", 12500),
    ("P011", "Robot Vacuum", "Home Appliances", 26000),
    ("P012", "Coffee Machine", "Home Appliances", 18000),
    ("P013", "Running Shoes", "Sports", 5500),
    ("P014", "Fitness Tracker", "Sports", 4500),
    ("P015", "Backpack Pro", "Lifestyle", 3500),
    ("P016", "Travel Bag", "Lifestyle", 6500),
    ("P017", "Bluetooth Speaker", "Electronics", 7000),
    ("P018", "Power Bank", "Accessories", 2200),
    ("P019", "External SSD", "Electronics", 8500),
    ("P020", "WiFi Router", "Electronics", 6000),
    ("P021", "Smart TV", "Electronics", 55000),
    ("P022", "Microwave Oven", "Home Appliances", 15000),
    ("P023", "Air Fryer", "Home Appliances", 8500),
    ("P024", "Treadmill", "Sports", 42000),
    ("P025", "Yoga Mat", "Sports", 1800),
    ("P026", "Desk Lamp", "Furniture", 2800),
    ("P027", "Bookshelf", "Furniture", 7500),
    ("P028", "Monitor Stand", "Furniture", 3500),
    ("P029", "Webcam HD", "Accessories", 4800),
    ("P030", "Smart Home Hub", "Electronics", 11000),
]


# Currency conversion rates to INR.
CURRENCY_RATES = {
    "India": ("INR", 1.0),
    "UAE": ("AED", 22.7),
    "Singapore": ("SGD", 67.5),
    "Bangladesh": ("BDT", 0.76),
}


CAMPAIGNS = [
    "None",
    "Summer Sale",
    "Festive Sale",
    "Mega Discount",
    "Weekend Campaign",
]

CAMPAIGN_PROBABILITIES = [0.55, 0.12, 0.15, 0.08, 0.10]

CAMPAIGN_MULTIPLIERS = {
    "None": 1.00,
    "Summer Sale": 1.10,
    "Festive Sale": 1.30,
    "Mega Discount": 1.22,
    "Weekend Campaign": 1.08,
}


# ------------------------------------------------------------
# Generate transaction dates
# ------------------------------------------------------------

START_DATE = pd.Timestamp("2024-01-01")
END_DATE = pd.Timestamp("2026-06-30")

dates = pd.date_range(
    START_DATE,
    END_DATE,
    freq="D",
)


# ------------------------------------------------------------
# Generate base transaction attributes
# ------------------------------------------------------------

region_names = list(REGIONS.keys())

chosen_regions = rng.choice(
    region_names,
    size=N_TRANSACTIONS,
    p=[REGION_WEIGHTS[r] for r in region_names],
)

chosen_dates = rng.choice(
    dates,
    size=N_TRANSACTIONS,
)

product_indices = rng.integers(
    0,
    len(PRODUCTS),
    size=N_TRANSACTIONS,
)


rows = []


# ------------------------------------------------------------
# Transaction generation
# ------------------------------------------------------------

for i in range(N_TRANSACTIONS):

    region = chosen_regions[i]

    country = rng.choice(
        REGIONS[region]
    )

    product_id, product_name, category, base_price = PRODUCTS[
        product_indices[i]
    ]

    currency, currency_to_inr = CURRENCY_RATES[country]

    date = pd.Timestamp(
        chosen_dates[i]
    )

    month = date.month
    weekday = date.dayofweek


    # --------------------------------------------------------
    # Seasonality
    # --------------------------------------------------------

    seasonal_multiplier = 1.0

    # Festive / year-end demand.
    if month in [10, 11, 12]:
        seasonal_multiplier += 0.25

    # Mid-year demand.
    if month in [6, 7]:
        seasonal_multiplier += 0.08

    # Weekend uplift.
    if weekday >= 5:
        seasonal_multiplier += 0.12


    # --------------------------------------------------------
    # Marketing campaign
    # --------------------------------------------------------

    campaign = rng.choice(
        CAMPAIGNS,
        p=CAMPAIGN_PROBABILITIES,
    )

    campaign_multiplier = CAMPAIGN_MULTIPLIERS[
        campaign
    ]


    # --------------------------------------------------------
    # Discount
    # --------------------------------------------------------

    discount_percent = float(
        rng.choice(
            [0, 5, 10, 15, 20, 25],
            p=[0.45, 0.15, 0.16, 0.12, 0.08, 0.04],
        )
    )


    # --------------------------------------------------------
    # Quantity
    # --------------------------------------------------------

    quantity_lambda = (
        3.2
        * seasonal_multiplier
        * REGION_MULTIPLIERS[region]
        * campaign_multiplier
    )

    quantity = max(
        1,
        int(rng.poisson(quantity_lambda)),
    )


    # --------------------------------------------------------
    # Price
    # --------------------------------------------------------

    price_noise = rng.normal(
        loc=1.0,
        scale=0.06,
    )

    unit_price = max(
        100,
        base_price * price_noise,
    )


    # --------------------------------------------------------
    # Revenue
    # --------------------------------------------------------

    gross_sales = (
        quantity
        * unit_price
    )

    discount_amount = (
        gross_sales
        * discount_percent
        / 100
    )

    sales_amount = (
        gross_sales
        - discount_amount
    )


    # Small realistic measurement noise.
    sales_amount *= rng.normal(
        loc=1.0,
        scale=0.035,
    )

    sales_amount = max(
        sales_amount,
        0,
    )

    sales_amount_inr = (
        sales_amount
        * currency_to_inr
    )


    rows.append(
        {
            "transaction_id": f"TXN{i + 1:07d}",
            "date": date,
            "region": region,
            "country": country,
            "product_id": product_id,
            "product_name": product_name,
            "category": category,
            "quantity": quantity,
            "unit_price": round(unit_price, 2),
            "currency": currency,
            "discount_percent": discount_percent,
            "marketing_campaign": campaign,
            "sales_amount": round(sales_amount, 2),
            "currency_to_inr": currency_to_inr,
            "sales_amount_inr": round(
                sales_amount_inr,
                2,
            ),
        }
    )


# ------------------------------------------------------------
# Create DataFrame
# ------------------------------------------------------------

df = pd.DataFrame(rows)

df["date"] = pd.to_datetime(
    df["date"]
)

df = df.sort_values(
    ["date", "region", "product_id"]
).reset_index(
    drop=True
)


# ------------------------------------------------------------
# Save dataset
# ------------------------------------------------------------

output_file = (
    OUTPUT_DIR
    / "historical_sales.csv"
)

df.to_csv(
    output_file,
    index=False,
)


# ------------------------------------------------------------
# Validation report
# ------------------------------------------------------------

print()
print("=" * 70)
print("NovaSales - Historical Sales Dataset")
print("=" * 70)

print(
    f"Transactions       : {len(df):,}"
)

print(
    f"Date range         : "
    f"{df['date'].min().date()} "
    f"to "
    f"{df['date'].max().date()}"
)

print(
    f"Regions            : "
    f"{df['region'].nunique()}"
)

print(
    f"Countries          : "
    f"{df['country'].nunique()}"
)

print(
    f"Products           : "
    f"{df['product_id'].nunique()}"
)

print(
    f"Categories         : "
    f"{df['category'].nunique()}"
)

print(
    f"Currencies         : "
    f"{df['currency'].nunique()}"
)

print(
    f"Missing values     : "
    f"{df.isna().sum().sum()}"
)

print(
    f"Duplicate TXNs     : "
    f"{df['transaction_id'].duplicated().sum()}"
)

print(
    f"Total Sales (INR)  : "
    f"₹{df['sales_amount_inr'].sum():,.2f}"
)

print(
    f"Output file        : "
    f"{output_file}"
)


print()
print("-" * 70)
print("Transactions by Region")
print("-" * 70)

print(
    df.groupby("region")
    .size()
    .sort_values(
        ascending=False
    )
)


print()
print("-" * 70)
print("Sales by Region (INR)")
print("-" * 70)

print(
    df.groupby("region")[
        "sales_amount_inr"
    ]
    .sum()
    .sort_values(
        ascending=False
    )
    .round(2)
)


print()
print("-" * 70)
print("Dataset Preview")
print("-" * 70)

print(
    df.head(5).to_string(
        index=False
    )
)

print()
print("=" * 70)
print("DATASET GENERATION COMPLETE")
print("=" * 70)