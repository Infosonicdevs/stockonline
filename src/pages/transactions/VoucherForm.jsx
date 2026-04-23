import React, { useState, useEffect } from "react";
import apiClient from "../../api/client";
import CommonTable from "../../components/navigation/CommonTable";
import {
  deleteVoucher,
  getTransByTransId,
  TransDetailsByTransId,
} from "../../services/transactions/voucher";
import { toast } from "react-toastify";

function VoucherForm() {
  const [voucherType, setVoucherType] = useState("journal");
  const [drLedger, setDrLedger] = useState("");
  const [drDropdown1, setDrDropdown1] = useState("");
  const [crLedger, setCrLedger] = useState("");
  const [crDropdown1, setCrDropdown1] = useState("");
  const [amount, setAmount] = useState("00.00");
  const [tableData, setTableData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [ledgerList, setLedgerList] = useState([]);
  const [drCustomerNo, setDrCustomerNo] = useState("");
  const [drCustomer, setDrCustomer] = useState("");
  const [drCustomerName, setDrCustomerName] = useState("");
  const [crCustomerNo, setCrCustomerNo] = useState("");
  const [crCustomer, setCrCustomer] = useState("");
  const [crCustomerName, setCrCustomerName] = useState("");
  const [customerList, setCustomerList] = useState([]);
  const [isDrCustomerEnabled, setIsDrCustomerEnabled] = useState(false);
  const [isCrCustomerEnabled, setIsCrCustomerEnabled] = useState(false);
  const [transList, setTransList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  const columns = [
    {
      label: "Sr. No",
      render: (val, row, index) => index + 1,
    },
    {
      label: "Trans No",
      render: (val, row) => row.Trans_no,
    },
    {
      label: "Trans Amount",
      render: (val, row) =>
        row.Trans_amt ? Number(row.Trans_amt).toFixed(2) : "00.00",
    },
    {
      label: "Trans Type",
      render: (val, row) => row.Type_name,
    },
  ];

  const loginDate = localStorage.getItem("loginDate");
  const year_id = localStorage.getItem("Year_Id");
  const outlet_id = localStorage.getItem("Outlet_id");
  const username = localStorage.getItem("username");

  const formatDate = (dateStr) => {
    if (!dateStr) return null;

    if (dateStr.includes("-")) {
      return dateStr;
    }

    if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/");
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }

    return dateStr;
  };

  const handleShowList = async () => {
    try {
      const rawDate = localStorage.getItem("loginDate");

      if (!rawDate) {
        alert("Login date not found");
        return;
      }

      const res = await apiClient.get(
        `/api/VoucherTrans?Login_Date=${rawDate}`,
      );

      const filteredData = res.data.filter(
        (item) =>
          item.Trans_type_id === 5 ||
          item.Trans_type_id === 6 ||
          item.Trans_type_id === 7,
      );

      console.log("Filtered Data:", filteredData);

      setTransList(filteredData);
      setShowTable(true);
    } catch (err) {
      console.log(err);
    }
  };

  // total jama/naave
  const totalJama = tableData.reduce(
    (sum, row) => sum + (Number(row.jama) || 0),
    0,
  );
  const totalNaave = tableData.reduce(
    (sum, row) => sum + (Number(row.naave) || 0),
    0,
  );

  const finalJama = voucherType === "payment" ? 0 : totalJama;
  const finalNaave = voucherType === "journal" ? 0 : totalNaave;

  const handleAmountFocus = () => {
    if (amount === "00.00") {
      setAmount("");
    }
  };

  const handleAmountBlur = () => {
    if (!amount) {
      setAmount("00.00");
    }
  };

  useEffect(() => {
    apiClient
      .get(`/api/Customer`)
      .then((res) => {
        console.log(res.data); // check exact field names
        setCustomerList(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    apiClient
      .get(`/api/Ledger`)
      .then((res) => {
        setLedgerList(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  const handleCustomerNoChange = (e, side) => {
    const val = e.target.value;
    const selectedCustomer = customerList.find(
      (c) => c.Cust_no.toString() === val.toString(),
    );

    if (side === "dr") {
      setDrCustomerNo(val);
      if (selectedCustomer) {
        setDrCustomer(selectedCustomer.Cust_id);
        setDrCustomerName(selectedCustomer.Cust_name);
      } else {
        setDrCustomer("");
        setDrCustomerName("");
      }
    } else {
      setCrCustomerNo(val);
      if (selectedCustomer) {
        setCrCustomer(selectedCustomer.Cust_id);
        setCrCustomerName(selectedCustomer.Cust_name);
      } else {
        setCrCustomer("");
        setCrCustomerName("");
      }
    }
  };

  const handleCustomerChange = (e, side) => {
    const val = e.target.value;
    const selectedCustomer = customerList.find(
      (c) => c.Cust_id.toString() === val.toString(),
    );

    if (side === "dr") {
      setDrCustomer(val);
      if (selectedCustomer) {
        setDrCustomerName(selectedCustomer.Cust_name);
        setDrCustomerNo(selectedCustomer.Cust_no);
      } else {
        setDrCustomerName("");
        setDrCustomerNo("");
      }
    } else {
      setCrCustomer(val);
      if (selectedCustomer) {
        setCrCustomerName(selectedCustomer.Cust_name);
        setCrCustomerNo(selectedCustomer.Cust_no);
      } else {
        setCrCustomerName("");
        setCrCustomerNo("");
      }
    }
  };

  const handleLedgerNoChange = async (value, side) => {
    const selectedLedger = ledgerList.find(
      (l) => l.Ledger_no.toString() === value.toString(),
    );

    if (side === "dr") {
      setDrDropdown1(value);
      if (selectedLedger) {
        setDrLedger(selectedLedger.Ledger_id);
        try {
          const res = await apiClient.get(
            `/api/CheckPersonalLedger?L_id=${selectedLedger.Ledger_id}`,
          );
          if (res.data && res.data.length > 0 && res.data[0].Is_personal === 1) {
            setIsDrCustomerEnabled(true);
          } else {
            setIsDrCustomerEnabled(false);
            setDrCustomerNo("");
            setDrCustomer("");
            setDrCustomerName("");
          }
        } catch (err) {
          console.log(err);
          setIsDrCustomerEnabled(false);
        }
      } else {
        setDrLedger("");
        setIsDrCustomerEnabled(false);
        setDrCustomerNo("");
        setDrCustomer("");
        setDrCustomerName("");
      }
    } else {
      setCrDropdown1(value);
      if (selectedLedger) {
        setCrLedger(selectedLedger.Ledger_id);
        try {
          const res = await apiClient.get(
            `/api/CheckPersonalLedger?L_id=${selectedLedger.Ledger_id}`,
          );
          if (res.data && res.data.length > 0 && res.data[0].Is_personal === 1) {
            setIsCrCustomerEnabled(true);
          } else {
            setIsCrCustomerEnabled(false);
            setCrCustomerNo("");
            setCrCustomer("");
            setCrCustomerName("");
          }
        } catch (err) {
          console.log(err);
          setIsCrCustomerEnabled(false);
        }
      } else {
        setCrLedger("");
        setIsCrCustomerEnabled(false);
        setCrCustomerNo("");
        setCrCustomer("");
        setCrCustomerName("");
      }
    }
  };

  const handleLedgerNameChange = async (value, side) => {
    const ledger_id = Number.parseInt(value);
    const selectedLedger = ledgerList.find((l) => l.Ledger_id === ledger_id);

    if (side === "dr") {
      setDrLedger(ledger_id);
      if (selectedLedger) {
        setDrDropdown1(selectedLedger.Ledger_no);
        try {
          const res = await apiClient.get(
            `/api/CheckPersonalLedger?L_id=${selectedLedger.Ledger_id}`,
          );
          if (res.data && res.data.length > 0 && res.data[0].Is_personal === 1) {
            setIsDrCustomerEnabled(true);
          } else {
            setIsDrCustomerEnabled(false);
            setDrCustomerNo("");
            setDrCustomer("");
            setDrCustomerName("");
          }
        } catch (err) {
          console.log(err);
          setIsDrCustomerEnabled(false);
        }
      } else {
        setDrDropdown1("");
        setIsDrCustomerEnabled(false);
        setDrCustomerNo("");
        setDrCustomer("");
        setDrCustomerName("");
      }
    } else {
      setCrLedger(ledger_id);
      if (selectedLedger) {
        setCrDropdown1(selectedLedger.Ledger_no);
        try {
          const res = await apiClient.get(
            `/api/CheckPersonalLedger?L_id=${selectedLedger.Ledger_id}`,
          );
          if (res.data && res.data.length > 0 && res.data[0].Is_personal === 1) {
            setIsCrCustomerEnabled(true);
          } else {
            setIsCrCustomerEnabled(false);
            setCrCustomerNo("");
            setCrCustomer("");
            setCrCustomerName("");
          }
        } catch (err) {
          console.log(err);
          setIsCrCustomerEnabled(false);
        }
      } else {
        setCrDropdown1("");
        setIsCrCustomerEnabled(false);
        setCrCustomerNo("");
        setCrCustomer("");
        setCrCustomerName("");
      }
    }
  };

  const handleAdd = () => {
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newRows = [];

    if (voucherType === "journal") {
      // Credit side only
      if (!crLedger) return;
      newRows.push({
        voucherType: "journal",
        ledgerNo: crDropdown1 || ledgerList.find((l) => l.Ledger_id === crLedger)?.Ledger_no || "",
        ledger_id: crLedger,
        ledgerName: ledgerList.find((l) => l.Ledger_id === crLedger)?.Ledger_name || "",
        customer_id: crCustomer,
        customerName: crCustomerName,
        jama: amountNum,
        naave: 0,
        crdr: "A",
      });
    } else if (voucherType === "payment") {
      // Debit side only
      if (!drLedger) return;
      newRows.push({
        voucherType: "payment",
        ledgerNo: drDropdown1 || ledgerList.find((l) => l.Ledger_id === drLedger)?.Ledger_no || "",
        ledger_id: drLedger,
        ledgerName: ledgerList.find((l) => l.Ledger_id === drLedger)?.Ledger_name || "",
        customer_id: drCustomer,
        customerName: drCustomerName,
        jama: 0,
        naave: amountNum,
        crdr: "B",
      });
    } else if (voucherType === "contra") {
      // Both sides
      if (!drLedger || !crLedger) return;
      // Debit Row
      newRows.push({
        voucherType: "contra",
        ledgerNo: drDropdown1 || ledgerList.find((l) => l.Ledger_id === drLedger)?.Ledger_no || "",
        ledger_id: drLedger,
        ledgerName: ledgerList.find((l) => l.Ledger_id === drLedger)?.Ledger_name || "",
        customer_id: drCustomer,
        customerName: drCustomerName,
        jama: 0,
        naave: amountNum,
        crdr: "B",
      });
      // Credit Row
      newRows.push({
        voucherType: "contra",
        ledgerNo: crDropdown1 || ledgerList.find((l) => l.Ledger_id === crLedger)?.Ledger_no || "",
        ledger_id: crLedger,
        ledgerName: ledgerList.find((l) => l.Ledger_id === crLedger)?.Ledger_name || "",
        customer_id: crCustomer,
        customerName: crCustomerName,
        jama: amountNum,
        naave: 0,
        crdr: "A",
      });
    }

    setTableData((prev) => [...prev, ...newRows]);

    // Clear inputs
    setDrLedger("");
    setDrDropdown1("");
    setDrCustomerNo("");
    setDrCustomer("");
    setDrCustomerName("");
    setCrLedger("");
    setCrDropdown1("");
    setCrCustomerNo("");
    setCrCustomer("");
    setCrCustomerName("");
    setAmount("00.00");
  };
  const handleClear = () => {
    setTableData([]);
    setDrLedger("");
    setDrDropdown1("");
    setDrCustomerNo("");
    setDrCustomer("");
    setDrCustomerName("");
    setCrLedger("");
    setCrDropdown1("");
    setCrCustomerNo("");
    setCrCustomer("");
    setCrCustomerName("");
    setAmount("00.00");
    setEditIndex(null);
    setVoucherType("journal");
  };

  const handleSave = async () => {
    try {
      // login details from localStorage
      let transTypeId = 0;

      if (voucherType === "journal") transTypeId = 5;
      else if (voucherType === "contra") transTypeId = 6;
      else if (voucherType === "payment") transTypeId = 7;

      if (tableData.length == 0) {
        toast.error("Trans details are required");
        return;
      }

      if (editIndex != null) {
        // Trans object
        const transPayload = {
          Trans: {
            Trans_id: editIndex,
            Outlet_id: outlet_id, // outlet id
            Trans_date: loginDate,
            Year_id: year_id ? parseInt(year_id) : 0,
            Trans_amt: tableData.reduce(
              (sum, row) => sum + Number(row.jama || row.naave),
              0,
            ),
            Trans_type_id: transTypeId, // voucher type mapping
            Trans_code: "0",
            Modified_by: username,
          },
          Trans_Details: tableData.map((row) => {
            const isJama = row.jama && Number(row.jama) > 0;
            const amount = isJama ? row.jama : row.naave;

            return {
              CashTrans: voucherType === "contra" ? "T" : "C",

              L_id: row.ledger_id,
              Amount: Number(amount),
              CrDr_id: isJama ? 1 : 2,
              Cust_id: Number(row.customer_id),
              Narr: "",
              Cust_name: row.customerName || "",
            };
          }),
        };
        // PUT to backend
        await apiClient.put(`/api/Voucher`, transPayload);
        toast.success("Voucher updated successfully");
        handleClear();
        handleShowList();
        setShowTable(true);
        setEditIndex(null);
      } else {
        // Trans object
        const transPayload = {
          Trans: {
            Outlet_id: outlet_id, // outlet id
            Trans_date: loginDate,
            Year_id: year_id ? parseInt(year_id) : 0,
            Trans_amt: tableData.reduce(
              (sum, row) => sum + Number(row.jama || row.naave),
              0,
            ),
            Trans_type_id: transTypeId, // voucher type mapping
            Trans_code: "0",
            Created_by: username,
          },
          Trans_Details: tableData.map((row) => {
            const isJama = row.jama && Number(row.jama) > 0;
            const amount = isJama ? row.jama : row.naave;

            return {
              CashTrans: voucherType === "contra" ? "T" : "C",

              L_id: row.ledger_id,
              Amount: Number(amount),
              CrDr_id: isJama ? 1 : 2,
              Cust_id: Number(row.customer_id),
              Narr: "",
              Cust_name: row.customerName || "",
            };
          }),
        };

        // POST to backend
        await apiClient.post(`/api/Voucher`, transPayload);
        toast.success("Voucher created successfully");
        handleClear();
        handleShowList();
        setShowTable(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error occured while saving voucher");
    }
  };

  const handleEdit = async (Trans_id) => {
    try {
      setEditIndex(Trans_id);
      const result = await TransDetailsByTransId(Trans_id);

      if (result.status === 200) {
        const trans_details = result.data;

        const updatedRows = trans_details.map((element) => ({
          voucherType: element.TYPE_NAME,
          ledgerNo: element.Ledger_no,
          ledger_id: element.L_id,
          ledgerName: element.Ledger_name,
          customer_id: element.Cust_id,
          customerName: element.Cust_name,
          jama: element.CrDr_id === 1 ? element.Amount : "",
          naave: element.CrDr_id === 2 ? element.Amount : "",
          crdr: element.CrDr_id,
        }));

        // Replace existing data instead of appending
        setTableData(updatedRows);
        setShowTable(false);
        // ✅ Safe access
        if (trans_details[0]?.Trans_type_id === 5) {
          setVoucherType("journal");
        } else if (trans_details[0]?.Trans_type_id === 6) {
          setVoucherType("contra");
        } else if (trans_details[0]?.Trans_type_id === 7) {
          setVoucherType("payment");
        } else {
          setVoucherType("journal");
        }
      }
    } catch (error) {
      toast.error("Error occured while getting trans details");
    }
  };

  const handleDelete = async (trans) => {
    try {
      const delete_payload = {
        Trans_id: trans.Trans_id,
        Outlet_id: trans.Outlet_id,
        Trans_date: trans.Trans_date,
        Year_id: trans.Year_id,
        Trans_amt: trans.Trans_amt,
        Trans_type_id: trans.Trans_type_id,
        Modified_by: username,
      };
      const result = await deleteVoucher(delete_payload);
      if (result.status === 200) {
        toast.success("Voucher deleted successfully");
        handleShowList();
      }
    } catch (error) {
      toast.error("Error occured while deleting voucher");
    }
  };

  const handleRemoveRow = (index) => {
    setTableData(tableData.filter((_, i) => i !== index));
  };

  const filteredTransList = transList.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.Trans_no?.toString().toLowerCase().includes(term) ||
      item.Trans_amt?.toString().toLowerCase().includes(term) ||
      item.Type_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container mt-0">
      {!showTable ? (
        <div
          className="bg-white p-4 rounded shadow mx-auto"
          style={{ maxWidth: "800px" }}
        >
          {/* Header */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0">Voucher</h5>
          </div>

          {/* Radio Buttons */}
          <div className="mt-2 d-flex gap-3 justify-content-center">
            <label className="text-center">
              <input
                type="radio"
                name="voucherType"
                value="journal"
                checked={voucherType === "journal"}
                onChange={(e) => setVoucherType(e.target.value)}
                disabled={tableData.length > 0}
                style={{
                  cursor: tableData.length > 0 ? "not-allowed" : "pointer",
                }}
              />
              Journal Voucher
              <div style={{ fontSize: "13px", color: "#555" }}>जमा चलन</div>
            </label>

            <label className="text-center">
              <input
                type="radio"
                name="voucherType"
                value="contra"
                checked={voucherType === "contra"}
                onChange={(e) => setVoucherType(e.target.value)}
                disabled={tableData.length > 0}
                style={{
                  cursor: tableData.length > 0 ? "not-allowed" : "pointer",
                }}
              />
              Contra Voucher
              <div style={{ fontSize: "13px", color: "#555" }}>
                ट्रान्सफर चलन
              </div>
            </label>

            <label className="text-center">
              <input
                type="radio"
                name="voucherType"
                value="payment"
                checked={voucherType === "payment"}
                onChange={(e) => setVoucherType(e.target.value)}
                disabled={tableData.length > 0}
                style={{
                  cursor: tableData.length > 0 ? "not-allowed" : "pointer",
                }}
              />
              Pay Voucher
              <div style={{ fontSize: "13px", color: "#555" }}>नावे चलन</div>
            </label>
          </div>

          {/* Split Columns: Credit (Left) and Debit (Right) */}
          <div className="row mt-3 g-3">
            {/* Left Side: Credit (Jama) */}
            <div className="col-md-6">
              <div
                className={`p-3 rounded shadow-sm h-100 ${
                  voucherType === "payment" ? "bg-light text-muted" : "bg-white"
                }`}
                style={{
                  border: "1px solid #e0e0e0",
                  borderTop: "4px solid #28a745",
                  transition: "all 0.3s ease",
                  opacity: voucherType === "payment" ? 0.6 : 1,
                  pointerEvents: voucherType === "payment" ? "none" : "auto",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="mb-0 fw-bold text-success">Credit (Jama)</h6>
                  <span className="badge bg-success-soft text-success px-2 py-1" style={{ fontSize: "10px", backgroundColor: "#eaf7ed" }}>CREDIT SIDE</span>
                </div>

                <div className="row g-3">
                  <div className="col-4">
                    <label className="form-label mb-1 fw-semibold" style={{ fontSize: "12px" }}>
                      Ledger No
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-sm border-secondary-subtle"
                      value={crDropdown1}
                      onChange={(e) => handleLedgerNoChange(e.target.value, "cr")}
                      disabled={voucherType === "payment"}
                      placeholder="No"
                    />
                  </div>
                  <div className="col-8">
                    <label className="form-label mb-1 fw-semibold" style={{ fontSize: "12px" }}>
                      Ledger Name
                    </label>
                    <select
                      className="form-select form-select-sm border-secondary-subtle"
                      value={crLedger}
                      onChange={(e) => handleLedgerNameChange(e.target.value, "cr")}
                      disabled={voucherType === "payment"}
                    >
                      <option value="">Select Ledger</option>
                      {ledgerList.map((item) => (
                        <option key={item.Ledger_id} value={item.Ledger_id}>
                          {item.Ledger_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-4">
                    <label className="form-label mb-1 fw-semibold" style={{ fontSize: "12px" }}>
                      Cust No
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm border-secondary-subtle"
                      value={crCustomerNo}
                      onChange={(e) => handleCustomerNoChange(e, "cr")}
                      disabled={voucherType === "payment" || !isCrCustomerEnabled}
                      placeholder="Cust #"
                    />
                  </div>
                  <div className="col-8">
                    <label className="form-label mb-1 fw-semibold" style={{ fontSize: "12px" }}>
                      Customer Name
                    </label>
                    <select
                      className="form-select form-select-sm border-secondary-subtle"
                      value={crCustomer}
                      onChange={(e) => handleCustomerChange(e, "cr")}
                      disabled={voucherType === "payment" || !isCrCustomerEnabled}
                    >
                      <option value="">Select Customer</option>
                      {customerList.map((c) => (
                        <option key={c.Cust_id} value={c.Cust_id}>
                          {c.Cust_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Debit (Nave) */}
            <div className="col-md-6">
              <div
                className={`p-3 rounded shadow-sm h-100 ${
                  voucherType === "journal" ? "bg-light text-muted" : "bg-white"
                }`}
                style={{
                  border: "1px solid #e0e0e0",
                  borderTop: "4px solid #007bff",
                  transition: "all 0.3s ease",
                  opacity: voucherType === "journal" ? 0.6 : 1,
                  pointerEvents: voucherType === "journal" ? "none" : "auto",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="mb-0 fw-bold text-primary">Debit (Nave)</h6>
                  <span className="badge bg-primary-soft text-primary px-2 py-1" style={{ fontSize: "10px", backgroundColor: "#e7f1ff" }}>DEBIT SIDE</span>
                </div>

                <div className="row g-3">
                  <div className="col-4">
                    <label className="form-label mb-1 fw-semibold" style={{ fontSize: "12px" }}>
                      Ledger No
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-sm border-secondary-subtle"
                      value={drDropdown1}
                      onChange={(e) => handleLedgerNoChange(e.target.value, "dr")}
                      disabled={voucherType === "journal"}
                      placeholder="No"
                    />
                  </div>
                  <div className="col-8">
                    <label className="form-label mb-1 fw-semibold" style={{ fontSize: "12px" }}>
                      Ledger Name
                    </label>
                    <select
                      className="form-select form-select-sm border-secondary-subtle"
                      value={drLedger}
                      onChange={(e) => handleLedgerNameChange(e.target.value, "dr")}
                      disabled={voucherType === "journal"}
                    >
                      <option value="">Select Ledger</option>
                      {ledgerList.map((item) => (
                        <option key={item.Ledger_id} value={item.Ledger_id}>
                          {item.Ledger_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-4">
                    <label className="form-label mb-1 fw-semibold" style={{ fontSize: "12px" }}>
                      Cust No
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm border-secondary-subtle"
                      value={drCustomerNo}
                      onChange={(e) => handleCustomerNoChange(e, "dr")}
                      disabled={voucherType === "journal" || !isDrCustomerEnabled}
                      placeholder="Cust #"
                    />
                  </div>
                  <div className="col-8">
                    <label className="form-label mb-1 fw-semibold" style={{ fontSize: "12px" }}>
                      Customer Name
                    </label>
                    <select
                      className="form-select form-select-sm border-secondary-subtle"
                      value={drCustomer}
                      onChange={(e) => handleCustomerChange(e, "dr")}
                      disabled={voucherType === "journal" || !isDrCustomerEnabled}
                    >
                      <option value="">Select Customer</option>
                      {customerList.map((c) => (
                        <option key={c.Cust_id} value={c.Cust_id}>
                          {c.Cust_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount + Add Button */}
          <div className="row mt-4 justify-content-center align-items-end">
            <div className="col-md-4">
              <div className="form-group">
                <label className="form-label mb-1 fw-bold text-dark" style={{ fontSize: "14px" }}>
                  Transaction Amount
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-secondary-subtle">₹</span>
                  <input
                    type="number"
                    className="form-control fw-bold border-secondary-subtle"
                    style={{ height: "38px" }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onFocus={handleAmountFocus}
                    onBlur={handleAmountBlur}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-dark w-100 shadow-sm fw-bold"
                style={{ height: "38px", fontSize: "14px" }}
                onClick={handleAdd}
              >
                ADD ENTRY
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive mt-2">
            <table
              className="table table-bordered text-center"
              style={{ fontSize: "14px" }}
            >
              <thead className="table-light">
                <tr>
                  <th>Delete</th>
                  <th>Voucher Type</th>
                  <th>Ledger No</th>
                  <th>Ledger Name</th>
                  <th>Credit</th>
                  <th>Debit</th>
                  {/* <th>Customer no</th> */}
                  <th>Customer name</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="8">No records added</td>
                  </tr>
                ) : (
                  tableData.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveRow(index)}
                        >
                          Delete
                        </button>
                      </td>
                      <td>{row.voucherType}</td>
                      <td>{row.ledgerNo}</td>
                      <td>{row.ledgerName}</td>
                      <td>
                        {row.jama ? Number(row.jama).toFixed(2) : "00.00"}
                      </td>
                      <td>
                        {row.naave ? Number(row.naave).toFixed(2) : "00.00"}
                      </td>
                      {/* <td>{row.customerNo}</td> */}
                      <td>{row.customerName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Totals outside table */}
          <div className="row mt-2">
            <div
              className="col-md-4 d-flex align-items-center gap-2"
              style={{ fontSize: "14px", whiteSpace: "nowrap" }}
            >
              <label style={{ fontWeight: "normal" }}>Total Credit:</label>
              <input
                type="text"
                className="form-control form-control-sm fw-bold"
                value={finalJama === 0 ? "00.00" : finalJama.toFixed(2)}
                readOnly
              />
            </div>
            <div
              className="col-md-4 d-flex align-items-center gap-2"
              style={{ fontSize: "14px", whiteSpace: "nowrap" }}
            >
              <label style={{ fontWeight: "normal" }}>Total Debit:</label>
              <input
                type="text"
                className="form-control form-control-sm fw-bold"
                value={finalNaave === 0 ? "00.00" : finalNaave.toFixed(2)}
                readOnly
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="text-center mt-4 d-flex justify-content-center gap-2">
            <button
              type="button"
              className="button-save"
              style={{ fontSize: "14px" }}
              onClick={handleSave}
            >
              {editIndex != null ? "Update" : "Save"}
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
              onClick={handleShowList}
              style={{ fontSize: "14px" }}
            >
              Show List
            </button>
          </div>
        </div>
      ) :
        <div style={{ paddingTop: "5px" }}>
          {/* Header */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Voucher</h5>
          </div>

          {/* 👇 Padding below search + close */}
          <div style={{ marginTop: "10px" }}>
            <CommonTable
              columns={columns}
              data={filteredTransList}
              onEdit={(row) =>
                handleEdit(row.Trans_id)
              }
              onDelete={(row) =>
                handleDelete(row)
              }
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              onClose={() => {
                setShowTable(false);
                handleClear();
                setSearchTerm("");
              }}
            />
          </div>
        </div>}
    </div>
  );
}

export default VoucherForm;