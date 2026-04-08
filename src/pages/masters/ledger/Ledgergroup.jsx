import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getPatrakTypes, getCrDR } from "../../../services/masters/ledgerGroup";
import apiClient from "../../../api/client";
import { validateRequiredFields } from "../../../utils/validator";
import CommonTable from "../../../components/navigation/CommonTable";

function LedgerForm() {
  const [formData, setFormData] = useState({
    L_group_id: 0,
    ledgerNameEn: "",
    ledgerNameMn: "",
    documentType: 0,
    crDr: 0,
    indexNo: 0,
    code: "",
  });

  const [searchName, setSearchName] = useState("");
  const [ledgers, setLedgers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [patrakTypes, setPatrakTypes] = useState([]);
  const [crDrs, setCrDrs] = useState([]);
  const username = localStorage.getItem("username");

  const columns = [
  {
    label: "Sr.No",
    render: (val, row, index) => index + 1,
  },
  {
    label: "Name",
    accessor: "L_group_name",
    className: "text-start",
  },
  {
    label: "Name RL",
    accessor: "L_group_name_RL",
    className: "text-start",
  },
  {
    label: "Patrak",
    render: (val, row) =>
      patrakTypes.find((p) => p.Patrak_id === row.Patrak_id)?.Patrak,
  },
  {
    label: "CR/DR",
    render: (val, row) =>
      crDrs.find((c) => c.CrDr_id === row.crdr_id)?.CrDr,
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

  // searchbar
  const filteredLedgers = ledgers.filter((l) => {
    const term = searchName.trim().toLowerCase();
    if (!term) return true;

    return (
      l.L_group_name.toLowerCase().includes(term) || // Name
      (l.L_group_name_RL?.toLowerCase() || "").includes(term) || // Name RL
      (
        patrakTypes
          .find((p) => p.Patrak_id === l.Patrak_id)
          ?.Patrak?.toLowerCase() || ""
      ).includes(term) || // Patrak
      (
        crDrs.find((c) => c.CrDr_id === l.crdr_id)?.CrDr?.toLowerCase() || ""
      ).includes(term) || // CR/DR
      l.Seqno.toString().includes(term) || // Seq
      l.Code.toString().includes(term) // Code
    );
  });
  /* ================= FETCH DROPDOWN DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patrakResult, crDrResult] = await Promise.all([
          getPatrakTypes(),
          getCrDR(),
        ]);

        if (patrakResult.status === 200) setPatrakTypes(patrakResult.data);

        if (crDrResult.status === 200) setCrDrs(crDrResult.data);
      } catch (error) {
        toast.error("Error occurred while fetching dropdown data");
      }
    };

    fetchData();
  }, []);

  /* ================= LOAD TABLE DATA ================= */
  const loadLedgerGroups = async () => {
    try {
      const res = await apiClient.get(`/api/LedgerGroup`);

      // Handle .NET $values structure safely
      const data = res.data?.$values || res.data;
      console.log(data);

      setLedgers(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load ledger group data");
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
      L_group_id: 0,
      ledgerNameEn: "",
      ledgerNameMn: "",
      documentType: 0,
      crDr: 0,
      indexNo: 0,
      code: "",
    });
    setEditIndex(null);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, missingFields } = validateRequiredFields(formData, [
      "ledgerNameEn",
      "documentType",
      "crDr",
      "code",
    ]);

    if (!isValid) {
      return toast.warning("Please fill all fields!");
    }

    try {
      const bodyData = {
        L_group_id: formData.L_group_id,
        L_group_name: formData.ledgerNameEn,
        L_group_name_RL: formData.ledgerNameMn,
        Patrak_id: Number(formData.documentType),
        crdr_id: Number(formData.crDr),
        Seqno: Number(formData.indexNo),
        Code: formData.code,
        User_name: username,
      };

      const url = `/api/LedgerGroup`;

      if (editIndex !== null) {
        await apiClient.put(url, bodyData);
        toast.success("Ledger group updated successfully");
      } else {
        await apiClient.post(url, bodyData);
        toast.success("Ledger group added successfully");
      }

      handleClear();
      loadLedgerGroups();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data || "Error occurred while saving ledger group data",
      );
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (l) => {
    setFormData({
      L_group_id: l.L_group_id,
      ledgerNameEn: l.L_group_name,
      ledgerNameMn: l.L_group_name_RL,
      documentType: l.Patrak_id,
      crDr: l.crdr_id,
      indexNo: l.Seqno,
      code: l.Code,
    });

    setEditIndex(true);
    setShowTable(false);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (l) => {
    try {
      await apiClient.post(`/api/DelLedgerGroup`, {
        L_group_id: l.L_group_id,
        L_group_name: l.L_group_name,
        L_group_name_RL: l.L_group_name_RL,
        Patrak_id: l.Patrak_id,
        crdr_id: l.crdr_id,
        Seqno: Number(l.Seqno),
        Code: l.Code,
        User_name: username,
      });

      // remove from UI
      setLedgers((prev) => prev.filter((item) => item.L_group_id !== l.L_group_id));

      toast.success("Ledger group deleted successfully");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Something went wrong";
      toast.error(errorMessage);
    }
  };

  /* ================= RENDER ================= */
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
            <h5 className="mb-0 fw-semibold">Ledger Group</h5>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="row ms-2 me-2 g-3 mt-0">
              <div className="col-md-6">
                <label className="form-label small">
                  Ledger Group Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="ledgerNameEn"
                  value={formData.ledgerNameEn}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small">
                  Ledger Group Name Regional
                </label>
                <input
                  type="text"
                  name="ledgerNameMn"
                  value={formData.ledgerNameMn}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
            </div>

            <div className="row ms-2 me-2 g-3 mt-0">
              <div className="col-md-2">
                <label className="form-label small">
                  CR/DR <span className="text-danger">*</span>
                </label>
                <select
                  name="crDr"
                  value={formData.crDr}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                >
                  <option value={0}>Select</option>
                  {crDrs.map((c) => (
                    <option key={c.CrDr_id} value={c.CrDr_id}>
                      {c.CrDr}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small">
                  Patrak Type <span className="text-danger">*</span>
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                >
                  <option value={0}>Select Type</option>
                  {patrakTypes.map((p) => (
                    <option key={p.Patrak_id} value={p.Patrak_id}>
                      {p.Patrak}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label small">Index No</label>
                <input
                  type="number"
                  name="indexNo"
                  value={formData.indexNo}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label small">
                  Code <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  name="code"
                  value={formData.code}
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
                  loadLedgerGroups();
                  setShowTable(true);
                }}
                style={{ fontSize: "14px" }}
              >
                Show List
              </button>
            </div>
          </form>
        </div>
      ) :  (
  <div
    className="bg-white rounded shadow mx-auto"
    style={{ maxWidth: "1000px", padding: "10px" }}
  >
    {/* Header */}
    <div
      className="text-white rounded p-2 text-center"
      style={{ backgroundColor: "#365b80" }}
    >
      <h5 className="mb-0 fw-semibold">Ledger Group</h5>
    </div>


    <div className="mt-2">
      <CommonTable
        columns={columns}
        data={filteredLedgers}
        onEdit={(index) => handleEdit(filteredLedgers[index])}
        onDelete={(index) => handleDelete(filteredLedgers[index])}
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

export default LedgerForm;
