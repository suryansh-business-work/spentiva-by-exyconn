import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  InputAdornment,
} from "@mui/material";
import { Expense } from "../../types";

interface EditExpenseDialogProps {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSave: (id: string, updatedExpense: Partial<Expense>) => void;
  categories: string[];
  paymentMethods: string[];
}

const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({
  open,
  expense,
  onClose,
  onSave,
  categories,
  paymentMethods,
}) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setSubcategory(expense.subcategory);
      setPaymentMethod(expense.paymentMethod);
      setDescription(expense.description || "");
    }
  }, [expense]);

  const handleSave = () => {
    if (!expense) return;

    const updatedExpense: Partial<Expense> = {
      amount: parseFloat(amount),
      category,
      subcategory,
      paymentMethod,
      description,
    };

    onSave(expense.id, updatedExpense);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Expense</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} label="Category">
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel>Payment Method</InputLabel>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Method">
              {paymentMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!amount || !category || !subcategory || !paymentMethod}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditExpenseDialog;
