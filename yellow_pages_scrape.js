const puppeteer = require('puppeteer');
const fs = require('fs'); // Include the file system module to write the JSON file

// List of proxies to distribute requests across multiple IP addresses to avoid bans
const proxies = [ 'http://123.456.78.90:8080', 'http://234.567.89.01:3128', 'http://345.678.90.12:8000', // Add more proxies as needed ];

// Function to get a random proxy
function getRandomProxy() {
	return proxies[Math.floor(Math.random() * proxies.length)];
}

function formatIndustry(industryString) {
	return industryString ? industryString.replace(/([a-z])([A-Z])/g, '$1, $2') : null;
}

function formatAddress(address, cityFromSite, cityFromSearch) {
	if (address) {
		// Use the cityFromSite if it matched the cityFromSearch, otherwise use the cityFromSearch
		const city = cityFromSite.includes(cityFromSearch) ? cityFromSite : cityFromSearch;
		return `${address}, ${city}`;
	} else {
		return cityFromSearch;
	}
	
}	

(async () => {
    const searchTerms = ['roofers']; // Add your search terms here
    const locations = ['Los Angeles', 'Atlantic City'];
    const allData = [];
	
	const randomProxy = getRandomProxy();
    const browser = await puppeteer.launch({
		args: [`--proxy-server=${randomProxy.url}`]
	});
    const page = await browser.newPage();
	
	// Authenticate with proxy
	await page.authenticate({
		username: randomProxy.username,
		password: randomProxy.password
	});
	
	// Rotating user agents to mimic real user behavior
	const userAgents = [
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.110 Safari/537.36',
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0', 
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
	];
	
	// Function to get a random user agent
	function getRandomUserAgent() {
		return userAgents[Math.floor(Math.random() * userAgents.length)];
	}
	
	for (const location of locations) {
		for (const term of searchTerms) {
			const url = `https://www.yellowpages.com/search?search_terms=${term}&geo_location_terms=${location}`;
			await page.setUserAgent(getRandomUserAgent());
			await page.goto(url, { waitUntil: 'networkidle2' });

			const data = await page.evaluate((location) => {
				function formatIndustry(industryString) {
					return industryString ? industryString.replace(/([a-z])([A-Z])/g, '$1, $2') : null;
				}

				function formatAddress(address, cityFromSite, cityFromSearch) {
					if (address) {
						// Use the cityFromSite if it matches the cityFromSearch, otherwise use the cityFromSearch
						const city = cityFromSite.includes(cityFromSearch) ? cityFromSite : cityFromSearch;
						return `${address}, ${city}`;
					} else {
						return cityFromSearch;
					}
				}
				
				const businesses = [];
				const elements = document.querySelectorAll('.info');
				elements.forEach(element => {
					const name = element.querySelector('.business-name').innerText;
					let address = element.querySelector('.street-address') ? element.querySelector('.street-address').innerText : null;
					const cityFromSite = element.querySelector('.locality') ? element.querySelector('.locality').innerText : ''; // Extract city from site
					address = formatAddress(address, cityFromSite, location); // Format address with location
					const owner = element.querySelector('.owner-name') ? element.querySelector('.owner-name').innerText : null;
					const phone = element.querySelector('.phone') ? element.querySelector('.phone').innerText : null;
					const website = element.querySelector('.links a') ? element.querySelector('.links a').href : null;
					let industry = element.querySelector('.categories') ? element.querySelector('.categories').innerText : null;
					industry = formatIndustry(industry); // Format industry with commas
					businesses.push({ name, address, owner, phone, website, industry });
				});
				return businesses;
			}, location);

			allData.push(...data);
		}
	}

    console.log(JSON.stringify(allData, null, 2));

    // Save the data to a JSON file
    fs.writeFileSync('yellow_pages_data.json', JSON.stringify(allData, null, 2), 'utf-8');
	 
	await browser.close();
})();