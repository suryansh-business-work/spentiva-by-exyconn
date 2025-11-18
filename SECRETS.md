# Spentiva GitHub Secrets Configuration Guide

This file lists all required GitHub secrets for automated deployment.
**DO NOT commit actual secret values to version control!**

## Required Secrets

Navigate to: `GitHub Repository > Settings > Secrets and variables > Actions > New repository secret`

### Docker Hub Credentials
```
DOCKERHUB_USERNAME
Description: Your Docker Hub username
Example: myusername

DOCKERHUB_TOKEN
Description: Docker Hub Personal Access Token (create at hub.docker.com/settings/security)
Example: dckr_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Server SSH Access
```
SSH_HOST
Description: Production server IP address or hostname
Example: 123.45.67.89 or server.yourdomain.com

SSH_USER
Description: SSH username for deployment
Example: ubuntu

SSH_KEY
Description: Private SSH key for authentication (paste entire key including headers)
Example:
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----

SSH_PORT
Description: SSH port (typically 22)
Example: 22
```

### Database Configuration
```
MONGO_ROOT_USERNAME
Description: MongoDB root/admin username
Example: admin

MONGO_ROOT_PASSWORD
Description: MongoDB root/admin password (use strong password!)
Example: MyS3cur3P@ssw0rd!2024
Generate: openssl rand -base64 32

MONGODB_URL
Description: Full MongoDB connection string for backend
Format: mongodb://[username]:[password]@mongodb:27017/expenses?authSource=admin
Example: mongodb://admin:MyS3cur3P@ssw0rd!2024@mongodb:27017/expenses?authSource=admin
Note: Use 'mongodb' as hostname (Docker internal networking)
```

### Application Secrets
```
JWT_SECRET
Description: Secret key for JWT token signing (must be random and secure)
Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
Generate: openssl rand -hex 32

OPENAI_API_KEY
Description: OpenAI API key for AI-powered expense parsing
Example: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Get from: https://platform.openai.com/api-keys
```

## How to Generate Secure Values

### Generate MongoDB Password
```bash
openssl rand -base64 32
```

### Generate JWT Secret
```bash
openssl rand -hex 32
```

### Generate SSH Key Pair (if needed)
```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "deployment@spentiva" -f ~/.ssh/spentiva_deploy

# Add public key to server
ssh-copy-id -i ~/.ssh/spentiva_deploy.pub user@your-server

# Copy private key content for GitHub secret
cat ~/.ssh/spentiva_deploy
```

## Verification Checklist

Before pushing to main branch:

- [ ] All 10 secrets configured in GitHub
- [ ] MongoDB credentials match in both MONGODB_URL and individual secrets
- [ ] SSH key has no passphrase (or handled properly)
- [ ] SSH user has Docker permissions on server
- [ ] Server firewall allows connections on ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000, 5000, 8080
- [ ] Docker and Docker Compose installed on production server
- [ ] OpenAI API key is valid and has credits

## Testing Secrets

Test SSH connection:
```bash
ssh -i ~/.ssh/spentiva_deploy -p 22 user@your-server "docker --version"
```

Test Docker Hub authentication:
```bash
echo "YOUR_DOCKERHUB_TOKEN" | docker login -u YOUR_USERNAME --password-stdin
```

## Security Best Practices

1. **Never commit secrets to code**
   - Use .gitignore for .env files
   - Use GitHub Secrets for CI/CD
   - Rotate secrets periodically

2. **Use strong, random passwords**
   - Minimum 32 characters
   - Mix of letters, numbers, symbols
   - Use password manager

3. **Limit access**
   - Use principle of least privilege
   - Create service accounts for deployments
   - Restrict SSH to key-based auth only

4. **Monitor usage**
   - Enable audit logs
   - Monitor API usage (OpenAI)
   - Track deployment history

5. **Backup secrets**
   - Store in secure password manager
   - Document recovery procedures
   - Have backup access methods

## Troubleshooting

### Deployment fails with authentication error
- Verify DOCKERHUB_TOKEN is valid
- Check SSH_KEY has correct format (including header/footer)
- Ensure SSH_USER has sudo/docker privileges

### Database connection fails
- Verify MONGODB_URL format is correct
- Check username/password match in all secrets
- Ensure 'mongodb' hostname is used (not localhost)

### API errors
- Verify OPENAI_API_KEY is valid
- Check JWT_SECRET matches across deployments
- Ensure environment variables are set

## Example .env File (for local development only)

Create `.env` file in project root:

```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=localdevpassword
MONGODB_URL=mongodb://admin:localdevpassword@mongodb:27017/expenses?authSource=admin

# Application
JWT_SECRET=local-dev-secret-change-in-production
OPENAI_API_KEY=sk-your-key-here
```

**Remember: Never commit .env to git!**

---

Last Updated: 2025-01-18
