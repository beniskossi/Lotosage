# **App Name**: Loto Stats Predictor

## Core Features:

- Draw Results Display: Display lottery draw results, including the date, winning numbers, and machine numbers, fetched from the provided API (https://lotobonheur.ci/resultats) using web scraping (axios and date-fns libraries).
- Statistical Analysis: Present statistics on number frequency, highlighting the most and least frequent numbers for each draw category.
- AI-Powered Predictions: Employ a tool powered by generative AI to analyze historical draw data and provide intelligent predictions for future draws using a Recurrent Neural Network (RNN-LSTM) model. Note: Implementation is not part of the MVP
- Number Frequency Consultation: Provide a user-friendly interface for users to select a number and consult its frequency of appearance with other numbers within the same draw or with numbers in the subsequent draw.
- Local Data Management with Offline Functionality: Implement a system to store draw data locally using IndexedDB, allowing the application to function offline with cached data, and provide manual and automatic updates for new draw results.

## Style Guidelines:

- Implement a responsive design that adapts seamlessly to both mobile and desktop devices.
- Ball colors: 1-9 = white, 10-19 = blue, 20-29 = orange, 30-39 = green, 40-49 = yellow, 50-59 = pink, 60-69 = indigo, 70-79 = brown, 80-90 = red.
- Incorporate clear and intuitive icons to represent different functions and data points throughout the application.
- Add subtle transitions and animations to improve user engagement and provide feedback during data loading and interactions.
- Accent color: Use a vibrant teal (#008080) to highlight key interactive elements and calls to action.