---
title: "Advanced"
date: 2026-04-29T00:00:00+07:00
draft: false
weight: 10000003
description: "Examples 58-85: Machine learning models, time series analysis, financial data, production pipelines, and deployment patterns"
tags: ["data-analytics", "scikit-learn", "statsmodels", "yfinance", "streamlit", "python", "advanced"]
---

Examples 58 through 85 cover machine learning models, time series analysis with statsmodels, financial data fetching, working with large datasets, advanced aggregations, and production deployment patterns.

## Example 58: Linear Regression with scikit-learn

Linear regression models the relationship between a continuous target and one or more features. scikit-learn's `LinearRegression` is the starting point for all regression problems.

**Code**:

```python
import numpy as np                          # => numpy 2.4.4
import pandas as pd                         # => pandas 3.0.2
from sklearn.linear_model import LinearRegression   # => scikit-learn 1.8.0
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

rng = np.random.default_rng(seed=42)
n = 500
df = pd.DataFrame({
    "experience": rng.integers(1, 20, n),
    "education_years": rng.integers(12, 22, n),
    "age": rng.integers(22, 60, n),
})
# Salary is a linear function of features + noise
df["salary"] = (
    df["experience"] * 3000
    + df["education_years"] * 2000
    + rng.normal(0, 8000, n)
    + 20000
)

X = df[["experience", "education_years", "age"]]
y = df["salary"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# === Build and train the linear regression pipeline ===
pipe = Pipeline([
    ("scaler", StandardScaler()),     # => standardize features
    ("model", LinearRegression()),    # => linear regression estimator
])
pipe.fit(X_train, y_train)            # => fits scaler on X_train, then model

# === Evaluate on test set ===
y_pred = pipe.predict(X_test)
r2 = r2_score(y_test, y_pred)
rmse = mean_squared_error(y_test, y_pred) ** 0.5
mae = mean_absolute_error(y_test, y_pred)

print(f"R² score:  {r2:.3f}")     # => proportion of variance explained (1.0 = perfect)
print(f"RMSE:      {rmse:,.0f}") # => root mean squared error (same units as salary)
print(f"MAE:       {mae:,.0f}")  # => mean absolute error

# === Inspect coefficients (unstandardized model for interpretability) ===
lr = LinearRegression()
lr.fit(X_train, y_train)        # => no scaler — raw coefficients are meaningful
print("\nFeature coefficients:")
for feature, coef in zip(X.columns, lr.coef_):
    print(f"  {feature}: ${coef:,.0f}/unit")
# => experience: ~$3,000 per year increase (close to true $3,000)
# => education_years: ~$2,000 per year
# => age: ~$0 (not in true DGP, coefficient near zero)
print(f"  Intercept: ${lr.intercept_:,.0f}")

# === Residual analysis ===
residuals = y_test - y_pred
print(f"\nResiduals: mean={residuals.mean():,.0f}, std={residuals.std():,.0f}")
# => mean should be near 0; large std = high unexplained variance
```

**Key Takeaway**: Always standardize features before linear regression for interpretable coefficients on a common scale, and report R², RMSE, and MAE together — R² alone hides whether errors are 10 dollars or 10,000 dollars.

**Why It Matters**: Linear regression is the baseline model every analytics project should try first — it is fast, interpretable, and often performs surprisingly well. The coefficient interpretation (`$3,000 per year of experience`) directly answers business questions. Residual analysis reveals whether the model is systematically wrong for specific subgroups. If linear regression fails (low R², non-random residuals), it diagnoses what is missing — non-linearity, interactions, or missing features.

---

## Example 59: Logistic Regression — Classification Report and Confusion Matrix

Logistic regression models binary classification probabilities. The classification report and confusion matrix decode the multi-dimensional performance landscape.

**Code**:

```python
import numpy as np                      # => numpy 2.4.4
from sklearn.datasets import make_classification   # => scikit-learn 1.8.0
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt         # => matplotlib 3.10.x

# Generate imbalanced binary classification dataset
X, y = make_classification(
    n_samples=1000, n_features=10, n_informative=6,
    weights=[0.75, 0.25],  # => 75% class 0, 25% class 1 — imbalanced
    random_state=42,
)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

# === Train logistic regression ===
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)),
    # => class_weight="balanced": compensates for 75/25 imbalance by upweighting minority
])
pipe.fit(X_train, y_train)

y_pred = pipe.predict(X_test)
y_proba = pipe.predict_proba(X_test)[:, 1]  # => probability of class 1 per sample

# === Classification report ===
print(classification_report(y_test, y_pred, target_names=["Not Churned", "Churned"]))
# =>                precision  recall  f1-score  support
# => Not Churned      0.92      0.79     0.85     150
# => Churned          0.60      0.83     0.70      50
# => macro avg        0.76      0.81     0.77     200
# => precision: of predicted positives, how many are actually positive
# => recall: of actual positives, how many did we catch
# => f1-score: harmonic mean of precision and recall

# === Confusion matrix ===
cm = confusion_matrix(y_test, y_pred)
# => [[TN, FP],   True Negative = correctly predicted 0
# =>  [FN, TP]]   True Positive = correctly predicted 1
print(f"\nConfusion Matrix:\n{cm}")
# => [[119, 31],  => 119 TN: correct "not churned", 31 FP: false alarms
# =>  [  9, 41]]  => 9 FN: missed churns, 41 TP: caught churns

# === Visualize confusion matrix ===
fig, ax = plt.subplots(figsize=(6, 5))
ConfusionMatrixDisplay(cm, display_labels=["Not Churned", "Churned"]).plot(ax=ax)
ax.set_title("Logistic Regression Confusion Matrix")
plt.tight_layout()
# plt.show()

# === Probability threshold tuning ===
# Default threshold = 0.5 — can lower to catch more churns (higher recall, lower precision)
y_pred_low_thresh = (y_proba >= 0.3).astype(int)  # => lower threshold = more churn predicted
# => higher recall but more false positives
```

**Key Takeaway**: For imbalanced classification, use `class_weight="balanced"` to prevent the model from ignoring the minority class, and evaluate with F1-score and recall rather than accuracy — a model predicting all 0s has 75% accuracy but 0 recall.

**Why It Matters**: Accuracy is misleading for imbalanced datasets. A churn model that predicts "no churn" for everyone has 75% accuracy but misses 100% of churning customers. Precision and recall capture the trade-off between false alarms and missed detections. The confusion matrix visualizes all four error types simultaneously, enabling domain-specific threshold decisions (is it worse to miss a churn or to send an unnecessary retention offer?).

---

## Example 60: HistGradientBoostingClassifier — NaN-Native Gradient Boosting

`HistGradientBoostingClassifier` is scikit-learn 1.8.0's flagship classifier — fast, handles NaN natively, and often outperforms logistic regression on tabular data.

**Code**:

```python
import numpy as np                           # => numpy 2.4.4
import pandas as pd                          # => pandas 3.0.2
from sklearn.ensemble import HistGradientBoostingClassifier  # => scikit-learn 1.8.0
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report

rng = np.random.default_rng(seed=42)
n = 1000

# Dataset WITH missing values — HistGradientBoosting handles this natively
df = pd.DataFrame({
    "age": np.where(rng.random(n) < 0.1, np.nan, rng.integers(18, 70, n)),  # => 10% missing
    "income": np.where(rng.random(n) < 0.15, np.nan, rng.lognormal(10.5, 0.7, n)),
    "credit_score": rng.normal(700, 80, n).clip(300, 850),
    "num_products": rng.integers(1, 6, n),
    "tenure_years": rng.integers(0, 20, n),
})
# Generate binary target
df["churn"] = (
    (df["tenure_years"] < 2).astype(int) +
    (df["num_products"] == 1).astype(int) +
    rng.choice([0, 1], n, p=[0.7, 0.3])
).clip(0, 1)

X = df.drop(columns=["churn"])    # => 5 features, 10-15% missing in age and income
y = df["churn"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

# === HistGradientBoostingClassifier — no imputation needed! ===
hgb = HistGradientBoostingClassifier(
    max_iter=200,          # => number of boosting iterations (trees)
    learning_rate=0.05,    # => shrinkage — smaller = more robust, slower
    max_depth=5,           # => max tree depth
    random_state=42,
    # => NaN values are natively handled — no SimpleImputer or ColumnTransformer needed
)
hgb.fit(X_train, y_train)         # => fits on data with NaN — no preprocessing required!

y_pred = hgb.predict(X_test)
y_proba = hgb.predict_proba(X_test)[:, 1]

roc_auc = roc_auc_score(y_test, y_proba)
print(f"ROC-AUC: {roc_auc:.3f}")            # => typically 0.75-0.85 on this data

print(classification_report(y_test, y_pred))

# === Compare: traditional approach needs imputation ===
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.pipeline import Pipeline

pipe_traditional = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),  # => must handle NaN manually
    ("clf", GradientBoostingClassifier(n_estimators=200, random_state=42)),
])
pipe_traditional.fit(X_train, y_train)
roc_auc_trad = roc_auc_score(y_test, pipe_traditional.predict_proba(X_test)[:, 1])
print(f"\nTraditional GBT ROC-AUC: {roc_auc_trad:.3f}")
print(f"HistGBT ROC-AUC:         {roc_auc:.3f}")
# => HistGBT often equal or better, always faster (histogram-based)
```

**Key Takeaway**: Use `HistGradientBoostingClassifier` instead of `GradientBoostingClassifier` for tabular data — it is 10-100x faster (histogram binning), requires no imputation for missing values, and matches or exceeds performance.

**Why It Matters**: Real-world tabular datasets almost always have missing values. The traditional approach (impute → scale → model) introduces three opportunities for data leakage and bugs. `HistGradientBoostingClassifier` handles NaN internally using a split criterion that assigns missing values to the optimal branch during training. It also uses a histogram-based algorithm that makes 1M-row datasets trainable in seconds rather than minutes.

---

## Example 61: Hyperparameter Tuning — GridSearchCV and RandomizedSearchCV

Hyperparameter tuning systematically searches for the model configuration that maximizes cross-validation performance.

**Code**:

```python
import numpy as np                           # => numpy 2.4.4
from sklearn.datasets import make_classification  # => scikit-learn 1.8.0
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import (
    train_test_split, GridSearchCV, RandomizedSearchCV, cross_val_score
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

X, y = make_classification(n_samples=1000, n_features=10, n_informative=6,
                            weights=[0.7, 0.3], random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

# === GridSearchCV — exhaustive search (all combinations) ===
param_grid = {
    "max_iter": [50, 100, 200],          # => 3 values
    "max_depth": [3, 5, 7],              # => 3 values
    "learning_rate": [0.01, 0.05, 0.1], # => 3 values
}
# => 3 × 3 × 3 = 27 combinations × 5 folds = 135 model fits

grid_search = GridSearchCV(
    HistGradientBoostingClassifier(random_state=42),
    param_grid,
    cv=5,                 # => 5-fold cross-validation per combination
    scoring="roc_auc",    # => optimize for ROC-AUC
    n_jobs=-1,            # => use all CPU cores
    verbose=1,            # => print progress
)
grid_search.fit(X_train, y_train)

print(f"Best params (Grid): {grid_search.best_params_}")
print(f"Best CV ROC-AUC:    {grid_search.best_score_:.3f}")

# === RandomizedSearchCV — efficient search for large parameter spaces ===
from scipy.stats import uniform, randint     # => distributions for random sampling

param_dist = {
    "max_iter": randint(50, 500),           # => uniform integer distribution
    "max_depth": randint(3, 10),
    "learning_rate": uniform(0.005, 0.195), # => uniform float: [0.005, 0.2]
    "l2_regularization": uniform(0, 1.0),   # => regularization strength
}

rand_search = RandomizedSearchCV(
    HistGradientBoostingClassifier(random_state=42),
    param_distributions=param_dist,
    n_iter=30,            # => try 30 random combinations (vs 27 in grid, but more variety)
    cv=5,
    scoring="roc_auc",
    n_jobs=-1,
    random_state=42,      # => reproducible sampling
)
rand_search.fit(X_train, y_train)

print(f"\nBest params (Random): {rand_search.best_params_}")
print(f"Best CV ROC-AUC:      {rand_search.best_score_:.3f}")

# === Evaluate best model on held-out test set ===
best_model = rand_search.best_estimator_
test_roc = best_model.score(X_test, y_test)    # => uses default threshold
from sklearn.metrics import roc_auc_score
test_auc = roc_auc_score(y_test, best_model.predict_proba(X_test)[:, 1])
print(f"Test ROC-AUC: {test_auc:.3f}")
```

