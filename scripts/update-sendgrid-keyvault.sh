#!/bin/bash

# SendGrid Key Vault Update Script for HelpSavta Production
# This script updates Azure Key Vault with SendGrid configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SUBSCRIPTION_ID="6720ecf6-4ad2-4909-b6b6-4696eb862b26"
RESOURCE_GROUP="helpsavta-prod-rg"
KEY_VAULT_NAME="helpsavta-production-kv"

echo -e "${CYAN}📧 SendGrid Configuration Update for HelpSavta${NC}"
echo "=================================================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if Azure CLI is installed and logged in
check_azure_cli() {
    print_info "בדיקת Azure CLI..."
    
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI לא מותקן. אנא התקן אותו מ: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check if logged in
    if ! az account show &> /dev/null; then
        print_error "לא מחובר ל-Azure. אנא התחבר עם: az login"
        exit 1
    fi
    
    print_status "Azure CLI מוכן"
}

# Set the correct subscription
set_subscription() {
    print_info "הגדרת subscription..."
    
    az account set --subscription "$SUBSCRIPTION_ID"
    
    # Verify subscription
    CURRENT_SUB=$(az account show --query "id" -o tsv)
    if [ "$CURRENT_SUB" != "$SUBSCRIPTION_ID" ]; then
        print_error "שגיאה בהגדרת subscription"
        exit 1
    fi
    
    print_status "Subscription הוגדר: $SUBSCRIPTION_ID"
}

# Validate SendGrid API Key format
validate_api_key() {
    local api_key="$1"
    
    if [ -z "$api_key" ]; then
        print_error "SendGrid API Key לא הוזן"
        return 1
    fi
    
    if [[ ! "$api_key" =~ ^SG\. ]]; then
        print_warning "API Key לא נראה תקין (צריך להתחיל ב-SG.)"
        read -p "להמשיך בכל זאת? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    if [ ${#api_key} -lt 50 ]; then
        print_warning "API Key נראה קצר מדי"
        read -p "להמשיך בכל זאת? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    print_status "API Key עבר ולידציה"
    return 0
}

# Update Key Vault secrets
update_keyvault_secrets() {
    local sendgrid_api_key="$1"
    local sender_email="$2"
    
    print_info "עדכון סודות ב-Key Vault..."
    
    # Update SendGrid API Key
    print_info "עדכון sendgrid-api-key..."
    if az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "sendgrid-api-key" \
        --value "$sendgrid_api_key" \
        --output none; then
        print_status "sendgrid-api-key עודכן"
    else
        print_error "שגיאה בעדכון sendgrid-api-key"
        return 1
    fi
    
    # Update email-from if provided
    if [ -n "$sender_email" ]; then
        print_info "עדכון email-from..."
        if az keyvault secret set \
            --vault-name "$KEY_VAULT_NAME" \
            --name "email-from" \
            --value "$sender_email" \
            --output none; then
            print_status "email-from עודכן ל: $sender_email"
        else
            print_error "שגיאה בעדכון email-from"
            return 1
        fi
    fi
    
    # Ensure other email settings are correct
    print_info "וידוא הגדרות אימייל נוספות..."
    
    # Email host
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "email-host" \
        --value "smtp.sendgrid.net" \
        --output none
    
    # Email port
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "email-port" \
        --value "587" \
        --output none
    
    # Email user (always 'apikey' for SendGrid)
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "email-user" \
        --value "apikey" \
        --output none
    
    print_status "כל הגדרות האימייל עודכנו"
}

# Verify Key Vault secrets
verify_secrets() {
    print_info "וידוא סודות ב-Key Vault..."
    
    local secrets=("sendgrid-api-key" "email-host" "email-port" "email-user" "email-from")
    
    for secret in "${secrets[@]}"; do
        if az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "$secret" --query "value" -o tsv &>/dev/null; then
            print_status "$secret קיים"
        else
            print_warning "$secret לא נמצא או לא נגיש"
        fi
    done
}

# Test email configuration
test_email_config() {
    print_info "בדיקת הגדרות אימייל..."
    
    # Show current email configuration (without revealing the API key)
    echo ""
    echo "הגדרות אימייל נוכחיות:"
    echo "------------------------"
    
    if EMAIL_HOST=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "email-host" --query "value" -o tsv 2>/dev/null); then
        echo "📧 Host: $EMAIL_HOST"
    fi
    
    if EMAIL_PORT=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "email-port" --query "value" -o tsv 2>/dev/null); then
        echo "🔌 Port: $EMAIL_PORT"
    fi
    
    if EMAIL_USER=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "email-user" --query "value" -o tsv 2>/dev/null); then
        echo "👤 User: $EMAIL_USER"
    fi
    
    if EMAIL_FROM=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "email-from" --query "value" -o tsv 2>/dev/null); then
        echo "📮 From: $EMAIL_FROM"
    fi
    
    if az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "sendgrid-api-key" --query "value" -o tsv &>/dev/null; then
        echo "🔑 API Key: ******* (מוגדר)"
    else
        echo "🔑 API Key: לא מוגדר"
    fi
    
    echo ""
}

