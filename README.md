# 🛣️ Dalan — AI-Powered Road Crack Mapping App

**Dalan** is a crowdsourced web application that allows users to upload road images, automatically classify the type of crack using AI, and pin the report to a map. Designed to help monitor and maintain road infrastructure through community-powered data.

**Made by Matthew Enarle and Alecxander Jamille Andaya**


---

## 🚀 Features

- 📸 Upload road crack images (with optional GPS tagging)
- 🤖 AI-powered image classification (e.g., alligator, longitudinal, transverse)
- 🗺️ Interactive map view with markers for each crack report
- 📊 Filter results by type, location, and date
- 🧠 Model training and deployment pipeline (MobileNet/ResNet)
- 🧑‍🤝‍🧑 Crowdsourced — open to everyone
- 🔐 Optional authentication (Google, etc.)

---

## 📁 Project Structure

```
/dalan
  /web     # Next.js + Tailwind CSS frontend
  /api     # Backend (Node.js/Express, or FastAPI if you prefer Python)
  /model   # Jupyter Notebooks/scripts for AI model training
  README.md
```

---

## Setup Instructions

### 1. Frontend (`/web`)
- Next.js + Tailwind CSS
- Pages: Image upload, map view, submissions

### 2. Backend (`/api`)
- Node.js/Express (or FastAPI)
- Handles image uploads, AI classification endpoints, DB

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