**Key Takeaway**: Use `RandomizedSearchCV` with `n_iter=30-100` for initial tuning of large parameter spaces — it covers more diverse configurations than grid search with equal compute budget.

**Why It Matters**: Default hyperparameters rarely produce optimal models. But exhaustive grid search becomes computationally intractable as parameters multiply — a 5-parameter grid with 5 values each requires 3,125 × cv fits. Randomized search empirically finds near-optimal configurations with 20-40 iterations because most of the ROC-AUC improvement comes from a few key parameters. The key discipline is evaluating on a held-out test set that was never used during tuning.

---

## Example 62: Feature Importance — permutation_importance

Feature importance quantifies which features drive model predictions. Permutation importance is the most reliable method because it is model-agnostic and measures actual prediction impact.

**Code**:

```python
import numpy as np                           # => numpy 2.4.4
import pandas as pd                          # => pandas 3.0.2
from sklearn.ensemble import HistGradientBoostingClassifier  # => scikit-learn 1.8.0
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt             # => matplotlib 3.10.x

rng = np.random.default_rng(seed=42)
n = 500
feature_names = ["tenure", "num_products", "balance", "salary", "age", "random_noise"]
df = pd.DataFrame({
    "tenure": rng.integers(0, 20, n),
    "num_products": rng.integers(1, 5, n),
    "balance": rng.normal(50000, 30000, n).clip(0),
    "salary": rng.normal(65000, 20000, n),
    "age": rng.integers(22, 65, n),
    "random_noise": rng.normal(0, 1, n),    # => known irrelevant feature
})
# True relationship: churn driven mainly by tenure and num_products
df["churn"] = (
    (df["tenure"] < 3).astype(int) * 2 +
    (df["num_products"] == 1).astype(int) +
    rng.choice([0, 1], n, p=[0.7, 0.3])
).clip(0, 1)

X = df[feature_names]
y = df["churn"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# === Train model ===
model = HistGradientBoostingClassifier(max_iter=100, random_state=42)
model.fit(X_train, y_train)

# === Built-in feature importance (impurity-based) — can be misleading ===
if hasattr(model, "feature_importances_"):
    print("Impurity importance:", dict(zip(feature_names, model.feature_importances_.round(3))))

# === Permutation importance — model-agnostic, reliable ===
perm_result = permutation_importance(
    model, X_test, y_test,
    n_repeats=10,         # => shuffle each feature 10 times, average the accuracy drop
    random_state=42,
    scoring="roc_auc",
    n_jobs=-1,
)
# => for each feature: shuffle its values, measure accuracy drop
# => large drop = feature is important; small/negative = feature is irrelevant/noisy

importance_df = pd.DataFrame({
    "feature": feature_names,
    "importance_mean": perm_result.importances_mean,
    "importance_std": perm_result.importances_std,
}).sort_values("importance_mean", ascending=False)

print("\nPermutation Importance:")
print(importance_df.to_string(index=False))
# => tenure:       ~0.08 (large drop — very important)
# => num_products: ~0.04 (important)
# => balance:      ~0.01 (minor)
# => salary:       ~0.01 (minor)
# => age:          ~0.00 (not important)
# => random_noise: ~-0.002 (near zero — correctly identified as irrelevant)

# Visualize
fig, ax = plt.subplots(figsize=(8, 5))
ax.barh(importance_df["feature"], importance_df["importance_mean"], color="#0173B2")
ax.set_xlabel("Permutation Importance (ROC-AUC drop)")
ax.set_title("Feature Importance via Permutation")
plt.tight_layout()
```

**Key Takeaway**: Prefer permutation importance over impurity-based importance (`feature_importances_`) for reliable feature selection — impurity importance is biased toward high-cardinality features and can rank noise features as important.

**Why It Matters**: Feature importance guides which data to collect, which features to include in production, and which business variables actually drive the outcome being modeled. Impurity-based importance from tree models is known to overestimate the importance of numeric features over categorical ones. Permutation importance measures the actual prediction impact on held-out data, making it the most reliable method for feature selection and stakeholder communication.

---

## Example 63: Unsupervised Learning — KMeans and Silhouette Score

KMeans clustering segments data into groups when no labels are available. The silhouette score measures how well-separated the clusters are.

**Code**:

```python
import numpy as np                      # => numpy 2.4.4
import pandas as pd                     # => pandas 3.0.2
from sklearn.cluster import KMeans      # => scikit-learn 1.8.0
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt        # => matplotlib 3.10.x

rng = np.random.default_rng(seed=42)

# Create data with 3 natural clusters
cluster_1 = rng.multivariate_normal([2, 2], [[0.5, 0], [0, 0.5]], 100)
cluster_2 = rng.multivariate_normal([8, 4], [[0.8, 0.3], [0.3, 0.8]], 100)
cluster_3 = rng.multivariate_normal([5, 8], [[0.4, 0], [0, 0.4]], 100)
X = np.vstack([cluster_1, cluster_2, cluster_3])

# === Standardize before clustering ===
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# === KMeans with k=3 (known true cluster count) ===
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
# => n_init=10: run 10 random initializations, take best result
labels = kmeans.fit_predict(X_scaled)   # => cluster label per sample: [0, 1, 2, 0, ...]
print(f"Cluster sizes: {pd.Series(labels).value_counts().sort_index().tolist()}")
# => approximately [100, 100, 100]

# === Silhouette score — measures cluster quality ===
sil_score = silhouette_score(X_scaled, labels)
# => ranges from -1 (wrong cluster) to 0 (boundary) to 1 (well-separated)
print(f"Silhouette score (k=3): {sil_score:.3f}")  # => typically > 0.6 for clear clusters

# === Elbow method — find optimal k ===
inertia_values = []
sil_values = []
k_range = range(2, 8)

for k in k_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X_scaled)
    inertia_values.append(km.inertia_)    # => sum of squared distances to centroids
    sil_values.append(silhouette_score(X_scaled, km.labels_))

# Optimal k: where inertia "elbows" AND silhouette is highest
print("\nK vs Silhouette:")
for k, sil in zip(k_range, sil_values):
    print(f"  k={k}: silhouette={sil:.3f}")
# => k=3 should have highest silhouette for 3-cluster data

# === Visualize clusters ===
fig, ax = plt.subplots(figsize=(8, 6))
colors = ["#0173B2", "#DE8F05", "#029E73"]
for cluster_id in range(3):
    mask = labels == cluster_id
    ax.scatter(X[mask, 0], X[mask, 1],
               c=colors[cluster_id], label=f"Cluster {cluster_id}", alpha=0.7, s=30)

centroids_orig = scaler.inverse_transform(kmeans.cluster_centers_)
ax.scatter(centroids_orig[:, 0], centroids_orig[:, 1],
           c="black", marker="x", s=200, linewidths=3, label="Centroids")
ax.legend()
ax.set_title("KMeans Clustering (k=3)")
plt.tight_layout()
```

**Key Takeaway**: Always standardize features before KMeans (it uses Euclidean distance, which is scale-sensitive) and use the elbow method + silhouette score together to choose k — silhouette score is the more reliable criterion.

**Why It Matters**: Customer segmentation, document clustering, and anomaly detection are common unsupervised tasks where KMeans is the starting algorithm. Without standardization, a `salary` column with values in [30000, 150000] dominates `age` in [22, 65] despite potentially being less discriminative. The silhouette score provides an objective way to choose k when domain knowledge doesn't dictate the number of segments.

---

## Example 64: Dimensionality Reduction — PCA and t-SNE

PCA reduces high-dimensional data for modeling (removes noise), while t-SNE reduces to 2D/3D for visualization of cluster structure.

**Code**:

```python
import numpy as np                      # => numpy 2.4.4
from sklearn.decomposition import PCA   # => scikit-learn 1.8.0
from sklearn.manifold import TSNE
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt        # => matplotlib 3.10.x

# Use digits dataset (1797 images, 64 features each)
digits = load_digits()
X = digits.data           # => shape (1797, 64) — 64 pixel features per image
y = digits.target         # => labels 0-9

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# === PCA — linear dimensionality reduction ===
pca = PCA(n_components=0.95, random_state=42)
# => n_components=0.95: keep enough components to explain 95% variance
X_pca = pca.fit_transform(X_scaled)
print(f"Original shape: {X.shape}")           # => (1797, 64)
print(f"PCA shape:      {X_pca.shape}")       # => (1797, ~29) — 29 components explain 95%
print(f"Components kept: {pca.n_components_}")
print(f"Explained variance: {pca.explained_variance_ratio_.sum():.3f}")  # => ~0.950

# Explained variance per component
cumsum = np.cumsum(pca.explained_variance_ratio_)
n_90pct = np.argmax(cumsum >= 0.90) + 1   # => components needed for 90% variance
print(f"Components for 90% variance: {n_90pct}")

# === PCA for 2D visualization ===
pca_2d = PCA(n_components=2, random_state=42)
X_2d = pca_2d.fit_transform(X_scaled)    # => shape (1797, 2) for plotting

# === t-SNE — non-linear, better for visualization ===
# t-SNE preserves local structure (nearby points stay nearby)
# Run on PCA output first (faster, removes noise)
tsne = TSNE(n_components=2, random_state=42, perplexity=30, n_iter=1000)
X_tsne = tsne.fit_transform(X_pca[:, :30])  # => use first 30 PCA components
# => t-SNE is slow — run on reduced PCA representation, not raw 64D

# Visualize both
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
colors_10 = ["#0173B2", "#DE8F05", "#029E73", "#CC78BC", "#CA9161",
             "#0173B2", "#DE8F05", "#029E73", "#CC78BC", "#CA9161"]

for digit in range(10):
    mask = y == digit
    axes[0].scatter(X_2d[mask, 0], X_2d[mask, 1], alpha=0.5, s=10, label=str(digit))
    axes[1].scatter(X_tsne[mask, 0], X_tsne[mask, 1], alpha=0.5, s=10, label=str(digit))

axes[0].set_title("PCA 2D — Linear")
axes[1].set_title("t-SNE 2D — Non-linear")
for ax in axes:
    ax.legend(title="Digit", ncol=5, fontsize=8)
plt.tight_layout()
```

**Key Takeaway**: Use PCA with `n_components=0.95` for preprocessing before modeling (removes noise, speeds up training), and t-SNE for visualization only — t-SNE distances are not meaningful for downstream analysis.

**Why It Matters**: High-dimensional data has the "curse of dimensionality" — distance metrics become unreliable, and models overfit. PCA concentrates signal in the first few components, enabling faster, more robust models. t-SNE visualizes whether natural clusters exist in the data — if clusters are visible in the 2D t-SNE plot, a clustering algorithm will find them; if not, no clustering algorithm will. This diagnostic prevents wasted effort on clustering structureless data.

---

## Example 65: Time Series Analysis with statsmodels — ARIMA

ARIMA models capture time series trends, seasonality, and autocorrelation for forecasting. statsmodels provides a full ARIMA implementation with automatic fitting.

**Code**:

