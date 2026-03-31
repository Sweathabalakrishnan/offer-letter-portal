


// import React, { useEffect, useMemo, useState } from "react";

// const API_URL = "http://localhost:4000/api/offers";

// const emptyForm = {
//   id: null,
//   documentId: "",
  
//   phoneNumber: "",
//   mailId: "",
//   employeeName: "",
//   locationDepartment: "",
//   branch: "",
//   zone: "",
//   teamName: "",
//   designation: "",
//   doj: "",
//   gender: "",
//   maritalStatus: "",
//   grade: "",
//   date: "",
//   probationPeriod: "",
//   grossPay: "",
//   insurance: 0,
//   basic: 0,
//   hrd: 0,
//   otherAllowance: 0,
//   grossSalaryA: 0,
//   esiEmployee: 0,
//   pfEmployee: 0,
//   totalDeduction: 0,
//   takeHome: 0,
//   esiEmployer: 0,
//   pfEmployer: 0,
//   totalDeductionB: 0,
//   ctc: 0,
//   annualCTC: 0
// };

// function round2(value) {
//   return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
// }

// function calculateSalary(input) {
//   const grossPay = Number(input.grossPay || 0);
//   const insurance = Number(input.insurance || 0);

//   const basic = round2(grossPay * 0.6);
//   const hrd = round2(grossPay * 0.2);
//   const otherAllowance = round2(grossPay - (basic + hrd));
//   const grossSalaryA = round2(basic + hrd + otherAllowance);

//   const baseForPF = round2(basic + otherAllowance);

//   const esiEmployee =
//     grossSalaryA >= 21000 ? 0 : round2((grossSalaryA * 0.75) / 100);

//   const pfEmployee =
//     baseForPF >= 15000 ? 1800 : round2((baseForPF * 12) / 100);

//   const totalDeduction = round2(esiEmployee + pfEmployee + insurance);
//   const takeHome = round2(grossSalaryA - totalDeduction);

//   const esiEmployer =
//     grossSalaryA >= 21000 ? 0 : round2((grossSalaryA * 3.25) / 100);

//   const pfEmployer =
//     baseForPF >= 15000 ? 1800 : round2((baseForPF * 12) / 100);

//   const totalDeductionB = round2(pfEmployer + esiEmployer);
//   const ctc = round2(grossSalaryA + esiEmployer + pfEmployer);
//   const annualCTC = round2(ctc * 12);

//   return {
//     basic,
//     hrd,
//     otherAllowance,
//     grossSalaryA,
//     esiEmployee,
//     pfEmployee,
//     totalDeduction,
//     takeHome,
//     esiEmployer,
//     pfEmployer,
//     totalDeductionB,
//     ctc,
//     annualCTC
//   };
// }

// function currency(value) {
//   return `₹ ${Number(value || 0).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   })}`;
// }

// function toDateInputValue(value) {
//   if (!value) return "";
//   if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
//     return value;
//   }

//   if (typeof value === "string") {
//     const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
//     if (match) {
//       return `${match[3]}-${match[2]}-${match[1]}`;
//     }
//   }

//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return "";
//   return d.toISOString().slice(0, 10);
// }

// function Field({
//   label,
//   name,
//   value,
//   onChange,
//   type = "text",
//   required = false,
//   readOnly = false
// }) {
//   return (
//     <div className="form-field">
//       <label>{label}</label>
//       <input
//         type={type}
//         name={name}
//         value={value ?? ""}
//         onChange={onChange}
//         required={required}
//         readOnly={readOnly}
//       />
//     </div>
//   );
// }

// function SelectField({
//   label,
//   name,
//   value,
//   onChange,
//   options,
//   required = false
// }) {
//   return (
//     <div className="form-field">
//       <label>{label}</label>
//       <select
//         name={name}
//         value={value ?? ""}
//         onChange={onChange}
//         required={required}
//       >
//         <option value="">Select</option>
//         {options.map((item) => (
//           <option key={item} value={item}>
//             {item}
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// }

