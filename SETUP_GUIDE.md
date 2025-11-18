# 🚀 Quick Setup Guide - New Usage Tracking System

## Steps to Deploy

### 1. Install Dependencies (if needed)
```bash
cd server
npm install
```

### 2. Start the Server
```bash
npm run dev
```

The new system will automatically start logging usage to the new schemas.

### 3. Run Migration (One-time, Optional)
If you have existing data in the old Message collection:

```bash
# From server directory
npm run migrate:usage
```

This will:
- ✅ Read all old messages
- ✅ Create UsageLog entries (detailed logs)
- ✅ Create Usage entries (daily aggregates)
- ✅ Preserve tracker names at time of usage
- ✅ Mark deleted trackers appropriately
- ⚠️ Leave old Message collection intact

### 4. Restart and Test
```bash
# Restart server
npm run dev

# In another terminal, start frontend
cd ../client
npm run dev
```

### 5. Verify in UI
1. Open browser to http://localhost:3000
2. Login and navigate to Usage page
3. You should see:
   - ✅ All trackers with usage data
   - ✅ Deleted trackers with "Deleted" badge
   - ✅ All historical messages preserved
   - ✅ Daily usage graphs working

### 6. Test Functionality

#### Test 1: Create New Usage
```
1. Go to any tracker
2. Add an expense via chat: "Spent 500 on lunch"
3. Go to Usage page
4. Verify the message and tokens are tracked
```

#### Test 2: Delete Tracker
```
1. Create a test tracker
2. Add some expenses to it
3. Check Usage page (should show data)
4. Delete the tracker
5. Go back to Usage page
6. Verify: Tracker still shows with "Deleted" badge
7. Verify: All usage data still accessible
```

#### Test 3: Rename Tracker
```
1. Create a tracker named "Test Old"
2. Add expenses to it
3. Check Usage page (shows "Test Old")
4. Rename tracker to "Test New"
5. Add more expenses
6. Check Usage page:
   - Old messages still show under "Test Old"
   - New messages show under "Test New"
```

## 🐛 Troubleshooting

### Issue: No usage data showing
**Solution:**
1. Check browser console for errors
2. Check server logs for database connection
3. Verify MongoDB is running
4. Run migration if you have old data

### Issue: Migration fails
**Solution:**
1. Check MongoDB connection string in .env
2. Ensure MongoDB is running
3. Check server logs for specific error
4. Try running migration again (it's idempotent)

### Issue: Deleted trackers not showing
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check if markTrackerAsDeleted was called (check server logs)
3. Manually verify in MongoDB:
   ```javascript
   db.usages.find({ 'trackerSnapshot.isDeleted': true })
   ```

### Issue: Tracker rename not reflecting in old data
**Solution:**
This is expected behavior! Old data should show old name.
Only new usage after rename should show new name.

## 📊 Verify Migration Success

### Check Database
```bash
# Connect to MongoDB
mongosh

# Switch to your database
use expense-tracker

# Check Usage collection
db.usages.countDocuments()  // Should have records

# Check UsageLog collection  
db.usagelogs.countDocuments()  // Should have same count as old messages

# Check for deleted trackers
db.usages.find({ 'trackerSnapshot.isDeleted': true })

# Sample a few records
db.usages.find().limit(3).pretty()
db.usagelogs.find().limit(3).pretty()
```

### Check Frontend
1. Open Usage page
2. Overall stats should show all data
3. Tracker dropdown should list all trackers (including deleted ones)
4. Selecting deleted tracker should show full history
5. "Deleted" badge should appear on deleted tracker cards

## 🎯 Success Criteria

- [x] New schemas created (Usage, UsageLog)
- [x] Utility functions working (logUsage, markTrackerAsDeleted, etc.)
- [x] Parse-expense endpoint logging to new schemas
- [x] Tracker delete marks usage as deleted
- [x] Tracker rename updates future usage
- [x] Frontend shows deleted tracker badge
- [x] All historical data preserved
- [x] Migration script available
- [x] No TypeScript errors
- [x] No runtime errors

## 📞 Need Help?

Check these files for detailed information:
- `REDESIGN_SUMMARY.md` - Overview and what changed
- `USAGE_TRACKING_REDESIGN.md` - Complete technical documentation
- Server logs - All operations logged with emoji prefixes
- Browser console - Frontend API responses logged

## ✅ You're Done!

Your usage tracking system is now redesigned and production-ready!

**Key Achievement:** Data will NEVER be lost when trackers are deleted or renamed! 🎉
