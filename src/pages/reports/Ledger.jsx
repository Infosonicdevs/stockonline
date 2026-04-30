import React, { useState } from "react";
import CommonTable from "../../components/navigation/CommonTable";

function LedgerReport() {
  const [searchTerm, setSearchTerm] = useState("");

  // Placeholder data for Ledger Report
  const [entries] = useState([
    { id: 1, accountName: "Cash Account", debit: 5000, credit: 0, balance: 5000 },
    { id: 2, accountName: "Office Expenses", debit: 0, credit: 1500, balance: -1500 },
  ]);

  const columns = [
    {
      label: "Sr. No",
      render: (val, row, index) => index + 1,
    },
    {
      label: "Account Name",
      render: (val, row) => row.accountName,
    },
    {
      label: "Debit",
      render: (val, row) => `₹${Number(row.debit).toFixed(2)}`,
    },
    {
      label: "Credit",
      render: (val, row) => `₹${Number(row.credit).toFixed(2)}`,
    },
    {
      label: "Balance",
      render: (val, row) => `₹${Number(row.balance).toFixed(2)}`,
    },
  ];

  const filteredEntries = entries.filter((e) => {
    const search = searchTerm.toLowerCase();
    const values = [e.accountName, e.debit, e.credit, e.balance];
    return values.some((val) => val?.toString().toLowerCase().includes(search));
  });

  return (
    <div className="container my-2">
      <div className="bg-white p-4 rounded shadow mx-auto" style={{ maxWidth: "100%" }}>
        <div
          className="text-white rounded mb-3 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Ledger Report</h5>
        </div>

        <div style={{ paddingTop: "5px" }}>
          <CommonTable
            columns={columns}
            data={filteredEntries}
            onEdit={null}
            onDelete={null}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onClose={null}
          />
        </div>
      </div>
    </div>
  );
}

export default LedgerReport;
