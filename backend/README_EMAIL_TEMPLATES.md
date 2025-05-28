# Email Template System - Help Savta

מערכת תבניות אימייל מקצועית עם תמיכה בעברית RTL

## 🚀 Overview

This email template system provides professional, Hebrew-RTL compatible email templates for the Help Savta technical support platform. It separates email content from service logic using Handlebars templates.

## 📁 File Structure

```
backend/src/
├── templates/email/
│   ├── base.hbs                    # Base template with Hebrew RTL styling
│   ├── request-created.hbs         # Welcome email for new requests
│   ├── status-update.hbs          # Status change notifications
│   └── request-completed.hbs      # Completion confirmation
├── services/
│   ├── emailService.ts            # Updated with template integration
│   └── templateService.ts         # Template compilation and rendering
├── types/
│   └── emailTemplates.ts          # TypeScript interfaces
├── utils/
│   └── emailUtils.ts              # Data generation and validation
├── config/
│   └── emailTemplateConfig.ts     # Integration configuration
└── routes/
    └── test.ts                    # Testing endpoints
```

## ✨ Features

### 🎨 Professional Hebrew RTL Design
- Right-to-left text direction
- Hebrew font stack (Segoe UI, Tahoma, Arial)
- Responsive mobile design
- Consistent branding and color scheme

### 📧 Three Template Types
1. **Request Created** (`request-created`) - Welcome email when user submits request
2. **Status Update** (`status-update`) - Notification when request moves to "in_progress"
3. **Request Completed** (`request-completed`) - Confirmation when request is finished

### 🔧 Smart Fallback System
- Automatic fallback to basic HTML if templates fail
- Graceful degradation if template service is not ready
- Error logging without breaking email functionality

### 🌍 Hebrew Localization
- All text in Hebrew
- Urgency level translations (דחוף, גבוה, בינוני, נמוך)
- Status translations
- Date/time formatting helpers

## 🛠️ API Endpoints for Testing

### Test Template Compilation
```bash
GET /api/test/email-templates
```
Tests all template compilation and returns results.

### Preview Templates in Browser
```bash
GET /api/test/preview-template/request-created
GET /api/test/preview-template/status-update  
GET /api/test/preview-template/request-completed
```
Returns rendered HTML for browser preview with mock data.

### Send Test Emails
```bash
POST /api/test/send-test-email
Content-Type: application/json

{
  "templateType": "request-created",
  "email": "your-test-email@example.com"
}
```

### Template Service Status
```bash
GET /api/test/template-status
```
Returns current status of template and email services.

## 📝 Template Data Structure

### Request Created Template
```typescript
{
  request: {
    id: number,
    full_name: string,
    email: string,
    phone: string,
    address: string,
    problem_description: string,
    urgency_level: 'low' | 'medium' | 'high' | 'urgent',
    created_at: string,
    notes?: string
  },
  urgencyLabel: string,        // Hebrew translation
  responseTime: string,        // Expected response time
  supportEmail: string,
  supportPhone: string
}
```

### Status Update Template
```typescript
{
  // ... all request fields
  admin: {
    id: number,
    username: string
  },
  previousStatus: string,
  newStatus: string,
  statusLabel: string,         // Hebrew translation
  nextSteps: string[]
}
```

### Request Completed Template
```typescript
{
  // ... all request and admin fields
  slot?: {
    id: number,
    date: string,
    start_time: string,
    end_time: string
  },
  completedAt: string,
  maintenanceTips: string[]
}
```

## 🔧 Integration with Existing Code

### Updated Email Service Methods

```typescript
// New template-based methods
await emailService.sendRequestCreatedEmail(request);
await emailService.sendStatusUpdateEmailTemplate(request, admin);
await emailService.sendRequestCompletedEmail(request, admin, slot);

// Legacy methods still available for fallback
await emailService.sendApprovalEmail(email, name, date, time, id);
await emailService.sendStatusUpdateEmail(email, name, id, status);
```

