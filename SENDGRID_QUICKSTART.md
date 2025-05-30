# SendGrid Quick Start Guide - HelpSavta Production

## 🚀 Fast Track to Email Service

This guide will get your SendGrid email service running in **under 10 minutes**.

---

## Step 1: Create SendGrid Account (2 minutes)

1. **Sign up**: Go to https://sendgrid.com/
2. **Choose plan**: 
   - **Free Tier**: 100 emails/day (good for testing)
   - **Essentials**: $14.95/month, 50K emails/month (recommended for production)
3. **Verify email**: Complete account verification

---

## Step 2: Generate API Key (1 minute)

1. **Login** to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. **Name**: `HelpSavta Production`
5. **Permissions**: Choose **Restricted Access**
6. **Grant permissions**:
   - ✅ **Mail Send**: Full Access
   - ✅ **Mail Settings**: Read Access
7. **Copy the API key** (you won't see it again!)

---

## Step 3: Configure Sender Authentication (3 minutes)

### Option A: Single Sender (Quick - 1 minute)
1. Go to **Settings** → **Sender Authentication**
2. Click **Create Single Sender**
3. Fill the form:
   ```
   From Name: Help Savta
   From Email: noreply@helpsavta.co.il
   Reply To: support@helpsavta.co.il
   Company Name: Help Savta
   Address: [Your organization address]
   ```
4. **Verify** the email address

### Option B: Domain Authentication (Recommended - 3 minutes)
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter domain: `helpsavta.co.il`
4. Add DNS records provided by SendGrid to your domain
5. **Verify** domain authentication

---

## Step 4: Update Azure Configuration (2 minutes)

### Automated Method (Recommended)
```bash
# Run the update script
./scripts/update-sendgrid-keyvault.sh

# When prompted, enter:
# - Your SendGrid API key
# - From email: noreply@helpsavta.co.il
```

### Manual Method
```bash
# Set your API key
SENDGRID_API_KEY="SG.your-api-key-here"

# Update Azure Key Vault
az keyvault secret set \
    --vault-name "helpsavta-production-kv" \
    --name "sendgrid-api-key" \
    --value "$SENDGRID_API_KEY"

# Restart backend
az webapp restart \
    --name "helpsavta-production-backend" \
    --resource-group "helpsavta-prod-rg"
```

---

## Step 5: Test Email Service (2 minutes)

```bash
# Install Node.js dependencies (if not done)
cd backend && npm install

# Test SendGrid integration
export SENDGRID_API_KEY="your-api-key"
node ../scripts/test-sendgrid-integration.js your-email@example.com
```

**Expected output**:
```
✅ חיבור ל-SendGrid הצליח!
✅ אימייל נשלח בהצלחה ל-your-email@example.com
✅ תבנית עברית נשלחה ל-your-email@example.com
🎉 כל הבדיקות עברו בהצלחה! SendGrid מוכן לייצור.
```

---

## 🎯 Verification Checklist

- [ ] SendGrid account created and verified
- [ ] API key generated with Mail Send permissions
- [ ] Sender authentication completed (single sender OR domain)
- [ ] Azure Key Vault updated with API key
- [ ] Backend App Service restarted
- [ ] Email test successful with Hebrew RTL templates

---

## 🚨 Common Issues & Quick Fixes

### ❌ "Authentication failed"
- **Check**: API key is correct and has Mail Send permissions
- **Fix**: Regenerate API key in SendGrid dashboard

### ❌ "Sender not verified"
- **Check**: Single sender email verified OR domain authenticated
- **Fix**: Complete sender authentication in SendGrid

### ❌ "Connection timeout"
- **Check**: Network connectivity and firewall settings
- **Fix**: Verify Azure App Service can reach smtp.sendgrid.net:587

### ❌ "Hebrew text not displaying"
- **Check**: Email client supports UTF-8 and RTL
- **Fix**: Templates already configured with proper encoding

---

## 📧 Test Emails

After successful setup, you should receive test emails with:

1. **Basic connectivity test**: Simple Hebrew email confirming connection
2. **Template test**: Professional Help Savta email with RTL layout
3. **Production-style**: Sample request notification with all features

---

## 🎉 Success!

Once all tests pass, your email service is **production ready**!

**Next steps**:
1. Monitor SendGrid dashboard for delivery statistics
2. Check Application Insights for email-related logs
3. Test the complete user flow from website to email notification

---

## 📞 Need Help?

- **SendGrid Issues**: Check SendGrid documentation or support
- **Azure Issues**: Use Azure Portal support or documentation
- **Application Issues**: Check Application Insights logs

**Quick diagnostics**:
```bash
# Check application health
curl https://helpsavta-production-backend.azurewebsites.net/health

# Run full production verification
node scripts/production-verification.js
```

---

*Setup time: ~10 minutes*  
*Difficulty: Beginner friendly*  
*Support: Full Hebrew RTL email templates included*