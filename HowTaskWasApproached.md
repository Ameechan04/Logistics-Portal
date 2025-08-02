## Architecture Decisions 
Flask API was chosen for the backend as it is a lightweight framework, perfect for this project which had relatively simple endpoints and business logic. Flask allowed for rapid development and testing compared to a more in-depth framework such as Django, which suffers from a larger overhead.
Client-side, the native fetch API was used as it allowed the program to make asynchronous requests to the back end, which was used to prevent UI-blocking as the request waits to be completed and allows parallel requests so that several API responses can be handled as they come in. External libraries such as Axios were avoided to keep the front-end bundle size smaller and to take advantage of standard features found on modern browsers.
Many design decisions were made with consideration for future expansion to the database in mind, such as dynamically fetching the unique carriers for the filters, so manually modifying the front-end is not necessary. The backend is also designed to already adjust for database changes, aside from column names changing in the database.

## Challenges Faced
The Cosmos Data Management Tool was unable to upload and convert the CSV file onto the Cosmos DB, so I wrote a python script to manually upload the file (import_data.py). 
Managing the asynchronous API calls was another challenge. Initially, the front-end would render before all the data was fetched, leading to a blank page. The solution was to use async/await with Promise.all() to ensure all necessary data was loaded concurrently before the component rendered, providing a better user experience.
I also had to manage state between different components, which proved difficult. I implemented a simple React Context to handle global state, which avoided prop drilling and made the codebase more manageable.
Making the filters work required a complete rework of the backend code, where the specialised API calls were replaced with customisable SQL queries which changed depending on the filters selected, allowing much greater functionality on the front-end.

## Production Scenario Improvements
In a production environment, I would add rate limiting to the API endpoints to prevent abuse and brute-force attacks.
I would also add more protection in the backend to prevent any potential SQL injection attacks from bad actors modifying the JavaScript front-end.
I would also move from the React development server to a dedicated build server allowing multiple users to access the site at once and increase performance speeds. Since the server has unpredictable traffic, I would use a pay-per-use server such as AWS Fargate, which would prove cheaper than a continuously running server (until traffic is able to be predicted).
For better performance, I'd implement a caching strategy using a service such as Redis to cache frequently requested data. This would drastically reduce the database load and the API response time. I'd also use a CDN (Content Delivery Network) like Cloudflare for static assets such as page structure to reduce latency for users worldwide.



