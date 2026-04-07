import React from "react";

function CommonTable({
  title = "Table",
  columns = [],
  data = [],
  onEdit,
  onDelete,
  onClose,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
}) {
  return (
    <div
      className="bg-white p-3 rounded shadow mx-auto"
      style={{ maxWidth: "1000px" }}
    >
      {/* Header */}
      <div
        className="text-white rounded mb-3 p-2 text-center fw-semibold"
        style={{ backgroundColor: "#365b80" }}
      >
        {title}
      </div>

      {/* Top Controls */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <button className="btn btn-sm btn-secondary" onClick={onClose}>
          Close
        </button>

        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="form-control"
            style={{ width: "250px", height: "28px" }}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="table-responsive"
        style={{ maxHeight: "60vh", overflow: "auto" }}
      >
        <table
          className="table table-bordered table-striped table-sm text-center"
          style={{ whiteSpace: "nowrap", minWidth: "100%" }}
        >
          <thead className="table-light" style={{ fontSize: "13px" }}>
            <tr>
              <th>Actions</th>
              {columns.map((col, i) => (
                <th key={i}>{col.header}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>No records found</td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index}>
                  <td>
                    <button
                      className="btn btn-info btn-sm me-1"
                      onClick={() => onEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(row)}
                    >
                      Delete
                    </button>
                  </td>

                  {columns.map((col, i) => (
                    <td key={i}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CommonTable;