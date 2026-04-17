import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getRoles, saveRole, updateRole, deleteRole } from "../../../services/masters/role";
import CommonTable from "../../../components/navigation/CommonTable";

function Rolemaster() {
  const username = localStorage.getItem("username") || "Unknown";

  const [formData, setFormData] = useState({
    roleName: "",
    Role_id: null,
    User_name: username, // backend requires
  });

  const [searchRoleName, setSearchRoleName] = useState("");
  const [roles, setRoles] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

   const columns = [
    { label: "Sr. No", render: (_, __, index) => index + 1 },
    { label: "Role Name", accessor: "Role" },
  ];

  // searchbar
  const filteredRoles = roles.filter((r) =>
    r.Role.toLowerCase().includes(searchRoleName.toLowerCase()),
  );

  // Fetch roles on load
  useEffect(() => {
    fetchRoles();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleClear = () => {
    setFormData({ roleName: "", Role_id: null, User_name: username });
    setEditIndex(null);
  };

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      const res = await getRoles();
      setRoles(res.data);
    } catch (err) {
      toast.error("Failed to load roles");
    }
  };

  // Handle Add / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roleName) {
      toast.warning("Please enter role name!");
      return;
    }

    try {
      if (editIndex !== null) {
        // Update role
        await updateRole({
          Role_id: formData.Role_id,
          Role: formData.roleName,
          User_name: formData.User_name,
        });
        toast.success("Role updated");
      } else {
        // Add new role
        await saveRole({
          Role: formData.roleName,
          User_name: formData.User_name,
        });
        toast.success("Role added");
      }

      handleClear();
      fetchRoles();
      setShowTable(true);
    } catch (err) {
      toast.error(err.response?.data || "Role name already exists");
    }
  };
  // Edit role
  const handleEdit = async (data) => {
    setFormData({
      roleName: data.Role,
      Role_id: data.Role_id,
      User_name: username,
    });
    setEditIndex(data.Role_id);
    setShowTable(false);
  };

  // Delete role
  // Delete role (no confirm)
  const handleDelete = async (data) => {
    try {
      await deleteRole({
        Role_id: data.Role_id,
        User_name: username,
      });
      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data || err.message);
    }
  };

  return (
    <div className="container my-1 mt-3" style={{fontSize:"14px"}}>
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "400px", minHeight: "auto" }}
      >
        <div
          className="text-white rounded mb-0 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Role Master</h5>
        </div>

        {!showTable ? (
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-2 mt-1">
              <div className="col" style={{ marginLeft: "50px" }}>
                <label className="fw-small mb-1">Role Name</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <input
                  type="text"
                  name="roleName"
                  value={formData.roleName}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  style={{ width: "240px" }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 d-flex justify-content-center gap-2">
              <button
                type="submit"
                className="button-save"
                style={{ fontSize: "14px" }}
              >
                {editIndex !== null ? "Update" : "Save"}
              </button>
              <button
                type="button"
                className="button-clear"
                onClick={handleClear}
                style={{ fontSize: "14px" }}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-list"
                onClick={() => {
                  setShowTable(true);
                }}
                style={{ fontSize: "14px" }}
              >
                Show List
              </button>
            </div>
          </form>
        ) : (

              <div
            className="bg-white rounded shadow mx-auto"
            style={{ maxWidth: "800px", padding: "10px" }}
          >
            {/* Header */}
            <div
              className="text-white rounded p-2 text-center"
              style={{ backgroundColor: "#365b80" }}
            >
              <h5 className="mb-0 fw-semibold">Role Master </h5>
            </div>
          <CommonTable
            columns={columns}
            data={filteredRoles}
            onEdit={(row) => handleEdit(row)}
            onDelete={(row) => handleDelete(row)}
            searchValue={searchRoleName}
            onSearchChange={setSearchRoleName}
            onClose={() => {
              setShowTable(false);
              setSearchRoleName("");
            }}
          />
          </div>
        )}
      </div>
    </div>
  );
}

export default Rolemaster;

