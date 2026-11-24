# CI/CD Pipeline Testing & Validation Guide

This guide helps you ensure your GitLab CI/CD pipeline is working correctly for both Next.js and React projects.

## 🔄 Branch Configuration Changes

### ✅ Branch Name Updates
- **Old**: `master` → **New**: `main`
- Pipeline now triggers on `main` branch for production
- `develop` branch for staging deployments

## 🧪 Pre-Deployment Testing

### 1. Local Environment Testing

#### Next.js Project (citc-it-website)
```bash
cd citc-it-website

# Install dependencies
npm install

# Run local development
npm run dev

# Test build process
npm run build
ls -la out/  # Verify build output

# Test linting
npm run lint

# Preview build
npm run start
```

### 2. Git Repository Setup

```bash
# For both projects, ensure proper git setup
git add .
git commit -m "Initial commit with CI/CD pipeline"

# Set up remote (replace with your GitLab repository URL)
git remote add origin https://gitlab.com/your-username/your-project.git

# Push main branch
git push -u origin main

# Create and push develop branch
git checkout -b develop
git push -u origin develop
```

## 🏗️ AWS Infrastructure Setup

### 1. Create S3 Buckets

#### For Next.js Project:
```bash
# Staging bucket
aws s3 mb s3://citc-nextjs-website-staging --region us-east-1

# Production bucket
aws s3 mb s3://citc-nextjs-website-production --region us-east-1

# Configure website hosting
aws s3 website s3://citc-nextjs-website-staging \
  --index-document index.html \
  --error-document 404.html

aws s3 website s3://citc-nextjs-website-production \
  --index-document index.html \
  --error-document 404.html
```

### 2. Create CloudFront Distributions

```bash
# Create distribution for staging
aws cloudfront create-distribution \
  --distribution-config file://staging-distribution-config.json

# Create distribution for production
aws cloudfront create-distribution \
  --distribution-config file://production-distribution-config.json
```

### 3. IAM User Setup

Create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::citc-*-website-staging",
        "arn:aws:s3:::citc-*-website-staging/*",
        "arn:aws:s3:::citc-*-website-production",
        "arn:aws:s3:::citc-*-website-production/*",
        "arn:aws:s3:::citc-*-website-production-backup-*",
        "arn:aws:s3:::citc-*-website-production-backup-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:CreateBucket"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🔐 GitLab CI/CD Variables Configuration

### Required Variables (for both projects):

#### AWS Configuration
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key (Protected & Masked)
- `AWS_DEFAULT_REGION` - `us-east-1` (or your preferred region)

#### Next.js Project Variables
- `STAGING_S3_BUCKET` - `citc-nextjs-website-staging`
- `STAGING_CLOUDFRONT_ID` - Your staging CloudFront distribution ID
- `STAGING_DOMAIN` - `staging-nextjs.your-domain.com`
- `PRODUCTION_S3_BUCKET` - `citc-nextjs-website-production`
- `PRODUCTION_CLOUDFRONT_ID` - Your production CloudFront distribution ID
- `PRODUCTION_DOMAIN` - `nextjs.your-domain.com`


## 🧪 Pipeline Testing Process

### Phase 1: Build Stage Testing

1. **Push to develop branch**:
```bash
git checkout develop
echo "Test change" >> README.md
git add .
git commit -m "Test: Trigger staging pipeline"
git push origin develop
```

2. **Monitor in GitLab**:
   - Go to CI/CD → Pipelines
   - Check build stage logs
   - Verify artifacts are created

### Phase 2: Test Stage Validation

**Expected Test Results:**
- ✅ Linting passes
- ✅ TypeScript compilation succeeds
- ✅ Security audit completes
- ✅ Build artifacts generated

### Phase 3: Staging Deployment Testing

**Automatic Staging Deploy (develop branch)**:
1. Build completes successfully
2. Files sync to S3 staging bucket
3. CloudFront invalidation runs
4. Website accessible at staging URL

