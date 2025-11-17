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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { api } from "../../services/api";

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

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: "#667eea" }}>
              Expense Trackers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create separate trackers for different purposes (Home, Business, Travel, etc.)
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Tracker
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : trackers.length === 0 ? (
        <Paper elevation={3} sx={{ p: 6, textAlign: "center" }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No trackers yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first tracker to start managing expenses
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Tracker
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 3 }}>
          {trackers.map((tracker) => (
            <Card
              key={tracker.id}
              elevation={3}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {tracker.type === "business" ? (
                        <BusinessIcon sx={{ color: "#667eea", fontSize: 32 }} />
                      ) : (
                        <PersonIcon sx={{ color: "#667eea", fontSize: 32 }} />
                      )}
                      <Chip
                        label={tracker.type}
                        size="small"
                        color={tracker.type === "business" ? "primary" : "secondary"}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </Box>
                    <Chip
                      label={getCurrencySymbol(tracker.currency)}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>

                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    {tracker.name}
                  </Typography>

                  {tracker.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {tracker.description}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(tracker.createdAt).toLocaleDateString("en-IN")}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/tracker/${tracker.id}`)}
                    sx={{ flexGrow: 1, mr: 1 }}
                  >
                    View Expenses
                  </Button>
                  <IconButton size="small" color="primary" onClick={() => handleOpenDialog(tracker)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(tracker)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
          ))}
        </Box>
      )}

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
