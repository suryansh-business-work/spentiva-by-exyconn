import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import FolderIcon from "@mui/icons-material/Folder";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { useThemeMode } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { logout } = useAuth();

  // Check if user is in a tracker view
  const isInTrackerView = location.pathname.startsWith("/tracker/");

  const menuItems = [
    { text: "Trackers", icon: <FolderIcon />, path: "/trackers" },
    { text: "Profile", icon: <AccountCircleIcon />, path: "/profile" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  return (
    <>
      <AppBar position="sticky" sx={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
        <Toolbar sx={{ minHeight: { xs: 48, sm: 56 }, py: 0.5 }}>
          <AccountBalanceWalletIcon sx={{ color: '#fff', mr: { xs: 0.5, md: 1 }, fontSize: { xs: 22, md: 26 } }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1.1rem" },
              color: '#fff',
            }}
          >
            Expense Tracker
          </Typography>

          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ mr: { xs: 0.5, md: 1, color: '#fff', } }}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {isMobile ? (
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setDrawerOpen(true)}
              sx={{ ml: 1, color: '#fff', }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                color="inherit"
                startIcon={<FolderIcon />}
                onClick={() => navigate("/trackers")}
                variant={location.pathname === "/trackers" || isInTrackerView ? "outlined" : "text"}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  color: '#fff',
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                Trackers
              </Button>
              <Button
                color="inherit"
                startIcon={<AccountCircleIcon />}
                onClick={() => navigate("/profile")}
                variant={location.pathname === "/profile" ? "outlined" : "text"}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  color: '#fff',
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                Profile
              </Button>
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  color: '#fff',
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250, pt: 2 }} role="presentation">
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      "&:hover": {
                        backgroundColor: "rgba(16, 185, 129, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? "#10b981" : "inherit" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
