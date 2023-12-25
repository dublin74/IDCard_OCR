# IDCard_OCR

## Overview

This project is an Optical Character Recognition (OCR) application designed to recognize Thai ID cards and extract relevant information. The app integrates with the Google Vision API for OCR processing, parses the response using regex patterns, and saves the results in a database. Additionally, it provides a user interface for uploading ID card images, viewing OCR results, and performing CRUD operations like creating, viewing, updating, and deleting.

## Requirements

- EJS
- Node.js
- Express.js
- MongoDB 
- Google Vision API 

## Setup

1. Clone the repository:

   ```git clone https://github.com/dublin74/IDCard_OCR.git```

2. Install dependencies:
   
    ```npm install```

3. Configure Google Vision API and Set Up Credentials

To use the Google Vision API for OCR processing, you must set up a project on the Google Cloud Platform (GCP) and obtain API credentials. Follow these steps:

##### Step 1: Create a Google Cloud Platform (GCP) Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown in the top bar, then click on "New Project."
3. Enter a name for your project and click "Create."
4. Ensure the new project is selected in the project dropdown.

##### Step 2: Enable the Google Vision API

1. In the Google Cloud Console, navigate to the "APIs & Services" > "Dashboard."
2. Click on "+ ENABLE APIS AND SERVICES" at the top.
3. Search for "Vision API" and select it.
4. Click "Enable" to enable the Vision API for your project.
5. In order to use Vision API, you need credentials and a billing account.

##### Step 3: Create Service Account Key

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials."
2. Click on "Create credentials" and select "Service account key."
3. Choose or create a service account, set the role to "Project" > "Editor," and click "Continue."
4. Click on "Create key," choose JSON as the key type, and click "Create."
5. Save the JSON key file securely. This file will be used as your API credentials.
6. Don't forget to activate billing on your account, else you will be provided with an error

##### Step 4: Set Environment Variable

Create a .env in the repo, and in the env, enter the following.

```
MONGODB_URL = "Enter you mongodb connection URL"
GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY = "Enter your private_key from json file you got above, make sure to encode it in base64 format"
GOOGLE_APPLICATION_CREDENTIALS_CLIENT_EMAIL = "Enter your client_email from the json file you got above"
GOOGLE_APPLICATION_CREDENTIALS_CLIENT_ID = "Enter your client_id from the json file you got above"
```

## Usage

1. Start the application:

    ```npm start```
   
2. Open your browser and visit ```http://localhost:3000```.


## API Endpoints

1. GET ```/users```:  Fetch all OCR records.
2. POST ```/users```: Creates a new OCR record, shows an alert if the identification number is already present in the database, and shows individual error messages for each field, if any.
3. GET ```/users/:id```: Retrieve OCR record by ID, identification number(do not forget to put spaces in between), name, and last name, similar show alert message if any.
4. PATCH ```/users/:id```: Partially update OCR record by ID. 
5. DELETE ```/users/:id```: Delete OCR record by ID, "deleted" property of the record which by default is "false" is toggled "true".


## Hosting

The live link of the project is https://thaiidcardocr.onrender.com/.


