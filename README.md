# 🏁 Racing Data Platform

> **Real-time racing analytics and strategy optimization for the GR Cup Series**

A comprehensive web application that transforms raw racing telemetry into actionable insights for drivers, race engineers, and teams. Built for the Toyota Hack the Track Hackathon 2025.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Problem Statement

In professional motorsports, race engineers must make split-second decisions about pit stops, tire strategy, and driver coaching—all while processing massive amounts of telemetry data. Existing tools are either too complex for real-time use or lack the predictive analytics needed for strategic decision-making.

**The Racing Data Platform solves this by providing:**
- ⚡ Real-time pit strategy recommendations based on tire degradation and fuel consumption
- 📊 Instant driver performance comparisons for training and development
- 🔍 Post-race analysis with comprehensive lap-by-lap breakdowns
- 🎛️ Interactive telemetry visualization for optimizing racing lines

---

## ✨ Features

### 🏁 **Real-Time Analytics** (Competition Category)

#### Pit Strategy Command Center
- **Smart pit stop recommendations** based on real-time race conditions
- **Tire degradation modeling** with compound-specific wear rates
- **Fuel consumption tracking** with automated low-fuel warnings
- **Undercut/overcut opportunity detection** using gap analysis
- **Interactive strategy simulator** to test "what-if" scenarios

![Pit Strategy Panel](screenshots/pit-strategy.png)

### 👥 **Driver Training & Insights** (Competition Category)

#### Driver Comparison Dashboard
- **Side-by-side performance analysis** for up to 5 drivers
- **Consistency metrics** (standard deviation of lap times)
- **Lap-by-lap progression charts** to identify strengths/weaknesses
- **Head-to-head statistics** with delta analysis
- **Automatic fastest driver and most consistent driver identification**

![Driver Comparison](screenshots/driver-comparison.png)

### 📈 **Post-Event Analysis** (Competition Category)

#### Race Results & Leaderboards
- **Comprehensive race results** with automatic position calculation
- **Podium visualization** with winner highlights
- **DNF and completion rate tracking**
- **Best laps leaderboard** showing top 10 fastest individual laps
- **Sortable tables** by position, time, driver, or best lap

![Race Results](screenshots/race-results.png)

### 📊 **Additional Insights**

#### Lap Time Analysis
- **Multi-driver lap time charting** with color-coded lines
- **Statistical analysis** (best lap, average, total laps)
- **Driver filtering** to focus on individual performance

#### Telemetry Viewer
- **Real-time telemetry traces** (speed, throttle, brake, gear)
- **Toggle-able data channels** for focused analysis
- **Lap-by-lap and driver-by-driver filtering**
- **Statistical summaries** (max speed, average speed, max brake pressure)

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **Pandas & NumPy** - Efficient data processing and analysis
- **Scikit-learn** - Machine learning for tire degradation models
- **Pydantic** - Data validation and settings management
- **Uvicorn** - ASGI server for production deployment

### Frontend
- **React 18** - Modern UI framework
- **Material-UI (MUI)** - Professional component library
- **Recharts** - Interactive data visualization
- **Axios** - HTTP client for API communication

### Data Processing
- **Custom tire degradation models** based on compound characteristics
- **Pit strategy optimizer** with multi-factor decision engine
- **Efficient caching system** using pickle serialization
- **Multi-track data loading** with automatic discovery

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd racing-data-platform
   ```

2. **Run the setup script**
   ```bash
   python setup.py
   ```
   This will:
   - Create necessary directories
   - Set up a virtual environment
   - Install Python dependencies

3. **Activate the virtual environment**
   
   On Windows:
   ```bash
   venv\Scripts\activate
   ```
   
   On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. **Add your racing data**
   
   Download datasets from the Toyota Hack the Track website and place track folders in `data/raw/`:
   ```
   data/raw/
   ├── barber-motorsports-park/
   ├── circuit-of-the-americas/
   └── sonoma/
   ```

5. **Start the backend server**
   ```bash
   cd backend
   python main.py
   ```
   The API will be available at `http://localhost:8000`

6. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

7. **Start the frontend development server**
   ```bash
   npm start
   ```
   The application will open at `http://localhost:3000`

---

## 📖 Usage Guide

### Selecting Track and Race
1. Use the **Track Selector** dropdown to choose a venue
2. Use the **Race Selector** to pick a specific race session
3. Navigate between tabs to access different analysis tools

### Pit Strategy Simulator
1. Go to the **"Pit Strategy"** tab
2. Adjust race parameters:
   - Current lap number
   - Tire compound and stint laps
   - Fuel remaining
   - Gaps to cars ahead/behind
3. Toggle **"Caution Period"** to simulate yellow flag scenarios
4. The system will automatically recommend whether to pit and show optimal windows

