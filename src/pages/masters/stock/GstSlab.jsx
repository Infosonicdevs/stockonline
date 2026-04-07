import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getGSTSlabs,
  addGSTSlab,
  getLedgers,
  updateGSTSlab,
  deleteGSTSlab,
} from "../../../services/masters/gstSlabApi";

function GstSlab() {
  const [formData, setFormData] = useState({
    id: null,
    taxCode: "",
    heading: "",
    cgst: "0.00",
    sgst: "0.00",
    igst: "0.00",

    cgstAccountNo: "",
    cgstAccountId: "",

    sgstAccountNo: "",
    sgstAccountId: "",

    igstAccountNo: "",
    igstAccountId: "",
  });

  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const username = localStorage.getItem("username");
  const [gstList, setGstList] = useState([]);
  const [ledgerList, setLedgerList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredList = gstList.filter((item) => {
    const search = searchTerm.toLowerCase();

    const taxCode = item.Tax_code ? item.Tax_code.toString().toLowerCase() : "";
    const heading = item.Heading ? item.Heading.toString().toLowerCase() : "";

    return taxCode.includes(search) || heading.includes(search);
  });

  const loadLedgers = async () => {
    try {
      const res = await getLedgers();
      setLedgerList(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    loadLedgers();
  }, []);

  const handleLedgerChange = (e, type, field) => {
    const value = e.target.value;

    let ledger = null;

    if (type === "code") {
      ledger = ledgerList.find((l) => l.Ledger_no.toString() === value);
    }

    if (type === "name") {
      ledger = ledgerList.find((l) => l.Ledger_id.toString() === value);
    }

    setFormData((prev) => ({
      ...prev,
      [`${field}AccountNo`]: ledger ? ledger.Ledger_no : value,
      [`${field}AccountId`]: ledger ? ledger.Ledger_id : value,
    }));
  };

  const loadGSTSlabs = async () => {
    try {
      const res = await getGSTSlabs();
      setGstList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFocus = (field) => {
    if (formData[field] === "0.00") {
      setFormData({ ...formData, [field]: "" });
    }
  };

  const handleBlur = (field) => {
    if (!formData[field]) {
      setFormData({ ...formData, [field]: "0.00" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.taxCode) {
      toast.error("Enter Tax Code");
      return;
    }

    if (formData.heading === "") {
      toast.error("Enter Heading");
      return;
    }

    if (
      formData.cgstAccountId === "" ||
      formData.sgstAccountId === "" ||
      formData.igstAccountId === ""
    ) {
      toast.error("Select Ledger Account");
      return;
    }

    const payload = {
      Id: formData.id,
      Tax_code: formData.taxCode,
      Heading: formData.heading,
      CGST_per: formData.cgst,
      SGST_per: formData.sgst,
      IGST_per: formData.igst,

      CGST_l_id: formData.cgstAccountId || 0,
      SGST_l_id: formData.sgstAccountId || 0,
      IGST_l_id: formData.igstAccountId || 0,

      Created_by: localStorage.getItem("username"),
      Modified_by: localStorage.getItem("username"),
    };

    try {
      let res;

      if (editIndex !== null) {
        res = await updateGSTSlab(payload);
        toast.success("Updated successfully");
      } else {
        res = await addGSTSlab(payload);
        toast.success(res.data);
      }

      handleClear();
      loadGSTSlabs();
    } catch (err) {
      toast.error(err.response?.data || "Error");
    }
  };

  const handleEdit = (item, index) => {
    setEditIndex(index);

    const cgstLedger = ledgerList.find((l) => l.Ledger_id === item.CGST_l_id);
    const sgstLedger = ledgerList.find((l) => l.Ledger_id === item.SGST_l_id);
    const igstLedger = ledgerList.find((l) => l.Ledger_id === item.IGST_l_id);

    setFormData({
      id: item.Id,
      taxCode: item.Tax_code,
      heading: item.Heading,
      cgst: item.CGST_per,
      sgst: item.SGST_per,
      igst: item.IGST_per,

      cgstAccountId: item.CGST_l_id,
      sgstAccountId: item.SGST_l_id,
      igstAccountId: item.IGST_l_id,

      cgstAccountNo: cgstLedger ? cgstLedger.Ledger_no : "",
      sgstAccountNo: sgstLedger ? sgstLedger.Ledger_no : "",
      igstAccountNo: igstLedger ? igstLedger.Ledger_no : "",
    });

    setShowTable(false);
  };

  const handleDelete = async (id) => {
    try {
      const username = localStorage.getItem("username");

      if (!username) {
        toast.error("Login required");
        return;
      }

      const res = await deleteGSTSlab({
        Id: id,
        Modified_by: username,
      });

      console.log(res.data);

      toast.success(res.data || "Deleted successfully");

      loadGSTSlabs();
    } catch (err) {
      console.log("DELETE ERROR:", err.response?.data);
      toast.error(err.response?.data || "Delete failed");
    }
  };

  const handleClear = () => {
    setFormData({
      taxCode: "",
      heading: "",
      cgst: "0.00",
      sgst: "0.00",
      igst: "0.00",

      cgstAccountNo: "",
      cgstAccountId: "",

      sgstAccountNo: "",
      sgstAccountId: "",

      igstAccountNo: "",
      igstAccountId: "",
    });

    setEditIndex(null);
  };

  return (
    <div className="container-fluid my-2">
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "600px" }}
      >
        {/* HEADER */}
        <div
          className="text-white text-center p-2 rounded mb-2"
          style={{ background: "#365b80" }}
        >
          <h5 className="mb-0">GST Slab</h5>
        </div>

        {/* ================= FORM ================= */}
        {!showTable && (
          <form onSubmit={handleSubmit}>
            <div className="row mb-2">
              <div className="col-md-2" style={{ fontSize: "14px" }}>
                <label>Tax Code</label>
                <input
                  type="text"
                  name="taxCode"
                  className="form-control"
                  style={{ fontSize: "14px", height: "28px" }}
                  value={formData.taxCode}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3" style={{ fontSize: "14px" }}>
                <label>Heading</label>
                <input
                  type="text"
                  name="heading"
                  className="form-control"
                  style={{ fontSize: "14px", height: "28px" }}
                  value={formData.heading}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* CGST SGST IGST */}
            <div className="row mb-2" style={{ fontSize: "14px" }}>
              <div className="col-md-3">
                <label>CGST %</label>
                <input
                  type="text"
                  name="cgst"
                  className="form-control"
                  style={{ width: "100px", fontSize: "14px", height: "28px" }}
                  value={formData.cgst}
                  onFocus={() => handleFocus("cgst")}
                  onBlur={() => handleBlur("cgst")}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label>SGST %</label>
                <input
                  type="text"
                  name="sgst"
                  className="form-control"
                  style={{ width: "100px", fontSize: "14px", height: "28px" }}
                  value={formData.sgst}
                  onFocus={() => handleFocus("sgst")}
                  onBlur={() => handleBlur("sgst")}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label>IGST %</label>
                <input
                  type="text"
                  name="igst"
                  className="form-control"
                  style={{ width: "100px", fontSize: "14px", height: "28px" }}
                  value={formData.igst}
                  onFocus={() => handleFocus("igst")}
                  onBlur={() => handleBlur("igst")}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Accounts  */}
            <div className="mb-2" style={{ fontSize: "14px" }}>
              <label>CGST Account</label>

              <div className="d-flex align-items-center gap-1">
                {/* Textbox (No) */}
                <input
                  type="text"
                  value={formData.cgstAccountNo}
                  onChange={(e) => handleLedgerChange(e, "code", "cgst")}
                  className="form-control"
                  style={{ width: "120px", height: "28px", fontSize: "14px" }}
                />

                {/* Dropdown (Name) */}
                <select
                  value={formData.cgstAccountId}
                  onChange={(e) => handleLedgerChange(e, "name", "cgst")}
                  className="form-select"
                  style={{ width: "320px", height: "28px", fontSize: "12px" }}
                >
                  <option value="">Select Account</option>

                  {ledgerList.map((item) => (
                    <option key={item.Ledger_id} value={item.Ledger_id}>
                      {item.Ledger_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-2" style={{ fontSize: "14px" }}>
              <label>SGST Account</label>

              <div className="d-flex align-items-center gap-1">
                <input
                  type="text"
                  value={formData.sgstAccountNo}
                  onChange={(e) => handleLedgerChange(e, "code", "sgst")}
                  className="form-control"
                  style={{ width: "120px", height: "28px", fontSize: "14px" }}
                />

                <select
                  value={formData.sgstAccountId}
                  onChange={(e) => handleLedgerChange(e, "name", "sgst")}
                  className="form-select"
                  style={{ width: "320px", height: "28px", fontSize: "12px" }}
                >
                  <option value="">Select Account</option>

                  {ledgerList.map((item) => (
                    <option key={item.Ledger_id} value={item.Ledger_id}>
                      {item.Ledger_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3" style={{ fontSize: "14px" }}>
              <label>IGST Account</label>

              <div className="d-flex align-items-center gap-1">
                <input
                  type="text"
                  value={formData.igstAccountNo}
                  onChange={(e) => handleLedgerChange(e, "code", "igst")}
                  className="form-control"
                  style={{ width: "120px", height: "28px", fontSize: "14px" }}
                />

                <select
                  value={formData.igstAccountId}
                  onChange={(e) => handleLedgerChange(e, "name", "igst")}
                  className="form-select"
                  style={{ width: "320px", height: "28px", fontSize: "12px" }}
                >
                  <option value="">Select Account</option>

                  {ledgerList.map((item) => (
                    <option key={item.Ledger_id} value={item.Ledger_id}>
                      {item.Ledger_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Buttons */}
            <div className="d-flex justify-content-center gap-2">
              <button
                type="submit"
                className="button-save"
                style={{ fontSize: "14px" }}
              >
                {editIndex !== null ? "Update" : "Save"}
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="button-clear"
                style={{ fontSize: "14px" }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="button-list"
                style={{ fontSize: "14px" }}
                onClick={() => {
                  setShowTable(true);
                  loadGSTSlabs();
                }}
              >
                Show List
              </button>
            </div>
          </form>
        )}

        {/* ================= TABLE ================= */}
        {showTable && (
          <div
            className="table-responsive mt-2"
            style={{ maxHeight: "90vh", overflowY: "auto", overflowX: "auto" }}
          >
            {/* TOP BAR  */}
            <div className="d-flex align-items-center justify-content-between mb-2 gap-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowTable(false)}
              >
                Close
              </button>

              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-search"></i>
                <label className="fw-semibold text-secondary small mb-0">
                  Search
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{
                    width: "250px",
                    height: "25px",
                    marginRight: "200PX",
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Tax Code / Heading"
                />
              </div>
            </div>

            {/* TABLe */}
            <table
              className="table table-bordered text-center table-sm table-striped"
              style={{
                whiteSpace: "nowrap",
                width: "600px",
              }}
            >
              <thead
                className="table-light"
                style={{ fontSize: "13px", fontWeight: "semibold" }}
              >
                <tr>
                  <th className="table-column-bg-heading">Actions</th>
                  <th className="table-column-bg-heading">Sr. No</th>
                  <th className="table-column-bg-heading">Tax Code</th>
                  <th className="table-column-bg-heading">Heading</th>
                  <th className="table-column-bg-heading">CGST %</th>
                  <th className="table-column-bg-heading">SGST %</th>
                  <th className="table-column-bg-heading">IGST %</th>
                  {/* <th className="table-column-bg-heading">CGST Account</th>
                                    <th className="table-column-bg-heading">SGST Account</th>
                                    <th className="table-column-bg-heading">IGST Account</th> */}
                </tr>
              </thead>

              <tbody>
                {filteredList.map((item, index) => (
                  <tr key={item.Id}>
                    <td>
                      <button
                        className="btn btn-info btn-sm me-1"
                        onClick={() => handleEdit(item, index)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item.Id)}
                      >
                        Delete
                      </button>
                    </td>

                    <td>{index + 1}</td>
                    <td>{item.Tax_code}</td>
                    <td>{item.Heading}</td>
                    <td>{item.CGST_per}%</td>
                    <td>{item.SGST_per}%</td>
                    <td>{item.IGST_per}%</td>
                    {/* <td>{item.cgst_name}</td>
                                        <td>{item.sgst_name}</td>
                                        <td>{item.igst_name}</td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default GstSlab;
