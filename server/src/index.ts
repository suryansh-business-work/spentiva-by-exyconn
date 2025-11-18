import dotenv from "dotenv";

// IMPORTANT: Load environment variables FIRST, before any other imports
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import jwt from "jsonwebtoken";
import db from "./config/db";
import config from "./config/env";
import ExpenseModel from "./models/Expense";
import TrackerModel from "./models/Tracker";
import UserModel from "./models/User";
import OTPModel from "./models/OTP";
import CategoryModel from "./models/Category";
import { ExpenseParser } from "./services/expenseParser";
import { AnalyticsService } from "./services/analyticsService";
import { Expense } from "./types";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "./config/categories";
import reportRoutes from "./routes/report";
import usageRoutes from "./routes/usage";

const app = express();
const PORT = config.PORT;

// Initialize database connection
db(config.DBURL);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Report routes
app.use('/api/reports', reportRoutes);

// Usage routes
app.use('/api/usage', usageRoutes);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// ============ AUTH ROUTES ============

// Send OTP for login/signup
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { phone, type = 'phone' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Delete any existing OTP for this phone
    await OTPModel.deleteMany({ identifier: phone, type });

    // Create new OTP (static 123456 for now)
    const otp = await OTPModel.create({
      identifier: phone,
      otp: '123456',
      type,
    });

    console.log(`OTP for ${phone}: 123456`); // Log for development

    res.json({
      message: "OTP sent successfully",
      otpId: otp._id,
      // Send OTP in response for development only
      devOtp: '123456'
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify OTP and login/signup
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { phone, otp, name, accountType } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    // Find OTP
    const otpDoc = await OTPModel.findOne({
      identifier: phone,
      otp,
      type: 'phone',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();

    // Check if user exists
    let user = await UserModel.findOne({ phone });

    if (!user) {
      // Signup - create new user
      if (!name) {
        return res.status(400).json({ error: "Name is required for signup" });
      }

      user = await UserModel.create({
        phone,
        name,
        phoneVerified: true,
        accountType: accountType || 'personal'
      });
    } else {
      // Login - update phone verified status
      user.phoneVerified = true;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: "Authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        profilePhoto: user.profilePhoto,
        accountType: user.accountType,
      }
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user profile
app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
  try {
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        profilePhoto: user.profilePhoto,
        accountType: user.accountType,
      }
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
app.put("/api/auth/profile", authenticateToken, async (req: any, res) => {
  try {
    const { name, email } = req.body;
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    if (email !== undefined) {
      user.email = email;
      user.emailVerified = false; // Reset verification if email changes
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        profilePhoto: user.profilePhoto,
        accountType: user.accountType,
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload profile photo
app.post("/api/auth/profile-photo", authenticateToken, upload.single('photo'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    user.profilePhoto = photoUrl;
    await user.save();

    res.json({
      message: "Profile photo uploaded successfully",
      photoUrl
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send OTP for email verification
app.post("/api/auth/send-email-otp", authenticateToken, async (req: any, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete any existing OTP for this email
    await OTPModel.deleteMany({ identifier: email, type: 'email' });

    // Create new OTP
    const otp = await OTPModel.create({
      identifier: email,
      otp: '123456',
      type: 'email',
    });

    console.log(`Email OTP for ${email}: 123456`);

    res.json({
      message: "OTP sent to email",
      otpId: otp._id,
      devOtp: '123456'
    });
  } catch (error) {
    console.error("Error sending email OTP:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify email OTP
app.post("/api/auth/verify-email-otp", authenticateToken, async (req: any, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const otpDoc = await OTPModel.findOne({
      identifier: email,
      otp,
      type: 'email',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.email = email;
    user.emailVerified = true;
    await user.save();

    res.json({
      message: "Email verified successfully",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        profilePhoto: user.profilePhoto,
        accountType: user.accountType,
      }
    });
  } catch (error) {
    console.error("Error verifying email OTP:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ END AUTH ROUTES ============

app.get("/api/categories", (req, res) => {
  res.json({
    categories: EXPENSE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS,
  });
});

app.post("/api/parse-expense", authenticateToken, async (req: any, res) => {
  try {
    const { message, trackerId } = req.body;

    console.log('[Parse Expense] Request received:', {
      hasMessage: !!message,
      hasTrackerId: !!trackerId,
      hasUserId: !!req.user?.userId,
      trackerId,
      userId: req.user?.userId
    });

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!trackerId) {
      return res.status(400).json({ error: "Tracker ID is required" });
    }

    // Get tracker information for snapshot
    let trackerSnapshot = null;
    if (req.user?.userId && trackerId) {
      try {
        const tracker = await TrackerModel.findOne({ 
          _id: trackerId, 
          userId: req.user.userId 
        });

        if (tracker) {
          const { createTrackerSnapshot } = await import('./utils/usageLogger');
          trackerSnapshot = createTrackerSnapshot(tracker);
        } else {
          return res.status(404).json({ error: "Tracker not found" });
        }
      } catch (err) {
        console.error("[Parse Expense] Error fetching tracker:", err);
        return res.status(500).json({ error: "Error fetching tracker information" });
      }
    }

    // Log user message with tracker snapshot
    if (trackerSnapshot) {
      try {
        const { encode } = await import('gpt-tokenizer');
        const userTokens = encode(message).length;
        
        const { logUsage } = await import('./utils/usageLogger');
        await logUsage(
          req.user.userId,
          trackerSnapshot,
          'user',
          message,
          userTokens
        );
        console.log('[Parse Expense] User message logged with snapshot');
      } catch (logError) {
        console.error("[Parse Expense] Error logging user message:", logError);
        // Continue processing even if logging fails
      }
    }

    const parsed = await ExpenseParser.parseExpense(message);

    // Log AI response with tracker snapshot
    if (trackerSnapshot && !("error" in parsed)) {
      try {
        const responseText = `Parsed expense: ₹${parsed.amount} for ${parsed.subcategory} via ${parsed.paymentMethod}`;
        const { encode } = await import('gpt-tokenizer');
        const aiTokens = encode(responseText).length;
        
        const { logUsage } = await import('./utils/usageLogger');
        await logUsage(
          req.user.userId,
          trackerSnapshot,
          'assistant',
          responseText,
          aiTokens
        );
        console.log('[Parse Expense] AI response logged with snapshot');
      } catch (logError) {
        console.error("[Parse Expense] Error logging AI response:", logError);
        // Continue processing even if logging fails
      }
    }

    if ("error" in parsed) {
      return res.status(400).json(parsed);
    }

    res.json(parsed);
  } catch (error) {
    console.error("Error parsing expense:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const { amount, category, subcategory, categoryId, paymentMethod, description, timestamp, trackerId } = req.body;

    if (!amount || !category || !subcategory || !categoryId || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get userId from auth header if present
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId;
    
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // Token invalid, continue without userId
      }
    }

    const expense = new ExpenseModel({
      amount,
      category,
      subcategory,
      categoryId,
      paymentMethod,
      description,
      timestamp: timestamp || new Date(),
      trackerId: trackerId || 'default',
      userId,
    });

    await expense.save();

    res.status(201).json({
      message: "Expense logged successfully",
      expense: {
        id: (expense._id as any).toString(),
        amount: expense.amount,
        category: expense.category,
        subcategory: expense.subcategory,
        categoryId: expense.categoryId,
        paymentMethod: expense.paymentMethod,
        description: expense.description,
        timestamp: expense.timestamp,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/expenses", async (req, res) => {
  try {
    const { trackerId } = req.query;
    const query = trackerId ? { trackerId } : {};
    
    const expenses = await ExpenseModel.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    const formattedExpenses = expenses.map(expense => ({
      id: (expense._id as any).toString(),
      amount: expense.amount,
      category: expense.category,
      subcategory: expense.subcategory,
      categoryId: expense.categoryId,
      paymentMethod: expense.paymentMethod,
      description: expense.description,
      timestamp: expense.timestamp,
      trackerId: (expense as any).trackerId || 'default',
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    }));

    res.json({ expenses: formattedExpenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, subcategory, categoryId, paymentMethod, description, timestamp } = req.body;

    const expense = await ExpenseModel.findByIdAndUpdate(
      id,
      {
        amount,
        category,
        subcategory,
        categoryId,
        paymentMethod,
        description,
        timestamp,
      },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({
      message: "Expense updated successfully",
      expense: {
        id: (expense._id as any).toString(),
        amount: expense.amount,
        category: expense.category,
        subcategory: expense.subcategory,
        categoryId: expense.categoryId,
        paymentMethod: expense.paymentMethod,
        description: expense.description,
        timestamp: expense.timestamp,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await ExpenseModel.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({
      message: "Expense deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/chat", authenticateToken, async (req: any, res) => {
  try {
    const { message, history = [], trackerId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get tracker snapshot and log user message
    let trackerSnapshot = null;
    if (req.user?.userId && trackerId) {
      try {
        const tracker = await TrackerModel.findOne({ 
          _id: trackerId, 
          userId: req.user.userId 
        });

        if (tracker) {
          const { createTrackerSnapshot, logUsage } = await import('./utils/usageLogger');
          const { encode } = await import('gpt-tokenizer');
          
          trackerSnapshot = createTrackerSnapshot(tracker);
          const userTokens = encode(message).length;
          
          await logUsage(
            req.user.userId,
            trackerSnapshot,
            'user',
            message,
            userTokens
          );
        }
      } catch (err) {
        console.error("[Chat] Error logging user message:", err);
      }
    }

    const response = await ExpenseParser.getChatResponse(message, history);

    // Log AI response
    if (trackerSnapshot && response) {
      try {
        const { logUsage } = await import('./utils/usageLogger');
        const { encode } = await import('gpt-tokenizer');
        
        const aiTokens = encode(response).length;
        
        await logUsage(
          req.user.userId,
          trackerSnapshot,
          'assistant',
          response,
          aiTokens
        );
      } catch (err) {
        console.error("[Chat] Error logging AI response:", err);
      }
    }

    res.json({ response });
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Analytics Routes
app.get("/api/analytics/summary", async (req, res) => {
  try {
    const { filter, customStart, customEnd, categoryId, trackerId } = req.query;
    
    let dateRange = { startDate: new Date(0), endDate: new Date() };
    
    if (filter) {
      dateRange = AnalyticsService.getDateRange(
        filter as string,
        customStart as string,
        customEnd as string
      );
    }
    
    const query: any = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    };
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (trackerId) {
      query.trackerId = trackerId;
    }
    
    const stats = await AnalyticsService.getSummaryStats(query);
    
    res.json({
      stats,
      filter: filter || "all",
      dateRange
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/analytics/by-category", async (req, res) => {
  try {
    const { filter, customStart, customEnd, trackerId } = req.query;
    
    let dateRange = { startDate: new Date(0), endDate: new Date() };
    
    if (filter) {
      dateRange = AnalyticsService.getDateRange(
        filter as string,
        customStart as string,
        customEnd as string
      );
    }
    
    const query: any = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    };
    
    if (trackerId) {
      query.trackerId = trackerId;
    }
    
    const data = await AnalyticsService.getExpensesByCategory(query);
    
    res.json({ data, filter: filter || "all", dateRange });
  } catch (error) {
    console.error("Error fetching category analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/analytics/by-month", async (req, res) => {
  try {
    const { year, trackerId } = req.query;
    const targetYear = year ? parseInt(year as string) : undefined;
    
    const data = await AnalyticsService.getExpensesByMonth(targetYear, trackerId as string | undefined);
    
    res.json({ data, year: targetYear || new Date().getFullYear() });
  } catch (error) {
    console.error("Error fetching monthly analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/analytics/total", async (req, res) => {
  try {
    const { trackerId } = req.query;
    const query: any = {
      startDate: new Date(0),
      endDate: new Date()
    };
    
    if (trackerId) {
      query.trackerId = trackerId;
    }
    
    const total = await AnalyticsService.getTotalExpenses(query);
    
    res.json({ total });
  } catch (error) {
    console.error("Error fetching total:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Tracker Routes
app.get("/api/trackers", authenticateToken, async (req: any, res) => {
  try {
    const trackers = await TrackerModel.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    const formattedTrackers = trackers.map(tracker => ({
      id: (tracker._id as any).toString(),
      name: tracker.name,
      type: tracker.type,
      description: tracker.description,
      currency: tracker.currency,
      createdAt: tracker.createdAt,
      updatedAt: tracker.updatedAt,
    }));

    res.json({ trackers: formattedTrackers });
  } catch (error) {
    console.error("Error fetching trackers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/trackers", authenticateToken, async (req: any, res) => {
  try {
    const { name, type, description, currency } = req.body;

    if (!name || !type || !currency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tracker = new TrackerModel({
      name,
      type,
      description,
      currency,
      userId: req.user.userId,
    });

    await tracker.save();

    // Create default categories for the new tracker
    const defaultCategories = [
      {
        trackerId: (tracker._id as any).toString(),
        name: "Food & Dining",
        subcategories: [
          { id: `${Date.now()}-1`, name: "Groceries" },
          { id: `${Date.now()}-2`, name: "Restaurants" },
          { id: `${Date.now()}-3`, name: "Fast Food" },
        ],
      },
      {
        trackerId: (tracker._id as any).toString(),
        name: "Transportation",
        subcategories: [
          { id: `${Date.now()}-4`, name: "Fuel" },
          { id: `${Date.now()}-5`, name: "Public Transport" },
          { id: `${Date.now()}-6`, name: "Taxi/Uber" },
        ],
      },
      {
        trackerId: (tracker._id as any).toString(),
        name: "Shopping",
        subcategories: [
          { id: `${Date.now()}-7`, name: "Clothing" },
          { id: `${Date.now()}-8`, name: "Electronics" },
          { id: `${Date.now()}-9`, name: "Books" },
        ],
      },
      {
        trackerId: (tracker._id as any).toString(),
        name: "Entertainment",
        subcategories: [
          { id: `${Date.now()}-10`, name: "Movies" },
          { id: `${Date.now()}-11`, name: "Games" },
          { id: `${Date.now()}-12`, name: "Hobbies" },
        ],
      },
      {
        trackerId: (tracker._id as any).toString(),
        name: "Bills & Utilities",
        subcategories: [
          { id: `${Date.now()}-13`, name: "Electricity" },
          { id: `${Date.now()}-14`, name: "Water" },
          { id: `${Date.now()}-15`, name: "Internet" },
        ],
      },
    ];

    await CategoryModel.insertMany(defaultCategories);

    res.status(201).json({
      message: "Tracker created successfully",
      tracker: {
        id: (tracker._id as any).toString(),
        name: tracker.name,
        type: tracker.type,
        description: tracker.description,
        currency: tracker.currency,
        createdAt: tracker.createdAt,
        updatedAt: tracker.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating tracker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/trackers/:id", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const tracker = await TrackerModel.findOne({ _id: id, userId: req.user.userId });

    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found" });
    }

    res.json({
      tracker: {
        id: (tracker._id as any).toString(),
        name: tracker.name,
        type: tracker.type,
        description: tracker.description,
        currency: tracker.currency,
        createdAt: tracker.createdAt,
        updatedAt: tracker.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching tracker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/trackers/:id", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, type, description, currency } = req.body;

    const tracker = await TrackerModel.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { name, type, description, currency },
      { new: true }
    );

    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found" });
    }

    // Update tracker information in usage records
    if (name || type) {
      try {
        const { updateTrackerInUsage } = await import('./utils/usageLogger');
        await updateTrackerInUsage(id, tracker.name, tracker.type);
        console.log(`✅ Updated tracker ${id} in usage records`);
      } catch (usageError) {
        console.error("Error updating tracker in usage:", usageError);
        // Don't fail the update operation if usage update fails
      }
    }

    res.json({
      message: "Tracker updated successfully",
      tracker: {
        id: (tracker._id as any).toString(),
        name: tracker.name,
        type: tracker.type,
        description: tracker.description,
        currency: tracker.currency,
        createdAt: tracker.createdAt,
        updatedAt: tracker.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating tracker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/trackers/:id", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const tracker = await TrackerModel.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found" });
    }

    // Mark tracker as deleted in usage records (so data is preserved)
    try {
      const { markTrackerAsDeleted } = await import('./utils/usageLogger');
      await markTrackerAsDeleted(id);
      console.log(`✅ Marked tracker ${id} as deleted in usage records`);
    } catch (usageError) {
      console.error("Error marking tracker as deleted in usage:", usageError);
      // Don't fail the delete operation if usage marking fails
    }

    // Also delete all expenses associated with this tracker
    await ExpenseModel.deleteMany({ trackerId: id });

    // Also delete all categories associated with this tracker
    await CategoryModel.deleteMany({ trackerId: id });

    res.json({
      message: "Tracker and associated expenses deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Error deleting tracker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ CATEGORY ROUTES ============

// Get all categories for a tracker
app.get("/api/trackers/:trackerId/categories", authenticateToken, async (req: any, res) => {
  try {
    const { trackerId } = req.params;

    // Verify tracker belongs to user
    const tracker = await TrackerModel.findOne({ _id: trackerId, userId: req.user.userId });
    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found" });
    }

    const categories = await CategoryModel.find({ trackerId }).sort({ createdAt: 1 });

    const formattedCategories = categories.map(category => ({
      id: (category._id as any).toString(),
      trackerId: category.trackerId,
      name: category.name,
      subcategories: category.subcategories,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    res.json({ categories: formattedCategories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new category
app.post("/api/trackers/:trackerId/categories", authenticateToken, async (req: any, res) => {
  try {
    const { trackerId } = req.params;
    const { name, subcategories = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Verify tracker belongs to user
    const tracker = await TrackerModel.findOne({ _id: trackerId, userId: req.user.userId });
    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found" });
    }

    const category = new CategoryModel({
      trackerId,
      name,
      subcategories,
    });

    await category.save();

    res.status(201).json({
      message: "Category created successfully",
      category: {
        id: (category._id as any).toString(),
        trackerId: category.trackerId,
        name: category.name,
        subcategories: category.subcategories,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a category
app.put("/api/trackers/:trackerId/categories/:categoryId", authenticateToken, async (req: any, res) => {
  try {
    const { trackerId, categoryId } = req.params;
    const { name, subcategories } = req.body;

    // Verify tracker belongs to user
    const tracker = await TrackerModel.findOne({ _id: trackerId, userId: req.user.userId });
    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found" });
    }

    const category = await CategoryModel.findOneAndUpdate(
      { _id: categoryId, trackerId },
      { name, subcategories },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      message: "Category updated successfully",
      category: {
        id: (category._id as any).toString(),
        trackerId: category.trackerId,
        name: category.name,
        subcategories: category.subcategories,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a category
app.delete("/api/trackers/:trackerId/categories/:categoryId", authenticateToken, async (req: any, res) => {
  try {
    const { trackerId, categoryId } = req.params;

    // Verify tracker belongs to user
    const tracker = await TrackerModel.findOne({ _id: trackerId, userId: req.user.userId });
    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found" });
    }

    const category = await CategoryModel.findOneAndDelete({ _id: categoryId, trackerId });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      message: "Category deleted successfully",
      id: categoryId,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

