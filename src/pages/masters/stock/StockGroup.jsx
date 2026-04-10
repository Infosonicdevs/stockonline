import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { validateRequiredFields } from "../../../utils/validator";
import CommonTable from "../../../components/navigation/CommonTable";
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

  const columns = [
    {
      label: "Sr.No.",
      render: (val, row, index) => index + 1,
    },
    {
      label: "Stock Name",
      accessor: "Group_name",
      className: "text-start",
    },
  ];

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
      ) :
        <div
          className="bg-white rounded shadow mx-auto"
          style={{ maxWidth: "1000px", padding: "10px" }}
        >
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold text-center">Stock Group </h5>
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
      }
    </div>
  );
}

export default StockGroup;
