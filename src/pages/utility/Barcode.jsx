import React, { useState, useEffect, useRef } from "react";
import Barcode from "react-barcode";
import { toast } from "react-toastify";
import { getMainBranchCurrentStock } from "../../services/masters/stock/stockdistribution";
import "./Barcode.css";

const BarcodeGenerator = () => {
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemList, setShowItemList] = useState(false);

  const [formData, setFormData] = useState({
    itemNo: "",
    barcode: "",
    itemName: "",
    selectedItemDetails: null,
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchItems();
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
      toast.error("Failed to load item list.");
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
            item.Stock_id?.toString().toLowerCase().includes(lowerValue)
        );
        setFilteredItems(filtered);
        setShowItemList(true);
      } else {
        setShowItemList(false);
      }
    }
  };

  const handleItemSelect = (item) => {
    setFormData((prev) => ({
      ...prev,
      itemNo: item.Stock_no || item.Stock_id,
      barcode: item.Barcode || "",
      itemName: item.Stock_name || "",
      selectedItemDetails: item,
    }));
    setShowItemList(false);
  };

  const handlePrint = () => {
    if (!formData.barcode) {
      toast.error("Please select an item with a valid barcode.");
      return;
    }
    window.print();
  };

  return (
    <div className="container-fluid p-4 print-hide">
      <div className="bg-white p-4 rounded shadow-lg mx-auto" style={{ maxWidth: "800px" }}>
        <div className="text-white rounded mb-4 p-3 text-center" style={{ backgroundColor: "#365b80" }}>
          <h4 className="mb-0 fw-bold">Generate Barcode</h4>
        </div>

        <form className="row g-3 align-items-end" onSubmit={(e) => e.preventDefault()}>
          <div className="col-md-5 position-relative">
            <label className="form-label fw-bold small">Search Item (Name or Barcode)</label>
            <input
              type="text"
              id="itemName"
              value={formData.itemName}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Start typing to search..."
              autoComplete="off"
            />
            {showItemList && (
              <div
                className="position-absolute bg-white shadow w-100 mt-1 rounded overflow-auto"
                style={{ maxHeight: "200px", zIndex: 1000, border: "1px solid #ddd" }}
                ref={dropdownRef}
              >
                {filteredItems.map((item) => (
                  <div
                    key={item.Stock_id}
                    className="p-2 cursor-pointer border-bottom small hover-bg-light"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleItemSelect(item)}
                  >
                    {item.Stock_name} {item.Barcode ? `(Barcode: ${item.Barcode})` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-md-3">
            <label className="form-label fw-bold small">Barcode Number</label>
            <input
              type="text"
              id="barcode"
              value={formData.barcode}
              readOnly
              className="form-control bg-light"
            />
          </div>

          <div className="col-md-4">
            <button type="button" className="btn btn-success w-100 fw-bold" onClick={handlePrint}>
              <i className="bi bi-printer me-2"></i> Print
            </button>
          </div>

          {/* Details view for the selected item */}
          {formData.selectedItemDetails && (
            <div className="col-12 bg-light p-3 rounded mt-4 d-flex justify-content-around border">
              <div className="text-center px-3 border-end w-100">
                <div className="small text-muted fw-bold">Current Stock</div>
                <div className="h6 mb-0 text-dark">{formData.selectedItemDetails.Current_Stock || 0}</div>
              </div>
              <div className="text-center px-3 border-end w-100">
                <div className="small text-muted fw-bold">MRP</div>
                <div className="h6 mb-0 text-primary">₹{formData.selectedItemDetails.MRP || 0}</div>
              </div>
              <div className="text-center px-3 border-end w-100">
                <div className="small text-muted fw-bold">Discount</div>
                <div className="h6 mb-0 text-danger">₹{formData.selectedItemDetails.Discount || 0}</div>
              </div>
              <div className="text-center px-3 w-100">
                <div className="small text-muted fw-bold">Rate</div>
                <div className="h6 mb-0 text-success">₹{formData.selectedItemDetails.Rate || 0}</div>
              </div>
            </div>
          )}
        </form>

        {formData.barcode && (
          <div className="mt-5 border rounded p-4 text-center bg-light preview-area overflow-auto">
            <h6 className="fw-bold mb-3">Preview</h6>
            <div className="preview-barcode-container d-flex justify-content-center">
              <div className="preview-barcode-item bg-white shadow-sm border" style={{ width: "101.6mm", height: "38mm", overflow: "hidden" }}>
                <LabelTemplate 
                  itemNo={formData.itemNo} 
                  barcode={formData.barcode} 
                  itemName={formData.itemName} 
                  mrp={formData.selectedItemDetails?.MRP} 
                  discount={formData.selectedItemDetails?.Discount}
                  rate={formData.selectedItemDetails?.Rate}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden print area that only displays during window.print() */}
      <div className="print-area">
        {formData.barcode && (
          <div className="print-barcode-page">
            <LabelTemplate 
              itemNo={formData.itemNo} 
              barcode={formData.barcode} 
              itemName={formData.itemName} 
              mrp={formData.selectedItemDetails?.MRP} 
              discount={formData.selectedItemDetails?.Discount}
              rate={formData.selectedItemDetails?.Rate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Extracted label template for consistency between Preview and Print
const LabelTemplate = ({ itemNo, barcode, itemName, mrp, discount, rate }) => (
  <div className="barcode-label-container" style={{
    width: "101.6mm",
    height: "38mm",
    padding: "3mm 5mm",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
    color: "#000",
    backgroundColor: "#fff"
  }}>
    <div className="text-center" style={{ lineHeight: "1.1", marginBottom: "auto" }}>
      <div style={{ fontWeight: "900", fontSize: "15px", letterSpacing: "0.5px" }}>The Royal Touch</div>
      <div style={{ fontWeight: "bold", fontSize: "12px", marginTop: "1px" }}>Being Handsome</div>
    </div>
    
    <div className="text-center d-flex justify-content-center flex-column align-items-center" style={{ margin: "3px 0", flexGrow: 1 }}>
      <Barcode value={barcode} width={1.8} height={28} displayValue={false} margin={0} />
      <div style={{ fontSize: "13px", fontFamily: "monospace", marginTop: "3px", letterSpacing: "2px", fontWeight: "bold" }}>
        *{barcode}*
      </div>
    </div>

    <div style={{ fontSize: "11px", lineHeight: "1.2", width: "100%", marginTop: "auto" }}>
      <div style={{ display: "flex", fontWeight: "bold", marginBottom: "4px", alignItems: "baseline" }}>
        <span style={{ marginRight: "10px", fontSize: "12px" }}>{itemNo}</span>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textAlign: "left", fontSize: "12px" }}>
          {itemName}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "10px", fontWeight: "bold" }}>
        <span>
          MRP: {parseFloat(mrp || 0).toFixed(2)} 
          <span style={{ fontSize: "8px", fontWeight: "normal", marginLeft: "2px" }}>(Incl. taxes)</span>
        </span>
        {(parseFloat(discount) > 0) && (
          <span>Disc: {parseFloat(discount).toFixed(2)}</span>
        )}
        <span style={{ fontSize: "13px" }}>
          Rate: {parseFloat(rate || 0).toFixed(2)}
        </span>
      </div>
    </div>
  </div>
);

export default BarcodeGenerator;
