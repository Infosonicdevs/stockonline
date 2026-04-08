import React, { useState, useEffect } from "react";
import apiClient from "../../../api/client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getCustomerByAccountNo,
  getCustomers,
} from "../../../services/masters/user";

function Userinformation() {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    empId: null,
    userId: "",
    fullName: "",
    birthDate: today,
    mobileNo: "",
    branch: "",
    role: "",
    joiningDate: today,
    qualification: "",
    email: "",
    status: "Active",
    inactiveDate: "",
    Cust_id: "",
    accountNo: "",
  });


  const columns = [
    { label: "Account No", accessor: "Cust_no" },
    { label: "Employee Code", accessor: "userId" },
    { label: "Full Name", accessor: "fullName", className: "text-start" },
    {
      label: "Birth Date",
      accessor: "birthDate",
      render: (value) => formatDate(value),
    },
    { label: "Mobile No", accessor: "mobileNo" },
    { label: "Branch", accessor: "branchName" },
    { label: "Role", accessor: "roleName", className: "text-start" },
    {
      label: "Joining Date",
      accessor: "joiningDate",
      render: (value) => formatDate(value),
    },
    { label: "Qualification", accessor: "qualification" },
    { label: "Email", accessor: "email" },
    { label: "Status", accessor: "status" },
    {
      label: "Inactive Date",
      accessor: "inactiveDate",
      render: (value, row) =>
        row.status === "Inactive" ? formatDate(value) : "-",
    },
  ];

  const username = localStorage.getItem("username");
  const [searchFullName, setSearchFullName] = useState("");
  const [users, setUsers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [customers, setCustomers] = useState([]);

  const apiBase = `/api`;

  const filteredUsers = users.filter((user) => {
    const search = searchFullName.toLowerCase();

    return Object.keys(user).some((key) => {
      if (key === "empId") return false; // Sr No / id ignore

      const value = user[key];
      if (value === null || value === undefined) return false;

      return value.toString().toLowerCase().includes(search);
    });
  });

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "") return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
    fetchRoles();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const result = await getCustomers();
      if (result.status === 200) {
        setCustomers(result.data);
      }
    } catch (error) {
      toast.error("Error occurred while getting customers");
    }
  };

  const setCustomeryAccountNo = async (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      accountNo: value,
    }));

    if (!value) {
      // Reset dropdown if empty
      setFormData((prev) => ({
        ...prev,
        Cust_id: "",
        fullName: "",
      }));
      return;
    }

    try {
      const res = await getCustomerByAccountNo(value);

      if (res.status === 200 && res.data && res.data.length > 0) {
        console.log(res.data);
        setFormData((prev) => ({
          ...prev,
          Cust_id: res.data[0].Cust_id,
          fullName: res.data[0].Cust_name, // match dropdown
        }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleCustomerChange = (e) => {
    const custId = e.target.value;

    const selectedCustomer = customers.find(
      (c) => String(c.Cust_id) === String(custId),
    );

    setFormData((prev) => ({
      ...prev,
      Cust_id: custId,
      fullName: selectedCustomer?.Cust_name || "",
      accountNo: selectedCustomer?.Cust_no || "",
    }));
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get(`${apiBase}/Employee`);
      const mappedUsers = res.data.map((u) => ({
        empId: u.Emp_id,
        userId: u.Emp_code,
        fullName: u.Emp_name,
        birthDate: u.DOB?.split("T")[0],
        mobileNo: u.Mobile_no,
        branch: u.Outlet_id,
        role: u.Designation_id,
        branchName: u.Outlet_name,
        roleName: u.Role,
        joiningDate: u.DOJ?.split("T")[0],
        qualification: u.Qualification,
        email: u.E_mail,
        status: u.Status === "1" ? "Active" : "Inactive",
        inactiveDate: u.DOR?.split("T")[0] || "",
        Cust_id: u.Cust_id,
        Cust_no: u.Cust_no,
      }));
      setUsers(mappedUsers);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get(`${apiBase}/getBranches`);
      // res.data.data contains the array from backend
      setBranches(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      toast.error("Failed to fetch branches");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await apiClient.get(`${apiBase}/Role`);
      setRoles(res.data);
    } catch (err) {
      toast.error("Failed to fetch roles");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ["branch", "role"].includes(name)
        ? value
          ? Number(value)
          : null
        : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required field validation
    for (let key in formData) {
      const value = formData[key];

      // Skip optional fields
      if (["qualification", "email", "inactiveDate"].includes(key)) continue;

      // Check if string before trim
      if (typeof value === "string" && value.trim() === "") {
        toast.error(`Please fill the ${key} field!`);
        return;
      }

      // Check if number for numeric fields
      if (["mobileNo"].includes(key) && (isNaN(value) || value === "")) {
        toast.error(`${key} must be a number!`);
        return;
      }
    }

    if (formData.mobileNo.length !== 10) {
      toast.error("Mobile No must be 10 digits!");
      return;
    }

    // Inactive date validation
    if (formData.status === "Inactive") {
      if (!formData.inactiveDate) {
        toast.error("Please select Inactive Date!");
        return;
      }
      if (formData.inactiveDate < formData.joiningDate) {
        toast.error("Inactive Date cannot be before Joining Date!");
        return;
      }
    }

    // Function to ensure SQL Server safe date
    const safeDate = (dateStr) => {
      const sqlMin = "1753-01-01";

      // if empty date send minimum valid SQL date
      if (!dateStr || dateStr === "") {
        return sqlMin;
      }

      const d = new Date(dateStr);
      const min = new Date(sqlMin);

      if (isNaN(d.getTime()) || d < min) {
        return sqlMin;
      }

      return d.toISOString().split("T")[0];
    };

    // Prepare payload for backend
    const payload = {
      Emp_id: formData.empId,
      Cust_id: formData.Cust_id,
      Emp_code: formData.userId,
      Emp_name: formData.fullName,
      DOB: safeDate(formData.birthDate),
      Mobile_no: formData.mobileNo,
      Outlet_id: Number(formData.branch),
      Designation_id: Number(formData.role),
      DOJ: safeDate(formData.joiningDate),
      Qualification: formData.qualification,
      E_mail: formData.email,
      Status: formData.status === "Active" ? "1" : "0",
      DOR: safeDate(formData.inactiveDate),

      Reason: "", // hidden default value

      Created_by: editIndex === null ? username : null,
      Modified_by: editIndex !== null ? username : null,
    };
    try {
      if (editIndex !== null) {
        // Update existing record
        await apiClient.put(`${apiBase}/Employee`, payload);
        toast.success("Record updated successfully!");
      } else {
        // Insert new record
        await apiClient.post(`${apiBase}/Employee`, payload);
        toast.success("Record added successfully!");
      }

      handleClear();
      fetchUsers();
      setEditIndex(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || "Operation failed!");
    }
  };

  const handleClear = () => {
    setFormData({
      empId: null, // <-- reset here
      userId: "",
      fullName: "",
      birthDate: today,
      mobileNo: "",
      branch: "",
      role: "",
      joiningDate: today,
      qualification: "",
      email: "",
      status: "Active",
      inactiveDate: "",
      Cust_id: "",
      accountNo: "",
    });

    // Reset editIndex so the button text goes back to "Save"
    setEditIndex(null);
  };

  const handleCancel = () => window.history.back();
  const handleShow = () => setShowTable(true);
  const handleCloseTable = () => {
    setShowTable(false);
    setSearchTerm(""); // clear search when closing table
  };

  const handleEdit = async (index) => {
    const user = users[index];
    try {
      const res = await apiClient.get(`${apiBase}/Employee?E_id=${user.empId}`);
      const data = res.data[0];

      setFormData({
        empId: data.Emp_id,
        userId: data.Emp_code,
        fullName: data.Emp_name,
        birthDate: data.DOB?.split("T")[0],
        mobileNo: data.Mobile_no,
        branch: data.Outlet_id,
        role: data.Designation_id,
        joiningDate: data.DOJ?.split("T")[0],
        qualification: data.Qualification,
        email: data.E_mail,
        status: data.Status === "1" ? "Active" : "Inactive",
        inactiveDate: data.DOR?.split("T")[0] || "",
        Cust_id: data.Cust_id,
        accountNo: data.Cust_no,
      });

      setEditIndex(index);
      setShowTable(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch user details");
    }
  };

  const handleDelete = async (index) => {
    const user = users[index];
    try {
      await apiClient.post(`${apiBase}/DelEmployee`, {
        Emp_id: user.empId,
        Modified_by: username,
      });
      toast.success("Record deleted successfully!");
      fetchUsers();
    } catch {
      toast.error("Delete failed");
    }
  };

  const renderLabel = (label, name) => {
    const requiredFields = [
      "userId",
      "Cust_id",
      "birthDate",
      "mobileNo",
      "branch",
      "role",
      "joiningDate",
      "status",
    ];
    return (
      <span>
        {label}
        {requiredFields.includes(name) && (
          <span style={{ color: "red" }}> *</span>
        )}
      </span>
    );
  };

  return (
    <div
      className="shadow-none container-fluid d-flex flex-column "
      style={{ height: "80vh" }}
    >
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{
          maxWidth: showTable ? "100%" : "950px",
        }}
      >
        {/* Header */}
        <div
          className="text-white rounded  p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Employe Infomation</h5>
        </div>
        <div className="row align-items-center text-center">
          <div className="col-12"></div>
        </div>

        {/* Form */}
        {!showTable ? (
          <form onSubmit={handleSubmit}>
            {/* Employee Information Section */}
            <div className="mb-5 mt-2" style={{ marginLeft: "20px" }}>
              <h6
                className="fw-bold text-secondary mt-1"
                style={{ fontSize: "18px" }}
              >
                Employe Information
              </h6>
              <div className="row g-1">
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    Account No
                  </label>
                  <input
                    type="text"
                    name="accountNo"
                    value={formData.accountNo}
                    onChange={setCustomeryAccountNo}
                    className="form-control form-control-sm"
                    style={{ width: "180px" }}
                  />
                </div>

                <div className="col-md-4">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    Name
                  </label>
                  <select
                    value={formData.Cust_id}
                    name="employeeName"
                    onChange={handleCustomerChange}
                    className="form-select form-select-sm"
                  >
                    <option value="">Select Name</option>
                    {customers.map((c) => (
                      <option key={c.Cust_id} value={c.Cust_id}>
                        {c.Cust_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row g-1 mt-1">
                {/* Employee Code */}
                <div className="col-md-2">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    {renderLabel("Employee Code", "userId")}
                  </label>
                  <input
                    type="text"
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                    style={{ width: "180px" }}
                  />
                </div>
              </div>

              {/* Second Row */}
              <div className="row g-1 mt-1">
                {/* Birth Date */}
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    {renderLabel("Birth Date", "birthDate")}
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    min="1753-01-01"
                    max={new Date().toISOString().split("T")[0]} // Today
                    className="form-control form-control-sm"
                    style={{ width: "150px" }}
                  />
                </div>

                {/* Mobile No */}
                <div className="col-md-4">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    Mobile No
                  </label>
                  <input
                    type="text"
                    name="Contact_no"
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

                {/* Email */}
                <div className="col-md-4">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                    style={{ width: "240px" }}
                  />
                </div>
              </div>
            </div>

            {/* Office Information Section */}
            <div className="mt-0" style={{ marginLeft: "20px" }}>
              <h6
                className="fw-bold text-secondary mt-0"
                style={{ fontSize: "18px" }}
              >
                Office Information
              </h6>
              <div className="row g-2">
                {/* Branch */}
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    {renderLabel("Branch", "branch")}
                  </label>
                  {/* Branch */}
                  <select
                    name="branch"
                    value={formData.branch || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branch: Number(e.target.value),
                      })
                    }
                    className="form-control form-control-sm"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.Outlet_id} value={b.Outlet_id}>
                        {b.Outlet_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role */}
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    {renderLabel("Role", "role")}
                  </label>
                  <select
                    name="role"
                    value={formData.role || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, role: Number(e.target.value) })
                    }
                    className="form-control form-control-sm"
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.Role_id} value={r.Role_id}>
                        {r.Role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Joining Date */}
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    {renderLabel("Joining Date", "joiningDate")}
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                  />
                </div>

                {/* Qualification */}
                <div className="col-md-6">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    Qualification
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                    style={{ width: "290px" }}
                  />
                </div>

                {/* Status */}
                <div className="col-sm-6 col-lg-6">
                  <label
                    className="form-label fw-semibold small"
                    style={{ marginBottom: "1px" }}
                  >
                    {renderLabel("Status", "status")}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-select form-select-sm"
                    style={{ width: "130px" }}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Inactive Date */}
                {formData.status === "Inactive" && (
                  <div className="col-sm-6 col-lg-6">
                    <label
                      className="form-label fw-semibold small"
                      style={{ marginBottom: "1px" }}
                    >
                      Inactive Date
                    </label>
                    <input
                      type="date"
                      name="inactiveDate"
                      value={formData.inactiveDate}
                      onChange={handleChange}
                      min={formData.joiningDate}
                      className="form-control form-control-sm"
                      style={{ width: "240px" }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mt-4 gap-2  d-flex justify-content-center">
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
                onClick={() => {
                  fetchUsers();
                  setShowTable(true);
                }}
              >
                Show List
              </button>
            </div>
          </form>
        ) : 
        <div style={{ paddingTop: "5px" }}>
        <CommonTable
          columns={columns}
          data={filteredUsers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchValue={searchFullName}
          onSearchChange={setSearchFullName}
          onClose={() => {
            setShowTable(false);
            handleClear();
          }}
        />
        </div>
        }
      </div>
    </div>
  );
}

export default Userinformation;
