import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getCounters,
  saveCounter,
  updateCounter,
  deleteCounter,
} from "../../../services/masters/counter";
import { getOutlets } from "../../../services/masters/outlet";

function Counter() {
  const [formData, setFormData] = useState({
    counterName: "",
    outletId: "",
    computerName: "",
  });

  const [dataList, setDataList] = useState([]);
  const [outletList, setOutletList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [searchName, setSearchName] = useState("");

  const columns = [
    {
      label: "Sr.No",
      render: (val, row, index) => index + 1,
    },
    {
      label: "Counter Name",
      accessor: "counterName",
    },
    {
      label: "Outlet Name",
      accessor: "outletName",
    },
    {
      label: "Computer Name",
      accessor: "computerName",
    },
  ];

  useEffect(() => {
    fetchCounters();
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      const response = await getOutlets();
      const data = response.data?.$values || response.data;
      setOutletList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching outlets:", error);
      toast.error("Failed to load outlets");
    }
  };

  const fetchCounters = async () => {
    try {
      const response = await getCounters();
      const data = response.data?.$values || response.data;
      if (data) {
        const transformedData = data.map((item) => ({
          counterName: item.Counter_name,
          outletId: item.Outlet_id,
          outletName: item.Outlet_name,
          computerName: item.Computer_name || "",
          Counter_Id: item.Counter_Id,
        }));
        setDataList(transformedData);
      }
    } catch (error) {
      console.error("Error fetching counters:", error);
      toast.error("Failed to load counters");
    }
  };

  const filteredList = dataList.filter((item) =>
    item.counterName.toLowerCase().includes(searchName.toLowerCase()),
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClear = () => {
    setFormData({
      counterName: "",
      outletId: "",
      computerName: "",
    });
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.counterName) return toast.error("Enter Counter Name");
    if (!formData.outletId) return toast.error("Select Outlet");

    try {
      const bodyData = {
        Counter_name: formData.counterName,
        Outlet_id: parseInt(formData.outletId),
        Computer_name: formData.computerName,
        User: localStorage.getItem("username"),
      };

      let response;
      if (editIndex !== null) {
        bodyData.Counter_Id = dataList[editIndex].Counter_Id;
        response = await updateCounter(bodyData);
      } else {
        response = await saveCounter(bodyData);
      }

      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data === "Record Inserted" ||
        response.data === "Record Updated"
      ) {
        toast.success(
          editIndex !== null ? "Updated successfully" : "Saved successfully",
        );
        handleClear();
        fetchCounters();
        setShowTable(true);
      }
    } catch (error) {
      console.error("Error saving/updating counter:", error);
      toast.error(error.response?.data || "Failed to process counter");
    }
  };

  const handleEdit = (index) => {
    const item = filteredList[index];
    setFormData({
      counterName: item.counterName,
      outletId: item.outletId,
      computerName: item.computerName,
    });
    const realIndex = dataList.findIndex(
      (d) => d.Counter_Id === item.Counter_Id,
    );
    setEditIndex(realIndex);
    setShowTable(false);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this counter?"))
      return;

    const item = filteredList[index];
    try {
      const bodyData = {
        Counter_Id: item.Counter_Id,
        User: localStorage.getItem("username"),
      };
      const response = await deleteCounter(bodyData);
      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data === "Record deleted"
      ) {
        toast.success("Deleted successfully");
        fetchCounters();
      }
    } catch (error) {
      console.error("Error deleting counter:", error);
      toast.error(error.response?.data || "Failed to delete counter");
    }
  };

  return (
    <div className="container my-2" style={{ fontSize: "14px" }}>
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "600px" }}
      >
        <div
          className="text-white rounded mb-3 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Counter Master</h5>
        </div>

        {!showTable && (
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-2">
              <div className="col-md-12">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Counter Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="counterName"
                  className="form-control form-control-sm"
                  value={formData.counterName}
                  onChange={handleChange}
                  placeholder="Enter counter name"
                />
              </div>
            </div>

            <div className="row g-3 mb-2">
              <div className="col-md-12">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Outlet <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  name="outletId"
                  className="form-select form-select-sm"
                  value={formData.outletId}
                  onChange={handleChange}
                >
                  <option value="">Select Outlet</option>
                  {outletList.map((o) => (
                    <option key={o.Outlet_id} value={o.Outlet_id}>
                      {o.Outlet_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row g-3 mb-2">
              <div className="col-md-12">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Computer Name
                </label>
                <input
                  type="text"
                  name="computerName"
                  className="form-control form-control-sm"
                  value={formData.computerName}
                  onChange={handleChange}
                  placeholder="Enter computer name"
                />
              </div>
            </div>

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
        )}

        {showTable && (
          <CommonTable
            columns={columns}
            data={filteredList}
            onEdit={(_, index) => handleEdit(index)}
            onDelete={(_, index) => handleDelete(index)}
            searchValue={searchName}
            onSearchChange={setSearchName}
            onClose={() => {
              setShowTable(false);
              handleClear();
              setSearchName("");
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Counter;
