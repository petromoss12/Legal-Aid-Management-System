CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'LAWYER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password_hash, role)
VALUES (
  'admin',
  '$2y$10$0NWa0DkY.UgBYTDuhLtueuxZli2YQbkSifrviboDNvoDqFmjQz0D6',
  'ADMIN'
)
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role          = EXCLUDED.role;

UPDATE users 
SET password_hash = 'admin321' 
WHERE username = 'admin';

SELECT * FROM users;

CREATE TABLE lawyer_profiles (
    lawyer_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- Law firm, NGO, Paralegal
    registration_status VARCHAR(50),
    license_status VARCHAR(20) CHECK (license_status IN ('ACTIVE', 'INACTIVE')),
    phone VARCHAR(50),
    email VARCHAR(150),
    website TEXT,
    mode_of_operation VARCHAR(20) CHECK (mode_of_operation IN ('PERMANENT', 'MOBILE')),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT * from lawyer_profiles;

CREATE TABLE locations (
    location_id SERIAL PRIMARY KEY,
    lawyer_id INT NOT NULL REFERENCES lawyer_profiles(lawyer_id) ON DELETE CASCADE,
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    ward VARCHAR(100),
    village VARCHAR(100),
    street VARCHAR(100)
);

SELECT * FROM locations;

CREATE TABLE areas_of_law (
    area_id SERIAL PRIMARY KEY,
    area_name VARCHAR(100) UNIQUE NOT NULL
);

SELECT * FROM areas_of_law;

CREATE TABLE lawyer_area_of_law (
    lawyer_id INT REFERENCES lawyer_profiles(lawyer_id) ON DELETE CASCADE,
    area_id INT REFERENCES areas_of_law(area_id),
    case_percentage INT CHECK (case_percentage BETWEEN 0 AND 100),
    PRIMARY KEY (lawyer_id, area_id)
);


CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE lawyer_services (
    lawyer_id INT REFERENCES lawyer_profiles(lawyer_id) ON DELETE CASCADE,
    service_id INT REFERENCES services(service_id),
    PRIMARY KEY (lawyer_id, service_id)
);


CREATE TABLE target_clients (
    client_id SERIAL PRIMARY KEY,
    client_type VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE lawyer_target_clients (
    lawyer_id INT REFERENCES lawyer_profiles(lawyer_id) ON DELETE CASCADE,
    client_id INT REFERENCES target_clients(client_id),
    PRIMARY KEY (lawyer_id, client_id)
);


CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    lawyer_id INT REFERENCES lawyer_profiles(lawyer_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- Advocate, Lawyer, Paralegal, Intern
    gender VARCHAR(10),
    age INT CHECK (age > 0),
    education_level VARCHAR(50),
    specialization VARCHAR(100),
    years_of_practice INT CHECK (years_of_practice >= 0),
    practicing_certificate_status VARCHAR(20) -- Active / Inactive / NA
);


CREATE TABLE funding (
    funding_id SERIAL PRIMARY KEY,
    lawyer_id INT REFERENCES lawyer_profiles(lawyer_id) ON DELETE CASCADE,
    funding_source VARCHAR(150),
    amount NUMERIC(15,2) CHECK (amount >= 0),
    adequacy VARCHAR(30), -- Adequate / Inadequate
    year INT CHECK (year >= 2000)
);


CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    lawyer_id INT REFERENCES lawyer_profiles(lawyer_id) ON DELETE CASCADE,
    reporting_frequency VARCHAR(20), -- Weekly / Monthly / Quarterly
    authority VARCHAR(150),
    last_submitted DATE
);

CREATE TABLE compliance_issues (
    issue_id SERIAL PRIMARY KEY,
    lawyer_id INT REFERENCES lawyer_profiles(lawyer_id) ON DELETE CASCADE,
    issue_type VARCHAR(100), -- Reporting delay, Staff retention
    description TEXT
);


CREATE TABLE profile_update_history (
    history_id SERIAL PRIMARY KEY,
    lawyer_id INT REFERENCES lawyer_profiles(lawyer_id) ON DELETE CASCADE,
    updated_by INT REFERENCES users(user_id),
    update_description TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_lawyer_name ON lawyer_profiles(name);
CREATE INDEX idx_region ON locations(region);
CREATE INDEX idx_area_of_law ON areas_of_law(area_name);
CREATE INDEX idx_service_name ON services(service_name);
