# SendGrid Setup Guide for HelpSavta

This guide explains how to configure SendGrid for the HelpSavta application with Hebrew RTL support.

## Prerequisites

- Azure subscription with HelpSavta infrastructure deployed
- Access to Azure Key Vault
- SendGrid account

## Step 1: Create SendGrid Account

1. Go to [https://sendgrid.com/](https://sendgrid.com/)
2. Sign up for a new account or log in to existing account
3. Choose an appropriate plan (Free tier allows 100 emails/day, Essentials starts at $14.95/month)

## Step 2: Generate API Key

1. In SendGrid dashboard, go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Grant the following permissions:
   - **Mail Send**: Full Access
   - **Mail Settings**: Read Access (for templates)
   - **Template Engine**: Full Access (if using dynamic templates)
5. Copy the generated API key (you won't see it again!)

## Step 3: Configure Sender Authentication

### Option A: Domain Authentication (Recommended for Production)
1. Go to **Settings** > **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain: `helpsavta.co.il`
4. Add the provided DNS records to your domain registrar
5. Verify the domain

### Option B: Single Sender Verification (Quick Start)
1. Go to **Settings** > **Sender Authentication**
2. Click **Create Single Sender**
3. Fill in the form:
   - **From Name**: Help Savta
   - **From Email Address**: noreply@helpsavta.co.il
   - **Reply To**: support@helpsavta.co.il
   - **Company Address**: Your organization address
4. Verify the email address

## Step 4: Update Azure Key Vault

Update the SendGrid API key in Azure Key Vault:

```bash
# Set your environment variables
SUBSCRIPTION_ID="6720ecf6-4ad2-4909-b6b6-4696eb862b26"
RESOURCE_GROUP="helpsavta-prod-rg"
KEY_VAULT_NAME="helpsavta-production-kv"
SENDGRID_API_KEY="your-actual-sendgrid-api-key"

# Set subscription
az account set --subscription $SUBSCRIPTION_ID

# Update the API key
az keyvault secret set \
    --vault-name $KEY_VAULT_NAME \
    --name "sendgrid-api-key" \
    --value "$SENDGRID_API_KEY"

# Verify other email settings
az keyvault secret show --vault-name $KEY_VAULT_NAME --name "email-host"
az keyvault secret show --vault-name $KEY_VAULT_NAME --name "email-port"
az keyvault secret show --vault-name $KEY_VAULT_NAME --name "email-user"
az keyvault secret show --vault-name $KEY_VAULT_NAME --name "email-from"
```

## Step 5: Configure Email Templates for Hebrew RTL

The HelpSavta application includes pre-built email templates with Hebrew RTL support:

### Template Features:
- **RTL Direction**: All templates use `dir="rtl"` for proper Hebrew text flow
- **Hebrew Fonts**: Font stack includes Hebrew-compatible fonts
- **Responsive Design**: Mobile-friendly layouts
- **Professional Styling**: Clean, accessible design

### Available Templates:
1. **Request Created** (`request-created`): Sent when a new help request is submitted
2. **Status Update** (`status-update`): Sent when request status changes
3. **Request Completed** (`request-completed`): Sent when help is completed

### Template Locations:
- Templates: `backend/src/templates/email/`
- Configuration: `backend/src/config/emailTemplateConfig.ts`
- Service: `backend/src/services/emailService.ts`

## Step 6: Test Email Configuration

After updating the API key, test the email service:

```bash
# Navigate to backend directory
cd backend

# Install dependencies if not already done
npm install

# Test email configuration
npm run test:email

# Or test specific template
node -e "
const { emailService } = require('./src/services/emailService');
emailService.sendTestEmail('request-created', 'test@example.com')
  .then(success => console.log('Test email sent:', success))
  .catch(err => console.error('Test failed:', err));
"
```

## Step 7: Environment Variables

Ensure the following environment variables are configured in your Azure App Service:

```bash
# Email configuration
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=<from-key-vault:sendgrid-api-key>
EMAIL_FROM=noreply@helpsavta.co.il
EMAIL_SECURE=true
```

## Step 8: Monitor Email Delivery

1. **SendGrid Dashboard**: Monitor email stats in SendGrid dashboard
2. **Azure Application Insights**: Check for email-related logs and errors
3. **Database Logs**: Review `notification_log` table for delivery status

### Common Issues and Solutions:

#### Issue: Emails not sending
- Check API key is correctly set in Key Vault
- Verify sender authentication is complete
- Check Azure App Service environment variables

#### Issue: Emails going to spam
- Complete domain authentication
- Add SPF, DKIM, and DMARC records
- Monitor sender reputation in SendGrid

#### Issue: Hebrew text not displaying correctly
- Ensure templates use UTF-8 encoding
- Verify RTL direction is set
- Check font compatibility

## Step 9: Production Considerations

### Scaling:
- Monitor SendGrid usage against plan limits
- Set up alerts for high email volume
- Consider upgrading plan as user base grows

### Security:
- Rotate API keys regularly
- Use restricted API keys with minimal permissions
- Monitor for unauthorized API usage

### Compliance:
- Implement unsubscribe functionality
- Follow GDPR requirements for EU users
- Maintain email delivery logs for auditing

## Support

For technical issues:
- SendGrid Documentation: [https://docs.sendgrid.com/](https://docs.sendgrid.com/)
- SendGrid Support: Available through dashboard
- Azure Support: For Key Vault and App Service issues

For HelpSavta-specific issues:
- Check Application Insights logs
- Review email service logs in backend application
- Test email templates using built-in test functions