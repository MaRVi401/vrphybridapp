# VRP Solver Indramayu (Hybrid Genetic Algorithm & Artificial Bee Colony)

A web-based optimization tool designed to solve the **Capacitated Vehicle Routing Problem (CVRP)** using a powerful **Hybrid Metaheuristic Algorithm** combining **Genetic Algorithm (GA)** and **Artificial Bee Colony (ABC)**, enhanced with **Memetic Local Search** (Inter-Route Relocate, Inter-Route 1-1 Swap, and Intra-Route 2-Opt) and **Split-Prins Dynamic Programming**.

This application specifically models logistics and distribution routing across **31 sub-districts (kecamatan) in Indramayu Regency**, featuring real-time interactive mapping, convergence charts, and algorithm benchmarking.

---

## 🚀 Key Features

1. **Hybrid Metaheuristic Optimization (`GA + ABC`)**:
   - **Global Exploration (60% Generations)**: Managed via Genetic Algorithm (Selection, Crossover, Mutation).
   - **Memetic Local Search**: Polishes elite routes using *Inter-Route Relocate*, *Inter-Route 1-1 Swap*, and *Intra-Route 2-Opt*.
   - **Local Exploitation (40% Generations)**: Managed via Artificial Bee Colony (Employed, Onlooker, and Scout Bees phases).
   - **Split-Prins (Dynamic Programming)**: Optimal giant-tour decoding into vehicle routes respecting capacity constraints.

2. **Algorithm Benchmarking Mode**:
   - Run **GA**, **ABC**, and **Hybrid** simultaneously to compare performance metrics: Total Distance (km), Execution Time (ms), Fleet Usage, and Feasibility Status.
   - Interactive Convergence Chart and Comparison Tables.

3. **Interactive Leaflet Mapping**:
   - Dynamic marker rendering with dedicated Depot and Customer icons.
   - Polyline route visualization color-coded per vehicle fleet.
   - Click-to-add custom locations directly on the map.
   - Auto-bounds fitting when importing datasets.

4. **Data Management & Export**:
   - Built-in dataset for **31 sub-districts of Indramayu** (JSON & CSV formats).
   - Import custom datasets via CSV or JSON.
   - Export optimization results and benchmark summaries to JSON.

5. **Responsive UI & Dark Mode**:
   - Modern Tailwind CSS interface with native dark/light mode toggle.
   - Fully optimized for desktop, tablet, and mobile layouts.

---

## 🛠️ Technology Stack

- **Core Framework**: React 19 + Vite
- **Styling**: Tailwind CSS (v4)
- **Mapping**: Leaflet & React-Leaflet
- **Charts**: Recharts
- **Concurrency**: Web Workers (ensures non-blocking background calculations)
- **Icons**: Tabler Icons

---

## 📦 Installation & Local Development

Follow these steps to run the application locally on your machine:

1. **Clone the repository** (or extract the project folder):
   ```bash
   git clone https://github.com/your-username/vrp-hybrid-app.git
   cd vrp-hybrid-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Open `http://localhost:5173` in your browser to use the application.

---

## 🏗️ Project Structure

```text
vrp-hybrid-app/
├── public/
│   ├── assets/             # Images and app icons
│   └── dataset/            # Default JSON & CSV datasets (Indramayu 31 Kec)
├── src/
│   ├── components/         # UI Components (MapView.jsx, FitnessChart.jsx)
│   ├── hooks/              # Custom Hooks (useVrpSolver.js)
│   ├── workers/            # Web Worker for heavy metaheuristic calculations (vrpWorker.js)
│   ├── App.jsx             # Main application layout and state management
│   ├── main.jsx            # React entry point
│   └── index.css           # Global Tailwind CSS imports
├── package.json
└── vite.config.js
```

---

## 📖 How to Use

1. **Configure Parameters**:
   - Set **Kapasitas** (Vehicle load limit per fleet).
   - Set **Armada** (Maximum available vehicles).
   - Set **Generasi** & **Populasi** size.
2. **Select Algorithm**:
   - Choose between **Hybrid (GA + ABC)**, **Genetic Algorithm (GA)**, **Artificial Bee Colony (ABC)**, or **Benchmark Semua Algoritma**.
3. **Manage Locations**:
   - Use default Indramayu sub-districts, import a `.csv`/`.json` file, click on the map to add points, or manage points from the sidebar list.
4. **Run Optimization**:
   - Click **"Jalankan Optimasi"** to compute the best routes. View the resulting distance, vehicle distribution, and convergence chart.
5. **Export**:
   - Click the **"Export"** button in the header to download the complete route plan and metrics as a JSON file.

---

## 📄 License

Distributed under the **MIT License**. Feel free to use, modify, and distribute for academic or professional purposes.