**Verification Steps:**
```bash
# Check S3 bucket contents
aws s3 ls s3://your-staging-bucket/ --recursive

# Check CloudFront invalidation
aws cloudfront list-invalidations --distribution-id YOUR_DISTRIBUTION_ID

# Test website accessibility
curl -I https://your-staging-domain.com
```

### Phase 4: Production Deployment Testing

1. **Merge to main branch**:
```bash
git checkout main
git merge develop
git push origin main
```

2. **Manual Production Deploy**:
   - Go to GitLab CI/CD → Pipelines
   - Find the pipeline for main branch
   - Click the manual "deploy:production" job
   - Monitor deployment logs

3. **Verify Production**:
   - Check backup creation
   - Verify file sync to production S3
   - Test production website

## 🚨 Troubleshooting Common Issues

### Build Failures

1. **Node.js Version Issues**:
```bash
# Check pipeline uses Node 20
# Verify package.json engines field
"engines": {
  "node": ">=20.0.0"
}
```

2. **Dependency Issues**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for security vulnerabilities
npm audit fix
```

### Deployment Failures

1. **AWS Permissions**:
```bash
# Test AWS CLI locally
aws s3 ls s3://your-bucket-name
aws cloudfront list-distributions
```

2. **S3 Sync Issues**:
```bash
# Manual sync test
aws s3 sync ./out s3://your-bucket --dry-run
```

3. **CloudFront Issues**:
```bash
# Check distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID
```

## 📊 Pipeline Monitoring Dashboard

### GitLab Monitoring
- **Location**: Project → CI/CD → Pipelines
- **Key Metrics**: 
  - Build duration
  - Success/failure rate
  - Deployment frequency

### AWS Monitoring
- **CloudWatch**: S3 and CloudFront metrics
- **S3 Logs**: Access logs for debugging
- **CloudFront Logs**: Distribution performance

## ✅ Success Criteria Checklist

### Pre-Launch
- [ ] Local build works for both projects
- [ ] AWS infrastructure created and configured
- [ ] GitLab CI/CD variables set correctly
- [ ] Git repositories set up with main/develop branches

### Build Stage
- [ ] Dependencies install successfully
- [ ] TypeScript compilation passes
- [ ] Linting passes without errors
- [ ] Build artifacts generated correctly

### Test Stage
- [ ] All tests pass (when implemented)
- [ ] Security audit clean
- [ ] No critical vulnerabilities

### Staging Deployment
- [ ] Files sync to S3 staging bucket
- [ ] Proper content types set
- [ ] Cache headers configured
- [ ] CloudFront invalidation completes
- [ ] Staging website accessible

### Production Deployment
- [ ] Backup created before deployment
- [ ] Files sync to S3 production bucket
- [ ] CloudFront invalidation completes
- [ ] Production website accessible
- [ ] Rollback capability tested

## 🔄 Rollback Testing

### Test Rollback Process
1. Make a deliberate breaking change
2. Deploy to production
3. Trigger manual rollback job
4. Verify restoration from backup

### Rollback Command
```bash
# In GitLab pipeline or manually
aws s3 sync s3://your-backup-bucket/ s3://your-production-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## 📈 Performance Validation

### Build Performance
- **Target**: Build time < 5 minutes
- **Monitor**: Pipeline duration graphs

### Website Performance
- **Tools**: Lighthouse, GTmetrix, WebPageTest
- **Targets**: 
  - Performance Score > 90
  - First Contentful Paint < 2s
  - Largest Contentful Paint < 3s

## 🎯 Next Steps After Validation

1. **Set up monitoring alerts**
2. **Configure branch protection rules**
3. **Set up automated testing**
4. **Implement feature branch workflows**
5. **Add performance monitoring**
6. **Set up error tracking (Sentry, etc.)**

This comprehensive testing approach ensures your CI/CD pipeline is robust and reliable for production use.
