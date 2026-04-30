import React, { useState } from "react";
import CommonTable from "../../components/navigation/CommonTable";

function Stockbook() {
  const [searchTerm, setSearchTerm] = useState("");

  // Placeholder data for Stockbook
  const [entries] = useState([
    { id: 1, itemCode: "I-101", itemName: "Item A", openingQty: 100, purchaseQty: 50, salesQty: 30, closingQty: 120 },
    { id: 2, itemCode: "I-102", itemName: "Item B", openingQty: 200, purchaseQty: 20, salesQty: 50, closingQty: 170 },
  ]);

  const columns = [
    {
      label: "Sr. No",
      render: (val, row, index) => index + 1,
    },
    {
      label: "Item Code",
      render: (val, row) => row.itemCode,
    },
    {
      label: "Item Name",
      render: (val, row) => row.itemName,
    },
    {
      label: "Opening Qty",
      render: (val, row) => row.openingQty,
    },
    {
      label: "Purchase Qty",
      render: (val, row) => row.purchaseQty,
    },
    {
      label: "Sales Qty",
      render: (val, row) => row.salesQty,
    },
    {
      label: "Closing Qty",
      render: (val, row) => row.closingQty,
    },
  ];

  const filteredEntries = entries.filter((e) => {
    const search = searchTerm.toLowerCase();
    const values = [e.itemCode, e.itemName, e.openingQty, e.purchaseQty, e.salesQty, e.closingQty];
    return values.some((val) => val?.toString().toLowerCase().includes(search));
  });

  return (
    <div className="container my-2">
      <div className="bg-white p-4 rounded shadow mx-auto" style={{ maxWidth: "100%" }}>
        <div
          className="text-white rounded mb-3 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Stockbook Report</h5>
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

export default Stockbook;
