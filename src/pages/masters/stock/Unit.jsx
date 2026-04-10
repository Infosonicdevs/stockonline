import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getUnits, addUnit, updateUnit, deleteUnit } from "../../../services/masters/unit";

function Unit() {
  const username = localStorage.getItem("username") || "Unknown"; // dynamic user
  const [formData, setFormData] = useState({
    unitName: "",
    multipleFactor: "",
    Unit_id: null,
  });
  const [searchTerm, setSearchTerm] = useState(""); // single search box
  const [units, setUnits] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [searchText, setSearchText] = useState("");

  const columns = [
    {
      header: "Sr. No",
      render: (_, __, index) => index + 1,
    },
    {
      header: "Unit Name",
      accessor: "Unit_name",
    },
    {
      header: "Multiple Factor",
      accessor: "multiple_factor",
    },
  ];

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await getUnits();
      setUnits(res.data);
    } catch (err) {
      toast.error("Failed to load units");
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleClear = () => {
    setFormData({ unitName: "", multipleFactor: "", Unit_id: null });
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unitName || !formData.multipleFactor) {
      toast.warning("Please fill all fields!");
      return;
    }

    const payload = {
      Unit_id: formData.Unit_id, // backend auto-generates if null
      Unit_name: formData.unitName,
      multiple_factor: parseFloat(formData.multipleFactor),
      Created_by: username,
      Modified_by: username,
    };

    try {
      if (editIndex !== null) {
        await updateUnit(payload);
        toast.success("Unit updated successfully!");
        const updatedUnits = [...units];
        updatedUnits[editIndex] = payload;
        setUnits(updatedUnits);
      } else {
        await addUnit(payload);
        toast.success("Unit added successfully!");
        setUnits([...units, payload]);
      }

      handleClear();
      setShowTable(true);
    } catch (err) {
      toast.error(err.response?.data || err.message);
    }
  };

  const handleEdit = (index) => {
    const unit = units[index];
    setFormData({
      unitName: unit.Unit_name,
      multipleFactor: unit.multiple_factor,
      Unit_id: unit.Unit_id,
    });
    setEditIndex(index);
    setShowTable(false);
  };

  const handleDelete = async (index) => {
    const unit = units[index];
    try {
      await deleteUnit({ Unit_id: unit.Unit_id, Modified_by: username });
      toast.success("Unit deleted successfully!");
      const updatedUnits = [...units];
      updatedUnits.splice(index, 1);
      setUnits(updatedUnits);
    } catch (err) {
      toast.error(err.response?.data || err.message);
    }
  };

  const filteredUnits = units.filter((u) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    return u.Unit_name.toLowerCase().includes(term);
  });
  return (
    <div className="bg-white">
      {!showTable ? (
        <div
          className="bg-white p-4 rounded mx-auto shadow"
          style={{ maxWidth: "700px" }}
        >
          {/* Header */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Unit Master</h5>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="row ms-2 me-2 mt-2">
              <div className="col-md-4">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Unit Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="unitName"
                  value={formData.unitName}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="col-md-3">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Multiple Factor
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="multipleFactor"
                  value={formData.multipleFactor}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="d-flex justify-content-center gap-2 mt-4">
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
                style={{ fontSize: "14px" }}
                onClick={handleClear}
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
          style={{ maxWidth: "800px", padding: "10px" }}
        >
          {/* Header */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Unit</h5>
          </div>
          <CommonTable
            columns={columns}
            data={filteredUnits}
            onEdit={(index) => handleEdit(units.indexOf(filteredUnits[index]))}
            onDelete={(index) => handleDelete(units.indexOf(filteredUnits[index]))}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onClose={() => {
              setShowTable(false);
              handleClear();
              setSearchTerm("");
            }}
          />
        </div>
      }
    </div>
  );
}

export default Unit;

