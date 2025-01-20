CREATE TABLE yellow_pages (
    id INT AUTO_INCREMENT,
    business_name VARCHAR(255),
    street_address VARCHAR(255),
    owner_name VARCHAR(255),
    phone_number VARCHAR(20),
    website VARCHAR(255),
    industry VARCHAR(255),
    email_address VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255), -- Location column (e.g., city)
    PRIMARY KEY (id, location)
)
PARTITION BY LIST COLUMNS (location) (
    PARTITION p_ny VALUES IN ('New York'),
    PARTITION p_la VALUES IN ('Los Angeles'),
    PARTITION p_sf VALUES IN ('San Francisco'),
    PARTITION p_ch VALUES IN ('Chicago'),
    PARTITION p_other VALUES IN ('other') -- Partition for unspecified locations
);