import React, { useState, useEffect } from "react";
import {
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
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loginImageUrl, setLoginImageUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
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
          const formattedloginDate = loginDate.split("T")[0];
          setDate(formattedloginDate); // No toISOString() needed
          console.log("System date from admin:", formattedloginDate);
          localStorage.setItem("loginDate", formattedloginDate);
          setSystemUserloginData((prev) => ({ ...prev, date: formattedloginDate }));
        }
      }
    } catch (error) {
      // If it's a 404, it just means no date has been selected by admin yet
      if (error.response && error.response.status === 404) {
        console.warn("No system date selected by admin yet. Using current date as fallback.");
      } else {
        console.error(
          "Error while getting selected system date by admin:",
          error,
        );
      }
      
      // Fallback to current date if API fails or no date found
      const fallbackDate = new Date().toISOString().split("T")[0];
      setDate(fallbackDate);
      localStorage.setItem("loginDate", fallbackDate);
      setSystemUserloginData((prev) => ({ ...prev, date: fallbackDate }));
    }
  };

  const isAdminAndMainBranch = role === "Admin";

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


  const handleLogin = async (e) => {
    e.preventDefault();

    if (!selectedYear) {
      toast.error("Please select a financial year");
      return;
    }

    try {
      // If Admin, call verifySystemUser first
      if (role === "Admin") {
        if (!systemUserloginData.date) {
          toast.error("Please select a date");
          return;
        }

        const verifyResult = await verifySystemUser({
          ...systemUserloginData,
          username: userloginData.username,
          password: userloginData.password,
        });

        if (verifyResult.status !== 200) {
          toast.error("System user verification failed");
          return;
        }

        // Update the login date in local storage and state if verify succeeds
        const newLoginDate = verifyResult.data.data.split("T")[0];
        setDate(newLoginDate);
        localStorage.setItem("loginDate", newLoginDate);
      }

      // Proceed with normal login
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
        const outletId = userData.Outlet_id;
        const outletName = userData.Outlet_name;

        localStorage.setItem("username", username);
        localStorage.setItem("Role_id", roleId);
        localStorage.setItem("Emp_id", empId);
        localStorage.setItem("User_id", userId);
        localStorage.setItem("Outlet_id", outletId);
        localStorage.setItem("branch", outletName || "");
        localStorage.setItem("Year_Id", selectedYear.toString());

        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response?.data?.message || "Invalid credentials");
      } else {
        toast.error("Something went wrong");
        console.error(error);
      }
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

              {/* Date Selection */}
              <div className="mb-2">
                {role === "Admin" ? (
                  <>
                    <label className="form-label fw-medium small">Select Date</label>
                    <input
                      id="date"
                      type="date"
                      value={systemUserloginData.date}
                      onChange={handleSystemUserChange}
                      required
                      className="form-control form-control-sm"
                      style={{ width: "270px" }}
                    />
                  </>
                ) : (
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label fw-medium small mb-0">
                      Date - {new Date(date).toLocaleDateString("en-GB")}
                    </label>
                  </div>
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

      </div>
    </div>
  );
}

export default Login;
