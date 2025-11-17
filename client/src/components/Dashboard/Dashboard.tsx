import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  TextField,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Skeleton,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import { analyticsApi } from "../../services/analyticsApi";
import type { AnalyticsSummary, CategoryAnalytics, MonthlyAnalytics } from "../../services/analyticsApi";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon from "@mui/icons-material/Email";

interface DashboardProps {
  trackerId?: string;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC<DashboardProps> = ({ trackerId }) => {
  const [filter, setFilter] = useState("thisMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [summary, setSummary] = useState<AnalyticsSummary>({ total: 0, average: 0, count: 0 });
  const [categoryData, setCategoryData] = useState<CategoryAnalytics[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    loadData();

    // Listen for expense updates from other components
    const handleExpenseUpdate = () => {
      loadData();
    };

    window.addEventListener("expenseUpdated", handleExpenseUpdate);
    return () => {
      window.removeEventListener("expenseUpdated", handleExpenseUpdate);
    };
  }, [filter, customStartDate, customEndDate, selectedYear, trackerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, categoryRes, monthlyRes] = await Promise.all([
        analyticsApi.getSummary(filter, customStartDate, customEndDate, undefined, trackerId),
        analyticsApi.getByCategory(filter, customStartDate, customEndDate, trackerId),
        analyticsApi.getByMonth(selectedYear, trackerId),
      ]);

      setSummary(summaryRes.stats);
      setCategoryData(categoryRes.data);
      setMonthlyData(monthlyRes.data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    if (newFilter !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        filter,
        ...(customStartDate && { startDate: customStartDate }),
        ...(customEndDate && { endDate: customEndDate }),
        ...(trackerId && { trackerId }),
      });

      const response = await fetch(`http://localhost:5000/api/reports/download?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to download report' }));
        throw new Error(errorData.message || 'Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${filter}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert((error as Error).message || 'Failed to download report');
    }
  };

  const handleEmailReport = async () => {
    try {
      setEmailLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/reports/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filter,
          ...(customStartDate && { startDate: customStartDate }),
          ...(customEndDate && { endDate: customEndDate }),
          ...(trackerId && { trackerId }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      alert(data.message || 'Report sent successfully to your email');
    } catch (error) {
      console.error('Error sending email report:', error);
      alert((error as Error).message || 'Failed to send email report');
    } finally {
      setEmailLoading(false);
    }
  };

  const categoryChartData = {
    labels: categoryData.map((item) => item.category),
    datasets: [
      {
        label: "Total Expenses",
        data: categoryData.map((item) => item.total),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(199, 199, 199, 0.6)",
          "rgba(83, 102, 255, 0.6)",
          "rgba(255, 99, 255, 0.6)",
          "rgba(99, 255, 132, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(199, 199, 199, 1)",
          "rgba(83, 102, 255, 1)",
          "rgba(255, 99, 255, 1)",
          "rgba(99, 255, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const monthlyChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: `Expenses ${selectedYear}`,
        data: monthlyData.map((item) => item.total),
        borderColor: "rgba(102, 126, 234, 1)",
        backgroundColor: "rgba(102, 126, 234, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const categoryBarData = {
    labels: categoryData.map((item) => item.category),
    datasets: [
      {
        label: "Total Expenses",
        data: categoryData.map((item) => item.total),
        backgroundColor: "rgba(102, 126, 234, 0.6)",
        borderColor: "rgba(102, 126, 234, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <ButtonGroup variant="outlined" size="small">
              {["today", "yesterday", "last7days", "lastMonth", "thisMonth", "indiaFY", "thisYear", "custom"].map(
                (filterOption) => (
                  <Button
                    key={filterOption}
                    variant={filter === filterOption ? "contained" : "outlined"}
                    onClick={() => handleFilterChange(filterOption)}
                  >
                    {filterOption === "last7days"
                      ? "Last 7 Days"
                      : filterOption === "lastMonth"
                      ? "Last Month"
                      : filterOption === "thisMonth"
                      ? "This Month"
                      : filterOption === "indiaFY"
                      ? "India FY"
                      : filterOption === "thisYear"
                      ? "This Year"
                      : filterOption}
                  </Button>
                )
              )}
            </ButtonGroup>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadReport}
              size="small"
              sx={{ textTransform: "none" }}
            >
              Download Report
            </Button>
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={handleEmailReport}
              disabled={emailLoading}
              size="small"
              sx={{ textTransform: "none" }}
            >
              {emailLoading ? "Sending..." : "Email Report"}
            </Button>
          </Box>
        </Box>

        {filter === "custom" && (
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <TextField
              type="date"
              label="Start Date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              type="date"
              label="End Date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Box>
        )}
      </Paper>

      {loading ? (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3, mb: 3 }}>
            {[1, 2, 3].map((i) => (
              <Card key={i} elevation={3}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" height={50} />
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 3, mb: 3 }}>
            {[1, 2].map((i) => (
              <Paper key={i} elevation={3} sx={{ p: 3 }}>
                <Skeleton variant="text" width="40%" height={30} />
                <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
              </Paper>
            ))}
          </Box>

          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Skeleton variant="text" width="30%" height={30} />
            <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
          </Paper>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Skeleton variant="text" width="30%" height={30} sx={{ mb: 2 }} />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 2 }} />
            ))}
          </Paper>
        </>
      ) : (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3, mb: 3 }}>
            <Card 
              elevation={4} 
              sx={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.1)",
                }
              }}
            >
              <CardContent sx={{ position: "relative", zIndex: 1 }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontSize: "0.85rem", fontWeight: 500 }}>
                  Total Expenses
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  ₹{summary.total.toLocaleString("en-IN")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.9 }}>
                  <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                    Overall Score
                  </Typography>
                  <Chip 
                    label="8/10" 
                    size="small" 
                    sx={{ 
                      height: 18, 
                      fontSize: "0.7rem",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontWeight: 600
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>

            <Card 
              elevation={4} 
              sx={{ 
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  bottom: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: "20%",
                  background: "rgba(255, 255, 255, 0.1)",
                  transform: "rotate(45deg)"
                }
              }}
            >
              <CardContent sx={{ position: "relative", zIndex: 1 }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontSize: "0.85rem", fontWeight: 500 }}>
                  Average Expense
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  ₹{Math.round(summary.average).toLocaleString("en-IN")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.9 }}>
                  <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                    Ranking
                  </Typography>
                  <Chip 
                    label="25" 
                    size="small" 
                    sx={{ 
                      height: 18, 
                      fontSize: "0.7rem",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontWeight: 600
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>

            <Card 
              elevation={4} 
              sx={{ 
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: -40,
                  left: -40,
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.1)",
                }
              }}
            >
              <CardContent sx={{ position: "relative", zIndex: 1 }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontSize: "0.85rem", fontWeight: 500 }}>
                  Total Transactions
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {summary.count}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.9 }}>
                  <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                    Incentives worth
                  </Typography>
                  <Chip 
                    label="$15" 
                    size="small" 
                    sx={{ 
                      height: 18, 
                      fontSize: "0.7rem",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontWeight: 600
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 3, mb: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Expenses by Category
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={categoryBarData} options={chartOptions} />
              </Box>
            </Paper>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Category Distribution
              </Typography>
              <Box sx={{ height: 300, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Pie data={categoryChartData} options={chartOptions} />
              </Box>
            </Paper>
          </Box>

          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">Monthly Expenses Trend</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ height: 300 }}>
              <Line data={monthlyChartData} options={chartOptions} />
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Category Breakdown
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {categoryData.map((item, index) => (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Box>
                      <Typography variant="body1" fontWeight="600">
                        {item.category}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.count} transactions
                      </Typography>
                    </Box>
                    <Chip
                      label={`₹${item.total.toLocaleString("en-IN")}`}
                      color="primary"
                      sx={{ fontWeight: "bold", fontSize: "1rem" }}
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
