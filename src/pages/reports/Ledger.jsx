import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getLedgers, getLedgerReport } from "../../services/reports/ledgerBalance";

function LedgerReport() {
  const [formData, setFormData] = useState({
    ledgerNo: "",
    ledgerName: "",
    Ledger_id: null,
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  const [allLedgers, setAllLedgers] = useState([]);
  const [filteredLedgers, setFilteredLedgers] = useState([]);
  const [showLedgerList, setShowLedgerList] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const [reportData, setReportData] = useState({
    Opening_Balance: 0,
    List: [],
    Summary: {}
  });

  useEffect(() => {
    fetchLedgers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLedgerList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLedgers = async () => {
    try {
      const res = await getLedgers();
      if (res.status === 200) {
        const ledgers = res.data.Data || res.data.data || res.data || [];
        setAllLedgers(Array.isArray(ledgers) ? ledgers : []);
      }
    } catch (error) {
      console.error("Error fetching ledgers:", error);
      toast.error("Failed to load ledgers");
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (id === "ledgerName") {
      if (value.length > 0) {
        const lowerValue = value.toLowerCase();
        const filtered = allLedgers.filter(
          (ledger) =>
            ledger.Ledger_name?.toLowerCase().includes(lowerValue) ||
            ledger.Ledger_no?.toString().toLowerCase().includes(lowerValue)
        );
        setFilteredLedgers(filtered);
        setShowLedgerList(true);
      } else {
        setShowLedgerList(false);
        setFormData((prev) => ({ ...prev, Ledger_id: null }));
      }
    }
  };

  const handleLedgerSelect = (ledger) => {
    setFormData((prev) => ({
      ...prev,
      ledgerNo: ledger.Ledger_no || "",
      ledgerName: ledger.Ledger_name || "",
      Ledger_id: ledger.Ledger_id,
    }));
    setShowLedgerList(false);
  };

  const lookupLocally = (field, value) => {
    if (!value) return;
    const ledger = allLedgers.find((l) => {
      if (field === "ledgerNo") {
        return (
          l.Ledger_no?.toString() === value.toString() ||
          l.Ledger_id?.toString() === value.toString()
        );
      }
      return false;
    });

    if (ledger) {
      handleLedgerSelect(ledger);
    } else {
      toast.warning(`Ledger No not found`);
      setFormData((prev) => ({ ...prev, ledgerName: "", Ledger_id: null }));
    }
  };

  const calculateTotals = () => {
    let drTotal = 0;
    let crTotal = 0;

    const ob = parseFloat(reportData.Opening_Balance || 0);
    if (ob > 0) drTotal += ob;
    if (ob < 0) crTotal += Math.abs(ob);

    if (reportData.List && reportData.List.length > 0) {
      reportData.List.forEach(row => {
        drTotal += parseFloat(row.DR_Amount || 0);
        crTotal += parseFloat(row.CR_Amount || 0);
      });
    }
    return { drTotal, crTotal };
  };

  const { drTotal, crTotal } = calculateTotals();

  const handleShowDetails = async () => {
    if (!formData.Ledger_id) {
      toast.error("Please select a ledger first");
      return;
    }
    setLoading(true);
    try {
      const res = await getLedgerReport(formData.Ledger_id, formData.fromDate, formData.toDate);
      if (res.status === 200) {
        setReportData({
          Opening_Balance: res.data.Opening_Balance || 0,
          List: res.data.List || [],
          Summary: res.data.Summary || {}
        });
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch ledger report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <ToastContainer />
      <div className="bg-white p-4 rounded shadow-lg mx-auto">
        <div className="text-white rounded mb-4 p-3 text-center" style={{ backgroundColor: "#365b80" }}>
          <h4 className="mb-0 fw-bold">Ledger Report</h4>
        </div>

        <div className="row g-3 align-items-end mb-4">
          <div className="col-md-2">
            <label className="form-label fw-bold small">Ledger No</label>
            <input
              type="text"
              id="ledgerNo"
              value={formData.ledgerNo}
              onChange={handleInputChange}
              onBlur={(e) => lookupLocally("ledgerNo", e.target.value)}
              className="form-control form-control-sm"
              placeholder="Ledger No"
            />
          </div>

          <div className="col-md-6 position-relative">
            <label className="form-label fw-bold small">Ledger Name</label>
            <input
              type="text"
              id="ledgerName"
              value={formData.ledgerName}
              onChange={handleInputChange}
              placeholder="Search ledger..."
              className="form-control form-control-sm"
              autoComplete="off"
            />
            {showLedgerList && (
              <div
                className="position-absolute bg-white shadow w-100 mt-1 rounded overflow-auto"
                style={{ maxHeight: "200px", zIndex: 1000, border: "1px solid #ddd" }}
                ref={dropdownRef}
              >
                {filteredLedgers.length > 0 ? (
                  filteredLedgers.map((ledger) => (
                    <div
                      key={ledger.Ledger_id}
                      className="p-2 cursor-pointer border-bottom small hover-bg-light"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleLedgerSelect(ledger)}
                    >
                      {ledger.Ledger_name} {ledger.Ledger_no ? `(No: ${ledger.Ledger_no})` : ""}
                    </div>
                  ))
                ) : (
                  <div className="p-2 small text-muted">No ledgers found</div>
                )}
              </div>
            )}
          </div>

          <div className="col-md-2">
            <label className="form-label fw-bold small">From Date</label>
            <input
              type="date"
              id="fromDate"
              value={formData.fromDate}
              onChange={handleInputChange}
              className="form-control form-control-sm"
            />
          </div>

          <div className="col-md-2">
            <label className="form-label fw-bold small">To Date</label>
            <input
              type="date"
              id="toDate"
              value={formData.toDate}
              onChange={handleInputChange}
              className="form-control form-control-sm"
            />
          </div>

          <div className="col-12 text-end mt-3">
            <button
              type="button"
              className="btn btn-primary btn-sm px-4 fw-bold"
              style={{ backgroundColor: "#365b80", border: "none" }}
              onClick={handleShowDetails}
              disabled={loading}
            >
              {loading ? "Loading..." : "Show Details"}
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0 text-center" style={{ fontSize: "14px" }}>
            <thead className="table-light">
              <tr>
                <th className="align-middle">Date</th>
                <th className="align-middle">Trans No</th>
                <th className="align-middle text-start">Particulars (Opposite Ledger)</th>
                <th className="align-middle text-start">Narrative</th>
                <th className="align-middle bg-danger-subtle text-danger">Debit (Dr)</th>
                <th className="align-middle bg-success-subtle text-success">Credit (Cr)</th>
              </tr>
            </thead>
            <tbody>
              {reportData.Opening_Balance !== undefined && (
                <tr className="table-light fw-bold text-primary">
                  <td colSpan="4" className="text-start">Opening Balance</td>
                  <td className="text-end text-danger">
                    {reportData.Opening_Balance > 0 ? `₹${parseFloat(reportData.Opening_Balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                  </td>
                  <td className="text-end text-success">
                    {reportData.Opening_Balance < 0 ? `₹${Math.abs(parseFloat(reportData.Opening_Balance)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                  </td>
                </tr>
              )}
              
              {reportData.List && reportData.List.length > 0 ? (
                reportData.List.map((row, idx) => (
                  <tr key={idx}>
                    <td>{new Date(row.Trans_date).toLocaleDateString()}</td>
                    <td>{row.Trans_no}</td>
                    <td className="text-start">{row.Ledger_name}</td>
                    <td className="text-start">{row.Narr}</td>
                    <td className="text-end text-danger fw-semibold">{row.DR_Amount > 0 ? `₹${row.DR_Amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}</td>
                    <td className="text-end text-success fw-semibold">{row.CR_Amount > 0 ? `₹${row.CR_Amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-muted py-4">No transactions found for the selected period.</td>
                </tr>
              )}
            </tbody>
            {reportData.Summary && Object.keys(reportData.Summary).length > 0 && (
              <tfoot className="table-light fw-bold">
                <tr>
                  <td colSpan="4" className="text-end">Total:</td>
                  <td className="text-end text-danger">₹{drTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="text-end text-success">₹{crTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="table-secondary text-primary">
                  <td colSpan="4" className="text-start">Closing Balance:</td>
                  <td className="text-end text-danger">
                    {reportData.Summary.Closing_Balance > 0 ? `₹${(reportData.Summary.Closing_Balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                  </td>
                  <td className="text-end text-success">
                    {reportData.Summary.Closing_Balance < 0 ? `₹${Math.abs(reportData.Summary.Closing_Balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

export default LedgerReport;
