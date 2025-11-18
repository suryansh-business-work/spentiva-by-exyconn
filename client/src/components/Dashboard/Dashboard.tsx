import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
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

      const response = await fetch(`http://localhost:8002/api/reports/download?${params}`, {
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

      const response = await fetch('http://localhost:8002/api/reports/email', {
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, sm: 3 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, mb: 2, gap: 2 }}>
          <Box sx={{ 
            display: "flex", 
            flexWrap: "nowrap", 
            gap: 1,
            width: { xs: "100%", md: "auto" },
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": {
              height: "6px"
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "3px"
            }
          }}>
            {["today", "yesterday", "last7days", "lastMonth", "thisMonth", "indiaFY", "thisYear", "custom"].map(
              (filterOption) => (
                <Button
                  key={filterOption}
                  variant={filter === filterOption ? "contained" : "outlined"}
                  onClick={() => handleFilterChange(filterOption)}
                  size="small"
                  sx={{ 
                    textTransform: "none",
                    fontSize: { xs: "0.75em", sm: "0.875em" },
                    px: { xs: 1, sm: 1.5 },
                    minWidth: "auto",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
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
                    : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </Button>
              )
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", md: "auto" } }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon sx={{ display: { xs: "none", sm: "block" } }} />}
              onClick={handleDownloadReport}
              size="small"
              fullWidth
              sx={{ 
                textTransform: "none",
                fontSize: { xs: "0.8em", sm: "0.875em" },
                flex: 1,
                whiteSpace: "nowrap"
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Download Report</Box>
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>Download</Box>
            </Button>
            <Button
              variant="contained"
              startIcon={<EmailIcon sx={{ display: { xs: "none", sm: "block" } }} />}
              onClick={handleEmailReport}
              disabled={emailLoading}
              size="small"
              fullWidth
              sx={{ 
                textTransform: "none",
                fontSize: { xs: "0.8em", sm: "0.875em" },
                flex: 1,
                whiteSpace: "nowrap"
              }}
            >
              {emailLoading ? "Sending..." : (
                <>
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Email Report</Box>
                  <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>Email</Box>
                </>
              )}
            </Button>
          </Box>
        </Box>

        {filter === "custom" && (
          <Box sx={{ 
            display: "flex", 
            flexDirection: { xs: "column", sm: "row" },
            gap: 2, 
            mt: 2 
          }}>
            <TextField
              type="date"
              label="Start Date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
            />
            <TextField
              type="date"
              label="End Date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
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
              <CardContent sx={{ position: "relative", zIndex: 1, p: { xs: 2, md: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: "0.75em", md: "0.85em" }, fontWeight: 500 }}>
                  Total Expenses
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: "1.75em", sm: "2.25em", md: "3em" } }}>
                  ₹{summary.total.toLocaleString("en-IN")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.9 }}>
                  <Typography variant="caption" sx={{ fontSize: "0.75em" }}>
                    Overall Score
                  </Typography>
                  <Chip 
                    label="8/10" 
                    size="small" 
                    sx={{ 
                      height: 18, 
                      fontSize: "0.7em",
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
              <CardContent sx={{ position: "relative", zIndex: 1, p: { xs: 2, md: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: "0.75em", md: "0.85em" }, fontWeight: 500 }}>
                  Average Expense
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: "1.75em", sm: "2.25em", md: "3em" } }}>
                  ₹{Math.round(summary.average).toLocaleString("en-IN")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.9 }}>
                  <Typography variant="caption" sx={{ fontSize: "0.75em" }}>
                    Ranking
                  </Typography>
                  <Chip 
                    label="25" 
                    size="small" 
                    sx={{ 
                      height: 18, 
                      fontSize: "0.7em",
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
              <CardContent sx={{ position: "relative", zIndex: 1, p: { xs: 2, md: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: "0.75em", md: "0.85em" }, fontWeight: 500 }}>
                  Total Transactions
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: "1.75em", sm: "2.25em", md: "3em" } }}>
                  {summary.count}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.9 }}>
                  <Typography variant="caption" sx={{ fontSize: "0.75em" }}>
                    Incentives worth
                  </Typography>
                  <Chip 
                    label="$15" 
                    size="small" 
                    sx={{ 
                      height: 18, 
                      fontSize: "0.7em",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontWeight: 600
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: { xs: 2, md: 3 }, mb: 3 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1.1em", md: "1.25em" } }}>
                Expenses by Category
              </Typography>
              <Box sx={{ height: { xs: 250, md: 300 }, mt: 2 }}>
                <Bar data={categoryBarData} options={chartOptions} />
              </Box>
            </Paper>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1.1em", md: "1.25em" } }}>
                Category Distribution
              </Typography>
              <Box sx={{ height: { xs: 250, md: 300 }, mt: 2, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Pie data={categoryChartData} options={chartOptions} />
              </Box>
            </Paper>
          </Box>

          <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <Box sx={{ 
              display: "flex", 
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between", 
              alignItems: { xs: "flex-start", sm: "center" }, 
              mb: 2,
              gap: 2
            }}>
              <Typography variant="h6" sx={{ fontSize: { xs: "1.1em", md: "1.25em" } }}>Monthly Expenses Trend</Typography>
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
            <Box sx={{ height: { xs: 250, md: 300 }, mt: 2 }}>
              <Line data={monthlyChartData} options={chartOptions} />
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1.1em", md: "1.25em" } }}>
              Category Breakdown
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>
              {categoryData.map((item, index) => (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ 
                    display: "flex", 
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between", 
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: { xs: 1, sm: 0 },
                    py: { xs: 1.5, md: 1.5 }, 
                    px: { xs: 2, md: 2 },
                    "&:last-child": { pb: { xs: 1.5, md: 1.5 } } 
                  }}>
                    <Box>
                      <Typography variant="body1" fontWeight="600" sx={{ fontSize: { xs: "0.95em", md: "1em" } }}>
                        {item.category}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.count} transactions
                      </Typography>
                    </Box>
                    <Chip
                      label={`₹${item.total.toLocaleString("en-IN")}`}
                      color="primary"
                      sx={{ 
                        fontWeight: "bold", 
                        fontSize: { xs: "0.85em", md: "1em" },
                        alignSelf: { xs: "flex-start", sm: "center" }
                      }}
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
