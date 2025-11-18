import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Skeleton,
  Snackbar,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
  Fade,
  Grow,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddToHomeScreenIcon from "@mui/icons-material/AddToHomeScreen";
import { api } from "../../services/api";
import palette from "../../theme/palette";

interface Tracker {
  id: string;
  name: string;
  type: "personal" | "business";
  description?: string;
  currency: "INR" | "USD" | "EUR" | "GBP";
  createdAt: Date;
  updatedAt: Date;
}

const Trackers: React.FC = () => {
  const navigate = useNavigate();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTracker, setMenuTracker] = useState<Tracker | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "personal" as "personal" | "business",
    description: "",
    currency: "INR" as "INR" | "USD" | "EUR" | "GBP",
  });

  useEffect(() => {
    loadTrackers();
  }, []);

  const loadTrackers = async () => {
    setLoading(true);
    try {
      const data = await api.getTrackers();
      setTrackers(data);
    } catch (error) {
      console.error("Error loading trackers:", error);
      setSnackbar({ open: true, message: "Failed to load trackers", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tracker?: Tracker) => {
    if (tracker) {
      setEditMode(true);
      setSelectedTracker(tracker);
      setFormData({
        name: tracker.name,
        type: tracker.type,
        description: tracker.description || "",
        currency: tracker.currency,
      });
    } else {
      setEditMode(false);
      setSelectedTracker(null);
      setFormData({
        name: "",
        type: "personal",
        description: "",
        currency: "INR",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedTracker(null);
  };

  const handleSave = async () => {
    try {
      if (editMode && selectedTracker) {
        await api.updateTracker(selectedTracker.id, formData);
        setSnackbar({ open: true, message: "Tracker updated successfully", severity: "success" });
      } else {
        await api.createTracker(formData);
        setSnackbar({ open: true, message: "Tracker created successfully", severity: "success" });
      }
      handleCloseDialog();
      loadTrackers();
    } catch (error) {
      console.error("Error saving tracker:", error);
      setSnackbar({ open: true, message: "Failed to save tracker", severity: "error" });
    }
  };

  const handleDelete = (tracker: Tracker) => {
    setSelectedTracker(tracker);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTracker) return;

    try {
      await api.deleteTracker(selectedTracker.id);
      setDeleteDialogOpen(false);
      setSnackbar({ open: true, message: "Tracker deleted successfully", severity: "success" });
      loadTrackers();
    } catch (error) {
      console.error("Error deleting tracker:", error);
      setSnackbar({ open: true, message: "Failed to delete tracker", severity: "error" });
    }
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tracker: Tracker) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuTracker(tracker);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTracker(null);
  };

  const handleMenuAction = (action: "edit" | "settings" | "delete" | "addToHome", tracker: Tracker) => {
    handleMenuClose();
    switch (action) {
      case "edit":
        handleOpenDialog(tracker);
        break;
      case "settings":
        navigate(`/tracker/${tracker.id}/settings`);
        break;
      case "delete":
        handleDelete(tracker);
        break;
      case "addToHome":
        handleAddToHomeScreen(tracker);
        break;
    }
  };

  const handleAddToHomeScreen = async (tracker: Tracker) => {
    try {
      // Check if the browser supports PWA installation
      if ('BeforeInstallPromptEvent' in window || 'standalone' in navigator) {
        // Create a dynamic manifest for this specific tracker
        const manifestData = {
          name: tracker.name,
          short_name: tracker.name,
          description: tracker.description || `${tracker.name} expense tracker`,
          start_url: `/tracker/${tracker.id}?standalone=true`,
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: tracker.type === 'business' ? '#667eea' : '#10b981',
          icons: [
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        };

        // Convert manifest to blob URL
        const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(manifestBlob);

        // Create a temporary HTML page with the manifest
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tracker.name}</title>
  <link rel="manifest" href="${manifestURL}">
  <meta name="theme-color" content="${tracker.type === 'business' ? '#667eea' : '#10b981'}">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, ${tracker.type === 'business' ? '#667eea 0%, #764ba2' : '#10b981 0%, #059669'} 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
    }
    h1 { margin: 0 0 10px; font-size: 2em; }
    p { margin: 10px 0; opacity: 0.9; }
    .button {
      margin-top: 20px;
      padding: 12px 24px;
      background: white;
      color: ${tracker.type === 'business' ? '#667eea' : '#10b981'};
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${tracker.name}</h1>
    <p>${tracker.description || 'Expense Tracker'}</p>
    <a href="${window.location.origin}/tracker/${tracker.id}" class="button">
      Open Tracker
    </a>
    <p style="font-size: 14px; margin-top: 30px;">
      To add to your home screen:<br><br>
      <strong>Mobile:</strong> Tap the share button and select "Add to Home Screen"<br><br>
      <strong>Desktop:</strong> Click the install icon in the address bar or use browser menu
    </p>
  </div>
  <script>
    // Redirect after showing instructions for a moment
    setTimeout(() => {
      window.location.href = '${window.location.origin}/tracker/${tracker.id}';
    }, 8002);
  </script>
</body>
</html>`;

        // Open in new window for installation
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          
          setSnackbar({ 
            open: true, 
            message: `Opening ${tracker.name} for installation. Follow your browser's prompts to add to home screen!`, 
            severity: "success" 
          });
        } else {
          throw new Error('Popup blocked');
        }

        // Clean up the blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(manifestURL), 10000);
      } else {
        // Fallback: Just navigate and show instructions
        window.open(`/tracker/${tracker.id}`, '_blank');
        setSnackbar({ 
          open: true, 
          message: `Opening ${tracker.name}. Use your browser's "Add to Home Screen" option to create an icon!`, 
          severity: "success" 
        });
      }
    } catch (error) {
      console.error('Error creating PWA shortcut:', error);
      setSnackbar({ 
        open: true, 
        message: 'Opening tracker in new window. Use browser menu to add to home screen.', 
        severity: "success" 
      });
      window.open(`/tracker/${tracker.id}`, '_blank');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <Fade in={true} timeout={500}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2.5, sm: 3 }, 
            mb: { xs: 2, sm: 3 },
            borderRadius: 3,
            background: palette.background.paper,
            border: `1px solid ${palette.border.light}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 0.5, color: palette.text.primary, fontSize: { xs: '1.25em', sm: '1.5em' } }}>
                Expense Trackers
              </Typography>
              <Typography variant="body2" sx={{ color: palette.text.secondary, fontSize: { xs: '0.875em', sm: '0.9375em' } }}>
                Create separate trackers for different purposes
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: palette.gradients.primary,
                color: "#fff",
                fontWeight: 600,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1, sm: 1.25 },
                borderRadius: 2,
                textTransform: "none",
                fontSize: { xs: '0.875em', sm: '0.9375em' },
              }}
            >
              Create Tracker
            </Button>
          </Box>
        </Paper>
      </Fade>

      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Fade in={true} timeout={300 * i} key={i}>
              <Box>
                <Skeleton 
                  variant="rectangular" 
                  height={220} 
                  sx={{ 
                    borderRadius: 4,
                    transform: "scale(1)",
                    animation: "pulse 1.5s ease-in-out infinite",
                    backgroundColor: palette.background.subtle,
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.5 },
                    },
                  }} 
                />
              </Box>
            </Fade>
          ))}
        </Box>
      ) : trackers.length === 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: "center",
            borderRadius: 4,
            border: `1px solid ${palette.border.light}`,
            background: palette.background.paper,
          }}
        >
          <AccountBalanceWalletIcon sx={{ fontSize: 80, color: palette.text.muted, mb: 2 }} />
          <Typography variant="h6" sx={{ color: palette.text.secondary, mb: 1 }} gutterBottom>
            No trackers yet
          </Typography>
          <Typography variant="body2" sx={{ color: palette.text.muted, mb: 3 }}>
            Create your first tracker to start managing expenses
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: palette.gradients.primary,
              boxShadow: `0 4px 12px ${palette.shadows.medium}`,
            }}
          >
            Create Tracker
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 3 }}>
          {trackers.map((tracker, index) => (
            <Grow
              in={true}
              timeout={300 + index * 100}
              key={tracker.id}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: palette.border.light,
                  borderRadius: 3,
                  background: palette.background.paper,
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: palette.gradients.primary,
                  },
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderColor: palette.primary.main,
                  },
                }}
                onClick={() => navigate(`/tracker/${tracker.id}`)}
              >
                <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 2.5 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: palette.gradients.primary,
                          boxShadow: `0 2px 8px ${palette.shadows.medium}`,
                        }}
                      >
                        {tracker.type === "business" ? (
                          <BusinessIcon sx={{ color: "#fff", fontSize: 22 }} />
                        ) : (
                          <PersonIcon sx={{ color: "#fff", fontSize: 22 }} />
                        )}
                      </Box>
                      <Box>
                        <Chip
                          label={tracker.type}
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                            fontSize: "0.7em",
                            height: 20,
                            background: palette.status.success.bg,
                            color: palette.primary.main,
                            border: `1px solid ${palette.border.light}`,
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                        <Chip
                          label={getCurrencySymbol(tracker.currency)}
                          size="small"
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.85em",
                            background: palette.background.subtle,
                          color: palette.text.primary,
                          border: `1px solid ${palette.border.light}`,
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, tracker)}
                        sx={{
                          color: palette.text.secondary,
                          "&:hover": {
                            background: palette.background.subtle,
                            color: palette.text.primary,
                          },
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography 
                    variant="h6" 
                    fontWeight="700" 
                    gutterBottom 
                    sx={{ 
                      mb: 1,
                      fontSize: { xs: '1em', sm: '1.05em' },
                      color: palette.text.primary,
                    }}
                  >
                    {tracker.name}
                  </Typography>

                  {tracker.description && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.4,
                        color: palette.text.secondary,
                        fontSize: { xs: '0.8125em', sm: '0.875em' },
                      }}
                    >
                      {tracker.description}
                    </Typography>
                  )}

                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "text.secondary",
                      fontSize: "0.75em",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    📅 {new Date(tracker.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tracker/${tracker.id}`);
                    }}
                    sx={{
                      flexGrow: 1,
                      background: tracker.type === "business"
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      py: 1,
                      boxShadow: "none",
                      "&:hover": {
                        boxShadow: tracker.type === "business"
                          ? "0 4px 12px rgba(102, 126, 234, 0.4)"
                          : "0 4px 12px rgba(16, 185, 129, 0.4)",
                      },
                    }}
                  >
                    Open Tracker
                  </Button>
                </CardActions>
              </Card>
            </Grow>
          ))}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 0,
          sx: {
            minWidth: 200,
            borderRadius: 3,
            mt: 1,
            border: `1px solid ${palette.border.light}`,
            boxShadow: `0 8px 24px ${palette.shadows.medium}`,
          },
        }}
      >
        <MenuItem 
          onClick={() => menuTracker && handleMenuAction("addToHome", menuTracker)}
          sx={{ 
            py: 1.5,
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            "&:hover": {
              background: palette.background.subtle,
            },
          }}
        >
          <ListItemIcon>
            <AddToHomeScreenIcon fontSize="small" sx={{ color: palette.primary.main }} />
          </ListItemIcon>
          <ListItemText sx={{ color: palette.text.primary }}>Add to Desktop</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => menuTracker && handleMenuAction("settings", menuTracker)}
          sx={{ 
            py: 1.5,
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            "&:hover": {
              background: palette.background.subtle,
            },
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" sx={{ color: palette.primary.main }} />
          </ListItemIcon>
          <ListItemText sx={{ color: palette.text.primary }}>Category Settings</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => menuTracker && handleMenuAction("edit", menuTracker)}
          sx={{ 
            py: 1.5,
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            "&:hover": {
              background: palette.background.subtle,
            },
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: palette.primary.main }} />
          </ListItemIcon>
          <ListItemText sx={{ color: palette.text.primary }}>Edit Tracker</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => menuTracker && handleMenuAction("delete", menuTracker)}
          sx={{ 
            py: 1.5,
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            "&:hover": {
              background: palette.status.error.bg,
            },
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: palette.status.error.main }} />
          </ListItemIcon>
          <ListItemText sx={{ color: palette.status.error.main }}>Delete Tracker</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? "Edit Tracker" : "Create New Tracker"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Tracker Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Home Expenses, Business Travel"
              required
            />

            <FormControl fullWidth>
              <InputLabel>Tracker Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "personal" | "business" })}
                label="Tracker Type"
              >
                <MenuItem value="personal">Personal Use</MenuItem>
                <MenuItem value="business">Business Use</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description (Optional)"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this tracker"
            />

            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                label="Currency"
              >
                <MenuItem value="INR">INR (₹)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.type || !formData.currency}
          >
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tracker</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "<strong>{selectedTracker?.name}</strong>"?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            This will also delete all expenses associated with this tracker. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Trackers;
