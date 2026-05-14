import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getStockDistributionReport } from "../../services/reports/stockDistribution";

function StockDistribution() {
  const [formData, setFormData] = useState({
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleShowDetails = async () => {
    if (!formData.fromDate || !formData.toDate) {
      toast.error("Please select both dates");
      return;
    }
    setLoading(true);
    try {
      const res = await getStockDistributionReport(formData.fromDate, formData.toDate);
      if (res.status === 200) {
        let apiData = res.data?.Data || res.data?.data || res.data?.List || res.data;
        if (!Array.isArray(apiData)) {
          apiData = [];
        }

        // Flatten the nested Stocks structure for the table
        const flatData = [];
        apiData.forEach((record) => {
          const stocksArray = record.Stocks?.$values || record.Stocks;
          if (Array.isArray(stocksArray) && stocksArray.length > 0) {
            stocksArray.forEach((stock) => {
              flatData.push({
                Date: record.Date,
                Outlet_id: record.Outlet_id,
                Outlet_name: record.Outlet_name || "-",
                Outlet_code: record.Outlet_code || "-",
                ...stock,
              });
            });
          } else {
            // Push empty row for outlet with no stocks
            flatData.push({
              Date: record.Date,
              Outlet_id: record.Outlet_id,
              Outlet_name: record.Outlet_name || "-",
              Outlet_code: record.Outlet_code || "-",
              SD_id: "-",
              Stock_id: "-",
              Stock_no: "-",
              Barcode: "-",
              Stock_name: "No Stocks",
              Unit_name: "-",
              Quantity: "-",
              MRP: "-",
              Amount: "-",
            });
          }
        });
        setReportData(flatData);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch stock distribution report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <ToastContainer />
      <div className="bg-white p-4 rounded shadow-lg mx-auto">
        <div className="text-white rounded mb-4 p-3 text-center" style={{ backgroundColor: "#365b80" }}>
          <h4 className="mb-0 fw-bold">Stock Distribution Report</h4>
        </div>

        <div className="row g-3 align-items-end mb-4">
          <div className="col-md-3">
            <label className="form-label fw-bold small">From Date</label>
            <input
              type="date"
              id="fromDate"
              value={formData.fromDate}
              onChange={handleInputChange}
              className="form-control form-control-sm"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-bold small">To Date</label>
            <input
              type="date"
              id="toDate"
              value={formData.toDate}
              onChange={handleInputChange}
              className="form-control form-control-sm"
            />
          </div>

          <div className="col-md-6 mt-3 text-md-end text-start">
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
          <table className="table table-bordered table-hover align-middle mb-0 text-center" style={{ fontSize: "14px", whiteSpace: "nowrap" }}>
            <thead className="table-light">
              <tr>
                <th className="align-middle">Date</th>
                <th className="align-middle">Outlet ID</th>
                <th className="align-middle">Outlet Name</th>
                <th className="align-middle">Outlet Code</th>
                <th className="align-middle">Stock No</th>
                <th className="align-middle">Barcode</th>
                <th className="align-middle">Stock Name</th>
                <th className="align-middle">Unit</th>
                <th className="align-middle">Quantity</th>
                <th className="align-middle">MRP</th>
                <th className="align-middle">Amount</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? (
                reportData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{new Date(row.Date).toLocaleDateString('en-GB')}</td>
                    <td>{row.Outlet_id}</td>
                    <td>{row.Outlet_name}</td>
                    <td>{row.Outlet_code}</td>
                    <td>{row.Stock_no}</td>
                    <td>{row.Barcode}</td>
                    <td className="text-start">{row.Stock_name}</td>
                    <td>{row.Unit_name}</td>
                    <td className="text-end fw-semibold text-primary">{row.Quantity !== "-" ? parseFloat(row.Quantity).toFixed(2) : "-"}</td>
                    <td className="text-end">{row.MRP !== "-" ? `₹${parseFloat(row.MRP).toFixed(2)}` : "-"}</td>
                    <td className="text-end fw-bold text-success">{row.Amount !== "-" ? `₹${parseFloat(row.Amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-muted py-4">
                    No records found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StockDistribution;
