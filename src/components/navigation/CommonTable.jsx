import React from "react";

function CommonTable({
  columns = [],
  data = [],
  onEdit,
  onDelete,
  showActions = true,
  searchValue = "",
  onSearchChange,
  onClose,
}) {
  return (
    <div>
      {/*  Top Bar */}
      <div className="d-flex justify-content-between align-items-center mb-2">

        <div className="d-flex align-items-center gap-2">
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ width: "250px" }}
            value={searchValue}
            placeholder="Search..."
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <i className="bi bi-search"></i>
        </div>

        {/* Close Button */}
        <button
          className="btn btn-sm btn-secondary"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {/*  Table */}
      <div
        className="table-responsive"
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
            <tr >
              {showActions && <th className="table-column-bg-heading">Actions</th>}
              {columns.map((col, index) => (
                <th className="table-column-bg-heading" key={index}>{col.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showActions ? 1 : 0)}>
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {showActions && (
                    <td>
                      {onEdit && (
                        <button
                          type="button"
                          className="btn btn-info btn-sm me-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row, rowIndex);
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(row, rowIndex);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}

                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={col.className || ""}>
                      {col.render
                        ? col.render(row[col.accessor], row, rowIndex)
                        : row[col.accessor]}
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