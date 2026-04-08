import React, { useState, useEffect } from "react";
import { Axios } from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getUsers,
  getEmployees,
  getRoles,
  saveUser,
  updateUser,
  deleteUser,
} from "../../../services/masters/user";

function Usersetting() {
  const [formData, setFormData] = useState({
    employeeCode: "",
    selectList: "",
    user: "",
    password: "",
    userRole: "",
    User_id: null,
  });
  const username = localStorage.getItem("username");
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [users, setUsers] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);

  const columns = [
    {
      label: "Sr. No",
      render: (val, row, index) => index + 1,
    },
    {
      label: "Employee Code",
      render: (val, row) => {
        const emp = employees.find(
          (e) => String(e.Emp_id) === String(row.Emp_id)
        );
        return emp?.Emp_code || "-";
      },
    },
    {
      label: "Employee Name",
      render: (val, row) => {
        const emp = employees.find(
          (e) => String(e.Emp_id) === String(row.Emp_id)
        );
        return emp?.Emp_name || "-";
      },
    },
    {
      label: "User",
      render: (val, row) => row.User_name,
    },
  ];

  // searchbar
  const filteredUsers = users.filter((u) => {
    const employee = employees.find(emp => String(emp.Emp_id) === String(u.Emp_id));

    const values = [
      employee?.Emp_code,   // Employee Code
      employee?.Emp_name,   // Employee Name
      u.User_name           // User
    ];

    return values.some(val =>
      val?.toString().toLowerCase().includes(searchName.toLowerCase())
    );
  });


  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch {
      toast.error("Error fetching employees");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await getRoles();
      setRoles(res.data);
    } catch {
      toast.error("Error fetching roles");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      toast.error("Error fetching users");
    }
  };
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchEmployees();
  }, []);


  // In handleChange, detect changes for employeeCode or selectList
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "employeeCode") {
      // Find employee by code
      const emp = employees.find(emp => emp.Emp_code === value);
      setFormData({
        ...formData,
        employeeCode: value,
        selectList: emp ? emp.Emp_id.toString() : "", // update selectList if found
      });
    } else if (name === "selectList") {
      // Find employee by id
      const emp = employees.find(emp => emp.Emp_id.toString() === value);
      setFormData({
        ...formData,
        selectList: value,
        employeeCode: emp ? emp.Emp_code : "", // update employeeCode
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleClear = () => {
    setFormData({
      employeeCode: "",
      selectList: "",
      user: "",
      password: "",
      userRole: "",
    });
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // === Validation ===
    if (!formData.selectList) {
      toast.error("Please select an Employee");
      return;
    }
    if (!formData.user.trim()) {
      toast.error("Please enter a User name");
      return;
    }
    if (!formData.password.trim()) {
      toast.error("Please enter a Password");
      return;
    }
    if (!formData.userRole) {
      toast.error("Please select a User Role");
      return;
    }

    const payload = {
      Emp_id: formData.selectList,
      User_name: formData.user,
      Password: formData.password,
      Role_id: formData.userRole,
      Log_in: 0,
      Status: 1,
      Created_by: username,
      User_id: formData.User_id,
    };

    try {
      if (editIndex !== null) {
        await updateUser(payload);
        toast.success("User updated successfully!");
      } else {
        await saveUser(payload);
        toast.success("User added successfully!");
      }

      fetchUsers();
      handleClear();
    } catch (err) {
      toast.error("User already exits");
    }
  };

  const handleEdit = (userId) => {
    const u = users.find(user => user.User_id === userId);
    if (!u) return;

    // Find the employee object
    const emp = employees.find(emp => String(emp.Emp_id) === String(u.Emp_id));

    setFormData({
      employeeCode: emp?.Emp_code || "",   // Use Emp_code here
      selectList: u.Emp_id.toString(),
      user: u.User_name,
      password: u.Password,
      userRole: u.Role_id,
      User_id: u.User_id
    });

    setEditIndex(u.User_id);
    setShowTable(false);
  };
  const handleDelete = async (userId) => {
    const u = users.find(user => user.User_id === userId);
    if (!u) return;

    try {
      await deleteUser({
        User_id: u.User_id,
        Created_by: username,
      });

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="container my-1">
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "700px", minHeight: "auto" }}
      >
        <div
          className="text-white rounded mb-0 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">User Setting</h5>
        </div>

        {!showTable ? (
          <form onSubmit={handleSubmit}>
            {/* First Row: Employee Code + Select List */}
            <div className="row g-2 mt-2 mb-2 align-items-end">

              <div className="col-md-3">
                <label className="form-label" style={{ fontSize: "14px", marginLeft: "25px", marginBottom: "2px" }}>
                  Employee Code
                </label>
                <input
                  type="text"
                  name="employeeCode"
                  className="form-control form-control-sm"
                  style={{ marginLeft: "25px", width: "150px" }}
                  value={formData.employeeCode}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: "14px", marginLeft: "90px" }}>

                </label>
                <select
                  name="selectList"
                  className="form-select form-select-sm"
                  value={formData.selectList}
                  style={{ marginLeft: "20px", width: "250px" }}
                  onChange={handleChange}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.Emp_id} value={emp.Emp_id.toString()}>
                      {emp.Emp_name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Second Row: User + Password + User Role */}
            <div className="row g-3 mt-1 mb-4">
              <div className="col-md-3 ms-4">
                <label className="form-label" style={{ fontSize: "14px", marginBottom: "2px" }}>
                  User
                </label>
                <input
                  type="text"
                  name="user"
                  className="form-control form-control-sm"
                  value={formData.user}
                  onChange={handleChange}
                  style={{ width: "150px" }}
                />
              </div>

              <div className="col-md-3 ms-3">
                <label className="form-label" style={{ fontSize: "14px", marginLeft: "20px", marginBottom: "2px" }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-control form-control-sm"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ marginLeft: "20px" }}
                />
              </div>

              <div className="col-md-3 ms-3">
                <label className="form-label" style={{ fontSize: "14px", marginLeft: "30px", marginBottom: "2px" }}>
                  User Role
                </label>
                <select
                  name="userRole"
                  className="form-select form-select-sm"
                  value={formData.userRole}
                  onChange={handleChange}
                  style={{ marginLeft: "30px" }}
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r.Role_id} value={r.Role_id}>
                      {r.Role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Buttons */}
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
                Cancel
              </button>
              <button
                type="button"
                className="button-list"
                style={{ fontSize: "14px" }}
                onClick={() => { fetchUsers(); setShowTable(true); }}
              >
                Show List
              </button>
            </div>
          </form>
        ) : (
          <div style={{ paddingTop: "5px" }}>
            <CommonTable
              columns={columns}
              data={filteredUsers}
              onEdit={(index) =>
                handleEdit(filteredUsers[index].User_id)
              }
              onDelete={(index) =>
                handleDelete(filteredUsers[index].User_id)
              }
              searchValue={searchName}
              onSearchChange={setSearchName}
              onClose={() => {
                setShowTable(false);
                handleClear();
                setSearchName("");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Usersetting;

