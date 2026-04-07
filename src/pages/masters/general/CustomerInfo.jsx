import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getCustomers,
  getStates,
  getDistricts,
  getTalukas,
  getCities,
  getPrefixes,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getMaxCustNo,
} from "../../../services/masters/customerService";

const CustomerInfo = () => {
  const username = localStorage.getItem("username") || "Unknown";
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [cities, setCities] = useState([]);
  const [prefixes, setPrefixes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showTable, setShowTable] = useState();
  const [isEdit, setIsEdit] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    accountNo: "",
    cardNo: "",
    prefix: "",
    firstName: "",
    middleName: "",
    lastName: "",
    appendName: "",
    address: "",
    state: "",
    district: "",
    block: "",
    city: "",
    gender: "",
    dob: today,
    age: "",
    openingDate: today,
    mobileNo: "",
    typeOfAccountant: "Member",
    typeOfVoter: "",
    accountStatus: "1",
    closingDate: today,
    reason: "",
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-4); // last 2 digits

    return `${day}/${month}/${year}`;
  };

  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase();

    const fullName = [
      customer.First_name,
      customer.Middle_name,
      customer.Last_name,
      customer.Append,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      customer.Cust_no?.toString().toLowerCase().includes(search) ||
      customer.Card_no?.toString().toLowerCase().includes(search) ||
      fullName.includes(search) ||
      customer.Phone_no?.toString().toLowerCase().includes(search)
    );
  });

  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const fetchMaxNumber = async () => {
    try {
      const res = await getMaxCustNo();
      // Ensure we only set it if we are NOT in edit mode
      setFormData((prev) => ({
        ...prev,
        accountNo: res.data.toString(),
      }));
    } catch (error) {
      console.error("Error fetching MaxCustNo", error);
    }
  };

  /* ================= LOAD DROPDOWNS ================= */
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [statesRes, districtsRes, talukasRes, citiesRes, prefixesRes] =
          await Promise.all([
            getStates(),
            getDistricts(),
            getTalukas(),
            getCities(),
            getPrefixes(),
          ]);

        setStates(statesRes.data);
        setDistricts(districtsRes.data);
        setTalukas(talukasRes.data);
        setCities(citiesRes.data);
        setPrefixes(prefixesRes.data);
      } catch (error) {
        toast.error("Error fetching dropdowns");
      }
    };

    fetchDropdowns();
    fetchCustomers();

    // Fetch MaxCustNo on initial load (Refresh)
    fetchMaxNumber();
  }, []);

  /* ================= LOAD CUSTOMERS ================= */
  const fetchCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch (error) {
      toast.error("Error fetching customers", error);
    }
  };

  /* ================= SAVE / UPDATE CUSTOMER ================= */
  const handleSaveCustomer = async () => {
    // 1. Prefix Validation
    if (!formData.prefix || formData.prefix === "0") {
      toast.error("Please select a Prefix!");
      return;
    }

    // 2. First Name Validation
    if (!formData.firstName || formData.firstName.trim() === "") {
      toast.error("First Name is required!");
      return;
    }

    // 3. Last Name Validation
    if (!formData.lastName || formData.lastName.trim() === "") {
      toast.error("Last Name is required!");
      return;
    }

    // 4. Card Number Validation
    if (!formData.cardNo || formData.cardNo === "0") {
      toast.error("Card Number is required!");
      return;
    }

    if (!formData.mobileNo || formData.mobileNo.trim() === "") {
      toast.error("Mobile No is required!");
      return;
    }

    if (formData.mobileNo.length !== 10) {
      toast.error("Mobile No must be 10 digits!");
      return;
    }

    const payload = {
      Cust_id: formData.id || 0,
      Cust_no: parseInt(formData.accountNo) || 0,
      Card_no: parseInt(formData.cardNo) || 0,
      Prefix_id: parseInt(formData.prefix),
      First_name: formData.firstName || "",
      Middle_name: formData.middleName || "",
      Last_name: formData.lastName || "",
      Append: formData.appendName || "",
      Address: formData.address || "",
      City_id: parseInt(formData.city) || null,
      Taluka_id: parseInt(formData.block) || null,
      District_id: parseInt(formData.district) || null,
      State_id: parseInt(formData.state) || null,
      Gender: formData.gender,
      Cust_type: formData.typeOfAccountant || "",
      Matdar_prakar: formData.typeOfVoter || "",
      DOB: formData.dob ? new Date(formData.dob).toISOString() : null,
      Phone_no: formData.mobileNo || "",
      Acc_start_date: formData.openingDate
        ? new Date(formData.openingDate).toISOString()
        : null,
      Acc_end_date: formData.closingDate
        ? new Date(formData.closingDate).toISOString()
        : null,
      Status: formData.accountStatus || "1",
      Reason: formData.reason || null,
      Created_by: !formData.id ? username : undefined, //  use formData.id
      Modified_by: formData.id ? username : undefined, //  use formData.id
    };

    try {
      if (formData.id) {
        await updateCustomer(payload);
        toast.success("Customer updated");
      } else {
        await addCustomer(payload);
        toast.success("Customer added");
      }

      fetchCustomers();
      setShowTable(true);
      setIsEdit(false);
      setFormData({
        accountNo: "",
        cardNo: "",
        prefix: "",
        firstName: "",
        middleName: "",
        lastName: "",
        appendName: "",
        address: "",
        state: "",
        district: "",
        block: "",
        city: "",
        gender: "",
        dob: today,
        age: "",
        openingDate: today,
        mobileNo: "",
        typeOfAccountant: "Member",
        typeOfVoter: "",
        accountStatus: "1",
        closingDate: today,
        reason: "",
      });
      await fetchMaxNumber();
    } catch (error) {
      const serverMessage =
        error.response?.data?.message || error.response?.data || "";

      if (
        serverMessage.toLowerCase().includes("exists") ||
        serverMessage.toLowerCase().includes("duplicate")
      ) {
        toast.warning(serverMessage);
      } else {
        toast.error("Error saving customer: " + serverMessage);
      }
    }
  };

  /* ================= EDIT CUSTOMER ================= */
  const handleEdit = (customer) => {
    setFormData({
      id: customer.Cust_id,
      accountNo: customer.Cust_no?.toString() || "",
      cardNo: customer.Card_no?.toString() || "",
      prefix: customer.Prefix_id?.toString() || "",
      firstName: customer.First_name || "",
      middleName: customer.Middle_name || "",
      lastName: customer.Last_name || "",
      appendName: customer.Append || "",
      address: customer.Address || "",
      city: customer.City_id?.toString() || "",
      block: customer.Taluka_id?.toString() || "",
      district: customer.District_id?.toString() || "",
      state: customer.State_id?.toString() || "",
      gender: customer.Gender || "M",
      typeOfAccountant: customer.Cust_type || "Member",
      typeOfVoter: customer.Matdar_prakar || "",
      dob: customer.DOB ? customer.DOB.split("T")[0] : "",
      age: customer.DOB ? calculateAge(customer.DOB) : "",
      mobileNo: customer.Phone_no || "",
      openingDate: customer.Acc_start_date
        ? customer.Acc_start_date.split("T")[0]
        : "",
      closingDate: customer.Acc_end_date
        ? customer.Acc_end_date.split("T")[0]
        : "",
      accountStatus: customer.Status_text == "Active" ? "1" : "0",
      reason: customer.Reason || "",
    });

    setIsEdit(true); // Edit mode ON
    setShowTable(false); //  Show form
  };

  /* ================= DELETE CUSTOMER ================= */
  // Delete
  const handleDelete = async (customer) => {
    try {
      await deleteCustomer({
        Cust_id: customer.Cust_id,
        Modified_by: username,
      });
      fetchCustomers();
      toast.success("Customer deleted successfully!"); // Success toast
    } catch (error) {
      console.error("Error deleting customer", error);
      toast.error(error.response?.data || "Error deleting customer"); // Error toast
    }
  };

  /* ================= HANDLE INPUT CHANGE ================= */
  const handleChange = (e) => {
    const { id, value } = e.target;

    if (id === "dob") {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      setFormData({ ...formData, dob: value, age });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleClear = () => {
    setFormData({
      accountNo: "", // Will be filled by fetchMaxNumber
      cardNo: "",
      prefix: "",
      firstName: "",
      middleName: "",
      lastName: "",
      appendName: "",
      address: "",
      state: "",
      district: "",
      block: "",
      city: "",
      gender: "",
      dob: today,
      age: "",
      openingDate: today,
      mobileNo: "",
      typeOfAccountant: "Member",
      typeOfVoter: "",
      accountStatus: "1",
      closingDate: today,
      reason: "",
    });
    setIsEdit(false);
    fetchMaxNumber(); // Fetch fresh number when form is cleared/opened
  };

  return (
    <div
      className="shadow-none container-fluid d-flex flex-column"
      style={{ height: "75vh" }}
    >
      {/* ================= FORM ================= */}
      {!showTable && (
        <div
          className="bg-white p-4 rounded shadow mx-auto"
          style={{ maxWidth: "1000px" }}
        >
          <div
            className="text-white rounded mb-2 p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Customer Information</h5>
          </div>
          <form>
            <div className="row g-2">
              <div className="col-sm-6 col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Account No
                </label>
                <input
                  type="number"
                  id="accountNo"
                  value={formData.accountNo}
                  onChange={handleChange}
                  required
                  className="form-control form-control-sm"
                  style={{ width: "180px" }}
                />
              </div>

              <div className="col-sm-6 col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Card No
                </label>
                <input
                  type="text"
                  id="cardNo"
                  value={formData.cardNo}
                  onChange={handleChange}
                  required
                  className="form-control form-control-sm"
                  style={{ width: "180px" }}
                />
              </div>

              <div className="col-12">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Name
                </label>
                <div className="row g-2">
                  <div className="col-md">
                    <select
                      id="prefix"
                      value={formData.prefix}
                      onChange={handleChange}
                      required
                      className="form-select form-select-sm"
                      style={{ width: "100px" }}
                    >
                      <option value="0">Prefix</option>
                      {prefixes.map((p) => (
                        <option key={p.Prefix_id} value={p.Prefix_id}>
                          {p.Prefix}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md">
                    <input
                      type="text"
                      id="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="form-control form-control-sm"
                      style={{ width: "190px" }}
                    />
                  </div>

                  <div className="col-md">
                    <input
                      type="text"
                      id="middleName"
                      placeholder="Middle Name"
                      value={formData.middleName}
                      required
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      style={{ width: "190px" }}
                    />
                  </div>

                  <div className="col-md">
                    <input
                      type="text"
                      id="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      required
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      style={{ width: "190px" }}
                    />
                  </div>

                  <div className="col-md" style={{ marginRight: "60px" }}>
                    <input
                      type="text"
                      id="appendName"
                      placeholder="Append Name"
                      value={formData.appendName}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      style={{ width: "190px" }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-sm-6 col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Date Of Birth
                </label>
                <input
                  type="date"
                  id="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  style={{ width: "180px" }}
                />
              </div>

              <div className="col-sm-6 col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Age
                </label>
                <input
                  type="text"
                  id="age"
                  value={formData.age}
                  readOnly
                  className="form-control form-control-sm"
                  style={{ width: "180px" }}
                />
              </div>

              <div className="col-lg-5">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Address
                </label>
                <textarea
                  id="address"
                  rows="1"
                  value={formData.address}
                  onChange={handleChange}
                  style={{ width: "420px" }}
                  className="form-control form-control-sm"
                />
              </div>

              <div className="col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  State
                </label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">--Select--</option>

                  {states.map((s) => (
                    <option key={s.State_id} value={s.State_id}>
                      {s.State}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  District
                </label>
                <select
                  id="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">--Select--</option>
                  {districts
                    .filter((d) => d.State_id === parseInt(formData.state)) // Cascading
                    .map((d) => (
                      <option key={d.Dist_id} value={d.Dist_id}>
                        {d.Dist}
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Taluka
                </label>
                <select
                  id="block"
                  value={formData.block}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">--Select--</option>
                  {talukas
                    .filter((t) => t.Dist_id === parseInt(formData.district)) // Filter by selected district
                    .map((t) => (
                      <option key={t.Taluka_id} value={t.Taluka_id}>
                        {t.Taluka}
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  City
                </label>
                <select
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">--Select--</option>
                  {cities
                    .filter((c) => c.Taluka_id === parseInt(formData.block)) // Filter by selected taluka
                    .map((c) => (
                      <option key={c.City_id} value={c.City_id}>
                        {c.City}
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Mobile No
                </label>
                <input
                  type="text"
                  id="mobileNo"
                  value={formData.mobileNo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");

                    if (value.length <= 10) {
                      setFormData({ ...formData, mobileNo: value });
                    }
                  }}
                  className="form-control form-control-sm"
                  maxLength={10}
                />
              </div>

              <div className="col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Gender
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">--Select--</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              <div className="col-sm-6 col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Opening Date
                </label>
                <input
                  type="date"
                  id="openingDate"
                  value={formData.openingDate}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  style={{ width: "180px" }}
                />
              </div>

              <div className="col-sm-6 col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Type Of Accountant
                </label>
                <select
                  id="typeOfAccountant"
                  value={formData.typeOfAccountant}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                  style={{ width: "180px" }}
                >
                  <option value="Member">Member</option>
                  <option value="Nominal">Nominal</option>
                </select>
              </div>

              <div className="col-sm-6 col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Type Of Voter
                </label>
                <select
                  id="typeOfVoter"
                  value={formData.typeOfVoter}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">--Select--</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div className="col-sm-6 col-lg-3">
                <label
                  className="form-label fw-semibold small"
                  style={{ marginBottom: "1px" }}
                >
                  Account Status
                </label>
                <select
                  id="accountStatus"
                  value={formData.accountStatus}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">--Select--</option>
                  <option value="1">Active</option>
                  <option value="0">Closed</option>
                </select>
              </div>
              {formData.accountStatus === "0" && (
                <>
                  <div className="col-sm-6 col-lg-3">
                    <label
                      className="form-label fw-semibold small"
                      style={{ marginBottom: "1px" }}
                    >
                      Closing Date
                    </label>
                    <input
                      type="date"
                      id="closingDate"
                      value={formData.closingDate}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                      style={{ width: "180px" }}
                    />
                  </div>

                  <div className="col-sm-6 col-lg-3">
                    <label
                      className="form-label fw-semibold small"
                      style={{ marginBottom: "1px" }}
                    >
                      Reason
                    </label>
                    <input
                      type="text"
                      id="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="Enter reason"
                      className="form-control form-control-sm"
                      style={{ width: "180px" }}
                    />
                  </div>
                </>
              )}
            </div>

            <div
              className="d-flex justify-content-center"
              style={{ marginTop: "20px", gap: "10px" }}
            >
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="button-save"
                style={{ fontSize: "14px" }}
              >
                {isEdit ? "Update" : "Save"} {/*  Dynamic text */}
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
                onClick={() => {
                  setShowTable(true);
                  fetchCustomers();
                }}
                className="button-list"
                style={{ fontSize: "14px" }}
              >
                Show List
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TABLE ================= */}

     <CommonTable
  title="Customer List"
  data={filteredCustomers}
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  onClose={() => setShowTable(false)}
  onEdit={handleEdit}
  onDelete={handleDelete}
  columns={[
    { header: "Account No", accessor: "Cust_no" },
    { header: "Card No", accessor: "Card_no" },

    {
      header: "Prefix",
      render: (row) =>
        prefixes.find((p) => p.Prefix_id === row.Prefix_id)?.Prefix || "",
    },

    {
      header: "Name",
      render: (row) =>
        [
          row.First_name,
          row.Middle_name,
          row.Last_name,
          row.Append,
        ]
          .filter(Boolean)
          .join(" "),
    },

    { header: "Address", accessor: "Address" },

    {
      header: "State",
      render: (row) =>
        states.find((s) => s.State_id === row.State_id)?.State || "",
    },

    {
      header: "District",
      render: (row) =>
        districts.find((d) => d.Dist_id === row.District_id)?.Dist || "",
    },

    {
      header: "Block",
      render: (row) =>
        talukas.find((t) => t.Taluka_id === row.Taluka_id)?.Taluka || "",
    },

    {
      header: "City",
      render: (row) =>
        cities.find((c) => c.City_id === row.City_id)?.City || "",
    },

    { header: "Gender", accessor: "Gender_name" },

    {
      header: "DOB",
      render: (row) => formatDate(row.DOB),
    },

    {
      header: "Opening Date",
      render: (row) => formatDate(row.Acc_start_date),
    },

    { header: "Mobile", accessor: "Phone_no" },
    { header: "Accountant", accessor: "Cust_type" },
    { header: "Voter", accessor: "Matdar_prakar" },
    { header: "Status", accessor: "Status_text" },
  ]}
/>
    </div>
  );
};

export default CustomerInfo;