# Restart App Service to pick up new configuration
restart_app_service() {
    print_info "הפעלה מחדש של App Service..."
    
    local app_name="helpsavta-production-backend"
    
    if az webapp restart --name "$app_name" --resource-group "$RESOURCE_GROUP" --output none; then
        print_status "App Service הופעל מחדש"
        print_info "ההגדרות החדשות ייטענו תוך כמה דקות"
    else
        print_warning "לא הצלחתי להפעיל מחדש את App Service"
        print_info "אנא הפעל מחדש ידנית דרך Azure Portal"
    fi
}

# Main execution
main() {
    echo ""
    
    # Check prerequisites
    check_azure_cli
    set_subscription
    
    echo ""
    
    # Get SendGrid API Key
    echo -e "${YELLOW}הזן את SendGrid API Key:${NC}"
    echo "ניתן לקבל אותו מ: https://app.sendgrid.com/settings/api_keys"
    echo ""
    read -s -p "API Key: " SENDGRID_API_KEY
    echo ""
    
    if ! validate_api_key "$SENDGRID_API_KEY"; then
        print_error "API Key לא תקין"
        exit 1
    fi
    
    echo ""
    
    # Get sender email (optional)
    echo -e "${YELLOW}הזן כתובת אימייל של השולח (אופציונלי):${NC}"
    echo "דוגמה: noreply@helpsavta.co.il"
    echo "השאר ריק כדי לשמור על ההגדרה הנוכחית"
    echo ""
    read -p "From Email: " SENDER_EMAIL
    
    echo ""
    
    # Confirm before updating
    echo -e "${YELLOW}האם אתה בטוח שברצונך לעדכן את ההגדרות?${NC}"
    echo "Key Vault: $KEY_VAULT_NAME"
    echo "Resource Group: $RESOURCE_GROUP"
    if [ -n "$SENDER_EMAIL" ]; then
        echo "From Email: $SENDER_EMAIL"
    fi
    echo ""
    read -p "המשך? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "פעולה בוטלה"
        exit 0
    fi
    
    echo ""
    
    # Update secrets
    if update_keyvault_secrets "$SENDGRID_API_KEY" "$SENDER_EMAIL"; then
        print_status "כל הסודות עודכנו בהצלחה"
    else
        print_error "שגיאה בעדכון סודות"
        exit 1
    fi
    
    echo ""
    
    # Verify secrets
    verify_secrets
    
    echo ""
    
    # Show current configuration
    test_email_config
    
    # Ask about restarting the app service
    echo ""
    echo -e "${YELLOW}להפעיל מחדש את Backend App Service כדי שההגדרות ייטענו?${NC}"
    read -p "הפעל מחדש? (Y/n): " -r
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        restart_app_service
    fi
    
    echo ""
    echo -e "${GREEN}🎉 הגדרת SendGrid הושלמה בהצלחה!${NC}"
    echo ""
    echo "השלבים הבאים:"
    echo "1. בדוק שההגדרות נטענו ב-App Service (כמה דקות)"
    echo "2. הרץ בדיקת אימייל: node scripts/test-sendgrid-integration.js"
    echo "3. בדוק לוגים ב-Application Insights"
    echo ""
    echo "URLs חשובים:"
    echo "• Azure Portal: https://portal.azure.com"
    echo "• Key Vault: https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEY_VAULT_NAME"
    echo "• App Service: https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/helpsavta-production-backend"
    echo ""
}

# Show help
show_help() {
    echo -e "${CYAN}SendGrid Configuration Update Script${NC}"
    echo ""
    echo "שימוש:"
    echo "  ./update-sendgrid-keyvault.sh"
    echo ""
    echo "הסקריפט מעדכן את הגדרות SendGrid ב-Azure Key Vault עבור HelpSavta."
    echo ""
    echo "דרישות:"
    echo "• Azure CLI מותקן ומחובר"
    echo "• הרשאות לKey Vault: $KEY_VAULT_NAME"
    echo "• SendGrid API Key תקין"
    echo ""
    echo "מה הסקריפט עושה:"
    echo "1. מעדכן sendgrid-api-key ב-Key Vault"
    echo "2. מעדכן הגדרות SMTP (host, port, user)"
    echo "3. מעדכן email-from (אופציונלי)"
    echo "4. מפעיל מחדש את Backend App Service"
    echo ""
}

# Check command line arguments
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    show_help
    exit 0
fi

# Run main function
main