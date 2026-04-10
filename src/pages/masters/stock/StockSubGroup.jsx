import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { validateRequiredFields } from "../../../utils/validator";
import CommonTable from "../../../components/navigation/CommonTable";
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

  const columns = [
    {
      header: "Sr.No.",
      render: (_, __, index) => index + 1,
    },
    {
      header: "Stock Group",
      render: (row) =>
        groups.find((g) => g.Group_id === row.Group_id)?.Group_name,
    },
    {
      header: "Sub Group",
      accessor: "Subgroup_name",
    },
  ];

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
      ) : showTable && (
        <div
          className="bg-white rounded shadow mx-auto"
          style={{ maxWidth: "700px", padding: "10px" }}
        >
          {/* Header */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Stock Sub Group </h5>
          </div>

          <CommonTable
            columns={columns}
            data={filtered}
            onEdit={(index) => handleEdit(filtered[index])}
            onDelete={(index) => handleDelete(filtered[index])}
            searchValue={search}
            onSearchChange={setSearch}
            onClose={() => {
              setShowTable(false);
              handleClear();
              setSearch("");
            }}
          />
        </div>
      )}
    </div>
  );
}

export default StockSubGroup;
