import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  createStockDetail,
  deleteStockDetail,
  getGSTSlabs,
  getStockDetails,
  getStockSubGroups,
  getUnits,
  updateStockDetail,
  getMaxStockNo,
} from "../../../services/reports/stockDetails";
import { getStockGroups } from "../../../services/masters/stockGroupService";

function StockDetails() {
  const [formData, setFormData] = useState({
    barcode: "",
    stockNo: "",
    stockName: "",
    hsnNo: "",
    stockGroup: "",
    stockSubGroup: "",
    weight: "",
    unit: "",
    Isoffer: false,
    quantity: "",
    mrp: "",
    discount: "",
    saleAmount: "",
    includeGst: false,
    slab_id: "",
    Pur_slab_id: "",
    saleGst: "",
    purchaseGst: "",
  });

  const [stocks, setStocks] = useState([]);
  const [stockGroups, setStockGroups] = useState([]);
  const [stockSubGroups, setStockSubGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [gstSlabs, setGSTSlabs] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [search, setSearch] = useState("");
  const loginDate = localStorage.getItem("loginDate");
  const username = localStorage.getItem("username");

  const columns = [
    {
      label: "Sr. No",
      render: (_, __, index) => index + 1,
    },
    {
      label: "Barcode",
      accessor: "Barcode",
    },
    {
      label: "Stock No",
      accessor: "Stock_no",
    },
    {
      label: "Stock Name",
      accessor: "Stock_name",
    },
    {
      label: "HSN",
      accessor: "HSN_no",
    },
    {
      label: "Stock Group",
      accessor: "Group_name",
    },
    {
      label: "Sub Group",
      accessor: "Subgroup_name",
    },
    {
      label: "Weight",
      render: (val, row) => `${row.Weight} - ${row.Unit_name}`,
    },
    {
      label: "Is Offer",
      render: (val, row) => (row.Is_offer == "1" ? "Yes" : "No"),
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
      label: "Sale Amount",
      accessor: "Rate",
    },
    {
      label: "Include GST",
      render: (val, row) => (row.Include_GST == "1" ? "Yes" : "No"),
    },
    {
      label: "Sale GST",
      accessor: "Heading",
    },
    {
      label: "Purchase GST",
      accessor: "Pur_Heading",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchStockGroups(),
          fetchStockSubGroups(),
          fetchUnits(),
          fetchGSTSlabs(),
          fetchMaxStockNo(),
        ]);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (showTable) {
      fetchStockDetails();
    }
  }, [showTable]);

  const handleClear = () => {
    setFormData({
      barcode: "",
      stockNo: "",
      stockName: "",
      hsnNo: "",
      stockGroup: "",
      stockSubGroup: "",
      weight: "",
      unit: "",
      Isoffer: false,
      quantity: "",
      mrp: "",
      discount: "",
      saleAmount: "",
      includeGst: false,
      slab_id: "",
      Pur_slab_id: "",
      saleGst: "",
      purchaseGst: "",
    });
    setEditIndex(null);
    setSearch("");
    fetchMaxStockNo();
  };

  const fetchStockGroups = async () => {
    try {
      const result = await getStockGroups();

      if (result.status === 200) {
        setStockGroups(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchStockSubGroups = async () => {
    try {
      const result = await getStockSubGroups();

      if (result.status === 200 && result.data.length > 0) {
        setStockSubGroups(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUnits = async () => {
    try {
      const result = await getUnits();

      if (result.status === 200 && result.data.length > 0) {
        setUnits(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchGSTSlabs = async () => {
    try {
      const result = await getGSTSlabs();
      if (result.status === 200 && result.data.length > 0) {
        setGSTSlabs(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchMaxStockNo = async () => {
    try {
      const result = await getMaxStockNo();
      if (result.status === 200) {
        setFormData((prev) => ({
          ...prev,
          stockNo: result.data,
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    setFormData({
      ...updatedFormData,
    });
  };
  const fetchStockDetails = async () => {
    try {
      const result = await getStockDetails();
      if (result.status === 200 && result.data.length > 0) {
        setStocks(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.barcode) return toast.error("Barcode is required");
    if (!formData.stockName) return toast.error("Stock Name is required");
    if (!formData.hsnNo) return toast.error("HSN No is required");
    if (!formData.stockGroup) return toast.error("Stock Group is required");
    if (!formData.stockSubGroup)
      return toast.error("Stock Sub Group is required");
    if (!formData.weight) return toast.error("Quantity is required");
    if (!formData.unit) return toast.error("Unit is required");
    if (!formData.mrp) return toast.error("MRP is required");
    if (!formData.discount) return toast.error("Discount is required");
    if (!formData.includeGst) return toast.error("Please select Include GST");
    if (!formData.slab_id) return toast.error("Sale GST is required");
    if (!formData.Pur_slab_id) return toast.error("Purchase GST is required");

    const saleGst = gstSlabs.find(
      (g) => g.Id.toString() === formData.slab_id?.toString(),
    )?.Heading;

    const purchaseGst = gstSlabs.find(
      (g) => g.Id.toString() === formData.Pur_slab_id?.toString(),
    )?.Heading;

    if (editIndex != null) {
      if (!formData.stockNo) return toast.error("Stock No is required");
      const update_request_body = {
        Stock_id: editIndex,
        Stock_no: formData.stockNo,
        Barcode: formData.barcode,
        Stock_name: formData.stockName,
        HSN_no: formData.hsnNo,
        Group_id: formData.stockGroup,
        Subgroup_id: formData.stockSubGroup,
        Weight: formData.weight,
        Unit_id: formData.unit,
        Include_GST: formData.includeGst ? "1" : "0",
        Slab_id: formData.slab_id,
        Is_offer: formData.Isoffer ? "1" : "0",
        Offer_qty: formData.quantity || 0,
        Is_stock: "1",
        Pur_slab_id: formData.Pur_slab_id,
        MRP: formData.mrp,
        Discount: formData.discount,
        Rate: formData.saleAmount,
        Change_date: loginDate,
        On_form: "Details",
        Up_Stock_no: formData.stockNo,
        Sale_Heading: saleGst,
        Purchase_Heading: purchaseGst,
        Modified_by: username,
      };

      try {
        const result = await updateStockDetail(update_request_body);
        if (result.status === 200) {
          toast.success("Stock detail updated successfully");
          setEditIndex(null);
          handleClear();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data || "Something went wrong";
        toast.error(errorMessage);
      }
    } else {
      const create_request_body = {
        Barcode: formData.barcode,
        Stock_name: formData.stockName,
        HSN_no: formData.hsnNo,
        Group_id: formData.stockGroup,
        Subgroup_id: formData.stockSubGroup,
        Weight: formData.weight,
        Unit_id: formData.unit,
        Include_GST: formData.includeGst ? "1" : "0",
        Slab_id: formData.slab_id,
        Is_offer: formData.Isoffer ? "1" : "0",
        Offer_qty: formData.quantity || 0,
        Is_stock: "1",
        Pur_slab_id: formData.Pur_slab_id,
        MRP: formData.mrp,
        Discount: formData.discount,
        Rate: formData.saleAmount,
        Change_date: loginDate,
        On_form: "Details",
        Sale_Heading: saleGst,
        Purchase_Heading: purchaseGst,
        Created_by: username,
      };

      try {
        const result = await createStockDetail(create_request_body);
        if (result.status === 200) {
          toast.success("Stock detail created successfully");
          handleClear();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data || "Something went wrong";
        toast.error(errorMessage);
      }
    }
  };

  const handleEdit = async (stock) => {
    setShowTable(false);
    setEditIndex(stock.Stock_id);

    const saleGst = gstSlabs.find(
      (g) => g.Id.toString() === stock.Slab_id?.toString(),
    )?.Heading;

    const purchaseGst = gstSlabs.find(
      (g) => g.Id.toString() === stock.Pur_slab_id?.toString(),
    )?.Heading;

    setFormData({
      barcode: stock.Barcode,
      stockNo: stock.Stock_no,
      stockName: stock.Stock_name,
      hsnNo: stock.HSN_no,
      stockGroup: stock.Group_id,
      stockSubGroup: stock.Subgroup_id,
      weight: stock.Weight,
      unit: stock.Unit_id,
      Isoffer: stock.Is_offer == "1" ? true : false,
      quantity: stock.Offer_qty,
      mrp: stock.MRP,
      discount: stock.Discount,
      saleAmount: stock.Rate,
      includeGst: stock.Include_GST == "1" ? true : false,
      slab_id: stock.Slab_id,
      Pur_slab_id: stock.Pur_slab_id,
      saleGst,
      purchaseGst,
    });
  };

  const handleDelete = async (Stock_id) => {
    const delete_request_body = {
      Stock_id: Stock_id,
      Modified_by: username,
    };
    try {
      const result = await deleteStockDetail(delete_request_body);

      if (result.status === 200) {
        toast.success("Stock detail delete successfully");
        setEditIndex(null);
        fetchStockDetails();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredStocks = stocks.filter((s) => {
    const searchTerm = search.toLowerCase();
    return (
      s.Barcode?.toString().toLowerCase().includes(searchTerm) ||
      s.Stock_no?.toString().toLowerCase().includes(searchTerm) ||
      s.Stock_name?.toLowerCase().includes(searchTerm) ||
      s.HSN_no?.toString().toLowerCase().includes(searchTerm) ||
      s.Group_name?.toLowerCase().includes(searchTerm) ||
      s.Subgroup_name?.toLowerCase().includes(searchTerm) ||
      s.Weight?.toString().toLowerCase().includes(searchTerm) ||
      s.Unit_name?.toLowerCase().includes(searchTerm) ||
      s.MRP?.toString().toLowerCase().includes(searchTerm) ||
      s.Discount?.toString().toLowerCase().includes(searchTerm) ||
      s.Rate?.toString().toLowerCase().includes(searchTerm) ||
      s.Heading?.toLowerCase().includes(searchTerm) ||
      s.Pur_Heading?.toLowerCase().includes(searchTerm) ||
      (s.Is_offer == "1" ? "yes" : "no").includes(searchTerm) ||
      (s.Include_GST == "1" ? "yes" : "no").includes(searchTerm)
    );
  });

  return (
    <div className="bg-white">
      {!showTable ? (
        <div
          className="bg-white p-4 rounded mx-auto shadow"
          style={{ maxWidth: "900px" }}
        >
          <div
            className="text-white rounded mb-2 p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Stock Details</h5>
          </div>
          <form onSubmit={handleSubmit}>
            {/* ROW 1 */}
            <div className="row g-2 ms-2 me-2" style={{ width: "600px" }}>
              <div className="col-md-3">
                <label style={{ fontSize: "14px" }}>
                  Barcode<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  style={{ height: "28px", width: "120px" }}
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: "14px" }}>
                  Stock No<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  style={{ height: "28px", width: "120px" }}
                  name="stockNo"
                  value={formData.stockNo}
                  onChange={handleChange}
                  readOnly
                />
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: "14px" }}>
                  Stock Name<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  style={{ height: "28px", width: "220px" }}
                  name="stockName"
                  value={formData.stockName}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: "14px", marginLeft: "80px" }}>
                  HSN No<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  style={{ height: "28px", marginLeft: "80px" }}
                  name="hsnNo"
                  value={formData.hsnNo}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/*  ROW 2 */}
            <div className="row g-2 mt-2 ms-2 me-2">
              <div className="col-md-3">
                <label style={{ fontSize: "14px" }}>
                  Stock Group<span style={{ color: "red" }}>*</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  style={{ height: "28px" }}
                  name="stockGroup"
                  onChange={handleChange}
                  value={formData.stockGroup}
                >
                  <option value="">Select</option>
                  {stockGroups.map((g) => (
                    <option value={g.Group_id} key={g.Group_id}>
                      {g.Group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: "14px" }}>
                  Stock Sub Group<span style={{ color: "red" }}>*</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  style={{ height: "28px" }}
                  name="stockSubGroup"
                  onChange={handleChange}
                  value={formData.stockSubGroup}
                >
                  <option value="">Select</option>
                  {stockSubGroups.map((s) => (
                    <option value={s.Subgroup_id} key={s.Subgroup_id}>
                      {s.Subgroup_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: "14px" }}>
                  Weight<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  style={{ height: "28px" }}
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: "14px" }}>
                  Unit<span style={{ color: "red" }}>*</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  style={{ height: "28px" }}
                  name="unit"
                  onChange={handleChange}
                  value={formData.unit}
                >
                  <option value="">Select</option>
                  {units.map((u) => (
                    <option value={u.Unit_id} key={u.Unit_id}>
                      {u.Unit_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ROW 3 */}
            <div className="row g-2 mt-2 d-flex ms-2 me-2">
              <div className="col-md-2">
                <label style={{ visibility: "hidden", fontSize: "14px" }}>
                  Hidden
                </label>
                <div className="d-flex align-items-center">
                  <input
                    type="checkbox"
                    name="Isoffer"
                    checked={formData.Isoffer}
                    onChange={handleChange}
                    className="me-2"
                  />
                  <span style={{ fontSize: "14px" }}>Offer</span>
                </div>
              </div>

              {formData.Isoffer && (
                <div className="col-md-2">
                  <label style={{ fontSize: "14px" }}>
                    Quantity<span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    name="quantity"
                    className="form-control form-control-sm"
                    style={{ height: "28px" }}
                    onChange={handleChange}
                    value={formData.quantity}
                  />
                </div>
              )}

              <div className="col-md-2">
                <label style={{ fontSize: "14px" }}>
                  MRP<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  style={{ height: "28px" }}
                  name="mrp"
                  onChange={handleChange}
                  value={formData.mrp}
                />
              </div>

              <div className="col-md-2">
                <label style={{ fontSize: "14px" }}>
                  Discount<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  style={{ height: "28px" }}
                  name="discount"
                  onChange={handleChange}
                  value={formData.discount}
                />
              </div>

              <div className="col-md-2">
                <label style={{ fontSize: "14px" }}>Sale Amount</label>
                <input
                  className="form-control form-control-sm"
                  style={{ height: "28px" }}
                  name="saleAmount"
                  onChange={handleChange}
                  value={formData.saleAmount}
                />
              </div>
            </div>

            {/* ROW 4 */}
            <div className="row g-2 mt-2 ms-2 me-2">
              <div className="col-md-3">
                <label style={{ visibility: "hidden", fontSize: "14px" }}>
                  Hidden
                </label>
                <div className="d-flex align-items-center">
                  <input
                    type="checkbox"
                    name="includeGst"
                    checked={formData.includeGst}
                    onChange={handleChange}
                    className="me-2"
                  />
                  <span style={{ fontSize: "14px" }}>Include GST</span>
                </div>
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: "14px" }}>
                  Sale GST Slab<span style={{ color: "red" }}>*</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  style={{ height: "28px" }}
                  name="slab_id"
                  onChange={handleChange}
                  value={formData.slab_id}
                >
                  <option value="">Select</option>
                  {gstSlabs.map((gs) => (
                    <option value={gs.Id} key={gs.Id}>
                      {gs.Heading}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label style={{ fontSize: "14px" }}>
                  Purchase GST Slab<span style={{ color: "red" }}>*</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  style={{ height: "28px" }}
                  name="Pur_slab_id"
                  onChange={handleChange}
                  value={formData.Pur_slab_id}
                >
                  <option value="">Select</option>
                  {gstSlabs.map((gs) => (
                    <option value={gs.Id} key={gs.Id}>
                      {gs.Heading}%
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/*  BUTTONS */}
            <div className="text-center mt-3 d-flex justify-content-center gap-2">
              <button className="button-save" style={{ fontSize: "14PX" }}>
                {editIndex != null ? "Update" : "Save"}
              </button>
              <button
                type="button"
                className="button-clear"
                style={{ fontSize: "14PX" }}
                onClick={() => handleClear()}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-list"
                style={{ fontSize: "14PX" }}
                onClick={() => {
                  setShowTable(true);
                }}
              >
                Show List
              </button>
            </div>
          </form>
        </div>
      ) : 
       <div
            className="bg-white rounded shadow mx-auto"
            style={{ maxWidth: "800px", padding: "10px" }}
          >
            {/* Header */}
            <div
              className="text-white rounded p-2 text-center"
              style={{ backgroundColor: "#365b80" }}
            >
              <h5 className="mb-0 fw-semibold">Stock Details </h5>
            </div>
      <CommonTable
        columns={columns}
        data={filteredStocks}
        onEdit={(row) => handleEdit(row)}
        onDelete={(row) => handleDelete(row.Stock_id)}
        searchValue={search}
        onSearchChange={setSearch}
        onClose={() => {
          setShowTable(false);
          handleClear();
        }}
      />
      </div>
      }
    </div>
  );
}

export default StockDetails;
