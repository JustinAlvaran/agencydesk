# CITC IT Website - Deployment Guide

This document outlines the deployment setup for the CITC IT Website using GitLab CI/CD with AWS S3 and CloudFront.

## 🏗️ Architecture

- **Frontend**: Next.js/React.js (Static Export)
- **Hosting**: AWS S3 (Static Website Hosting)
- **CDN**: AWS CloudFront
- **CI/CD**: GitLab CI/CD
- **Environments**: Staging (develop branch) and Production (main branch)

## 🔧 Prerequisites

### AWS Resources Required

1. **S3 Buckets**:
   - Staging: `citc-website-staging`
   - Production: `citc-website-production`
   - Backup: `citc-website-production-backup-*`

2. **CloudFront Distributions**:
   - Staging distribution pointing to staging S3 bucket
   - Production distribution pointing to production S3 bucket

3. **IAM User with Permissions**:
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
           "arn:aws:s3:::citc-website-staging",
           "arn:aws:s3:::citc-website-staging/*",
           "arn:aws:s3:::citc-website-production",
           "arn:aws:s3:::citc-website-production/*",
           "arn:aws:s3:::citc-website-production-backup-*",
           "arn:aws:s3:::citc-website-production-backup-*/*"
         ]
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

## 🔐 GitLab CI/CD Variables Setup

Navigate to your GitLab project → Settings → CI/CD → Variables and add the following:

### AWS Configuration
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key (mark as Protected and Masked)
- `AWS_DEFAULT_REGION`: AWS region (e.g., `us-east-1`)

### Staging Environment
- `STAGING_S3_BUCKET`: Staging S3 bucket name (e.g., `citc-website-staging`)
- `STAGING_CLOUDFRONT_ID`: Staging CloudFront distribution ID
- `STAGING_DOMAIN`: Staging domain (e.g., `staging.citc-website.com`)

### Production Environment
- `PRODUCTION_S3_BUCKET`: Production S3 bucket name (e.g., `citc-website-production`)
- `PRODUCTION_CLOUDFRONT_ID`: Production CloudFront distribution ID
- `PRODUCTION_DOMAIN`: Production domain (e.g., `citc-website.com`)

### Optional
- `ASSET_PREFIX`: CDN URL prefix for assets (if using custom domain for CloudFront)

## 🚀 Deployment Workflow

### Staging Deployment
1. Push changes to `develop` branch
2. CI/CD pipeline automatically:
   - Builds the Next.js app
   - Runs tests and linting
   - Deploys to staging S3 bucket
   - Invalidates staging CloudFront distribution

### Production Deployment
1. Push changes to `main` branch
2. CI/CD pipeline automatically:
   - Builds the Next.js app
   - Runs tests and linting
   - **Waits for manual approval** for production deployment
3. Manual trigger deploys to:
   - Creates backup of current production
   - Deploys to production S3 bucket
   - Invalidates production CloudFront distribution

## 🔄 Rollback Process

In case of issues with production deployment:

1. Go to GitLab → CI/CD → Pipelines
2. Find the latest pipeline for `main` branch
3. Click on the "rollback:production" manual job
4. The system will automatically restore from the latest backup

## 📁 S3 Bucket Configuration

### S3 Bucket Policy (for website hosting)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### S3 Website Configuration
- **Index document**: `index.html`
- **Error document**: `404.html`

## ☁️ CloudFront Configuration

### Recommended Settings
- **Origin Domain**: Your S3 bucket website endpoint
- **Viewer Protocol Policy**: Redirect HTTP to HTTPS
- **Allowed HTTP Methods**: GET, HEAD, OPTIONS
- **Cached HTTP Methods**: GET, HEAD, OPTIONS
- **Cache Policy**: Managed-CachingOptimized
- **Compress Objects Automatically**: Yes

### Custom Error Pages
- **404**: `/404.html` with HTTP 404 status code
- **403**: `/404.html` with HTTP 404 status code (for SPA routing)

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production (creates 'out' directory)
npm run build

# Run linting
npm run lint

# Run tests
npm run test
```

## 📊 Pipeline Stages

1. **Build**: Compiles Next.js app into static files
2. **Test**: Runs tests, linting, and TypeScript type checking
3. **Deploy**: 
   - Staging: Auto-deploys on `develop` branch
   - Production: Manual deployment on `main` branch
   - Rollback: Manual rollback option

## 🔍 Troubleshooting

### Common Issues

1. **Build Fails**: Check Node.js version compatibility
2. **S3 Sync Issues**: Verify AWS credentials and bucket permissions
3. **CloudFront Not Updating**: Check if invalidation was created
4. **404 Errors**: Verify S3 website configuration and CloudFront settings

### Debug Commands

```bash
# Test local build
npm run build

# Check build output
ls -la out/

# Verify Next.js config
cat next.config.ts
```

## 📝 Notes

- The pipeline uses Node.js 20 for consistency
- Static export is enabled for S3 compatibility
- Image optimization is disabled for static export
- Trailing slashes are enabled for better S3 routing
- Automatic backups are created before production deployments
- CloudFront invalidations ensure immediate content updates

## 🔗 Useful Links

- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
