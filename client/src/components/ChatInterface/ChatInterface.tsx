import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Card,
  CardContent,
  Skeleton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { Message } from "../../types";
import { api } from "../../services/api";
import { notifyExpenseAdded } from "../../services/notificationService";
import "./ChatInterface.scss";

interface ChatInterfaceProps {
  onExpenseAdded?: () => void;
  trackerId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onExpenseAdded, trackerId }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your expense tracker assistant. Tell me about your expenses naturally, like 'spend food 50 from credit card' or 'bought groceries 200 cash'.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Parse the expense using ChatGPT
      const parsed = await api.parseExpense(input);

      if ("error" in parsed) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: parsed.error,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        // Create the expense
        const expenseData = { ...parsed, trackerId };
        const expense = await api.createExpense(expenseData);
        
        const successMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `✅ Expense logged successfully!\n\nAmount: ₹${expense.amount}\nCategory: ${expense.subcategory}\nPayment: ${expense.paymentMethod}`,
          expense,
          timestamp: new Date(),
        };
        
        setMessages((prev: Message[]) => [...prev, successMessage]);
        
        // Notify parent component
        if (onExpenseAdded) {
          onExpenseAdded();
        }

        // Show notification
        notifyExpenseAdded(expense.amount, expense.subcategory);

        // Dispatch event for other components
        window.dispatchEvent(new Event("expenseUpdated"));
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 300px)', px: 2, py: 1.5 }}>
      <Box 
        className="chat-messages" 
        sx={{ 
          flexGrow: 1, 
          minHeight: 'calc(100vh - 300px)',
          overflowY: "auto",
          overflowX: "hidden",
          mb: 2, 
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(16, 185, 129, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(16, 185, 129, 0.5)',
            },
          },
        }}
      >
          {messages.map((message) => (
            <Box
              key={message.id}
              className={`message ${message.role}`}
              sx={{
                display: "flex",
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                mb: 2,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 1.5,
                  maxWidth: "75%",
                  backgroundColor: message.role === "user" ? "#10b981" : "#fff",
                  color: message.role === "user" ? "#fff" : "#333",
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                  {message.content}
                </Typography>
                {message.expense && (
                  <Card sx={{ mt: 2, backgroundColor: "rgba(0,0,0,0.05)" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">
                            Amount:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            ₹{message.expense.amount}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">
                            Category:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {message.expense.subcategory}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">
                            Payment:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {message.expense.paymentMethod}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
              <Paper elevation={2} sx={{ p: 2, minWidth: "200px" }}>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Form - Fixed at bottom */}
        <Paper elevation={3} sx={{ p: 2, position: 'sticky', bottom: 0 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your expense... (e.g., 'spend food 50 from credit card')"
                disabled={isLoading}
                variant="outlined"
                size="medium"
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || !input.trim()}
                endIcon={<SendIcon />}
                sx={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  minWidth: "120px",
                }}
              >
                Send
              </Button>
            </Box>
          </form>
        </Paper>
    </Box>
  );
};

export default ChatInterface;
