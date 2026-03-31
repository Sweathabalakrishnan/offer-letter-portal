# 📄 Offer Letter Portal

A full-stack web application to manage employee offer letters, automate salary calculations, capture digital signatures, and generate multi-page PDF offer letters.

---

## 🚀 Features

- 🔍 Search & filter by employee name, branch, zone, and date
- ➕ Add / edit employee offer details
- 📄 Auto-generate document ID (year-based)
- 💰 Automatic salary calculations (frontend + backend)
- ✍️ Digital signature capture (canvas-based)
- 🧾 Multi-page offer letter generation
- 📥 PDF download using Puppeteer
- 🗄️ MySQL database integration

---

## 🛠️ Tech Stack

| Layer       | Technology |
|------------|-----------|
| Frontend   | React |
| Backend    | Node.js, Express |
| Database   | MySQL |
| PDF Engine | Puppeteer |
| Signature  | react-signature-canvas |

---

## 📁 Project Structure
offer-letter/
├── backend/
│ ├── public/
│ │ ├── images/
│ │ └── fonts/
│ ├── templates/
│ │ └── offerTemplate.html
│ ├── server.js
│ └── package.json
│
├── frontend/
│ ├── src/
│ │ ├── App.js
│ │ ├── index.js
│ │ └── styles.css
│ └── package.json
│
└── README.md


---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/offer-letter-portal.git
cd offer-letter-portal
2️⃣ Setup MySQL Database
CREATE DATABASE offer_letter_portal;
USE offer_letter_portal;

👉 Add signature column:

ALTER TABLE offer_letters ADD COLUMN candidate_signature LONGTEXT;
3️⃣ Backend Setup
cd backend
npm install

Install dependencies (if needed):

npm install express cors mysql2 dotenv number-to-words puppeteer
4️⃣ Create .env file (backend)
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=offer_letter_portal
5️⃣ Frontend Setup
cd ../frontend
npm install
npm install react-signature-canvas
6️⃣ Add Required Assets
backend/public/images/logo.png
backend/public/images/signature.png
backend/public/fonts/Spectral-Regular.ttf
backend/public/fonts/Spectral-Bold.ttf
7️⃣ Run Application
Start Backend
cd backend
npm start
Start Frontend
cd frontend
npm start
🌐 API Endpoints
Method	Endpoint	Description
GET	/api/offers	Get all offers
GET	/api/offers/:id	Get single offer
POST	/api/offers	Create offer
PUT	/api/offers/:id	Update offer
GET	/api/offers/:id/letter	View HTML letter
GET	/api/offers/:id/letter/pdf	Download PDF
💰 Salary Calculation Logic

Automatically calculates:

Basic (60%)
HRD (20%)
Other Allowance
Gross Salary
PF (Employee & Employer)
ESI (Employee & Employer)
Total Deduction
Take Home Salary
CTC & Annual CTC
✍️ Digital Signature
Draw signature using canvas
Stored as Base64 in MySQL
Rendered directly in PDF offer letter
📄 Offer Letter Output
Multi-page format (Section A–D)
Company logo + watermark
Signature included
Styled using Spectral font
Converted to PDF via Puppeteer
🔮 Future Enhancements
🔐 OTP verification
🪪 Aadhaar eSign integration
✍️ DocuSign integration
📧 Email offer letter to candidates
🔑 Role-based authentication
📌 Notes
Backend runs on http://localhost:4000
Frontend runs on http://localhost:3000
Puppeteer required for PDF generation
Signature stored as Base64 string
📃 License

This project is intended for internal business use.

👨‍💻 Author

Sweatha Balakrishnan



