import React, { useState, useEffect, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";

const numberToWords = (num) => {
  if (num === 0) return "Zero Only";
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const format = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + format(n % 100) : "");
    return "";
  };

  const convert = (n) => {
    if (n === 0) return "";
    let str = "";
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n > 0) {
      str += format(n);
    }
    return str.trim();
  };

  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);
  let res = convert(whole) + " Rupees";
  if (fraction > 0) {
    res += " and " + convert(fraction) + " Paise";
  }
  return res + " Only";
};

const Stockpurchase = () => {
  // --- State for Master Info (Header) ---
  const [masterData, setMasterData] = useState({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    supplierNo: "",
    supplierName: "",
    travelingPermitNo: "",
    vehicleNo: "",
    igstOption: false,
    transactionDate: new Date().toISOString().split("T")[0],
  });

  // --- State for Current Item Entry ---
  const [itemEntry, setItemEntry] = useState({
    itemNo: "",
    barcode: "",
    itemName: "",
    quantity: "",
    mrp: "",
    rate: "",
    discount: "0",
    cgst: "0",
    sgst: "0",
    totalAmount: "0.00",
  });

  // --- State for Items Table ---
  const [purchaseItems, setPurchaseItems] = useState([]);
  
  // --- State for Footer Charges & Adjustments ---
  const [footerData, setFooterData] = useState({
    hamali: "0",
    travellingRent: "0",
    difference: "0",
    ses: "0",
    tcs: "0",
    netDiscount: "0",
    creditNote: "0",
    roundOff: "0",
  });

  // --- Search & UI States ---
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Handlers ---
  const handleMasterChange = (e) => {
    const { id, value } = e.target;
    setMasterData((prev) => ({ ...prev, [id]: value }));
  };

    const handleItemChange = (e) => {
    const { id, value } = e.target;
    setItemEntry((prev) => {
      const updated = { ...prev, [id]: value };
      
      const qty = parseFloat(updated.quantity) || 0;
      const rate = parseFloat(updated.rate) || 0;
      const discAmt = parseFloat(updated.discount) || 0;
      const cgstPercent = parseFloat(updated.cgst) || 0;
      const sgstPercent = parseFloat(updated.sgst) || 0;

      const taxableValue = (rate - discAmt) * qty;
      const gstAmount = (taxableValue * (cgstPercent + sgstPercent)) / 100;
      
      updated.totalAmount = (taxableValue + gstAmount).toFixed(2);
      
      return updated;
    });
  };

  const handleFooterChange = (e) => {
    const { id, value } = e.target;
    setFooterData((prev) => ({ ...prev, [id]: value }));
  };

  const addItem = () => {
    if (!itemEntry.itemName || !itemEntry.quantity || !itemEntry.rate) {
      toast.error("Please fill Item Name, Quantity and Rate");
      return;
    }

    const newItem = {
      ...itemEntry,
      id: Date.now(),
      totalAmount: parseFloat(itemEntry.totalAmount)
    };

    setPurchaseItems((prev) => [...prev, newItem]);
    
    // Reset item entry
    setItemEntry({
      itemNo: "",
      barcode: "",
      itemName: "",
      quantity: "",
      mrp: "",
      rate: "",
      discount: "0",
      cgst: "0",
      sgst: "0",
      totalAmount: "0.00",
    });
  };

  const removeItem = (index) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Derived Calculations (Totals) ---
  const totals = useMemo(() => {
    const totalQty = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalCGST = purchaseItems.reduce((sum, item) => {
      const rate = parseFloat(item.rate) || 0;
      const disc = (rate * (parseFloat(item.discount) || 0)) / 100;
      const taxable = rate - disc;
      const gst = (taxable * (parseFloat(item.cgst) || 0)) / 100;
      return sum + (gst * (parseFloat(item.quantity) || 0));
    }, 0);
    const totalSGST = purchaseItems.reduce((sum, item) => {
      const rate = parseFloat(item.rate) || 0;
      const disc = (rate * (parseFloat(item.discount) || 0)) / 100;
      const taxable = rate - disc;
      const gst = (taxable * (parseFloat(item.sgst) || 0)) / 100;
      return sum + (gst * (parseFloat(item.quantity) || 0));
    }, 0);
    const totalDiscount = purchaseItems.reduce((sum, item) => {
      return sum + ((parseFloat(item.discount) || 0) * (parseFloat(item.quantity) || 0));
    }, 0);
    const totalPurchase = purchaseItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    // Bill Amount = Total Purchase + Hamali + Rent + Diff + Ses + TCS - NetDisc - CreditNote + RoundOff
    const billAmount = totalPurchase 
      + (parseFloat(footerData.hamali) || 0)
      + (parseFloat(footerData.travellingRent) || 0)
      + (parseFloat(footerData.difference) || 0)
      + (parseFloat(footerData.ses) || 0)
      + (parseFloat(footerData.tcs) || 0)
      - (parseFloat(footerData.netDiscount) || 0)
      - (parseFloat(footerData.creditNote) || 0)
      + (parseFloat(footerData.roundOff) || 0);

    return {
      totalQty,
      totalCGST: totalCGST.toFixed(2),
      totalSGST: totalSGST.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalPurchase: totalPurchase.toFixed(2),
      billAmount: billAmount.toFixed(2)
    };
  }, [purchaseItems, footerData]);

  const columns = [
    { label: "Item No", accessor: "itemNo" },
    { label: "Barcode", accessor: "barcode" },
    { label: "Item Name", accessor: "itemName" },
    { label: "Qty", accessor: "quantity" },
    { label: "MRP", accessor: "mrp" },
    { label: "Rate", accessor: "rate" },
    { label: "Disc Amt", accessor: "discount" },
    { label: "CGST %", accessor: "cgst" },
    { label: "SGST %", accessor: "sgst" },
    { label: "Total", accessor: "totalAmount", render: (val) => `₹${parseFloat(val).toFixed(2)}` },
  ];

  return (
    <div className="container-fluid p-3" style={{ backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      <ToastContainer />
      
      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: "#2c3e50", borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }}>
          <h5 className="mb-0 fw-bold"><i className="bi bi-cart-check-fill me-2"></i>Stock Purchase</h5>
          <div className="btn-group">
            <button className="btn btn-sm btn-outline-light" onClick={() => setShowTable(!showTable)}>
              {showTable ? "Hide List" : "Show List"}
            </button>
          </div>
        </div>

        <div className="card-body p-4">
          {/* --- Section 1: Invoice & Supplier Header --- */}
          <div className="row g-3 mb-4 pb-3 border-bottom">
            <div className="col-md-2">
              <label className="form-label small fw-bold text-muted">Invoice No *</label>
              <input type="text" id="invoiceNo" className="form-control form-control-sm border-primary" value={masterData.invoiceNo} onChange={handleMasterChange} placeholder="Enter Invoice No" />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-bold text-muted">Invoice Date</label>
              <input type="date" id="invoiceDate" className="form-control form-control-sm" value={masterData.invoiceDate} onChange={handleMasterChange} />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-bold text-muted">Supplier No</label>
              <input type="text" id="supplierNo" className="form-control form-control-sm" value={masterData.supplierNo} onChange={handleMasterChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-muted">Supplier Name</label>
              <div className="input-group input-group-sm">
                <input type="text" id="supplierName" className="form-control" value={masterData.supplierName} onChange={handleMasterChange} placeholder="Search Supplier..." />
                <button className="btn btn-primary" type="button"><i className="bi bi-search"></i></button>
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-bold text-muted">Trans. Date</label>
              <input type="date" id="transactionDate" className="form-control form-control-sm" value={masterData.transactionDate} onChange={handleMasterChange} />
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold text-muted">Traveling Permit No</label>
              <input type="text" id="travelingPermitNo" className="form-control form-control-sm" value={masterData.travelingPermitNo} onChange={handleMasterChange} />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-bold text-muted">Vehicle No</label>
              <input type="text" id="vehicleNo" className="form-control form-control-sm" value={masterData.vehicleNo} onChange={handleMasterChange} />
            </div>
            <div className="col-md-1 d-flex align-items-center mt-4">
              <div className="form-check">
                <input 
                  type="checkbox" 
                  id="igstOption" 
                  className="form-check-input" 
                  checked={masterData.igstOption} 
                  onChange={(e) => setMasterData(prev => ({ ...prev, igstOption: e.target.checked }))} 
                />
                <label className="form-check-label small fw-bold text-muted" htmlFor="igstOption">
                  IGST
                </label>
              </div>
            </div>
          </div>

          {/* --- Section 2: Item Entry --- */}
          <div className="bg-light p-3 rounded-3 mb-4 border">
            {/* Row 1: Item Identifiers */}
            <div className="row g-2 mb-3">
              <div className="col-md-2">
                <label className="form-label x-small fw-bold">Item No</label>
                <input type="text" id="itemNo" className="form-control form-control-sm" value={itemEntry.itemNo} onChange={handleItemChange} />
              </div>
              <div className="col-md-2">
                <label className="form-label x-small fw-bold">Barcode</label>
                <input type="text" id="barcode" className="form-control form-control-sm" value={itemEntry.barcode} onChange={handleItemChange} />
              </div>
              <div className="col-md-8">
                <label className="form-label x-small fw-bold">Item Name</label>
                <div className="input-group input-group-sm">
                  <input type="text" id="itemName" className="form-control" value={itemEntry.itemName} onChange={handleItemChange} placeholder="Type item name or click list icon..." />
                  <button className="btn btn-secondary" type="button" title="View Whole List"><i className="bi bi-list-ul"></i></button>
                </div>
              </div>
            </div>

            {/* Row 2: Pricing & Quantities (Upto Total Exclusive) */}
            <div className="row g-2 mb-3 align-items-end">
              <div className="col">
                <label className="form-label x-small fw-bold">Qty</label>
                <input type="number" id="quantity" className="form-control form-control-sm text-center fw-bold text-primary" value={itemEntry.quantity} onChange={handleItemChange} />
              </div>
              <div className="col">
                <label className="form-label x-small fw-bold">MRP</label>
                <input type="number" id="mrp" className="form-control form-control-sm text-end" value={itemEntry.mrp} onChange={handleItemChange} />
              </div>
              <div className="col">
                <label className="form-label x-small fw-bold">Rate</label>
                <input type="number" id="rate" className="form-control form-control-sm text-end" value={itemEntry.rate} onChange={handleItemChange} />
              </div>
              <div className="col">
                <label className="form-label x-small fw-bold text-danger">Disc (Amt)</label>
                <input type="number" id="discount" className="form-control form-control-sm text-center" value={itemEntry.discount} onChange={handleItemChange} />
              </div>
              <div className="col">
                <label className="form-label x-small fw-bold text-success">Total (Excl. Tax)</label>
                <div className="form-control form-control-sm fw-bold bg-white border-success text-success text-end">
                  ₹{((parseFloat(itemEntry.rate) || 0) - (parseFloat(itemEntry.discount) || 0)) * (parseFloat(itemEntry.quantity) || 0)}
                </div>
              </div>
            </div>

            {/* Row 3: Taxes & Action */}
            <div className="row g-2 align-items-end">
              <div className="col-md-2">
                <label className="form-label x-small fw-bold">CGST%</label>
                <input type="number" id="cgst" className="form-control form-control-sm text-center" value={itemEntry.cgst} onChange={handleItemChange} />
              </div>
              <div className="col-md-2">
                <label className="form-label x-small fw-bold">SGST%</label>
                <input type="number" id="sgst" className="form-control form-control-sm text-center" value={itemEntry.sgst} onChange={handleItemChange} />
              </div>
              <div className="col-md-4">
                 <div className="p-1 px-3 bg-primary bg-opacity-10 rounded border border-primary border-opacity-25 d-flex justify-content-between align-items-center" style={{ height: '31px' }}>
                    <span className="x-small fw-bold text-primary text-uppercase">Final Row Amount:</span>
                    <span className="fw-bold text-primary small">₹{itemEntry.totalAmount}</span>
                 </div>
              </div>
              <div className="col-md-4">
                <button type="button" className="btn btn-success btn-sm fw-bold shadow-sm w-100" onClick={addItem}>
                  <i className="bi bi-plus-circle me-2"></i>Add to Purchase List
                </button>
              </div>
            </div>
          </div>

          {/* --- Section 3: Items Table --- */}
          <div className="mb-4 shadow-sm rounded overflow-hidden" style={{ minHeight: "200px", border: "1px solid #dee2e6" }}>
            <CommonTable 
              columns={columns} 
              data={purchaseItems} 
              showActions={true} 
              onDelete={removeItem}
              onEdit={(idx) => setItemEntry(purchaseItems[idx])}
              showSearch={false}
            />
          </div>

          {/* --- Section 4: Footer Calculations & Summary --- */}
          <div className="row g-4">
            {/* Left: Additional Charges */}
            <div className="col-md-8">
              <div className="card border-0 bg-light-subtle shadow-sm h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2">Adjustments & Charges</h6>
                  <div className="row row-cols-2 row-cols-md-4 g-3">
                    <div className="col">
                      <label className="form-label x-small fw-bold text-muted">Hamali</label>
                      <input type="number" id="hamali" className="form-control form-control-sm" value={footerData.hamali} onChange={handleFooterChange} />
                    </div>
                    <div className="col">
                      <label className="form-label x-small fw-bold text-muted">Travelling Rent</label>
                      <input type="number" id="travellingRent" className="form-control form-control-sm" value={footerData.travellingRent} onChange={handleFooterChange} />
                    </div>
                    <div className="col">
                      <label className="form-label x-small fw-bold text-muted">Difference</label>
                      <input type="number" id="difference" className="form-control form-control-sm" value={footerData.difference} onChange={handleFooterChange} />
                    </div>
                    <div className="col">
                      <label className="form-label x-small fw-bold text-muted">Cess (Ses)</label>
                      <input type="number" id="ses" className="form-control form-control-sm" value={footerData.ses} onChange={handleFooterChange} />
                    </div>
                    <div className="col">
                      <label className="form-label x-small fw-bold text-muted">TCS</label>
                      <input type="number" id="tcs" className="form-control form-control-sm" value={footerData.tcs} onChange={handleFooterChange} />
                    </div>
                    <div className="col">
                      <label className="form-label x-small fw-bold text-muted">Net Discount</label>
                      <input type="number" id="netDiscount" className="form-control form-control-sm" value={footerData.netDiscount} onChange={handleFooterChange} />
                    </div>
                    <div className="col">
                      <label className="form-label x-small fw-bold text-muted">Credit Note</label>
                      <input type="number" id="creditNote" className="form-control form-control-sm" value={footerData.creditNote} onChange={handleFooterChange} />
                    </div>
                    <div className="col">
                      <label className="form-label x-small fw-bold text-muted">Round Off</label>
                      <input type="number" id="roundOff" className="form-control form-control-sm" value={footerData.roundOff} onChange={handleFooterChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Summary Totals */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm" style={{ backgroundColor: "#eef2f3" }}>
                <div className="card-body">
                  <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2 text-center">Summary</h6>
                  <div className="d-flex justify-content-between mb-2 small px-2">
                    <span>Total Quantity:</span>
                    <span className="fw-bold text-end w-50">{totals.totalQty}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small px-2">
                    <span>Total Discount:</span>
                    <span className="fw-bold text-danger text-end w-50">₹{totals.totalDiscount}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small px-3 border-start border-3 border-info">
                    <span>Total CGST:</span>
                    <span className="fw-bold text-end w-50">₹{totals.totalCGST}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small px-3 border-start border-3 border-info">
                    <span>Total SGST:</span>
                    <span className="fw-bold text-end w-50">₹{totals.totalSGST}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3 px-2">
                    <span className="fw-bold">Total Purchase:</span>
                    <span className="fw-bold h6 mb-0 text-end w-50">₹{totals.totalPurchase}</span>
                  </div>
                  <div className="bg-white p-3 rounded-3 shadow-sm border border-2 border-primary mt-2">
                    <span className="small fw-bold text-muted text-uppercase d-block mb-1 text-end">Bill Amount</span>
                    <h2 className="fw-bold text-primary mb-0 text-end">₹{totals.billAmount}</h2>
                  </div>
                  <div className="mt-3 p-2 rounded bg-white-50 border-top">
                    <span className="x-small fw-bold text-muted text-uppercase d-block mb-1">Amount in Words</span>
                    <span className="small fw-bold text-secondary text-capitalize d-block">{numberToWords(parseFloat(totals.billAmount))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Buttons Section --- */}
          <div className="mt-5 pt-3 border-top d-flex justify-content-center gap-3">
            <button className="btn btn-success px-5 fw-bold shadow-sm py-2">
              <i className="bi bi-save me-2"></i>Save
            </button>
            <button className="btn btn-warning px-5 fw-bold shadow-sm py-2 text-white">
              <i className="bi bi-pencil-square me-2"></i>Update
            </button>
            <button className="btn btn-info px-5 fw-bold shadow-sm py-2 text-white" onClick={() => setShowTable(!showTable)}>
              <i className="bi bi-list-check me-2"></i>List
            </button>
            <button className="btn btn-danger px-5 fw-bold shadow-sm py-2">
              <i className="bi bi-x-circle me-2"></i>Cancel
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .x-small { font-size: 0.75rem; }
        .bg-light-subtle { background-color: #f8f9fa !important; }
        .form-control:focus, .form-select:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
        }
        .btn-success { background-color: #27ae60; border: none; }
        .btn-success:hover { background-color: #219150; }
        .btn-primary { background-color: #3498db; border: none; }
        .btn-danger { background-color: #e74c3c; border: none; }
        .card { border-radius: 12px; overflow: hidden; }
        
        /* Hide number input spinners */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default Stockpurchase;