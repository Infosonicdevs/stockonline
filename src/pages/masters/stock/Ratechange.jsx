import React, { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getStockRates,
  createStockRate,
  updateStockRate,
  deleteStockRate,
} from "../../../services/masters/stockRate";

function Ratechange() {
  const [formData, setFormData] = useState({
    stockId: "",
    itemNo: "",
    barcode: "",
    itemName: "",
    existingMRP: "",
    existingDiscount: "",
    existingRate: "",
    newMRP: "",
    newDiscount: "",
    newRate: "",
  });

  const [stocks, setStocks] = useState([]);
  const [ratesList, setRatesList] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editRateId, setEditRateId] = useState(null);
  const [editSeqNo, setEditSeqNo] = useState(null);
  const [search, setSearch] = useState("");

  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemList, setShowItemList] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowItemList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loginDate = localStorage.getItem("loginDate");
  const username = localStorage.getItem("username");

  const columns = [
    {
      label: "Sr. No",
      render: (_, __, index) => index + 1,
    },
    {
      label: "Stock Name",
      render: (_, row) => {
        const stock = stocks.find((s) => s.Stock_id === row.Stock_id);
        return stock ? stock.Stock_name : row.Stock_id;
      },
    },
    {
      label: "MRP",
      accessor: "MRP",
    },
    {
      label: "Discount",
      accessor: "Discount",
    },
    {
      label: "Rate",
      accessor: "Rate",
    },
    {
      label: "Change Date",
      render: (_, row) => new Date(row.Change_date).toLocaleDateString(),
    },
  ];

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    if (showTable) {
      fetchRates();
    }
  }, [showTable]);

  const fetchRates = async () => {
    try {
      const result = await getStockRates();
      if (result.status === 200) {
        setStocks(result.data);
        setRatesList(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleItemSelect = (item) => {
    setFormData({
      ...formData,
      stockId: item.Stock_id,
      itemNo: item.Stock_no || "",
      barcode: item.Barcode || "",
      itemName: item.Stock_name || "",
      existingMRP: item.MRP !== undefined ? item.MRP : "",
      existingDiscount: item.Discount !== undefined ? item.Discount : "",
      existingRate: item.Rate !== undefined ? item.Rate : "",
    });
    setShowItemList(false);
  };

  const lookupLocally = (field, value) => {
    if (!value) return;
    const item = stocks.find((i) => {
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
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate new rate
      if (name === "newMRP" || name === "newDiscount") {
        const mrp = parseFloat(name === "newMRP" ? value : updated.newMRP) || 0;
        const discount = parseFloat(name === "newDiscount" ? value : updated.newDiscount) || 0;
        updated.newRate = (mrp - discount).toFixed(2);
      }

      return updated;
    });

    if (name === "itemName") {
      if (value.length > 0) {
        const lowerValue = value.toLowerCase();
        const filtered = stocks.filter(
          (item) =>
            item.Stock_name?.toLowerCase().includes(lowerValue) ||
            item.Barcode?.toString().toLowerCase().includes(lowerValue) ||
            item.Stock_no?.toString().toLowerCase().includes(lowerValue) ||
            item.Stock_id?.toString().toLowerCase().includes(lowerValue)
        );
        setFilteredItems(filtered);
        setShowItemList(true);
      } else {
        setShowItemList(false);
      }
    }
  };

  const handleClear = () => {
    setFormData({
      stockId: "",
      itemNo: "",
      barcode: "",
      itemName: "",
      existingMRP: "",
      existingDiscount: "",
      existingRate: "",
      newMRP: "",
      newDiscount: "",
      newRate: "",
    });
    setEditRateId(null);
    setEditSeqNo(null);
    setSearch("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.stockId) return toast.error("Please select a stock item");
    if (!formData.newMRP) return toast.error("New MRP is required");
    if (!formData.newDiscount) return toast.error("New Discount is required");
    if (!formData.newRate) return toast.error("New Rate is required");

    if (editRateId != null) {
      const update_request_body = {
        Rate_id: editRateId,
        Stock_id: parseInt(formData.stockId),
        MRP: parseFloat(formData.newMRP),
        Discount: parseFloat(formData.newDiscount),
        Rate: parseFloat(formData.newRate),
        Change_date: loginDate,
        Sequence_no: editSeqNo || 1,
        On_form: "Rate Change",
        User_name: username || "admin",
      };

      try {
        const result = await updateStockRate(update_request_body);
        if (result.status === 200) {
          toast.success("Rate updated successfully");
          handleClear();
        }
      } catch (error) {
        toast.error("Failed to update rate");
      }
    } else {
      const create_request_body = {
        Stock_id: parseInt(formData.stockId),
        MRP: parseFloat(formData.newMRP),
        Discount: parseFloat(formData.newDiscount),
        Rate: parseFloat(formData.newRate),
        Change_date: loginDate,
        Sequence_no: 1,
        User_name: username || "admin",
        On_form: "new",
      };

      try {
        const result = await createStockRate(create_request_body);
        if (result.status === 200) {
          toast.success("Rate created successfully");
          handleClear();
        }
      } catch (error) {
        toast.error("Failed to create rate");
      }
    }
  };

  const handleEdit = (rate) => {
    setShowTable(false);
    setEditRateId(rate.Rate_id);
    setEditSeqNo(rate.Sequence_no);

    const relatedStock = stocks.find((s) => s.Stock_id === rate.Stock_id);

    setFormData({
      stockId: rate.Stock_id,
      itemNo: relatedStock ? relatedStock.Stock_no || "" : "",
      barcode: relatedStock ? relatedStock.Barcode || "" : "",
      itemName: relatedStock ? relatedStock.Stock_name || "" : "",
      existingMRP: relatedStock ? relatedStock.MRP : "",
      existingDiscount: relatedStock ? relatedStock.Discount : "",
      existingRate: relatedStock ? relatedStock.Rate : "",
      newMRP: rate.MRP,
      newDiscount: rate.Discount,
      newRate: rate.Rate,
    });
  };

  const handleDelete = async (rateId) => {
    if (!window.confirm("Are you sure you want to delete this rate?")) return;
    
    const delete_request_body = {
      Rate_id: rateId,
      User_name: username || "admin",
    };
    try {
      const result = await deleteStockRate(delete_request_body);
      if (result.status === 200) {
        toast.success("Rate deleted successfully");
        fetchRates();
      }
    } catch (error) {
      toast.error("Failed to delete rate");
    }
  };

  const filteredRates = ratesList.filter((r) => {
    const searchTerm = search.toLowerCase();
    const stockName = stocks.find((s) => s.Stock_id === r.Stock_id)?.Stock_name || "";
    return (
      stockName.toLowerCase().includes(searchTerm) ||
      r.MRP?.toString().toLowerCase().includes(searchTerm) ||
      r.Discount?.toString().toLowerCase().includes(searchTerm) ||
      r.Rate?.toString().toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="bg-white">
      {!showTable ? (
        <div
          className="bg-white p-4 rounded mx-auto shadow"
          style={{ maxWidth: "800px" }}
        >
          <div
            className="text-white rounded mb-4 p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Rate Change</h5>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-4 align-items-end">
              <div className="col-md-3">
                <label className="form-label fw-bold small">Item No</label>
                <input
                  type="text"
                  name="itemNo"
                  value={formData.itemNo}
                  onChange={handleChange}
                  onBlur={(e) => lookupLocally("itemNo", e.target.value)}
                  className="form-control form-control-sm"
                  style={{ height: "32px" }}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold small">Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  onBlur={(e) => lookupLocally("barcode", e.target.value)}
                  className="form-control form-control-sm"
                  style={{ height: "32px" }}
                />
              </div>
              <div className="col-md-6 position-relative">
                <label className="form-label fw-bold small">
                  Item Name<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  placeholder="Search item..."
                  className="form-control form-control-sm"
                  autoComplete="off"
                  style={{ height: "32px" }}
                />
                {showItemList && (
                  <div
                    className="position-absolute bg-white shadow w-100 mt-1 rounded overflow-auto"
                    style={{
                      maxHeight: "200px",
                      zIndex: 1000,
                      border: "1px solid #ddd",
                    }}
                    ref={dropdownRef}
                  >
                    {filteredItems.map((item) => (
                      <div
                        key={item.Stock_id}
                        className="p-2 cursor-pointer border-bottom small hover-bg-light"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleItemSelect(item)}
                      >
                        {item.Stock_name} {item.Stock_no ? `- ${item.Stock_no}` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: "14px" }}>
                  Existing MRP
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={formData.existingMRP}
                  disabled
                  style={{ height: "32px", backgroundColor: "#e9ecef" }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: "14px" }}>
                  Existing Discount
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={formData.existingDiscount}
                  disabled
                  style={{ height: "32px", backgroundColor: "#e9ecef" }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: "14px" }}>
                  Existing Rate
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={formData.existingRate}
                  disabled
                  style={{ height: "32px", backgroundColor: "#e9ecef" }}
                />
              </div>
            </div>

            <hr />

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: "14px" }}>
                  New MRP<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm"
                  name="newMRP"
                  value={formData.newMRP}
                  onChange={handleChange}
                  style={{ height: "32px" }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: "14px" }}>
                  New Discount<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm"
                  name="newDiscount"
                  value={formData.newDiscount}
                  onChange={handleChange}
                  style={{ height: "32px" }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: "14px" }}>
                  New Rate<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm"
                  name="newRate"
                  value={formData.newRate}
                  onChange={handleChange}
                  style={{ height: "32px" }}
                />
              </div>
            </div>

            <div className="text-center d-flex justify-content-center gap-2">
              <button
                type="submit"
                className="button-save"
                style={{ fontSize: "14px" }}
              >
                {editRateId != null ? "Update" : "Save"}
              </button>
              <button
                type="button"
                className="button-clear"
                style={{ fontSize: "14px" }}
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-list"
                style={{ fontSize: "14px" }}
                onClick={() => setShowTable(true)}
              >
                Show List
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div
          className="bg-white rounded shadow mx-auto"
          style={{ maxWidth: "800px", padding: "10px" }}
        >
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Rate Change List</h5>
          </div>
          <CommonTable
            columns={columns}
            data={filteredRates}
            onEdit={(row) => handleEdit(row)}
            onDelete={(row) => handleDelete(row.Rate_id)}
            searchValue={search}
            onSearchChange={setSearch}
            onClose={() => {
              setShowTable(false);
              handleClear();
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Ratechange;
