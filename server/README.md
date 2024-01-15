# Back-end server for codam-web-greeter
The back-end server provides data for the greeter to display, such as events and exams on [42's Intranet](https://intra.42.fr/).


## Running the server
### In production
1. Install docker
2. Set up SSL certificates in `./configs/certs` (`codam-web-greeter-server.crt` and `codam-web-greeter-server.key`)
3. Set up `.env` file (see `.env.example`)
4. Create a `messages.json` file with at least the following JSON content:
```json
{}
```
5. Run `docker compose up -d` in the root of this repository
6. The server should now be running on port 443 (and 80, which redirects to 443)


### In development
1. Install node.js & npm
2. Set up `.env` file (see `.env.example`)
3. Create a `messages.json` file with at least the following JSON content:
```json
{}
```
4. Run `npm install` in this directory
5. Run `npm run build` in this directory
6. Run `npm run start` in this directory
7. The server should now be running on port 3000


## API
### `/api/config/:hostname?`
Request data to be displayed by the greeter for the given hostname. If no hostname is given, the IP address from the request is parsed and used instead (if possible).

> The exams key lists all future exams at the campus. The exams_for_host key lists only the exams the requested host is affected by (based on hostname/IP). When an exams_for_host key is present, the greeter will go into exam mode during the exam period.

#### Example return value
```json
{
	"hostname": "f0r4s5.codam.nl",
	"events": [
		{
			"id": 19721,
			"name": "BOCAL STAND-UP",
			"description": "Find out what is going on at Codam and what is coming up next week.",
			"location": "Auditorium",
			"kind": "event",
			"max_people": null,
			"nbr_subscribers": 0,
			"begin_at": "2023-11-20T15:00:00.000Z",
			"end_at": "2023-11-20T16:00:00.000Z",
			"campus_ids": [
				14
			],
			"cursus_ids": [
				21
			],
			"created_at": "2023-10-31T09:41:22.425Z",
			"updated_at": "2023-10-31T09:41:22.436Z"
		},
		...
	],
	"exams": [
		{
			"cursus": [
				{
					"id": 21,
					"name": "42cursus",
					"slug": "42cursus"
				}
			],
			"projects": [
				{
					"id": 1320,
					"name": "Exam Rank 02",
					"slug": "exam-rank-02"
				},
				{
					"id": 1321,
					"name": "Exam Rank 03",
					"slug": "exam-rank-03"
				},
				{
					"id": 1322,
					"name": "Exam Rank 04",
					"slug": "exam-rank-04"
				},
				{
					"id": 1323,
					"name": "Exam Rank 05",
					"slug": "exam-rank-05"
				},
				{
					"id": 1324,
					"name": "Exam Rank 06",
					"slug": "exam-rank-06"
				}
			],
			"id": 15191,
			"ip_range": [
				"10.10.4.0/24",
				"10.10.5.0/24",
				"10.10.6.0/24"
			],
			"begin_at": "2023-11-24T12:00:00.000Z",
			"end_at": "2023-11-24T15:00:00.000Z",
			"location": "f0",
			"max_people": 60,
			"nbr_subscribers": 11,
			"name": "Codam Exam",
			"created_at": "2023-10-24T13:02:56.047Z",
			"updated_at": "2023-11-15T14:56:06.920Z"
		},
		...
	],
	"exams_for_host": [
		{
			"id": 15191,
			"name": "Codam Exam",
			"begin_at": "2023-11-24T12:00:00.000Z",
			"end_at": "2023-11-24T15:00:00.000Z"
		},
		...
	],
	"fetch_time": "2023-11-15T15:39:52.062Z",
	"message": "A custom message to display on the login screen\nIt supports *bold* and _italic_ text",
}
```
