import express, { Express } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import ExpenseModel from '../../src/models/Expense';
import TrackerModel from '../../src/models/Tracker';
import UserModel from '../../src/models/User';
import OTPModel from '../../src/models/OTP';
import CategoryModel from '../../src/models/Category';
import { ExpenseParser } from '../../src/services/expenseParser';
import { AnalyticsService } from '../../src/services/analyticsService';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../src/config/categories';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

/**
 * Create test Express app with all routes
 * This mirrors the actual server setup for testing
 */
export const createTestApp = (): Express => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // Authentication middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  };

  // ============ HEALTH CHECK ============
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // ============ AUTH ROUTES ============
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { name, phone, password, accountType = 'individual' } = req.body;

      if (!name || !phone || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingUser = await UserModel.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }

      const user = new UserModel({
        name,
        phone,
        password,
        accountType,
        phoneVerified: false,
        emailVerified: false,
      });

      await user.save();

      const token = jwt.sign({ userId: user._id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          accountType: user.accountType,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and password are required' });
      }

      const user = await UserModel.findOne({ phone }).select('+password');
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          accountType: user.accountType,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          profilePhoto: user.profilePhoto,
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await UserModel.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          profilePhoto: user.profilePhoto,
          accountType: user.accountType,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
        }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============ EXPENSE ROUTES ============
  app.get('/api/categories', (req, res) => {
    res.json({
      categories: EXPENSE_CATEGORIES,
      paymentMethods: PAYMENT_METHODS,
    });
  });

  app.post('/api/parse-expense', async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const parsed = await ExpenseParser.parseExpense(message);

      if ('error' in parsed) {
        return res.status(400).json(parsed);
      }

      res.json(parsed);
    } catch (error) {
      console.error('Error parsing expense:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const { amount, category, subcategory, categoryId, paymentMethod, description, timestamp, trackerId } = req.body;

      if (!amount || !category || !subcategory || !categoryId || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

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
        message: 'Expense logged successfully',
        expense: {
          id: (expense._id as any).toString(),
          amount: expense.amount,
          category: expense.category,
          subcategory: expense.subcategory,
          categoryId: expense.categoryId,
          paymentMethod: expense.paymentMethod,
          description: expense.description,
          timestamp: expense.timestamp,
          trackerId: (expense as any).trackerId,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/expenses', async (req, res) => {
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
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/expenses/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, category, subcategory, categoryId, paymentMethod, description, timestamp } = req.body;

      const expense = await ExpenseModel.findByIdAndUpdate(
        id,
        { amount, category, subcategory, categoryId, paymentMethod, description, timestamp },
        { new: true, runValidators: true }
      );

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json({
        message: 'Expense updated successfully',
        expense: {
          id: (expense._id as any).toString(),
          amount: expense.amount,
          category: expense.category,
          subcategory: expense.subcategory,
          categoryId: expense.categoryId,
          paymentMethod: expense.paymentMethod,
          description: expense.description,
          timestamp: expense.timestamp,
          trackerId: (expense as any).trackerId,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/expenses/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const expense = await ExpenseModel.findByIdAndDelete(id);

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json({
        message: 'Expense deleted successfully',
        id,
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============ TRACKER ROUTES ============
  app.get('/api/trackers', authenticateToken, async (req: any, res) => {
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
      console.error('Error fetching trackers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/trackers', authenticateToken, async (req: any, res) => {
    try {
      const { name, type, description, currency } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const tracker = new TrackerModel({
        userId: req.user.userId,
        name,
        type,
        description,
        currency: currency || 'INR',
      });

      await tracker.save();

      res.status(201).json({
        message: 'Tracker created successfully',
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
      console.error('Error creating tracker:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/trackers/:id', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tracker = await TrackerModel.findOne({ _id: id, userId: req.user.userId });

      if (!tracker) {
        return res.status(404).json({ error: 'Tracker not found' });
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
      console.error('Error fetching tracker:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/trackers/:id', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, type, description, currency } = req.body;

      const tracker = await TrackerModel.findOneAndUpdate(
        { _id: id, userId: req.user.userId },
        { name, type, description, currency },
        { new: true, runValidators: true }
      );

      if (!tracker) {
        return res.status(404).json({ error: 'Tracker not found' });
      }

      res.json({
        message: 'Tracker updated successfully',
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
      console.error('Error updating tracker:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/trackers/:id', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;

      const tracker = await TrackerModel.findOneAndDelete({ _id: id, userId: req.user.userId });

      if (!tracker) {
        return res.status(404).json({ error: 'Tracker not found' });
      }

      await ExpenseModel.deleteMany({ trackerId: id });
      await CategoryModel.deleteMany({ trackerId: id });

      res.json({
        message: 'Tracker and associated expenses deleted successfully',
        id,
      });
    } catch (error) {
      console.error('Error deleting tracker:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============ CATEGORY ROUTES ============
  app.get('/api/trackers/:trackerId/categories', authenticateToken, async (req: any, res) => {
    try {
      const { trackerId } = req.params;

      const tracker = await TrackerModel.findOne({ _id: trackerId, userId: req.user.userId });
      if (!tracker) {
        return res.status(404).json({ error: 'Tracker not found' });
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
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/trackers/:trackerId/categories', authenticateToken, async (req: any, res) => {
    try {
      const { trackerId } = req.params;
      const { name, subcategories = [] } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const tracker = await TrackerModel.findOne({ _id: trackerId, userId: req.user.userId });
      if (!tracker) {
        return res.status(404).json({ error: 'Tracker not found' });
      }

      const category = new CategoryModel({
        trackerId,
        name,
        subcategories,
      });

      await category.save();

      res.status(201).json({
        message: 'Category created successfully',
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
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/trackers/:trackerId/categories/:categoryId', authenticateToken, async (req: any, res) => {
    try {
      const { trackerId, categoryId } = req.params;
      const { name, subcategories } = req.body;

      const tracker = await TrackerModel.findOne({ _id: trackerId, userId: req.user.userId });
      if (!tracker) {
        return res.status(404).json({ error: 'Tracker not found' });
      }

      const category = await CategoryModel.findOneAndUpdate(
        { _id: categoryId, trackerId },
        { name, subcategories },
        { new: true }
      );

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({
        message: 'Category updated successfully',
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
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/trackers/:trackerId/categories/:categoryId', authenticateToken, async (req: any, res) => {
    try {
      const { trackerId, categoryId } = req.params;

      const tracker = await TrackerModel.findOne({ _id: trackerId, userId: req.user.userId });
      if (!tracker) {
        return res.status(404).json({ error: 'Tracker not found' });
      }

      const category = await CategoryModel.findOneAndDelete({ _id: categoryId, trackerId });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({
        message: 'Category deleted successfully',
        id: categoryId,
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============ ANALYTICS ROUTES ============
  app.get('/api/analytics/summary', async (req, res) => {
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
      
      const stats = await AnalyticsService.getSummaryStats(query);
      
      res.json({ stats, filter: filter || 'all', dateRange });
    } catch (error) {
      console.error('Error fetching summary analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/analytics/by-category', async (req, res) => {
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
      
      res.json({ data, filter: filter || 'all', dateRange });
    } catch (error) {
      console.error('Error fetching category analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/analytics/by-month', async (req, res) => {
    try {
      const { year, trackerId } = req.query;
      const targetYear = year ? parseInt(year as string) : undefined;
      
      const data = await AnalyticsService.getExpensesByMonth(targetYear, trackerId as string | undefined);
      
      res.json({ data, year: targetYear || new Date().getFullYear() });
    } catch (error) {
      console.error('Error fetching monthly analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/analytics/total', async (req, res) => {
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
      console.error('Error fetching total:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
};
