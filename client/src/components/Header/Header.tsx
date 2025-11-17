import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Avatar,
  Divider,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import FolderIcon from "@mui/icons-material/Folder";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useThemeMode } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import palette from "../../theme/palette";
import Logo from "../Logo";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { logout, user } = useAuth();

  // Check if user is in a tracker view
  const isInTrackerView = location.pathname.startsWith("/tracker/");

  const menuItems = [
    { text: "Trackers", icon: <FolderIcon />, path: "/trackers" },
    { text: "Usage", icon: <ShowChartIcon />, path: "/usage" },
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
    setProfileMenuAnchor(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setProfileMenuAnchor(null);
  };

  const getPhotoUrl = () => {
    if (user?.profilePhoto) {
      return user.profilePhoto.startsWith('http') 
        ? user.profilePhoto 
        : `http://localhost:5000${user.profilePhoto}`;
    }
    return '';
  };

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: '#ffffff',
          borderBottom: `1px solid ${palette.border.light}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 60 }, px: { xs: 2, sm: 2.5 } }}>
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1.5, 
              flexGrow: 1,
              cursor: 'pointer'
            }}
            onClick={() => navigate("/trackers")}
          >
            <Logo width={140} height={40} />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{ 
                color: palette.text.secondary,
                background: palette.background.subtle,
                "&:hover": {
                  background: palette.border.light,
                  color: palette.text.primary,
                },
              }}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>

            {isMobile ? (
              <IconButton
                edge="end"
                onClick={() => setDrawerOpen(true)}
                sx={{ 
                  ml: 0.5,
                  color: palette.text.secondary,
                  background: palette.background.subtle,
                  "&:hover": {
                    background: palette.border.light,
                    color: palette.text.primary,
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Box sx={{ display: "flex", gap: 1, ml: 1, alignItems: "center" }}>
                <Button
                  startIcon={<FolderIcon fontSize="small" />}
                  size="small"
                  onClick={() => navigate("/trackers")}
                  sx={{
                    color: location.pathname === "/trackers" || isInTrackerView 
                      ? '#fff' 
                      : palette.text.primary,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    background: location.pathname === "/trackers" || isInTrackerView 
                      ? palette.gradients.primary
                      : palette.background.subtle,
                    "&:hover": {
                      background: location.pathname === "/trackers" || isInTrackerView 
                        ? palette.gradients.primary
                        : palette.border.light,
                    },
                  }}
                >
                  Trackers
                </Button>
                <Button
                  startIcon={<ShowChartIcon fontSize="small" />}
                  size="small"
                  onClick={() => navigate("/usage")}
                  sx={{
                    color: location.pathname === "/usage"
                      ? '#fff' 
                      : palette.text.primary,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    background: location.pathname === "/usage"
                      ? palette.gradients.primary
                      : palette.background.subtle,
                    "&:hover": {
                      background: location.pathname === "/usage"
                        ? palette.gradients.primary
                        : palette.border.light,
                    },
                  }}
                >
                  Usage
                </Button>
                <Chip
                  label={localStorage.getItem('subscription_plan') || 'Free'}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    height: 24,
                    background: palette.gradients.primary,
                    color: '#fff',
                    borderRadius: 1.5,
                  }}
                />
                <IconButton
                  onClick={handleProfileMenuOpen}
                  size="small"
                  sx={{
                    ml: 0.5,
                    p: 0.25,
                    border: `2px solid ${location.pathname === "/profile" ? palette.primary.main : palette.border.light}`,
                    "&:hover": {
                      borderColor: palette.primary.main,
                    },
                  }}
                >
                  <Avatar
                    src={getPhotoUrl()}
                    sx={{
                      width: 32,
                      height: 32,
                      background: palette.gradients.primary,
                      fontSize: "0.875rem",
                      fontWeight: 700,
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer 
        anchor="right" 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: palette.background.paper,
            color: palette.text.primary,
            boxShadow: `-4px 0 20px ${palette.shadows.medium}`,
          },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar 
                sx={{ 
                  width: 48, 
                  height: 48,
                  background: palette.gradients.primary,
                  boxShadow: `0 4px 12px ${palette.shadows.medium}`,
                }}
              >
                <AccountBalanceWalletIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: "1.1rem", color: palette.text.primary }}>
                  Expense Tracker
                </Typography>
                <Chip 
                  label="Premium" 
                  size="small" 
                  sx={{ 
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    background: palette.status.success.bg,
                    color: palette.primary.main,
                    mt: 0.5,
                    border: `1px solid ${palette.border.light}`,
                  }} 
                />
              </Box>
            </Box>
            <IconButton 
              onClick={() => setDrawerOpen(false)}
              sx={{ 
                color: palette.text.secondary,
                "&:hover": {
                  background: palette.background.subtle,
                  color: palette.text.primary,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: palette.border.light }} />

          <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.5,
                    "&.Mui-selected": {
                      background: palette.gradients.primary,
                      color: '#fff',
                      boxShadow: `0 4px 12px ${palette.shadows.medium}`,
                      "& .MuiListItemIcon-root": {
                        color: '#fff',
                      },
                      "&:hover": {
                        background: palette.gradients.primary,
                      },
                    },
                    "&:hover": {
                      background: palette.background.subtle,
                    },
                    transition: "all 0.2s",
                  }}
                >
                  <ListItemIcon sx={{ color: palette.text.secondary, minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 700 : 500,
                      fontSize: "0.95rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ borderColor: palette.border.light }} />

          <Box sx={{ p: 2 }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2.5,
                py: 1.5,
                border: `1px solid ${palette.border.default}`,
                background: palette.background.subtle,
                "&:hover": {
                  background: palette.status.error.bg,
                  borderColor: palette.status.error.main,
                  color: palette.status.error.main,
                  "& .MuiListItemIcon-root": {
                    color: palette.status.error.main,
                  },
                },
                transition: "all 0.2s",
              }}
            >
              <ListItemIcon sx={{ color: palette.text.accent, minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Logout"
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: palette.text.accent,
                }}
              />
            </ListItemButton>
          </Box>
        </Box>
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            minWidth: 180,
            borderRadius: 2.5,
            mt: 1,
            border: `1px solid ${palette.border.light}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${palette.border.light}` }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: palette.text.primary, fontSize: '0.875rem' }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: palette.text.secondary, fontSize: '0.75rem' }}>
            {user?.phone}
          </Typography>
        </Box>
        <MenuItem
          onClick={handleProfileClick}
          sx={{
            py: 1.25,
            px: 2,
            '&:hover': {
              background: palette.background.subtle,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AccountCircleIcon fontSize="small" sx={{ color: palette.primary.main }} />
          </ListItemIcon>
          <ListItemText
            primary="My Profile"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: palette.text.primary,
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.25,
            px: 2,
            '&:hover': {
              background: palette.status.error.bg,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon fontSize="small" sx={{ color: palette.status.error.main }} />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: palette.status.error.main,
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default Header;
