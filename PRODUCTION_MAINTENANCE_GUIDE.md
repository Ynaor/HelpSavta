# HelpSavta Production Maintenance Guide

## 🚀 Production Environment Overview

### Application URLs
- **Backend**: https://helpsavta-production-backend.azurewebsites.net
- **Frontend**: https://helpsavta-production-frontend.azurewebsites.net
- **Admin Dashboard**: https://helpsavta-production-frontend.azurewebsites.net/admin

### Azure Resources
- **Resource Group**: `helpsavta-prod-rg`
- **Region**: West Europe
- **Subscription**: `6720ecf6-4ad2-4909-b6b6-4696eb862b26`

### Key Components
1. **App Services**: Backend and Frontend applications
2. **PostgreSQL Database**: `helpsavta-production-postgres`
3. **Redis Cache**: `helpsavta-production-redis`
4. **Key Vault**: `helpsavta-production-kv`
5. **Container Registry**: `helpsavtaprodacr.azurecr.io`
6. **Application Insights**: `helpsavta-production-insights`

---

## 📧 SendGrid Email Service Management

### Current Configuration
- **SMTP Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Authentication**: API Key method
- **From Address**: `noreply@helpsavta.co.il`
- **Templates**: Hebrew RTL-enabled templates

### SendGrid Account Access
1. Login to SendGrid dashboard: https://app.sendgrid.com
2. Navigate to **Settings** > **API Keys** to manage API keys
3. Check **Activity** > **Email Activity** for delivery logs

### Email Template Management

#### Available Templates
1. **Request Created** (`request-created`): Sent when new help request submitted
2. **Status Update** (`status-update`): Sent when request status changes
3. **Request Completed** (`request-completed`): Sent when help is completed

#### Template Features
- ✅ Hebrew RTL support (`dir="rtl"`)
- ✅ Mobile-responsive design
- ✅ Professional styling with Help Savta branding
- ✅ UTF-8 encoding for proper Hebrew display

### Updating SendGrid Configuration

#### Method 1: Automated Script
```bash
# Run the automated update script
./scripts/update-sendgrid-keyvault.sh
```

#### Method 2: Manual Azure CLI
```bash
# Set environment variables
SUBSCRIPTION_ID="6720ecf6-4ad2-4909-b6b6-4696eb862b26"
RESOURCE_GROUP="helpsavta-prod-rg"
KEY_VAULT_NAME="helpsavta-production-kv"

# Login and set subscription
az login
az account set --subscription $SUBSCRIPTION_ID

# Update SendGrid API key
az keyvault secret set \
    --vault-name $KEY_VAULT_NAME \
    --name "sendgrid-api-key" \
    --value "YOUR_NEW_API_KEY"

# Restart backend to reload configuration
az webapp restart \
    --name "helpsavta-production-backend" \
    --resource-group $RESOURCE_GROUP
```

### Testing Email Service

#### Quick Test
```bash
# Install dependencies
cd backend && npm install

# Set SendGrid API key
export SENDGRID_API_KEY="your-api-key"

# Run integration test
node ../scripts/test-sendgrid-integration.js your-email@example.com
```

#### Production Test
```bash
# Test from production environment
curl -X POST https://helpsavta-production-backend.azurewebsites.net/api/test/email \
     -H "Content-Type: application/json" \
     -d '{"template": "request-created", "email": "test@example.com"}'
```

---

## 🔍 Monitoring and Logging

### Application Insights
- **Resource**: `helpsavta-production-insights`
- **Portal**: https://portal.azure.com > Application Insights > helpsavta-production-insights

#### Key Metrics to Monitor
1. **Response Times**: Backend API performance
2. **Error Rates**: Application exceptions and failures
3. **Email Delivery**: SendGrid integration success rate
4. **User Activity**: Request submissions and completions

#### Useful Kusto Queries

##### Email Service Monitoring
```kusto
traces
| where timestamp > ago(24h)
| where message contains "email" or message contains "Email"
| order by timestamp desc
```

##### Error Monitoring
```kusto
exceptions
| where timestamp > ago(24h)
| summarize count() by type, outerMessage
| order by count_ desc
```

##### Performance Monitoring
```kusto
requests
| where timestamp > ago(1h)
| summarize avg(duration) by bin(timestamp, 5m)
| render timechart
```

### Log Locations
- **Application Logs**: Application Insights > Logs
- **App Service Logs**: Azure Portal > App Service > Log stream
- **Email Logs**: SendGrid Dashboard > Activity

---

## 🔧 Routine Maintenance Tasks

### Daily Checks
- [ ] Monitor Application Insights for errors
- [ ] Check SendGrid email delivery stats
- [ ] Verify application accessibility
- [ ] Review any user-reported issues

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check database performance and storage
- [ ] Update any security patches
- [ ] Backup verification

### Monthly Tasks
- [ ] Review and rotate API keys
- [ ] Update dependencies (if needed)
- [ ] Performance optimization review
- [ ] Cost optimization review

