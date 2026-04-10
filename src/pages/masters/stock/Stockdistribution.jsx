import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getMaxBatchNo,
  getOutlets,
  getStockDetailByNo,
  getStockDetailByBarcode,
  getStockDetails,
  insertStockDistribution,
  updateStockDistribution,
  getStockDistributionList,
  getStockDistList,
} from "../../api/stockdistribution";

const StockDistribution = () => {
  const [formData, setFormData] = useState({
    batchNo: "",
    outletId: "",
    date: new Date().toISOString().split("T")[0],
    itemNo: "",
    barcode: "",
    itemName: "",
    quantity: "",
    mrp: "0.00",
    discount: "0.00",
    rate: "0.00",
    remainingQty: "0",
    Stock_id: null,
    Pur_amt: 0,
  });

  const [outlets, setOutlets] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [batchItems, setBatchItems] = useState([]);
  const [showItemList, setShowItemList] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [allDistributions, setAllDistributions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedBatchItems, setSelectedBatchItems] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const dropdownRef = useRef(null);

  const username = localStorage.getItem("username") || "Unknown";

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [batchRes, outletRes, itemsRes] = await Promise.all([
        getMaxBatchNo(),
        getOutlets(),
        getStockDetails(),
      ]);

      if (batchRes.status === 200) {
        console.log("Max Batch No Response:", batchRes.data);
        setFormData((prev) => ({ ...prev, batchNo: batchRes.data || "1" }));
      }
      if (outletRes.status === 200) {
        console.log("Outlets Response:", outletRes.data);
        setOutlets(outletRes.data);
      }
      if (itemsRes.status === 200) {
        console.log("Stock Details Response:", itemsRes.data);
        setAllItems(itemsRes.data);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load initial data");
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (id === "itemName") {
      if (value.length > 0) {
        const lowerValue = value.toLowerCase();
        const filtered = allItems.filter((item) =>
          item.Stock_name.toLowerCase().includes(lowerValue) ||
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
      itemNo: item.Stock_no,
      barcode: item.Barcode,
      itemName: item.Stock_name,
      mrp: item.MRP,
      discount: item.Discount,
      rate: item.Rate,
      remainingQty: item.Balance_Qty || "0",
      Stock_id: item.Stock_id,
      Pur_amt: item.Pur_amt || 0,
    }));
    setShowItemList(false);
  };

  const lookupLocally = (field, value) => {
    if (!value) return;
    const item = allItems.find((i) => {
      if (field === "itemNo") {
        return i.Stock_no?.toString() === value.toString() || i.Stock_id?.toString() === value.toString();
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
    }
  };

  const addItemToBatch = () => {
    if (!formData.itemNo || !formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error("Please select an item and enter a valid quantity");
      return;
    }

    const newItem = {
      ...formData,
      id: Date.now(), // Local unique ID for table
    };

    setBatchItems((prev) => [...prev, newItem]);
    
    // Clear item fields for next entry (keeping batchNo, outletId, date)
    setFormData((prev) => ({
      ...prev,
      itemNo: "",
      barcode: "",
      itemName: "",
      quantity: "",
      mrp: "0.00",
      discount: "0.00",
      rate: "0.00",
      remainingQty: "0",
      Stock_id: null,
      Pur_amt: 0,
    }));
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setBatchItems([]);
    fetchInitialData();
    setFormData((prev) => ({
      ...prev,
      outletId: "",
      itemNo: "",
      barcode: "",
      itemName: "",
      quantity: "",
      mrp: "0.00",
      discount: "0.00",
      rate: "0.00",
      remainingQty: "0",
      Stock_id: null,
      Pur_amt: 0,
    }));
  };

  const removeItem = (id) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!formData.outletId) {
      toast.error("Please select a sales outlet");
      return;
    }
    if (batchItems.length === 0) {
      toast.error("Please add at least one item to the batch");
      return;
    }

    const payload = batchItems.map((item) => ({
      Batch_no: parseInt(formData.batchNo),
      Outlet_id: parseInt(formData.outletId),
      Date: formData.date,
      Invert: "N",
      GS_pur_id: item.GS_pur_id || 0,
      Stock_id: item.Stock_id,
      Pur_amt: parseFloat(item.Pur_amt) || 0,
      MRP: parseFloat(item.mrp) || 0,
      Quantity: parseFloat(item.quantity) || 0,
      Amount: (parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0),
      [isEditMode ? "Modified_by" : "Created_by"]: username,
      Is_new: isEditMode ? (item.id && !item.isExisting ? "Y" : "") : "",
    }));

    try {
      console.log("Saving Distribution Payload:", payload);
      const res = isEditMode 
        ? await updateStockDistribution(payload)
        : await insertStockDistribution(payload);
      
      console.log("Save/Update Response:", res.data);
      if (res.status === 200) {
        toast.success(isEditMode ? "Stock updated successfully" : "Stock distributed successfully");
        setBatchItems([]);
        setIsEditMode(false);
        fetchInitialData(); // Refresh batch no if needed
      }
    } catch (error) {
      toast.error(isEditMode ? "Failed to update distribution" : "Failed to save distribution");
    }
  };

  const fetchDistributions = async () => {
    try {
      const res = await getStockDistList();
      console.log("Distribution History List:", res.data);
      if (res.status === 200) {
        setAllDistributions(res.data);
      }
    } catch (error) {
      toast.error("Error fetching distribution list");
    }
  };

  const handleViewBatch = async (batchNo) => {
    try {
      const res = await getStockDistributionList(batchNo);
      console.log(`Batch Details for Batch ${batchNo}:`, res.data);
      if (res.status === 200) {
        setSelectedBatchItems(res.data);
        setShowModal(true);
      }
    } catch (error) {
      toast.error("Error fetching batch details");
    }
  };

  const handleEditBatch = async (index) => {
    const batch = allDistributions[index];
    if (!batch) return;

    try {
      const res = await getStockDistributionList(batch.Batch_no);
      if (res.status === 200) {
        const details = res.data;
        if (details.length > 0) {
          const first = details[0];
          setFormData({
            batchNo: first.Batch_no,
            outletId: first.Outlet_id,
            date: first.Date ? first.Date.split("T")[0] : new Date().toISOString().split("T")[0],
            itemNo: "",
            barcode: "",
            itemName: "",
            quantity: "",
            mrp: "0.00",
            discount: "0.00",
            rate: "0.00",
            remainingQty: "0",
            Stock_id: null,
            Pur_amt: 0,
          });

          const itemsForBatch = details.map((item) => {
            const stockMaster = allItems.find(s => s.Stock_id?.toString() === item.Stock_id?.toString());
            return {
              id: item.Stock_id + "_" + Date.now() + Math.random(),
              itemNo: stockMaster?.Stock_no || item.Stock_no,
              barcode: item.Barcode || stockMaster?.Barcode,
              itemName: stockMaster?.Stock_name || item.Stock_name,
              quantity: item.Quantity,
              mrp: item.MRP,
              discount: stockMaster?.Discount || 0,
              rate: item.Rate,
              remainingQty: stockMaster?.Balance_Qty || 0,
              Stock_id: item.Stock_id,
              Pur_amt: item.Pur_amt,
              GS_pur_id: item.GS_pur_id,
              isExisting: true
            };
          });

          setBatchItems(itemsForBatch);
          setIsEditMode(true);
          setShowTable(false);
        }
      }
    } catch (error) {
      console.error("Error loading batch for edit:", error);
      toast.error("Failed to load batch for editing");
    }
  };

  const columns = [
    { label: "Item No", accessor: "itemNo" },
    { label: "Item Name", accessor: "itemName" },
    { label: "Barcode", accessor: "barcode" },
    { label: "Quantity", accessor: "quantity" },
    { label: "Rate", accessor: "rate" },
    { label: "MRP", accessor: "mrp" },
    {
        label: "Action",
        render: (val, row) => (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => removeItem(row.id)}
          >
            Remove
          </button>
        )
      }
  ];

  const listColumns = [
    { label: "Batch No", accessor: "Batch_no" },
    {
      label: "Outlet",
      render: (val, row) =>
        outlets.find((o) => o.Outlet_id.toString() === row.Outlet_id?.toString())
          ?.Outlet_name || "Unknown",
    },
    {
      label: "Date",
      render: (val, row) => {
        const dateVal = row.Date || row.Created_date;
        return dateVal ? new Date(dateVal).toLocaleDateString() : "N/A";
      },
    },
    {
      label: "View",
      render: (val, row) => (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => handleViewBatch(row.Batch_no)}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="container-fluid p-4">
      <ToastContainer />
      <div className="bg-white p-4 rounded shadow-lg mx-auto" style={{ maxWidth: "1100px" }}>
        <div className="text-white rounded mb-4 p-3 text-center" style={{ backgroundColor: "#365b80" }}>
          <h4 className="mb-0 fw-bold">Stock Distribution</h4>
        </div>

        {!showTable ? (
          <>
            <form className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-bold small">Batch No</label>
                <input
                  type="text"
                  id="batchNo"
                  value={formData.batchNo}
                  readOnly
                  className="form-control form-control-sm bg-light"
                />
              </div>

              <div className="col-md-5">
                <label className="form-label fw-bold small">Sales Outlet</label>
                <select
                  id="outletId"
                  value={formData.outletId}
                  onChange={handleInputChange}
                  className="form-select form-select-sm"
                >
                  <option value="">--Select Outlet--</option>
                  {outlets.map((o) => (
                    <option key={o.Outlet_id} value={o.Outlet_id}>
                      {o.Outlet_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold small">Date</label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="form-control form-control-sm"
                />
              </div>

              <div className="col-12 border-top pt-3 mt-4">
                <div className="row g-2 align-items-end">
                  <div className="col-md-2">
                    <label className="form-label fw-bold small">Item No</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="text"
                        id="itemNo"
                        value={formData.itemNo}
                        onChange={handleInputChange}
                        onBlur={(e) => lookupLocally("itemNo", e.target.value)}
                        className="form-control"
                      />
                    </div>
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
                        {filteredItems.map((item) => (
                          <div
                            key={item.Stock_id}
                            className="p-2 cursor-pointer border-bottom small hover-bg-light"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleItemSelect(item)}
                          >
                            {item.Stock_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-bold small">Quantity</label>
                    <input
                      type="number"
                      id="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                    />
                  </div>

                  <div className="col-md-2 text-end">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm w-100 fw-bold"
                      onClick={addItemToBatch}
                      style={{ backgroundColor: "#365b80", border: "none" }}
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-12 bg-light p-3 rounded mt-3 d-flex justify-content-between">
                <div className="text-center px-3 border-end">
                  <div className="small text-muted fw-bold">MRP</div>
                  <div className="h6 mb-0 text-primary">₹{formData.mrp}</div>
                </div>
                <div className="text-center px-3 border-end">
                  <div className="small text-muted fw-bold">Discount</div>
                  <div className="h6 mb-0 text-danger">{formData.discount}%</div>
                </div>
                <div className="text-center px-3 border-end">
                  <div className="small text-muted fw-bold">Rate</div>
                  <div className="h6 mb-0 text-success">₹{formData.rate}</div>
                </div>
                <div className="text-center px-3">
                  <div className="small text-muted fw-bold">Remaining Qty</div>
                  <div className="h6 mb-0 fw-bold">{formData.remainingQty}</div>
                </div>
              </div>

              <div className="col-12 mt-4">
                <CommonTable
                  columns={columns}
                  data={batchItems}
                  showSearch={false}
                  showPagination={false}
                />
              </div>

              <div className="col-12 text-center mt-4 d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className={isEditMode ? "btn btn-warning px-4 py-2 fw-bold" : "btn btn-success px-4 py-2 fw-bold"}
                  onClick={handleSave}
                >
                  {isEditMode ? "Update Distribution" : "Save Distribution"}
                </button>
                {isEditMode && (
                  <button
                    type="button"
                    className="btn btn-secondary px-4 py-2 fw-bold"
                    onClick={cancelEdit}
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-info text-white px-4 py-2 fw-bold"
                  onClick={() => {
                    setShowTable(true);
                    fetchDistributions();
                  }}
                >
                   Show History
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="mt-2">
            <CommonTable
               columns={listColumns}
               data={allDistributions}
               onClose={() => setShowTable(false)}
               searchValue={searchTerm}
               onSearchChange={setSearchTerm}
               onEdit={handleEditBatch}
            />
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header text-white" style={{ backgroundColor: "#365b80" }}>
                <h5 className="modal-title fw-bold">Batch Details - Batch No: {selectedBatchItems[0]?.Batch_no}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-0">
                <div className="table-responsive" style={{ maxHeight: "400px" }}>
                  <table className="table table-hover table-striped mb-0 small">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Item Name</th>
                        <th>Qty</th>
                        <th>MRP</th>
                        <th>Discount</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBatchItems.length > 0 ? (
                        selectedBatchItems.map((item, idx) => {
                          const stockItem = allItems.find(s => s.Stock_id?.toString() === item.Stock_id?.toString());
                          const itemName = stockItem?.Stock_name || item.Stock_name || "Unknown Item";
                          const discount = stockItem?.Discount || 0;
                          const rate = item.Rate || stockItem?.Rate || 0;
                          const qty = item.Quantity || item.Qty || 0;
                          return (
                            <tr key={idx}>
                              <td>{itemName}</td>
                              <td>{qty}</td>
                              <td>₹{item.MRP}</td>
                              <td>{discount}%</td>
                              <td>₹{rate}</td>
                              <td>₹{(qty * rate).toFixed(2)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center p-3">No items found in this batch</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="table-light fw-bold sticky-bottom">
                        <tr>
                            <td colSpan="5" className="text-end px-3">Total Amount:</td>
                            <td>₹{selectedBatchItems.reduce((acc, item) => {
                              const stockItem = allItems.find(s => s.Stock_id?.toString() === item.Stock_id?.toString());
                              const rate = item.Rate || stockItem?.Rate || 0;
                              const qty = item.Quantity || item.Qty || 0;
                              return acc + (qty * rate);
                            }, 0).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary btn-sm px-4 fw-bold" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default StockDistribution;