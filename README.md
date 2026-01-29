# Artificial Neural Networks and Deep Learning

This repo contains the code and the reports of the two challenges carried on during "Artificial Neural Networks and Deep Learning" course.

## 🏴‍☠️ Challenge 1: Pirate Pain Classification ⚔️

### 📋 Project Overview

This project focuses on developing a deep learning model to classify pirate pain levels into 3 distinct classes using a Bagging Ensemble approach that combines multiple Recurrent Neural Networks processing temporal sensor data.

### 📂 Dataset

The dataset contains temporal sensor readings from pirates with:
- **31 joint features** (joint_00 to joint_30) capturing body movement
- **4 pain survey features** (pain_survey_1 to pain_survey_4)
- **Physical attributes**: number of legs, hands, and eyes

### 🛠️ Methodology

#### Data Preprocessing
- **Feature Engineering**: Created composite IDs for sample-label combinations
- **Feature Redundancies**: Removed constant feature (joint_30) from the dataset
- **Normalization**: Applied Min-Max scaling to joint and pain features using training set statistics
- **Encoding**: Converted categorical variables (legs, hands, eyes, labels) to numerical values
- **Class Balancing**: Computed balanced class weights to handle class imbalance
- **Train/Validation Split**: 120 samples for validation, ensuring proper time-series validation

#### Sequence Generation
- **Window Size**: 35 timesteps
- **Stride**: 5 timesteps
- **Padding**: Zero-padding applied to handle sequences shorter than window size

#### Model Architecture: Bagging Ensemble
Implemented three diverse models to maximize ensemble performance:

1. **Model 1: Bidirectional LSTM**
   - 2-layer Bidirectional LSTM with 128 hidden units
   - Learning rate: 2e-3, Batch size: 128
   - AdamW optimizer

2. **Model 2: Bidirectional RNN**
   - 1-layer Bidirectional RNN with 256 hidden units
   - Learning rate: 4e-4, Batch size: 128
   - AdamW optimizer

3. **Model 3: Bidirectional GRU**
   - 2-layer Bidirectional GRU with 128 hidden units
   - Learning rate: 2e-3, Batch size: 256
   - RAdam optimizer

#### Bagging Strategy
- **Bootstrap Sampling**: Each model trained on a different bootstrap sample
- **Diversity**: Different architectures (RNN, LSTM, GRU) and hyperparameters ensure model diversity
- **Ensemble Prediction**: Majority voting across all three models for final predictions

#### Training Process
- **Loss Function**: Weighted Cross-Entropy Loss with balanced class weights
- **Early Stopping**: Patience of 50 epochs monitoring validation F1 score
- **Mixed Precision Training**: Automatic mixed precision for faster training on GPU
- **Regularization**: Model diversity acts as implicit regularization

### 📊 Results

#### Ensemble Performance
The bagging ensemble significantly outperformed individual models:
- **biLSTM F1 Score**: 0.9385
- **biRNN F1 Score**: 0.9150
- **biGRU F1 Score**: 0.9361
- **Ensemble F1 Score**: 0.9375 in validation and 0.9664 in test

✅ **Score: 5/5**

---

## 🔬 Challenge 2: Breast Cancer Subtype Classification 🧬

### 📋 Project Overview

This project focuses on developing a deep learning model to classify breast cancer histopathology images into 4 distinct subtypes using a dual-stream architecture that processes both RGB images and tumor masks.

### 📂 Dataset

The dataset contains high-resolution histopathology images with:
- **4 cancer subtypes**: Triple negative, Luminal A, Luminal B, HER2(+)
- **Tumor masks**: Binary masks highlighting tumor regions
- **Multiple tiles per patient**: 224×224 tiles extracted from tumor regions

### 🛠️ Methodology

#### Tile Extraction (Region-Based)
- **Connected Components Analysis**: Identifies separate tumor regions in binary masks
- **Centered Extraction**: 224×224 tiles extracted by centering on region centroids
- **Quality Filter**: Low-variance tiles (std ≤ 10) are discarded
- **Max 48 tiles per image**: Prioritizing larger tumor regions

#### Model Architecture: Parallel DenseNet (Dual-Stream)
A dual-pathway architecture that processes RGB and Mask information separately:

1. **RGB Pathway**: EfficientNetV2-L (pretrained on ImageNet)
   - Extracts rich visual features (1280-dim)

2. **Mask Pathway**: DenseNet121 (trained from scratch)
   - Processes tumor mask information (1024-dim)

3. **Late Fusion**: Features concatenated (2304-dim) before classifier
   - Dropout (0.5) for regularization
   - Final linear layer for 4-class output

#### Data Augmentation
- **ColorJitter**: Random brightness, contrast, saturation, and hue adjustments (RGB only)
- **Rotations**: Random 90°, 180°, or 270° rotations
- **Flips**: Horizontal and vertical flips
- **4-channel synchronized**: Geometric augmentations applied consistently to RGB and mask

#### Training Configuration
- **Optimizer**: Lion (EvoLved Sign Momentum)
- **Learning Rate**: 2e-5 with Cosine Annealing scheduler
- **Loss Function**: Focal Loss (γ=2.0) with balanced class weights
- **Mixed Precision**: AMP for faster GPU training
- **Early Stopping**: Patience of 10 epochs

#### Patient-Level Prediction
- **Logits Aggregation**: Mean of tile logits per patient
- **Robust predictions**: More reliable than majority voting

### 📊 Results

The dual-stream architecture achieved strong performance:
- **Patient-level validation** using logits aggregation
- **Effective tumor region focus** through mask pathway

✅ **Score: 5/5**