# 🛣️ Dalan — AI-Powered Road Crack Mapping App

**Dalan** is a crowdsourced web application that allows users to upload road images, automatically classify the type of crack using AI, and pin the report to a map. Designed to help monitor and maintain road infrastructure through community-powered data.

**Made by Matthew Enarle and Alecxander Jamille Andaya**


---

## 🚀 Features

- 📸 Upload road crack images (with optional GPS tagging)
- 🤖 AI-powered image classification (e.g., alligator, longitudinal, transverse)
- Severity classification (e.g., minor, major)
- 🗺️ Interactive map view with markers for each crack report
- 📊 Filter results by type, location, and date
- 📱 Feed view with filtering
- 🧠 Model training and deployment pipeline (MobileNet/ResNet)
- 🧑‍🤝‍🧑 Crowdsourced — open to everyone
- 🔐 Optional authentication (Google, etc.)
- 📱 Mobile-first design 


---

## 📁 Project Structure

```
/dalan
  /web     # Next.js + Tailwind CSS frontend
  /api     # FastAPI backend + Supabase DB / Cloudinary for images
  /model   # Jupyter Notebooks/scripts for AI model training
  README.md
```

---

## Setup Instructions

### 1. Frontend (`/web`)
- Next.js + Tailwind CSS
- Pages: Image upload, map view w filtering, Feed w  filtering

### 2. Backend (`/api`)
- FastAPI
- Handles image uploads, AI classification endpoints, DB (Supabase) - Cloudinary or S3 for Image Storage

### 3. Model (`/model`)
- Jupyter Notebooks/scripts for training crack classifiers

---

## Goals

A crowdsourced AI-powered web app for detecting and mapping road cracks. Users upload images, which are classified by an AI model (e.g. alligator, transverse cracks) and pinned on a map.

---

## Modern Best Practices
- Modular codebase
- Documented APIs and components
- Clean, simple UI
- Secure endpoints

---

## Getting Started

1. Clone the repo and install dependencies in each subfolder (`web`, `api`, `model`).
2. Follow the README in each subfolder for local development.
3. Contribute and help map road cracks for safer roads!