```python
import pandas as pd              # => pandas 3.0.2
import numpy as np               # => numpy 2.4.4
import statsmodels.api as sm     # => statsmodels 0.14.x
import matplotlib.pyplot as plt  # => matplotlib 3.10.x

rng = np.random.default_rng(seed=42)

# Create a time series with trend and autocorrelation
dates = pd.date_range("2022-01-01", periods=120, freq="ME")  # => 10 years monthly, "ME" not "M"
# AR(1) process: y_t = 0.7 * y_{t-1} + noise + trend
series = [100.0]
for _ in range(119):
    series.append(0.7 * series[-1] + rng.normal(10, 5))  # => AR(1) + drift

ts = pd.Series(series, index=dates, name="value")
print(f"Series shape: {ts.shape}")    # => (120,) — 120 monthly observations
print(ts.head())

# === Fit ARIMA model ===
# ARIMA(p, d, q): p=AR order, d=differencing, q=MA order
model = sm.tsa.ARIMA(
    ts,
    order=(1, 1, 1),  # => AR(1), first difference (I=1), MA(1)
    # d=1: first-differencing makes series stationary (removes trend)
)
result = model.fit()
print(result.summary())
# => AIC, BIC, coefficients with significance tests, diagnostic stats

# === Forecast next 12 months ===
forecast = result.forecast(steps=12)   # => 12-step ahead forecast as Series
# => forecast.index: the 12 future dates
print(f"\n12-month forecast:\n{forecast.round(1)}")

# === Confidence intervals for forecast ===
forecast_frame = result.get_forecast(steps=12).summary_frame(alpha=0.05)
# => columns: mean, mean_se, mean_ci_lower, mean_ci_upper (95% CI)
print(forecast_frame[["mean", "mean_ci_lower", "mean_ci_upper"]].round(1).head())

# Visualize
fig, ax = plt.subplots(figsize=(12, 5))
ts.plot(ax=ax, color="#0173B2", label="Historical")
forecast_frame["mean"].plot(ax=ax, color="#DE8F05", label="Forecast")
ax.fill_between(
    forecast_frame.index,
    forecast_frame["mean_ci_lower"],
    forecast_frame["mean_ci_upper"],
    alpha=0.3, color="#DE8F05",
    label="95% CI",
)
ax.legend()
ax.set_title("ARIMA(1,1,1) Forecast")
plt.tight_layout()
```

**Key Takeaway**: ARIMA(p,d,q) requires choosing the right order: use `d=1` if the series has a trend (first-differencing removes it), `p` from the PACF plot (AR order), and `q` from the ACF plot (MA order) — or use `auto_arima` from pmdarima for automatic selection.

**Why It Matters**: Time series forecasting is a core analytics capability for demand planning, financial budgeting, and anomaly detection. ARIMA is the classical baseline that every forecasting analyst should understand before trying neural approaches. The confidence interval is often more valuable than the point forecast — knowing that next month's sales are "between $90k and $130k" informs inventory decisions better than a single $110k prediction.

---

## Example 66: ARIMA Forecasting and Residual Diagnostics

Residual diagnostics verify whether the ARIMA model has captured all the signal in the data. White noise residuals indicate a well-specified model.

**Code**:

```python
import pandas as pd              # => pandas 3.0.2
import numpy as np               # => numpy 2.4.4
import statsmodels.api as sm     # => statsmodels 0.14.x
import matplotlib.pyplot as plt  # => matplotlib 3.10.x

rng = np.random.default_rng(seed=42)
dates = pd.date_range("2022-01-01", periods=120, freq="ME")
# ARIMA(2,0,1) process
errors = rng.normal(0, 5, 120)
ts_raw = [50.0, 55.0]
for i in range(2, 120):
    ts_raw.append(0.6 * ts_raw[-1] + 0.2 * ts_raw[-2] - 0.3 * errors[i-1] + errors[i])

ts = pd.Series(ts_raw, index=dates)

# === Fit model ===
model = sm.tsa.ARIMA(ts, order=(2, 0, 1))
result = model.fit()

# === In-sample fitted values ===
fitted = result.fittedvalues   # => model's fit to training data
residuals = ts - fitted        # => residuals: actual - fitted

print(f"Residuals mean: {residuals.mean():.3f}")  # => should be near 0
print(f"Residuals std:  {residuals.std():.3f}")

# === Ljung-Box test — tests for residual autocorrelation ===
from statsmodels.stats.diagnostic import acorr_ljungbox
lb_test = acorr_ljungbox(residuals, lags=10, return_df=True)
# => if p-values > 0.05: residuals are white noise (no autocorrelation remaining)
print(f"\nLjung-Box test (lags 1-10):\n{lb_test}")

# === Residual diagnostic plots ===
fig, axes = plt.subplots(2, 2, figsize=(12, 8))

# ACF and PACF of residuals (should show no significant spikes)
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
plot_acf(residuals, lags=20, ax=axes[0, 0], title="ACF of Residuals")
plot_pacf(residuals, lags=20, ax=axes[0, 1], title="PACF of Residuals")

# Residuals over time (should look like white noise)
axes[1, 0].plot(residuals, color="#0173B2")
axes[1, 0].axhline(0, color="black", linewidth=0.5)
axes[1, 0].set_title("Residuals Over Time")

# Residual distribution (should be approximately normal)
from scipy import stats
stats.probplot(residuals.values, dist="norm", plot=axes[1, 1])
axes[1, 1].set_title("Normal Q-Q Plot")

plt.tight_layout()

# === Multi-step forecast ===
forecast_result = result.get_forecast(steps=6)
print("\n6-step forecast:")
print(forecast_result.summary_frame(alpha=0.05)[["mean", "mean_ci_lower", "mean_ci_upper"]].round(2))
```

**Key Takeaway**: After fitting ARIMA, always check residual ACF/PACF plots and the Ljung-Box test — any significant autocorrelation remaining in residuals means the model order (p, q) needs increasing to capture more structure.

**Why It Matters**: A model with autocorrelated residuals has not extracted all predictable signal from the data, leaving forecasting accuracy on the table. The Q-Q plot reveals whether residuals are normally distributed — non-normality suggests outliers or heteroskedasticity that may require transformation. These diagnostics are the quality gate before deploying a forecasting model to production.

---

## Example 67: Seasonal Decomposition — Trend, Seasonality, Residual

Seasonal decomposition separates a time series into additive or multiplicative components, revealing whether seasonal patterns exist and how they compare to the trend.

**Code**:

```python
import pandas as pd              # => pandas 3.0.2
import numpy as np               # => numpy 2.4.4
import statsmodels.api as sm     # => statsmodels 0.14.x
import matplotlib.pyplot as plt  # => matplotlib 3.10.x

rng = np.random.default_rng(seed=42)

# Create seasonal time series: annual cycle + upward trend
dates = pd.date_range("2022-01-01", periods=60, freq="ME")  # => 5 years monthly
trend = np.linspace(100, 180, 60)                            # => linear trend
seasonal = 20 * np.sin(2 * np.pi * np.arange(60) / 12)     # => annual cycle (period=12)
noise = rng.normal(0, 5, 60)                                  # => random component

ts = pd.Series(trend + seasonal + noise, index=dates, name="sales")

# === Additive decomposition: y_t = Trend + Seasonal + Residual ===
decomp = sm.tsa.seasonal_decompose(
    ts,
    model="additive",  # => use "additive" when seasonal variation is constant
    # => use "multiplicative" when seasonal variation grows with trend level
    period=12,         # => annual period (12 months) — required for monthly data
)

# === Access decomposed components ===
trend_component = decomp.trend         # => smoothed trend (NaN at start/end)
seasonal_component = decomp.seasonal  # => repeating seasonal pattern
residual_component = decomp.resid     # => what's left after removing trend + seasonal

print(f"Trend range: [{trend_component.dropna().min():.1f}, {trend_component.dropna().max():.1f}]")
print(f"Seasonal amplitude: {seasonal_component.max():.1f}")
print(f"Residual std: {residual_component.dropna().std():.1f}")  # => should be small

# === Visualize decomposition ===
fig, axes = plt.subplots(4, 1, figsize=(12, 10))
ts.plot(ax=axes[0], color="#0173B2")
axes[0].set_title("Original Series")

trend_component.plot(ax=axes[1], color="#DE8F05")
axes[1].set_title("Trend")

seasonal_component.plot(ax=axes[2], color="#029E73")
axes[2].set_title("Seasonal (Period=12 months)")

residual_component.plot(ax=axes[3], color="#CC78BC")
axes[3].set_title("Residual")

plt.tight_layout()
plt.show()

# === Strength of seasonality metric ===
var_seasonal = seasonal_component.var()
var_residual = residual_component.dropna().var()
seasonality_strength = 1 - var_residual / (var_seasonal + var_residual)
print(f"\nSeasonality strength: {seasonality_strength:.2f}")
# => > 0.6: strong seasonality worth modeling; < 0.3: weak, may be ignorable
```

**Key Takeaway**: Use `model="additive"` when seasonal swings are roughly constant in magnitude regardless of the trend level, and `model="multiplicative"` when seasonal swings scale proportionally with the trend (common for revenue that doubles and where seasonal variation doubles too).

**Why It Matters**: Understanding decomposed components prevents modeling mistakes. If you fit ARIMA without removing or modeling seasonality (ARIMA without the S in SARIMA), residuals will be autocorrelated and forecasts inaccurate. Seasonal decomposition reveals whether the business has a meaningful annual pattern (worth modeling explicitly) or just noisy fluctuations (not worth seasonal adjustment). The seasonality strength metric provides a quick decision rule.

---

## Example 68: yfinance 0.2.x — Fetching Financial Data

yfinance provides free access to Yahoo Finance price history and fundamental data. It is the standard tool for financial analytics prototyping.

**Code**:

```python
import yfinance as yf    # => yfinance 0.2.x — Yahoo Finance API wrapper
import pandas as pd      # => pandas 3.0.2
import numpy as np       # => numpy 2.4.4
import matplotlib.pyplot as plt  # => matplotlib 3.10.x

# === Download historical OHLCV data ===
ticker = yf.Ticker("AAPL")   # => creates Ticker object for Apple Inc.

# Download price history
hist = yf.download(
    "AAPL",
    start="2024-01-01",
    end="2026-01-01",      # => up to 2 years of daily data
    auto_adjust=True,      # => automatically adjust for splits and dividends
    progress=False,        # => suppress download progress bar
)
print(hist.shape)          # => (~504, 5) — 504 trading days × 5 OHLCV columns
print(hist.columns.tolist())  # => ['Open', 'High', 'Low', 'Close', 'Volume']
print(hist.index.dtype)    # => datetime64[ns] — DatetimeIndex

# === Access closing price ===
close = hist["Close"]          # => Series of daily closing prices
print(f"Price range: {close.min():.2f} to {close.max():.2f}")

# === Access company info ===
info = ticker.info
print(f"Company: {info.get('longName', 'N/A')}")
print(f"Sector: {info.get('sector', 'N/A')}")
print(f"Market Cap: {info.get('marketCap', 0) / 1e9:.0f}B")

# === Multiple tickers at once ===
portfolio_data = yf.download(
    ["AAPL", "MSFT", "GOOGL"],    # => list of tickers
    start="2025-01-01",
    end="2026-01-01",
    progress=False,
)
# => MultiIndex DataFrame: (date, OHLCV_column) × ticker
close_prices = portfolio_data["Close"]   # => DataFrame: columns = tickers
print(close_prices.head())               # => AAPL, MSFT, GOOGL columns

# === Financial statements ===
financials = ticker.financials       # => annual income statement as DataFrame
quarterly = ticker.quarterly_financials  # => quarterly financials
balance = ticker.balance_sheet       # => balance sheet
```

