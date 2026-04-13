import React, { useState, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";

const Stocksale = () => {
  // --- Unified State for Form Data (Master + Current Item Entry + Payments) ---
  const [formData, setFormData] = useState({
    // Master Info
    isIGST: false,
    customerName: "",
    counterNo: "C001", // Mocked
    employeeName: "John Doe", // Mocked
    loginTime: new Date().toLocaleTimeString(), // Mocked
    
    // Item Entry
    itemNo: "",
    barcode: "",
    itemName: "",
    quantity: "",
    mrp: "",
    discount: "0",
    saleAmount: "0.00",
    taxableAmount: "0.00",
    cgst: "0",
    sgst: "0",
    rowTotalAmount: "0.00",
    
    // Payments & Adjustments
    roundOff: "0",
    cashReceived: "0",
    paymentUPI: "0",
  });

  // --- State for Items Table ---
  const [itemsList, setItemsList] = useState([]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    
    setFormData((prev) => {
      const updated = { ...prev, [id]: val };
      
      // Auto-calculation for the item entry row
      if (["quantity", "mrp", "discount", "cgst", "sgst", "isIGST"].includes(id)) {
        const qty = parseFloat(updated.quantity) || 0;
        const mrp = parseFloat(updated.mrp) || 0;
        const discAmt = parseFloat(updated.discount) || 0;
        const cgstPct = parseFloat(updated.cgst) || 0;
        const sgstPct = parseFloat(updated.sgst) || 0;

        const saleAmt = qty * mrp;
        const taxableAmt = saleAmt - discAmt;
        const gstAmt = (taxableAmt * (cgstPct + sgstPct)) / 100;
        
        updated.saleAmount = saleAmt.toFixed(2);
        updated.taxableAmount = taxableAmt.toFixed(2);
        updated.rowTotalAmount = (taxableAmt + gstAmt).toFixed(2);
      }
      
      return updated;
    });
  };

  const addItem = () => {
    if (!formData.itemName || !formData.quantity || !formData.mrp) {
      toast.error("Please fill Item Name, Quantity and MRP");
      return;
    }

    const newItem = {
      id: Date.now(),
      itemNo: formData.itemNo,
      barcode: formData.barcode,
      itemName: formData.itemName,
      quantity: parseFloat(formData.quantity) || 0,
      mrp: parseFloat(formData.mrp) || 0,
      discount: parseFloat(formData.discount) || 0,
      saleAmount: parseFloat(formData.saleAmount) || 0,
      taxableAmount: parseFloat(formData.taxableAmount) || 0,
      cgst: parseFloat(formData.cgst) || 0,
      sgst: parseFloat(formData.sgst) || 0,
      rowTotalAmount: parseFloat(formData.rowTotalAmount) || 0,
    };

    setItemsList((prev) => [...prev, newItem]);
    
    // Reset item entry fields only
    setFormData((prev) => ({
      ...prev,
      itemNo: "",
      barcode: "",
      itemName: "",
      quantity: "",
      mrp: "",
      discount: "0",
      saleAmount: "0.00",
      taxableAmount: "0.00",
      cgst: "0",
      sgst: "0",
      rowTotalAmount: "0.00",
    }));
  };

  const removeItem = (index) => {
    setItemsList((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Derived Calculations (Totals) ---
  const totals = useMemo(() => {
    const totalQty = itemsList.reduce((sum, item) => sum + item.quantity, 0);
    const totalDiscount = itemsList.reduce((sum, item) => sum + item.discount, 0);
    const totalAmountItems = itemsList.reduce((sum, item) => sum + item.rowTotalAmount, 0);
    
    const grandTotal = totalAmountItems + (parseFloat(formData.roundOff) || 0);
    const cashReceived = parseFloat(formData.cashReceived) || 0;
    
    // Only calculate return if there is a bill amount
    const cashReturn = (grandTotal > 0 && cashReceived > grandTotal) ? cashReceived - grandTotal : 0;
    const balanceDue = (grandTotal > 0 && cashReceived < grandTotal) ? grandTotal - cashReceived : 0;

    return {
      totalQty,
      totalDiscount: totalDiscount.toFixed(2),
      totalAmountItems: totalAmountItems.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      cashReturn: cashReturn.toFixed(2),
      balanceDue: balanceDue.toFixed(2),
    };
  }, [itemsList, formData.roundOff, formData.cashReceived]);

  const columns = [
    { label: "Item No", accessor: "itemNo" },
    { label: "Barcode", accessor: "barcode" },
    { label: "Item Name", accessor: "itemName" },
    { label: "Qty", accessor: "quantity" },
    { label: "MRP", accessor: "mrp", render: (val) => `₹${val.toFixed(2)}` },
    { label: "Disc", accessor: "discount", render: (val) => `₹${val.toFixed(2)}` },
    { label: "Taxable", accessor: "taxableAmount", render: (val) => `₹${val.toFixed(2)}` },
    { label: "Total", accessor: "rowTotalAmount", render: (val) => `₹${val.toFixed(2)}` },
  ];

  return (
    <div className="container-fluid p-3" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <ToastContainer />

      <div className="card shadow border-0 rounded-4 overflow-hidden mb-4">
        {/* --- Header: Mocked Labels --- */}
        <div className="card-header border-0 text-white p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b" }}>
          <div className="d-flex gap-4 small fw-bold">
            <span><i className="bi bi-shop me-2"></i>Counter: <span className="text-warning">{formData.counterNo}</span></span>
            <span><i className="bi bi-person-badge me-2"></i>Employee: <span className="text-warning">{formData.employeeName}</span></span>
            <span><i className="bi bi-clock me-2"></i>Logged In: <span className="text-warning">{formData.loginTime}</span></span>
          </div>
          <h5 className="mb-0 fw-bold">Stock Sale</h5>
        </div>

        <div className="card-body p-4">
          {/* --- Master Row: Customer & IGST --- */}
          <div className="row g-3 mb-4 pb-3 border-bottom align-items-center">
            <div className="col-md-4">
              <label className="form-label small fw-bold text-muted">Customer Name</label>
              <div className="input-group input-group-sm shadow-sm">
                <span className="input-group-text bg-white"><i className="bi bi-person"></i></span>
                <input type="text" id="customerName" className="form-control" value={formData.customerName} onChange={handleInputChange} placeholder="Walk-in Customer" />
              </div>
            </div>
            <div className="col-md-2">
              <div className="form-check form-switch mt-4">
                <input className="form-check-input" type="checkbox" id="isIGST" checked={formData.isIGST} onChange={handleInputChange} />
                <label className="form-check-label small fw-bold text-muted" htmlFor="isIGST">IGST Enabled</label>
              </div>
            </div>
          </div>

          {/* --- Item Entry Section --- */}
          <div className="bg-white p-3 rounded-4 shadow-sm border mb-4" style={{ borderLeft: "4px solid #3b82f6" }}>
            <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-plus-circle-fill me-2"></i>Add Item</h6>
            {/* Entry Row 1 */}
            <div className="row g-2 mb-3">
              <div className="col-md-2">
                <label className="form-label x-small fw-bold">Item No</label>
                <input type="text" id="itemNo" className="form-control form-control-sm" value={formData.itemNo} onChange={handleInputChange} />
              </div>
              <div className="col-md-2">
                <label className="form-label x-small fw-bold">Barcode</label>
                <input type="text" id="barcode" className="form-control form-control-sm" value={formData.barcode} onChange={handleInputChange} />
              </div>
              <div className="col-md-8">
                <label className="form-label x-small fw-bold">Item Name</label>
                <div className="input-group input-group-sm">
                  <input type="text" id="itemName" className="form-control" value={formData.itemName} onChange={handleInputChange} placeholder="Search item..." />
                  <button className="btn btn-outline-secondary" type="button"><i className="bi bi-search"></i></button>
                </div>
              </div>
            </div>
            {/* Entry Row 2 */}
            <div className="row g-2 align-items-end">
              <div className="col">
                <label className="form-label x-small fw-bold">Qty</label>
                <input type="number" id="quantity" className="form-control form-control-sm text-center fw-bold text-primary" value={formData.quantity} onChange={handleInputChange} />
              </div>
              <div className="col">
                <label className="form-label x-small fw-bold">MRP</label>
                <input type="number" id="mrp" className="form-control form-control-sm text-end" value={formData.mrp} onChange={handleInputChange} />
              </div>
              <div className="col">
                <label className="form-label x-small fw-bold">Disc (Amt)</label>
                <input type="number" id="discount" className="form-control form-control-sm text-center text-danger" value={formData.discount} onChange={handleInputChange} />
              </div>
              <div className="col">
                <label className="form-label x-small fw-bold text-success">Taxable</label>
                <div className="form-control form-control-sm fw-bold bg-light text-end">₹{formData.taxableAmount}</div>
              </div>
              <div className="col">
                <label className="form-label x-small fw-bold">CGST%</label>
                <input type="number" id="cgst" className="form-control form-control-sm text-center" value={formData.cgst} onChange={handleInputChange} />
              </div>
              <div className="col">
                <label className="form-label x-small fw-bold">SGST%</label>
                <input type="number" id="sgst" className="form-control form-control-sm text-center" value={formData.sgst} onChange={handleInputChange} />
              </div>
              <div className="col-md-2">
                 <div className="small fw-bold text-primary mb-1 text-end" style={{ fontSize: '10px' }}>Row Total: ₹{formData.rowTotalAmount}</div>
                 <button type="button" className="btn btn-primary btn-sm fw-bold w-100 shadow-sm" onClick={addItem}>
                    <i className="bi bi-cart-plus me-2"></i>Add to List
                 </button>
              </div>
            </div>
          </div>

          {/* --- Items List Table --- */}
          <div className="mb-4 shadow-sm rounded-4 overflow-hidden border">
             <CommonTable 
               columns={columns} 
               data={itemsList} 
               showActions={true} 
               onDelete={removeItem}
               onEdit={(idx) => setFormData(prev => ({ ...prev, ...itemsList[idx] }))}
               showSearch={false}
             />
          </div>

          {/* --- Bottom Summary & Payments --- */}
          <div className="row g-4 pt-3">
            {/* Left: Summary Totals */}
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm bg-light-subtle">
                <div className="card-body">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-secondary"><i className="bi bi-graph-up me-2"></i>Sale Summary</h6>
                  <div className="d-flex justify-content-between mb-2 small text-muted">
                    <span>Total Quantity:</span>
                    <span className="fw-bold text-dark">{totals.totalQty}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small text-muted">
                    <span>Total Discount:</span>
                    <span className="fw-bold text-danger">- ₹{totals.totalDiscount}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3 text-muted">
                    <span className="fw-bold">Total Amount:</span>
                    <span className="fw-bold text-dark h6">₹{totals.totalAmountItems}</span>
                  </div>
                  <div className="row g-2 align-items-center mt-2">
                    <div className="col-6 small fw-bold text-muted">Round Off:</div>
                    <div className="col-6">
                      <input type="number" id="roundOff" className="form-control form-control-sm text-end fw-bold" value={formData.roundOff} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Payments */}
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: "#f0fdf4" }}>
                <div className="card-body">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-success"><i className="bi bi-cash-stack me-2"></i>Payment Details</h6>
                  <div className="mb-3">
                    <label className="form-label x-small fw-bold text-muted">Cash Received</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white">₹</span>
                      <input type="number" id="cashReceived" className="form-control fw-bold border-primary text-primary" value={formData.cashReceived} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label x-small fw-bold text-muted">Payment UPI</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white"><i className="bi bi-qr-code"></i></span>
                      <input type="number" id="paymentUPI" className="form-control fw-bold" value={formData.paymentUPI} onChange={handleInputChange} />
                    </div>
                  </div>
                  
                  {parseFloat(totals.cashReturn) > 0 && (
                    <div className="bg-success bg-opacity-10 p-2 rounded border border-success d-flex justify-content-between align-items-center mb-2">
                      <span className="small fw-bold text-success">Cash to Return:</span>
                      <span className="h6 mb-0 fw-bold text-success">₹{totals.cashReturn}</span>
                    </div>
                  )}

                  {parseFloat(totals.balanceDue) > 0 && (
                    <div className="bg-danger bg-opacity-10 p-2 rounded border border-danger d-flex justify-content-between align-items-center mb-2">
                      <span className="small fw-bold text-danger">Balance Due:</span>
                      <span className="h6 mb-0 fw-bold text-danger">₹{totals.balanceDue}</span>
                    </div>
                  )}

                  {parseFloat(totals.grandTotal) > 0 && parseFloat(totals.cashReturn) === 0 && parseFloat(totals.balanceDue) === 0 && (
                    <div className="bg-primary bg-opacity-10 p-2 rounded border border-primary d-flex justify-content-between align-items-center">
                      <span className="small fw-bold text-primary">Payment Status:</span>
                      <span className="h6 mb-0 fw-bold text-primary">Full Paid</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Bill Action */}
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-lg text-white" style={{ backgroundColor: "#3b82f6" }}>
                <div className="card-body text-center d-flex flex-column justify-content-center">
                  <span className="small fw-bold text-uppercase opacity-75">Total Bill Amount</span>
                  <h1 className="fw-bold mb-4">₹{totals.grandTotal}</h1>
                  <div className="d-grid gap-2">
                    <button className="btn btn-light fw-bold py-2"><i className="bi bi-check-circle-fill me-2"></i>Save Sale</button>
                    <button className="btn btn-outline-light fw-bold py-2"><i className="bi bi-printer me-2"></i>Print Receipt</button>
                    <button className="btn btn-link text-white text-decoration-none small mt-2 opacity-75">Cancel Transaction</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .x-small { font-size: 0.7rem; }
        .bg-light-subtle { background-color: #f1f5f9 !important; }
        .form-control:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.15rem rgba(59, 130, 246, 0.25);
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        .form-check-input:checked {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default Stocksale;