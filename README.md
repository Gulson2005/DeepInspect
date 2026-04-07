# 🔬 DPI Engine — Single-Threaded Full Stack System

A full-stack **Deep Packet Inspection** web application that analyzes `.pcap` network capture files, detects applications using SNI extraction, applies blocking rules, and visualizes results on a professional React dashboard.

> ⚠️ **Important:** This system analyzes `.pcap` files **offline only**. It does **NOT** block real internet traffic on your device. Blocking YouTube only removes YouTube packets from the filtered PCAP output file.

---



### Upload Page
- Drag & drop `.pcap` file upload with live progress bar
- Active blocking rules shown before upload
- Offline-only notice clearly displayed

### Dashboard
- Protocol distribution pie chart (TCP / UDP)
- Top applications bar chart (YouTube, Discord, Spotify, etc.)
- Blocked traffic table with search and pagination
- Domain/SNI detection table with Allowed / Blocked status
- Full rule management panel

---

## 🏗️ System Architecture

```
User (Browser)
      ↓  uploads .pcap file
React Frontend  (port 3000)
      ↓  HTTP POST via Axios
Spring Boot Backend  (port 8080)
      ↓  saves file → builds command
C++ DPI Engine  (dpi_simple.exe)
      ↓  single-threaded packet processing
      ↓  prints stats to stdout
Spring Boot Backend
      ↓  parses stdout → structured JSON
React Frontend
      ↓  renders dashboard with charts
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | Component-based UI, hooks |
| HTTP Client | Axios | File upload with progress bar |
| Charts | Recharts | Pie and Bar charts |
| Backend | Spring Boot 3.2 (Java 17) | REST API, file handling |
| Build Tool | Maven | Compile and run Java |
| Engine | C++ (GCC 14.2, C++17) | Packet inspection |
| Compiler | MinGW / MSYS2 | Windows GCC toolchain |

---

## 📁 Project Structure

```
dpi-fullstack/
├── engine/
│   └── Packet_analyzer-main/
│       ├── include/              # Header files
│       │   ├── pcap_reader.h
│       │   ├── packet_parser.h
│       │   ├── sni_extractor.h
│       │   └── types.h
│       ├── src/
│       │   ├── main_working.cpp  # ★ Single-threaded main
│       │   ├── pcap_reader.cpp
│       │   ├── packet_parser.cpp
│       │   ├── sni_extractor.cpp
│       │   └── types.cpp
│       ├── test_dpi.pcap         # Sample capture file
│       └── generate_test_pcap.py
├── storage/
│   ├── uploads/                  # Incoming .pcap files
│   └── output/                   # Filtered output files
├── backend/                      # Spring Boot (port 8080)
│   ├── pom.xml
│   └── src/main/java/com/dpi/
│       ├── DpiEngineApplication.java
│       ├── controller/
│       │   └── PcapController.java
│       ├── service/
│       │   ├── DpiService.java
│       │   ├── FileStorageService.java
│       │   └── OutputParserService.java
│       ├── model/
│       │   └── DpiResult.java
│       └── exception/
│           ├── GlobalExceptionHandler.java
│           ├── InvalidFileException.java
│           ├── EngineException.java
│           └── StorageException.java
└── frontend/                     # React (port 3000)
    ├── package.json
    └── src/
        ├── App.jsx
        ├── index.js
        ├── api/
        │   └── dpiApi.js
        └── components/
            ├── UploadPage.jsx
            ├── Dashboard.jsx
            ├── RulesPanel.jsx
            └── BlockedTrafficPanel.jsx
```

---

## ⚙️ How the DPI Engine Works

The engine reads each packet and performs:

1. **PCAP Reading** — opens file using `pcap_reader.h`
2. **Packet Parsing** — extracts Ethernet → IP → TCP/UDP headers
3. **SNI Extraction** — reads TLS ClientHello to get hostname (e.g. `youtube.com`) without decryption
4. **HTTP Host Extraction** — reads HTTP Host header for port-80 traffic
5. **App Classification** — maps domain to app: YouTube, Discord, Facebook, etc.
6. **Rule Checking** — compares packet against blocking rules
7. **Forward or Drop** — writes clean packets to output PCAP
8. **Report** — prints statistics to stdout for Java to parse

### Engine Command
```bash
dpi_simple.exe input.pcap output.pcap
dpi_simple.exe input.pcap output.pcap --block-app YouTube --block-domain facebook.com --block-ip 192.168.1.10
```

### Engine Output (stdout)
```
Total Packets:    77
TCP Packets:      73
UDP Packets:       4
Forwarded:        76
Dropped:           1

HTTPS    39  50.6%
YouTube   1   1.3%
DNS       4   5.2%

[Detected Domains/SNIs]
  - www.youtube.com -> YouTube
  - discord.com -> Discord
```

---

## 🔧 Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| GCC (MinGW/MSYS2) | 14.2+ |

---

## 🚀 Setup & Run

### Step 1 — Compile the C++ Engine

```bash
cd engine/Packet_analyzer-main

