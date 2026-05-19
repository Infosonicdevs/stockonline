import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getSaleRegister } from "../../services/reports/saleRegister";

function SaleRegister() {
  const loginDate = localStorage.getItem("loginDate")
    ? new Date(localStorage.getItem("loginDate")).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(loginDate);
  const [toDate, setToDate] = useState(loginDate);
  const [outletId, setOutletId] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    // Get Outlet_id from localStorage on component mount
    const storedOutletId = localStorage.getItem("Outlet_id");
    if (storedOutletId) {
      setOutletId(storedOutletId);
    } else {
      // Fallback if not found, you could handle it or leave empty
      setOutletId("3"); // Example default or handled by user context
    }
  }, []);

  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      toast.warning("Please select both From and To dates.");
      return;
    }
    if (!outletId) {
      toast.error("Outlet ID not found. Please re-login.");
      return;
    }

    setLoading(true);
    try {
      const response = await getSaleRegister(fromDate, toDate, outletId);
      if (response.data) {
        setReportData(response.data.List || []);
        setSummaryData(response.data.Summary || null);
      } else {
        setReportData([]);
        setSummaryData(null);
        toast.info("No data found for the selected date range.");
      }
    } catch (error) {
      console.error("Error fetching sale register:", error);
      toast.error("Failed to fetch report data.");
      setReportData([]);
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="card shadow-sm border-0">
        <div
          className="card-header text-white"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0">
            <i className="bi bi-file-earmark-bar-graph me-2"></i>Sale Register
          </h5>
        </div>

        <div className="card-body">
          <div className="row g-3 align-items-end mb-4">
            <div className="col-md-3">
              <label className="form-label fw-semibold">From Date</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">To Date</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-primary w-100"
                onClick={fetchReport}
                disabled={loading}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  <i className="bi bi-search me-2"></i>
                )}
                Show Report
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover align-middle">
              <thead className="table-light text-center">
                <tr>
                  <th>Sr. No.</th>
                  <th>Date</th>
                  <th>Total Quantity</th>
                  <th>Sale Amount</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                  <th>Round Off</th>
                  <th>Bill Amount</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {reportData.length > 0 ? (
                  reportData.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.Sale_Date ? new Date(item.Sale_Date).toLocaleDateString("en-GB") : "-"}</td>
                      <td>{item.Total_Pavati}</td>
                      <td className="text-end">₹{parseFloat(item.Sale_Amount || 0).toFixed(2)}</td>
                      <td className="text-end">₹{parseFloat(item.Total_CGST || 0).toFixed(2)}</td>
                      <td className="text-end">₹{parseFloat(item.Total_SGST || 0).toFixed(2)}</td>
                      <td className="text-end">₹{parseFloat(item.Total_IGST || 0).toFixed(2)}</td>
                      <td className="text-end">₹{parseFloat(item.Total_Roundoff || 0).toFixed(2)}</td>
                      <td className="text-end fw-semibold">₹{parseFloat(item.Bill_Amount || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      {loading ? "Loading..." : "No records found"}
                    </td>
                  </tr>
                )}
              </tbody>
              {summaryData && reportData.length > 0 && (
                <tfoot className="table-secondary fw-bold text-center">
                  <tr>
                    <td colSpan="2" className="text-end">Grand Total:</td>
                    <td>{summaryData.Grand_Pavati || 0}</td>
                    <td className="text-end">₹{parseFloat(summaryData.Grand_Sale || 0).toFixed(2)}</td>
                    <td className="text-end">₹{parseFloat(summaryData.Grand_CGST || 0).toFixed(2)}</td>
                    <td className="text-end">₹{parseFloat(summaryData.Grand_SGST || 0).toFixed(2)}</td>
                    <td className="text-end">₹{parseFloat(summaryData.Grand_IGST || 0).toFixed(2)}</td>
                    <td className="text-end">₹{parseFloat(summaryData.Grand_Roundoff || 0).toFixed(2)}</td>
                    <td className="text-end">₹{parseFloat(summaryData.Grand_Bill || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaleRegister;
