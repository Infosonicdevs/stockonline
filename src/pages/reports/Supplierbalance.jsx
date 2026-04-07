import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getSuppliers,
  getSupplierList,
  saveSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../services/reports/vendorBalance";

function Supplierbalance() {
  const [formData, setFormData] = useState({
    supplierCode: "", // Vend_code
    supplierId: "", // Vend_id
    amount: "00.00",
    id: null, // Opn_bal_id
  });
  const username = localStorage.getItem("username");
  const [searchName, setSearchName] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const filteredSuppliers =
    suppliers?.filter((s) => {
      const supplier = supplierList.find((emp) => emp.Vend_id === s?.Vend_id);

      const values = [
        supplier?.Vend_code || "",
        supplier?.Vend_name || "",
        s?.Amount || "",
      ];

      return values.some((val) =>
        val.toString().toLowerCase().includes(searchName.toLowerCase()),
      );
    }) || [];

  // FETCH SUPPLIERS
  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliers();
      console.log("Suppliers:", res.data);

      if (Array.isArray(res.data)) {
        setSuppliers(res.data);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      console.error("VendorBalance API Error:", err.response?.data);

      setSuppliers([]);

      toast.error("Vendor balance not load ");
    }
  };

  // FETCH SUPPLIER LIST
  const fetchSupplierList = async () => {
    try {
      const res = await getSupplierList();
      console.log("Supplier list:", res.data);
      setSupplierList(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching supplier list");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchSupplierList(); // first get supplier info
      await fetchSuppliers(); // then get balances
    };
    fetchData();
  }, []);

  // HANDLE FORM CHANGE
  // HANDLE FORM CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "supplierCode") {
      const selectedSupplier = supplierList.find((s) => s.Vend_code == value);
      setFormData((prev) => ({
        ...prev,
        supplierCode: value,
        supplierId: selectedSupplier ? selectedSupplier.Vend_id : "",
      }));
      return;
    }

    if (name === "supplierId") {
      const selectedSupplier = supplierList.find((s) => s.Vend_id == value);
      setFormData((prev) => ({
        ...prev,
        supplierId: value,
        supplierCode: selectedSupplier ? selectedSupplier.Vend_code : "",
      }));
      return;
    }

    // 👉 Always store amount as decimal (float)
    if (name === "amount") {
      const floatVal = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        amount: isNaN(floatVal) ? "" : floatVal,
      }));
      return;
    }

    // Other fields
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // CLEAR FORM
  const handleClear = () => {
    setFormData({
      supplierCode: "",
      supplierId: "",
      amount: "00.00",
      id: null,
    });
    setEditIndex(null);
  };

  // SUBMIT FORM
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplierId) {
      toast.error("Please select Supplier");
      return;
    }

    if (formData.amount === "" || formData.amount === "00.00") {
      toast.error("Please enter the Amount");
      return;
    }

    try {
      // Check if a vendor balance already exists for this supplier
      const existing = suppliers.find(
        (s) => s.Vend_id === formData.supplierId && s.Outlet_id === 1,
      );

      if (editIndex !== null) {
        // Updating existing record
        const payload = {
          Opn_bal_id: editIndex,
          Vend_id: formData.supplierId,
          Outlet_id: 1,
          Amount: parseFloat(formData.amount),
          Modified_by: username,
        };
        await updateSupplier(payload);
        toast.success("Vendor balance updated successfully!");
      } else {
        // Creating new record
        if (existing) {
          // If record already exists, prevent duplicate
          toast.error("Record already exists for this supplier!");
          return; // Stop further execution
        }

        const payload = {
          Vend_id: formData.supplierId,
          Outlet_id: 1,
          Amount: parseFloat(formData.amount),
          Created_by: username,
        };
        await saveSupplier(payload);
        toast.success("Vendor balance added successfully!");
      }

      // Refresh table and clear form
      await fetchSuppliers();
      handleClear();
    } catch (error) {
      // console.error(error);
      // toast.error("Error saving vendor balance");
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Something went wrong";
      toast.error(errorMessage);
    }
  };

  // EDIT SUPPLIER
  const handleEdit = (Opn_bal_id) => {
    const s = suppliers.find((u) => u.Opn_bal_id === Opn_bal_id);
    if (!s) return;

    const emp = supplierList.find((emp) => emp.Vend_id === s.Vend_id);

    setFormData({
      supplierCode: emp?.Vend_code || 0,
      supplierId: s.Vend_id,
      amount: s.Amount,
      id: Number.parseInt(s.Opn_bal_id),
    });

    setEditIndex(Opn_bal_id);
    setShowTable(false);
  };

  // DELETE SUPPLIER
  const handleDelete = async (Opn_bal_id) => {
    try {
      await deleteSupplier({ Opn_bal_id, Modified_by: username });
      toast.success("Supplier deleted successfully");
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="container my-1" style={{ fontSize: "14px" }}>
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "700px" }}
      >
        <div
          className="text-white rounded mb-0 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Supplier Balance</h5>
        </div>

        {!showTable ? (
          <form onSubmit={handleSubmit}>
            <div className="row g-2 mt-2 mb-3 align-items-end">
              {/* Supplier Code */}
              <div className="col-md-2">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Supplier Code
                </label>
                <input
                  type="text"
                  name="supplierCode"
                  className="form-control form-control-sm"
                  style={{ width: "120px" }}
                  value={formData.supplierCode}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Supplier Name */}
              <div className="col-md-5">
                <label
                  className="form-label"
                  style={{ marginBottom: "2px", marginLeft: "20px" }}
                >
                  Supplier Name
                </label>
                <select
                  name="supplierId"
                  className="form-select form-select-sm"
                  style={{ marginLeft: "20px", width: "280px" }}
                  value={formData.supplierId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Supplier</option>
                  {supplierList.map((emp) => (
                    <option key={emp.Vend_id} value={emp.Vend_id}>
                      {emp.Vend_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="col-md-2" style={{ marginLeft: "60px" }}>
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  className="form-control form-control-sm"
                  value={formData.amount}
                  onFocus={() => {
                    if (formData.amount === "00.00") {
                      setFormData((prev) => ({ ...prev, amount: "" }));
                    }
                  }}
                  onBlur={() => {
                    if (!formData.amount) {
                      setFormData((prev) => ({ ...prev, amount: "00.00" }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        amount: parseFloat(prev.amount).toFixed(2),
                      }));
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (/^\d*\.?\d*$/.test(value)) {
                      setFormData((prev) => ({ ...prev, amount: value }));
                    }
                  }}
                  required
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="text-center mt-4 d-flex justify-content-center gap-2">
              <button
                type="submit"
                className="button-save"
                style={{ fontSize: "14px" }}
              >
                {editIndex !== null ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="button-clear"
                style={{ fontSize: "14px" }}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-list"
                style={{ fontSize: "14px" }}
                onClick={async () => {
                  await fetchSuppliers();
                  setShowTable(true);
                }}
              >
                Show List
              </button>
            </div>
          </form>
        ) : (
          <div
            className="table-responsive mt-2"
            style={{ maxHeight: "60vh", overflowY: "auto", overflowX: "auto" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2 gap-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowTable(false);
                  handleClear();
                  setSearchName("");
                }}
              >
                Close
              </button>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-search"></i>
                <label className="fw-semibold text-secondary small mb-0">
                  Search
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{
                    width: "250px",
                    marginRight: "260px",
                    height: "25px",
                  }}
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
            </div>

            <table
              className="table table-bordered text-center table-sm table-striped"
              style={{
                whiteSpace: "nowrap",
                width: "max-content",
                minWidth: "100%",
              }}
            >
              <thead
                className="table-light"
                style={{ fontSize: "13px", fontWeight: "semibold" }}
              >
                <tr>
                  <th>Actions</th>
                  <th>Supplier No</th>
                  <th>Supplier Code</th>
                  <th>Supplier Name</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="5">No records found</td>
                  </tr>
                ) : (
                  (filteredSuppliers || []).map((s, index) => {
                    const supplier = supplierList.find(
                      (emp) => emp.Vend_id === s.Vend_id,
                    );
                    return (
                      <tr key={s.Opn_bal_id}>
                        <td>
                          <button
                            className="btn btn-info btn-sm me-1"
                            onClick={() => handleEdit(s.Opn_bal_id)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(s.Opn_bal_id)}
                          >
                            Delete
                          </button>
                        </td>
                        <td>{index + 1}</td>
                        <td>{supplier?.Vend_code || "-"}</td>
                        <td>{supplier?.Vend_name || "-"}</td>
                        <td>{Number(s.Amount).toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Supplierbalance;