// function ReadOnlyField({ label, value }) {
//   return (
//     <div className="form-field">
//       <label>{label}</label>
//       <input className="readonly" type="text" value={currency(value)} readOnly />
//     </div>
//   );
// }

// function App() {
//   const [rows, setRows] = useState([]);
//   const [filters, setFilters] = useState({
//     employeeName: "",
//     branch: "",
//     zone: "",
//     startDate: "",
//     endDate: ""
//   });
//   const [form, setForm] = useState({
//     ...emptyForm,
//     date: new Date().toISOString().slice(0, 10)
//   });
//   const [open, setOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");

//   const salaryValues = useMemo(
//     () => calculateSalary(form),
//     [form.grossPay, form.insurance]
//   );

//   useEffect(() => {
//     setForm((prev) => ({
//       ...prev,
//       ...salaryValues
//     }));
//   }, [salaryValues]);

//   useEffect(() => {
//     fetchOffers();
//   }, []);

//   useEffect(() => {
//     if (open) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "auto";
//     }

//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, [open]);

//   async function parseResponse(response) {
//     const text = await response.text();
//     try {
//       return text ? JSON.parse(text) : {};
//     } catch {
//       throw new Error(text || "Invalid server response");
//     }
//   }

//   async function fetchOffers(customFilters = filters) {
//     try {
//       setLoading(true);
//       setErrorMessage("");

//       const params = new URLSearchParams();

//       if (customFilters.employeeName)
//   params.append("employeeName", customFilters.employeeName);
//       if (customFilters.branch) params.append("branch", customFilters.branch);
//       if (customFilters.zone) params.append("zone", customFilters.zone);
//       if (customFilters.startDate) params.append("startDate", customFilters.startDate);
//       if (customFilters.endDate) params.append("endDate", customFilters.endDate);

//       const response = await fetch(`${API_URL}?${params.toString()}`);
//       const data = await parseResponse(response);

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to fetch records");
//       }

//       setRows(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("FETCH OFFERS ERROR:", error);
//       setRows([]);
//       setErrorMessage(error.message || "Failed to fetch backend data");
//     } finally {
//       setLoading(false);
//     }
//   }

//   function handleFilterChange(e) {
//     const { name, value } = e.target;
//     setFilters((prev) => ({
//       ...prev,
//       [name]: value
//     }));
//   }

//   function handleSearch() {
//     fetchOffers(filters);
//   }

//   function resetFilters() {
//     const reset = {
//       // empId: "",
//       branch: "",
//       zone: "",
//       startDate: "",
//       endDate: ""
//     };
//     setFilters(reset);
//     fetchOffers(reset);
//   }

//   function openAddModal() {
//     setErrorMessage("");
//     setForm({
//       ...emptyForm,
//       date: new Date().toISOString().slice(0, 10),
//       doj: ""
//     });
//     setOpen(true);
//   }

//   async function openEditModal(id) {
//     try {
//       setErrorMessage("");
//       const response = await fetch(`${API_URL}/${id}`);
//       const data = await parseResponse(response);

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to fetch record");
//       }

//       setForm({
//         ...emptyForm,
//         ...data,
//         doj: toDateInputValue(data.doj),
//         date: toDateInputValue(data.date)
//       });
//       setOpen(true);
//     } catch (error) {
//       console.error("OPEN EDIT ERROR:", error);
//       setErrorMessage(error.message || "Failed to open record");
//     }
//   }

//   function closeModal() {
//     setOpen(false);
//     setForm({
//       ...emptyForm,
//       date: new Date().toISOString().slice(0, 10)
//     });
//   }

//   function handleFormChange(e) {
//     const { name, value } = e.target;

//     setForm((prev) => ({
//       ...prev,
//       [name]:
//         name === "grossPay" || name === "insurance"
//           ? value === ""
//             ? ""
//             : Number(value)
//           : value
//     }));
//   }

//   async function handleSubmit(e) {
//     if (e && typeof e.preventDefault === "function") {
//       e.preventDefault();
//     }

//     try {
//       setSaving(true);
//       setErrorMessage("");

//       const method = form.id ? "PUT" : "POST";
//       const url = form.id ? `${API_URL}/${form.id}` : API_URL;

