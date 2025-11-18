# Usage Tracking System - Redesign Documentation

## 🎯 Problem Solved

The previous usage tracking system had a critical flaw: when a tracker was deleted, all usage history was lost. Additionally, if a tracker was renamed or modified, the historical data would show the new name, making it impossible to track what the tracker was called at the time of usage.

## 🏗️ New Architecture

### Database Schema

#### 1. **Usage Model** (`server/src/models/Usage.ts`)
Stores daily aggregated usage statistics per tracker with a snapshot of tracker information.

```typescript
{
  userId: ObjectId,
  date: Date (day only, no time),
  trackerSnapshot: {
    trackerId: string,
    trackerName: string,
    trackerType: 'business' | 'personal',
    isDeleted: boolean,
    deletedAt?: Date,
    modifiedAt?: Date
  },
  totalMessages: number,
  userMessages: number,
  aiMessages: number,
  totalTokens: number
}
```

**Key Features:**
- Stores tracker information as a snapshot (not a reference)
- Tracks if tracker was deleted and when
- Aggregates data by day for efficient queries
- Preserves historical tracker names

#### 2. **UsageLog Model** (`server/src/models/UsageLog.ts`)
Stores detailed message-level logs with tracker snapshot.

```typescript
{
  userId: ObjectId,
  trackerSnapshot: {
    trackerId: string,
    trackerName: string,
    trackerType: string,
    isDeleted: boolean,
    deletedAt?: Date,
    modifiedAt?: Date
  },
  messageRole: 'user' | 'assistant',
  messageContent: string,
  tokenCount: number,
  timestamp: Date
}
```

**Key Features:**
- Complete message history preserved
- Tracker snapshot at time of message
- Efficient indexing for queries
- Never loses data when tracker is deleted

### Utility Functions

#### `server/src/utils/usageLogger.ts`

**`createTrackerSnapshot(tracker)`**
Creates a snapshot of tracker information at the current moment.

**`logUsage(userId, trackerSnapshot, messageRole, messageContent, tokenCount)`**
Logs both detailed message and updates daily aggregate.

**`markTrackerAsDeleted(trackerId)`**
Marks all usage records when a tracker is deleted (called automatically).

**`updateTrackerInUsage(trackerId, newName, newType)`**
Updates tracker info in all future usage records when tracker is modified (called automatically).

## 🔄 Integration Points

### 1. Parse Expense Endpoint (`server/src/index.ts`)
```typescript
// Before parsing
const tracker = await Tracker.findOne({ _id: trackerId, userId });
const trackerSnapshot = createTrackerSnapshot(tracker);
await logUsage(userId, trackerSnapshot, 'user', message, userTokens);

// After parsing
await logUsage(userId, trackerSnapshot, 'assistant', response, aiTokens);
```

### 2. Tracker Delete (`server/src/index.ts`)
```typescript
app.delete("/api/trackers/:id", async (req, res) => {
  await TrackerModel.findOneAndDelete({ _id: id });
  
  // Automatically marks all usage records as deleted
  await markTrackerAsDeleted(id);
  
  await ExpenseModel.deleteMany({ trackerId: id });
  await CategoryModel.deleteMany({ trackerId: id });
});
```

### 3. Tracker Update (`server/src/index.ts`)
```typescript
app.put("/api/trackers/:id", async (req, res) => {
  const tracker = await TrackerModel.findOneAndUpdate(
    { _id: id },
    { name, type, description, currency },
    { new: true }
  );
  
  // Automatically updates all usage records
  await updateTrackerInUsage(id, tracker.name, tracker.type);
});
```

## 📊 API Changes

### GET `/api/usage/overall`
Returns usage across all trackers, including deleted ones.