**Key Takeaway**: Use `yf.download(tickers, start=..., end=..., auto_adjust=True)` for clean adjusted price history — `auto_adjust=True` applies split and dividend adjustments so that return calculations are accurate.

**Why It Matters**: Financial analytics requires clean, adjusted historical price data. Without split adjustment, Apple's price history shows an apparent 75% drop on split dates — price return calculations become completely wrong. `yfinance` wraps Yahoo Finance's free API and handles common pitfalls (adjustments, timezone normalization, MultiIndex for multiple tickers). It is the standard tool for backtesting, risk analysis, and portfolio analytics.

---

## Example 69: Financial Analysis — Returns, Rolling Volatility, Sharpe Ratio

Daily returns, rolling volatility, and Sharpe ratio are the three fundamental risk-adjusted performance metrics for any financial asset.

**Code**:

```python
import pandas as pd       # => pandas 3.0.2
import numpy as np        # => numpy 2.4.4
import matplotlib.pyplot as plt  # => matplotlib 3.10.x

# Simulate 2 years of daily stock price data
rng = np.random.default_rng(seed=42)
dates = pd.date_range("2024-01-01", "2025-12-31", freq="B")  # => business days only
n = len(dates)

# Geometric Brownian Motion for price simulation
drift = 0.0003          # => ~7.5% annual drift
volatility = 0.018      # => ~28% annual volatility
daily_returns_sim = rng.normal(drift, volatility, n)
price = 100 * np.exp(np.cumsum(daily_returns_sim))  # => price path from $100

df = pd.DataFrame({"price": price}, index=dates)

# === Daily log returns (preferred over simple returns for aggregation) ===
df["log_return"] = np.log(df["price"] / df["price"].shift(1))
# => log_return_t = ln(P_t / P_{t-1}) = ln(P_t) - ln(P_{t-1})
# => first row is NaN since shift(1) references prior day

# === Simple returns (percentage change) ===
df["pct_return"] = df["price"].pct_change()
# => pct_change() = (P_t - P_{t-1}) / P_{t-1} — equivalent to simple return

# === Cumulative return ===
df["cumulative_return"] = (1 + df["pct_return"]).cumprod() - 1
# => cumulative return from start: how much has total investment grown

total_return = df["cumulative_return"].iloc[-1]
print(f"Total return over period: {total_return:.1%}")  # => e.g., 15.3%

# === Rolling 30-day annualized volatility ===
TRADING_DAYS = 252                    # => standard: 252 business days per year
df["vol_30d"] = (
    df["log_return"].rolling(30).std()   # => 30-day rolling std of daily log returns
    * np.sqrt(TRADING_DAYS)              # => annualize: multiply by sqrt(252)
)
print(f"Average 30d annualized vol: {df['vol_30d'].mean():.1%}")  # => ~28% matching simulation

# === Sharpe Ratio — risk-adjusted return ===
risk_free_daily = 0.05 / TRADING_DAYS   # => 5% annual risk-free rate → daily
excess_returns = df["log_return"] - risk_free_daily
annual_excess_return = excess_returns.mean() * TRADING_DAYS
annual_vol = df["log_return"].std() * np.sqrt(TRADING_DAYS)
sharpe = annual_excess_return / annual_vol
# => Sharpe > 1.0: good, > 2.0: excellent, < 0: worse than risk-free
print(f"Annualized Sharpe Ratio: {sharpe:.2f}")

# === Max Drawdown ===
rolling_max = df["price"].cummax()    # => running maximum price
drawdown = (df["price"] - rolling_max) / rolling_max  # => % decline from peak
max_dd = drawdown.min()               # => worst drawdown (most negative)
print(f"Maximum Drawdown: {max_dd:.1%}")   # => e.g., -18.5%
```

**Key Takeaway**: Use log returns (not simple returns) for time aggregation — log returns add correctly over time (`total = sum(daily log returns)`), while simple returns must be compounded multiplicatively, making sum-based aggregation wrong.

**Why It Matters**: Sharpe ratio is the most-used single metric for comparing investment strategies — it normalizes returns by volatility, making a 10% return with 5% volatility (Sharpe ~2) comparable to a 20% return with 20% volatility (Sharpe ~1). Maximum drawdown is the primary risk metric for strategy robustness. Together these metrics form the backbone of quantitative finance reporting and portfolio optimization.

---

## Example 70: Working with Large Datasets — Chunked Reading and Dask Basics

When data exceeds available RAM, chunked pandas reading and dask enable processing without loading everything at once.

**Code**:

```python
import pandas as pd      # => pandas 3.0.2
import numpy as np       # => numpy 2.4.4
import os

# Create a sample large-ish CSV for demonstration
rng = np.random.default_rng(seed=42)
n_rows = 1_000_000

pd.DataFrame({
    "id": range(n_rows),
    "category": rng.choice(["A", "B", "C", "D"], n_rows),
    "value": rng.normal(100, 20, n_rows),
}).to_csv("large_data.csv", index=False)

# === Method 1: pd.read_csv with chunksize ===
# Reads file in N-row chunks, processes each chunk independently
chunk_results = []
for chunk in pd.read_csv("large_data.csv", chunksize=100_000):
    # => chunk is a DataFrame with 100k rows
    # Compute per-chunk aggregation
    agg = chunk.groupby("category")["value"].agg(["sum", "count"])
    chunk_results.append(agg)
    # => ~10 iterations for 1M rows with chunksize=100k

# Combine chunk results
combined = pd.concat(chunk_results).groupby("category").sum()
combined["mean"] = combined["sum"] / combined["count"]
print("Chunked result:")
print(combined.round(2))

# === Method 2: DuckDB — no chunk management needed ===
import duckdb
result_duckdb = duckdb.sql("""
    SELECT category, SUM(value) as total, COUNT(*) as cnt, AVG(value) as mean
    FROM read_csv_auto('large_data.csv')
    GROUP BY category
    ORDER BY category
""").df()
print("\nDuckDB result:")
print(result_duckdb.round(2))

# === Method 3: Dask — pandas-like API for distributed computing ===
try:
    import dask.dataframe as dd         # => dask optional — install with pip install dask
    ddf = dd.read_csv("large_data.csv") # => creates lazy Dask DataFrame (not loaded yet)
    print(f"\nDask DataFrame partitions: {ddf.npartitions}")  # => auto-partitioned
    # Dask API mirrors pandas for common operations
    dask_result = ddf.groupby("category")["value"].mean().compute()
    # => .compute() triggers actual execution (like polars .collect())
    print("Dask result:")
    print(dask_result.round(2))
except ImportError:
    print("\ndask not installed — skip dask example")

os.remove("large_data.csv")
```

**Key Takeaway**: For datasets that fit in memory use pandas directly; for 10-100x memory-exceeding data use DuckDB (simplest) or dask (pandas-compatible distributed computing) — chunked reading is the manual fallback when neither is available.

**Why It Matters**: Modern analytics often encounters datasets of tens or hundreds of gigabytes — larger than laptop RAM. The chunked reading pattern is universally applicable but requires careful aggregation logic (running sums/counts, not means directly). DuckDB is simpler and faster for SQL-shaped aggregations. Dask provides a full pandas-compatible API for complex transformations. Knowing all three approaches enables choosing the right tool for the data volume.

---

## Example 71: PyArrow 20.0.0 — Reading Parquet and Schema Inspection

PyArrow provides direct access to Apache Arrow format and Parquet files with rich schema inspection capabilities.

**Code**:

```python
import pyarrow as pa              # => pyarrow 20.0.0
import pyarrow.parquet as pq      # => parquet reading/writing module
import pandas as pd               # => pandas 3.0.2
import numpy as np                # => numpy 2.4.4

# Create sample Parquet file
rng = np.random.default_rng(seed=42)
df = pd.DataFrame({
    "id": range(10000),
    "name": [f"user_{i}" for i in range(10000)],
    "score": rng.normal(75, 15, 10000),
    "category": pd.Categorical(rng.choice(["A", "B", "C"], 10000)),
    "timestamp": pd.date_range("2025-01-01", periods=10000, freq="h"),
})
df.to_parquet("sample.parquet")

# === Read Parquet with pyarrow directly ===
table = pq.read_table("sample.parquet")
# => returns pyarrow.Table (not pandas DataFrame)
print(type(table))      # => <class 'pyarrow.lib.Table'>
print(table.num_rows)   # => 10000
print(table.num_columns)  # => 5

# === Schema inspection ===
schema = table.schema
print(f"\nSchema:\n{schema}")
# => id: int64
# => name: string
# => score: double
# => category: dictionary<values=string, indices=int8, ordered=False>
# => timestamp: timestamp[us, tz=None]

for field in schema:
    print(f"  {field.name}: {field.type}")

# === Convert to pandas ===
df_back = table.to_pandas()
print(f"\nBack to pandas: {df_back.shape}")   # => (10000, 5)

# === Read with column selection — pyarrow level ===
table_subset = pq.read_table("sample.parquet", columns=["id", "score", "category"])
print(f"Subset shape: {table_subset.to_pandas().shape}")  # => (10000, 3)

# === Read with row filter ===
table_filtered = pq.read_table(
    "sample.parquet",
    filters=[("score", ">", 80.0)],   # => pyarrow predicate pushdown
)
print(f"Filtered rows: {len(table_filtered)}")   # => ~3300 (top ~33%)

# === Create Arrow array directly ===
arr = pa.array([1, 2, 3, 4, 5], type=pa.int64())  # => typed Arrow array
print(arr.type)    # => int64

import os
os.remove("sample.parquet")
```

**Key Takeaway**: Use `pq.read_table()` with `columns=` and `filters=` for efficient partial reads — PyArrow applies column selection and row filters before deserializing, which can reduce I/O by 90% on large files.

**Why It Matters**: PyArrow is the engine beneath pandas, polars, and DuckDB. Understanding it directly enables interoperability between all three — a PyArrow Table converts to pandas (`.to_pandas()`), polars (`pl.from_arrow()`), or DuckDB (`duckdb.arrow()`) without copying data. Schema inspection reveals actual stored types (important when comparing data across systems) and is the correct way to document file formats in data contracts.

---

## Example 72: Arrow-backed DataFrames — 2-5x Memory Reduction

Reading CSVs with `dtype_backend="pyarrow"` uses Arrow's memory layout instead of numpy arrays, providing 2-5x memory reduction and better string handling.

**Code**:

```python
import pandas as pd      # => pandas 3.0.2
import numpy as np       # => numpy 2.4.4
import sys

# Create test CSV
rng = np.random.default_rng(seed=42)
n = 100_000
pd.DataFrame({
    "id": range(n),
    "name": [f"user_{i}" for i in range(n)],
    "category": rng.choice(["Apple", "Banana", "Cherry", "Date"], n),
    "score": rng.normal(75, 15, n),
    "count": rng.integers(0, 1000, n),
}).to_csv("test_arrow.csv", index=False)

# === numpy backend (default pandas behavior) ===
df_numpy = pd.read_csv("test_arrow.csv")
mem_numpy = df_numpy.memory_usage(deep=True).sum()
print(f"numpy backend: {mem_numpy / 1e6:.1f} MB")
print(f"  name dtype: {df_numpy['name'].dtype}")     # => object (Python strings)
print(f"  category dtype: {df_numpy['category'].dtype}")  # => object
print(f"  score dtype: {df_numpy['score'].dtype}")    # => float64

# === pyarrow backend — Arrow memory layout ===
df_arrow = pd.read_csv("test_arrow.csv", dtype_backend="pyarrow")
mem_arrow = df_arrow.memory_usage(deep=True).sum()
print(f"\npyarrow backend: {mem_arrow / 1e6:.1f} MB")
print(f"  Reduction: {(1 - mem_arrow / mem_numpy):.0%}")  # => typically 40-70% smaller
print(f"  name dtype: {df_arrow['name'].dtype}")     # => string[pyarrow]
print(f"  category dtype: {df_arrow['category'].dtype}")  # => string[pyarrow]
print(f"  score dtype: {df_arrow['score'].dtype}")    # => double[pyarrow]

# === Arrow backend benefits ===
# 1. Strings stored as Arrow dict-encoded — huge saving for repeated categories
# 2. Nullable integers/floats use pd.NA not np.nan (no float coercion)
# 3. Operations on Arrow-backed columns use Arrow compute functions
# 4. Zero-copy interoperability with polars and DuckDB

# === Arithmetic still works normally ===
df_arrow["score_z"] = (df_arrow["score"] - df_arrow["score"].mean()) / df_arrow["score"].std()
print(df_arrow["score_z"].head(3))

# === Converting between backends ===
df_back_numpy = df_arrow.convert_dtypes(dtype_backend="numpy_nullable")
print(f"Converted back: {df_back_numpy['name'].dtype}")  # => string

import os
os.remove("test_arrow.csv")
```

