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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
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
            <Card elevation={3}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Expenses
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ₹{summary.total.toLocaleString("en-IN")}
                </Typography>
              </CardContent>
            </Card>
            <Card elevation={3}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Average Expense
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ₹{Math.round(summary.average).toLocaleString("en-IN")}
                </Typography>
              </CardContent>
            </Card>
            <Card elevation={3}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Transactions
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {summary.count}
                </Typography>
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
