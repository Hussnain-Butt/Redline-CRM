# RedLine CRM - Functionality Implementation Breakdown

This document breaks down each feature module that currently uses mock data and needs real backend functionality.

---

## 1. Email System Module

### Current State
- UI complete with inbox, compose view, folders
- Mock emails displayed
- AI draft button shows loading animation only

### Required Implementation

#### 1.1 Email Service Integration
- [ ] Create `services/emailService.ts`
- [ ] Integrate SendGrid or Mailgun API
- [ ] Add Gmail/Microsoft OAuth for sending
- [ ] Email signature management

#### 1.2 Database Schema
```sql
CREATE TABLE emails (
  id TEXT PRIMARY KEY,
  contact_id TEXT,
  subject TEXT,
  body TEXT,
  from_email TEXT,
  to_email TEXT,
  status TEXT, -- sent, draft, failed
  sent_at TEXT,
  created_at TEXT
);
```

#### 1.3 Functions to Implement
- `sendEmail(to, subject, body)` - Send via API
- `saveDraft(email)` - Save to database
- `getEmailsByContact(contactId)` - Fetch history
- `generateAIDraft(context)` - Use Gemini API

---

## 2. Templates Module

### Current State
- Template library grid with mock templates
- Category filters working (UI only)
- Create/Preview modals work but don't persist

### Required Implementation

#### 2.1 Database Schema
```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT, -- proposal, follow-up, welcome, custom
  content TEXT,
  variables TEXT, -- JSON array of variable placeholders
  created_at TEXT,
  updated_at TEXT
);
```

#### 2.2 Functions to Implement
- `getAllTemplates()` - Fetch from database
- `createTemplate(template)` - Insert new
- `updateTemplate(id, template)` - Update existing
- `deleteTemplate(id)` - Remove
- `applyVariables(template, contact)` - Replace {{variables}}
- `generateFromCall(callSummary)` - AI-based proposal generation

---

## 3. Reminders/Todo Module

### Current State
- Dashboard with overdue/today/upcoming sections
- Mock reminders displayed
- Create modal works but doesn't save

### Required Implementation

#### 3.1 Database Schema
```sql
CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  contact_id TEXT,
  title TEXT,
  type TEXT, -- call, email, meeting, task
  priority TEXT, -- high, medium, low
  due_date TEXT,
  due_time TEXT,
  notes TEXT,
  status TEXT, -- pending, completed, snoozed
  repeat TEXT, -- none, daily, weekly, monthly
  created_at TEXT
);
```

#### 3.2 Functions to Implement
- `getAllReminders()` - Fetch all
- `getRemindersByStatus(status)` - Filter by pending/completed
- `createReminder(reminder)` - Insert new
- `updateReminder(id, data)` - Update status/reschedule
- `deleteReminder(id)` - Remove
- `getOverdueReminders()` - Due date < now
- `getTodayReminders()` - Due date = today
- `autoCreateFromCall(callSummary)` - AI-detected follow-ups

---

## 4. AI Assistant Module

### Current State
- Chat UI with floating button
- Quick action buttons work (mock responses)
- Hardcoded responses for specific queries

### Required Implementation

#### 4.1 Natural Language Processing
- [ ] Send queries to Gemini API
- [ ] Parse intent (analytics, search, action)
- [ ] Extract entities (contact names, dates, etc.)

#### 4.2 Functions to Implement
- `processQuery(query)` - Main handler
- `queryContacts(naturalQuery)` - Search contacts
- `queryCallLogs(naturalQuery)` - Search calls
- `getAnalytics(query)` - Stats queries
- `executeAction(action)` - Create reminder, send email

---

## 5. Call Recording & Transcription Module

### Current State
- Basic call functionality via Twilio
- No recording playback UI
- No transcription

### Required Implementation

#### 5.1 Database Updates
```sql
ALTER TABLE call_logs ADD COLUMN recording_url TEXT;
ALTER TABLE call_logs ADD COLUMN transcript TEXT;
ALTER TABLE call_logs ADD COLUMN ai_summary TEXT;
```

#### 5.2 Functions to Implement
- `getRecording(callId)` - Fetch audio URL
- `getTranscript(callId)` - Fetch transcript
- `generateSummary(transcript)` - Gemini summarization

---

## 6. Dashboard Widgets Module

### Current State
- Stats cards with real data ✅
- Charts with real data ✅
- Today's Tasks widget - mock data
- AI Insights card - mock insights

### Required Implementation
- [ ] Connect Today's Tasks to reminders table
- [ ] Generate real AI Insights from contact data

---

## Implementation Priority Order

| Priority | Module | Complexity | Dependencies |
|----------|--------|------------|--------------|
| 1 | Reminders | Medium | None |
| 2 | Templates | Medium | None |
| 3 | Dashboard Widgets | Low | Reminders |
| 4 | Email System | High | SendGrid/Gmail API |
| 5 | AI Assistant | High | Gemini API ready |
| 6 | Call Recording | High | Twilio config |

---

## Files to Create/Modify

### New Service Files
- `services/emailService.ts`
- `services/templateService.ts`
- `services/reminderService.ts`
- `services/aiQueryService.ts`

### Database Updates
- `services/database.ts` - Add new tables and queries

### Component Updates
- `components/EmailSystem.tsx` - Connect to service
- `components/Templates.tsx` - Connect to service
- `components/Reminders.tsx` - Connect to service
- `components/AIAssistant.tsx` - Connect to AI service
- `components/Dashboard.tsx` - Connect widgets to real data