//       const payload = {
//         ...form,
//         documentId: String(form.documentId || "").trim(),
        
//         phoneNumber: String(form.phoneNumber || "").trim(),
//         mailId: String(form.mailId || "").trim(),
//         employeeName: String(form.employeeName || "").trim(),
//         locationDepartment: String(form.locationDepartment || "").trim(),
//         branch: String(form.branch || "").trim(),
//         zone: String(form.zone || "").trim(),
//         teamName: String(form.teamName || "").trim(),
//         designation: String(form.designation || "").trim(),
//         doj: toDateInputValue(form.doj),
//         gender: String(form.gender || "").trim(),
//         maritalStatus: String(form.maritalStatus || "").trim(),
//         grade: String(form.grade || "").trim(),
//         date: toDateInputValue(form.date),
//         probationPeriod: String(form.probationPeriod || "").trim(),
//         grossPay: Number(form.grossPay || 0),
//         insurance: Number(form.insurance || 0)
//       };

//       const response = await fetch(url, {
//         method,
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify(payload)
//       });

//       const data = await parseResponse(response);

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to save record");
//       }

//       closeModal();
//       fetchOffers();
//     } catch (error) {
//       console.error("SAVE ERROR:", error);
//       setErrorMessage(error.message || "Failed to save record");
//     } finally {
//       setSaving(false);
//     }
//   }

//   function viewLetter(id) {
//     window.open(`http://localhost:4000/api/offers/${id}/letter/pdf`, "_blank");
//   }

//   return (
//     <div className="container">
//       <h1 className="page-title">Offer Letter Portal</h1>

//       {errorMessage && <div className="error-box">{errorMessage}</div>}

//       <div className="toolbar">
//         <div className="toolbar-group">
//           <label>Employee Name</label>
//           <input
//   name="employeeName"
//   value={filters.employeeName}
//   onChange={handleFilterChange}
//   placeholder="Search by Employee Name"
// />
//         </div>

//         <div className="toolbar-group">
//           <label>Branch</label>
//           <input
//             name="branch"
//             value={filters.branch}
//             onChange={handleFilterChange}
//             placeholder="Enter branch"
//           />
//         </div>

//         <div className="toolbar-group">
//           <label>Zone</label>
//           <input
//             name="zone"
//             value={filters.zone}
//             onChange={handleFilterChange}
//             placeholder="Enter zone"
//           />
//         </div>

//         <div className="toolbar-group">
//           <label>Start Date</label>
//           <input
//             type="date"
//             name="startDate"
//             value={filters.startDate}
//             onChange={handleFilterChange}
//           />
//         </div>

//         <div className="toolbar-group">
//           <label>End Date</label>
//           <input
//             type="date"
//             name="endDate"
//             value={filters.endDate}
//             onChange={handleFilterChange}
//           />
//         </div>

//         <button type="button" className="btn btn-secondary" onClick={handleSearch}>
//           Search
//         </button>

//         <button type="button" className="btn btn-light" onClick={resetFilters}>
//           Reset
//         </button>

//         <button type="button" className="btn btn-primary btn-add" onClick={openAddModal}>
//           + Add
//         </button>
//       </div>

//       <div className="table-wrap">
//         <table>
//           <thead>
//             <tr>
//               <th>Document ID</th>
//               {/* <th>Emp ID</th> */}
//               <th>Employee Name</th>
//               <th>Phone Number</th>
//               <th>Mail ID</th>
//               <th>Location/Department</th>
//               <th>Branch</th>
//               <th>Zone</th>
//               <th>Team Name</th>
//               <th>Designation</th>
//               <th>DOJ</th>
//               <th>Gender</th>
//               <th>Marital Status</th>
//               <th>Grade</th>
//               <th>Date</th>
//               <th>Gross Pay</th>
//               <th>Take Home</th>
//               <th>CTC</th>
//               <th>Annual CTC</th>
//               <th>Letter</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td className="center" colSpan="20">
//                   Loading...
//                 </td>
//               </tr>
//             ) : rows.length === 0 ? (
//               <tr>
//                 <td className="center" colSpan="20">
//                   No records found
//                 </td>
//               </tr>
//             ) : (
//               rows.map((row) => (
//                 <tr key={row.id}>
//                   <td>
//                     <button
//                       className="link-btn"
//                       type="button"
//                       onClick={() => openEditModal(row.id)}
//                     >
//                       {row.documentId}
//                     </button>
//                   </td>
                 
