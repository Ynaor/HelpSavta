# SendGrid Setup Instructions for Help Savta

## 📧 Complete SendGrid Configuration Guide

This document provides step-by-step instructions for setting up SendGrid email service for the Help Savta application with the `helpsavta.com` domain.

## 🎯 Quick Setup Summary

✅ **Current Status:**
- SendGrid integration code: **COMPLETE**
- Environment configuration: **READY**
- Test scripts: **AVAILABLE**
- Production configuration: **PREPARED**

❌ **Requires User Action:**
- SendGrid account setup
- API key generation
- Domain authentication
- DNS configuration

---

## 📋 Prerequisites

Before starting, ensure you have:
- Access to SendGrid account (create at https://sendgrid.com)
- Access to DNS management for `helpsavta.com` domain
- Admin access to this Help Savta application

---

## 🚀 Step 1: SendGrid Account Setup

### 1.1 Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for a free account (up to 100 emails/day)
3. Or choose a paid plan for higher volume
4. Complete email verification

### 1.2 Account Verification
1. Complete SendGrid's account verification process
2. This may require business information
3. Wait for approval (usually 24-48 hours for new accounts)

---

## 🔑 Step 2: API Key Generation

### 2.1 Create API Key
1. Login to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose **Restricted Access** (recommended) or **Full Access**

### 2.2 Configure API Key Permissions
If using **Restricted Access**, enable these permissions:
- **Mail Send** → Full Access ✅
- **Mail Settings** → Read Access
- **Tracking** → Read Access
- **Stats** → Read Access

### 2.3 Save API Key
1. Copy the generated API key (starts with `SG.`)
2. **⚠️ IMPORTANT**: Save it securely - you won't see it again!
3. The key should look like: `SG.xxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## ⚙️ Step 3: Application Configuration

### 3.1 Update Environment Variables

#### For Development (.env file):
```bash
# Open backend/.env and update:
SENDGRID_API_KEY=SG.your-actual-api-key-here
EMAIL_FROM=noreply@helpsavta.com
EMAIL_FROM_NAME=Help Savta
EMAIL_REPLY_TO=support@helpsavta.com
SUPPORT_EMAIL=support@helpsavta.com
```

#### For Production:
Update your production environment variables or Azure Key Vault with the same values.

### 3.2 Test the Configuration
Run the test script to verify everything works:

```bash
# Navigate to backend directory
cd backend

# Run the test script
npm run test:sendgrid-standalone yuval3250@gmail.com

# Or test specific email types:
npm run test:sendgrid-standalone yuval3250@gmail.com simple
npm run test:sendgrid-standalone yuval3250@gmail.com template
```

**Expected Results:**
- ✅ Configuration shows API key is set
- ✅ Test emails are sent successfully
- ✅ You receive test emails in your inbox

---

## 🌐 Step 4: Domain Authentication (Recommended)

### 4.1 Why Domain Authentication?
- Improves email deliverability
- Removes "via sendgrid.net" from sender information
- Builds sender reputation
- Required for some email providers

### 4.2 Set Up Domain Authentication
1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Choose your DNS host provider
4. Enter `helpsavta.com` as your domain

### 4.3 DNS Configuration
SendGrid will provide DNS records to add to your domain. Add these to your DNS:

**CNAME Records** (examples - use actual values from SendGrid):
```
em1234.helpsavta.com → u1234567.wl123.sendgrid.net
s1._domainkey.helpsavta.com → s1.domainkey.u1234567.wl123.sendgrid.net
s2._domainkey.helpsavta.com → s2.domainkey.u1234567.wl123.sendgrid.net
```

### 4.4 Verify Domain
1. After adding DNS records, return to SendGrid
2. Click **Verify** to confirm DNS propagation
3. This may take up to 48 hours to complete

---

## 🧪 Step 5: Testing & Verification

### 5.1 Basic Connectivity Test
```bash
cd backend
npm run test:sendgrid-standalone test@example.com simple
```

### 5.2 Full Feature Test
```bash
cd backend
npm run test:sendgrid-standalone your-email@example.com both
```

### 5.3 Production Test (when deployed)
```bash
# Test the full application flow:
# 1. Submit a help request through the website
# 2. Check that confirmation email is received
# 3. Update request status in admin panel
# 4. Verify status update email is received
```

---

## 📊 Step 6: Monitoring & Maintenance

### 6.1 SendGrid Dashboard Monitoring
Monitor these metrics in SendGrid dashboard:
- **Email Activity** - delivery status
- **Stats** - open rates, click rates
- **Suppressions** - bounced/blocked emails
- **Alerts** - delivery issues

### 6.2 Application Monitoring
Check application logs for:
- Email send success/failure rates
- API key authentication errors
- Template rendering issues

### 6.3 Regular Maintenance
- Monitor sending reputation
- Review bounced email addresses
- Update suppression lists
- Rotate API keys periodically (recommended annually)

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### 🚨 Issue: "401 Unauthorized" Error
**Symptoms:** Test script fails with 401 error
**Solutions:**
1. Verify API key is correct in `.env` file
2. Check API key permissions in SendGrid
3. Ensure API key starts with `SG.`
4. Regenerate API key if necessary

#### 🚨 Issue: Emails Not Delivered
**Symptoms:** Test succeeds but emails not received
**Solutions:**
1. Check spam/junk folders
2. Verify recipient email address
3. Check SendGrid activity dashboard
4. Review domain authentication status
5. Check for suppressed email addresses

#### 🚨 Issue: "Template Not Found" Error
**Symptoms:** Template emails fail to render
**Solutions:**
1. Verify template files exist in `backend/src/templates/email/`
2. Check Handlebars syntax in templates
3. Review template service configuration
4. Test with simple email type first

#### 🚨 Issue: Hebrew Text Display Issues
**Symptoms:** Hebrew text appears incorrectly
**Solutions:**
1. Verify UTF-8 encoding in email client
2. Check RTL (right-to-left) CSS in templates
3. Test with different email clients
4. Ensure `dir="rtl" lang="he"` in HTML templates

#### 🚨 Issue: Rate Limiting
**Symptoms:** Emails rejected due to rate limits
**Solutions:**
1. Upgrade SendGrid plan for higher limits
2. Implement email queue in application
3. Space out bulk email sends
4. Contact SendGrid support for limit increases

### 🆘 Getting Help

1. **SendGrid Support:**
   - Documentation: https://docs.sendgrid.com
   - Support Portal: https://support.sendgrid.com
   - Community: https://community.sendgrid.com

2. **Application Support:**
   - Check application logs in backend console
   - Review error messages in test script output
   - Contact development team: support@helpsavta.com

---

## 📈 Production Deployment Checklist

### Before Going Live:
- [ ] SendGrid account verified and approved
- [ ] API key generated and tested
- [ ] Domain authentication completed
- [ ] DNS records verified
- [ ] Test emails received successfully
- [ ] Production environment variables configured
- [ ] Email templates reviewed and approved
- [ ] Monitoring dashboard configured
- [ ] Emergency contact procedures established

### After Going Live:
- [ ] Monitor email delivery rates
- [ ] Check for bounced emails
- [ ] Review user feedback on email content
- [ ] Set up alerts for delivery issues
- [ ] Regular backup of email templates
- [ ] Monitor SendGrid usage and costs

---

## 💡 Best Practices

### Security
- Keep API keys secure and rotate regularly
- Use restricted access API keys
- Monitor for unauthorized usage
- Implement rate limiting in application

### Deliverability
- Complete domain authentication
- Monitor sender reputation
- Manage suppression lists
- Use consistent sending patterns

### User Experience
- Test emails in multiple clients
- Ensure mobile responsiveness
- Use clear, actionable content
- Maintain Hebrew RTL formatting

### Compliance
- Include unsubscribe links (if required)
- Respect user preferences
- Follow local email regulations
- Maintain data privacy standards

---

## 📞 Contact Information

For technical assistance with this setup:
- **Application Support:** support@helpsavta.com
- **Development Team:** Available for setup assistance
- **SendGrid Support:** https://support.sendgrid.com

---

*Last Updated: May 30, 2025*
*Configuration Status: Ready for API Key*
*Domain: helpsavta.com*