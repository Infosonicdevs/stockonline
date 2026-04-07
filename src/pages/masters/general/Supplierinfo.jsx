import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiClient from "../../../api/client";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getSuppliers,
  getLocations,
  addSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../../services/masters/SupplierService";

function SupplierInfo() {
  const [formData, setFormData] = useState({
    Vend_id: 0,
    Vend_code: "",
    Vend_name: "",
    Vend_address: "",
    GST_no: "",
    State_id: 0,
    State: "",
    Dist_id: 0,
    Dist: "",
    Taluka_id: 0,
    Taluka: "",
    City_id: 0,
    City: "",
    Contact_no: "",
    Email: "",
    Bank_name: "",
    Bank_acc_no: "",
    Bank_branch: "",
    IFSC_code: "",
    Opn_bal: 0,
    Created_by: "",
    Modified_by: 1,
  });
  const username = localStorage.getItem("username") || "Unknown";
  const [suppliers, setSuppliers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [cities, setCities] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [searchSupplier, setSearchSupplier] = useState(""); // search text

  // Fetch suppliers & locations
  useEffect(() => {
    fetchSuppliers();
    fetchLocations();
  }, []);

  const filteredSuppliers = suppliers.filter((s) => {
    const name = (s.Vend_name || "").toString().toLowerCase();
    const code = (s.Vend_code || "").toString().toLowerCase();
    const search = searchSupplier.toLowerCase();

    return name.includes(search) || code.includes(search);
  });

  const fetchSuppliers = async () => {
    try {
      const response = await getSuppliers();
      const actualData = response.data.Data || response.data;
      setSuppliers(actualData);
    } catch (error) {
      toast.error("Failed to fetch suppliers");
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await getLocations();
      setLocations(response.data);
    } catch (error) {
      toast.error("Failed to fetch locations");
    }
  };

  // Text inputs handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Clear form
  const handleClear = () => {
    setFormData({
      Vend_id: 0,
      Vend_code: "",
      Vend_name: "",
      Address: "",
      GST_no: "",
      State_id: 0,
      State: "",
      Dist_id: 0,
      Dist: "",
      Taluka_id: 0,
      Taluka: "",
      City_id: 0,
      City: "",
      Contact_no: "",
      Email: "",
      Bank_name: "",
      Bank_acc_no: "",
      Bank_branch: "",
      IFSC_code: "",
      Opn_bal: 0,
      Created_by: username, // current user
      Modified_by: username, // current user
    });
    setEditId(null);
  };

  // Handle dropdowns
  const handleStateChange = (e) => {
    const stateId = Number(e.target.value);
    const selectedState = locations.find((loc) => loc.State_id === stateId);
    setFormData({
      ...formData,
      State_id: stateId,
      State: selectedState?.State || "",
      Dist_id: 0,
      Dist: "",
      Taluka_id: 0,
      Taluka: "",
      City_id: 0,
      City: "",
    });
  };

  const handleDistChange = (e) => {
    const distId = Number(e.target.value);
    const selectedDist = locations.find((loc) => loc.Dist_id === distId);
    setFormData({
      ...formData,
      Dist_id: distId,
      Dist: selectedDist?.Dist || "",
      Taluka_id: 0,
      Taluka: "",
      City_id: 0,
      City: "",
    });
  };

  const handleTalukaChange = (e) => {
    const talukaId = Number(e.target.value);
    const selectedTaluka = locations.find((loc) => loc.Taluka_id === talukaId);
    setFormData({
      ...formData,
      Taluka_id: talukaId,
      Taluka: selectedTaluka?.Taluka || "",
      City_id: 0,
      City: "",
    });
  };

  const handleCityChange = (e) => {
    const cityId = Number(e.target.value);
    const selectedCity = locations.find((loc) => loc.City_id === cityId);
    setFormData({
      ...formData,
      City_id: cityId,
      City: selectedCity?.City || "",
    });
  };

  // Update dropdown options when parent changes
  useEffect(() => {
    const uniqueDistricts = [
      ...new Map(
        locations
          .filter((loc) => loc.State_id === formData.State_id)
          .map((item) => [item.Dist_id, item]),
      ).values(),
    ];

    setDistricts(uniqueDistricts);
    setTalukas([]);
    setCities([]);
  }, [formData.State_id, locations]);

  useEffect(() => {
    const uniqueTalukas = [
      ...new Map(
        locations
          .filter((loc) => loc.Dist_id === formData.Dist_id)
          .map((item) => [item.Taluka_id, item]),
      ).values(),
    ];

    setTalukas(uniqueTalukas);
    setCities([]);
  }, [formData.Dist_id, locations]);

  useEffect(() => {
    const uniqueCities = [
      ...new Map(
        locations
          .filter((loc) => loc.Taluka_id === formData.Taluka_id)
          .map((item) => [item.City_id, item]),
      ).values(),
    ];

    setCities(uniqueCities);
  }, [formData.Taluka_id, locations]);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.Vend_code ||
      !formData.Vend_name ||
      !formData.Address ||
      !formData.Contact_no
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (
      !formData.State_id ||
      !formData.Dist_id ||
      !formData.Taluka_id ||
      !formData.City_id
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.Contact_no.length !== 10) {
      toast.error("Mobile No must be 10 digits!");
      return;
    }

    const payload = {
      Vend_id: Number(formData.Vend_id),
      Vend_name: formData.Vend_name,
      Vend_code: formData.Vend_code,
      Address: formData.Address,
      // Vend_address: formData.Vend_address,

      City_id: formData.City_id === 0 ? null : Number(formData.City_id),
      Taluka_id: formData.Taluka_id === 0 ? null : Number(formData.Taluka_id),
      Dist_id: formData.Dist_id === 0 ? null : Number(formData.Dist_id),
      State_id: formData.State_id === 0 ? null : Number(formData.State_id),

      Contact_no: formData.Contact_no,
      Email: formData.Email || "",
      Bank_name: formData.Bank_name || "",
      Bank_acc_no: formData.Bank_acc_no || "",
      Bank_branch: formData.Bank_branch || "",
      IFSC_code: formData.IFSC_code || "",
      GST_no: formData.GST_no || "",
      Opn_bal: Number(formData.Opn_bal) || 0,
      Created_by: editId !== null ? formData.Created_by : username,
      Modified_by: username,
    };

    try {
      if (editId !== null) {
        await updateSupplier(payload);
        toast.success("Supplier updated!");
      } else {
        await addSupplier(payload);
        toast.success("Supplier added!");
      }

      await fetchSuppliers();
      setShowTable(true);
      handleClear();
    } catch (error) {
      console.error(error.response?.data);
      toast.error(error.response?.data);
    }
  };
  // Edit & Delete
  const handleEdit = (supplier) => {
    setFormData({ ...supplier });
    setEditId(supplier.Vend_id);
    setShowTable(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteSupplier({
        Vend_id: Number(id),
        Modified_by: username,
      });

      toast.success("Supplier deleted!");
      fetchSuppliers();
    } catch (error) {
      // toast.error("Failed to delete supplier");
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Something went wrong";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container-fluid my-0">
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{
          maxWidth: showTable ? "80%" : "750px",
          overflowX: showTable ? "auto" : "visible",
        }}
      >
        <div
          className="text-white p-2 text-center rounded"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Supplier Info</h5>
        </div>

        {!showTable ? (
          <form
            onSubmit={handleSubmit}
            className="mt-2"
            style={{ fontSize: "14px" }}
          >
            {/* Code + Name */}
            <div className="row g-0 mb-1" style={{ fontSize: "14px" }}>
              <div className="col-md-3">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Code <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="Vend_code"
                  value={formData.Vend_code}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
              <div className="col-md-5" style={{ marginLeft: "10px" }}>
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="Vend_name"
                  value={formData.Vend_name}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
            </div>

            {/* Address */}
            <div className="row g-1 mb-2">
              <div className="col-8">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Address <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                  name="Address"
                  value={formData.Address}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  rows="1"
                />
              </div>
            </div>

            {/* State + District + Taluka + City */}
            <div className="row g-2 mb-2">
              <div className="col-md-3">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  State <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={formData.State_id}
                  onChange={handleStateChange}
                  className="form-select form-select-sm"
                >
                  <option value={0}>Select State</option>
                  {[
                    ...new Map(
                      locations.map((loc) => [loc.State_id, loc.State]),
                    ),
                  ].map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  District <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={formData.Dist_id}
                  onChange={handleDistChange}
                  className="form-select form-select-sm"
                >
                  <option value={0}>Select District</option>
                  {districts.map((d) => (
                    <option key={d.Dist_id} value={d.Dist_id}>
                      {d.Dist}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Taluka <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={formData.Taluka_id}
                  onChange={handleTalukaChange}
                  className="form-select form-select-sm"
                >
                  <option value={0}>Select Taluka</option>
                  {talukas.map((t) => (
                    <option key={t.Taluka_id} value={t.Taluka_id}>
                      {t.Taluka}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  City <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={formData.City_id}
                  onChange={handleCityChange}
                  className="form-select form-select-sm"
                >
                  <option value={0}>Select City</option>
                  {cities.map((c) => (
                    <option key={c.City_id} value={c.City_id}>
                      {c.City}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile + Email + GST */}
            <div className="row g-2 mb-2">
              <div className="col-md-3">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Mobile No <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="Contact_no"
                  value={formData.Contact_no}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");

                    if (value.length <= 10) {
                      setFormData({ ...formData, Contact_no: value });
                    }
                  }}
                  className="form-control form-control-sm"
                  maxLength={10}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Email
                </label>
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  GST No
                </label>
                <input
                  type="text"
                  name="GST_no"
                  value={formData.GST_no}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
            </div>

            {/* Bank details */}
            <div className="row g-2 mb-2">
              <div className="col-md-4">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Bank Name
                </label>
                <input
                  type="text"
                  name="Bank_name"
                  value={formData.Bank_name}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Account No
                </label>
                <input
                  type="text"
                  name="Bank_acc_no"
                  value={formData.Bank_acc_no}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-md-4">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Branch Name
                </label>
                <input
                  type="text"
                  name="Bank_branch"
                  value={formData.Bank_branch}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="IFSC_code"
                  value={formData.IFSC_code}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="text-center mt-3 d-flex justify-content-center gap-2">
              <button
                type="submit"
                className="button-save"
                style={{ fontSize: "14px" }}
              >
                {editId !== null ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="button-clear"
                style={{ fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowTable(true)}
                className="button-list"
                style={{ fontSize: "14px" }}
              >
                Show List
              </button>
            </div>
          </form>
        ) :<CommonTable
  title="Supplier List"
  data={filteredSuppliers}
  searchValue={searchSupplier}
  onSearchChange={setSearchSupplier}
  onClose={() => {
    setShowTable(false);
    handleClear();
  }}
  onEdit={(row) => handleEdit(row)}
  onDelete={(row) => handleDelete(row.Vend_id)}
  columns={[
    {
      header: "Sr. No",
      render: (row) =>
        filteredSuppliers.findIndex(
          (s) => s.Vend_id === row.Vend_id
        ) + 1,
    },

    { header: "Code", accessor: "Vend_code" },
    { header: "Name", accessor: "Vend_name" },
    { header: "Address", accessor: "Address" },
    { header: "State", accessor: "State" },
    { header: "District", accessor: "Dist" },
    { header: "Taluka", accessor: "Taluka" },
    { header: "City", accessor: "City" },
    { header: "Mobile", accessor: "Contact_no" },
    { header: "Email", accessor: "Email" },
    { header: "GST", accessor: "GST_no" },
    { header: "Bank Name", accessor: "Bank_name" },
    { header: "Account No", accessor: "Bank_acc_no" },
    { header: "Branch Name", accessor: "Bank_branch" },
    { header: "IFSC Code", accessor: "IFSC_code" },
  ]}
/>}
      </div>
    </div>
  );
}

export default SupplierInfo;
