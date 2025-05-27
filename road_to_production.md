# Road to Production  

## 1 – Feature Gaps to Achieve Production-Readiness  

### 1.1 Security  
- **HTTPS everywhere** – enforce TLS on frontend & backend (Azure App Service ➜ “HTTPS Only”).  
- **Environment variables** – never commit secrets; load from [`backend/.env`](backend/.env.example:1) locally, and use **Azure Key Vault** in prod.  
- **Authentication** – rotate JWT signing key; store in Key Vault; set token expiry ≤ 1 h.  
- **OWASP Top 10 hardening** – enable Helmet middleware, CSRF tokens, CORS allow-list.  
- **Database security** – use managed PostgreSQL with SSL required and network firewall (allow only App Service subnet).  
- **Dependency scanning** – add `npm audit` & [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-alerts) to CI.  

### 1.2 Reliability & Observability  
- **Health checks** – keep `/health` endpoint; configure App Service health probe.  
- **Structured logs** – output JSON with request id; ship to **Azure Monitor Logs** ➜ easier querying.  
- **Metrics & traces** – integrate **Application Insights** SDK for automatic Node/React telemetry.  
- **Error handling** – central Express `errorHandler` with alerts to Slack/Teams on 5xx spikes.  
- **Backups** – enable automatic DB backups (7-30 days retention).  
- **SLOs & alerts** – define availability/error-rate thresholds; create Alert Rules in Azure Monitor.  

