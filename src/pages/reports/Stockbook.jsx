import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getStockBookReport } from "../../services/reports/stockBook";
import { getMainBranchCurrentStock } from "../../services/masters/stock/stockdistribution";

function Stockbook() {
  const [formData, setFormData] = useState({
    itemNo: "",
    barcode: "",
    itemName: "",
    Stock_id: null,
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemList, setShowItemList] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const [reportData, setReportData] = useState({
    Opening_Amt: 0,
    Purchase: [],
    Sale: [],
    Summary: {}
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowItemList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchItems = async () => {
    try {
      const res = await getMainBranchCurrentStock();
      if (res.status === 200) {
        const items = res.data.Data || res.data.data || res.data;
        setAllItems(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items");
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (id === "itemName") {
      if (value.length > 0) {
        const lowerValue = value.toLowerCase();
        const filtered = allItems.filter(
          (item) =>
            item.Stock_name?.toLowerCase().includes(lowerValue) ||
            item.Barcode?.toString().toLowerCase().includes(lowerValue) ||
            item.Stock_id?.toString().toLowerCase().includes(lowerValue) ||
            item.Stock_no?.toString().toLowerCase().includes(lowerValue)
        );
        setFilteredItems(filtered);
        setShowItemList(true);
      } else {
        setShowItemList(false);
        setFormData((prev) => ({ ...prev, Stock_id: null }));
      }
    }
  };

  const handleItemSelect = (item) => {
    setFormData((prev) => ({
      ...prev,
      itemNo: item.Stock_no || "",
      barcode: item.Barcode || "",
      itemName: item.Stock_name || "",
      Stock_id: item.Stock_id,
    }));
    setShowItemList(false);
  };

  const lookupLocally = (field, value) => {
    if (!value) return;
    const item = allItems.find((i) => {
      if (field === "itemNo") {
        return (
          i.Stock_no?.toString() === value.toString() ||
          i.Stock_id?.toString() === value.toString()
        );
      }
      if (field === "barcode") {
        return i.Barcode?.toString() === value.toString();
      }
      return false;
    });

    if (item) {
      handleItemSelect(item);
    } else {
      toast.warning(`${field === "itemNo" ? "Item No" : "Barcode"} not found`);
      setFormData((prev) => ({ ...prev, itemName: "", Stock_id: null }));
    }
  };

  const handleShowDetails = async () => {
    if (!formData.Stock_id) {
      toast.error("Please select an item first");
      return;
    }
    setLoading(true);
    try {
      const res = await getStockBookReport(formData.Stock_id, formData.fromDate, formData.toDate);
      if (res.status === 200) {
        setReportData(res.data);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch stockbook report");
    } finally {
      setLoading(false);
    }
  };

  // Prepare table data
  let combinedList = [];
  if (reportData.Purchase) {
    reportData.Purchase.forEach((p) => {
      combinedList.push({ ...p, Trans_no: p.Invoice_id, InwardQty: p.Quantity, InwardRate: p.Rate, InwardAmt: p.Amount, OutwardQty: 0, OutwardRate: 0, OutwardAmt: 0 });
    });
  }
  if (reportData.Sale) {
    reportData.Sale.forEach((s) => {
      combinedList.push({ ...s, Trans_no: s.Sale_id, InwardQty: 0, InwardRate: 0, InwardAmt: 0, OutwardQty: s.Quantity, OutwardRate: s.Rate, OutwardAmt: s.Amount });
    });
  }
  
  // Sort by Trans_date
  combinedList.sort((a, b) => new Date(a.Trans_date) - new Date(b.Trans_date));

  return (
    <div className="container-fluid p-4">
      <ToastContainer />
      <div className="bg-white p-4 rounded shadow-lg mx-auto">
        <div className="text-white rounded mb-4 p-3 text-center" style={{ backgroundColor: "#365b80" }}>
          <h4 className="mb-0 fw-bold">Stockbook Report</h4>
        </div>

        <div className="row g-3 align-items-end mb-4">
          <div className="col-md-2">
            <label className="form-label fw-bold small">Item No</label>
            <input
              type="text"
              id="itemNo"
              value={formData.itemNo}
              onChange={handleInputChange}
              onBlur={(e) => lookupLocally("itemNo", e.target.value)}
              className="form-control form-control-sm"
              placeholder="Item No"
            />
          </div>

          <div className="col-md-2">
            <label className="form-label fw-bold small">Barcode</label>
            <input
              type="text"
              id="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              onBlur={(e) => lookupLocally("barcode", e.target.value)}
              className="form-control form-control-sm"
              placeholder="Barcode"
            />
          </div>

          <div className="col-md-4 position-relative">
            <label className="form-label fw-bold small">Item Name</label>
            <input
              type="text"
              id="itemName"
              value={formData.itemName}
              onChange={handleInputChange}
              placeholder="Search item..."
              className="form-control form-control-sm"
              autoComplete="off"
            />
            {showItemList && (
              <div
                className="position-absolute bg-white shadow w-100 mt-1 rounded overflow-auto"
                style={{ maxHeight: "200px", zIndex: 1000, border: "1px solid #ddd" }}
                ref={dropdownRef}
              >
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div
                      key={item.Stock_id}
                      className="p-2 cursor-pointer border-bottom small hover-bg-light"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleItemSelect(item)}
                    >
                      {item.Stock_name} {item.Barcode ? `(BC: ${item.Barcode})` : ""}
                    </div>
                  ))
                ) : (
                  <div className="p-2 small text-muted">No items found</div>
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
                <th rowSpan="2" className="align-middle">Date</th>
                <th rowSpan="2" className="align-middle">Type</th>
                <th rowSpan="2" className="align-middle">Trans No</th>
                <th colSpan="3" className="bg-success-subtle text-success">Inward (Purchase)</th>
                <th colSpan="3" className="bg-danger-subtle text-danger">Outward (Sale)</th>
              </tr>
              <tr>
                <th className="bg-success-subtle">Qty</th>
                <th className="bg-success-subtle">Rate</th>
                <th className="bg-success-subtle">Amount</th>
                <th className="bg-danger-subtle">Qty</th>
                <th className="bg-danger-subtle">Rate</th>
                <th className="bg-danger-subtle">Amount</th>
              </tr>
            </thead>
            <tbody>
              {reportData.Opening_Amt !== undefined && (
                <tr className="table-light fw-bold text-primary">
                  <td colSpan="3" className="text-start">Opening Balance</td>
                  <td colSpan="6" className="text-end">₹{parseFloat(reportData.Opening_Amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
              
              {combinedList.length > 0 ? (
                combinedList.map((row, idx) => (
                  <tr key={idx}>
                    <td>{new Date(row.Trans_date).toLocaleDateString()}</td>
                    <td>{row.Type}</td>
                    <td>{row.Trans_no}</td>
                    
                    <td className="text-end">{row.InwardQty > 0 ? row.InwardQty : "-"}</td>
                    <td className="text-end">{row.InwardRate > 0 ? `₹${row.InwardRate.toFixed(2)}` : "-"}</td>
                    <td className="text-end text-success fw-semibold">{row.InwardAmt > 0 ? `₹${row.InwardAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}</td>

                    <td className="text-end">{row.OutwardQty > 0 ? row.OutwardQty : "-"}</td>
                    <td className="text-end">{row.OutwardRate > 0 ? `₹${row.OutwardRate.toFixed(2)}` : "-"}</td>
                    <td className="text-end text-danger fw-semibold">{row.OutwardAmt > 0 ? `₹${row.OutwardAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-muted py-4">No transactions found for the selected period.</td>
                </tr>
              )}
            </tbody>
            {reportData.Summary && Object.keys(reportData.Summary).length > 0 && (
              <tfoot className="table-light fw-bold">
                <tr>
                  <td colSpan="3" className="text-end">Total:</td>
                  <td className="text-end text-success">{reportData.Summary.Total_Purchase_Qty || 0}</td>
                  <td></td>
                  <td className="text-end text-success">₹{(reportData.Summary.Total_Purchase_Amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  
                  <td className="text-end text-danger">{reportData.Summary.Total_Sale_Qty || 0}</td>
                  <td></td>
                  <td className="text-end text-danger">₹{(reportData.Summary.Total_Sale_Amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="table-secondary text-primary">
                  <td colSpan="3" className="text-start">Closing Balance:</td>
                  <td colSpan="6" className="text-end">₹{(reportData.Summary.Closing_Amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

export default Stockbook;
