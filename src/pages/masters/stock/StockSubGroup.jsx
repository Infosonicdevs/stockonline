import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { validateRequiredFields } from "../../../utils/validator";
import {
  getStockSubGroups,
  createStockSubGroup,
  updateStockSubGroup,
  deleteStockSubGroup,
} from "../../../services/masters/stockSubGroupService.js";
import { getStockGroups } from "../../../services/masters/stockGroupService";

function StockSubGroup() {
  const [formData, setFormData] = useState({
    Subgroup_id: 0,
    Group_id: 0,
    Subgroup_name: "",
  });

  const [list, setList] = useState([]);
  const [groups, setGroups] = useState([]); // 🔥 dropdown data
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [search, setSearch] = useState("");

  const username = localStorage.getItem("username") || "TRT";

  // ================= LOAD =================
  const loadData = async () => {
    try {
      const res = await getStockSubGroups();
      const data = res.data?.$values || res.data;
      setList(data);
    } catch {
      toast.error("Failed to load data");
    }
  };

  // ================= LOAD GROUPS =================
  const loadGroups = async () => {
    try {
      const res = await getStockGroups();
      const data = res.data?.$values || res.data;
      setGroups(data);
    } catch {
      toast.error("Failed to load stock groups");
    }
  };

  useEffect(() => {
    loadData();
    loadGroups();
  }, []);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ================= CLEAR =================
  const handleClear = () => {
    setFormData({
      Subgroup_id: 0,
      Group_id: 0,
      Subgroup_name: "",
    });
    setEditIndex(null);
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.Group_id ||
      Number(formData.Group_id) === 0 ||
      !formData.Subgroup_name.trim()
    ) {
      toast.warning("All fields are required!");
      return;
    }

    try {
      const payload = {
        Subgroup_id: formData.Subgroup_id,
        Group_id: Number(formData.Group_id),
        Subgroup_name: formData.Subgroup_name.trim(),
        Created_by: username,
        Modified_by: username,
      };

      if (editIndex !== null) {
        await updateStockSubGroup(payload);
        toast.success("Updated successfully");
      } else {
        await createStockSubGroup(payload);
        toast.success("Saved successfully");
      }

      handleClear();
      loadData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Something went wrong";
      toast.error(errorMessage);
    }
  };
  // ================= EDIT =================
  const handleEdit = (item) => {
    setFormData({
      Subgroup_id: item.Subgroup_id,
      Group_id: item.Group_id,
      Subgroup_name: item.Subgroup_name,
    });

    setEditIndex(item.Subgroup_id);
    setShowTable(false);
  };

  // ================= DELETE =================
  const handleDelete = async (item) => {
    try {
      await deleteStockSubGroup({
        Subgroup_id: item.Subgroup_id,
        Modified_by: username,
      });

      setList((prev) => prev.filter((x) => x.Subgroup_id !== item.Subgroup_id));

      toast.success("Deleted successfully");
    } catch {
      toast.error("Delete failed");
    }
  };

  // ================= FILTER =================
  const filtered = list.filter((x) =>
    x.Subgroup_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-white mt-0">
      {!showTable ? (
        /* ================= FORM ================= */
        <div
          className="bg-white p-4 shadow rounded mx-auto"
          style={{ maxWidth: "500px", marginTop: "1px" }}
        >
          <div
            className="text-white rounded mb-2 p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Stock Sub Group</h5>
          </div>
          <form onSubmit={handleSubmit}>
            {/* STOCK GROUP DROPDOWN */}
            <label className="form-label mt-2">Stock Group</label>

            <select
              name="Group_id"
              value={formData.Group_id}
              onChange={handleChange}
              className="form-select form-select-sm"
            >
              <option value={0}>Select Stock Group </option>
              {groups.map((g) => (
                <option key={g.Group_id} value={g.Group_id}>
                  {g.Group_name}
                </option>
              ))}
            </select>

            {/* SUB GROUP NAME */}
            <label className="form-label mt-2">Sub Group Name</label>

            <input
              type="text"
              name="Subgroup_name"
              value={formData.Subgroup_name}
              onChange={handleChange}
              className="form-control form-control-sm"
            />

            <div className="text-center mt-3 d-flex justify-content-center gap-2">
              <button
                type="submit"
                className="button-save "
                style={{ fontSize: "14PX" }}
              >
                {editIndex !== null ? "Update" : "Save"}
              </button>

              <button
                type="button"
                onClick={handleClear}
                style={{ fontSize: "14PX" }}
                className="button-clear"
              >
                Clear
              </button>

              <button
                type="button"
                style={{ fontSize: "14PX" }}
                className="button-list"
                onClick={() => setShowTable(true)}
              >
                Show List
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= TABLE ================= */
        <div
          className="bg-white p-3 rounded mx-auto shadow"
          style={{ maxWidth: "600px" }}
        >
          {/* HEADER */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Stock Sub Group</h5>
          </div>

          {/* TOP BAR */}
          <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowTable(false)}
            >
              Close
            </button>

            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-search"></i>

              <label className="fw-semibold text-secondary small mb-0">
                Search{" "}
              </label>

              <input
                type="text"
                className="form-control"
                style={{
                  width: "250px",
                  height: "25px",
                  marginRight: "180px",
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="table-responsive" style={{ maxHeight: "60vh" }}>
            <table className="table table-bordered table-sm table-striped text-center">
              <thead>
                <tr>
                  <th
                    className="table-column-bg-heading"
                    style={{ width: "130px" }}
                  >
                    Actions
                  </th>

                  <th className="table-column-bg-heading">Sr.No.</th>

                  <th className="table-column-bg-heading">Stock Group</th>

                  <th className="table-column-bg-heading">Sub Group</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4">No Records</td>
                  </tr>
                ) : (
                  filtered.map((item, i) => (
                    <tr key={item.Subgroup_id}>
                      <td>
                        <button
                          className="btn btn-info btn-sm me-1"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>
                      </td>

                      <td>{i + 1}</td>

                      <td>
                        {
                          groups.find((g) => g.Group_id === item.Group_id)
                            ?.Group_name
                        }
                      </td>

                      <td>{item.Subgroup_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockSubGroup;