### 1.3 Performance & Scalability  
- **Vite/Tailwind production build** – minify, tree-shake, pre-render critical routes.  
- **CDN** – enable **Azure Front Door** or App Service “Performance” plan to cache static assets.  
- **API caching** – use Redis Cache for expensive reads (`GET /slots`).  
- **Database indexing** – review slow queries with `EXPLAIN`; add indexes via Prisma migrations.  
- **Horizontal scaling** – App Service auto-scale on CPU / HTTP queue length; DB read replicas if needed.  
- **Load testing** – run [Azure Load Testing](https://learn.microsoft.com/azure/load-testing/) before each release.  

### 1.4 Developer Experience & Testing  
- **Linting & formatting** – ESLint + Prettier enforced in CI.  
- **Unit tests** – Jest/Vitest for React & backend services; aim ≥ 80 % coverage.  
- **Integration tests** – use `supertest` against in-memory SQLite for backend; Playwright for e2e UI.  
- **Hot-reload** – keep `npm run dev` scripts; consider **Azure Dev Containers** for parity.  
- **Preview environments** – spin up ephemeral App Service slots for each PR.  

### 1.5 Operational Concerns  
- **Runbooks** – markdown docs for common issues (DB outage, log flood).  
- **On-call rotation** – schedule & escalation policy (PagerDuty/Azure Alerts ➜ Teams).  
- **Cost management** – set budgets & alerts in Azure Cost Analysis.  
- **Disaster recovery** – region pairs; automate DB restore & `az postgres flexible-server geo-restore`.  
- **Compliance** – document data flow; enable App Service diagnostic logs for audits.  

---  

## 2 – CI/CD Pipeline (GitHub Actions)  

### 2.1 Overview  
1. **Trigger** on every push & pull request.  
2. **Jobs**  
   - _Build_ ➜ install, lint, test, build both apps.  
   - _Release_ ➜ only on `main` / tag; publish artifacts & deploy to Azure.  
3. **Caching** npm deps to speed up builds.  
4. **OIDC authentication** with Azure to avoid storing long-lived secrets.  

### 2.2 Workflow File (`.github/workflows/ci-cd.yml`) – annotated snippet  
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: ⬇️  Checkout code
        uses: actions/checkout@v4
      - name: ⚡️ Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'           # automatic npm cache
      - name: 📦 Install deps
        run: npm ci --workspaces
      - name: 🧹 Lint & Test
        run: npm run lint && npm test --workspaces
      - name: 🛠 Build
        run: |
          cd frontend && npm run build
          cd ../backend && npm run build
      - name: 🚚 Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: frontend/dist/**

  release:
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    permissions:
      id-token: write        # enables OIDC login to Azure
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: 🔑 Azure login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - name: 🚀 Deploy backend
        run: az webapp up --name $APP_NAME --runtime "NODE|20-lts" --src-path backend
      - name: 🚀 Deploy frontend
        run: az storage blob upload-batch -d '$web' -s frontend/dist --account-name $STORAGE_ACCOUNT
```  
(See full schema: [GitHub Actions docs](https://docs.github.com/actions).)  

### 2.3 Secrets & Environment Variables  
| Purpose | Where to store | Key name example |
|---------|----------------|------------------|
| Azure SP Client Id | GitHub → Settings → Secrets | `AZURE_CLIENT_ID` |
| Tenant & Subscription | GitHub Secrets | `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` |
| Production ENV (JWT_SECRET, DB_URL) | Azure Key Vault ➜ referenced by App Service | `JWT_SECRET`, `DATABASE_URL` |

> Tip: Use [Environment secrets](https://docs.github.com/actions/deployment/targeting-different-environments) for staging vs production.  

### 2.4 Branching & Release Strategy  
- **`main`** – always deployable; protected branch.  
- **Feature branches** – short-lived; PR ➜ CI build + preview environment.  
- **Release tags** – semantic versioning `v1.2.0`; tag triggers `release` job.  
- **Hotfix** – branch from tag, PR into `main`, retag `v1.2.1`.  

---  

## 3 – Deploying on Azure  

### 3.1 Recommended Architecture Diagram (textual)  
```
[GitHub Actions] ──OIDC──► [Azure Subscription]
                                   │
                ┌──────────────────┴─────────────────┐
                │                                    │
        [Azure App Service]                [Azure Static Web Apps or Storage+CDN]
           (Node/Express API)                     (React build)
                │                                    │
        [Azure Database for PostgreSQL]      [Azure Front Door CDN]
                │
        [Azure Application Insights]
                │
        [Azure Key Vault] ← secrets
```  

### 3.2 Azure Services Required  
| Service | Why it’s needed |
|---------|-----------------|
| **Azure App Service** | Managed Node runtime, autoscale, HTTPS. |
| **Azure Storage (Static Website)** or **Static Web Apps** | Host pre-built React files cheaply with CDN integration. |
| **Azure Database for PostgreSQL – Flexible Server** | Managed DB; automatic backups & scaling; works with Prisma. |
| **Azure Application Insights** | Centralized logs, metrics, distributed tracing. |
| **Azure Key Vault** | Secure secret storage; reference from App Service settings. |
| **Azure Container Registry** (optional) | For future containerization or `azure/webapps-deploy`. |
| **Azure Front Door** (optional) | Global CDN & WAF for static assets and API routing. |

### 3.3 Step-by-Step Provisioning Guide (CLI + Portal)  
1. **Login**  
   ```bash
   az login
   az account set --subscription "<SUBSCRIPTION_ID>"
   ```  
2. **Resource group**  
   ```bash
   az group create -n help-prod-rg -l westeurope
   ```  
3. **PostgreSQL**  
   ```bash
   az postgres flexible-server create \
     --name help-prod-db --resource-group help-prod-rg \
     --location westeurope --admin-user dbadmin --admin-password "<Pwd>" \
     --sku-name Standard_B1ms --storage-size 32GiB
   az postgres flexible-server firewall-rule create \
     --resource-group help-prod-rg --name help-prod-db \
     --rule-name AllowAppService --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0
   ```  
4. **App Service**  
   ```bash
   az webapp up --name help-api-prod \
     --resource-group help-prod-rg \
     --runtime "NODE|20-lts" --os-type Linux
   ```  
5. **Storage for frontend**  
   ```bash
   az storage account create -n helpfrontprod -g help-prod-rg -l westeurope --sku Standard_LRS --kind StorageV2
   az storage blob service-properties update --account-name helpfrontprod --static-website \
     --index-document index.html --404-document index.html
   ```  
6. **Key Vault & secrets**  
   ```bash
   az keyvault create -n help-prod-kv -g help-prod-rg -l westeurope
   az keyvault secret set --vault-name help-prod-kv --name JWT-SECRET --value "<supersecret>"
   ```  
7. **Application Insights**  
   ```bash
   az monitor app-insights component create -a help-prod-ai -g help-prod-rg -l westeurope --application-type web
   ```  
8. **Portal steps**:  
   - Link App Service to Key Vault secrets (Configuration ➜ “Key Vault Reference”).  
   - Enable deployment slots for blue/green releases if desired.  

### 3.4 Wiring the CI/CD pipeline to Azure  
1. **Create Service Principal** (OIDC):  
   ```bash
   az ad app create --display-name help-gh-actions
   az ad sp create --id <appId>
   az ad app federated-credential create --id <appId> --parameters gitHub.json
   ```  
2. **Capture IDs** – SP client id, tenant id, subscription id ➜ GitHub Secrets.  
3. **Grant roles** – `Contributor` on `help-prod-rg`; `Storage Blob Data Contributor` on storage.  
4. **Update workflow** – step `azure/login@v2` will use OIDC and deploy.  
5. **Smoke test** – final job calls `curl https://help-api-prod.azurewebsites.net/health`.  

### 3.5 Post-deployment Checklist  
- ✅ **HTTPS enforced** on both App Service & Storage endpoint.  
- ✅ **Domain name** – add custom domain & free App Service cert.  
- ✅ **Scale rules** – CPU > 60 % (5 min) ➜ +1 instance.  
- ✅ **Alerts** – 5xx rate > 1 % or DB CPU > 80 % ➜ on-call.  
- ✅ **Backups** – App Service daily snapshot; DB automated backups verified.  
- ✅ **Monitoring dashboard** in Azure Portal shared with team.  
- ✅ **Cost alerts** set to budget threshold.  
- ✅ **Run E2E tests** against prod URL before announcing release.  

---