### Automatic Integration

The system is already integrated into:
- **POST /api/requests** - Sends `request-created` email automatically
- **PUT /api/requests/:id** - Sends `status-update` email when status changes to "in_progress"

## 🧪 Testing Guide

### 1. Test Template Compilation
```bash
curl http://localhost:3001/api/test/email-templates
```

Expected response:
```json
{
  "success": true,
  "templateServiceReady": true,
  "emailServiceReady": true,
  "testResults": {
    "success": true,
    "results": [
      {
        "template": "request-created",
        "success": true,
        "hasHtml": true,
        "hasText": true,
        "subject": "בקשה #123 התקבלה - Help Savta"
      }
      // ... more results
    ]
  }
}
```

### 2. Preview Templates
Open in browser:
- http://localhost:3001/api/test/preview-template/request-created
- http://localhost:3001/api/test/preview-template/status-update
- http://localhost:3001/api/test/preview-template/request-completed

### 3. Send Test Email
```bash
curl -X POST http://localhost:3001/api/test/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"templateType": "request-created", "email": "test@example.com"}'
```

### 4. Test Real Request Flow
```bash
# Create a new request
curl -X POST http://localhost:3001/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "יוסי כהן",
    "phone": "050-1234567",
    "email": "yossi@example.com",
    "address": "רחוב הרצל 10, תל אביב",
    "problem_description": "המחשב לא עובד",
    "urgency_level": "medium"
  }'

# Update status to trigger status update email
curl -X PUT http://localhost:3001/api/requests/[ID] \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

## 🎯 Template Customization

### Modify Template Content
Edit files in `backend/src/templates/email/`:
- `base.hbs` - Overall layout and styling
- `request-created.hbs` - Welcome email content
- `status-update.hbs` - Status change notification
- `request-completed.hbs` - Completion confirmation

### Add New Template Variables
1. Update interfaces in `backend/src/types/emailTemplates.ts`
2. Modify data generation in `backend/src/utils/emailUtils.ts`
3. Use in templates with `{{variableName}}`

### Add Handlebars Helpers
Edit `backend/src/services/templateService.ts` to add custom helpers:

```typescript
Handlebars.registerHelper('customHelper', (value) => {
  return `Custom: ${value}`;
});
```

## 🚨 Troubleshooting

### Templates Not Loading
- Check file paths in `backend/src/templates/email/`
- Verify file permissions
- Check server logs for template loading messages

### Email Not Sending
- Verify email service configuration (EMAIL_HOST, EMAIL_PORT, etc.)
- Check `/api/test/template-status` endpoint
- Review notification logs in database

### Template Compilation Errors
- Check Handlebars syntax in template files
- Verify all template variables are provided
- Use `/api/test/email-templates` to debug

### Hebrew Text Issues
- Ensure UTF-8 encoding
- Check RTL CSS is applied
- Verify Hebrew fonts are loading

## 📊 Monitoring

### Check Template Service Status
```bash
curl http://localhost:3001/api/test/template-status
```

### View Notification Logs
```bash
curl http://localhost:3001/api/requests/notification-logs
```

### Server Logs
Look for these log messages:
- `📧 Base email template loaded successfully`
- `📧 Email template loaded: [template-name]`
- `📧 [Template type] email sent successfully`
- `❌ Failed to [action]: [error]`

## 🔄 Future Enhancements

- [ ] Admin template for internal notifications
- [ ] SMS template support
- [ ] Template versioning system
- [ ] A/B testing for email templates
- [ ] Template analytics and open rates
- [ ] Multi-language template support
- [ ] Rich text editor for template editing
- [ ] Email template preview in admin panel

---

## 📞 Support

For questions about the email template system:
1. Check the troubleshooting guide above
2. Review server logs for error messages
3. Test individual components using the API endpoints
4. Contact the development team

**Happy emailing! 📧✨**