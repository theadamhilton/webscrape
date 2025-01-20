<?php
require 'vendor/autoload.php';

use Dotenv\Dotenv;

// Load .env variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database connection details
$servername = $_ENV['DB_HOST'];
$username = $_ENV['DB_USER'];
$password = $_ENV['DB_PASS'];
$dbname = $_ENV['DB_NAME'];

// Create connection
$link = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($link->connect_error) {
    die("Connection failed: " . $link->connect_error);
}

// Run the Puppeteer script
shell_exec('node scrape_yellow_pages.js');

// Read the JSON file
if (file_exists('yellow_pages_data.json')) {
	$json_data = file_get_contents('yellow_pages_data.json');
	$data = json_decode($json_data, true);
	if (json_last_error() !== JSON_ERROR_NONE) { // Ensure $data variable is correctly populated
		die("Error decoding JSON: " . json_last_error_msg());
	}
} else {
	die("Error: JSON file not found.");
}

// Display the data (optional)
/* echo "<pre>";
print_r($data);
echo "</pre>"; */

$allowedLocations = ['New York', 'Los Angeles', 'San Francisco', 'Chicago'];
$otherPartition = 'other';

// Batch insert data into the database
$batchSize = 100; // Number of rows per batch
$values = [];
foreach ($data as $index => $business) {
    $business_name = isset($business['name']) ? $link->real_escape_string($business['name']) : '';
    $street_address = isset($business['address']) ? $link->real_escape_string($business['address']) : '';
    $owner_name = isset($business['owner']) ? $link->real_escape_string($business['owner']) : '';
    $phone_number = isset($business['phone']) ? $link->real_escape_string($business['phone']) : '';
    $website = isset($business['website']) ? $link->real_escape_string($business['website']) : '';
    $industry = isset($business['industry']) ? $link->real_escape_string($business['industry']) : '';
    
	// Extract location from address
	$address_parts = explode(', ', $street_address);
	$location = end($address_parts); // Get the last part of the address
	
	// Ensure the location value is trimmed and clean 
	$location = trim($location); 
	
	// Debugging: Log the location values 
	// echo "Location: $location\n";
	
	// If the location is not in the allowed list, set locationPartition to 'other'
	$locationPartition = in_array($location, $allowedLocations) ? $location : $otherPartition;
	
	// Debugging: Log the locationPartition values 
	// echo "Location Partition: $locationPartition\n";
	
	$values[] = "('$business_name', '$street_address', '$owner_name', '$phone_number', '$website', '$industry', '$locationPartition')";
    
	// Insert batch when the batch size is reached or when it's the last row
	if (($index + 1) % $batchSize === 0 || $index + 1 === count($data)) {
		$sql = "INSERT INTO yellow_pages (business_name, street_address, owner_name, phone_number, website, industry, location) VALUES " . implode(", ", $values);
		if (!$link->query($sql)) {
			die("Error inserting batch: " . $link->error);
		}
		// Reset values for the next batch
		$values = [];
	}
}

echo "Data inserted successfully";

$link->close();
?>