g++ -std=c++17 -O2 -static -I include -o build/dpi_simple.exe ^
    src/main_working.cpp ^
    src/pcap_reader.cpp ^
    src/packet_parser.cpp ^
    src/sni_extractor.cpp ^
    src/types.cpp
```

### Step 2 — Configure Backend

Edit `backend/src/main/resources/application.properties`:

```properties
server.port=8080
dpi.engine.path=C:/path/to/dpi-fullstack/engine/Packet_analyzer-main/build/dpi_simple.exe
dpi.engine.timeout=120
dpi.storage.upload=./storage/uploads/
dpi.storage.output=./storage/output/
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
```

### Step 3 — Start Backend

```bash
cd backend
mvn spring-boot:run
# Starts on http://localhost:8080
```

### Step 4 — Start Frontend

```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

### Step 5 — Test API (optional)

```bash
curl.exe -X POST http://localhost:8080/api/pcap/upload ^
  -F "file=@engine/Packet_analyzer-main/test_dpi.pcap"
```

Expected response:
```json
{
  "totalPackets": 77,
  "forwarded": 76,
  "dropped": 1,
  "protocols": { "TCP": 73, "UDP": 4 },
  "applications": { "YouTube": 1, "Discord": 1, "DNS": 4 },
  "blockedDetails": [{ "app": "YouTube", "domain": "www.youtube.com", "reason": "APP" }]
}
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pcap/upload` | Upload .pcap, run engine, return JSON |
| GET | `/api/stats` | Return last analysis result |
| GET | `/api/download` | Download filtered output PCAP |
| GET | `/api/rules` | Get all active blocking rules |
| POST | `/api/rules/app` | Add app blocking rule |
| POST | `/api/rules/ip` | Add IP blocking rule |
| POST | `/api/rules/domain` | Add domain blocking rule |
| POST | `/api/rules/port` | Add port blocking rule |
| PATCH | `/api/rules/{id}/toggle` | Enable or disable a rule |
| DELETE | `/api/rules/{id}` | Remove a specific rule |
| DELETE | `/api/rules` | Clear all rules |
| GET | `/api/health` | Backend health check |

---

## 🛡️ Rule Management

Four types of blocking rules are supported:

| Type | Example | CLI Flag | Description |
|------|---------|----------|-------------|
| APP | YouTube | `--block-app YouTube` | Blocks by SNI-detected application |
| IP | 192.168.1.10 | `--block-ip 192.168.1.10` | Blocks by source IP address |
| DOMAIN | facebook.com | `--block-domain facebook.com` | Blocks by domain substring match |
| PORT | 443 | `--block-port 443` | Blocks by destination port |

Rules are stored **in memory** (no database needed). They persist until the backend restarts.

---

## 📊 Dashboard Features

### 5-Tab Dashboard

**Overview Tab**
- 6 stat cards: Total Packets, Forwarded, Dropped, Active Flows, Apps Detected, Alerts
- Protocol Distribution pie chart (TCP vs UDP)
- Top Applications bar chart
- Protocol breakdown table with percentage bars

**Applications Tab**
- Grid of detected app cards with emoji icons
- Shows packet count per application

**Blocked Tab**
- Shows all blocked packets with Source IP, Dest IP, App, Domain, Block Reason, Rule Value
- Color-coded: 🔴 APP (pink) · DOMAIN (green) · IP (blue) · PORT (orange)
- Search bar and pagination (10 per page)
- Green "All Clear" message when nothing is blocked

**Domains Tab**
- All SNI domains detected in the capture
- Shows domain → application mapping
- 🟢 Allowed / 🔴 Blocked status per domain

**Rules Tab**
- Add / toggle / delete rules without leaving the dashboard
- App dropdown with 16+ known applications
- Shows all active rules with enable/disable controls

---

## 🔍 Key Concepts

### What is DPI?
Deep Packet Inspection examines packet **payload content** beyond just the header (IP + port). It identifies the actual application — YouTube, Discord — using SNI extraction from TLS handshakes.

### What is SNI?
**Server Name Indication** is a plain-text field in the TLS ClientHello message. Even though HTTPS traffic is encrypted, the SNI field reveals which website the client is connecting to. No decryption is needed.

### What is a Five-Tuple?
Every connection is uniquely identified by:
`Source IP + Destination IP + Source Port + Destination Port + Protocol`

### Why are Total Packets ≠ Forwarded?
The engine counts **all frames** in Total Packets (including ARP, ICMP, broadcast). It only forwards **TCP and UDP** packets to the output file. The difference is non-TCP/UDP frames — this is correct engine behavior.

---

## 🐛 Known Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| Garbled box characters in output | Windows CP1252 encoding | Strip non-ASCII: `replaceAll("[^\\x00-\\x7F]", "")` |
| `<optional>` compile error | Old GCC 6.3 | Install MSYS2 with GCC 14.2+ |
| CMake NMake generator error | Wrong generator selected | Delete CMakeCache.txt, use `-G "MinGW Makefiles"` |
| Engine exit -1073741701 | Missing runtime DLLs | Recompile with `-static` flag |
| `mvn` not found in VS Code | PATH not updated | Restart VS Code after adding Maven to PATH |

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