**Key Takeaway**: Use `dtype_backend="pyarrow"` in `pd.read_csv()` for datasets where string or categorical columns dominate — the Arrow dictionary encoding for repeated string values achieves 5-20x compression versus Python object arrays.

**Why It Matters**: Memory is the primary bottleneck for large-scale pandas work. Arrow's dictionary encoding stores "Engineering", "Marketing", "Finance" in a lookup table and uses 1-byte indices per row — versus Python's object dtype that stores a full Python string object per row. For a 10M-row DataFrame with 5 unique categories, this can reduce one column from 800MB to under 50MB. Less memory means faster operations and the ability to handle larger datasets.

---

## Example 73: Data Validation with pandera

pandera provides DataFrame schema validation — define expected dtypes, value ranges, and custom checks, then validate DataFrames before processing.

**Code**:

```python
import pandas as pd      # => pandas 3.0.2
import numpy as np       # => numpy 2.4.4
import pandera as pa     # => pandera — install with pip install pandera

# === Define schema — what the DataFrame should look like ===
schema = pa.DataFrameSchema({
    "employee_id": pa.Column(int, pa.Check.ge(1000)),        # => integer, >= 1000
    "name": pa.Column(str, pa.Check.str_length(min_value=2)),  # => string, min 2 chars
    "age": pa.Column(
        float,                            # => float (allows NaN)
        [
            pa.Check.ge(18),              # => age >= 18
            pa.Check.le(75),              # => age <= 75
        ],
        nullable=True,                    # => allow NaN values
    ),
    "salary": pa.Column(
        float,
        pa.Check.ge(0),                   # => salary non-negative
        nullable=False,                   # => NOT nullable — required
    ),
    "department": pa.Column(
        str,
        pa.Check.isin(["Engineering", "Marketing", "Finance", "HR"]),  # => allowed values
    ),
},
    strict=True,   # => disallow extra columns not in schema
)

# === Valid DataFrame — passes validation ===
valid_df = pd.DataFrame({
    "employee_id": [1001, 1002, 1003],
    "name": ["Alice", "Bob", "Charlie"],
    "age": [25.0, np.nan, 41.0],   # => NaN allowed (nullable=True)
    "salary": [55000.0, 72000.0, 85000.0],
    "department": ["Engineering", "Marketing", "Finance"],
})

validated = schema.validate(valid_df)
print("Validation passed!")
print(validated.shape)    # => (3, 5) — unchanged DataFrame

# === Invalid DataFrame — fails with descriptive error ===
invalid_df = pd.DataFrame({
    "employee_id": [1001, 999, 1003],     # => 999 fails ge(1000)
    "name": ["Alice", "B", "Charlie"],    # => "B" fails str_length(min=2)
    "age": [25.0, -5.0, 41.0],            # => -5 fails ge(18)
    "salary": [55000.0, 72000.0, 85000.0],
    "department": ["Engineering", "Sales", "Finance"],  # => "Sales" not in isin()
})

try:
    schema.validate(invalid_df, lazy=True)  # => lazy=True: collect ALL errors, not just first
except pa.errors.SchemaErrors as e:
    print(f"\nValidation errors ({len(e.failure_cases)} cases):")
    print(e.failure_cases[["schema_context", "column", "failure_case"]].to_string())
    # => shows: employee_id fail (999), name fail ("B"), age fail (-5), department fail ("Sales")
```

**Key Takeaway**: Use `schema.validate(df, lazy=True)` in production pipelines — `lazy=True` collects all validation failures at once instead of raising on the first one, making batch error reporting practical.

**Why It Matters**: Production data pipelines receive input from external sources (APIs, uploads, partner feeds) where data quality cannot be guaranteed. Without validation, a negative salary value or an unexpected department string silently produces wrong analytical results. pandera schema validation catches these issues at ingestion time with descriptive error messages that identify the exact rows and values that failed, enabling automated data quality monitoring.

---

## Example 74: Advanced Aggregations — Named Agg and Custom Functions

Named aggregations and custom aggregation functions enable complex summary statistics beyond the standard `mean/sum/count`.

**Code**:

```python
import pandas as pd      # => pandas 3.0.2
import numpy as np       # => numpy 2.4.4
from scipy import stats  # => scipy 1.15.x

rng = np.random.default_rng(seed=42)
df = pd.DataFrame({
    "department": rng.choice(["Eng", "Mkt", "Fin", "HR"], 200),
    "salary": rng.lognormal(10.8, 0.4, 200),
    "years": rng.integers(0, 25, 200),
    "rating": rng.choice([1, 2, 3, 4, 5], 200, p=[0.05, 0.15, 0.30, 0.35, 0.15]),
})

# === Named aggregation syntax — produces readable column names ===
result = df.groupby("department").agg(
    headcount=("salary", "count"),          # => named: headcount
    avg_salary=("salary", "mean"),          # => named: avg_salary
    median_salary=("salary", "median"),     # => named: median_salary
    salary_spread=("salary", "std"),        # => named: salary_spread
    max_tenure=("years", "max"),
    avg_rating=("rating", "mean"),
)
print(result.round(0))
# =>             headcount  avg_salary  median_salary  salary_spread  max_tenure  avg_rating

# === Per-column multi-aggregation ===
multi_agg = df.groupby("department").agg({
    "salary": ["mean", "median", "std", "min", "max"],
    "years": ["mean", "max"],
    "rating": ["mean", "count"],
})
# => MultiIndex columns: (salary, mean), (salary, std), ...
multi_agg.columns = ["_".join(col) for col in multi_agg.columns]  # => flatten to single level
print(multi_agg.head(2).round(1))

# === Custom aggregation functions ===
def coefficient_of_variation(x):
    # => CV = std/mean — normalized measure of dispersion
    return x.std() / x.mean()

def top_quartile_mean(x):
    # => mean of top 25% — excludes low performers
    return x[x >= x.quantile(0.75)].mean()

result_custom = df.groupby("department").agg(
    cv_salary=("salary", coefficient_of_variation),
    top_q_salary=("salary", top_quartile_mean),
    pct_senior=("years", lambda x: (x >= 10).mean()),   # => % with 10+ years
)
print(result_custom.round(3))

# === Aggregation with transform — returns same-length result ===
df["dept_avg_salary"] = df.groupby("department")["salary"].transform("mean")
# => every row gets the AVERAGE salary of ITS department
# => useful for computing "salary_vs_dept_avg" features
df["salary_vs_dept"] = df["salary"] / df["dept_avg_salary"]
print(df.head(3)[["department", "salary", "dept_avg_salary", "salary_vs_dept"]].round(0))
```

**Key Takeaway**: Use named aggregation syntax `agg(col_name=("source_col", func))` for all multi-column aggregations — it eliminates the `.rename()` step and produces self-documenting DataFrames.

**Why It Matters**: Business summary reports require beyond-standard aggregations — coefficient of variation for compensation equity analysis, top-quartile means for performance benchmarking, percentage-above-threshold for KPI tracking. Named aggregations make these one-liner without sacrificing readability. The `transform()` method adds group-level statistics as new columns while preserving row count — the foundation of z-score normalization within groups and cohort comparisons.

---

## Example 75: String Matching and Fuzzy Join

Real data has inconsistent strings — "New York", "new york", "NEW YORK", "N.Y.". Fuzzy matching finds approximate string matches for joining messy datasets.

**Code**:

```python
import pandas as pd      # => pandas 3.0.2
import numpy as np       # => numpy 2.4.4

# Two datasets with inconsistent company names
internal_db = pd.DataFrame({
    "company_id": [1, 2, 3, 4],
    "company_name": ["Apple Inc", "Microsoft Corp", "Alphabet Inc", "Meta Platforms"],
    "revenue": [400, 220, 300, 120],
})

partner_data = pd.DataFrame({
    "company": ["apple inc.", "Microsoft Corporation", "alphabet", "Meta"],
    "score": [92, 78, 85, 71],
})

# === Step 1: Normalize strings before any matching ===
def normalize_name(s):
    # => lowercase, strip whitespace, remove punctuation, remove common suffixes
    return (
        str(s).lower()
        .strip()
        .replace(".", "")
        .replace(",", "")
        .replace("inc", "")
        .replace("corp", "")
        .replace("corporation", "")
        .replace("platforms", "")
        .strip()
    )

internal_db["name_norm"] = internal_db["company_name"].apply(normalize_name)
partner_data["name_norm"] = partner_data["company"].apply(normalize_name)

print("Normalized internal:", internal_db["name_norm"].tolist())
# => ['apple', 'microsoft', 'alphabet', 'meta']
print("Normalized partner:", partner_data["name_norm"].tolist())
# => ['apple', 'microsoft', 'alphabet', 'meta']

# === Exact join on normalized names ===
exact_join = pd.merge(
    internal_db, partner_data,
    left_on="name_norm", right_on="name_norm",
    how="left",
)
print(f"\nExact matches: {exact_join['score'].notna().sum()}")  # => 4 all matched

# === Fuzzy matching with rapidfuzz (install: pip install rapidfuzz) ===
try:
    from rapidfuzz import fuzz, process    # => rapidfuzz: fast fuzzy string matching

    # Match each partner company to best internal match
    def find_best_match(query, choices, threshold=70):
        # => returns (match, score, index) or None if below threshold
        result = process.extractOne(query, choices, scorer=fuzz.WRatio)
        if result and result[1] >= threshold:
            return result[0], result[1]
        return None, None

    partner_data["matched_name"] = None
    partner_data["match_score"] = None
    for idx, row in partner_data.iterrows():
        match, score = find_best_match(row["company"], internal_db["company_name"].tolist())
        partner_data.loc[idx, "matched_name"] = match
        partner_data.loc[idx, "match_score"] = score

    print("\nFuzzy matches:")
    print(partner_data[["company", "matched_name", "match_score"]])
except ImportError:
    print("\nrapidfuzz not installed — only exact matching demonstrated")
```

**Key Takeaway**: Always normalize strings (lowercase, strip, remove suffixes) before fuzzy matching — normalization resolves 70-80% of mismatches for free, leaving only genuine ambiguities for fuzzy algorithms.

**Why It Matters**: Entity resolution (matching records that refer to the same real-world entity) is one of the most time-consuming data tasks. Manual matching doesn't scale. Systematic normalization + fuzzy matching automates the process and produces reproducible results. Fuzzy matching with a score threshold (70+ out of 100) provides a quality gate — matches below threshold go to manual review rather than producing wrong joins.

---

## Example 76: Geospatial Basics with geopandas

geopandas extends pandas with geometry types for geographic data analysis — reading shapefiles, plotting maps, and spatial joins.

**Code**:

