# Setup Guide - Legal Aid Provider Management System

## Quick Start

### 1. Database Setup

1. **Create PostgreSQL Database:**
```bash
createdb legal_aid_db
```

Or using psql:
```sql
CREATE DATABASE legal_aid_db;
```

2. **Update Database Credentials:**
   - Open `backend/config/database.php`
   - Update the connection details:
     ```php
     private $host = "localhost";
     private $db_name = "legal_aid_db";
     private $username = "postgres";
     private $password = "your_password";
     ```

3. **Run Schema:**
```bash
psql -U postgres -d legal_aid_db -f database/schema.sql
```

Or using pgAdmin or any PostgreSQL client, execute the contents of `database/schema.sql`

### 2. Backend Setup (PHP)

1. **Ensure PHP Extensions are Installed:**
   - php-pdo
   - php-pgsql
   - mod_rewrite (for Apache)

2. **For XAMPP (Windows):**
   - Place the project in `C:\xampp\htdocs\scan\`
   - Enable mod_rewrite in `httpd.conf`
   - Ensure PostgreSQL extension is enabled in `php.ini`

3. **For Apache:**
   - Ensure `.htaccess` files are allowed
   - Enable mod_rewrite: `sudo a2enmod rewrite`
   - Restart Apache: `sudo service apache2 restart`

4. **Test Backend:**
   - Access: `http://localhost/scan/backend/api/lawyers`
   - Should return JSON (may be empty array if no data)

### 3. Frontend Setup (React)

1. **Install Node.js dependencies:**
```bash
cd frontend
npm install
```

2. **Update API Base URL (if needed):**
   - Open `frontend/src/services/api.js`
   - Update `baseURL` if your backend is on a different port/path

3. **Start Development Server:**
```bash
npm start
```

4. **Access Application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost/scan/backend/api`

### 4. Default Login Credentials

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change the default password in production!

To change password, update the database:
```sql
UPDATE users 
SET password_hash = '$2y$10$...' 
WHERE username = 'admin';
```

Generate new hash using PHP:
```php
echo password_hash('your_new_password', PASSWORD_DEFAULT);
```

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running:**
```bash
# Linux/Mac
sudo service postgresql status

# Windows (XAMPP)
# Check PostgreSQL service in Services
```

2. **Verify credentials in `backend/config/database.php`**

3. **Test connection:**
```php
<?php
$conn = new PDO("pgsql:host=localhost;dbname=legal_aid_db", "postgres", "password");
echo "Connected successfully";
?>
```

### CORS Issues

If you encounter CORS errors:
1. Check `backend/config/cors.php`
2. Update `Access-Control-Allow-Origin` header
3. Ensure backend is accessible from frontend URL

### API Routing Issues

1. **Check `.htaccess` is working:**
   - Ensure mod_rewrite is enabled
   - Check Apache error logs

2. **Alternative: Direct file access:**
   - Use direct file paths: `/api/lawyers/index.php`
   - Update frontend API calls accordingly

### Frontend Build Issues

1. **Clear cache and reinstall:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

2. **Check Node.js version:**
   - Requires Node.js 14+ and npm 6+

## Production Deployment

### Backend

1. **Update security settings:**
   - Change JWT secret key in `backend/utils/jwt.php`
   - Update CORS settings
   - Enable HTTPS

2. **Set proper file permissions:**
```bash
chmod 644 backend/config/database.php
chmod 755 backend/api/
```

### Frontend

1. **Build for production:**
```bash
cd frontend
npm run build
```

2. **Deploy build folder:**
   - Copy `frontend/build/` contents to web server
   - Configure web server to serve React app

3. **Update API URLs:**
   - Update `baseURL` in production build
   - Or use environment variables

## Environment Variables (Optional)

Create `.env` files for configuration:

**Backend `.env`:**
```
DB_HOST=localhost
DB_NAME=legal_aid_db
DB_USER=postgres
DB_PASS=your_password
JWT_SECRET=your_secret_key
```

**Frontend `.env`:**
```
REACT_APP_API_URL=http://localhost/scan/backend/api
```

## Additional Notes

- The system uses JWT for authentication
- All API endpoints return JSON
- Public endpoints don't require authentication
- Admin endpoints require authentication and admin role
- Database uses PostgreSQL-specific features (SERIAL, etc.)

## Support

For issues or questions:
1. Check error logs (PHP error log, Apache error log, browser console)
2. Verify database schema is correctly applied
3. Test API endpoints directly using Postman or curl
4. Check network tab in browser DevTools for API calls

