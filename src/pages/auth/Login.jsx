import React, { useState, useEffect } from "react";
import {
  getBranches,
  getCurrentFinancialYear,
  getFinancialYears,
  getLatestSystemDateSelectedByAdmin,
  getSociety,
  getUserRole,
  loginUser,
  verifySystemUser,
} from "../../services/auth.service";
import { BASE_URL } from "../../api/client";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Login() {
  const [role, setRole] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [userloginData, setUserLoginData] = useState({
    username: "",
    password: "",
  });
  const [systemUserloginData, setSystemUserloginData] = useState({
    empId: 0,
    username: "",
    password: "",
    date: "",
  });
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loginImageUrl, setLoginImageUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          loadBranches(),
          loadFinancialYears(),
          getAdminSelectedDate(),
          handleGetLogoImage(),
        ]);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const loadFinancialYears = async () => {
    try {
      const response = await getFinancialYears();
      if (response.status === 200 && response.data) {
        // Handle both direct array and { data: [...] } structure
        const yearsData = response.data.data || response.data;

        // Map data to include a readable label if Full_year is missing
        const formattedYears = yearsData.map((y) => ({
          ...y,
          Full_year:
            y.Full_year ||
            `${new Date(y.Start_date).getFullYear()}-${new Date(
              y.End_date,
            ).getFullYear()}`,
        }));

        setFinancialYears(formattedYears);
        // Auto-select latest year and store in localStorage
        if (formattedYears.length > 0) {
          const latestYear = formattedYears[0];
          setSelectedYear(latestYear.Year_id);
          localStorage.setItem("Year_Id", latestYear.Year_id.toString());
        }
      }
    } catch (error) {
      console.error("Error loading financial years:", error);
    }
  };

  const handleGetLogoImage = async () => {
    try {
      const result = await getSociety();
      console.log(result.data);
      if (
        result.status === 200 &&
        result.data &&
        result.data.length > 0 &&
        result.data[0].Is_logo === "1"
      ) {
        const imagePath = showLogoImage(result.data[0].Logo);
        setLoginImageUrl(`${imagePath}?t=${new Date().getTime()}`);
      }
    } catch (error) {
      console.error("Error fetching logo image:", error);
    }
  };

  const getAdminSelectedDate = async () => {
    try {
      const response = await getLatestSystemDateSelectedByAdmin();

      if (response.status === 200 && response.data.success) {
        const loginDate = response.data.data[0]?.Login_date;

        if (loginDate) {
          setDate(loginDate.split("T")[0]); // No toISOString() needed
          const formattedloginDate = loginDate.split("T")[0];
          console.log(formattedloginDate);
          localStorage.setItem("loginDate", formattedloginDate);
        }
      }
    } catch (error) {
      console.error(
        "Error while getting selected system date by admin:",
        error,
      );
      // Fallback to current date if API fails
      const fallbackDate = new Date().toISOString().split("T")[0];
      setDate(fallbackDate);
      localStorage.setItem("loginDate", fallbackDate);
    }
  };

  const selectedBranchData = branches.find(
    (branch) => branch.Outlet_id === selectedBranch,
  );

  const isAdminAndMainBranch =
    role === "Admin" && selectedBranchData?.Is_main_branch === 1;

  const checkUserRole = async () => {
    const { username, password } = userloginData;
    if (!username || !password) {
      setRole("");
      return;
    }
    try {
      const response = await getUserRole({ username, password });

      // Make sure response.data and response.data.data exist
      if (
        response.status === 200 &&
        response?.data.data &&
        response.data.data.length > 0
      ) {
        const role = response.data.data[0].Role;
        const emp_id = response.data.data[0].Emp_id;
        console.log("Role:", role);
        console.log("Emp Id:", emp_id);
        setRole(role);
        setSystemUserloginData({ ...systemUserloginData, empId: emp_id });
      } else {
        setRole(""); // clear role if no data
        console.log("No user data returned from API");
      }
    } catch (error) {
      console.error("Error checking role:", error);
      setRole(""); // clear role if no data
    }
  };

  const openAdminModal = () => setShowAdminModal(true);
  const closeAdminModal = () => setShowAdminModal(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }

    if (!selectedYear) {
      toast.error("Please select a financial year");
      return;
    }

    try {
      const result = await loginUser(userloginData);

      if (result.status === 200) {
        const userData = result?.data?.data?.[0];

        if (!userData) {
          toast.error("Invalid server response");
          return;
        }

        const username = userData.User_name;
        const roleId = userData.Role_id;
        const empId = userData.Emp_id;
        const userId = userData.User_id;

        localStorage.setItem("username", username);
        localStorage.setItem("Role_id", roleId);
        localStorage.setItem("Emp_id", empId);
        localStorage.setItem("User_id", userId);
        localStorage.setItem("Outlet_id", selectedBranch);
        localStorage.setItem("branch", selectedBranchData?.Outlet_name || "");
        localStorage.setItem("Year_Id", selectedYear.toString());

        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error("Invalid credentials");
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const loadBranches = async () => {
    try {
      const result = await getBranches();
      console.log(result);
      if (result.status === 200) {
        setBranches(result.data.data);
      } else {
        toast.error("Branches not found");
      }
    } catch (error) {
      toast.error("loadBranches failed due to server error");
      console.error(error);
    }
  };

  const verifySystemUserLogin = async () => {
    try {
      const result = await verifySystemUser(systemUserloginData);
      console.log(result);
      if (result.status === 200) {
        setDate(result.data.data);
        const loginDate = result.data.data.split("T")[0];
        localStorage.setItem("loginDate", loginDate);
        closeAdminModal();
      }
    } catch (error) {
      toast.error("Invalid credentials");
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setUserLoginData({ ...userloginData, [id]: value });
    if (id === "password") {
      setRole(""); // remove displayed role/icon
    }
  };

  const handleSystemUserChange = (e) => {
    const { id, value } = e.target;
    setSystemUserloginData({ ...systemUserloginData, [id]: value });
  };

  const showLogoImage = (image) => {
    const apiBase = BASE_URL;
    const baseUrl = `${apiBase}/Content/Upload/Logo/`;
    if (image) {
      return `${baseUrl}${image}`;
    }
    return "";
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div
        className="rounded shadow p-4 w-100"
        style={{
          maxWidth: "800px",
          backgroundColor: "#365b80",
          border: "2px solid #ffb347",
        }}
      >
        {/* Heading */}
        <h2
          className="d-flex align-items-center justify-content-center gap-3 fw-bold text-uppercase mb-4"
          style={{
            fontSize: "2rem",
            background: "linear-gradient(90deg, #ffa07a, #ffb347)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "2px",
            textShadow: "0 3px 10px rgba(0,0,0,0.4)",
          }}
        >
          <img
            src="images/market.png"
            alt="Shop Logo"
            style={{
              width: "42px",
              height: "42px",
              objectFit: "contain",
              filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))",
            }}
          />
          Royal Shop
        </h2>

        {/* Content Section */}
        <div
          className="row g-0 rounded overflow-hidden shadow"
          style={{ backgroundColor: "#fff" }}
        >
          {/* Image Section */}
          <div className="col-md-6 d-flex justify-content-center align-items-center p-3 bg-white">
            <img
              src={loginImageUrl || "images/login_logo.ico"}
              alt="Royal Shop Logo"
              className="img-fluid"
              style={{ maxHeight: "400px", objectFit: "contain" }}
              onError={(e) => {
                e.target.onerror = null; // prevent infinite loop
                e.target.src = "images/login_logo.ico"; // default fallback
              }}
            />
          </div>

          {/* Form Section */}
          <div className="col-md-6 d-flex justify-content-center align-items-center p-3">
            <form
              style={{ width: "100%", maxWidth: "300px" }}
              onSubmit={handleLogin}
            >
              <h4 className="text-center mb-3" style={{ color: "teal" }}>
                Login
              </h4>

              {/* Branch */}
              <div className="mb-2">
                <label className="form-label fw-medium small">
                  Select Branch
                </label>
                <select
                  id="branch"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(Number(e.target.value))}
                  required
                  className="form-select form-select-sm"
                  style={{ width: "270px" }}
                >
                  <option value="">-- Choose a branch --</option>
                  {branches.map((branch) => (
                    <option key={branch.Outlet_id} value={branch.Outlet_id}>
                      {branch.Outlet_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Username */}
              <div className="mb-2">
                <label className="form-label fw-medium small">Username</label>
                <input
                  id="username"
                  value={userloginData.username}
                  type="text"
                  placeholder="Enter your username"
                  onChange={handleChange}
                  required
                  className="form-control form-control-sm"
                  style={{ width: "270px" }}
                />
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="form-label fw-medium small">Password</label>
                <input
                  id="password"
                  value={userloginData.password}
                  type="password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  onBlur={checkUserRole}
                  required
                  className="form-control form-control-sm"
                  style={{ width: "270px" }}
                />
              </div>

              {/* Date + Admin Icon in One Line */}
              <div className="mb-2 d-flex align-items-center gap-2">
                {/* Date Label */}
                <label className="form-label fw-medium small mb-0">
                  Date - {new Date(date).toLocaleDateString("en-GB")}
                </label>

                {/* Calendar / Admin Icon */}
                {isAdminAndMainBranch && (
                  <i
                    className="bi bi-calendar3 text-secondary fs-5"
                    onClick={openAdminModal}
                    style={{ cursor: "pointer" }}
                    title="Admin Panel"
                  ></i>
                )}
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button type="submit" className="login_button">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Admin Modal */}
        {showAdminModal && (
          <div
            className="modal d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content p-2">
                <h5 className="text-center mb-2 fw-semibold">Admin Login</h5>

                <div className="mb-2">
                  <label
                    className="form-label"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    value={systemUserloginData.username}
                    onChange={handleSystemUserChange}
                    type="text"
                    placeholder="Username"
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="mb-2">
                  <label
                    className="form-label"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Password
                  </label>
                  <input
                    value={systemUserloginData.password}
                    id="password"
                    onChange={handleSystemUserChange}
                    type="password"
                    placeholder="Password"
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="mb-2">
                  <label
                    className="form-label"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={systemUserloginData.date}
                    onChange={handleSystemUserChange}
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <button
                    onClick={closeAdminModal}
                    className="btn btn-sm btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={verifySystemUserLogin}
                    className="btn btn-sm btn-success"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
