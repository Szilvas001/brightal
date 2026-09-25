# Supplier pricing and private observations

The active retail rule is **approved DIPEN stone cost × 2 = gross HUF retail**.
It replaces the earlier Noordia discount rule. The same fixed-point calculation
is used by catalogue, order creation, invoice accounting and payment validation.
Round once to whole HUF, HALF_UP. Gross retail includes 27% VAT; do not add VAT
again. Supplier cost is stone-only; shipping is excluded from this price basis.

Only admins can access `/api/diamonds/supplier/model` (GET/POST) and
`/api/diamonds/supplier/estimate` (POST). Observations are stored in the ignored
`data/supplier-model.json` with restrictive file permissions, never in Git.
Back up that file privately when deploying to another server.

Observation fields: id, shape, color, clarity, carat, usd (decimal string),
currency (`USD`), date (`YYYY-MM-DD`), kind (`quote` or `purchase`),
stoneOnly (`true`), evidence. Importing observations replaces the complete list.
Never include a customer's bid, an unallocated package price, shipping,
natural diamonds, or fancy colors as a colorless lab-grown observation.

The estimator interpolates log price per carat by distance in log carat,
color, clarity and shape. Exact historical combinations prefer the latest
observation. It exposes source IDs and extrapolation warnings. Temporal trend
uses repeat comparable specifications at least 30 days apart; absent these,
trend is unknown, not a fabricated decline. Sparse data cannot establish
reliable quality premiums. The output is an estimate, not a current quotation.

USD/HUF is an admin-verified decimal quote with source and timestamp; after
7 days it cannot produce a HUF estimate. Actual money conversion uses integer
fixed-point arithmetic. Statistical interpolation is computed in log space,
then materialized as decimal cents before currency/retail calculations.

Publishing a purchasable stone still requires actual available stock and a
verified IGI report. The catalogue import keeps its internal `referencePrice`
field for compatibility, but for `referenceSource: dipen` it means approved
stone cost in HUF. Legacy Noordia records are not purchasable under this rule.
The price refresh accepts certificateNumber (or the full exact composite),
costHuf, currency (`HUF`), source (`dipen`), status (`verified`), checkedAt.
Cost verification expires after 24 hours. Estimates are never silently
published as confirmed stock.

All supported combinations now have a public retail offer at POST
`/api/diamonds/offer`. It uses the same estimator and fresh FX as the admin,
returning only combination, gross HUF price and sourced fulfilment status.
It never exposes private observations or represents a sourced order as stock.
POST `/api/diamonds/combination/order` requires a customer login, accepted terms,
the displayed expected price and a retry key. The server recalculates the price,
rejects mismatches and persists the accepted offer and VAT breakdown. Repeated
requests with the same customer/key return the same order. The fixed order price
survives later FX changes, and payment verifies the stored offer before charging.
These paid orders follow the ordinary production/completion workflow; the old
stock-confirmation endpoint cannot overwrite their accepted price.

The legacy `/sourcing` request flow remains available for manual enquiries.
Those requests initially remain unpaid and require an exact certified catalogue
match. Actual catalogue purchases retain the 24-hour cost-freshness check.

The local deployment still requires configured real stock and payment-provider
credentials before it can accept real customer payments.
