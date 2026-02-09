# Legal Aid Provider Management System

A comprehensive web-based system for managing legal aid providers (lawyers, law firms, NGOs, paralegals) with React frontend, PHP backend, and PostgreSQL database.

## Features

### User Management
- Secure admin login
- Public search without login
- Registered lawyer profile management

### Lawyer Profile Management
- Create, update, verify, and deactivate lawyer profiles
- Store comprehensive profile information including:
  - Organization/lawyer name
  - Provider type (law firm, NGO, paralegal)
  - Registration and license status
  - Contact details
  - Geographical coverage
  - Modes of operation

### Legal Expertise and Services
- Areas of law with case volume percentages
- Types of legal aid services offered
- Target client specifications

### Staff Management
- Individual lawyer details
- Support for advocates, lawyers, paralegals, interns/volunteers

### Search and Filtering
- Public search functionality
- Filter by region, area of law, service type, license status

### Dashboard and Reporting
- Overview statistics
- Lawyers by region
- Areas of law coverage
- License status distribution
- Funding distribution
- Reporting status tracking
- Compliance issues tracking
- Data export (CSV/PDF)

## Technology Stack

- **Frontend**: React 18, React Router, Recharts, Axios
- **Backend**: PHP 7.4+, PDO
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)

## Installation

### Prerequisites
- Node.js and npm
- PHP 7.4 or higher
- PostgreSQL
- Apache/Nginx web server

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE legal_aid_db;
```

2. Update database credentials in `backend/config/database.php`

3. Run the schema:
```bash
psql -U postgres -d legal_aid_db -f database/schema.sql
```

### Backend Setup

1. Configure database connection in `backend/config/database.php`
2. Ensure PHP PDO PostgreSQL extension is enabled
3. Set up Apache/Nginx to point to the `backend` directory
4. Update CORS settings in `backend/config/cors.php` if needed

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update API base URL in `frontend/src/services/api.js` if needed

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Default Credentials

- **Username**: admin
- **Password**: admin123 (change this in production!)

## API Endpoints

### Authentication
- `POST /api/auth/login.php` - Login

### Lawyers
- `GET /api/lawyers/index.php` - List/search lawyers (public)
- `GET /api/lawyers/[id].php?id={id}` - Get lawyer details
- `POST /api/lawyers/index.php` - Create lawyer (admin)
- `PUT /api/lawyers/[id].php?id={id}` - Update lawyer (admin)
- `DELETE /api/lawyers/[id].php?id={id}` - Delete lawyer (admin)

### Dashboard
- `GET /api/dashboard/reports.php?type={type}` - Get reports (admin)

### Export
- `GET /api/export/export.php?format=csv&type=lawyers` - Export data (admin)

### Staff
- `GET /api/staff/index.php?lawyer_id={id}` - Get staff
- `POST /api/staff/index.php` - Create staff (admin)
- `PUT /api/staff/index.php` - Update staff (admin)
- `DELETE /api/staff/index.php?staff_id={id}` - Delete staff (admin)

### Funding
- `GET /api/funding/index.php?lawyer_id={id}` - Get funding
- `POST /api/funding/index.php` - Create funding (admin)
- `PUT /api/funding/index.php` - Update funding (admin)
- `DELETE /api/funding/index.php?funding_id={id}` - Delete funding (admin)

## Project Structure

```
├── backend/
│   ├── api/
│   │   ├── auth/
│   │   ├── lawyers/
│   │   ├── dashboard/
│   │   ├── export/
│   │   ├── staff/
│   │   └── funding/
│   ├── config/
│   └── utils/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Auth/
│       │   ├── Dashboard/
│       │   ├── Lawyers/
│       │   ├── Layout/
│       │   └── Public/
│       ├── context/
│       └── services/
├── database/
│   └── schema.sql
└── README.md
```

## Security Notes

- Change default admin password
- Use strong JWT secret key in production
- Enable HTTPS in production
- Implement proper input validation and sanitization
- Use prepared statements (already implemented)
- Set up proper CORS policies

## License

This project is provided as-is for educational and development purposes.