**Response:**
```json
{
  "overall": {
    "totalMessages": 150,
    "totalTokens": 45000,
    "userMessages": 75,
    "aiMessages": 75
  },
  "byTracker": [
    {
      "trackerId": "abc123",
      "trackerName": "Business Expenses",
      "trackerType": "business",
      "isDeleted": false,
      "messageCount": 100,
      "tokenCount": 30000
    },
    {
      "trackerId": "def456",
      "trackerName": "Old Tracker",
      "trackerType": "personal",
      "isDeleted": true,
      "deletedAt": "2025-01-15T10:30:00Z",
      "messageCount": 50,
      "tokenCount": 15000
    }
  ],
  "recentActivity": [...]
}
```

### GET `/api/usage/tracker/:trackerId`
Returns detailed usage for a specific tracker (works even if tracker is deleted).

**Response:**
```json
{
  "tracker": {
    "trackerId": "abc123",
    "trackerName": "Business Expenses",
    "trackerType": "business",
    "isDeleted": false
  },
  "usage": {
    "totalMessages": 100,
    "totalTokens": 30000,
    "userMessages": 50,
    "aiMessages": 50
  },
  "dailyUsage": [...],
  "messages": [
    {
      "_id": "msg123",
      "role": "user",
      "content": "Spent 500 on lunch",
      "tokenCount": 15,
      "timestamp": "2025-01-18T12:00:00Z"
    }
  ]
}
```

## 🎨 Frontend Updates

### UI Enhancements
1. **Deleted Tracker Badge**: Shows red "Deleted" chip on tracker cards
2. **Deleted Tracker in Dropdown**: Deleted trackers still appear with "(Deleted)" suffix
3. **Usage History Preserved**: All historical data remains accessible
4. **Rename Tracking**: Future logs show new name, but historical data shows what it was called then

### Interface Changes (`client/src/components/Usage/Usage.tsx`)

```typescript
interface TrackerUsageData {
  tracker: {
    trackerId: string;
    trackerName: string;
    trackerType: string;
    isDeleted: boolean;
    deletedAt?: string;
  };
  usage: {
    totalMessages: number;
    totalTokens: number;
    userMessages: number;
    aiMessages: number;
  };
  dailyUsage: [...];
  messages: [...];
}
```

## 🔧 Migration

### Running the Migration Script

```bash
# From server directory
cd server

# Run migration
npm run migrate:usage

# Or manually with ts-node
npx ts-node src/scripts/migrateUsageData.ts
```

The migration script:
1. ✅ Reads all old Message records
2. ✅ Creates tracker snapshots (marks unknown trackers as deleted)
3. ✅ Inserts into UsageLog (detailed logs)
4. ✅ Aggregates into Usage (daily summaries)
5. ✅ Preserves all historical data
6. ⚠️ Leaves old Message collection intact (delete manually after verification)

## 📝 Benefits

### Before ❌
- Delete tracker → lose all usage history
- Rename tracker → historical data shows new name
- No way to track deleted trackers
- Confusing when tracker was renamed multiple times

### After ✅
- Delete tracker → usage history preserved with "Deleted" badge
- Rename tracker → new logs use new name, old logs show old name
- Full visibility into deleted trackers
- Historical accuracy maintained
- Can track usage trends even for deleted trackers

## 🚨 Important Notes

1. **Tracker Snapshots**: Every time usage is logged, current tracker information is captured
2. **Automatic Updates**: Tracker deletion/modification automatically updates usage records
3. **Data Preservation**: Usage data is NEVER deleted, only marked
4. **Query Efficiency**: Compound indexes ensure fast queries even with snapshots
5. **Migration Safety**: Old data is not touched during migration (can rollback if needed)

## 🔮 Future Enhancements

- [ ] Export usage reports with deleted tracker information
- [ ] Graph showing timeline of tracker renames
- [ ] Restore deleted tracker from usage history
- [ ] Compare usage before/after tracker rename
- [ ] Archive old deleted tracker data after X months

## 📞 Support

For issues or questions about the new usage tracking system, check:
- Database logs: All operations are logged with emoji prefixes (✅ ❌ 📊)
- Frontend console: Detailed response logging
- Migration logs: Step-by-step migration progress
