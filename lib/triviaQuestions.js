// lib/triviaQuestions.js
// Small local trivia question bank so commands/trivia.js works with
// zero API keys and zero external dependencies. Each question has one
// correct answer plus three plausible wrong ones, shuffled at use time
// by commands/trivia.js.

module.exports = [
  { question: 'What is the capital of Japan?', answer: 'Tokyo', wrong: ['Osaka', 'Kyoto', 'Seoul'] },
  { question: 'How many continents are there on Earth?', answer: '7', wrong: ['5', '6', '8'] },
  { question: 'What is the largest planet in our solar system?', answer: 'Jupiter', wrong: ['Saturn', 'Neptune', 'Earth'] },
  { question: 'Who wrote "Romeo and Juliet"?', answer: 'William Shakespeare', wrong: ['Charles Dickens', 'Mark Twain', 'Jane Austen'] },
  { question: 'What is the chemical symbol for gold?', answer: 'Au', wrong: ['Ag', 'Gd', 'Go'] },
  { question: 'Which ocean is the largest?', answer: 'Pacific', wrong: ['Atlantic', 'Indian', 'Arctic'] },
  { question: 'How many legs does a spider have?', answer: '8', wrong: ['6', '10', '4'] },
  { question: 'What is the smallest prime number?', answer: '2', wrong: ['0', '1', '3'] },
  { question: 'What programming language is Node.js built on?', answer: 'JavaScript', wrong: ['Python', 'Ruby', 'Java'] },
  { question: 'What year did the Titanic sink?', answer: '1912', wrong: ['1905', '1920', '1898'] },
  { question: 'Which country invented paper?', answer: 'China', wrong: ['Egypt', 'Greece', 'India'] },
  { question: 'What gas do plants primarily absorb from the atmosphere?', answer: 'Carbon Dioxide', wrong: ['Oxygen', 'Nitrogen', 'Hydrogen'] },
  { question: 'What is the hardest natural substance on Earth?', answer: 'Diamond', wrong: ['Gold', 'Quartz', 'Iron'] },
  { question: 'How many strings does a standard guitar have?', answer: '6', wrong: ['4', '5', '7'] },
  { question: 'What is the currency of Japan?', answer: 'Yen', wrong: ['Won', 'Yuan', 'Ringgit'] },
  { question: 'Which planet is known as the Red Planet?', answer: 'Mars', wrong: ['Venus', 'Mercury', 'Jupiter'] },
  { question: 'What is the tallest mountain in the world?', answer: 'Mount Everest', wrong: ['K2', 'Kilimanjaro', 'Denali'] },
  { question: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci', wrong: ['Pablo Picasso', 'Vincent van Gogh', 'Michelangelo'] },
  { question: 'What is the boiling point of water in Celsius?', answer: '100', wrong: ['90', '110', '212'] },
  { question: 'Which animal is known as the "King of the Jungle"?', answer: 'Lion', wrong: ['Tiger', 'Elephant', 'Gorilla'] },
];
