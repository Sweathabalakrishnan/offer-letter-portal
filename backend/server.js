
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import numberToWords from "number-to-words";
import puppeteer from "puppeteer";

const { toWords } = numberToWords;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
);

app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "offer_letter_portal",
  waitForConnections: true,
  connectionLimit: 10
});

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function calculateSalary(input) {
  const grossPay = Number(input.grossPay || 0);
  const insurance = Number(input.insurance || 0);

  const basic = round2(grossPay * 0.6);
  const hrd = round2(grossPay * 0.2);
  const otherAllowance = round2(grossPay - (basic + hrd));
  const grossSalaryA = round2(basic + hrd + otherAllowance);

  const baseForPF = round2(basic + otherAllowance);

  const esiEmployee =
    grossSalaryA >= 21000 ? 0 : round2((grossSalaryA * 0.75) / 100);

  const pfEmployee =
    baseForPF >= 15000 ? 1800 : round2((baseForPF * 12) / 100);

  const totalDeduction = round2(esiEmployee + pfEmployee + insurance);
  const takeHome = round2(grossSalaryA - totalDeduction);

  const esiEmployer =
    grossSalaryA >= 21000 ? 0 : round2((grossSalaryA * 3.25) / 100);

  const pfEmployer =
    baseForPF >= 15000 ? 1800 : round2((baseForPF * 12) / 100);

  const totalDeductionB = round2(pfEmployer + esiEmployer);
  const ctc = round2(grossSalaryA + esiEmployer + pfEmployer);
  const annualCTC = round2(ctc * 12);

  return {
    grossPay,
    insurance,
    basic,
    hrd,
    otherAllowance,
    grossSalaryA,
    esiEmployee,
    pfEmployee,
    totalDeduction,
    takeHome,
    esiEmployer,
    pfEmployer,
    totalDeductionB,
    ctc,
    annualCTC
  };
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDateIndian(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function amountToWordsINR(value) {
  const amount = Math.round(Number(value || 0));
  if (!amount) return "Zero Rupees Only";
  const words = toWords(amount)
    .replace(/,/g, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${words} Rupees Only`;
}

function getSalutation(gender, maritalStatus) {
  const g = String(gender || "").toUpperCase();
  const m = String(maritalStatus || "").toUpperCase();

  if (g === "MALE") return "Mr.";
  if (g === "FEMALE" && m === "MARRIED") return "Mrs.";
  if (g === "FEMALE") return "Ms.";
  return "";
}

function getProbationPeriodText(probationPeriod) {
  const p = String(probationPeriod || "").trim();
  if (p === "3") return "Three months";
  if (p === "6") return "Six months";
  return `${p} months`;
}

function fillTemplate(template, data) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const value = data[key.trim()];
    return value === undefined || value === null ? "" : String(value);
  });
}

function mapDbRow(row) {
  return {
    id: row.id,
    documentId: row.document_id,
    empId: row.emp_id,
    phoneNumber: row.phone_number || "",
    mailId: row.mail_id || "",
    employeeName: row.employee_name || "",
    locationDepartment: row.location_department || "",
    branch: row.branch || "",
    zone: row.zone || "",
    teamName: row.team_name || "",
    designation: row.designation || "",
    doj: row.doj ? new Date(row.doj).toISOString().slice(0, 10) : "",
    gender: row.gender || "",
    maritalStatus: row.marital_status || "",
    grade: row.grade || "",
    date: row.offer_date ? new Date(row.offer_date).toISOString().slice(0, 10) : "",
    probationPeriod: row.probation_period || "",
    grossPay: Number(row.gross_pay || 0),
    insurance: Number(row.insurance || 0),
    basic: Number(row.basic || 0),
    hrd: Number(row.hrd || 0),
    otherAllowance: Number(row.other_allowance || 0),
    grossSalaryA: Number(row.gross_salary_a || 0),
    esiEmployee: Number(row.esi_employee || 0),
    pfEmployee: Number(row.pf_employee || 0),
    totalDeduction: Number(row.total_deduction || 0),
    takeHome: Number(row.take_home || 0),
    esiEmployer: Number(row.esi_employer || 0),
    pfEmployer: Number(row.pf_employer || 0),
    totalDeductionB: Number(row.total_deduction_b || 0),
    ctc: Number(row.ctc || 0),
    annualCTC: Number(row.annual_ctc || 0),

    candidateSignature: row.candidate_signature || ""
  };
}

async function generateDocumentId(offerDate) {
  const year = new Date(offerDate || Date.now()).getFullYear();
  const prefix = `Infonet Comm/HR/OL/${year}/`;

  const [rows] = await pool.query(
    `
    SELECT document_id
    FROM offer_letters
    WHERE document_id LIKE ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [`${prefix}%`]
  );

  let nextNumber = 1;

  if (rows.length > 0) {
    const lastDocumentId = rows[0].document_id || "";
    const lastPart = lastDocumentId.split("/").pop();
    const parsed = Number(lastPart);
    if (!Number.isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${nextNumber}`;
}

async function getOfferById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM offer_letters WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) return null;
  return rows[0];
}

function fileToDataUri(filePath) {
  try {
    if (!fs.existsSync(filePath)) return "";
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      ext === ".svg" ? "image/svg+xml" :
      ext === ".ttf" ? "font/ttf" :
      "application/octet-stream";

    const base64 = fs.readFileSync(filePath).toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch {
    return "";
  }
}

function buildTemplateData(row) {
  const logoPath = path.join(__dirname, "public", "images", "logo.png");
  const signaturePath = path.join(__dirname, "public", "images", "signature.png");
  const spectralRegularPath = path.join(__dirname, "public", "fonts", "Spectral-Regular.ttf");
  const spectralBoldPath = path.join(__dirname, "public", "fonts", "Spectral-Bold.ttf");

  const logoDataUri = fileToDataUri(logoPath);
  const signatureDataUri = fileToDataUri(signaturePath);
  const spectralRegularFont = fileToDataUri(spectralRegularPath);
  const spectralBoldFont = fileToDataUri(spectralBoldPath);
  
  

  return {
    logoUrl: logoDataUri,
    watermarkUrl: logoDataUri,
    signatureUrl: signatureDataUri,
    spectralRegularFont,
    spectralBoldFont,

    documentId: row.documentId,
    date: formatDateIndian(row.date),
    employeeName: row.employeeName,
    phoneNumber: row.phoneNumber,
    mailId: row.mailId,
    designation: row.designation,
    salutation: getSalutation(row.gender, row.maritalStatus),
    locationDepartment: row.locationDepartment,
    doj: formatDateIndian(row.doj),

    annualCTC: formatCurrency(row.annualCTC),
    grossPayInWords: amountToWordsINR(row.grossPay),
    probationPeriodText: getProbationPeriodText(row.probationPeriod),

    basic: formatCurrency(row.basic),
    hrd: formatCurrency(row.hrd),
    otherAllowance: formatCurrency(row.otherAllowance),
    grossSalaryA: formatCurrency(row.grossSalaryA),
    esiEmployee: formatCurrency(row.esiEmployee),
    pfEmployee: formatCurrency(row.pfEmployee),
    insurance: formatCurrency(row.insurance),
    totalDeduction: formatCurrency(row.totalDeduction),
    takeHome: formatCurrency(row.takeHome),
    esiEmployer: formatCurrency(row.esiEmployer),
    pfEmployer: formatCurrency(row.pfEmployer),
    totalDeductionB: formatCurrency(row.totalDeductionB),
    ctc: formatCurrency(row.ctc),
    candidateSignature: row.candidateSignature || ""
  };
}

app.get("/api/health", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    res.json({ ok: true, message: "Backend and MySQL are working" });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.get("/api/offers", async (req, res) => {
  try {
    const { employeeName, branch, zone, startDate, endDate } = req.query;

    let sql = `SELECT * FROM offer_letters WHERE 1=1`;
    const params = [];

    if (employeeName) {
      sql += ` AND employee_name LIKE ?`;
      params.push(`%${employeeName}%`);
    }

    if (branch) {
      sql += ` AND branch = ?`;
      params.push(branch);
    }

    if (zone) {
      sql += ` AND zone = ?`;
      params.push(zone);
    }

    if (startDate) {
      sql += ` AND offer_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND offer_date <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY id DESC`;

    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapDbRow));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/offers/:id", async (req, res) => {
  try {
    const row = await getOfferById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json(mapDbRow(row));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// app.post("/api/offers", async (req, res) => {
//   try {
//     const body = req.body;
//     const calculated = calculateSalary(body);
//     const documentId = await generateDocumentId(body.date);

//     const sql = `
//       INSERT INTO offer_letters (
//         document_id, emp_id, phone_number, mail_id, employee_name,
//         location_department, branch, zone, team_name, designation,
//         doj, gender, marital_status, grade, offer_date, probation_period,
//         gross_pay, insurance, basic, hrd, other_allowance, gross_salary_a,
//         esi_employee, pf_employee, total_deduction, take_home,
//         esi_employer, pf_employer, total_deduction_b, ctc, annual_ctc
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const params = [
//       documentId,
//       body.empId || "",
//       body.phoneNumber || "",
//       body.mailId || "",
//       body.employeeName || "",
//       body.locationDepartment || "",
//       body.branch || "",
//       body.zone || "",
//       body.teamName || "",
//       body.designation || "",
//       body.doj || null,
//       body.gender || "",
//       body.maritalStatus || "",
//       body.grade || "",
//       body.date || null,
//       body.probationPeriod || "",
//       calculated.grossPay,
//       calculated.insurance,
//       calculated.basic,
//       calculated.hrd,
//       calculated.otherAllowance,
//       calculated.grossSalaryA,
//       calculated.esiEmployee,
//       calculated.pfEmployee,
//       calculated.totalDeduction,
//       calculated.takeHome,
//       calculated.esiEmployer,
//       calculated.pfEmployer,
//       calculated.totalDeductionB,
//       calculated.ctc,
//       calculated.annualCTC,

//        body.signature || "" 
//     ];

//     const [result] = await pool.query(sql, params);
//     const row = await getOfferById(result.insertId);
//     res.status(201).json(mapDbRow(row));
//   } catch (error) {
//     if (error.code === "ER_DUP_ENTRY") {
//       return res.status(400).json({ message: "Document ID already exists" });
//     }
//     res.status(500).json({ message: error.message });
//   }
// });


app.post("/api/offers", async (req, res) => {
  try {
    const body = req.body;
    const calculated = calculateSalary(body);
    const documentId = await generateDocumentId(body.date);

    const sql = `
      INSERT INTO offer_letters (
        document_id,
        emp_id,
        phone_number,
        mail_id,
        employee_name,
        location_department,
        branch,
        zone,
        team_name,
        designation,
        doj,
        gender,
        marital_status,
        grade,
        offer_date,
        probation_period,
        gross_pay,
        insurance,
        basic,
        hrd,
        other_allowance,
        gross_salary_a,
        esi_employee,
        pf_employee,
        total_deduction,
        take_home,
        esi_employer,
        pf_employer,
        total_deduction_b,
        ctc,
        annual_ctc,
        candidate_signature
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      documentId,
      body.empId || "",
      body.phoneNumber || "",
      body.mailId || "",
      body.employeeName || "",
      body.locationDepartment || "",
      body.branch || "",
      body.zone || "",
      body.teamName || "",
      body.designation || "",
      body.doj || null,
      body.gender || "",
      body.maritalStatus || "",
      body.grade || "",
      body.date || null,
      body.probationPeriod || "",
      calculated.grossPay,
      calculated.insurance,
      calculated.basic,
      calculated.hrd,
      calculated.otherAllowance,
      calculated.grossSalaryA,
      calculated.esiEmployee,
      calculated.pfEmployee,
      calculated.totalDeduction,
      calculated.takeHome,
      calculated.esiEmployer,
      calculated.pfEmployer,
      calculated.totalDeductionB,
      calculated.ctc,
      calculated.annualCTC,
      body.signature || ""
    ];

    const [result] = await pool.query(sql, params);

    const [rows] = await pool.query(
      `SELECT * FROM offer_letters WHERE id = ?`,
      [result.insertId]
    );

    if (rows.length === 0) {
      return res.status(201).json({
        message: "Offer created successfully, but could not reload inserted row"
      });
    }

    res.status(201).json(mapDbRow(rows[0]));
  } catch (error) {
    console.error("CREATE OFFER ERROR:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "Document ID already exists"
      });
    }

    res.status(500).json({
      message: error.message || "Failed to create offer"
    });
  }
});



// app.put("/api/offers/:id", async (req, res) => {
//   try {
//     const body = req.body;
//     const existingRecord = await getOfferById(req.params.id);

//     if (!existingRecord) {
//       return res.status(404).json({ message: "Record not found" });
//     }
    
//     const calculated = calculateSalary(body);

//     const sql = `
//       UPDATE offer_letters SET
//         document_id = ?,
//         emp_id = ?,
//         phone_number = ?,
//         mail_id = ?,
//         employee_name = ?,
//         location_department = ?,
//         branch = ?,
//         zone = ?,
//         team_name = ?,
//         designation = ?,
//         doj = ?,
//         gender = ?,
//         marital_status = ?,
//         grade = ?,
//         offer_date = ?,
//         probation_period = ?,
//         gross_pay = ?,
//         insurance = ?,
//         basic = ?,
//         hrd = ?,
//         other_allowance = ?,
//         gross_salary_a = ?,
//         esi_employee = ?,
//         pf_employee = ?,
//         total_deduction = ?,
//         take_home = ?,
//         esi_employer = ?,
//         pf_employer = ?,
//         total_deduction_b = ?,
//         ctc = ?,
//         annual_ctc = ?
//       WHERE id = ?
//     `;

//     const params = [
//       existingRecord.document_id,
//       body.empId || "",
//       body.phoneNumber || "",
//       body.mailId || "",
//       body.employeeName || "",
//       body.locationDepartment || "",
//       body.branch || "",
//       body.zone || "",
//       body.teamName || "",
//       body.designation || "",
//       body.doj || null,
//       body.gender || "",
//       body.maritalStatus || "",
//       body.grade || "",
//       body.date || null,
//       body.probationPeriod || "",
//       calculated.grossPay,
//       calculated.insurance,
//       calculated.basic,
//       calculated.hrd,
//       calculated.otherAllowance,
//       calculated.grossSalaryA,
//       calculated.esiEmployee,
//       calculated.pfEmployee,
//       calculated.totalDeduction,
//       calculated.takeHome,
//       calculated.esiEmployer,
//       calculated.pfEmployer,
//       calculated.totalDeductionB,
//       calculated.ctc,
//       calculated.annualCTC,
//       req.params.id
//     ];

//     await pool.query(sql, params);
//     const updated = await getOfferById(req.params.id);
//     res.json(mapDbRow(updated));
//   } catch (error) {
//     if (error.code === "ER_DUP_ENTRY") {
//       return res.status(400).json({ message: "Document ID already exists" });
//     }
//     res.status(500).json({ message: error.message });
//   }
// });
app.put("/api/offers/:id", async (req, res) => {
  try {
    const body = req.body;

    const [existingRows] = await pool.query(
      `SELECT * FROM offer_letters WHERE id = ?`,
      [req.params.id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    const existingRecord = existingRows[0];

    const calculated = calculateSalary(body);

    const sql = `
      UPDATE offer_letters SET
        document_id = ?,
        emp_id = ?,
        phone_number = ?,
        mail_id = ?,
        employee_name = ?,
        location_department = ?,
        branch = ?,
        zone = ?,
        team_name = ?,
        designation = ?,
        doj = ?,
        gender = ?,
        marital_status = ?,
        grade = ?,
        offer_date = ?,
        probation_period = ?,
        gross_pay = ?,
        insurance = ?,
        basic = ?,
        hrd = ?,
        other_allowance = ?,
        gross_salary_a = ?,
        esi_employee = ?,
        pf_employee = ?,
        total_deduction = ?,
        take_home = ?,
        esi_employer = ?,
        pf_employer = ?,
        total_deduction_b = ?,
        ctc = ?,
        annual_ctc = ?,
        candidate_signature = ?
      WHERE id = ?
    `;

    const params = [
      existingRecord.document_id,
      body.empId || "",
      body.phoneNumber || "",
      body.mailId || "",
      body.employeeName || "",
      body.locationDepartment || "",
      body.branch || "",
      body.zone || "",
      body.teamName || "",
      body.designation || "",
      body.doj || null,
      body.gender || "",
      body.maritalStatus || "",
      body.grade || "",
      body.date || null,
      body.probationPeriod || "",
      calculated.grossPay,
      calculated.insurance,
      calculated.basic,
      calculated.hrd,
      calculated.otherAllowance,
      calculated.grossSalaryA,
      calculated.esiEmployee,
      calculated.pfEmployee,
      calculated.totalDeduction,
      calculated.takeHome,
      calculated.esiEmployer,
      calculated.pfEmployer,
      calculated.totalDeductionB,
      calculated.ctc,
      calculated.annualCTC,

      body.signature || existingRecord.candidate_signature, // ✅ IMPORTANT

      req.params.id
    ];

    await pool.query(sql, params);

    const [updatedRows] = await pool.query(
      `SELECT * FROM offer_letters WHERE id = ?`,
      [req.params.id]
    );

    res.json(mapDbRow(updatedRows[0]));
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


app.get("/api/offers/:id/letter", async (req, res) => {
  try {
    const dbRow = await getOfferById(req.params.id);
    if (!dbRow) {
      return res.status(404).send("Record not found");
    }

    const row = mapDbRow(dbRow);
    const templatePath = path.join(__dirname, "templates", "offerTemplate.html");
    const template = fs.readFileSync(templatePath, "utf8");
    const html = fillTemplate(template, buildTemplateData(row));

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    res.status(500).send(error.message || "Failed to generate offer letter");
  }
});

app.get("/api/offers/:id/letter/pdf", async (req, res) => {
  let browser;

  try {
    console.log("Generating PDF for ID:", req.params.id);

    const dbRow = await getOfferById(req.params.id);
    if (!dbRow) {
      return res.status(404).send("Record not found");
    }

    const row = mapDbRow(dbRow);
    const templatePath = path.join(__dirname, "templates", "offerTemplate.html");
    const template = fs.readFileSync(templatePath, "utf8");
    const html = fillTemplate(template, buildTemplateData(row));

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });

    await page.setContent(html, {
      waitUntil: "domcontentloaded"
    });

    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm"
      }
    });

    await browser.close();
    browser = null;

    const safeName = String(row.documentId || "offer-letter").replace(/[\\/:*?"<>|]/g, "-");

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}.pdf"`,
      "Content-Length": pdfBuffer.length
    });

    res.end(pdfBuffer);
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    res.status(500).send(error.message || "Failed to generate PDF");
  }
});

app.listen(PORT, async () => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected successfully");
    connection.release();
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
  }
});