---

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### Email Service Not Working

**Symptoms**: Users not receiving emails, email errors in logs

**Diagnosis**:
```bash
# Check email configuration
node scripts/test-sendgrid-integration.js

# Check Application Insights logs
# Search for "email" or "sendgrid" in logs
```

**Solutions**:
1. **Invalid API Key**:
   ```bash
   # Update API key in Key Vault
   ./scripts/update-sendgrid-keyvault.sh
   ```

2. **Sender Authentication Issues**:
   - Check SendGrid dashboard for authentication status
   - Verify domain authentication or single sender verification

3. **Rate Limiting**:
   - Check SendGrid usage limits
   - Consider upgrading SendGrid plan

#### Application Performance Issues

**Symptoms**: Slow response times, timeouts

**Diagnosis**:
```bash
# Run performance test
node scripts/production-verification.js
```

**Solutions**:
1. **Database Performance**:
   - Check PostgreSQL metrics in Azure Portal
   - Consider scaling up database SKU

2. **App Service Performance**:
   - Check CPU/Memory usage in Azure Portal
   - Consider scaling up App Service plan

#### Frontend Not Loading

**Symptoms**: Users can't access the website

**Diagnosis**:
```bash
# Check frontend availability
curl -I https://helpsavta-production-frontend.azurewebsites.net
```

**Solutions**:
1. **App Service Issues**:
   ```bash
   # Restart frontend app service
   az webapp restart \
       --name "helpsavta-production-frontend" \
       --resource-group "helpsavta-prod-rg"
   ```

2. **Container Issues**:
   - Check container logs in Azure Portal
   - Verify container image is accessible

### Emergency Contacts
- **Azure Support**: Available through Azure Portal
- **SendGrid Support**: Available through SendGrid Dashboard
- **Technical Lead**: [Contact Information]

---

## 🔄 Backup and Recovery

### Automated Backups
- **Database**: Automatic backups enabled (7-day retention)
- **Key Vault**: Automatic backup of secrets
- **Container Images**: Stored in Azure Container Registry

### Manual Backup Procedures

#### Database Backup
```bash
# Create manual database backup
az postgres flexible-server backup create \
    --resource-group "helpsavta-prod-rg" \
    --server-name "helpsavta-production-postgres" \
    --backup-name "manual-backup-$(date +%Y%m%d-%H%M%S)"
```

#### Configuration Backup
```bash
# Export Key Vault secrets (for documentation)
az keyvault secret list --vault-name "helpsavta-production-kv" --query "[].name" -o tsv
```

### Recovery Procedures

#### Database Recovery
1. Access Azure Portal > PostgreSQL server
2. Go to Backup and restore
3. Select backup point and restore options
4. Update connection strings if server name changes

#### Application Recovery
1. Redeploy from latest container images
2. Verify Key Vault access and secrets
3. Test all functionality after recovery

---

## 📊 Performance Optimization

### Database Optimization
- Monitor query performance in PostgreSQL
- Consider adding indexes for frequently queried columns
- Regular VACUUM and ANALYZE operations

### Application Optimization
- Monitor memory usage and optimize accordingly
- Implement Redis caching where appropriate
- Optimize email template rendering

### Cost Optimization
- Review Azure Cost Management recommendations
- Monitor SendGrid usage against plan limits
- Consider reserved instances for long-term savings

---

## 🔐 Security Best Practices

### Access Management
- Use Azure AD for administrative access
- Implement least privilege principle
- Regular access reviews and key rotation

### API Key Management
- Rotate SendGrid API keys quarterly
- Store all secrets in Key Vault
- Monitor for unauthorized API usage

### Application Security
- Keep dependencies updated
- Monitor security alerts in Application Insights
- Regular security assessments

---

## 📞 Support Procedures

### User Support Workflow
1. **Issue Reported**: User contacts support
2. **Initial Diagnosis**: Check Application Insights logs
3. **Email Issues**: Verify SendGrid delivery status
4. **Technical Issues**: Use production verification script
5. **Escalation**: Contact technical team if needed

### Monitoring Alerts Setup

#### Recommended Alerts
1. **High Error Rate**: > 5% error rate in 5 minutes
2. **High Response Time**: > 5 seconds average response time
3. **Email Delivery Issues**: SendGrid delivery failures
4. **Database Connection Issues**: Connection timeouts

### Documentation Updates
- Update this guide when configuration changes
- Document any new issues and solutions
- Keep troubleshooting procedures current

---

## 📋 Deployment Procedures

### Updating Application Code
1. Build new container images
2. Push to Azure Container Registry
3. Update App Service container settings
4. Verify deployment health
5. Monitor for issues

### Configuration Updates
1. Update Key Vault secrets
2. Restart affected App Services
3. Verify new configuration works
4. Update documentation

### Rollback Procedures
1. Identify last known good container image
2. Update App Service to use previous image
3. Verify rollback successful
4. Document rollback reason and resolution

---

*Last Updated: January 2024*
*Document Version: 1.0*