```python
# Install: pip install geopandas
try:
    import geopandas as gpd    # => geopandas — geographic DataFrame library
    import pandas as pd        # => pandas 3.0.2
    import matplotlib.pyplot as plt  # => matplotlib 3.10.x
    from shapely.geometry import Point   # => shapely geometry types

    # === Create GeoDataFrame from latitude/longitude ===
    cities = pd.DataFrame({
        "city": ["Jakarta", "Surabaya", "Bandung", "Medan", "Makassar"],
        "lat": [-6.2088, -7.2458, -6.9175, 3.5952, -5.1477],
        "lon": [106.8456, 112.7378, 107.6191, 98.6722, 119.4327],
        "population_M": [10.6, 3.0, 2.8, 2.5, 1.5],
    })

    # Convert to GeoDataFrame with Point geometries
    geometry = [Point(xy) for xy in zip(cities["lon"], cities["lat"])]
    gdf = gpd.GeoDataFrame(cities, geometry=geometry, crs="EPSG:4326")
    # => crs="EPSG:4326" specifies WGS84 lat/lon coordinate system
    print(gdf.dtypes)        # => geometry column added with Point type
    print(gdf.crs)           # => EPSG:4326

    # === Distance calculation (in degrees — project to meter CRS for real distances) ===
    jakarta = gdf[gdf["city"] == "Jakarta"]["geometry"].iloc[0]
    gdf["distance_from_jakarta_deg"] = gdf["geometry"].distance(jakarta)
    print(gdf[["city", "distance_from_jakarta_deg"]].sort_values("distance_from_jakarta_deg"))

    # === Plot map ===
    fig, ax = plt.subplots(figsize=(10, 8))
    # Plot scatter with population-scaled marker size
    gdf.plot(
        ax=ax,
        column="population_M",     # => color by population
        cmap="Blues",               # => blue sequential colormap
        markersize=gdf["population_M"] * 50,
        legend=True,
        legend_kwds={"label": "Population (M)"},
    )
    # Add city labels
    for _, row in gdf.iterrows():
        ax.annotate(row["city"], xy=(row["lon"], row["lat"]),
                    xytext=(3, 3), textcoords="offset points", fontsize=9)
    ax.set_title("Major Indonesian Cities by Population")
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    plt.tight_layout()
    # plt.show()
    print("Geospatial plot created")

except ImportError:
    print("geopandas not installed — run: pip install geopandas shapely")
    print("This example requires geopandas for geographic operations")
```

**Key Takeaway**: Always specify `crs="EPSG:4326"` when creating a GeoDataFrame from lat/lon coordinates — the CRS (coordinate reference system) is required for any spatial operation including distance calculation and map projection.

**Why It Matters**: Geospatial analysis is essential for logistics optimization, market territory analysis, real estate analytics, and epidemiology. geopandas brings the full pandas API to spatial data — groupby, merge, and plot all work on GeoDataFrames. The CRS specification prevents the most common geospatial bug: computing distances in degrees (where 1 degree ≠ 1 degree across latitudes) instead of meters.

---

## Example 77: NetworkX — Graph Analytics

NetworkX enables graph analysis for social networks, dependency graphs, recommendation systems, and any domain where relationships between entities matter.

**Code**:

```python
import networkx as nx      # => networkx — install with pip install networkx
import pandas as pd        # => pandas 3.0.2
import matplotlib.pyplot as plt  # => matplotlib 3.10.x

# === Build an organization hierarchy graph ===
edges = [
    ("CEO", "CTO"), ("CEO", "CFO"), ("CEO", "CMO"),
    ("CTO", "VP Engineering"), ("CTO", "VP Data"),
    ("VP Engineering", "Alice"), ("VP Engineering", "Bob"),
    ("VP Data", "Charlie"), ("VP Data", "Diana"),
    ("CFO", "Controller"), ("CMO", "Marketing Lead"),
]

G = nx.DiGraph()               # => directed graph (hierarchy has direction)
G.add_edges_from(edges)        # => add all edges at once
# => nodes are added implicitly when edges are added

print(f"Nodes: {G.number_of_nodes()}")   # => 12
print(f"Edges: {G.number_of_edges()}")   # => 11

# === Basic graph properties ===
print(f"CEO successors: {list(G.successors('CEO'))}")   # => CTO, CFO, CMO
print(f"Alice predecessors: {list(G.predecessors('Alice'))}")  # => VP Engineering

# === Degree centrality — which nodes have most connections ===
in_degree = dict(G.in_degree())    # => number of incoming edges per node
out_degree = dict(G.out_degree())  # => number of outgoing edges per node
print("\nTop managers (most direct reports):")
top_managers = sorted(out_degree.items(), key=lambda x: x[1], reverse=True)[:3]
for node, deg in top_managers:
    print(f"  {node}: {deg} direct reports")

# === Betweenness centrality — who are the bridges ===
betweenness = nx.betweenness_centrality(G)   # => centrality 0.0 to 1.0
print("\nHighest betweenness (information brokers):")
top_between = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:3]
for node, score in top_between:
    print(f"  {node}: {score:.3f}")

# === Shortest path ===
path = nx.shortest_path(G, "CEO", "Alice")
# => ['CEO', 'CTO', 'VP Engineering', 'Alice'] — 3 hops
print(f"\nCEO to Alice: {' → '.join(path)}")

# === Visualize ===
fig, ax = plt.subplots(figsize=(12, 8))
pos = nx.spring_layout(G, seed=42)
nx.draw_networkx(
    G, pos, ax=ax,
    node_color="#0173B2", node_size=1500,
    font_color="white", font_size=8,
    edge_color="#CA9161", arrows=True, arrowsize=15,
)
ax.set_title("Organization Hierarchy Graph")
plt.tight_layout()
```

**Key Takeaway**: Use `betweenness_centrality()` to find the most critical nodes in a network — high-betweenness nodes are bottlenecks whose removal would most disrupt information flow or connectivity.

**Why It Matters**: Graph analytics is applicable far beyond social networks — supply chain dependency graphs, code import graphs for software architecture, fraud detection (connected components of suspicious accounts), and recommendation systems (collaborative filtering via bipartite graphs). NetworkX provides 50+ centrality measures and graph algorithms that would require hundreds of lines of custom code otherwise.

---

## Example 78: A/B Testing Analysis — t-test, Effect Size, Sample Size

A/B tests require three analyses: hypothesis test (is there an effect?), effect size (how large is it?), and power/sample size calculation (did we collect enough data?).

**Code**:

```python
import numpy as np           # => numpy 2.4.4
from scipy import stats      # => scipy 1.15.x
import pandas as pd          # => pandas 3.0.2

rng = np.random.default_rng(seed=42)

# A/B test: new checkout flow vs control
# Metric: revenue per user
control_revenue = rng.lognormal(3.5, 0.8, 500)   # => control group, n=500
treatment_revenue = rng.lognormal(3.65, 0.8, 480) # => treatment, n=480 (slightly higher mean)

# === Descriptive statistics ===
print("Control:   mean={:.2f}, std={:.2f}, n={:d}".format(
    control_revenue.mean(), control_revenue.std(), len(control_revenue)))
print("Treatment: mean={:.2f}, std={:.2f}, n={:d}".format(
    treatment_revenue.mean(), treatment_revenue.std(), len(treatment_revenue)))

# === Two-sample t-test ===
t_stat, p_value = stats.ttest_ind(
    control_revenue, treatment_revenue,
    equal_var=False,      # => Welch's t-test (safer — doesn't assume equal variance)
    alternative="two-sided",
)
print(f"\nt-statistic: {t_stat:.3f}")
print(f"p-value: {p_value:.4f}")

alpha = 0.05
if p_value < alpha:
    lift = (treatment_revenue.mean() - control_revenue.mean()) / control_revenue.mean()
    print(f"SIGNIFICANT: Treatment shows {lift:.1%} lift in revenue per user")
else:
    print("NOT significant: Cannot conclude treatment improves revenue")

# === Effect size — Cohen's d ===
pooled_std = np.sqrt(
    (control_revenue.std()**2 + treatment_revenue.std()**2) / 2
)
cohens_d = (treatment_revenue.mean() - control_revenue.mean()) / pooled_std
# => d ≈ 0.2: small, 0.5: medium, 0.8: large
print(f"Cohen's d: {cohens_d:.2f} ({'small' if abs(cohens_d) < 0.5 else 'medium' if abs(cohens_d) < 0.8 else 'large'} effect)")

# === Sample size calculation for future tests ===
# Given: desired effect size, alpha, power — how many users needed?
from scipy.stats import norm
alpha_planned = 0.05      # => significance level
power_planned = 0.80      # => 80% power = 80% chance to detect a real effect
effect_size_target = 0.3  # => minimum detectable Cohen's d

z_alpha = norm.ppf(1 - alpha_planned / 2)  # => z for two-tailed alpha
z_beta = norm.ppf(power_planned)            # => z for desired power
n_per_group = int(np.ceil(2 * ((z_alpha + z_beta) / effect_size_target) ** 2))
print(f"\nRequired sample size: {n_per_group} per group for d={effect_size_target}, power={power_planned:.0%}")

# === 95% Confidence interval for the mean difference ===
diff_mean = treatment_revenue.mean() - control_revenue.mean()
se_diff = np.sqrt(control_revenue.var() / len(control_revenue) + treatment_revenue.var() / len(treatment_revenue))
ci_low, ci_high = diff_mean - 1.96 * se_diff, diff_mean + 1.96 * se_diff
print(f"95% CI for revenue difference: [{ci_low:.2f}, {ci_high:.2f}]")
```

**Key Takeaway**: Always calculate sample size BEFORE running an A/B test — running until p < 0.05 and stopping is p-hacking that inflates false positive rates to 20-30% even with alpha=0.05.

