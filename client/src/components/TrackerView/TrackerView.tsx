import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Skeleton,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChatIcon from "@mui/icons-material/Chat";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ChatInterface from "../ChatInterface/ChatInterface";
import Dashboard from "../Dashboard/Dashboard";
import Transactions from "../Transactions/Transactions";
import { api } from "../../services/api";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tracker-tabpanel-${index}`}
      aria-labelledby={`tracker-tab-${index}`}
      style={{ height: '100%', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const TrackerView: React.FC = () => {
  const { trackerId } = useParams<{ trackerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [tracker, setTracker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get current tab from URL search params, default to 'chat'
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'chat';
  
  const getTabValue = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 1;
      case 'transactions': return 2;
      default: return 0;
    }
  };
  
  const tabValue = getTabValue(currentTab);

  useEffect(() => {
    if (trackerId) {
      loadTracker();
    }
  }, [trackerId]);

  const loadTracker = async () => {
    setLoading(true);
    try {
      const data = await api.getTracker(trackerId!);
      setTracker(data);
    } catch (error) {
      console.error("Error loading tracker:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const tabs = ['chat', 'dashboard', 'transactions'];
    navigate(`/tracker/${trackerId}?tab=${tabs[newValue]}`);
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "INR":
        return "₹";
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      default:
        return currency;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (!tracker) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error">
            Tracker not found
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Header with Tabs */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "white",
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Tracker Info Row */}
        <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 2, pb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
            <Box
              component="button"
              onClick={() => navigate("/trackers")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.3,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "white",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                padding: 0,
                "&:hover": { opacity: 0.8 },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
              Back
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, flexWrap: "wrap" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0, fontSize: { xs: "0.95rem", sm: "1.05rem" } }}>
              {tracker.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Chip 
                label={tracker.type} 
                size="small"
                sx={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 600,
                  height: { xs: 18, sm: 20 },
                  fontSize: { xs: "0.65rem", sm: "0.7rem" },
                  "& .MuiChip-label": { px: 0.75 }
                }} 
              />
              <Chip 
                label={getCurrencySymbol(tracker.currency)} 
                size="small"
                sx={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 600,
                  height: { xs: 18, sm: 20 },
                  fontSize: { xs: "0.65rem", sm: "0.7rem" },
                  "& .MuiChip-label": { px: 0.75 }
                }} 
              />
            </Box>
          </Box>
        </Box>

        {/* Tabs Row */}
        <Box sx={{ px: { xs: 0, sm: 1 } }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            sx={{ 
              minHeight: { xs: 40, sm: 44 },
              '& .MuiTab-root': {
                minHeight: { xs: 40, sm: 44 },
                py: { xs: 0.5, sm: 1 },
                px: { xs: 1, sm: 1.5 },
                fontSize: { xs: "0.7rem", sm: "0.8rem" },
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'white',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'white',
                height: 2,
              },
              '& .MuiTab-iconWrapper': {
                fontSize: { xs: "0.95rem", sm: "1.1rem" },
                marginRight: { xs: 0.5, sm: 0.75 },
              },
            }}
          >
            <Tab icon={<ChatIcon />} label="Chat" iconPosition="start" />
            <Tab icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
            <Tab icon={<ReceiptLongIcon />} label="Transactions" iconPosition="start" />
          </Tabs>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 'calc(100vh - 180px)' }}>
        <TabPanel value={tabValue} index={0}>
          <ChatInterface trackerId={trackerId} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Dashboard trackerId={trackerId} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Transactions trackerId={trackerId} />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default TrackerView;
