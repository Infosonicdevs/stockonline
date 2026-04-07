import React from "react";

const Dashboard = () => {
  return (
    <div className="shadow-none mt-0 container-fluid vh-100 overflow-hidden d-flex flex-column">
      {/* Page Title */}
       {/* Header */}
        <div
          className="text-white rounded mb-3 p-3"
          style={{
             backgroundColor: "#365b80",
          }}
        >
          <div className="row align-items-center text-center">
            <div className="col-12">
              <h5 className="mb-0 fw-semibold">Home</h5>
            </div>
          </div>
        </div>

      {/* Top Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Total Customers</h5>
              <h3 className="text-success">1,245</h3>
              <small className="text-muted">Since last month</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Active Sales</h5>
              <h3 className="text-primary">312</h3>
              <small className="text-muted">Ongoing</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Revenue</h5>
              <h3 className="text-warning">$58,430</h3>
              <small className="text-muted">This month</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Pending Orders</h5>
              <h3 className="text-danger">27</h3>
              <small className="text-muted">To be shipped</small>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Sales Progress</h5>
              <div className="progress mt-2">
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: "70%" }}
                  aria-valuenow="70"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  70%
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Customer Growth</h5>
              <div className="progress mt-2">
                <div
                  className="progress-bar bg-secondary"
                  role="progressbar"
                  style={{ width: "55%" }}
                  aria-valuenow="55"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  55%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