**Why It Matters**: A/B testing is the primary method for measuring causal impact of product changes. Three analytical errors are common: (1) stopping the test early when p < 0.05 (inflates false positives), (2) ignoring effect size (a 0.01% conversion improvement isn't worth shipping), and (3) underpowering tests (80% power means 20% chance of missing a real effect). Knowing sample size calculation before launch is the difference between rigorous experimentation and statistical theater.

---

## Example 79: Survival Analysis Basics with lifelines

Survival analysis models time-to-event data (churn, equipment failure, customer conversion) where observations may be censored (event not yet occurred).

**Code**:

```python
# Install: pip install lifelines
try:
    from lifelines import KaplanMeierFitter, CoxPHFitter   # => lifelines survival analysis
    import pandas as pd        # => pandas 3.0.2
    import numpy as np         # => numpy 2.4.4
    import matplotlib.pyplot as plt

    rng = np.random.default_rng(seed=42)
    n = 300

    # Simulate customer subscription data
    df = pd.DataFrame({
        "duration": rng.exponential(scale=18, size=n).clip(1, 60),  # => months until churn, max 60
        "churned": rng.choice([0, 1], n, p=[0.35, 0.65]),  # => 1=churned, 0=still active (censored)
        "plan": rng.choice(["Basic", "Premium"], n),
        "age": rng.integers(22, 65, n),
    })
    df["duration"] = df["duration"].astype(int).clip(lower=1)

    # === Kaplan-Meier survival curve ===
    kmf = KaplanMeierFitter()
    kmf.fit(
        durations=df["duration"],  # => time until event or censoring
        event_observed=df["churned"],  # => 1=event occurred, 0=censored
    )

    # === Survival probability at specific timepoints ===
    print("Survival probabilities:")
    for months in [6, 12, 24, 36]:
        prob = kmf.predict(months)  # => probability of surviving past this timepoint
        print(f"  {months} months: {prob:.1%}")
    # => 6 months: ~55%, 12 months: ~35%, 24 months: ~18%

    print(f"\nMedian survival time: {kmf.median_survival_time_:.0f} months")
    # => 50% of customers churn by this month

    # === Compare survival curves by plan ===
    fig, ax = plt.subplots(figsize=(10, 6))
    for plan, color in [("Basic", "#DE8F05"), ("Premium", "#0173B2")]:
        mask = df["plan"] == plan
        kmf_plan = KaplanMeierFitter()
        kmf_plan.fit(
            df.loc[mask, "duration"],
            df.loc[mask, "churned"],
            label=f"{plan} Plan",
        )
        kmf_plan.plot_survival_function(ax=ax, color=color)
        print(f"{plan} median survival: {kmf_plan.median_survival_time_:.0f} months")

    ax.set_title("Survival Curves: Churn by Plan Type")
    ax.set_xlabel("Months")
    ax.set_ylabel("Probability of Remaining Active")
    plt.tight_layout()
    print("Survival analysis complete")

except ImportError:
    print("lifelines not installed — run: pip install lifelines")
```

**Key Takeaway**: Survival analysis handles censored observations correctly (customers still active at observation end) — traditional churn rate calculations discard these observations and underestimate true retention.

**Why It Matters**: Traditional "churn rate = churned / total" calculations treat still-active customers as if they will stay forever, biasing retention estimates. Kaplan-Meier correctly handles censoring — a customer active for 10 months contributes information that they survived those 10 months, even if we don't know what happens next. Comparing survival curves between plan types reveals which plans have better retention before the difference becomes obvious in simple churn metrics.

---

## Example 80: Reproducible Analytics Pipeline — Functions, Type Hints, Tests

Production analytics code requires the same engineering standards as application code — functions, type hints, and unit tests.

**Code**:

```python
import pandas as pd      # => pandas 3.0.2
import numpy as np       # => numpy 2.4.4
from typing import Optional
import pytest            # => for unit tests — install with pip install pytest

# === Well-structured analytics function ===
def compute_cohort_metrics(
    df: pd.DataFrame,
    cohort_col: str,
    value_col: str,
    min_cohort_size: int = 10,
) -> pd.DataFrame:
    """
    Compute summary metrics for each cohort in the DataFrame.

    Args:
        df: Input DataFrame with cohort and value columns
        cohort_col: Column name identifying the cohort (e.g., "quarter")
        value_col: Numeric column to aggregate per cohort
        min_cohort_size: Minimum observations to include a cohort (filter small cohorts)

    Returns:
        DataFrame with one row per cohort and columns:
        cohort, count, mean, median, std, p25, p75

    Raises:
        KeyError: If cohort_col or value_col not found in df
        ValueError: If min_cohort_size < 1
    """
    # => validate inputs early — fail fast principle
    if cohort_col not in df.columns:
        raise KeyError(f"Column '{cohort_col}' not found. Available: {df.columns.tolist()}")
    if value_col not in df.columns:
        raise KeyError(f"Column '{value_col}' not found. Available: {df.columns.tolist()}")
    if min_cohort_size < 1:
        raise ValueError(f"min_cohort_size must be >= 1, got {min_cohort_size}")

    # => compute per-cohort metrics
    result = (
        df.groupby(cohort_col)[value_col]
        .agg(
            count="count",
            mean="mean",
            median="median",
            std="std",
            p25=lambda x: x.quantile(0.25),
            p75=lambda x: x.quantile(0.75),
        )
        .reset_index()
    )

    # => filter cohorts below minimum size
    result = result[result["count"] >= min_cohort_size]
    return result.round(2)


# === Unit tests for the function ===
def test_compute_cohort_metrics_basic():
    """Basic happy path test"""
    df = pd.DataFrame({
        "quarter": ["Q1"] * 20 + ["Q2"] * 15,
        "revenue": list(range(20)) + list(range(15, 30)),
    })
    result = compute_cohort_metrics(df, "quarter", "revenue")
    assert set(result["quarter"]) == {"Q1", "Q2"}     # => both quarters present
    assert result.shape == (2, 8)                      # => 2 rows, 8 columns
    assert result.loc[result["quarter"] == "Q1", "count"].iloc[0] == 20

def test_compute_cohort_metrics_small_cohort_filter():
    """Small cohorts should be filtered out"""
    df = pd.DataFrame({
        "cohort": ["A"] * 20 + ["B"] * 5,  # => B has only 5 rows
        "value": range(25),
    })
    result = compute_cohort_metrics(df, "cohort", "value", min_cohort_size=10)
    assert "B" not in result["cohort"].values   # => B filtered out (only 5 rows)
    assert "A" in result["cohort"].values

def test_compute_cohort_metrics_missing_column():
    """Should raise KeyError for missing column"""
    df = pd.DataFrame({"a": [1, 2], "b": [3, 4]})
    try:
        compute_cohort_metrics(df, "missing", "b")
        assert False, "Should have raised KeyError"
    except KeyError:
        pass   # => expected

# Run tests
test_compute_cohort_metrics_basic()
test_compute_cohort_metrics_small_cohort_filter()
test_compute_cohort_metrics_missing_column()
print("All tests passed!")

# === Run the validated function ===
rng = np.random.default_rng(seed=42)
sample_df = pd.DataFrame({
    "quarter": rng.choice(["Q1", "Q2", "Q3", "Q4"], 500),
    "revenue": rng.lognormal(10, 0.5, 500),
})
metrics = compute_cohort_metrics(sample_df, "quarter", "revenue")
print(metrics)
```

**Key Takeaway**: Write analytics functions with full type hints, docstrings with Args/Returns/Raises, and corresponding unit tests — this makes analytics code reviewable, testable, and maintainable by a team, not just the original author.

**Why It Matters**: Analytics code that lives only in notebooks accumulates technical debt rapidly — the function that computes "revenue cohort metrics" gets copy-pasted and modified in 12 notebooks until no one knows which version is correct. Packaging logic in typed, tested functions with clear APIs enables CI testing, version control, code review, and confident refactoring. This is the difference between analytics as a craft and analytics as engineering.

---

## Example 81: Exporting Results — CSV, Excel, Parquet, Styled HTML

Different consumers need different output formats. Knowing the right export format for each use case prevents rework.

**Code**:

```python
import pandas as pd      # => pandas 3.0.2
import numpy as np       # => numpy 2.4.4
import os

rng = np.random.default_rng(seed=42)
df = pd.DataFrame({
    "department": rng.choice(["Engineering", "Marketing", "Finance"], 100),
    "employee": [f"EMP_{i:03d}" for i in range(100)],
    "salary": rng.normal(65000, 20000, 100).clip(30000, 150000),
    "performance": rng.normal(75, 15, 100).clip(0, 100),
    "tenure_years": rng.integers(0, 20, 100),
})

summary = df.groupby("department").agg(
    headcount=("employee", "count"),
    avg_salary=("salary", "mean"),
    avg_performance=("performance", "mean"),
    avg_tenure=("tenure_years", "mean"),
).round(1).reset_index()

# === CSV — universal format, simplest ===
summary.to_csv("summary.csv", index=False)
# => index=False: don't write row numbers as first column (usually unwanted)
print("CSV saved")

# === Excel — for business stakeholders ===
with pd.ExcelWriter("report.xlsx", engine="openpyxl") as writer:
    # Multiple sheets in one workbook
    summary.to_excel(writer, sheet_name="Summary", index=False)
    df.to_excel(writer, sheet_name="Raw Data", index=False)
    # => engine="openpyxl" for .xlsx format
print("Excel saved with 2 sheets")

# === Parquet — for data pipeline handoffs ===
df.to_parquet("processed_data.parquet", index=False, compression="snappy")
# => compression="snappy": balanced speed/size; "gzip" for smaller files
print("Parquet saved")

# === Styled HTML — for report emails and Jupyter ===
styled = (
    summary.style
    .format({
        "avg_salary": "${:,.0f}",          # => format as currency
        "avg_performance": "{:.1f}",       # => one decimal
        "avg_tenure": "{:.1f} yrs",
    })
    .background_gradient(subset=["avg_salary"], cmap="Blues")  # => color scale for salary
    .highlight_max(subset=["headcount"])   # => highlight largest team
    .set_caption("Department Summary Report")
)
# Save as HTML
styled.to_html("summary.html")
print("Styled HTML saved")

# Cleanup demo files
for f in ["summary.csv", "report.xlsx", "processed_data.parquet", "summary.html"]:
    if os.path.exists(f):
        os.remove(f)
print("Demo files cleaned up")
```

**Key Takeaway**: Use Parquet for pipeline handoffs (preserves dtypes, compressed, fast), Excel for business stakeholder reports (readable, multi-sheet), and Styled HTML for Jupyter reports that need conditional formatting without Excel dependencies.

**Why It Matters**: The wrong export format creates friction. Sending a Parquet file to a business analyst who uses Excel requires a conversion step. Sending a raw CSV to the data warehouse loses dtype information, causing incorrect aggregations. Styled HTML brings attention to critical values (highest salary, smallest team) without requiring the recipient to set up conditional formatting manually in Excel.

---

## Example 82: Scheduling Analytics — schedule Library and Cron Patterns

Production analytics pipelines run on schedules — nightly ETL, weekly reports, real-time dashboards. Understanding scheduling patterns is essential for operationalization.

**Code**:

```python
# === Method 1: schedule library — Python-based scheduling ===
# Install: pip install schedule
try:
    import schedule    # => schedule library
    import time
    import pandas as pd   # => pandas 3.0.2
    from datetime import datetime

    # Define the analytics job to run on schedule
    def daily_sales_summary():
        """Run daily sales aggregation — called by scheduler"""
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Running daily sales summary...")
        # In production: read from database, compute metrics, write to output
        # => df = pd.read_sql("SELECT ...", con)
        # => summary = df.groupby("region")["revenue"].sum()
        # => summary.to_csv(f"reports/sales_{datetime.now():%Y%m%d}.csv")
        print("Daily summary complete.")

    def weekly_report():
        """Weekly KPI report — called every Monday"""
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Running weekly KPI report...")

    # Configure schedule
    schedule.every().day.at("06:00").do(daily_sales_summary)    # => daily at 6 AM
    schedule.every().monday.at("08:00").do(weekly_report)        # => every Monday 8 AM
    schedule.every(30).minutes.do(daily_sales_summary)           # => every 30 minutes

    print("Schedule configured:")
    for job in schedule.jobs:
        print(f"  {job}")

    # In a real script, you would run:
    # while True:
    #     schedule.run_pending()
    #     time.sleep(60)   # => check every minute

    print("\nSchedule library pattern shown (not running continuous loop in demo)")

except ImportError:
    print("schedule not installed — run: pip install schedule")

# === Method 2: Cron syntax (Linux/macOS) ===
# Add to crontab with: crontab -e
cron_examples = """
# Daily analytics at 6:00 AM
0 6 * * * /usr/bin/python3 /opt/analytics/daily_summary.py

# Weekly KPI report every Monday at 8:00 AM
0 8 * * 1 /usr/bin/python3 /opt/analytics/weekly_report.py

# Every 15 minutes during business hours (8am-6pm, weekdays)
*/15 8-18 * * 1-5 /usr/bin/python3 /opt/analytics/realtime_check.py

# Monthly report on 1st of each month at 7:00 AM
0 7 1 * * /usr/bin/python3 /opt/analytics/monthly_report.py
"""
print("\nCron patterns:")
print(cron_examples)

# === Method 3: Airflow/Prefect DAGs (production orchestration) ===
airflow_example = """
# Apache Airflow DAG (conceptual)
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

with DAG("daily_analytics", schedule="0 6 * * *", start_date=datetime(2026, 1, 1)) as dag:
    task = PythonOperator(task_id="run_summary", python_callable=daily_sales_summary)
"""
print("Airflow DAG pattern (conceptual):")
print(airflow_example)
```

**Key Takeaway**: Use the `schedule` library for simple single-machine scheduling, system `cron` for production server jobs, and Apache Airflow or Prefect for complex multi-step pipelines with dependencies and monitoring.

**Why It Matters**: Analytics that only runs when a human manually triggers it is not production analytics. Scheduled pipelines deliver fresh reports automatically, trigger alerting when metrics cross thresholds, and reduce analyst time on repetitive execution. Knowing the scheduling hierarchy (schedule → cron → Airflow) lets you choose the appropriate tool — schedule is fine for a single script, but a 20-step ETL pipeline with retry logic and alerting needs Airflow.

---

## Example 83: Streamlit Analytics Dashboard

Streamlit converts Python data science scripts into interactive web apps with minimal code — no HTML, CSS, or JavaScript required.

**Code**:

```python
# Install: pip install streamlit
# Run with: streamlit run app.py

# This code should be saved as app.py and run with `streamlit run app.py`
# It cannot be run inline in a notebook — it starts a web server

streamlit_app_code = '''
import streamlit as st      # => streamlit — web app framework for data apps
import pandas as pd         # => pandas 3.0.2
import plotly.express as px # => plotly 6.x for interactive charts
import numpy as np

# === Page configuration ===
st.set_page_config(
    page_title="Sales Analytics Dashboard",
    layout="wide",      # => use full browser width
)

st.title("Sales Analytics Dashboard")
st.markdown("Interactive analytics powered by Streamlit and pandas 3.0.2")

# === Sidebar controls ===
st.sidebar.header("Filters")
selected_depts = st.sidebar.multiselect(
    "Departments",
    ["Engineering", "Marketing", "Finance"],
    default=["Engineering", "Marketing"],
)
min_salary = st.sidebar.slider("Minimum Salary", 30000, 150000, 40000, step=5000)

# === Generate sample data (in production: load from database) ===
rng = np.random.default_rng(seed=42)
n = 500
df = pd.DataFrame({
    "department": rng.choice(["Engineering", "Marketing", "Finance"], n),
    "salary": rng.normal(65000, 20000, n).clip(30000, 150000),
    "performance": rng.normal(75, 15, n).clip(0, 100),
    "tenure": rng.integers(0, 20, n),
})

# === Apply filters ===
filtered = df[
    (df["department"].isin(selected_depts)) &
    (df["salary"] >= min_salary)
]

# === KPI metrics row ===
col1, col2, col3, col4 = st.columns(4)
col1.metric("Total Employees", len(filtered))
col2.metric("Avg Salary", f"${filtered['salary'].mean():,.0f}")
col3.metric("Avg Performance", f"{filtered['performance'].mean():.1f}")
col4.metric("Avg Tenure", f"{filtered['tenure'].mean():.1f} yrs")

# === Charts row ===
chart_col1, chart_col2 = st.columns(2)

with chart_col1:
    fig = px.scatter(
        filtered, x="tenure", y="salary", color="department",
        title="Salary vs Tenure",
        color_discrete_map={"Engineering": "#0173B2", "Marketing": "#DE8F05", "Finance": "#029E73"},
    )
    st.plotly_chart(fig, use_container_width=True)

with chart_col2:
    dept_avg = filtered.groupby("department")["salary"].mean().reset_index()
    fig2 = px.bar(
        dept_avg, x="department", y="salary",
        title="Average Salary by Department",
        color="department",
        color_discrete_map={"Engineering": "#0173B2", "Marketing": "#DE8F05", "Finance": "#029E73"},
    )
    st.plotly_chart(fig2, use_container_width=True)

# === Raw data table ===
st.subheader("Raw Data")
st.dataframe(filtered.sort_values("salary", ascending=False), use_container_width=True)
'''

# Write to file for actual use
with open("streamlit_demo_app.py", "w") as f:
    f.write(streamlit_app_code)
print("Streamlit app written to streamlit_demo_app.py")
print("Run with: streamlit run streamlit_demo_app.py")

import os
os.remove("streamlit_demo_app.py")
```

**Key Takeaway**: Streamlit converts a pandas/plotly script into a web dashboard in under 100 lines — use `st.sidebar` for filter controls, `st.columns()` for side-by-side layout, and `st.plotly_chart()` for interactive charts with automatic responsive sizing.

**Why It Matters**: Traditional Jupyter notebooks require recipients to run Python to see results. Streamlit apps run as web applications accessible via URL — stakeholders can interact with filters, see updated charts, and download results without any Python knowledge. The turnaround from "I need a dashboard" to "here is a working dashboard URL" drops from weeks (custom web app) to hours (Streamlit), dramatically improving analytics team responsiveness.

---

## Example 84: Packaging an Analytics Project — pyproject.toml and uv

Packaging analytics code as a proper Python project ensures reproducibility across environments and team members.

**Code**:

```bash
# === Project structure for a packaged analytics project ===
# analytics-project/
# ├── pyproject.toml          # => project metadata and dependencies
# ├── README.md
# ├── src/
# │   └── analytics/
# │       ├── __init__.py
# │       ├── data_loader.py  # => loading and validation functions
# │       ├── features.py     # => feature engineering
# │       ├── models.py       # => model training and evaluation
# │       └── reports.py      # => output generation
# └── tests/
#     ├── test_data_loader.py
#     └── test_features.py
```

```python
# === pyproject.toml content (write this file) ===
pyproject_content = """
[project]
name = "analytics-project"
version = "0.1.0"
description = "Sales analytics pipeline"
requires-python = ">=3.11"
dependencies = [
    "pandas==3.0.2",
    "numpy==2.4.4",
    "scikit-learn==1.8.0",
    "polars==1.40.1",
    "matplotlib>=3.10",
    "seaborn==0.13.2",
    "plotly>=6.0",
    "duckdb>=1.2",
    "pyarrow>=20.0",
    "scipy>=1.15",
    "statsmodels>=0.14",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "pandera>=0.20",
    "streamlit>=1.40",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--cov=src/analytics --cov-report=term-missing"
"""

print("=== pyproject.toml ===")
print(pyproject_content)

# === uv package manager commands (faster than pip) ===
uv_commands = """
# Install uv (once)
pip install uv

# Create virtual environment and install all dependencies
uv venv .venv               # => create .venv/ virtual environment
uv pip install -e ".[dev]"  # => install package + dev dependencies in editable mode

# Activate virtual environment
source .venv/bin/activate   # => macOS/Linux
# .venv\\Scripts\\activate     # => Windows

# Lock dependencies for reproducibility
uv pip freeze > requirements.lock  # => exact versions of all installed packages

# Install from lock file on another machine
uv pip install -r requirements.lock  # => exactly reproduces the environment

# Run tests
pytest --cov=src/analytics
"""
print("=== uv Commands ===")
print(uv_commands)
```

**Key Takeaway**: Use `pyproject.toml` with pinned major versions (`pandas==3.0.2`) for core stability and `>=` for tools (`matplotlib>=3.10`), and use `uv` instead of `pip` — it is 10-100x faster for dependency resolution and installation.

**Why It Matters**: Analytics code that only works on the original developer's laptop is not production code. `pyproject.toml` documents all dependencies with versions, making environment reproduction deterministic. `uv` resolves and installs 30+ scientific Python packages in seconds instead of minutes. Separating source code from notebooks enables proper unit testing and CI integration. This packaging discipline is the final step from analytics script to maintainable analytics software.

---

## Example 85: Data Analytics Production Checklist

A production analytics pipeline requires more than working code. This example consolidates the key practices into a runnable checklist.

**Code**:

```python
import pandas as pd      # => pandas 3.0.2
import numpy as np       # => numpy 2.4.4
from datetime import datetime
import logging
import os

# === 1. LOGGING — replace print() with structured logging ===
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
logger.info("Pipeline starting")  # => 2026-04-29 12:00:00 [INFO] Pipeline starting

# === 2. CONFIGURATION — never hardcode paths or credentials ===
config = {
    "input_path": os.environ.get("INPUT_PATH", "data/input.parquet"),
    "output_path": os.environ.get("OUTPUT_PATH", "data/output.parquet"),
    "model_path": os.environ.get("MODEL_PATH", "models/churn_model.pkl"),
    "min_rows": int(os.environ.get("MIN_ROWS", "100")),  # => validate minimum data size
}
logger.info(f"Config loaded: {config}")

# === 3. REPRODUCIBILITY — seed all random operations ===
RANDOM_SEED = 42
rng = np.random.default_rng(seed=RANDOM_SEED)  # => numpy 2.4.4 style
# => all numpy random calls use rng.method(), not np.random.method()

# === 4. DATA VALIDATION — validate inputs before processing ===
def load_and_validate(path: str, min_rows: int = 100) -> pd.DataFrame:
    """Load data and validate minimum quality requirements"""
    logger.info(f"Loading data from {path}")

    # Simulate loading (in production: pd.read_parquet(path))
    df = pd.DataFrame({
        "id": range(1000),
        "feature1": rng.normal(0, 1, 1000),
        "feature2": rng.integers(0, 10, 1000),
        "target": rng.choice([0, 1], 1000),
    })

    # Validate minimum rows
    if len(df) < min_rows:
        raise ValueError(f"Insufficient data: {len(df)} rows < {min_rows} minimum")

    # Validate no duplicate IDs
    if df["id"].duplicated().any():
        dup_count = df["id"].duplicated().sum()
        raise ValueError(f"Found {dup_count} duplicate IDs")

    # Validate no all-null columns
    all_null_cols = df.columns[df.isnull().all()].tolist()
    if all_null_cols:
        raise ValueError(f"Columns entirely null: {all_null_cols}")

    missing_pct = df.isnull().mean()
    logger.info(f"Data loaded: {df.shape}, max missing: {missing_pct.max():.1%}")
    return df

df = load_and_validate(config["input_path"], config["min_rows"])

# === 5. MONITORING — log key metrics at each stage ===
def log_stage(stage_name: str, df: pd.DataFrame):
    logger.info(f"[{stage_name}] rows={len(df):,}, cols={len(df.columns)}, "
                f"nulls={df.isnull().sum().sum()}")

log_stage("AFTER_LOAD", df)

# === 6. IDEMPOTENCY — pipeline re-run should produce same result ===
# Avoid mutable global state; use function parameters for all configuration
# Use deterministic sorting/ordering before any operations

# === 7. OUTPUT METADATA — document when and how output was created ===
metadata = {
    "created_at": datetime.utcnow().isoformat() + "Z",
    "input_rows": len(df),
    "pipeline_version": "1.0.0",
    "pandas_version": pd.__version__,   # => "3.0.2"
    "numpy_version": np.__version__,    # => "2.4.4"
    "random_seed": RANDOM_SEED,
}
logger.info(f"Output metadata: {metadata}")

# === Production checklist summary ===
checklist = """
PRODUCTION ANALYTICS CHECKLIST:
  [x] 1. Logging (not print())
  [x] 2. Configuration from environment variables
  [x] 3. Reproducible random seed (np.random.default_rng)
  [x] 4. Input data validation (rows, nulls, duplicates)
  [x] 5. Stage monitoring (row counts, null counts)
  [x] 6. Idempotent pipeline (same input → same output)
  [x] 7. Output metadata (version, timestamp, seed)
  [ ] 8. Unit tests for all transformation functions
  [ ] 9. Alerting for validation failures
  [ ] 10. Data lineage tracking
"""
print(checklist)
logger.info("Pipeline complete")
```

**Key Takeaway**: A production analytics pipeline requires logging (not `print()`), environment-variable configuration (not hardcoded paths), input validation (fail fast on bad data), and output metadata (when/how results were generated) — these are non-negotiable for maintainable, debuggable pipelines.

**Why It Matters**: The gap between a working notebook and a production pipeline is not just packaging — it is operational discipline. Without logging, debugging a nightly job that failed at 3 AM requires guesswork. Without configuration management, promoting code from development to production requires manual file edits. Without input validation, corrupted upstream data propagates silently through the pipeline. These practices distinguish analytics code that requires constant human babysitting from analytics code that runs reliably for months.