### Driver Comparison
1. Navigate to **"Driver Comparison"** tab
2. Select 2-5 drivers from the dropdown
3. View side-by-side statistics and lap progression charts
4. Analyze head-to-head comparisons for two-driver scenarios

### Viewing Race Results
1. Go to **"Race Results"** tab
2. Results are automatically calculated from lap time data
3. Click column headers to sort by different metrics
4. View podium highlights and fastest lap information

### Analyzing Telemetry
1. Open the **"Telemetry"** tab
2. Select a driver and lap number
3. Toggle data channels on/off (speed, throttle, brake, gear)
4. Review statistics like max speed and brake pressure

---

## 🏗️ Project Structure

```
racing-data-platform/
├── backend/
│   ├── api/              # FastAPI route handlers
│   ├── core/             # Core analytics modules
│   │   ├── data_loader.py    # Data loading and caching
│   │   ├── pit_strategy.py   # Pit stop optimization
│   │   └── tire_model.py     # Tire degradation models
│   ├── config.py         # Application settings
│   └── main.py           # FastAPI application entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API client functions
│   │   └── App.jsx       # Main application component
│   └── package.json
├── data/
│   ├── raw/              # Race data files (not in git)
│   ├── processed/        # Cached processed data
│   └── models/           # Trained ML models
├── requirements.txt      # Python dependencies
├── setup.py             # Setup automation script
└── README.md
```

---

## 🧠 Key Algorithms

### Tire Degradation Model
- Tracks lap-by-lap performance decline
- Compound-specific wear rates (soft: 0.08s/lap, medium: 0.05s/lap, hard: 0.03s/lap)
- Temperature adjustments for track conditions
- Performance index calculation (0-100 scale)

### Pit Strategy Optimizer
- Multi-factor decision engine considering:
  - Tire life remaining vs. race distance
  - Fuel consumption rate and remaining fuel
  - Track position and gaps to competitors
  - Undercut opportunity calculations
  - Caution period optimization
- Confidence scoring for each pit window
- Alternative strategy generation

### Driver Comparison Analytics
- Statistical consistency analysis (standard deviation)
- Lap-by-lap delta calculations
- Best/average/worst lap identification
- Race pace trend analysis

---

## 🎓 What I Learned

### Technical Challenges Overcome
1. **Efficient data loading** - Implemented caching system to handle large CSV files without memory issues
2. **Real-time strategy calculations** - Developed algorithms that run fast enough for live race use
3. **Flexible data structures** - Built a system that works across different tracks and race formats
4. **User experience** - Designed an intuitive interface that balances power with simplicity

### Skills Developed
- FastAPI backend development with async operations
- React component architecture and state management
- Data science with pandas for time-series analysis
- Material-UI for professional UI design
- Integration testing across full-stack applications

---

## 🏆 Hackathon Categories

This project addresses three official competition categories:

✅ **Real-Time Analytics** - Pit strategy command center with live recommendations  
✅ **Driver Training & Insights** - Comprehensive driver comparison and performance analysis  
✅ **Post-Event Analysis** - Race results, leaderboards, and telemetry visualization

---

## 🔮 Future Enhancements

- **Weather integration** - Factor rain probability into tire strategy
- **Predictive pit stop timing** - ML model trained on historical optimal pit windows
- **Mobile app** - iOS/Android apps for pit crew use
- **Live data streaming** - WebSocket integration for real-time race updates
- **Team collaboration** - Multi-user support with role-based access
- **Export capabilities** - Generate PDF reports for team debriefs

---

## 📸 Screenshots

### Dashboard Overview
![Dashboard](screenshots/dashboard.png)

### Lap Time Analysis
![Lap Times](screenshots/lap-times.png)

### Pit Strategy Panel
![Pit Strategy](screenshots/pit-strategy.png)

### Driver Comparison
![Driver Comparison](screenshots/driver-comparison.png)

### Race Results
![Results](screenshots/results.png)

### Telemetry Viewer
![Telemetry](screenshots/telemetry.png)

---

## 🤝 Contributing

This project was built for the Toyota Hack the Track Hackathon 2025. Feedback and suggestions are welcome!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Toyota Racing Development** for providing the GR Cup race data
- **Hack the Track Hackathon** organizers for this amazing challenge
- The **FastAPI** and **React** communities for excellent documentation

---

## 📧 Contact

**Project Link:** [https://github.com/yourusername/racing-data-platform](https://github.com/yourusername/racing-data-platform)

**Demo Video:** [YouTube Link]

**Live Demo:** [Deployment Link if available]

---

## 🏁 Built with passion for racing and data science

*Making motorsports smarter, one lap at a time.* 🏎️💨