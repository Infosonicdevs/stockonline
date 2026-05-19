import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../api/client";
import {
  getLedgerGroups,
  getLedgerSubGroups,
  createLedgerSubGroup,
  updateLedgerSubGroup,
  deleteLedgerSubGroup,
} from "../../../services/masters/ledgerSubGroup";
import { validateRequiredFields } from "../../../utils/validator";
import CommonTable from "../../../components/navigation/CommonTable";

function SubLedgergroup() {
  const [formData, setFormData] = useState({
    Ledger_subgroup_id: 0,
    Ledger_subgroup_name: "",
    Ledger_subgroup_name_EN: "",
    Ledger_group_id: 0,
    Seqno: 0,
    Code: "",
  });

  const [searchName, setSearchName] = useState("");
  const [subGroups, setSubGroups] = useState([]);
  const [ledgerGroups, setLedgerGroups] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const username = localStorage.getItem("username") || "TRT";

  const columns = [
    {
      label: "Sr.No",
      render: (val, row, index) => index + 1,
    },
    {
      label: "SubGroup Name",
      accessor: "Ledger_subgroup_name",
      className: "text-start",
    },
    {
      label: "SubGroup Name RL",
      accessor: "Ledger_subgroup_name_EN",
      className: "text-start",
    },
    {
      label: "Ledger Group",
      render: (val, row) => {
        const group = ledgerGroups.find((g) => g.L_group_id === row.Ledger_group_id);
        return group ? group.L_group_name : row.Ledger_group_id;
      },
      className: "text-start",
    },
    {
      label: "Seq",
      accessor: "Seqno",
    },
    {
      label: "Code",
      accessor: "Code",
    },
  ];

  // Search filter
  const filteredSubGroups = subGroups.filter((s) => {
    const term = searchName.trim().toLowerCase();
    if (!term) return true;

    const group = ledgerGroups.find((g) => g.L_group_id === s.Ledger_group_id);
    const groupName = group ? group.L_group_name.toLowerCase() : "";

    return (
      (s.Ledger_subgroup_name || "").toLowerCase().includes(term) ||
      (s.Ledger_subgroup_name_EN || "").toLowerCase().includes(term) ||
      groupName.includes(term) ||
      (s.Seqno || "").toString().includes(term) ||
      (s.Code || "").toString().includes(term)
    );
  });

  /* ================= FETCH DROPDOWN DATA ================= */
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await getLedgerGroups();
        const data = res.data?.$values || res.data || [];
        setLedgerGroups(data);
      } catch (error) {
        toast.error("Error occurred while fetching Ledger Groups");
      }
    };
    fetchGroups();
  }, []);

  /* ================= LOAD TABLE DATA ================= */
  const loadLedgerSubGroups = async () => {
    try {
      const res = await getLedgerSubGroups();
      const data = res.data?.$values || res.data || [];
      setSubGroups(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load ledger sub group data");
    }
  };

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  /* ================= CLEAR FORM ================= */
  const handleClear = () => {
    setFormData({
      Ledger_subgroup_id: 0,
      Ledger_subgroup_name: "",
      Ledger_subgroup_name_EN: "",
      Ledger_group_id: 0,
      Seqno: 0,
      Code: "",
    });
    setEditIndex(null);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid } = validateRequiredFields(formData, [
      "Ledger_subgroup_name",
      "Ledger_group_id",
      "Code",
    ]);

    if (!isValid || Number(formData.Ledger_group_id) === 0) {
      return toast.warning("Please fill all required fields!");
    }

    try {
      const bodyData = {
        Ledger_subgroup_id: Number(formData.Ledger_subgroup_id),
        Ledger_subgroup_name: formData.Ledger_subgroup_name,
        Ledger_subgroup_name_EN: formData.Ledger_subgroup_name_EN,
        Ledger_group_id: Number(formData.Ledger_group_id),
        Seqno: Number(formData.Seqno),
        Code: formData.Code,
        User_name: username,
      };

      if (editIndex !== null) {
        await updateLedgerSubGroup(bodyData);
        toast.success("Ledger subgroup updated successfully");
      } else {
        await createLedgerSubGroup(bodyData);
        toast.success("Ledger subgroup added successfully");
      }

      handleClear();
      loadLedgerSubGroups();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data || "Error occurred while saving ledger subgroup data"
      );
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (s) => {
    setFormData({
      Ledger_subgroup_id: s.Ledger_subgroup_id,
      Ledger_subgroup_name: s.Ledger_subgroup_name,
      Ledger_subgroup_name_EN: s.Ledger_subgroup_name_EN || "",
      Ledger_group_id: s.Ledger_group_id,
      Seqno: s.Seqno,
      Code: s.Code,
    });

    setEditIndex(true);
    setShowTable(false);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (s) => {
    try {
      await deleteLedgerSubGroup({
        Ledger_subgroup_id: s.Ledger_subgroup_id,
        Ledger_subgroup_name: s.Ledger_subgroup_name,
        Ledger_subgroup_name_EN: s.Ledger_subgroup_name_EN || "",
        Ledger_group_id: s.Ledger_group_id,
        Seqno: Number(s.Seqno),
        Code: s.Code,
        User_name: username,
      });

      // Remove from UI
      setSubGroups((prev) =>
        prev.filter((item) => item.Ledger_subgroup_id !== s.Ledger_subgroup_id)
      );

      toast.success("Ledger subgroup deleted successfully");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Something went wrong";
      toast.error(errorMessage);
    }
  };

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
            <h5 className="mb-0 fw-semibold">Ledger SubGroup</h5>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row ms-2 me-2 g-3 mt-0">
              <div className="col-md-6">
                <label className="form-label small">
                  Ledger Group <span className="text-danger">*</span>
                </label>
                <select
                  name="Ledger_group_id"
                  value={formData.Ledger_group_id}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                >
                  <option value={0}>Select Ledger Group</option>
                  {ledgerGroups.map((g) => (
                    <option key={g.L_group_id} value={g.L_group_id}>
                      {g.L_group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small">
                  Ledger SubGroup Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="Ledger_subgroup_name"
                  value={formData.Ledger_subgroup_name}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
            </div>

            <div className="row ms-2 me-2 g-3 mt-0">
              <div className="col-md-6">
                <label className="form-label small">
                  Ledger SubGroup Name Regional
                </label>
                <input
                  type="text"
                  name="Ledger_subgroup_name_EN"
                  value={formData.Ledger_subgroup_name_EN}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small">Seq No</label>
                <input
                  type="number"
                  name="Seqno"
                  value={formData.Seqno}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small">
                  Code <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="Code"
                  value={formData.Code}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
            </div>

            <div className="mt-4 d-flex justify-content-center gap-3">
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
                onClick={() => {
                  loadLedgerSubGroups();
                  setShowTable(true);
                }}
                style={{ fontSize: "14px" }}
              >
                Show List
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div
          className="bg-white rounded shadow mx-auto"
          style={{ maxWidth: "1000px", padding: "10px" }}
        >
          {/* Header */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Ledger SubGroup List</h5>
          </div>

          <div className="mt-2">
            <CommonTable
              columns={columns}
              data={filteredSubGroups}
              onEdit={handleEdit}
              onDelete={handleDelete}
              searchValue={searchName}
              onSearchChange={setSearchName}
              onClose={() => {
                setShowTable(false);
                handleClear();
                setSearchName("");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SubLedgergroup;