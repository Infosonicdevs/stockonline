import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { validateRequiredFields } from "../../../utils/validator";
import {
  getStockGroups,
  createStockGroup,
  updateStockGroup,
  deleteStockGroup,
} from "../../../services/masters/stockGroupService";

function StockGroup() {
  const [formData, setFormData] = useState({
    Group_id: 0,
    Group_name: "",
  });

  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const username = localStorage.getItem("username");

  /* ================= FETCH ================= */
  const loadData = async () => {
    try {
      const res = await getStockGroups();
      const data = res.data?.$values || res.data;
      setGroups(data);
    } catch {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      Group_name: value,
    });
  };

  /* ================= CLEAR ================= */
  const handleClear = () => {
    setFormData({
      Group_id: 0,
      Group_name: "",
    });
    setEditIndex(null);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.Group_name || formData.Group_name.trim() === "") {
      toast.warning("Group Name is required!");
      return;
    }

    try {
      const payload = {
        Group_id: formData.Group_id,
        Group_name: formData.Group_name.trim(),
        Created_by: username,
        Modified_by: username,
      };

      if (editIndex !== null) {
        await updateStockGroup(payload);
        toast.success("Updated successfully");
      } else {
        await createStockGroup(payload);
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

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setFormData({
      Group_id: item.Group_id,
      Group_name: item.Group_name,
    });

    setEditIndex(item.Group_id);
    setShowTable(false);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (item) => {
    try {
      await deleteStockGroup({
        Group_id: item.Group_id,
        Modified_by: username,
      });

      setGroups((prev) => prev.filter((g) => g.Group_id !== item.Group_id));

      toast.success("Deleted successfully");
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ================= FILTER ================= */
  const filtered = groups.filter((g) =>
    g.Group_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-white">
      {!showTable ? (
        /* ================= FORM ================= */
        <div
          className="bg-white p-4 rounded mx-auto shadow"
          style={{ maxWidth: "500px" }}
        >
          <div
            className="text-white rounded mb-2 p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Stock Group</h5>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="form-label mt-2">Group Name </label>

            <input
              type="text"
              name="Group_name"
              value={formData.Group_name}
              onChange={handleChange}
              className="form-control form-control-sm"
            />

            <div className="text-center mt-3 d-flex justify-content-center gap-2">
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
                style={{ fontSize: "14px" }}
                className="button-clear"
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
            <h5 className="mb-0 fw-semibold">Stock Group</h5>
          </div>

          {/* TOP BAR */}
          <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setShowTable(false);
                handleClear();
              }}
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
                style={{ width: "250px", height: "25px", marginRight: "180px" }}
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
                  <th className="table-column-bg-heading">Stock Name</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((g, i) => (
                  <tr key={g.Group_id}>
                    <td>
                      <button
                        className="btn btn-info btn-sm me-1"
                        onClick={() => handleEdit(g)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(g)}
                      >
                        Delete
                      </button>
                    </td>

                    <td>{i + 1}</td>
                    <td className="text-start">{g.Group_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockGroup;
