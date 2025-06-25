# GastroBot Docker Setup

This document explains how to run GastroBot using Docker containers.

## Prerequisites

- Docker
- Docker Compose
- Git

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd GastroBot
   ```

2. **Create environment file (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

## Services

### MongoDB
- **Port:** 27017
- **Database:** gastrobot
- **Username:** admin
- **Password:** password123
- **Application User:** gastrobot_user / gastrobot_password

### Backend API
- **Port:** 5000
- **Framework:** Node.js + Express
- **Database:** MongoDB
- **Features:** Authentication, Recipe API, Chat API

### Frontend
- **Port:** 3000
- **Framework:** React
- **Server:** Nginx

## Docker Commands

### Basic Commands
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild images
docker-compose build

# Restart a specific service
docker-compose restart backend

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mongodb mongosh
```

## Environment Variables

### Backend Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `FRONTEND_URL`: Frontend URL for CORS
- `SENDGRID_API_KEY`: SendGrid API key for emails
- `RESEND_API_KEY`: Resend API key for emails
- `EMAIL_FROM`: From email address

### Frontend Environment Variables
- `REACT_APP_API_URL`: Backend API URL

## Volumes

- `mongodb_data`: MongoDB data persistence
- `./uploads`: File uploads directory

## Networks

- `gastrobot-network`: Internal network for service communication

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5000
   netstat -tulpn | grep :27017
   ```

2. **Permission issues:**
   ```bash
   # Fix uploads directory permissions
   sudo chown -R $USER:$USER ./uploads
   ```

3. **MongoDB connection issues:**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Access MongoDB directly
   docker-compose exec mongodb mongosh -u admin -p password123
   ```

4. **Build issues:**
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose build --no-cache
   ```

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Follow logs in real-time
docker-compose logs -f
```

## Production Deployment

### Environment Configuration
1. Create `.env` file with production values
2. Update `JWT_SECRET` with a strong secret
3. Configure email service API keys
4. Set `NODE_ENV=production`

## Security Considerations

- Change default passwords in production
- Use strong JWT secrets
- Configure proper CORS settings
- Regular security updates
- Monitor logs for suspicious activity

## Backup and Restore

### MongoDB Backup
```bash
# Create backup
docker-compose exec mongodb mongodump --out /data/backup

# Copy backup from container
docker cp gastrobot-mongodb:/data/backup ./backup

# Restore backup
docker-compose exec mongodb mongorestore /data/backup
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v gastrobot_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v gastrobot_mongodb_data:/data -v $(pwd):/backup alpine tar xzf /backup/mongodb-backup.tar.gz -C /data
```

## Performance Optimization

- Use production builds for frontend
- Enable gzip compression
- Configure proper caching headers
- Monitor resource usage
- Scale services as needed

## Monitoring

- Use `docker stats` to monitor resource usage
- Monitor application logs
- Set up external monitoring tools 