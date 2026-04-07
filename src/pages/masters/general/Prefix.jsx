import React, { useEffect, useState } from "react";
import {
  createPrefix,
  deletePrefix,
  getPrefixes,
  updatePrefix,
} from "../../../services/masters/prefix";
import { toast } from "react-toastify";
import { validateRequiredFields } from "../../../utils/validator";

const Prefix = () => {
  const [formData, setFormData] = useState({
    Prefix_id: 0,
    Prefix: "",
    Prefix_RL: "",
  });
  const [showTable, setShowTable] = useState(false);
  const [prefixes, setPrefixes] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const username = localStorage.getItem("username");

  useEffect(() => {
    fetchPrefixes();
  }, []);

  const fetchPrefixes = async () => {
    try {
      const result = await getPrefixes();
      if (result.status === 200) {
        setPrefixes(result.data);
      }
    } catch (error) {
      toast.error("error occured while fetching prefixes");
    }
  };

  const handleClear = () => {
    setFormData({
      Prefix_id: 0,
      Prefix: "",
      Prefix_RL: "",
    });
    setEditIndex(null)
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();

    const { isValid, missingFields } = validateRequiredFields(formData, [
      "Prefix",
    ]);

    if (!isValid) {
      return toast.warning("Please fill all required fields!");
    }

    let requestBody = {};
    if (editIndex != null) {
      requestBody = {
        Prefix_id: formData.Prefix_id,
        Prefix: formData.Prefix,
        Prefix_RL: formData.Prefix_RL,
        User_name: username,
      };
      try {
        const result = await updatePrefix(requestBody);
        if (result.status === 200) {
          toast.success("prefix updated successfully");
          handleClear();
          await fetchPrefixes();
          setEditIndex(null);
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          toast.error(error.response.data);
        } else {
          toast.error("error occurred while updating prefix");
        }
      }
    } else {
      requestBody = {
        Prefix: formData.Prefix,
        Prefix_RL: formData.Prefix_RL,
        User_name: username,
      };
      try {
        const result = await createPrefix(requestBody);
        if (result.status === 200) {
          toast.success("prefix created successfully");
          handleClear();
          await fetchPrefixes();
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          toast.error(error.response.data);
        } else {
          toast.error("error occurred while creating prefix");
        }
      }
    }
  };

  const handleEdit = async (prefix) => {
    setFormData({
      Prefix_id: prefix.Prefix_id,
      Prefix: prefix.Prefix,
      Prefix_RL: prefix.Prefix_RL,
    });
    setEditIndex(prefix.Prefix_id);
  };

  const handleDelete = async (prefix) => {
    try {
      const requestBody = {
        Prefix_id: prefix.Prefix_id,
        Prefix: prefix.Prefix,
        Prefix_RL: prefix.Prefix_RL,
        User_name: username,
      };
      const result = await deletePrefix(requestBody);
      if (result.status === 200) {
        setPrefixes((prev) =>
          prev.filter((p) => p.Prefix_id !== prefix.Prefix_id),
        );
        toast.success("prefix deleted successfully");
      }
    } catch (error) {
      toast.error("error occured while deleting prefix");
    }
  };
  return (
    <>
      <div className="container my-1">
        <div
          className="bg-white p-4 rounded shadow mx-auto"
          style={{ maxWidth: "700px" }}
        >
          <div
            className="text-white rounded mb-2 p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Prefix</h5>
          </div>

          {!showTable ? (
            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-0">
                <div className="col me-4">
                  <label className="fw-small">Prefix</label>
                  <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                  <input
                    type="text"
                    name="Prefix"
                    value={formData.Prefix}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                    style={{ width: "240px" }}
                  />
                </div>

                <div className="col">
                  <label className="fw-small">Prefix (Regional)</label>
                  <input
                    type="text"
                    name="Prefix_RL"
                    value={formData.Prefix_RL}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                    style={{ width: "240px" }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div
                className=" d-flex justify-content-center "
                style={{ marginTop: "15px", gap: "10px" }}
              >
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
            <div className="mt-2">
              <div className="text-left mb-3">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setShowTable(false);
                    setEditIndex(null)
                    handleClear();
                  }}
                >
                  Close
                </button>
              </div>
              <div
                className="table-responsive mt-2"
                style={{
                  maxHeight: "60vh",
                  overflowY: "auto",
                  overflowX: "auto",
                }}
              >
                <table
                  className="table table-bordered text-center table-sm table-striped"
                  style={{
                    whiteSpace: "nowrap",
                    width: "max-content",
                    minWidth: "100%",
                  }}
                >
                  <thead
                    className="table-light"
                    style={{
                      fontSize: "13px",
                      fontWeight: "semibold",
                    }}
                  >
                    <tr>
                      <th className="table-column-bg-heading">Actions</th>
                      <th className="table-column-bg-heading">Sr. No</th>
                      <th className="table-column-bg-heading">Prefix</th>
                      <th className="table-column-bg-heading">
                        Prefix (Regional)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prefixes.length === 0 ? (
                      <tr className="text-center">
                        <td colSpan="4">No records found</td>
                      </tr>
                    ) : (
                      prefixes.map((p, i) => (
                        <tr key={p.Prefix_id}>
                          <td>
                            <button
                              className="btn btn-info btn-sm me-1"
                              onClick={() => {
                                setShowTable(false);
                                handleEdit(p);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                handleDelete(p);
                              }}
                            >
                              Delete
                            </button>
                          </td>
                          <td>{i + 1}</td>
                          <td>{p.Prefix}</td>
                          <td>{p.Prefix_RL}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Prefix;

