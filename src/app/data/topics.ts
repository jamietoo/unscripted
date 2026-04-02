export interface Topic {
  id: string;
  text: string;
  category: string;
}

export const topics: Topic[] = [
  // Personal
  { id: "1", text: "Describe a childhood memory that shaped who you are today", category: "personal" },
  { id: "2", text: "Talk about a fear you've overcome", category: "personal" },
  { id: "3", text: "What's the best advice you've ever received?", category: "personal" },
  { id: "4", text: "Describe your ideal weekend", category: "personal" },
  { id: "5", text: "Talk about a hobby that brings you joy", category: "personal" },
  { id: "6", text: "What's a skill you're proud of learning?", category: "personal" },
  { id: "7", text: "Describe your morning routine and why it works for you", category: "personal" },
  { id: "8", text: "What's your favorite way to relax after a long day?", category: "personal" },
  
  // Opinion
  { id: "9", text: "Should social media be regulated by governments?", category: "opinion" },
  { id: "10", text: "Is remote work better than office work?", category: "opinion" },
  { id: "11", text: "Should artificial intelligence replace human jobs?", category: "opinion" },
  { id: "12", text: "Is modern society too dependent on technology?", category: "opinion" },
  { id: "13", text: "Should college education be free for everyone?", category: "opinion" },
  { id: "14", text: "Is privacy more important than security?", category: "opinion" },
  { id: "15", text: "Should we ban single-use plastics globally?", category: "opinion" },
  { id: "16", text: "Are electric cars the future of transportation?", category: "opinion" },
  
  // Story Telling
  { id: "17", text: "Tell a story about a time you helped a stranger", category: "storytelling" },
  { id: "18", text: "Describe the most memorable vacation you've taken", category: "storytelling" },
  { id: "19", text: "Tell about a time when something didn't go as planned", category: "storytelling" },
  { id: "20", text: "Share a story about an unexpected friendship", category: "storytelling" },
  { id: "21", text: "Describe a moment that made you laugh uncontrollably", category: "storytelling" },
  { id: "22", text: "Tell about a time you stepped out of your comfort zone", category: "storytelling" },
  { id: "23", text: "Share a story about learning something the hard way", category: "storytelling" },
  { id: "24", text: "Describe a memorable encounter with nature", category: "storytelling" },
  
  // Professional
  { id: "25", text: "What makes a good leader?", category: "professional" },
  { id: "26", text: "How do you handle conflict in the workplace?", category: "professional" },
  { id: "27", text: "Describe your approach to time management", category: "professional" },
  { id: "28", text: "What's the most important skill in your field?", category: "professional" },
  { id: "29", text: "How do you stay motivated at work?", category: "professional" },
  { id: "30", text: "What does work-life balance mean to you?", category: "professional" },
  { id: "31", text: "How do you handle failure in a professional setting?", category: "professional" },
  { id: "32", text: "What's your approach to giving and receiving feedback?", category: "professional" },
  
  // Abstract
  { id: "33", text: "What gives life meaning?", category: "abstract" },
  { id: "34", text: "How do you define success?", category: "abstract" },
  { id: "35", text: "What would you do if you knew you couldn't fail?", category: "abstract" },
  { id: "36", text: "How do our past experiences shape who we become?", category: "abstract" },
  { id: "37", text: "What does it mean to live authentically?", category: "abstract" },
  { id: "38", text: "How can we find balance in a chaotic world?", category: "abstract" },
  { id: "39", text: "What legacy do you want to leave behind?", category: "abstract" },
  { id: "40", text: "How do we overcome fear and embrace change?", category: "abstract" },
  
  // Random (mix of fun/quirky topics)
  { id: "41", text: "If you could have dinner with any historical figure, who and why?", category: "random" },
  { id: "42", text: "What superpower would you choose and how would you use it?", category: "random" },
  { id: "43", text: "Describe your perfect meal from appetizer to dessert", category: "random" },
  { id: "44", text: "If you could live in any time period, which would you choose?", category: "random" },
  { id: "45", text: "What three items would you bring to a desert island?", category: "random" },
  { id: "46", text: "If you could master any instrument instantly, which would it be?", category: "random" },
  { id: "47", text: "What would your perfect day look like from start to finish?", category: "random" },
  { id: "48", text: "If you could switch lives with anyone for a day, who would it be?", category: "random" },
];

export const categories = [
  { id: "all", label: "All Topics" },
  { id: "personal", label: "Personal" },
  { id: "opinion", label: "Opinion" },
  { id: "storytelling", label: "Story Telling" },
  { id: "professional", label: "Professional" },
  { id: "abstract", label: "Abstract" },
  { id: "random", label: "Random" },
];