//                   <td>{row.employeeName}</td>
//                   <td>{row.phoneNumber}</td>
//                   <td>{row.mailId}</td>
//                   <td>{row.locationDepartment}</td>
//                   <td>{row.branch}</td>
//                   <td>{row.zone}</td>
//                   <td>{row.teamName}</td>
//                   <td>{row.designation}</td>
//                   <td>{row.doj}</td>
//                   <td>{row.gender}</td>
//                   <td>{row.maritalStatus}</td>
//                   <td>{row.grade}</td>
//                   <td>{row.date}</td>
//                   <td>{currency(row.grossPay)}</td>
//                   <td>{currency(row.takeHome)}</td>
//                   <td>{currency(row.ctc)}</td>
//                   <td>{currency(row.annualCTC)}</td>
//                   <td>
//                     <button
//                       type="button"
//                       className="btn btn-secondary"
//                       onClick={() => viewLetter(row.id)}
//                     >
//                       View Letter
//                     </button>
//                     {/* <button onClick={() => viewLetter(row.id)}>View Letter</button> */}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {open && (
//         <div className="modal-backdrop" onClick={closeModal}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <form className="form-shell" onSubmit={handleSubmit}>
//               <div className="modal-header">
//                 <h2 className="modal-title">
//                   {form.id ? "Edit Offer Letter Data" : "Add Offer Letter Data"}
//                 </h2>

//                 <div className="modal-actions">
//                   <button
//                     type="button"
//                     className="btn btn-light"
//                     onClick={closeModal}
//                     disabled={saving}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="btn btn-primary"
//                     disabled={saving}
//                   >
//                     {saving ? "Saving..." : "Save"}
//                   </button>
//                 </div>
//               </div>

//               <div className="form-grid">
//                 <Field
//                   label="Document ID"
//                   name="documentId"
//                   value={form.documentId}
//                   onChange={handleFormChange}
//                 />
              
//                 <Field
//                   label="Phone Number *"
//                   name="phoneNumber"
//                   value={form.phoneNumber}
//                   onChange={handleFormChange}
//                   required
//                 />
//                 <Field
//                   label="Mail ID *"
//                   name="mailId"
//                   value={form.mailId}
//                   onChange={handleFormChange}
//                   required
//                 />
//                 <Field
//                   label="Employee Name *"
//                   name="employeeName"
//                   value={form.employeeName}
//                   onChange={handleFormChange}
//                   required
//                 />
//                 <Field
//                   label="Location/Department *"
//                   name="locationDepartment"
//                   value={form.locationDepartment}
//                   onChange={handleFormChange}
//                   required
//                 />
//                 <Field
//                   label="Branch"
//                   name="branch"
//                   value={form.branch}
//                   onChange={handleFormChange}
//                 />
//                 <Field
//                   label="Zone"
//                   name="zone"
//                   value={form.zone}
//                   onChange={handleFormChange}
//                 />
//                 <Field
//                   label="Designation *"
//                   name="designation"
//                   value={form.designation}
//                   onChange={handleFormChange}
//                   required
//                 />
//                 <Field
//                   label="Team Name *"
//                   name="teamName"
//                   value={form.teamName}
//                   onChange={handleFormChange}
//                   required
//                 />
//                 <Field
//                   label="DOJ *"
//                   type="date"
//                   name="doj"
//                   value={toDateInputValue(form.doj)}
//                   onChange={handleFormChange}
//                   required
//                 />
//                 <SelectField
//                   label="Gender *"
//                   name="gender"
//                   value={form.gender}
//                   onChange={handleFormChange}
//                   options={["MALE", "FEMALE"]}
//                   required
//                 />
//                 <SelectField
//                   label="Marital Status"
//                   name="maritalStatus"
//                   value={form.maritalStatus}
//                   onChange={handleFormChange}
//                   options={["MARRIED", "UN MARRIED"]}
//                 />
//                 <SelectField
//                   label="Grade *"
//                   name="grade"
//                   value={form.grade}
//                   onChange={handleFormChange}
//                   options={[
//                     "Trainee",
//                     "G08",
//                     "G07",
//                     "G06",
//                     "G05",
//                     "G04",
//                     "G03",
//                     "G02",
//                     "G01"
//                   ]}
//                   required
//                 />
//                 <Field
//                   label="Date *"
//                   type="date"
//                   name="date"
//                   value={toDateInputValue(form.date)}
//                   onChange={handleFormChange}
//                   required
//                 />
//                 <SelectField
//                   label="Probation Period *"
//                   name="probationPeriod"
//                   value={form.probationPeriod}
//                   onChange={handleFormChange}
//                   options={["3", "6"]}
//                   required
//                 />
//                 <Field
//                   label="Gross Pay *"
//                   type="number"
//                   name="grossPay"
//                   value={form.grossPay}
//                   onChange={handleFormChange}
//                   required
//                 />
//                 <Field
//                   label="Insurance"
//                   type="number"
//                   name="insurance"
//                   value={form.insurance}
//                   onChange={handleFormChange}
//                 />

//                 <ReadOnlyField label="Basic" value={form.basic} />
//                 <ReadOnlyField label="HRD" value={form.hrd} />
//                 <ReadOnlyField label="Other Allowance" value={form.otherAllowance} />
//                 <ReadOnlyField label="Gross Salary A" value={form.grossSalaryA} />
//                 <ReadOnlyField label="ESI - Employee" value={form.esiEmployee} />
//                 <ReadOnlyField label="PF - Employee" value={form.pfEmployee} />
//                 <ReadOnlyField label="Total Deduction" value={form.totalDeduction} />
//                 <ReadOnlyField label="Take Home" value={form.takeHome} />
//                 <ReadOnlyField label="ESI - Employer" value={form.esiEmployer} />
//                 <ReadOnlyField label="PF - Employer" value={form.pfEmployer} />
//                 <ReadOnlyField label="Total Deduction B" value={form.totalDeductionB} />
//                 <ReadOnlyField label="CTC" value={form.ctc} />
//                 <ReadOnlyField label="Annual CTC" value={form.annualCTC} />
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;



import React, { useEffect, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

const API_URL = "http://localhost:4000/api/offers";

const emptyForm = {
  id: null,
  documentId: "",
  empId: "",
  phoneNumber: "",
  mailId: "",
  employeeName: "",
  locationDepartment: "",
  branch: "",
  zone: "",
  teamName: "",
  designation: "",
  doj: "",
  gender: "",
  maritalStatus: "",
  grade: "",
  date: "",
  probationPeriod: "",
  grossPay: "",
  insurance: 0,
  basic: 0,
  hrd: 0,
  otherAllowance: 0,
  grossSalaryA: 0,
  esiEmployee: 0,
  pfEmployee: 0,
  totalDeduction: 0,
  takeHome: 0,
  esiEmployer: 0,
  pfEmployer: 0,
  totalDeductionB: 0,
  ctc: 0,
  annualCTC: 0,
  candidateSignature: ""
};

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

function currency(value) {
  return `₹ ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function toDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  readOnly = false
}) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false
}) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
      >
        <option value="">Select</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <input className="readonly" type="text" value={currency(value)} readOnly />
    </div>
  );
}

function App() {
  const sigRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    employeeName: "",
    branch: "",
    zone: "",
    startDate: "",
    endDate: ""
  });
  const [form, setForm] = useState({
    ...emptyForm,
    date: new Date().toISOString().slice(0, 10)
  });
  const [signature, setSignature] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const salaryValues = useMemo(
    () => calculateSalary(form),
    [form.grossPay, form.insurance]
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      ...salaryValues
    }));
  }, [salaryValues]);

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  async function parseResponse(response) {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error(text || "Invalid server response");
    }
  }

  async function fetchOffers(customFilters = filters) {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = new URLSearchParams();

      if (customFilters.employeeName) {
        params.append("employeeName", customFilters.employeeName);
      }
      if (customFilters.branch) {
        params.append("branch", customFilters.branch);
      }
      if (customFilters.zone) {
        params.append("zone", customFilters.zone);
      }
      if (customFilters.startDate) {
        params.append("startDate", customFilters.startDate);
      }
      if (customFilters.endDate) {
        params.append("endDate", customFilters.endDate);
      }

      const response = await fetch(`${API_URL}?${params.toString()}`);
      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch records");
      }

      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("FETCH OFFERS ERROR:", error);
      setRows([]);
      setErrorMessage(error.message || "Failed to fetch backend data");
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleSearch() {
    fetchOffers(filters);
  }

  function resetFilters() {
    const reset = {
      employeeName: "",
      branch: "",
      zone: "",
      startDate: "",
      endDate: ""
    };
    setFilters(reset);
    fetchOffers(reset);
  }

  function openAddModal() {
    setErrorMessage("");
    setSignature("");
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10),
      doj: ""
    });

    if (sigRef.current) {
      sigRef.current.clear();
    }

    setOpen(true);
  }

  async function openEditModal(id) {
    try {
      setErrorMessage("");
      const response = await fetch(`${API_URL}/${id}`);
      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch record");
      }

      setForm({
        ...emptyForm,
        ...data,
        candidateSignature: data.candidateSignature || "",
        doj: toDateInputValue(data.doj),
        date: toDateInputValue(data.date)
      });

      setSignature(data.candidateSignature || "");

      if (sigRef.current) {
        sigRef.current.clear();
      }

      setOpen(true);
    } catch (error) {
      console.error("OPEN EDIT ERROR:", error);
      setErrorMessage(error.message || "Failed to open record");
    }
  }

  function closeModal() {
    setOpen(false);
    setSignature("");
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10)
    });

    if (sigRef.current) {
      sigRef.current.clear();
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "grossPay" || name === "insurance"
          ? value === ""
            ? ""
            : Number(value)
          : value
    }));
  }

  function saveSignature() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErrorMessage("Please draw candidate signature before saving it.");
      return;
    }

    const dataURL = sigRef.current.toDataURL("image/png");
    setSignature(dataURL);
    setForm((prev) => ({
      ...prev,
      candidateSignature: dataURL
    }));
    setErrorMessage("");
  }

  function clearSignature() {
    if (sigRef.current) {
      sigRef.current.clear();
    }
    setSignature("");
    setForm((prev) => ({
      ...prev,
      candidateSignature: ""
    }));
  }

  async function handleSubmit(e) {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    try {
      setSaving(true);
      setErrorMessage("");

      let candidateSignature = signature || form.candidateSignature || "";

      if (sigRef.current && !sigRef.current.isEmpty()) {
        candidateSignature = sigRef.current.toDataURL("image/png");
      }

      const method = form.id ? "PUT" : "POST";
      const url = form.id ? `${API_URL}/${form.id}` : API_URL;

      const payload = {
        ...form,
        documentId: String(form.documentId || "").trim(),
        empId: String(form.empId || "").trim(),
        phoneNumber: String(form.phoneNumber || "").trim(),
        mailId: String(form.mailId || "").trim(),
        employeeName: String(form.employeeName || "").trim(),
        locationDepartment: String(form.locationDepartment || "").trim(),
        branch: String(form.branch || "").trim(),
        zone: String(form.zone || "").trim(),
        teamName: String(form.teamName || "").trim(),
        designation: String(form.designation || "").trim(),
        doj: toDateInputValue(form.doj),
        gender: String(form.gender || "").trim(),
        maritalStatus: String(form.maritalStatus || "").trim(),
        grade: String(form.grade || "").trim(),
        date: toDateInputValue(form.date),
        probationPeriod: String(form.probationPeriod || "").trim(),
        grossPay: Number(form.grossPay || 0),
        insurance: Number(form.insurance || 0),
        signature:signature || form.candidateSignature
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to save record");
      }

      closeModal();
      fetchOffers();
    } catch (error) {
      console.error("SAVE ERROR:", error);
      setErrorMessage(error.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  }

  function viewLetter(id) {
    window.open(`http://localhost:4000/api/offers/${id}/letter/pdf`, "_blank");
  }

  return (
    <div className="container">
      <h1 className="page-title">Offer Letter Portal</h1>

      {errorMessage && <div className="error-box">{errorMessage}</div>}

      <div className="toolbar">
        <div className="toolbar-group">
          <label>Employee Name</label>
          <input
            name="employeeName"
            value={filters.employeeName}
            onChange={handleFilterChange}
            placeholder="Search by Employee Name"
          />
        </div>

        <div className="toolbar-group">
          <label>Branch</label>
          <input
            name="branch"
            value={filters.branch}
            onChange={handleFilterChange}
            placeholder="Enter branch"
          />
        </div>

        <div className="toolbar-group">
          <label>Zone</label>
          <input
            name="zone"
            value={filters.zone}
            onChange={handleFilterChange}
            placeholder="Enter zone"
          />
        </div>

        <div className="toolbar-group">
          <label>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>

        <div className="toolbar-group">
          <label>End Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>

        <button type="button" className="btn btn-secondary" onClick={handleSearch}>
          Search
        </button>

        <button type="button" className="btn btn-light" onClick={resetFilters}>
          Reset
        </button>

        <button type="button" className="btn btn-primary btn-add" onClick={openAddModal}>
          + Add
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document ID</th>
              <th>Employee Name</th>
              <th>Phone Number</th>
              <th>Mail ID</th>
              <th>Location/Department</th>
              <th>Branch</th>
              <th>Zone</th>
              <th>Team Name</th>
              <th>Designation</th>
              <th>DOJ</th>
              <th>Gender</th>
              <th>Marital Status</th>
              <th>Grade</th>
              <th>Date</th>
              <th>Gross Pay</th>
              <th>Take Home</th>
              <th>CTC</th>
              <th>Annual CTC</th>
              <th>Letter</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="center" colSpan="19">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="center" colSpan="19">
                  No records found
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => openEditModal(row.id)}
                    >
                      {row.documentId}
                    </button>
                  </td>
                  <td>{row.employeeName}</td>
                  <td>{row.phoneNumber}</td>
                  <td>{row.mailId}</td>
                  <td>{row.locationDepartment}</td>
                  <td>{row.branch}</td>
                  <td>{row.zone}</td>
                  <td>{row.teamName}</td>
                  <td>{row.designation}</td>
                  <td>{row.doj}</td>
                  <td>{row.gender}</td>
                  <td>{row.maritalStatus}</td>
                  <td>{row.grade}</td>
                  <td>{row.date}</td>
                  <td>{currency(row.grossPay)}</td>
                  <td>{currency(row.takeHome)}</td>
                  <td>{currency(row.ctc)}</td>
                  <td>{currency(row.annualCTC)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => viewLetter(row.id)}
                    >
                      View Letter
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form className="form-shell" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {form.id ? "Edit Offer Letter Data" : "Add Offer Letter Data"}
                </h2>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="form-grid">
                <Field
                  label="Document ID"
                  name="documentId"
                  value={form.documentId}
                  onChange={handleFormChange}
                  readOnly
                />
                <Field
                  label="Emp ID *"
                  name="empId"
                  value={form.empId}
                  onChange={handleFormChange}
                  required
                />
                <Field
                  label="Phone Number *"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleFormChange}
                  required
                />
                <Field
                  label="Mail ID *"
                  name="mailId"
                  value={form.mailId}
                  onChange={handleFormChange}
                  required
                />
                <Field
                  label="Employee Name *"
                  name="employeeName"
                  value={form.employeeName}
                  onChange={handleFormChange}
                  required
                />
                <Field
                  label="Location/Department *"
                  name="locationDepartment"
                  value={form.locationDepartment}
                  onChange={handleFormChange}
                  required
                />
                <Field
                  label="Branch"
                  name="branch"
                  value={form.branch}
                  onChange={handleFormChange}
                />
                <Field
                  label="Zone"
                  name="zone"
                  value={form.zone}
                  onChange={handleFormChange}
                />
                <Field
                  label="Designation *"
                  name="designation"
                  value={form.designation}
                  onChange={handleFormChange}
                  required
                />
                <Field
                  label="Team Name *"
                  name="teamName"
                  value={form.teamName}
                  onChange={handleFormChange}
                  required
                />
                <Field
                  label="DOJ *"
                  type="date"
                  name="doj"
                  value={toDateInputValue(form.doj)}
                  onChange={handleFormChange}
                  required
                />
                <SelectField
                  label="Gender *"
                  name="gender"
                  value={form.gender}
                  onChange={handleFormChange}
                  options={["MALE", "FEMALE"]}
                  required
                />
                <SelectField
                  label="Marital Status"
                  name="maritalStatus"
                  value={form.maritalStatus}
                  onChange={handleFormChange}
                  options={["MARRIED", "UN MARRIED"]}
                />
                <SelectField
                  label="Grade *"
                  name="grade"
                  value={form.grade}
                  onChange={handleFormChange}
                  options={[
                    "Trainee",
                    "G08",
                    "G07",
                    "G06",
                    "G05",
                    "G04",
                    "G03",
                    "G02",
                    "G01"
                  ]}
                  required
                />
                <Field
                  label="Date *"
                  type="date"
                  name="date"
                  value={toDateInputValue(form.date)}
                  onChange={handleFormChange}
                  required
                />
                <SelectField
                  label="Probation Period *"
                  name="probationPeriod"
                  value={form.probationPeriod}
                  onChange={handleFormChange}
                  options={["3", "6"]}
                  required
                />
                <Field
                  label="Gross Pay *"
                  type="number"
                  name="grossPay"
                  value={form.grossPay}
                  onChange={handleFormChange}
                  required
                />
                <Field
                  label="Insurance"
                  type="number"
                  name="insurance"
                  value={form.insurance}
                  onChange={handleFormChange}
                />

                <ReadOnlyField label="Basic" value={form.basic} />
                <ReadOnlyField label="HRD" value={form.hrd} />
                <ReadOnlyField label="Other Allowance" value={form.otherAllowance} />
                <ReadOnlyField label="Gross Salary A" value={form.grossSalaryA} />
                <ReadOnlyField label="ESI - Employee" value={form.esiEmployee} />
                <ReadOnlyField label="PF - Employee" value={form.pfEmployee} />
                <ReadOnlyField label="Total Deduction" value={form.totalDeduction} />
                <ReadOnlyField label="Take Home" value={form.takeHome} />
                <ReadOnlyField label="ESI - Employer" value={form.esiEmployer} />
                <ReadOnlyField label="PF - Employer" value={form.pfEmployer} />
                <ReadOnlyField label="Total Deduction B" value={form.totalDeductionB} />
                <ReadOnlyField label="CTC" value={form.ctc} />
                <ReadOnlyField label="Annual CTC" value={form.annualCTC} />

                <div
                  className="form-field"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label>Candidate Signature</label>

                  <div
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      background: "#fff",
                      width: "100%",
                      maxWidth: "520px",
                      height: "170px",
                      overflow: "hidden"
                    }}
                  >
                    <SignatureCanvas
                      penColor="black"
                      ref={sigRef}
                      canvasProps={{
                        width: 520,
                        height: 170,
                        style: { width: "100%", height: "170px" }
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={saveSignature}
                    >
                      Save Signature
                    </button>

                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={clearSignature}
                    >
                      Clear Signature
                    </button>
                  </div>

                  {signature && (
                    <div style={{ marginTop: "14px" }}>
                      <label style={{ display: "block", marginBottom: "8px" }}>
                        Saved Signature Preview
                      </label>
                      <div
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "12px",
                          background: "#f8fafc",
                          width: "100%",
                          maxWidth: "520px"
                        }}
                      >
                        <img
                          src={signature}
                          alt="Candidate Signature"
                          style={{
                            maxWidth: "250px",
                            maxHeight: "80px",
                            objectFit: "contain"
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;